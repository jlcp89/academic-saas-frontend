'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedSelect } from '@/components/ui/select';
import { SectionGradeBook, useBulkGradeSubmissions } from '@/lib/api/grading';
import { format } from 'date-fns';
import { 
  Users, 
  Save, 
  Award,
  CheckCircle,
  AlertTriangle,
  User,
  FileText,
  Trophy,
  BookOpen,
  Target,
  Plus,
  Minus
} from 'lucide-react';

interface BulkGradeFormProps {
  gradeBook: SectionGradeBook;
  onSuccess: () => void;
  onCancel: () => void;
}

interface GradeEntry {
  submissionId: number;
  studentName: string;
  assignmentTitle: string;
  currentGrade?: number;
  maxPoints: number;
  points_earned: string;
  feedback: string;
}

const ASSIGNMENT_TYPE_CONFIG = {
  HOMEWORK: { icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  QUIZ: { icon: FileText, color: 'bg-green-100 text-green-800' },
  EXAM: { icon: Trophy, color: 'bg-red-100 text-red-800' },
  PROJECT: { icon: Target, color: 'bg-purple-100 text-purple-800' },
  DISCUSSION: { icon: FileText, color: 'bg-orange-100 text-orange-800' },
};

export function BulkGradeForm({ gradeBook, onSuccess, onCancel }: BulkGradeFormProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [gradeEntries, setGradeEntries] = useState<GradeEntry[]>([]);
  const [bulkPoints, setBulkPoints] = useState<string>('');
  const [bulkFeedback, setBulkFeedback] = useState<string>('');

  const bulkGradeMutation = useBulkGradeSubmissions();

  // Get ungraded submissions for the selected assignment
  const getUngradeSubmissions = () => {
    if (!selectedAssignment) return [];

    const assignmentId = parseInt(selectedAssignment);
    const assignment = gradeBook.assignments.find(a => a.id === assignmentId);
    if (!assignment) return [];

    return gradeBook.entries
      .filter(entry => 
        entry.assignment_info?.id === assignmentId &&
        entry.submission &&
        entry.submission.status === 'SUBMITTED'
      )
      .map(entry => ({
        submissionId: entry.submission!.id,
        studentName: `${entry.student_info.first_name} ${entry.student_info.last_name}`,
        assignmentTitle: assignment.title,
        currentGrade: entry.submission!.points_earned,
        maxPoints: assignment.max_points,
        points_earned: entry.submission!.points_earned?.toString() || '',
        feedback: entry.submission!.feedback || '',
      }));
  };

  const handleAssignmentChange = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    const submissions = getUngradeSubmissions();
    setGradeEntries(submissions.map(sub => ({
      ...sub,
      points_earned: sub.currentGrade?.toString() || '',
      feedback: sub.feedback || '',
    })));
  };

  const updateGradeEntry = (index: number, field: 'points_earned' | 'feedback', value: string) => {
    setGradeEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const applyBulkPoints = () => {
    if (!bulkPoints) return;
    setGradeEntries(prev => prev.map(entry => ({
      ...entry,
      points_earned: bulkPoints,
    })));
  };

  const applyBulkFeedback = () => {
    if (!bulkFeedback) return;
    setGradeEntries(prev => prev.map(entry => ({
      ...entry,
      feedback: bulkFeedback,
    })));
  };

  const clearAllGrades = () => {
    setGradeEntries(prev => prev.map(entry => ({
      ...entry,
      points_earned: '',
      feedback: '',
    })));
  };

  const onSubmit = async () => {
    const validEntries = gradeEntries.filter(entry => 
      entry.points_earned && !isNaN(parseFloat(entry.points_earned))
    );

    if (validEntries.length === 0) {
      alert('Please enter valid grades for at least one submission.');
      return;
    }

    try {
      await bulkGradeMutation.mutateAsync({
        submissions: validEntries.map(entry => ({
          id: entry.submissionId,
          points_earned: parseFloat(entry.points_earned),
          feedback: entry.feedback || undefined,
        })),
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to bulk grade submissions:', error);
    }
  };

  const selectedAssignmentData = gradeBook.assignments.find(a => a.id.toString() === selectedAssignment);
  const typeConfig = selectedAssignmentData ? ASSIGNMENT_TYPE_CONFIG[selectedAssignmentData.assignment_type] : null;

  const validGrades = gradeEntries.filter(entry => 
    entry.points_earned && !isNaN(parseFloat(entry.points_earned))
  ).length;

  const getGradeColor = (points: string, maxPoints: number) => {
    if (!points || isNaN(parseFloat(points))) return '';
    const percentage = (parseFloat(points) / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Assignment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Bulk Grade Submissions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Select Assignment</Label>
              <EnhancedSelect
                options={gradeBook.assignments.map(assignment => ({
                  value: assignment.id.toString(),
                  label: `${assignment.title} (${assignment.max_points} pts)`,
                }))}
                value={selectedAssignment}
                onValueChange={handleAssignmentChange}
                placeholder="Choose an assignment to grade"
              />
            </div>

            {selectedAssignmentData && typeConfig && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                    <typeConfig.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">{selectedAssignmentData.title}</h3>
                    <p className="text-sm text-blue-700">{selectedAssignmentData.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <strong>Max Points:</strong> {selectedAssignmentData.max_points}
                  </div>
                  <div>
                    <strong>Due Date:</strong> {format(new Date(selectedAssignmentData.due_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {gradeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Apply Same Points to All</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max={selectedAssignmentData?.max_points}
                    step="0.5"
                    value={bulkPoints}
                    onChange={(e) => setBulkPoints(e.target.value)}
                    placeholder="Points"
                  />
                  <Button onClick={applyBulkPoints} variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Apply Same Feedback to All</Label>
                <div className="flex space-x-2">
                  <Input
                    value={bulkFeedback}
                    onChange={(e) => setBulkFeedback(e.target.value)}
                    placeholder="Feedback message"
                  />
                  <Button onClick={applyBulkFeedback} variant="outline" size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {validGrades} of {gradeEntries.length} submissions have valid grades
              </div>
              <Button onClick={clearAllGrades} variant="outline" size="sm">
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Grades */}
      {gradeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gradeEntries.map((entry, index) => (
                <div key={entry.submissionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{entry.studentName}</h4>
                        {entry.currentGrade !== undefined && (
                          <p className="text-sm text-gray-500">
                            Current grade: {entry.currentGrade}/{entry.maxPoints}
                          </p>
                        )}
                      </div>
                    </div>
                    {entry.points_earned && !isNaN(parseFloat(entry.points_earned)) && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready to Grade
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Points Earned</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max={entry.maxPoints}
                          step="0.5"
                          value={entry.points_earned}
                          onChange={(e) => updateGradeEntry(index, 'points_earned', e.target.value)}
                          placeholder={`0 - ${entry.maxPoints}`}
                          className={getGradeColor(entry.points_earned, entry.maxPoints)}
                        />
                        <span className="text-sm text-gray-500">/ {entry.maxPoints}</span>
                      </div>
                      {entry.points_earned && !isNaN(parseFloat(entry.points_earned)) && (
                        <p className={`text-sm ${getGradeColor(entry.points_earned, entry.maxPoints)}`}>
                          {((parseFloat(entry.points_earned) / entry.maxPoints) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Feedback (Optional)</Label>
                      <textarea
                        value={entry.feedback}
                        onChange={(e) => updateGradeEntry(index, 'feedback', e.target.value)}
                        placeholder="Feedback for this student..."
                        className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Submissions Message */}
      {selectedAssignment && gradeEntries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Submissions to Grade
            </h3>
            <p className="text-gray-600">
              All submissions for this assignment have already been graded or no submissions have been made yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-600">
          {validGrades > 0 && (
            <span>Ready to grade {validGrades} submission{validGrades !== 1 ? 's' : ''}</span>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={bulkGradeMutation.isPending || validGrades === 0}
            className="min-w-[140px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {bulkGradeMutation.isPending 
              ? 'Grading...' 
              : `Grade ${validGrades} Submission${validGrades !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {bulkGradeMutation.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Failed to grade submissions: {bulkGradeMutation.error.message}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Bulk Grading Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select an assignment to see all ungraded submissions</li>
          <li>• Use bulk actions to apply the same grade or feedback to all students</li>
          <li>• Customize individual grades and feedback as needed</li>
          <li>• Only submissions with valid points will be graded</li>
          <li>• All grades will be marked as "GRADED" status</li>
        </ul>
      </div>
    </div>
  );
}