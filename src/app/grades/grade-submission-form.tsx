'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSelect } from '@/components/ui/select';
import { useSubmission } from '@/lib/api/submissions';
import { useGradeSubmission } from '@/lib/api/grading';
import { format, isAfter } from 'date-fns';
import { 
  User, 
  Calendar, 
  Trophy, 
  FileText, 
  Save, 
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Target,
  Eye,
  Download
} from 'lucide-react';

const gradeSubmissionSchema = z.object({
  points_earned: z.string()
    .min(1, 'Points earned is required')
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Points must be a valid number >= 0'),
  feedback: z.string().optional(),
  status: z.enum(['GRADED', 'RETURNED'] as const),
}).refine((data) => {
  // We'll validate against max points in the component
  return true;
});

type GradeSubmissionFormData = z.infer<typeof gradeSubmissionSchema>;

interface GradeSubmissionFormProps {
  submissionId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileText, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

export function GradeSubmissionForm({ submissionId, onSuccess, onCancel }: GradeSubmissionFormProps) {
  const { data: submission, isLoading } = useSubmission(submissionId);
  const gradeSubmissionMutation = useGradeSubmission();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<GradeSubmissionFormData>({
    resolver: zodResolver(gradeSubmissionSchema),
    defaultValues: {
      points_earned: submission?.points_earned?.toString() || '',
      feedback: submission?.feedback || '',
      status: submission?.status === 'RETURNED' ? 'RETURNED' : 'GRADED',
    },
  });

  const pointsEarned = watch('points_earned');
  const feedback = watch('feedback');
  const status = watch('status');

  const onSubmit = async (data: GradeSubmissionFormData) => {
    if (!submission) return;

    const points = parseFloat(data.points_earned);
    const maxPoints = submission.assignment_info.max_points;

    // Validate points against max points
    if (points > maxPoints) {
      setError('points_earned', {
        type: 'manual',
        message: `Points cannot exceed maximum of ${maxPoints}`,
      });
      return;
    }

    try {
      await gradeSubmissionMutation.mutateAsync({
        id: submissionId,
        data: {
          points_earned: points,
          feedback: data.feedback || undefined,
          status: data.status,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to grade submission:', error);
    }
  };

  const handlePointsChange = (value: string) => {
    setValue('points_earned', value);
    clearErrors('points_earned');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading submission...</span>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Submission not found</p>
      </div>
    );
  }

  const typeConfig = ASSIGNMENT_TYPE_CONFIG[submission.assignment_info.assignment_type];
  const TypeIcon = typeConfig.icon;
  const dueDate = new Date(submission.assignment_info.due_date);
  const isLate = submission.submitted_at && isAfter(new Date(submission.submitted_at), dueDate);
  const percentage = pointsEarned ? (parseFloat(pointsEarned) / submission.assignment_info.max_points) * 100 : 0;

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Satisfactory';
    if (percentage >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Submission Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Submission Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Information */}
          <div className="flex items-center space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">
                {submission.student_info.first_name} {submission.student_info.last_name}
              </h3>
              <p className="text-sm text-blue-700">{submission.student_info.email}</p>
              <p className="text-xs text-blue-600">ID: {submission.student_info.username}</p>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {submission.assignment_info.title}
                  </h4>
                  <Badge className={typeConfig.color}>
                    {submission.assignment_info.assignment_type}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {submission.assignment_info.description}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Maximum Points:</span>
                <span className="font-medium">{submission.assignment_info.max_points}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="text-sm">{format(dueDate, 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Submitted:</span>
                <div className="text-right">
                  {submission.submitted_at ? (
                    <>
                      <div className="text-sm">
                        {format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')}
                      </div>
                      {isLate && (
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Late
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">Not submitted</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Submission Content</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submission.content ? (
            <div 
              className="prose prose-sm max-w-none bg-gray-50 border border-gray-200 rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: submission.content }}
            />
          ) : (
            <div className="text-center py-4 text-gray-500">
              No content submitted
            </div>
          )}

          {/* Attachments */}
          {submission.attachments && submission.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
              <div className="space-y-2">
                {submission.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = attachment.url;
                          a.download = attachment.name;
                          a.click();
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grading Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Grade This Submission</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points_earned">Points Earned *</Label>
              <Input
                id="points_earned"
                type="number"
                min="0"
                max={submission.assignment_info.max_points}
                step="0.5"
                {...register('points_earned')}
                onChange={(e) => handlePointsChange(e.target.value)}
                placeholder={`0 - ${submission.assignment_info.max_points}`}
                error={errors.points_earned?.message}
              />
              <p className="text-xs text-gray-500">
                Maximum: {submission.assignment_info.max_points} points
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Grade Status *</Label>
              <EnhancedSelect
                options={[
                  { value: 'GRADED', label: 'Graded - Final grade' },
                  { value: 'RETURNED', label: 'Returned - Needs revision' },
                ]}
                value={status}
                onValueChange={(value) => setValue('status', value as 'GRADED' | 'RETURNED')}
                placeholder="Select status"
                error={errors.status?.message}
              />
            </div>
          </div>

          {/* Grade Preview */}
          {pointsEarned && !isNaN(parseFloat(pointsEarned)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Grade Preview</p>
                  <p className="text-sm text-blue-800">
                    {getGradeLabel(percentage)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getGradeColor(percentage)}`}>
                    {parseFloat(pointsEarned).toFixed(1)} / {submission.assignment_info.max_points}
                  </div>
                  <div className={`text-sm ${getGradeColor(percentage)}`}>
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <textarea
              id="feedback"
              {...register('feedback')}
              placeholder="Provide feedback to help the student understand their grade and improve..."
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-gray-500">
              Good feedback helps students understand what they did well and what they can improve.
            </p>
          </div>

          {/* Late Submission Warning */}
          {isLate && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Late Submission
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    This submission was submitted after the due date. Consider your late submission policy when grading.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={gradeSubmissionMutation.isPending || !pointsEarned}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {gradeSubmissionMutation.isPending ? 'Saving Grade...' : 'Save Grade'}
        </Button>
      </div>

      {/* Error Display */}
      {gradeSubmissionMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to save grade: {gradeSubmissionMutation.error.message}
          </p>
        </div>
      )}

      {/* Grading Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Grading Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Review the assignment instructions and rubric carefully</li>
          <li>• Provide specific, constructive feedback</li>
          <li>• Consider partial credit for incomplete but demonstrative work</li>
          <li>• Be consistent with grading criteria across all students</li>
          <li>• Use "Returned" status if the student needs to revise and resubmit</li>
        </ul>
      </div>
    </form>
  );
}