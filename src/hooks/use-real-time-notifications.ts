import { useEffect, useCallback, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNotificationStore } from '@/lib/stores/notification-store';
import { useWebSocket } from '@/lib/websocket';
import toast from 'react-hot-toast';

export function useRealTimeNotifications() {
  const { user } = useAuth();
  const { addNotification } = useNotificationStore();
  const { connect, disconnect, subscribe, connected } = useWebSocket();

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    // TEMPORARILY DISABLED: Prevents conflict with chat WebSocket connections
    // This should be re-enabled when we consolidate WebSocket systems
    console.log('[REAL-TIME] WebSocket connection disabled to prevent chat conflicts');
    
    // if (user?.id && user?.accessToken) {
    //   connect(user.id.toString(), user.accessToken).catch(error => {
    //     console.error('Failed to connect to WebSocket:', error);
    //   });
    // }

    // return () => {
    //   disconnect();
    // };
  }, [user?.id, user?.accessToken, connect, disconnect]);

  // Handle new notifications
  useEffect(() => {
    if (!connected) return;

    const unsubscribeNotification = subscribe('notification:new', (data) => {
      // Only show notification if it's for the current user
      if (data.userId === user?.id?.toString()) {
        addNotification({
          title: data.title,
          message: data.message,
          type: data.type,
        });

        // Also show toast for immediate feedback
        switch (data.type) {
          case 'success':
            toast.success(data.message);
            break;
          case 'error':
            toast.error(data.message);
            break;
          case 'warning':
            toast.error(data.message, { icon: '⚠️' });
            break;
          case 'info':
          default:
            toast(data.message);
            break;
        }
      }
    });

    // Handle assignment events
    const unsubscribeAssignmentCreated = subscribe('assignment:created', (data) => {
      addNotification({
        title: 'New Assignment',
        message: `A new assignment "${data.assignment.title}" has been created.`,
        type: 'info',
        actionUrl: `/assignments/${data.assignmentId}`,
        actionLabel: 'View Assignment'
      });
    });

    const unsubscribeAssignmentGraded = subscribe('assignment:graded', (data) => {
      // Note: We don't have student_id in the event, so we'll show all grading notifications
      // This should be filtered by the backend to only send to relevant users
      addNotification({
        title: 'Assignment Graded',
        message: `An assignment has been graded`,
        type: 'success',
        actionUrl: `/submissions/${data.submissionId}`,
        actionLabel: 'View Grade'
      });
    });

    // Handle school announcements
    const unsubscribeSchoolAnnouncement = subscribe('school:announcement', (data) => {
      if (data.schoolId === user?.school?.toString()) {
        addNotification({
          title: 'School Announcement',
          message: (data.announcement.title as string) || 'New announcement',
          type: 'info',
          actionUrl: `/announcements/${data.announcement.id as string}`,
          actionLabel: 'Read More'
        });
      }
    });

    // Handle system alerts
    const unsubscribeSystemAlert = subscribe('system:alert', (data) => {
      addNotification({
        title: 'System Alert',
        message: data.message,
        type: data.level === 'error' ? 'error' : data.level === 'warning' ? 'warning' : 'info',
      });

      // Show immediate toast for system alerts
      if (data.level === 'error') {
        toast.error(data.message);
      } else if (data.level === 'warning') {
        toast.error(data.message, { icon: '⚠️' });
      }
    });

    // Handle maintenance notifications
    const unsubscribeSystemMaintenance = subscribe('system:maintenance', (data) => {
      addNotification({
        title: 'Scheduled Maintenance',
        message: `${data.message} Scheduled for: ${new Date(data.scheduledAt).toLocaleString()}`,
        type: 'warning',
      });
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeNotification();
      unsubscribeAssignmentCreated();
      unsubscribeAssignmentGraded();
      unsubscribeSchoolAnnouncement();
      unsubscribeSystemAlert();
      unsubscribeSystemMaintenance();
    };
  }, [connected, user?.id, user?.school, addNotification, subscribe]);

  return {
    connected,
    isRealTimeEnabled: connected,
  };
}

// Hook for real-time dashboard updates
export function useRealTimeDashboard(onUpdate?: (data: unknown) => void) {
  const { connected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!connected || !onUpdate) return;

    const unsubscribe = subscribe('dashboard:update', (data) => {
      onUpdate(data);
    });

    return unsubscribe;
  }, [connected, onUpdate, subscribe]);

  return {
    connected,
  };
}

// Hook for user presence tracking
export function useUserPresence() {
  const { user } = useAuth();
  const { connected, setOnlineStatus, subscribe } = useWebSocket();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { status: string; lastSeen: Date }>>({});

  useEffect(() => {
    if (!connected) return;

    // Set initial online status
    setOnlineStatus('online');

    // Handle user coming online
    const unsubscribeOnline = subscribe('user:online', (data) => {
      setOnlineUsers(prev => ({
        ...prev,
        [data.userId]: {
          status: (data.userData.status as string) || 'online',
          lastSeen: new Date((data.userData.lastSeen as string) || Date.now())
        }
      }));
    });

    // Handle user going offline
    const unsubscribeOffline = subscribe('user:offline', (data) => {
      setOnlineUsers(prev => {
        const updated = { ...prev };
        delete updated[data.userId];
        return updated;
      });
    });

    // Handle visibility change to update status
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOnlineStatus('away');
      } else {
        setOnlineStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set offline status when component unmounts
    return () => {
      setOnlineStatus('offline');
      unsubscribeOnline();
      unsubscribeOffline();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connected, setOnlineStatus, subscribe]);

  const setStatus = useCallback((status: 'online' | 'away' | 'busy' | 'offline') => {
    setOnlineStatus(status);
  }, [setOnlineStatus]);

  return {
    onlineUsers,
    setStatus,
    connected,
    currentUser: user,
  };
}

// Hook for typing indicators in chat/comments
export function useTypingIndicator(roomId: string) {
  const { connected, startTyping, stopTyping, subscribe } = useWebSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!connected || !roomId) return;

    const unsubscribe = subscribe('user:typing', (data) => {
      if (data.roomId === roomId) {
        setTypingUsers(prev => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });

        // Remove user from typing after a timeout
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    });

    return unsubscribe;
  }, [connected, roomId, subscribe]);

  const handleStartTyping = useCallback(() => {
    if (!connected || !roomId) return;

    startTyping(roomId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(roomId);
    }, 2000);
  }, [connected, roomId, startTyping, stopTyping]);

  const handleStopTyping = useCallback(() => {
    if (!connected || !roomId) return;

    stopTyping(roomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [connected, roomId, stopTyping]);

  return {
    typingUsers,
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping,
    connected,
  };
}