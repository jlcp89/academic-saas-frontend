'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GradesLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSelect } from '@/components/ui/select';
import { Modal } from '@/components/ui/dialog';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSectionGradeBook, useExportGrades } from '@/lib/api/grading';
import { useSections } from '@/lib/api/sections';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types';
import { format } from 'date-fns';
import { 
  Award,
  BarChart3,
  Download,
  Edit,
  Eye,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trophy,
  Target,
  BookOpen,
  User,
  Plus
} from 'lucide-react';
import { GradeBookTable } from './grade-book-table';
import { GradeSubmissionForm } from './grade-submission-form';
import { BulkGradeForm } from './bulk-grade-form';

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileText, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

export default function GradesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [showBulkGradeForm, setShowBulkGradeForm] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  // Get sections based on user role
  const sectionsQuery = useSections({ page_size: 100 });
  const sections = sectionsQuery.data?.results || [];

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

  const { data: gradeBookData, isLoading, error, refetch } = useSectionGradeBook(
    selectedSection ? parseInt(selectedSection) : 0
  );

  const exportGradesMutation = useExportGrades();

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleGradeSubmission = (submissionId: number) => {
    setSelectedSubmissionId(submissionId);
    setShowGradeForm(true);
  };

  const handleBulkGrade = () => {
    setShowBulkGradeForm(true);
  };

  const handleExportGrades = async () => {
    if (!selectedSection) return;
    try {
      await exportGradesMutation.mutateAsync(parseInt(selectedSection));
    } catch (error) {
      console.error('Failed to export grades:', error);
    }
  };

  const sectionOptions = availableSections.map(section => ({
    value: section.id.toString(),
    label: `${section.section_name} (${section.subject_info.subject_code})`,
  }));

  if (user?.role === 'STUDENT') {
    // Redirect students to their personal grades view
    router.push('/grades/my-grades');
    return null;
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.PROFESSOR]}>
      <GradesLayout>
        <div className="space-y-6">
          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5" />
                <span>Grade Book</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Section
                  </label>
                  <EnhancedSelect
                    options={sectionOptions}
                    value={selectedSection}
                    onValueChange={handleSectionChange}
                    placeholder="Choose a section to view grades"
                  />
                </div>
                {selectedSection && gradeBookData && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleBulkGrade}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Bulk Grade</span>
                    </Button>
                    <Button
                      onClick={handleExportGrades}
                      disabled={exportGradesMutation.isPending}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {exportGradesMutation.isPending ? 'Exporting...' : 'Export CSV'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grade Book Statistics */}
          {gradeBookData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradeBookData.stats.total_students}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assignments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradeBookData.stats.total_assignments}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Graded</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradeBookData.stats.graded_count} / {gradeBookData.stats.submitted_count}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Grade</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {gradeBookData.stats.average_grade > 0 
                          ? `${gradeBookData.stats.average_grade.toFixed(1)}%` 
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Section Information */}
          {gradeBookData && (
            <Card>
              <CardHeader>
                <CardTitle>Section Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">
                      {gradeBookData.section_info.section_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {gradeBookData.section_info.subject_info.subject_code} - {gradeBookData.section_info.subject_info.subject_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Professor: {gradeBookData.section_info.professor_info.first_name} {gradeBookData.section_info.professor_info.last_name}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {gradeBookData.assignments.map((assignment) => {
                        const typeConfig = ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type];
                        const TypeIcon = typeConfig.icon;
                        return (
                          <Badge key={assignment.id} className={typeConfig.color}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {assignment.title}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grade Book Table */}
          {isLoading && selectedSection && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Loading grade book...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {error && selectedSection && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-red-600 mb-4">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error loading grade book: {error.message}</p>
                </div>
                <Button onClick={() => refetch()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {gradeBookData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Grade Book</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {format(new Date(), 'MMM d, h:mm a')}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GradeBookTable
                  gradeBook={gradeBookData}
                  onGradeSubmission={handleGradeSubmission}
                  onRefresh={refetch}
                />
              </CardContent>
            </Card>
          )}

          {!selectedSection && (
            <Card>
              <CardContent className="p-8 text-center">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Section
                </h3>
                <p className="text-gray-600 mb-4">
                  Choose a section from the dropdown above to view and manage grades.
                </p>
                {availableSections.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No sections available. Create sections to start grading.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grade Submission Modal */}
          <Modal
            isOpen={showGradeForm}
            onClose={() => setShowGradeForm(false)}
            title="Grade Submission"
            size="lg"
          >
            {selectedSubmissionId && (
              <GradeSubmissionForm
                submissionId={selectedSubmissionId}
                onSuccess={() => {
                  setShowGradeForm(false);
                  setSelectedSubmissionId(null);
                  refetch();
                }}
                onCancel={() => {
                  setShowGradeForm(false);
                  setSelectedSubmissionId(null);
                }}
              />
            )}
          </Modal>

          {/* Bulk Grade Modal */}
          <Modal
            isOpen={showBulkGradeForm}
            onClose={() => setShowBulkGradeForm(false)}
            title="Bulk Grade Submissions"
            size="xl"
          >
            {gradeBookData && (
              <BulkGradeForm
                gradeBook={gradeBookData}
                onSuccess={() => {
                  setShowBulkGradeForm(false);
                  refetch();
                }}
                onCancel={() => setShowBulkGradeForm(false)}
              />
            )}
          </Modal>
        </div>
      </GradesLayout>
    </ProtectedRoute>
  );
}