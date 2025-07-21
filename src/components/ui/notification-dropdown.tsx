'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useNotificationStore, Notification } from '@/lib/stores/notification-store';
import { cn } from '@/lib/utils';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const getNotificationBorderColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'border-l-green-500';
    case 'error':
      return 'border-l-red-500';
    case 'warning':
      return 'border-l-yellow-500';
    case 'info':
    default:
      return 'border-l-blue-500';
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onRemove: (id: string) => void;
  onAction?: (url: string) => void;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onRemove, 
  onAction 
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
  };

  return (
    <div
      className={cn(
        'border-l-4 p-3 hover:bg-gray-50 cursor-pointer transition-colors',
        getNotificationBorderColor(notification.type),
        !notification.read && 'bg-blue-50'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={cn(
              'text-sm font-medium',
              !notification.read ? 'text-gray-900' : 'text-gray-700'
            )}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>
          
          <p className="text-xs text-gray-600 mt-1">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </span>
            
            <div className="flex items-center space-x-1">
              {notification.actionLabel && notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAction) onAction(notification.actionUrl!);
                  }}
                >
                  {notification.actionLabel}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotificationStore();

  const handleAction = (url: string) => {
    router.push(url);
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onRemove={removeNotification}
                onAction={handleAction}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">No notifications yet</p>
              <p className="text-xs text-gray-500 mt-1">
                We&apos;ll notify you when something happens
              </p>
            </div>
          )}
        </div>
        
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={() => router.push('/notifications')}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}