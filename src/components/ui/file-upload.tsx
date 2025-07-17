'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Upload, X, File, Image, FileText, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: Record<string, string[]> | string[];
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
  showPreview?: boolean;
  description?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  id: string;
}

export function FileUpload({
  onUpload,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt']
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  disabled = false,
  multiple = true,
  placeholder = 'Drag & drop files here, or click to select',
  showPreview = true,
  description
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);

  // Convert accept prop to dropzone format
  const acceptObj = Array.isArray(accept) 
    ? { 'application/octet-stream': accept } 
    : accept;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      id: Math.random().toString(36).substr(2, 9)
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptObj,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
    disabled
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive && 'border-blue-500 bg-blue-50',
          !isDragActive && 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            {isDragActive ? 'Drop files here...' : placeholder}
          </p>
          <p className="text-xs text-gray-500">
            Max {formatFileSize(maxSize)} per file, up to {maxFiles} files
          </p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>

      {/* File rejection errors */}
      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{file.name}</span>
              <span>-</span>
              <span>{errors[0]?.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* File previews */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          <div className="grid grid-cols-1 gap-3">
            {uploadedFiles.map(({ file, preview, id }) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <div key={id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {preview ? (
                    <img
                      src={preview}
                      alt={file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <FileIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple file input component
interface FileInputProps {
  onChange: (files: FileList | null) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function FileInput({
  onChange,
  accept,
  multiple = false,
  disabled = false,
  placeholder = 'Choose file',
  className
}: FileInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files);
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className="flex items-center space-x-2"
      >
        <Upload className="h-4 w-4" />
        <span>{placeholder}</span>
      </Button>
    </div>
  );
}

// Avatar upload component
interface AvatarUploadProps {
  onUpload: (file: File) => void;
  currentImage?: string;
  className?: string;
  disabled?: boolean;
}

export function AvatarUpload({
  onUpload,
  currentImage,
  className,
  disabled = false
}: AvatarUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(currentImage || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onUpload(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled
  });

  return (
    <div className={cn('flex flex-col items-center space-y-2', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative w-24 h-24 rounded-full border-2 border-dashed cursor-pointer transition-colors overflow-hidden',
          isDragActive && 'border-blue-500 bg-blue-50',
          !isDragActive && 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <img
            src={preview}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 text-center">
        Click or drag to upload avatar
      </p>
    </div>
  );
}