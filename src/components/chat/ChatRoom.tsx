'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Users, Settings, MoreVertical, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatMessages, useSendMessage, useMarkMessagesRead, useTypingIndicator, useWebSocketNotifications } from '@/hooks/useChat';
import { Clock, AlertCircle, RotateCcw, X } from 'lucide-react';
import { AddParticipantModal } from './AddParticipantModal';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { User } from '@/types';

// Helper function to get user initials
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

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
  currentUser?: User | null;
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
  currentUser?: User | null;
}

function MessageBubble({ message, isOwnMessage, currentUserId, currentUser }: MessageBubbleProps) {
  const messageTime = format(new Date(message.created_at), 'HH:mm');
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  // Generate consistent colors for different users
  const getUserColor = (senderId: number, senderName: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-indigo-500', 
      'from-green-500 to-teal-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-pink-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-cyan-500',
      'from-orange-500 to-red-500'
    ];
    const hash = senderId + senderName.length;
    return colors[hash % colors.length];
  };
  
  
  if (message.is_system_message) {
    return (
      <div className={`flex justify-center my-6 transform transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-full px-6 py-3 text-sm text-gray-600 font-medium shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            {message.content}
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group w-full ${
        isVisible 
          ? isOwnMessage 
            ? 'animate-slide-in-right' 
            : 'animate-slide-in-left'
          : 'opacity-0'
      }`}
      role="article"
      aria-label={`Message from ${isOwnMessage ? 'you' : message.sender_name} at ${messageTime}`}
    >
      <div className={`flex max-w-[85%] sm:max-w-[75%] min-w-0 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className={`w-10 h-10 ring-2 ${isOwnMessage ? 'ring-blue-200' : 'ring-gray-200'} shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105`}>
            <AvatarFallback className={`text-white text-sm font-bold ${
              isOwnMessage 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : `bg-gradient-to-br ${getUserColor(message.sender, message.sender_name)}`
            }`}>
              {getInitials(isOwnMessage ? 
                (currentUser?.first_name && currentUser?.last_name ? 
                  `${currentUser.first_name} ${currentUser.last_name}` : 
                  currentUser?.first_name || currentUser?.username || 'You'
                ) : 
                message.sender_name
              )}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex flex-col min-w-0 flex-1">
          {/* Sender info for other users */}
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-sm font-semibold text-gray-700 truncate">
                {message.sender_name}
              </span>
              <Badge 
                variant="secondary" 
                className="text-xs px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border-0 font-medium"
              >
                {message.sender_role}
              </Badge>
            </div>
          )}
          
          {/* Message bubble */}
          <div className={`
            message-bubble relative rounded-2xl px-4 py-3 min-w-0 break-words overflow-hidden shadow-lg
            ${isOwnMessage 
              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-br-md ml-4' 
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md mr-4 hover:border-gray-300'
            }
            before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none
          `}>
            <div className="relative z-10">
              <div 
                className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {message.content}
              </div>
            </div>
            
            {/* Subtle shine effect */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${
              isOwnMessage 
                ? 'from-transparent via-white/5 to-transparent' 
                : 'from-transparent via-gray-100/50 to-transparent'
            } translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out`}></div>
          </div>
          
          {/* Timestamp and status */}
          <div className={`flex items-center gap-2 mt-2 px-1 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{messageTime}</span>
            {message.is_edited && (
              <>
                <span>•</span>
                <span className="italic text-gray-400">edited</span>
              </>
            )}
            {isOwnMessage && (
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingMessageBubble({ message, onRetry, onRemove, currentUser }: PendingMessageBubbleProps) {
  const messageTime = format(message.timestamp, 'HH:mm');
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-400 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white"></div>
            </div>
            <span className="text-xs text-green-200">Sent</span>
          </div>
        );
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-300" />;
      default:
        return null;
    }
  };
  
  const getStatusColor = () => {
    switch (message.status) {
      case 'sending':
        return 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';
      case 'sent':
        return 'bg-gradient-to-br from-green-400 via-green-500 to-green-600';
      case 'failed':
        return 'bg-gradient-to-br from-red-400 via-red-500 to-red-600';
      default:
        return 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700';
    }
  };
  
  return (
    <div className={`flex justify-end mb-4 group w-full transform transition-all duration-500 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="flex max-w-[85%] sm:max-w-[75%] min-w-0 flex-row-reverse items-end gap-3">
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10 ring-2 ring-blue-200 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold">
              {getInitials(
                currentUser?.first_name && currentUser?.last_name ? 
                  `${currentUser.first_name} ${currentUser.last_name}` : 
                  currentUser?.first_name || currentUser?.username || 'You'
              )}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex flex-col min-w-0 flex-1">
          <div className={`
            relative rounded-2xl px-4 py-3 min-w-0 break-words overflow-hidden shadow-lg transition-all duration-300 ml-4
            ${getStatusColor()} text-white rounded-br-md
            ${message.status === 'failed' ? 'opacity-80 animate-pulse' : ''}
            before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none
          `}>
            <div className="relative z-10">
              <div 
                className="text-sm whitespace-pre-wrap break-words leading-relaxed"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {message.content}
              </div>
              
              <div className="flex items-center justify-end mt-2 gap-2">
                <Clock className="w-3 h-3 opacity-75" />
                <span className="text-xs opacity-75">{messageTime}</span>
                {getStatusIcon()}
                {message.status === 'failed' && (
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => onRetry(message.tempId)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                      title="Retry sending message"
                      aria-label="Retry sending message"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onRemove(message.tempId)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                      title="Remove failed message"
                      aria-label="Remove failed message"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pulse effect for sending */}
            {message.status === 'sending' && (
              <div className="absolute inset-0 rounded-2xl bg-white/5 animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatRoom({ roomId, roomName, roomType, onClose }: ChatRoomProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Hooks
  const { messages, isLoading } = useChatMessages(roomId);
  const { sendMessage, pendingMessages, retryMessage, removePendingMessage, isPending } = useSendMessage(roomId);
  const markRead = useMarkMessagesRead(roomId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId);
  // Note: Temporarily disable WebSocket notifications to prevent multiple connections
  // TODO: Implement unified WebSocket connection
  
  // Get current user from auth context
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  
  // Enhanced auto-scroll behavior
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    };
    
    // Small delay to allow for DOM updates and animations
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, pendingMessages]);
  
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
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  const handleOpenAddParticipant = () => {
    setIsAddParticipantModalOpen(true);
  };

  const handleCloseAddParticipant = () => {
    setIsAddParticipantModalOpen(false);
  };

  const handleParticipantAdded = (addedUsers: any[]) => {
    console.log(`Added ${addedUsers.length} users to ${roomName}:`, addedUsers);
    
    // Invalidate chat rooms cache so all users (including newly added ones) see updated chat list
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    
    // Also invalidate messages cache to show any system messages about user additions
    queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
  };
  
  return (
    <Card className="h-full flex flex-col shadow-2xl bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden border-0 ring-1 ring-gray-200">
      {/* Enhanced Header */}
      <CardHeader className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-white">
                <span className="text-white font-bold text-lg">
                  {roomName[0]?.toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 ring-2 ring-white shadow-sm"></div>
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                {roomName}
              </CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={`${getRoomTypeColor(roomType)} text-xs font-semibold px-3 py-1 rounded-full shadow-sm`}>
                  {roomType}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-gray-100 hidden sm:flex"
              onClick={handleOpenAddParticipant}
              title="Add users to chat"
            >
              <UserPlus className="h-4 w-4 text-gray-600" />
            </Button>
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
      <CardContent 
        className="flex-1 flex flex-col p-0 bg-gradient-to-b from-gray-50 to-white overflow-hidden"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        <ScrollArea className="flex-1 px-6 py-8 chat-scroll">
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
                  currentUser={currentUser}
                />
              ))}
              
              {/* Pending messages */}
              {pendingMessages.map((pendingMessage) => (
                <PendingMessageBubble
                  key={pendingMessage.tempId}
                  message={pendingMessage}
                  onRetry={retryMessage}
                  onRemove={removePendingMessage}
                  currentUser={currentUser}
                />
              ))}
              
              {/* Enhanced typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-3 text-sm text-gray-500 mb-6 px-3 animate-fade-in">
                  <Avatar className="w-8 h-8 ring-2 ring-gray-100 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500 text-xs font-medium">
                      <div className="flex items-center justify-center">
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {typingUsers.length === 1 
                          ? `${typingUsers[0]} is typing...`
                          : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing...`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator className="bg-gray-200" />
        
        {/* Enhanced Message Input */}
        <div className="p-6 bg-gradient-to-r from-white to-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-end space-x-4 max-w-full">
            <div className="flex-1 relative min-w-0">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="focus-ring pr-16 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 w-full bg-white shadow-sm transition-all duration-200 hover:shadow-md text-gray-800 placeholder-gray-500"
                disabled={isPending}
                aria-label="Type your message and press Enter to send"
                aria-describedby="message-help"
                role="textbox"
                aria-multiline="false"
              />
              {isPending && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              )}
              {!isPending && newMessage.trim() && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isPending}
              size="icon"
              className={`w-12 h-12 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 flex-shrink-0 ${
                newMessage.trim() && !isPending
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-200'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          {/* Accessibility and user guidance */}
          <div className="flex justify-end items-center mt-3 text-xs text-gray-500">
            <span id="message-help" className="text-gray-400">
              Press Enter to send, Shift + Enter for new line
            </span>
          </div>
        </div>
      </CardContent>

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={isAddParticipantModalOpen}
        onClose={handleCloseAddParticipant}
        roomId={roomId}
        roomName={roomName}
        onParticipantAdded={handleParticipantAdded}
      />
    </Card>
  );
}