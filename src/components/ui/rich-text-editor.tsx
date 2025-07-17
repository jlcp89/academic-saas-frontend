'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Image,
  Table,
  Type,
  Strikethrough,
  Highlighter,
  Indent,
  Outdent,
  FileText,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  showPreview?: boolean;
  error?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your content...',
  readOnly = false,
  className,
  minHeight = 200,
  maxHeight = 600,
  showPreview = true,
  error,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    if (editorRef.current && !readOnly) {
      editorRef.current.innerHTML = value;
    }
  }, [value, readOnly]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            execCommand('redo');
          } else {
            execCommand('undo');
          }
          break;
      }
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertTable = () => {
    const rows = prompt('Number of rows:');
    const cols = prompt('Number of columns:');
    if (rows && cols) {
      let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;"><tbody>';
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
      }
      tableHTML += '</tbody></table>';
      execCommand('insertHTML', tableHTML);
    }
  };

  const formatBlock = (tag: string) => {
    execCommand('formatBlock', tag);
  };

  const toolbarButtons = [
    {
      group: 'text',
      buttons: [
        { icon: Bold, command: 'bold', title: 'Bold (Ctrl+B)' },
        { icon: Italic, command: 'italic', title: 'Italic (Ctrl+I)' },
        { icon: Underline, command: 'underline', title: 'Underline (Ctrl+U)' },
        { icon: Strikethrough, command: 'strikeThrough', title: 'Strikethrough' },
        { icon: Highlighter, command: 'hiliteColor', value: 'yellow', title: 'Highlight' },
      ],
    },
    {
      group: 'headings',
      buttons: [
        { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
        { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
        { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
        { icon: Type, command: 'formatBlock', value: 'p', title: 'Paragraph' },
      ],
    },
    {
      group: 'lists',
      buttons: [
        { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
        { icon: ListOrdered, command: 'insertOrderedList', title: 'Numbered List' },
        { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
        { icon: Code, command: 'formatBlock', value: 'pre', title: 'Code Block' },
      ],
    },
    {
      group: 'align',
      buttons: [
        { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
        { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
        { icon: Indent, command: 'indent', title: 'Indent' },
        { icon: Outdent, command: 'outdent', title: 'Outdent' },
      ],
    },
    {
      group: 'insert',
      buttons: [
        { icon: Link, command: 'link', title: 'Insert Link', action: insertLink },
        { icon: Image, command: 'image', title: 'Insert Image', action: insertImage },
        { icon: Table, command: 'table', title: 'Insert Table', action: insertTable },
      ],
    },
    {
      group: 'history',
      buttons: [
        { icon: Undo, command: 'undo', title: 'Undo (Ctrl+Z)' },
        { icon: Redo, command: 'redo', title: 'Redo (Ctrl+Shift+Z)' },
      ],
    },
  ];

  if (readOnly) {
    return (
      <div className={cn('border rounded-lg p-4 min-h-[200px] bg-gray-50', className)}>
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className, error && 'border-red-500')}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarButtons.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {group.buttons.map((button, buttonIndex) => {
                const Icon = button.icon;
                return (
                  <Button
                    key={buttonIndex}
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      if (button.action) {
                        button.action();
                      } else if (button.command === 'formatBlock') {
                        formatBlock(button.value!);
                      } else {
                        execCommand(button.command, button.value);
                      }
                    }}
                    title={button.title}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
              {groupIndex < toolbarButtons.length - 1 && (
                <Separator orientation="vertical" className="mx-1 h-6" />
              )}
            </React.Fragment>
          ))}
          
          {showPreview && (
            <>
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                title={isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
                className="h-8 px-2"
              >
                {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-1 text-xs">
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative">
        {isPreviewMode ? (
          <div className="p-4 prose prose-sm max-w-none" style={{ minHeight, maxHeight }}>
            <div dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={updateContent}
            onKeyDown={handleKeyDown}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            className="p-4 outline-none prose prose-sm max-w-none overflow-y-auto"
            style={{ minHeight, maxHeight }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Character Count */}
      <div className="border-t bg-gray-50 px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {selectedText && `Selected: ${selectedText.length} chars | `}
            Content: {value.replace(/<[^>]*>/g, '').length} chars
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {isPreviewMode ? 'Preview Mode' : 'Edit Mode'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t bg-red-50 px-4 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* CSS for placeholder and styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
        
        .prose h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        
        .prose h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        
        .prose h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
        }
        
        .prose p {
          margin: 0.5rem 0;
        }
        
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .prose pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.875rem;
        }
        
        .prose ul, .prose ol {
          padding-left: 2rem;
          margin: 0.5rem 0;
        }
        
        .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        .prose table td, .prose table th {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
        }
        
        .prose table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        .prose a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}