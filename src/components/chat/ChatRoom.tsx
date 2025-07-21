'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Send, Users, Settings, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatMessages, useSendMessage, useMarkMessagesRead, useTypingIndicator } from '@/hooks/useChat';

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

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const messageTime = format(new Date(message.created_at), 'HH:mm');
  
  if (message.is_system_message) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 rounded-lg px-3 py-1 text-sm text-gray-600">
          {message.content}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwnMessage && (
          <Avatar className="w-8 h-8 mr-2">
            <AvatarFallback>{message.sender_name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        <div className={`rounded-lg px-4 py-2 ${
          isOwnMessage 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {!isOwnMessage && (
            <div className="text-xs font-medium mb-1 opacity-70">
              {message.sender_name}
              <Badge variant="outline" className="ml-1 text-xs">
                {message.sender_role}
              </Badge>
            </div>
          )}
          
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          
          <div className={`text-xs mt-1 opacity-70 ${
            isOwnMessage ? 'text-right' : 'text-left'
          }`}>
            {messageTime}
            {message.is_edited && (
              <span className="ml-1">(edited)</span>
            )}
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
  const sendMessage = useSendMessage(roomId);
  const markRead = useMarkMessagesRead(roomId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(roomId);
  
  // Dummy current user ID (in real app, get from auth context)
  const currentUserId = 1; // This should come from useAuth()
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Mark messages as read when component loads
  useEffect(() => {
    if (messages.length > 0) {
      markRead.mutate();
    }
  }, [messages.length, markRead]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendMessage.isPending) return;
    
    try {
      await sendMessage.mutateAsync(newMessage);
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
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg">{roomName}</CardTitle>
            <Badge className={getRoomTypeColor(roomType)}>
              {roomType}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Messages Area */}
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No messages yet. Start the conversation!</div>
            </div>
          ) : (
            <div>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender === currentUserId}
                  currentUserId={currentUserId}
                />
              ))}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span>{typingUsers.join(', ')} typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        {/* Message Input */}
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessage.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}