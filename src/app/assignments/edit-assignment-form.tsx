'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnhancedSelect } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { FileUpload } from '@/components/ui/file-upload';
import { useUpdateAssignment } from '@/lib/api/assignments';
import { useSections } from '@/lib/api/sections';
import { useAuth } from '@/contexts/auth-context';
import { Assignment } from '@/types';
import { format, addDays } from 'date-fns';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  GraduationCap, 
  Save, 
  Upload, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Trophy,
  Target,
  Timer,
  FileCheck,
  Plus,
  Minus,
  TrendingUp,
  Users,
  BarChart3,
  Eye
} from 'lucide-react';

const editAssignmentSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  instructions: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  max_points: z.string()
    .min(1, 'Maximum points is required')
    .refine(val => parseFloat(val) > 0, 'Maximum points must be greater than 0')
    .refine(val => parseFloat(val) <= 1000, 'Maximum points must be 1000 or less'),
  assignment_type: z.enum(['HOMEWORK', 'QUIZ', 'EXAM', 'PROJECT', 'DISCUSSION'] as const),
  section: z.string().min(1, 'Section is required'),
});

type EditAssignmentFormData = z.infer<typeof editAssignmentSchema>;

interface EditAssignmentFormProps {
  assignment: Assignment;
  onSuccess: () => void;
  onCancel: () => void;
}

const ASSIGNMENT_TYPES = [
  { value: 'HOMEWORK', label: 'Homework', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  { value: 'QUIZ', label: 'Quiz', icon: FileCheck, color: 'bg-green-100 text-green-800' },
  { value: 'EXAM', label: 'Exam', icon: Trophy, color: 'bg-red-100 text-red-800' },
  { value: 'PROJECT', label: 'Project', icon: Target, color: 'bg-purple-100 text-purple-800' },
  { value: 'DISCUSSION', label: 'Discussion', icon: FileText, color: 'bg-orange-100 text-orange-800' },
];

const QUICK_DUE_DATES = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'In 1 week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
  { label: 'In 1 month', days: 30 },
];

export function EditAssignmentForm({ assignment, onSuccess, onCancel }: EditAssignmentFormProps) {
  const { user } = useAuth();
  const updateAssignmentMutation = useUpdateAssignment();
  const { data: sectionsData } = useSections({ page_size: 100 });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [instructions, setInstructions] = useState(assignment.instructions || '');

  const sections = sectionsData?.results || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EditAssignmentFormData>({
    resolver: zodResolver(editAssignmentSchema),
    defaultValues: {
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions || '',
      due_date: assignment.due_date.slice(0, 16), // Format for datetime-local
      max_points: assignment.max_points.toString(),
      assignment_type: assignment.assignment_type,
      section: assignment.section.toString(),
    },
  });

  const selectedSection = watch('section');
  const selectedType = watch('assignment_type');
  const dueDate = watch('due_date');
  const maxPoints = watch('max_points');
  const title = watch('title');
  const description = watch('description');

  const onSubmit = async (data: EditAssignmentFormData) => {
    try {
      await updateAssignmentMutation.mutateAsync({
        id: assignment.id,
        data: {
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          max_points: parseFloat(data.max_points),
          assignment_type: data.assignment_type,
          instructions: instructions || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const setQuickDueDate = (days: number) => {
    const quickDate = addDays(new Date(), days);
    setValue('due_date', format(quickDate, 'yyyy-MM-dd\'T\'HH:mm'));
  };

  const handleFileUpload = (files: File[]) => {
    setAttachments(files);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Filter sections based on user role
  const availableSections = sections.filter(section => {
    if (user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') {
      return true;
    }
    if (user?.role === 'PROFESSOR') {
      return section.professor === user.id;
    }
    return false;
  });

  const sectionOptions = availableSections.map(section => ({
    value: section.id.toString(),
    label: `${section.section_name} (${section.subject_info.subject_code})`,
  }));

  const selectedSectionData = availableSections.find(s => s.id.toString() === selectedSection);
  const selectedTypeData = ASSIGNMENT_TYPES.find(t => t.value === selectedType);

  const getTimeUntilDue = () => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffInHours = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Overdue';
    if (diffInHours < 24) return `${diffInHours} hours`;
    if (diffInHours < 168) return `${Math.ceil(diffInHours / 24)} days`;
    return `${Math.ceil(diffInHours / 168)} weeks`;
  };

  const hasChanges = 
    title !== assignment.title ||
    description !== assignment.description ||
    instructions !== (assignment.instructions || '') ||
    dueDate !== assignment.due_date.slice(0, 16) ||
    maxPoints !== assignment.max_points.toString() ||
    selectedType !== assignment.assignment_type ||
    selectedSection !== assignment.section.toString() ||
    attachments.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Assignment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Assignment Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assignment.submissions_count || 0}
              </div>
              <div className="text-sm text-gray-600">Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assignment.max_points}
              </div>
              <div className="text-sm text-gray-600">Max Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assignment.average_score || 0}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {format(new Date(assignment.created_at), 'MMM d')}
              </div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Assignment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Created:</strong> {format(new Date(assignment.created_at), 'PPP')}</p>
                <p><strong>Updated:</strong> {format(new Date(assignment.updated_at), 'PPP')}</p>
              </div>
              <div>
                <p><strong>Section:</strong> {assignment.section_info.section_name}</p>
                <p><strong>Subject:</strong> {assignment.section_info.subject_info.subject_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Assignment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Chapter 5 Homework"
                error={errors.title?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of what students need to do..."
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment_type">Assignment Type *</Label>
              <EnhancedSelect
                options={ASSIGNMENT_TYPES.map(type => ({ value: type.value, label: type.label }))}
                value={selectedType}
                onValueChange={(value) => setValue('assignment_type', value as any)}
                placeholder="Select assignment type"
                error={errors.assignment_type?.message}
              />
              {selectedTypeData && (
                <div className="flex items-center space-x-2">
                  <Badge className={selectedTypeData.color}>
                    <selectedTypeData.icon className="w-3 h-3 mr-1" />
                    {selectedTypeData.label}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <EnhancedSelect
                options={sectionOptions}
                value={selectedSection}
                onValueChange={(value) => setValue('section', value)}
                placeholder="Select section"
                error={errors.section?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Due Date and Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Due Date & Points</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
                type="datetime-local"
                {...register('due_date')}
                error={errors.due_date?.message}
              />
              {dueDate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Timer className="w-4 h-4" />
                  <span>Due in {getTimeUntilDue()}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quick Due Date</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_DUE_DATES.map((quick, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDueDate(quick.days)}
                    className="text-xs"
                  >
                    {quick.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_points">Maximum Points *</Label>
              <Input
                id="max_points"
                type="number"
                min="1"
                max="1000"
                step="0.5"
                {...register('max_points')}
                placeholder="100"
                error={errors.max_points?.message}
              />
              {maxPoints && (
                <div className="text-sm text-gray-600">
                  Worth {maxPoints} points
                </div>
              )}
            </div>

            {/* Section Information */}
            {selectedSectionData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Section Information</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Section:</strong> {selectedSectionData.section_name}</p>
                  <p><strong>Subject:</strong> {selectedSectionData.subject_info.subject_code} - {selectedSectionData.subject_info.subject_name}</p>
                  <p><strong>Students:</strong> {selectedSectionData.enrollment_count}</p>
                  <p><strong>Professor:</strong> {selectedSectionData.professor_info.first_name} {selectedSectionData.professor_info.last_name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5" />
            <span>Instructions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="instructions">Detailed Instructions (Optional)</Label>
            <RichTextEditor
              value={instructions}
              onChange={setInstructions}
              placeholder="Provide detailed instructions, requirements, and any additional information students need..."
              minHeight={200}
              maxHeight={400}
            />
            <p className="text-sm text-gray-500">
              Use the rich text editor to format your instructions with headings, lists, links, and more.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Attachments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FileUpload
              onUpload={handleFileUpload}
              maxFiles={5}
              maxSize={50 * 1024 * 1024} // 50MB
              accept={['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif']}
              description="Upload assignment files, rubrics, or supporting materials"
            />
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label>New Attached Files</Label>
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
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Attachments</Label>
                {assignment.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{attachment.name}</span>
                      <span className="text-xs text-blue-600">
                        (existing file)
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

      {/* Changes Summary */}
      {hasChanges && (
        <Card>
          <CardHeader>
            <CardTitle>Changes Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {title !== assignment.title && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Title:</span>
                  <span className="text-gray-500">{assignment.title}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{title}</span>
                </div>
              )}
              {maxPoints !== assignment.max_points.toString() && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Max Points:</span>
                  <span className="text-gray-500">{assignment.max_points}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{maxPoints}</span>
                </div>
              )}
              {selectedType !== assignment.assignment_type && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Type:</span>
                  <span className="text-gray-500">{assignment.assignment_type}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{selectedType}</span>
                </div>
              )}
              {dueDate !== assignment.due_date.slice(0, 16) && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-medium">Due Date:</span>
                  <span className="text-gray-500">{format(new Date(assignment.due_date), 'PPP p')}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{format(new Date(dueDate), 'PPP p')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={updateAssignmentMutation.isPending || !hasChanges}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateAssignmentMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Error Display */}
      {updateAssignmentMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to update assignment: {updateAssignmentMutation.error.message}
          </p>
        </div>
      )}

      {/* No changes message */}
      {!hasChanges && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            No changes have been made to this assignment.
          </p>
        </div>
      )}
    </form>
  );
}