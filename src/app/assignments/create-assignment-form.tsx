'use client';

import { useState } from 'react';
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
import { useCreateAssignment } from '@/lib/api/assignments';
import { useSections } from '@/lib/api/sections';
import { useAuth } from '@/contexts/auth-context';
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
  Minus
} from 'lucide-react';

const createAssignmentSchema = z.object({
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
}).refine((data) => {
  const dueDate = new Date(data.due_date);
  const now = new Date();
  return dueDate > now;
}, {
  message: "Due date must be in the future",
  path: ["due_date"],
});

type CreateAssignmentFormData = z.infer<typeof createAssignmentSchema>;

interface CreateAssignmentFormProps {
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

export function CreateAssignmentForm({ onSuccess, onCancel }: CreateAssignmentFormProps) {
  const { user } = useAuth();
  const createAssignmentMutation = useCreateAssignment();
  const { data: sectionsData } = useSections({ page_size: 100 });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [instructions, setInstructions] = useState('');

  const sections = sectionsData?.results || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateAssignmentFormData>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd\'T\'HH:mm'),
      max_points: '100',
      assignment_type: 'HOMEWORK',
      section: '',
    },
  });

  const selectedSection = watch('section');
  const selectedType = watch('assignment_type');
  const dueDate = watch('due_date');
  const maxPoints = watch('max_points');

  const onSubmit = async (data: CreateAssignmentFormData) => {
    try {
      await createAssignmentMutation.mutateAsync({
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        max_points: parseFloat(data.max_points),
        assignment_type: data.assignment_type,
        section: parseInt(data.section),
        instructions: instructions || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to create assignment:', error);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                onValueChange={(value) => setValue('assignment_type', value as 'HOMEWORK' | 'QUIZ' | 'EXAM' | 'PROJECT' | 'DISCUSSION')}
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

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createAssignmentMutation.isPending}
          className="min-w-[140px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
        </Button>
      </div>

      {/* Error Display */}
      {createAssignmentMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to create assignment: {createAssignmentMutation.error.message}
          </p>
        </div>
      )}
    </form>
  );
}