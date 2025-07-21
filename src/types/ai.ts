// Tipos para el sistema de predicción de riesgo académico

export interface AcademicRiskPrediction {
  id: number;
  student: number;
  student_name: string;
  student_email: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  factors: Record<string, any>;
  predicted_outcome: string;
  attendance_rate: number | null;
  assignment_completion_rate: number | null;
  average_grade: number | null;
  late_submissions_count: number;
  participation_score: number | null;
  study_time_hours: number | null;
  previous_semester_gpa: number | null;
  current_semester_gpa: number | null;
  days_since_last_login: number;
  risk_percentage: number;
  risk_color: string;
  primary_factors: string[];
  is_active: boolean;
  last_updated: string;
  created_at: string;
}

export interface LearningRecommendation {
  id: number;
  student: number;
  student_name: string;
  subject: number | null;
  subject_name: string | null;
  recommendation_type: 'STUDY_RESOURCE' | 'PRACTICE_EXERCISE' | 'PEER_COLLABORATION' | 'TEACHER_CONSULTATION' | 'LEARNING_STRATEGY';
  title: string;
  description: string;
  expected_impact: number;
  expected_impact_percentage: number;
  time_requirement: string;
  difficulty_level: string;
  resources: Array<{
    type: string;
    url: string;
    title: string;
  }>;
  related_assignments: number[];
  is_completed: boolean;
  completed_at: string | null;
  student_feedback: string | null;
  effectiveness_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface PredictiveAlert {
  id: number;
  student: number;
  student_name: string;
  subject: number | null;
  subject_name: string | null;
  alert_type: 'ACADEMIC_RISK' | 'ENGAGEMENT_DROP' | 'PERFORMANCE_TREND' | 'ASSIGNMENT_OVERDUE' | 'LEARNING_GAP';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence_score: number;
  confidence_percentage: number;
  predicted_outcome: string;
  recommended_actions: any[];
  supporting_evidence: Record<string, any>;
  is_active: boolean;
  acknowledged_by: number | null;
  acknowledged_by_name: string | null;
  acknowledged_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskDashboard {
  total_students: number;
  high_risk_count: number;
  risk_distribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  high_risk_students: AcademicRiskPrediction[];
  average_risk_score: number;
  trend_analysis: {
    trend: string;
    change_percentage: number;
    period: string;
  };
}

export interface StudentRiskSummary {
  risk_prediction: AcademicRiskPrediction;
  recent_recommendations: LearningRecommendation[];
  active_alerts: PredictiveAlert[];
  performance_trend: {
    current_period: string;
    previous_period: string;
    change_percentage: number;
    trend: string;
    subjects: Array<{
      name: string;
      change: number;
    }>;
  };
  improvement_suggestions: string[];
}

export interface AssignmentIntelligence {
  id: number;
  assignment: number;
  assignment_title: string;
  subject_name: string;
  difficulty_score: number | null;
  difficulty_percentage: number;
  completion_rate: number | null;
  completion_rate_percentage: number;
  average_grade: number | null;
  common_mistakes: string[];
  time_distribution: Record<string, number>;
  success_factors: string[];
  optimization_suggestions: string[];
  difficulty_adjustment: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos para requests
export interface CalculateRiskRequest {
  student_id: number;
}

export interface MarkRecommendationCompletedRequest {
  feedback?: string;
  rating?: number;
}

export interface RiskFilters {
  risk_level?: string;
  student_id?: number;
  school_id?: number;
  is_active?: boolean;
}

// Tipos para respuestas de API
export interface RiskCalculationResponse {
  message: string;
  student_id?: number;
  status?: 'calculating' | 'ready';
}

export interface RecommendationCompletionResponse {
  message: string;
  recommendation: LearningRecommendation;
}

export interface AlertAcknowledgmentResponse {
  message: string;
  alert: PredictiveAlert;
} 