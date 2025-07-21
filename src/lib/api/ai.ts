import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AcademicRiskPrediction,
  LearningRecommendation,
  PredictiveAlert,
  RiskDashboard,
  StudentRiskSummary,
  AssignmentIntelligence,
  CalculateRiskRequest,
  MarkRecommendationCompletedRequest,
  RiskFilters,
  RiskCalculationResponse,
  RecommendationCompletionResponse,
  AlertAcknowledgmentResponse
} from '@/types/ai';
import { getClientApiBaseUrl } from '../constants';

// API Functions
export class AiApi {
  private baseURL = `${getClientApiBaseUrl()}/api/ai`;

  constructor(private getToken: () => string | undefined) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Obtener predicciones de riesgo
  async getRiskPredictions(filters?: RiskFilters): Promise<AcademicRiskPrediction[]> {
    const params = new URLSearchParams();
    if (filters?.risk_level) params.append('risk_level', filters.risk_level);
    if (filters?.student_id) params.append('student_id', filters.student_id.toString());
    if (filters?.school_id) params.append('school_id', filters.school_id.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const queryString = params.toString();
    return this.request<AcademicRiskPrediction[]>(`/risk-predictions/${queryString ? `?${queryString}` : ''}`);
  }

  // Obtener mi predicción de riesgo (estudiante)
  async getMyRisk(): Promise<AcademicRiskPrediction> {
    return this.request<AcademicRiskPrediction>('/risk-predictions/my_risk/');
  }

  // Calcular riesgo para un estudiante
  async calculateRisk(data: CalculateRiskRequest): Promise<RiskCalculationResponse> {
    return this.request<RiskCalculationResponse>('/risk-predictions/calculate_risk/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar todas las predicciones
  async updateAllPredictions(): Promise<RiskCalculationResponse> {
    return this.request<RiskCalculationResponse>('/risk-predictions/update_all/', {
      method: 'POST',
    });
  }

  // Dashboard de riesgo para estudiante
  async getStudentRiskDashboard(): Promise<{
    risk_prediction: AcademicRiskPrediction;
    recent_recommendations: LearningRecommendation[];
    active_alerts: PredictiveAlert[];
    status: 'calculating' | 'ready';
  }> {
    return this.request('/student-risk-dashboard/');
  }

  // Dashboard de riesgo para clase
  async getClassRiskOverview(sectionId: number): Promise<RiskDashboard> {
    return this.request<RiskDashboard>(`/dashboard/class/${sectionId}/`);
  }

  // Resumen de riesgo de estudiante
  async getStudentRiskSummary(studentId?: number): Promise<StudentRiskSummary> {
    const url = studentId 
      ? `/dashboard/student/${studentId}/`
      : '/dashboard/student/me/';
    return this.request<StudentRiskSummary>(url);
  }

  // Recomendaciones de aprendizaje
  async getLearningRecommendations(): Promise<LearningRecommendation[]> {
    return this.request<LearningRecommendation[]>('/learning-recommendations/');
  }

  // Marcar recomendación como completada
  async markRecommendationCompleted(
    recommendationId: number, 
    data: MarkRecommendationCompletedRequest
  ): Promise<RecommendationCompletionResponse> {
    return this.request<RecommendationCompletionResponse>(`/recommendations/${recommendationId}/complete/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Alertas predictivas
  async getPredictiveAlerts(): Promise<PredictiveAlert[]> {
    return this.request<PredictiveAlert[]>('/predictive-alerts/');
  }

  // Reconocer alerta
  async acknowledgeAlert(alertId: number): Promise<AlertAcknowledgmentResponse> {
    return this.request<AlertAcknowledgmentResponse>(`/alerts/${alertId}/acknowledge/`, {
      method: 'POST',
    });
  }

  // Inteligencia de tareas
  async getAssignmentIntelligence(assignmentId: number): Promise<AssignmentIntelligence> {
    return this.request<AssignmentIntelligence>(`/assignment-intelligence/${assignmentId}/`);
  }

  // Analizar inteligencia de tarea
  async analyzeAssignmentIntelligence(assignmentId: number): Promise<AssignmentIntelligence> {
    return this.request<AssignmentIntelligence>(`/assignment-intelligence/${assignmentId}/analyze/`, {
      method: 'POST',
    });
  }
}

// Hook to get AI API instance
export function useAiApi() {
  const { data: session } = useSession();
  return new AiApi(() => session?.accessToken);
}

// React Query hooks
export function useRiskPredictions(filters?: RiskFilters) {
  const api = useAiApi();
  return useQuery({
    queryKey: ['risk-predictions', filters],
    queryFn: () => api.getRiskPredictions(filters),
  });
}

export function useMyRisk() {
  const api = useAiApi();
  return useQuery({
    queryKey: ['my-risk'],
    queryFn: () => api.getMyRisk(),
  });
}

export function useStudentRiskDashboard() {
  const api = useAiApi();
  return useQuery({
    queryKey: ['student-risk-dashboard'],
    queryFn: () => api.getStudentRiskDashboard(),
  });
}

export function useClassRiskOverview(sectionId: number) {
  const api = useAiApi();
  return useQuery({
    queryKey: ['class-risk-overview', sectionId],
    queryFn: () => api.getClassRiskOverview(sectionId),
    enabled: !!sectionId,
  });
}

export function useStudentRiskSummary(studentId?: number) {
  const api = useAiApi();
  return useQuery({
    queryKey: ['student-risk-summary', studentId],
    queryFn: () => api.getStudentRiskSummary(studentId),
  });
}

export function useLearningRecommendations() {
  const api = useAiApi();
  return useQuery({
    queryKey: ['learning-recommendations'],
    queryFn: () => api.getLearningRecommendations(),
  });
}

export function usePredictiveAlerts() {
  const api = useAiApi();
  return useQuery({
    queryKey: ['predictive-alerts'],
    queryFn: () => api.getPredictiveAlerts(),
  });
}

export function useAssignmentIntelligence(assignmentId: number) {
  const api = useAiApi();
  return useQuery({
    queryKey: ['assignment-intelligence', assignmentId],
    queryFn: () => api.getAssignmentIntelligence(assignmentId),
    enabled: !!assignmentId,
  });
}

// Mutations
export function useCalculateRisk() {
  const api = useAiApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CalculateRiskRequest) => api.calculateRisk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['my-risk'] });
    },
  });
}

export function useUpdateAllPredictions() {
  const api = useAiApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.updateAllPredictions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['my-risk'] });
      queryClient.invalidateQueries({ queryKey: ['student-risk-dashboard'] });
    },
  });
}

export function useMarkRecommendationCompleted() {
  const api = useAiApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ recommendationId, data }: { recommendationId: number; data: MarkRecommendationCompletedRequest }) =>
      api.markRecommendationCompleted(recommendationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['student-risk-dashboard'] });
    },
  });
}

export function useAcknowledgeAlert() {
  const api = useAiApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: number) => api.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictive-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['student-risk-dashboard'] });
    },
  });
}

export function useAnalyzeAssignmentIntelligence() {
  const api = useAiApi();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assignmentId: number) => api.analyzeAssignmentIntelligence(assignmentId),
    onSuccess: (data, assignmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-intelligence', assignmentId] });
    },
  });
} 