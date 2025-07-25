'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Users,
  Crown,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'PROFESSOR' | 'STUDENT';
}

interface AvailableUsersResponse {
  results: User[];
  count: number;
  num_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
  permission_info: {
    can_add: string[];
    message: string;
  };
}

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: number;
  roomName: string;
  onParticipantAdded: (users: User[]) => void;
}

const roleIcons = {
  SUPERADMIN: Crown,
  ADMIN: Users,
  PROFESSOR: GraduationCap,
  STUDENT: BookOpen,
};

const roleColors = {
  SUPERADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
  PROFESSOR: 'bg-green-100 text-green-800 border-green-200',
  STUDENT: 'bg-gray-100 text-gray-800 border-gray-200',
};

const roleLabels = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Admin',
  PROFESSOR: 'Professor',
  STUDENT: 'Student',
};

export function AddParticipantModal({
  isOpen,
  onClose,
  roomId,
  roomName,
  onParticipantAdded
}: AddParticipantModalProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [permissionInfo, setPermissionInfo] = useState<{can_add: string[], message: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    num_pages: 0,
    current_page: 1,
    has_next: false,
    has_previous: false
  });

  // Fetch available users
  const fetchUsers = async (search = '', page = 1) => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        page_size: '20'
      });
      
      if (search.trim()) {
        searchParams.set('search', search.trim());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat-rooms/${roomId}/available_users/?${searchParams}`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AvailableUsersResponse = await response.json();
      
      setUsers(data.results);
      setPermissionInfo(data.permission_info);
      setPagination({
        count: data.count,
        num_pages: data.num_pages,
        current_page: data.current_page,
        has_next: data.has_next,
        has_previous: data.has_previous
      });

    } catch (err) {
      console.error('Error fetching available users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Add selected participants
  const addParticipants = async () => {
    if (!session?.accessToken || selectedUsers.size === 0) return;

    setAdding(true);
    setError(null);
    setSuccessMessage(null);

    const addedUsers: User[] = [];
    const errors: string[] = [];

    // Add users one by one to get individual error handling
    for (const userId of selectedUsers) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chat-rooms/${roomId}/add_participant/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
          }
        );

        const data = await response.json();

        if (response.ok) {
          const user = users.find(u => u.id === userId);
          if (user) {
            addedUsers.push(user);
          }
        } else {
          const userName = users.find(u => u.id === userId)?.username || `User ${userId}`;
          errors.push(`${userName}: ${data.error || 'Failed to add'}`);
        }
      } catch (err) {
        const userName = users.find(u => u.id === userId)?.username || `User ${userId}`;
        errors.push(`${userName}: Network error`);
      }
    }

    if (addedUsers.length > 0) {
      setSuccessMessage(
        `Successfully added ${addedUsers.length} user${addedUsers.length > 1 ? 's' : ''} to ${roomName}`
      );
      onParticipantAdded(addedUsers);
      
      // Refresh the user list to remove added users
      await fetchUsers(searchTerm, pagination.current_page);
      
      // Clear selection
      setSelectedUsers(new Set());
    }

    if (errors.length > 0) {
      setError(`Some users could not be added:\n${errors.join('\n')}`);
    }

    setAdding(false);

    // Close modal if all users were added successfully
    if (errors.length === 0) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = setTimeout(() => {
      fetchUsers(searchTerm, 1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isOpen, roomId, session?.accessToken]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedUsers(new Set());
      setError(null);
      setSuccessMessage(null);
      fetchUsers('', 1);
    }
  }, [isOpen]);

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Get user display name
  const getUserDisplayName = (user: User) => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.username;
  };

  // Get user initials for avatar
  const getUserInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Users to {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Permission info */}
          {permissionInfo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {permissionInfo.message}
                {permissionInfo.can_add.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {permissionInfo.can_add.map(role => (
                      <Badge key={role} variant="outline" className={roleColors[role as keyof typeof roleColors]}>
                        {roleLabels[role as keyof typeof roleLabels]}
                      </Badge>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Search input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Success message */}
          {successMessage && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {/* Users list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'No users available to add.'}
              </div>
            ) : (
              users.map((user) => {
                const RoleIcon = roleIcons[user.role];
                const isSelected = selectedUsers.has(user.id);
                
                return (
                  <Card 
                    key={user.id} 
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                        
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {getUserDisplayName(user)}
                            </p>
                            <Badge variant="outline" className={roleColors[user.role]}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleLabels[user.role]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            @{user.username} • {user.email}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination info */}
          {pagination.count > 0 && (
            <div className="text-sm text-gray-600 text-center py-2">
              Showing {users.length} of {pagination.count} users
              {pagination.num_pages > 1 && ` (Page ${pagination.current_page} of ${pagination.num_pages})`}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={adding}>
            Cancel
          </Button>
          <Button 
            onClick={addParticipants} 
            disabled={selectedUsers.size === 0 || adding}
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add {selectedUsers.size > 0 ? `${selectedUsers.size} ` : ''}User{selectedUsers.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}