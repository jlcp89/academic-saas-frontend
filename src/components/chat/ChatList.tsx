'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Search, MessageCircle, Users, Megaphone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatRooms, useCreateChatRoom } from '@/hooks/useChat';

interface ChatListProps {
  onSelectRoom: (roomId: number, roomName: string, roomType: string) => void;
  selectedRoomId?: number;
}

export function ChatList({ onSelectRoom, selectedRoomId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  
  const { chatRooms, isLoading, error } = useChatRooms();
  const createRoom = useCreateChatRoom();
  
  // Debug logging
  console.log('ChatList Debug:', {
    chatRooms,
    isLoading,
    error,
    roomCount: chatRooms.length
  });
  
  // Filter rooms based on search query
  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getRoomIcon = (roomType: string) => {
    switch (roomType) {
      case 'DIRECT': return <User className="h-4 w-4" />;
      case 'GROUP': return <Users className="h-4 w-4" />;
      case 'CLASS': return <MessageCircle className="h-4 w-4" />;
      case 'ANNOUNCEMENT': return <Megaphone className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };
  
  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'DIRECT': return 'text-green-600';
      case 'GROUP': return 'text-blue-600';
      case 'CLASS': return 'text-purple-600';
      case 'ANNOUNCEMENT': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };
  
  const handleCreateRoom = async () => {
    try {
      const roomName = prompt('Enter room name:');
      if (!roomName) return;
      
      await createRoom.mutateAsync({
        name: roomName,
        room_type: 'GROUP'
      });
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };
  
  
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">Chat Rooms</CardTitle>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleCreateRoom}
            disabled={createRoom.isPending}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading rooms...</div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="text-red-500 font-medium mb-2">Failed to load chat rooms</div>
              <div className="text-sm text-gray-600 text-center">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">
                {searchQuery ? 'No rooms found' : 'No chat rooms yet'}
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.id, room.name, room.room_type)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedRoomId === room.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`mt-1 ${getRoomTypeColor(room.room_type)}`}>
                        {getRoomIcon(room.room_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">{room.name}</h3>
                          {room.last_message_at && (
                            <span className="text-xs text-gray-500 ml-2">
                              {formatLastMessageTime(room.last_message_at)}
                            </span>
                          )}
                        </div>
                        
                        {room.last_message_preview && (
                          <p className="text-xs text-gray-600 truncate mt-1">
                            <span className="font-medium">
                              {room.last_message_preview.sender_name}:
                            </span>{' '}
                            {room.last_message_preview.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {room.room_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {room.participant_count} members
                            </span>
                          </div>
                          
                          {room.unread_count > 0 && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              {room.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}