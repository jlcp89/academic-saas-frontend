import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: Date;
  userId?: string;
  roomId?: string;
}

export interface WebSocketEvents {
  // User events
  'user:online': { userId: string; userData: Record<string, unknown> };
  'user:offline': { userId: string };
  'user:typing': { userId: string; roomId: string };
  
  // Notification events
  'notification:new': { 
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    userId: string;
  };
  
  // Dashboard events
  'dashboard:update': {
    type: 'stats' | 'chart' | 'activity';
    data: Record<string, unknown>;
  };
  
  // Assignment events
  'assignment:created': { assignmentId: string; assignment: Record<string, unknown> };
  'assignment:updated': { assignmentId: string; changes: Record<string, unknown> };
  'assignment:submitted': { submissionId: string; submission: Record<string, unknown> };
  'assignment:graded': { submissionId: string; grade: Record<string, unknown> };
  
  // School events
  'school:announcement': { schoolId: string; announcement: Record<string, unknown> };
  'school:updated': { schoolId: string; changes: Record<string, unknown> };
  
  // System events
  'system:maintenance': { message: string; scheduledAt: Date };
  'system:alert': { level: 'info' | 'warning' | 'error'; message: string };
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private userId: string | null = null;
  private accessToken: string | null = null;

  constructor() {
    // Bind methods to ensure correct context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.emit = this.emit.bind(this);
  }

  connect(userId: string, accessToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.userId = userId;
      this.accessToken = accessToken;

      // Determine WebSocket URL based on environment
      const wsUrl = this.getWebSocketUrl();

      this.socket = io(wsUrl, {
        auth: {
          token: accessToken,
          userId: userId,
        },
        transports: ['websocket'],
        upgrade: true,
        rememberUpgrade: true,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join user room for personal notifications
        this.socket?.emit('join:user', { userId });
        
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.isConnected = false;
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          return;
        }
        
        // Attempt to reconnect
        this.attemptReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        reject(error);
      });

      // Set up event forwarding
      this.setupEventForwarding();
    });
  }

  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:8000';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    
    // Development server (EC2) - uses nginx proxy
    if (hostname === '52.20.22.173') {
      return 'ws://52.20.22.173/ws';
    }
    
    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:8000/ws';
    }
    
    // Production or other environments
    return `${protocol}//${hostname}/ws`;
  }

  private setupEventForwarding(): void {
    if (!this.socket) return;

    // Forward all received events to registered listeners
    Object.keys(this.eventListeners).forEach(eventType => {
      this.socket?.on(eventType, (data: unknown) => {
        const listeners = this.eventListeners.get(eventType) || [];
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(`Error in WebSocket event listener for ${eventType}:`, error);
          }
        });
      });
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      if (this.userId && this.accessToken) {
        this.connect(this.userId, this.accessToken);
      }
    }, delay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.userId = null;
    this.accessToken = null;
  }

  subscribe<K extends keyof WebSocketEvents>(
    eventType: K,
    listener: (data: WebSocketEvents[K]) => void
  ): () => void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);

    // If socket is already connected, set up the listener
    if (this.socket) {
      this.socket.on(eventType, listener);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, listener);
  }

  unsubscribe<K extends keyof WebSocketEvents>(
    eventType: K,
    listener: (data: WebSocketEvents[K]) => void
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }

    if (this.socket) {
      this.socket.off(eventType, listener);
    }
  }

  emit<K extends keyof WebSocketEvents>(
    eventType: K,
    data: WebSocketEvents[K]
  ): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventType, data);
    } else {
      console.warn(`Cannot emit ${eventType}: WebSocket not connected`);
    }
  }

  // Room management
  joinRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:room', { roomId });
    }
  }

  leaveRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:room', { roomId });
    }
  }

  // User presence
  setOnlineStatus(status: 'online' | 'away' | 'busy' | 'offline'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('user:status', { status });
    }
  }

  // Typing indicators
  startTyping(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', { roomId });
    }
  }

  stopTyping(roomId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', { roomId });
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get socketId(): string | null {
    return this.socket?.id || null;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// React hook for using WebSocket in components
export function useWebSocket() {
  return {
    connect: webSocketService.connect,
    disconnect: webSocketService.disconnect,
    subscribe: webSocketService.subscribe,
    unsubscribe: webSocketService.unsubscribe,
    emit: webSocketService.emit,
    joinRoom: webSocketService.joinRoom,
    leaveRoom: webSocketService.leaveRoom,
    setOnlineStatus: webSocketService.setOnlineStatus,
    startTyping: webSocketService.startTyping,
    stopTyping: webSocketService.stopTyping,
    connected: webSocketService.connected,
    socketId: webSocketService.socketId,
  };
}