import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useApiClient } from '@/lib/api-client';
import type { ChatRoom, Message, PaginatedResponse } from '@/types';

export function useChatRooms() {
  const apiClient = useApiClient();
  const { data: session } = useSession();
  
  const { data: chatRooms, isLoading, error } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => apiClient.get<PaginatedResponse<ChatRoom>>('/chat-rooms/'),
    enabled: !!session?.accessToken, // Only run when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes for chat room list
    refetchOnWindowFocus: false, // Reduce API calls
    refetchInterval: false, // Disable automatic refetching
    retry: 1, // Only retry once
  });
  
  return {
    chatRooms: chatRooms?.results || [],
    isLoading,
    error
  };
}

export function useCreateChatRoom() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; room_type: string; participant_ids?: number[] }) =>
      apiClient.post<ChatRoom>('/chat-rooms/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }
  });
}

export function useChatMessages(roomId: number | null) {
  const apiClient = useApiClient();
  const { data: session } = useSession();
  
  const { data: messagesData, isLoading, error } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => apiClient.get<PaginatedResponse<Message>>(`/chat-rooms/${roomId}/messages/?page_size=100`),
    enabled: !!roomId && !!session?.accessToken, // Only run when authenticated and room selected
    staleTime: 30 * 1000, // 30 seconds for messages
    refetchOnWindowFocus: false, // Reduce API calls
    refetchOnReconnect: false, // Disable reconnect refetch
    refetchInterval: false, // Disable automatic refetching
    retry: 1, // Only retry once
  });
  
  return {
    messages: messagesData?.results || [],
    messagesData,
    isLoading,
    error
  };
}

export function useSendMessage(roomId: number | null) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [pendingMessages, setPendingMessages] = useState<Map<string, {
    tempId: string;
    content: string;
    status: 'sending' | 'sent' | 'failed';
    timestamp: Date;
  }>>(new Map());
  
  const addPendingMessage = useCallback((content: string) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setPendingMessages(prev => new Map(prev.set(tempId, {
      tempId,
      content,
      status: 'sending',
      timestamp: new Date()
    })));
    return tempId;
  }, []);
  
  const updateMessageStatus = useCallback((tempId: string, status: 'sent' | 'failed') => {
    setPendingMessages(prev => {
      const updated = new Map(prev);
      const message = updated.get(tempId);
      if (message) {
        updated.set(tempId, { ...message, status });
      }
      return updated;
    });
  }, []);
  
  const removePendingMessage = useCallback((tempId: string) => {
    setPendingMessages(prev => {
      const updated = new Map(prev);
      updated.delete(tempId);
      return updated;
    });
  }, []);
  
  const mutation = useMutation({
    mutationFn: async ({ content, tempId }: { content: string; tempId: string }) => {
      try {
        const result = await apiClient.post<Message>(`/chat-rooms/${roomId}/send_message/`, { content });
        updateMessageStatus(tempId, 'sent');
        
        // Remove pending message after a short delay to show "sent" status
        setTimeout(() => removePendingMessage(tempId), 1000);
        
        return result;
      } catch (error) {
        updateMessageStatus(tempId, 'failed');
        throw error;
      }
    },
    onSuccess: () => {
      // Add a small delay before refetching to prevent rapid API calls
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
      }, 100);
    }
  });
  
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }
    const tempId = addPendingMessage(content);
    return mutation.mutateAsync({ content, tempId });
  }, [addPendingMessage, mutation, session?.accessToken]);
  
  const retryMessage = useCallback(async (tempId: string) => {
    const message = pendingMessages.get(tempId);
    if (message && message.status === 'failed') {
      // Reset to sending status by recreating the pending message
      setPendingMessages(prev => new Map(prev.set(tempId, {
        ...message,
        status: 'sending'
      })));
      return mutation.mutateAsync({ content: message.content, tempId });
    }
  }, [pendingMessages, mutation]);
  
  return {
    sendMessage,
    retryMessage,
    removePendingMessage,
    pendingMessages: Array.from(pendingMessages.values()),
    isPending: mutation.isPending
  };
}

export function useMarkMessagesRead(roomId: number | null) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  
  return useMutation({
    mutationFn: (lastReadMessageId?: number) => {
      if (!session?.accessToken) {
        return Promise.reject(new Error('Not authenticated'));
      }
      return apiClient.post(`/chat-rooms/${roomId}/mark_read/`, { 
        last_read_message_id: lastReadMessageId 
      });
    },
    onSuccess: () => {
      // Only invalidate if we have a valid session
      if (session?.accessToken) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        }, 1000);
      }
    },
    retry: false, // Don't retry mark as read operations
  });
}

export function useWebSocketNotifications(roomId: number | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  const maxRetries = 3; // Reduce from 5 to 3
  const retryDelays = [2000, 5000, 10000]; // Slower exponential backoff
  
  useEffect(() => {
    if (!roomId || !session?.accessToken) return;
    
    const token = session.accessToken;
    
    // Verificar si el token está expirado
    const isTokenExpired = (() => {
      if (!token) return true;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convertir a milisegundos
        return Date.now() >= expirationTime;
      } catch (error) {
        console.error('❌ [CHAT DEBUG] Error parsing JWT token:', error);
        return true;
      }
    })();
    
    if (isTokenExpired) {
      console.error('❌ [CHAT DEBUG] JWT token is expired or invalid');
      setLastError('Authentication token expired');
      return;
    }
    
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isManuallyClosing = false;
    
    console.log('🔑 [CHAT DEBUG] JWT token found:', token ? 'Yes' : 'No');
    console.log('🔑 [CHAT DEBUG] Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'None');
    console.log('🔑 [CHAT DEBUG] Session data:', session ? 'Available' : 'None');
    
    const getWebSocketUrl = () => {
      if (typeof window === 'undefined') return 'ws://localhost:8000';
      
      const hostname = window.location.hostname;
      const port = window.location.port;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      console.log('🔍 [CHAT DEBUG] Environment detection:', {
        hostname,
        port,
        protocol: window.location.protocol,
        fullUrl: window.location.href
      });
      
      // For localhost development - always use direct backend connection
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const wsUrl = `ws://localhost:8000/ws/chat/room/${roomId}/?token=${encodeURIComponent(token)}`;
        console.log('🔍 [CHAT DEBUG] Using direct backend connection');
        return wsUrl;
      }
      
      // For production/EC2 - use nginx proxy
      if (hostname === '52.20.22.173') {
        const wsUrl = `ws://52.20.22.173/ws/chat/room/${roomId}/?token=${encodeURIComponent(token)}`;
        console.log('🔍 [CHAT DEBUG] Using nginx proxy connection');
        return wsUrl;
      }
      
      // Fallback
      return `${protocol}//${hostname}/ws/chat/room/${roomId}/?token=${encodeURIComponent(token)}`;
    };
    
    const connect = () => {
      // Enhanced token validation
      if (!token || token.length < 10) {
        console.error('❌ [CHAT DEBUG] Invalid token provided');
        setLastError('Invalid authentication token');
        return;
      }

      const wsUrl = getWebSocketUrl();
      
      console.log('🔍 [CHAT DEBUG] Room ID:', roomId);
      console.log('🔍 [CHAT DEBUG] Token available:', !!token);
      console.log('🔍 [CHAT DEBUG] Token length:', token ? token.length : 0);
      console.log('🔍 [CHAT DEBUG] Token format valid:', token.includes('.') && token.split('.').length === 3);
      
      // Test API connection first
      fetch(`http://localhost:8000/api/chat-rooms/${roomId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).then(response => {
        console.log('🧪 [CHAT DEBUG] API test response:', response.status, response.statusText);
        if (!response.ok) {
          console.error('🧪 [CHAT DEBUG] API test failed with status:', response.status);
        }
      }).catch(error => {
        console.error('🧪 [CHAT DEBUG] API test failed:', error.message);
      });
      
      try {
        console.log(`🔌 [CHAT DEBUG] Connecting to WebSocket (attempt ${connectionAttempts + 1}):`, wsUrl.replace(token, '[TOKEN]'));
        
        // Create WebSocket with proper error handling
        ws = new WebSocket(wsUrl);
        
        // Add connection state logging
        console.log(`🔌 [CHAT DEBUG] WebSocket created, readyState: ${ws.readyState} (CONNECTING)`);
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (ws && ws.readyState === WebSocket.CONNECTING) {
            console.error('⏰ [CHAT DEBUG] WebSocket connection timeout after 10 seconds');
            ws.close();
            setIsConnected(false);
            setLastError('Connection timeout - server may be unreachable');
          }
        }, 10000);
        
        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          setIsConnected(true);
          setConnectionAttempts(0);
          setLastError(null);
          console.log('✅ [CHAT DEBUG] WebSocket connected to room', roomId);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 [CHAT DEBUG] Received WebSocket message:', data);
            
            if (data.type === 'new_message') {
              // Only invalidate if the message is from another user (reduce API calls)
              if (data.data && data.data.sender !== 1) { // Replace with actual current user ID
                // Use a debounced approach to prevent excessive API calls
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
                }, 500);
              }
            }
            
            setNotifications(prev => [...prev, data]);
          } catch (parseError) {
            console.error('❌ [CHAT DEBUG] Failed to parse WebSocket message:', parseError);
          }
        };
        
        ws.onclose = (event) => {
          setIsConnected(false);
          console.log('🔌 [CHAT DEBUG] WebSocket disconnected:', event.code, event.reason);
          console.log('🔌 [CHAT DEBUG] Close event details:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          // Interpretar códigos de cierre
          let errorMessage = 'Connection closed';
          switch (event.code) {
            case 1000:
              errorMessage = 'Normal closure';
              break;
            case 1001:
              errorMessage = 'Going away';
              break;
            case 1002:
              errorMessage = 'Protocol error';
              break;
            case 1003:
              errorMessage = 'Unsupported data';
              break;
            case 1006:
              errorMessage = 'Abnormal closure';
              break;
            case 1011:
              errorMessage = 'Server error';
              break;
            case 1012:
              errorMessage = 'Service restart';
              break;
            case 1013:
              errorMessage = 'Try again later';
              break;
            case 1014:
              errorMessage = 'Bad gateway';
              break;
            case 1015:
              errorMessage = 'TLS handshake failed';
              break;
            default:
              errorMessage = `Connection closed with code ${event.code}`;
          }
          
          if (!isManuallyClosing) {
            // Attempt reconnection unless we've exceeded max retries
            if (connectionAttempts < maxRetries) {
              const delay = retryDelays[connectionAttempts] || retryDelays[retryDelays.length - 1];
              console.log(`🔄 [CHAT DEBUG] Scheduling reconnection in ${delay}ms (attempt ${connectionAttempts + 1}/${maxRetries})`);
              
              reconnectTimer = setTimeout(() => {
                setConnectionAttempts(prev => prev + 1);
                connect();
              }, delay);
            } else {
              setLastError(`Failed to connect after ${maxRetries} attempts: ${errorMessage}`);
              console.error('❌ [CHAT DEBUG] Max reconnection attempts reached');
            }
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ [CHAT DEBUG] WebSocket error occurred');
          console.error('❌ [CHAT DEBUG] WebSocket readyState:', ws?.readyState);
          console.error('❌ [CHAT DEBUG] WebSocket URL was:', wsUrl.replace(token, '[TOKEN]'));
          console.error('❌ [CHAT DEBUG] Error details:', {
            type: error.type,
            target: error.target?.constructor?.name || 'WebSocket',
            isTrusted: error.isTrusted,
            timeStamp: error.timeStamp,
            readyStateText: ws?.readyState === 0 ? 'CONNECTING' : 
                           ws?.readyState === 1 ? 'OPEN' : 
                           ws?.readyState === 2 ? 'CLOSING' : 
                           ws?.readyState === 3 ? 'CLOSED' : 'UNKNOWN'
          });
          
          // Check for common WebSocket issues
          if (ws?.readyState === WebSocket.CLOSED) {
            console.error('❌ [CHAT DEBUG] Connection was immediately closed - possible CORS or authentication issue');
          }
          
          // Enhanced state debugging
          if (ws) {
            console.error('❌ [CHAT DEBUG] WebSocket state details:', {
              readyState: ws.readyState,
              url: ws.url?.replace(token, '[TOKEN]'),
              protocol: ws.protocol,
              extensions: ws.extensions,
              bufferedAmount: ws.bufferedAmount,
              binaryType: ws.binaryType
            });
          }
          
          setIsConnected(false);
          setLastError('WebSocket connection failed - check console for details');
        };
      } catch (error) {
        console.error('❌ [CHAT DEBUG] Failed to create WebSocket connection:', error);
        setLastError('Failed to create connection');
        setIsConnected(false);
      }
    };
    
    // Start initial connection
    connect();
    
    return () => {
      isManuallyClosing = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws) {
        console.log('🔌 [CHAT DEBUG] Manually closing WebSocket connection');
        ws.close();
      }
    };
  }, [roomId, session?.accessToken, queryClient]);
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  const retry = useCallback(() => {
    setConnectionAttempts(0);
    setLastError(null);
  }, []);
  
  return {
    isConnected,
    notifications,
    clearNotifications,
    connectionAttempts,
    lastError,
    retry
  };
}

export function useTypingIndicator(roomId: number | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // This would connect to room-specific WebSocket for typing indicators
  // For now, we'll implement a simple local state
  
  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      // In real implementation, this would send WebSocket message
    }
  }, [isTyping]);
  
  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      // In real implementation, this would send WebSocket message
    }
  }, [isTyping]);
  
  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping
  };
}