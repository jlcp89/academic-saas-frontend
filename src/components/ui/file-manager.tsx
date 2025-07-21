'use client';

import React, { useState, useCallback } from 'react';
import { FileUpload } from './file-upload';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Progress } from './progress';
import { 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Edit2,
  Share2,
  Clock,
  User,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Loader2,
  MoreVertical,
  Copy
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export interface ManagedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: {
    id: string;
    name: string;
  };
  status: 'uploading' | 'ready' | 'processing' | 'error';
  progress?: number;
  errorMessage?: string;
  metadata?: {
    dimensions?: { width: number; height: number };
    duration?: number;
    description?: string;
    tags?: string[];
  };
}

interface FileManagerProps {
  files: ManagedFile[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  onDownload: (fileId: string) => Promise<void>;
  onRename: (fileId: string, newName: string) => Promise<void>;
  onShare: (fileId: string) => Promise<string>; // Returns share URL
  maxFileSize?: number;
  allowedTypes?: Record<string, string[]>;
  className?: string;
  showUploadArea?: boolean;
  compact?: boolean;
}

const getFileIcon = (type: string, size: 'sm' | 'md' | 'lg' = 'md') => {
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  
  if (type.startsWith('image/')) return <Image className={iconSize} />;
  if (type.startsWith('video/')) return <Video className={iconSize} />;
  if (type.startsWith('audio/')) return <Music className={iconSize} />;
  if (type.includes('pdf')) return <FileText className={iconSize} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <Archive className={iconSize} />;
  if (type.includes('javascript') || type.includes('html') || type.includes('css')) return <Code className={iconSize} />;
  return <File className={iconSize} />;
};

const getFileTypeLabel = (type: string) => {
  if (type.startsWith('image/')) return 'Image';
  if (type.startsWith('video/')) return 'Video';
  if (type.startsWith('audio/')) return 'Audio';
  if (type.includes('pdf')) return 'PDF';
  if (type.includes('word')) return 'Word';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
  if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint';
  return 'File';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusColor = (status: ManagedFile['status']) => {
  switch (status) {
    case 'uploading': return 'bg-blue-100 text-blue-800';
    case 'ready': return 'bg-green-100 text-green-800';
    case 'processing': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface FileCardProps {
  file: ManagedFile;
  onDelete: (fileId: string) => Promise<void>;
  onDownload: (fileId: string) => Promise<void>;
  onRename: (fileId: string, newName: string) => Promise<void>;
  onShare: (fileId: string) => Promise<string>;
  compact?: boolean;
}

function FileCard({ file, onDelete, onDownload, onRename, onShare, compact }: FileCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const handleAction = async (action: () => Promise<any>) => {
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('File action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== file.name) {
      await handleAction(() => onRename(file.id, newName.trim()));
    }
    setIsRenaming(false);
  };

  const handleShare = async () => {
    await handleAction(async () => {
      const shareUrl = await onShare(file.id);
      navigator.clipboard.writeText(shareUrl);
      // You might want to show a toast notification here
    });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
        <div className="flex-shrink-0">
          {getFileIcon(file.type, 'sm')}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)} • {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
          </p>
        </div>

        <Badge variant="outline" className={cn('text-xs', getStatusColor(file.status))}>
          {file.status}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction(() => onDownload(file.id))}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleAction(() => onDelete(file.id))}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {file.type.startsWith('image/') ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={file.url} 
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                {getFileIcon(file.type, 'lg')}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getFileTypeLabel(file.type)}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs', getStatusColor(file.status))}>
                    {file.status}
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500">
                <p>{formatFileSize(file.size)}</p>
                <p className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{file.uploadedBy.name}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>{formatDistanceToNow(file.uploadedAt, { addSuffix: true })}</span>
                </p>
              </div>
            </div>

            {file.status === 'uploading' && file.progress !== undefined && (
              <div className="mt-2">
                <Progress value={file.progress} className="h-1" />
                <p className="text-xs text-gray-500 mt-1">{file.progress}% uploaded</p>
              </div>
            )}

            {file.status === 'error' && file.errorMessage && (
              <p className="text-xs text-red-600 mt-1">{file.errorMessage}</p>
            )}
          </div>

          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MoreVertical className="w-4 h-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction(() => onDownload(file.id))}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.url)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleAction(() => onDelete(file.id))}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FileManager({
  files,
  onUpload,
  onDelete,
  onDownload,
  onRename,
  onShare,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
  },
  className,
  showUploadArea = true,
  compact = false
}: FileManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');

  const filteredFiles = files.filter(file => {
    if (filter === 'all') return true;
    if (filter === 'images') return file.type.startsWith('image/');
    if (filter === 'documents') return file.type.includes('pdf') || file.type.includes('word') || file.type.includes('text');
    if (filter === 'videos') return file.type.startsWith('video/');
    if (filter === 'audio') return file.type.startsWith('audio/');
    return false;
  });

  const fileTypeCounts = {
    all: files.length,
    images: files.filter(f => f.type.startsWith('image/')).length,
    documents: files.filter(f => f.type.includes('pdf') || f.type.includes('word') || f.type.includes('text')).length,
    videos: files.filter(f => f.type.startsWith('video/')).length,
    audio: files.filter(f => f.type.startsWith('audio/')).length,
  };

  return (
    <div className={cn('space-y-6', className)}>
      {showUploadArea && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={onUpload}
              accept={allowedTypes}
              maxSize={maxFileSize}
              multiple={true}
              placeholder="Drag & drop files here, or click to select"
              description="Upload documents, images, videos, and more"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Files ({filteredFiles.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            {Object.entries(fileTypeCounts).map(([type, count]) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
                className="text-xs"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Upload some files to get started'
                  : `No ${filter} found. Try a different filter.`
                }
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' && !compact
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-2'
            )}>
              {filteredFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={onDelete}
                  onDownload={onDownload}
                  onRename={onRename}
                  onShare={onShare}
                  compact={viewMode === 'list' || compact}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}