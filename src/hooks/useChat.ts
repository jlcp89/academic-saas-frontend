import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/lib/api-client';
import type { ChatRoom, Message, PaginatedResponse } from '@/types';

export function useChatRooms() {
  const apiClient = useApiClient();
  
  const { data: chatRooms, isLoading, error } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => apiClient.get<PaginatedResponse<ChatRoom>>('/chat-rooms/'),
    staleTime: 30 * 1000, // 30 seconds
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
  
  const { data: messagesData, isLoading, error } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => apiClient.get<PaginatedResponse<Message>>(`/chat-rooms/${roomId}/messages/`),
    enabled: !!roomId,
    staleTime: 30 * 1000, // 30 seconds
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
  
  return useMutation({
    mutationFn: (content: string) =>
      apiClient.post<Message>(`/chat-rooms/${roomId}/send_message/`, { content }),
    onSuccess: () => {
      // Invalidate messages to refetch
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      // Also invalidate chat rooms to update last message
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }
  });
}

export function useMarkMessagesRead(roomId: number | null) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (lastReadMessageId?: number) =>
      apiClient.post(`/chat-rooms/${roomId}/mark_read/`, { 
        last_read_message_id: lastReadMessageId 
      }),
    onSuccess: () => {
      // Invalidate chat rooms to update unread counts
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }
  });
}

export function useWebSocketNotifications() {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    // Environment-aware WebSocket URL configuration
    let wsUrl = '';
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Local development
      wsUrl = 'ws://localhost:8000/ws/chat/notifications/';
    } else if (hostname === '52.20.22.173') {
      // Dev environment - uses nginx proxy, still use backend port directly for WebSocket
      wsUrl = 'ws://52.20.22.173:8000/ws/chat/notifications/';
    } else {
      // Production fallback
      wsUrl = `ws://${window.location.host}/ws/chat/notifications/`;
    }
    
    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected to:', wsUrl);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        setNotifications(prev => [...prev, data]);
      };
      
      ws.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket disconnected:', event.code, event.reason);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);
  
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  return {
    isConnected,
    notifications,
    clearNotifications
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