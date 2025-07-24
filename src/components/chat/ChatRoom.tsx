'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Users, Settings, MoreVertical, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatMessages, useSendMessage, useMarkMessagesRead, useTypingIndicator, useWebSocketNotifications } from '@/hooks/useChat';
import { Clock, AlertCircle, RotateCcw, X } from 'lucide-react';

interface ChatRoomProps {
  roomId: number;
  roomName: string;
  roomType: 'DIRECT' | 'GROUP' | 'CLASS' | 'ANNOUNCEMENT';
  onClose?: () => void;
}

interface MessageBubbleProps {
  message: {
    id: number;
    content: string;
    sender: number;
    sender_name: string;
    sender_role: string;
    created_at: string;
    is_edited: boolean;
    is_system_message: boolean;
  };
  isOwnMessage: boolean;
  currentUserId?: number;
}

interface PendingMessageBubbleProps {
  message: {
    tempId: string;
    content: string;
    status: 'sending' | 'sent' | 'failed';
    timestamp: Date;
  };
  onRetry: (tempId: string) => void;
  onRemove: (tempId: string) => void;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const messageTime = format(new Date(message.created_at), 'HH:mm');
  
  if (message.is_system_message) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-xs text-gray-600 font-medium shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 group w-full`}>
      <div className={`flex max-w-[80%] sm:max-w-[70%] min-w-0 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {!isOwnMessage && (
          <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
              {message.sender_name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col min-w-0 flex-1">
          {!isOwnMessage && (
            <div className="text-xs font-medium mb-1 text-gray-600 px-3 break-words">
              {message.sender_name}
              <Badge variant="secondary" className="ml-2 text-xs bg-gray-100 text-gray-700 border-0">
                {message.sender_role}
              </Badge>
            </div>
          )}
          
          <div className={`
            rounded-2xl px-4 py-3 min-w-0 break-words overflow-hidden shadow-sm transition-all duration-200 word-wrap
            ${isOwnMessage 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md hover:shadow-md'
            }
          `}>
            <div className="text-sm whitespace-pre-wrap break-words hyphens-auto leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {message.content}
            </div>
          </div>
          
          <div className={`text-xs mt-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity px-3 ${
            isOwnMessage ? 'text-right' : 'text-left'
          }`}>
            {messageTime}
            {message.is_edited && (
              <span className="ml-1 italic">(edited)</span>
            )}
          </div>
        </div>
        
        {isOwnMessage && (
          <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-white shadow-sm">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm font-semibold">
              You
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

function PendingMessageBubble({ message, onRetry, onRemove }: PendingMessageBubbleProps) {
  const messageTime = format(message.timestamp, 'HH:mm');
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <div className="text-green-400 text-xs">✓</div>;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return 'bg-gradient-to-r from-blue-400 to-blue-500';
      case 'sent':
        return 'bg-gradient-to-r from-green-400 to-green-500';
      case 'failed':
        return 'bg-gradient-to-r from-red-400 to-red-500';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };
  
  return (
    <div className="flex justify-end mb-3 group w-full">
      <div className="flex max-w-[80%] sm:max-w-[70%] min-w-0 flex-row-reverse items-end gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-white shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm font-semibold">
            You
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col min-w-0 flex-1">
          <div className={`
            rounded-2xl px-4 py-3 min-w-0 break-words overflow-hidden shadow-sm transition-all duration-200
            ${getStatusColor()} text-white rounded-br-md
            ${message.status === 'failed' ? 'opacity-75' : ''}
          `}>
            <div className="text-sm whitespace-pre-wrap break-words hyphens-auto leading-relaxed" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {message.content}
            </div>
            
            <div className="flex items-center justify-end mt-1 gap-2">
              <span className="text-xs opacity-75">{messageTime}</span>
              {getStatusIcon()}
              {message.status === 'failed' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => onRetry(message.tempId)}
                    className="text-xs text-white hover:text-yellow-200 p-1"
                    title="Retry"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemove(message.tempId)}
                    className="text-xs text-white hover:text-red-200 p-1"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatRoom({ roomId, roomName, roomType, onClose }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Hooks
  const { messages, isLoading } = useChatMessages(roomId);
  const { sendMessage, pendingMessages, retryMessage, removePendingMessage, isPending } = useSendMessage(roomId);
  const markRead = useMarkMessagesRead(roomId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId);
  // Note: Temporarily disable WebSocket notifications to prevent multiple connections
  // TODO: Implement unified WebSocket connection
  const isConnected = false;
  const lastError = null;
  const retry = () => {};
  const connectionAttempts = 0;
  
  // Dummy current user ID (in real app, get from auth context)
  const currentUserId = 1; // This should come from useAuth()
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // TEMPORARILY DISABLED: Mark messages as read when component loads
  // This was causing excessive API calls
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     markRead.mutate();
  //   }
  // }, [messages.length, markRead]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isPending) return;
    
    try {
      await sendMessage(newMessage);
      setNewMessage('');
      stopTyping();
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Simple typing indicator logic
    if (e.target.value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };
  
  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'DIRECT': return 'bg-green-100 text-green-800';
      case 'GROUP': return 'bg-blue-100 text-blue-800';
      case 'CLASS': return 'bg-purple-100 text-purple-800';
      case 'ANNOUNCEMENT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="h-full flex flex-col shadow-lg bg-gradient-to-b from-white to-gray-50 overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {roomName[0]?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">{roomName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${getRoomTypeColor(roomType)} text-xs font-medium`}>
                  {roomType}
                </Badge>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-400' : 
                    connectionAttempts > 0 ? 'bg-yellow-400' : 
                    'bg-gray-400'
                  }`} />
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {isConnected ? 'Connected' : 
                     connectionAttempts > 0 ? `Reconnecting... (${connectionAttempts})` : 
                     lastError ? 'Connection failed' :
                     'Connecting...'}
                  </span>
                  {lastError && (
                    <button
                      onClick={retry}
                      className="text-xs text-blue-500 hover:text-blue-700 ml-1"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 hidden sm:flex">
              <Users className="h-4 w-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100 hidden sm:flex">
              <Settings className="h-4 w-4 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 ml-2 lg:hidden">
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="text-gray-500 font-medium">Loading messages...</div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-gray-600 font-medium mb-2">No messages yet</div>
                <div className="text-gray-500 text-sm">Start the conversation!</div>
              </div>
            </div>
          ) : (
            <div className="space-y-1 w-full">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender === currentUserId}
                  currentUserId={currentUserId}
                />
              ))}
              
              {/* Pending messages */}
              {pendingMessages.map((pendingMessage) => (
                <PendingMessageBubble
                  key={pendingMessage.tempId}
                  message={pendingMessage}
                  onRetry={retryMessage}
                  onRemove={removePendingMessage}
                />
              ))}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-3 text-sm text-gray-500 mb-4 px-3">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      ...
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs font-medium">{typingUsers.join(', ')} typing...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator className="bg-gray-200" />
        
        {/* Message Input */}
        <div className="p-4 bg-white rounded-b-lg flex-shrink-0">
          <div className="flex items-end space-x-3 max-w-full">
            <div className="flex-1 relative min-w-0">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="pr-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full"
                disabled={isPending}
              />
              {isPending && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isPending}
              size="icon"
              className="rounded-full bg-blue-500 hover:bg-blue-600 shadow-md transition-all duration-200 hover:shadow-lg flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}