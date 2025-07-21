import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LearningRecommendation } from '@/types/ai';
import { useMarkRecommendationCompleted } from '@/lib/api/ai';

interface LearningRecommendationsProps {
  recommendations: LearningRecommendation[];
  className?: string;
}

export function LearningRecommendations({ recommendations, className = '' }: LearningRecommendationsProps) {
  const [selectedRecommendation, setSelectedRecommendation] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(0);

  const markCompletedMutation = useMarkRecommendationCompleted();

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'STUDY_RESOURCE':
        return '📚';
      case 'PRACTICE_EXERCISE':
        return '✏️';
      case 'PEER_COLLABORATION':
        return '👥';
      case 'TEACHER_CONSULTATION':
        return '👨‍🏫';
      case 'LEARNING_STRATEGY':
        return '🎯';
      default:
        return '💡';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleMarkCompleted = async (recommendationId: number) => {
    try {
      await markCompletedMutation.mutateAsync({
        recommendationId,
        data: {
          feedback: feedback.trim() || undefined,
          rating: rating > 0 ? rating : undefined,
        },
      });
      
      alert('Recomendación marcada como completada');
      setSelectedRecommendation(null);
      setFeedback('');
      setRating(0);
    } catch (error) {
      alert('Error al marcar como completada');
    }
  };

  const openCompletionModal = (recommendationId: number) => {
    setSelectedRecommendation(recommendationId);
  };

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No hay recomendaciones disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Recomendaciones de Aprendizaje</h3>
      
      {recommendations.map((recommendation) => (
        <Card key={recommendation.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getRecommendationIcon(recommendation.recommendation_type)}</span>
                <div>
                  <CardTitle className="text-base">{recommendation.title}</CardTitle>
                  {recommendation.subject_name && (
                    <p className="text-sm text-gray-600">{recommendation.subject_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(recommendation.difficulty_level)}>
                  {recommendation.difficulty_level}
                </Badge>
                {recommendation.is_completed && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✅ Completada
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">{recommendation.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Impacto esperado:</span>
                <span className="ml-2 font-semibold">{recommendation.expected_impact_percentage}%</span>
              </div>
              <div>
                <span className="text-gray-600">Tiempo requerido:</span>
                <span className="ml-2 font-semibold">{recommendation.time_requirement}</span>
              </div>
            </div>

            {/* Recursos */}
            {recommendation.resources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recursos:</h4>
                <div className="space-y-2">
                  {recommendation.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      <span className="mr-2">
                        {resource.type === 'video' ? '🎥' : 
                         resource.type === 'exercise' ? '📝' : 
                         resource.type === 'guide' ? '📖' : 
                         resource.type === 'tool' ? '🛠️' : '🔗'}
                      </span>
                      {resource.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de acción */}
            {!recommendation.is_completed && (
              <Button
                onClick={() => openCompletionModal(recommendation.id)}
                className="w-full"
                disabled={markCompletedMutation.isPending}
              >
                {markCompletedMutation.isPending ? 'Procesando...' : 'Marcar como completada'}
              </Button>
            )}

            {/* Feedback si está completada */}
            {recommendation.is_completed && recommendation.student_feedback && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Tu feedback:</h4>
                <p className="text-sm text-gray-700">{recommendation.student_feedback}</p>
                {recommendation.effectiveness_rating && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Calificación: </span>
                    <span className="text-sm font-semibold">
                      {'⭐'.repeat(recommendation.effectiveness_rating)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Modal de completar recomendación */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Completar Recomendación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Feedback (opcional):</label>
                <Input
                  value={feedback}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeedback(e.target.value)}
                  placeholder="¿Cómo te fue con esta recomendación?"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Calificación (opcional):</label>
                <div className="flex space-x-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setSelectedRecommendation(null);
                    setFeedback('');
                    setRating(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleMarkCompleted(selectedRecommendation)}
                  className="flex-1"
                  disabled={markCompletedMutation.isPending}
                >
                  {markCompletedMutation.isPending ? 'Procesando...' : 'Completar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 