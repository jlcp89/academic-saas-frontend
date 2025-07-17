'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import { useCreateSubmission } from '@/lib/api/submissions';
import { useAuth } from '@/contexts/auth-context';
import { Assignment } from '@/types';
import { format, differenceInHours, isAfter } from 'date-fns';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Upload, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Save,
  Send,
  BookOpen,
  Target,
  Trophy,
  FileCheck,
  Timer,
  GraduationCap,
  Minus
} from 'lucide-react';

const createSubmissionSchema = z.object({
  content: z.string()
    .min(10, 'Submission content must be at least 10 characters')
    .max(50000, 'Submission content must be less than 50,000 characters'),
});

type CreateSubmissionFormData = z.infer<typeof createSubmissionSchema>;

interface CreateSubmissionFormProps {
  assignment: Assignment;
  onSuccess: () => void;
  onCancel: () => void;
}

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileCheck, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

export function CreateSubmissionForm({ assignment, onSuccess, onCancel }: CreateSubmissionFormProps) {
  const { user } = useAuth();
  const createSubmissionMutation = useCreateSubmission();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSubmissionFormData>({
    resolver: zodResolver(createSubmissionSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = async (data: CreateSubmissionFormData) => {
    try {
      await createSubmissionMutation.mutateAsync({
        assignment: assignment.id,
        content: content,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create submission:', error);
    }
  };

  const handleFileUpload = (files: File[]) => {
    setAttachments(files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const typeConfig = ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type];
  const TypeIcon = typeConfig.icon;

  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const hoursUntilDue = differenceInHours(dueDate, now);
  const isOverdue = isAfter(now, dueDate);
  const isDueSoon = hoursUntilDue > 0 && hoursUntilDue < 24;

  const getTimeUntilDue = () => {
    if (isOverdue) {
      const hoursOverdue = Math.abs(hoursUntilDue);
      if (hoursOverdue < 24) return `${hoursOverdue}h overdue`;
      return `${Math.ceil(hoursOverdue / 24)}d overdue`;
    }
    
    if (hoursUntilDue < 24) return `${hoursUntilDue}h left`;
    if (hoursUntilDue < 168) return `${Math.ceil(hoursUntilDue / 24)}d left`;
    return `${Math.ceil(hoursUntilDue / 168)}w left`;
  };

  const getStatusColor = () => {
    if (isOverdue) return 'bg-red-100 text-red-800';
    if (isDueSoon) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusIcon = () => {
    if (isOverdue) return AlertTriangle;
    if (isDueSoon) return Timer;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Assignment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Assignment Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                <p className="text-sm text-gray-600">{assignment.description}</p>
              </div>
            </div>
            <Badge className={typeConfig.color}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {assignment.assignment_type}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Points</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {assignment.max_points}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Due Date</span>
              </div>
              <div className="text-sm font-medium text-blue-900">
                {format(dueDate, 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-blue-700">
                {format(dueDate, 'h:mm a')}
              </div>
            </div>

            <div className={`border rounded-lg p-4 ${isOverdue ? 'bg-red-50 border-red-200' : isDueSoon ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <StatusIcon className={`h-4 w-4 ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'}`}>
                  Status
                </span>
              </div>
              <Badge className={getStatusColor()}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {getTimeUntilDue()}
              </Badge>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Section Information</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Section:</strong> {assignment.section_info.section_name}</p>
              <p><strong>Subject:</strong> {assignment.section_info.subject_info.subject_code} - {assignment.section_info.subject_info.subject_name}</p>
              <p><strong>Professor:</strong> {assignment.section_info.professor_info.first_name} {assignment.section_info.professor_info.last_name}</p>
            </div>
          </div>

          {/* Assignment Instructions */}
          {assignment.instructions && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: assignment.instructions }}
              />
            </div>
          )}

          {/* Assignment Attachments */}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Assignment Files</h4>
              <div className="space-y-2">
                {assignment.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Your Submission</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Submission Content *</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your submission here. You can format text, add links, insert images, and more..."
                minHeight={300}
                maxHeight={600}
                error={errors.content?.message}
              />
              <p className="text-sm text-gray-500">
                Use the rich text editor to format your submission. You can add headings, lists, links, and other formatting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>File Attachments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FileUpload
              onUpload={handleFileUpload}
              maxFiles={10}
              maxSize={100 * 1024 * 1024} // 100MB
              accept={['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.ppt', '.pptx', '.xls', '.xlsx']}
              description="Upload your submission files (documents, images, presentations, etc.)"
            />
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files</Label>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Warning */}
      {isOverdue && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Late Submission Warning
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This assignment is overdue. Your submission will be marked as late and may be subject to penalties.
                  Please check with your professor about the late submission policy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isDraft"
            checked={isDraft}
            onChange={(e) => setIsDraft(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isDraft" className="text-sm text-gray-600">
            Save as draft (you can edit and submit later)
          </label>
        </div>

        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createSubmissionMutation.isPending || content.length < 10}
            className="min-w-[140px]"
          >
            {isDraft ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {createSubmissionMutation.isPending ? 'Saving...' : 'Save Draft'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {createSubmissionMutation.isPending ? 'Submitting...' : 'Submit'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {createSubmissionMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create submission: {createSubmissionMutation.error.message}
          </p>
        </div>
      )}

      {/* Submission Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Submission Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Make sure to review your work before submitting</li>
          <li>• You can save as draft and come back to edit later</li>
          <li>• Attach any required files using the file upload area</li>
          <li>• Check the assignment instructions carefully</li>
          {!isOverdue && (
            <li>• You have {getTimeUntilDue()} until the deadline</li>
          )}
        </ul>
      </div>
    </form>
  );
}