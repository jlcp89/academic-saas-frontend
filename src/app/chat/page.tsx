'use client';

import { useState } from 'react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const [selectedRoom, setSelectedRoom] = useState<{
    id: number;
    name: string;
    type: string;
  } | null>(null);
  
  const handleSelectRoom = (roomId: number, roomName: string, roomType: string) => {
    setSelectedRoom({ id: roomId, name: roomName, type: roomType });
  };
  
  const handleCloseRoom = () => {
    setSelectedRoom(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-6 h-screen">
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Chat List Sidebar */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <ChatList 
            onSelectRoom={handleSelectRoom}
            selectedRoomId={selectedRoom?.id}
          />
        </div>
        
        {/* Chat Room or Welcome Message */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          {selectedRoom ? (
            <ChatRoom
              roomId={selectedRoom.id}
              roomName={selectedRoom.name}
              roomType={selectedRoom.type as any}
              onClose={handleCloseRoom}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">
                  Welcome to Chat
                </h2>
                <p className="text-gray-500">
                  Select a chat room from the sidebar to start messaging
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}