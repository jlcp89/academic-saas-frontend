'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChatList } from '@/components/chat/ChatList';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowLeft, Menu, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [selectedRoom, setSelectedRoom] = useState<{
    id: number;
    name: string;
    type: string;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Debug authentication status
  console.log('Chat Page Auth Status:', {
    status,
    hasSession: !!session,
    user: session?.user,
    hasAccessToken: !!session?.accessToken
  });
  
  const handleSelectRoom = (roomId: number, roomName: string, roomType: string) => {
    setSelectedRoom({ id: roomId, name: roomName, type: roomType });
    setSidebarOpen(false); // Close sidebar on mobile when room is selected
  };
  
  const handleCloseRoom = () => {
    setSelectedRoom(null);
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="container mx-auto px-4 py-6 h-screen">
      {/* Authentication Status Banner */}
      <div className="mb-4 flex items-center gap-4">
        <Badge variant={status === 'authenticated' ? 'default' : 'destructive'}>
          Auth Status: {status}
        </Badge>
        {session?.user && (
          <span className="text-sm text-gray-600">
            Logged in as: {session.user.email || `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim() || session.user.username}
          </span>
        )}
        {status === 'unauthenticated' && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            You must be logged in to view chats
          </div>
        )}
      </div>
      
      <div className="flex gap-6 h-full relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Chat List Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-80 md:w-full md:max-w-sm md:min-w-[320px] flex-shrink-0
          transition-transform duration-300 ease-in-out
          bg-white md:bg-transparent
          border-r md:border-r-0
        `}>
          <ChatList 
            onSelectRoom={handleSelectRoom}
            selectedRoomId={selectedRoom?.id}
          />
        </div>
        
        {/* Chat Room or Welcome Message */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile header */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            {selectedRoom ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseRoom}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold">{selectedRoom.name}</h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold">Chat</h1>
            )}
            
            {!selectedRoom && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Chat content */}
          <div className="flex-1 min-h-0">
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
                  <p className="text-gray-500 mb-4">
                    Select a chat room from the sidebar to start messaging
                  </p>
                  <Button
                    variant="outline"
                    onClick={toggleSidebar}
                    className="md:hidden"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Browse Chats
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}