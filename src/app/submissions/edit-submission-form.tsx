'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import { useUpdateSubmission, useSubmitSubmission } from '@/lib/api/submissions';
import { useAuth } from '@/contexts/auth-context';
import { Submission } from '@/types';
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
  Minus,
  Eye,
  TrendingUp,
  Award
} from 'lucide-react';

const editSubmissionSchema = z.object({
  content: z.string()
    .min(10, 'Submission content must be at least 10 characters')
    .max(50000, 'Submission content must be less than 50,000 characters'),
});

type EditSubmissionFormData = z.infer<typeof editSubmissionSchema>;

interface EditSubmissionFormProps {
  submission: Submission;
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

const SUBMISSION_STATUS_CONFIG = {
  DRAFT: { icon: FileText, color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  SUBMITTED: { icon: Send, color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
  GRADED: { icon: Award, color: 'bg-green-100 text-green-800', label: 'Graded' },
  RETURNED: { icon: FileCheck, color: 'bg-purple-100 text-purple-800', label: 'Returned' },
};

export function EditSubmissionForm({ submission, onSuccess, onCancel }: EditSubmissionFormProps) {
  const { user } = useAuth();
  const updateSubmissionMutation = useUpdateSubmission();
  const submitSubmissionMutation = useSubmitSubmission();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [content, setContent] = useState(submission.content || '');
  const [isDraft, setIsDraft] = useState(submission.status === 'DRAFT');

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<EditSubmissionFormData>({
    resolver: zodResolver(editSubmissionSchema),
    defaultValues: {
      content: submission.content || '',
    },
  });

  const onSubmit = async (data: EditSubmissionFormData) => {
    try {
      if (isDraft) {
        await updateSubmissionMutation.mutateAsync({
          id: submission.id,
          data: {
            content: content,
            status: 'DRAFT',
            attachments: attachments.length > 0 ? attachments : undefined,
          },
        });
      } else {
        // If submitting, first update then submit
        await updateSubmissionMutation.mutateAsync({
          id: submission.id,
          data: {
            content: content,
            attachments: attachments.length > 0 ? attachments : undefined,
          },
        });
        await submitSubmissionMutation.mutateAsync(submission.id);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to update submission:', error);
    }
  };

  const handleFileUpload = (files: File[]) => {
    setAttachments(files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const typeConfig = ASSIGNMENT_TYPE_CONFIG[submission.assignment_info.assignment_type];
  const TypeIcon = typeConfig.icon;
  const statusConfig = SUBMISSION_STATUS_CONFIG[submission.status];
  const StatusIcon = statusConfig.icon;

  const dueDate = new Date(submission.assignment_info.due_date);
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

  const DueStatusIcon = getStatusIcon();

  const hasChanges = content !== (submission.content || '') || attachments.length > 0;
  const canEdit = submission.status === 'DRAFT' || submission.status === 'RETURNED';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Submission Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Submission Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                <Badge className={statusConfig.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">Current Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {submission.assignment_info.max_points}
              </div>
              <div className="text-sm text-gray-600">Max Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {submission.points_earned || '-'}
              </div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {submission.submitted_at ? format(new Date(submission.submitted_at), 'MMM d') : '-'}
              </div>
              <div className="text-sm text-gray-600">Submitted</div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Submission Timeline</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Created:</strong> {format(new Date(submission.created_at), 'PPP p')}</p>
                <p><strong>Last Updated:</strong> {format(new Date(submission.updated_at), 'PPP p')}</p>
              </div>
              <div>
                {submission.submitted_at && (
                  <p><strong>Submitted:</strong> {format(new Date(submission.submitted_at), 'PPP p')}</p>
                )}
                {submission.graded_at && (
                  <p><strong>Graded:</strong> {format(new Date(submission.graded_at), 'PPP p')}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <h3 className="font-medium text-gray-900">{submission.assignment_info.title}</h3>
                <p className="text-sm text-gray-600">{submission.assignment_info.description}</p>
              </div>
            </div>
            <Badge className={typeConfig.color}>
              <TypeIcon className="w-3 h-3 mr-1" />
              {submission.assignment_info.assignment_type}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Trophy className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Points</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {submission.assignment_info.max_points}
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
                <DueStatusIcon className={`h-4 w-4 ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-green-600'}`}>
                  Status
                </span>
              </div>
              <Badge className={getStatusColor()}>
                <DueStatusIcon className="w-3 h-3 mr-1" />
                {getTimeUntilDue()}
              </Badge>
            </div>
          </div>

          {/* Assignment Instructions */}
          {submission.assignment_info.instructions && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
              <div 
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: submission.assignment_info.instructions }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Grade/Feedback */}
      {(submission.points_earned !== null && submission.points_earned !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Grade & Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Your Grade</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {submission.points_earned} / {submission.assignment_info.max_points}
                    </div>
                    <div className="text-sm text-green-700">
                      {((submission.points_earned / submission.assignment_info.max_points) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {submission.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Professor Feedback</h4>
                  <p className="text-sm text-blue-800">{submission.feedback}</p>
                  {submission.graded_by_info && (
                    <p className="text-xs text-blue-600 mt-2">
                      - {submission.graded_by_info.first_name} {submission.graded_by_info.last_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Warning */}
      {!canEdit && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Submission Cannot Be Edited
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  This submission has been submitted and cannot be modified. Only draft and returned submissions can be edited.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Content */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Edit Submission Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Submission Content *</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Edit your submission content here..."
                  minHeight={300}
                  maxHeight={600}
                  error={errors.content?.message}
                />
                <p className="text-sm text-gray-500">
                  Make your changes and save as draft or submit when ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Attachments */}
      {canEdit && (
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
                description="Upload additional files for your submission"
              />
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>New Files to Add</Label>
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

              {/* Existing attachments */}
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Current Attachments</Label>
                  {submission.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{attachment.name}</span>
                        <span className="text-xs text-blue-600">
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
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Content (if not editable) */}
      {!canEdit && submission.content && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Submission Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: submission.content }}
            />
          </CardContent>
        </Card>
      )}

      {/* Current Attachments (if not editable) */}
      {!canEdit && submission.attachments && submission.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Submitted Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {submission.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
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
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      {canEdit && (
        <>
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
                Save as draft (you can edit later)
              </label>
            </div>

            <div className="flex space-x-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateSubmissionMutation.isPending || submitSubmissionMutation.isPending || !hasChanges}
                className="min-w-[140px]"
              >
                {isDraft ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {updateSubmissionMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {submitSubmissionMutation.isPending ? 'Submitting...' : 'Submit'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {(updateSubmissionMutation.error || submitSubmissionMutation.error) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Failed to update submission: {updateSubmissionMutation.error?.message || submitSubmissionMutation.error?.message}
              </p>
            </div>
          )}

          {/* No changes message */}
          {!hasChanges && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                No changes have been made to this submission.
              </p>
            </div>
          )}
        </>
      )}

      {!canEdit && (
        <div className="flex justify-end pt-4 border-t">
          <Button type="button" onClick={onCancel}>
            Close
          </Button>
        </div>
      )}
    </form>
  );
}