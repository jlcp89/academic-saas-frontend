import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PredictiveAlert } from '@/types/ai';
import { useAcknowledgeAlert } from '@/lib/api/ai';

interface PredictiveAlertsProps {
  alerts: PredictiveAlert[];
  className?: string;
}

export function PredictiveAlerts({ alerts, className = '' }: PredictiveAlertsProps) {
  const acknowledgeMutation = useAcknowledgeAlert();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'ACADEMIC_RISK':
        return '⚠️';
      case 'ENGAGEMENT_DROP':
        return '📉';
      case 'PERFORMANCE_TREND':
        return '📊';
      case 'ASSIGNMENT_OVERDUE':
        return '⏰';
      case 'LEARNING_GAP':
        return '🕳️';
      default:
        return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'ACADEMIC_RISK':
        return 'Riesgo Académico';
      case 'ENGAGEMENT_DROP':
        return 'Caída de Participación';
      case 'PERFORMANCE_TREND':
        return 'Tendencia de Rendimiento';
      case 'ASSIGNMENT_OVERDUE':
        return 'Tarea Vencida';
      case 'LEARNING_GAP':
        return 'Brecha de Aprendizaje';
      default:
        return type;
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      await acknowledgeMutation.mutateAsync(alertId);
      alert('Alerta reconocida');
    } catch (error) {
      alert('Error al reconocer la alerta');
    }
  };

  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No hay alertas activas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Alertas Predictivas</h3>
      
      {alerts.map((alert) => (
        <Card 
          key={alert.id} 
          className={`border-l-4 ${
            alert.priority === 'CRITICAL' ? 'border-l-red-500' :
            alert.priority === 'HIGH' ? 'border-l-orange-500' :
            alert.priority === 'MEDIUM' ? 'border-l-yellow-500' :
            'border-l-blue-500'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getAlertIcon(alert.alert_type)}</span>
                <div>
                  <CardTitle className="text-base">
                    {getAlertTypeLabel(alert.alert_type)}
                  </CardTitle>
                  {alert.subject_name && (
                    <p className="text-sm text-gray-600">{alert.subject_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(alert.priority)}>
                  {alert.priority}
                </Badge>
                {alert.acknowledged_by && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✅ Reconocida
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">{alert.predicted_outcome}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Confianza:</span>
                <span className="ml-2 font-semibold">{alert.confidence_percentage}%</span>
              </div>
              <div>
                <span className="text-gray-600">Fecha:</span>
                <span className="ml-2 font-semibold">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Acciones recomendadas */}
            {alert.recommended_actions && Array.isArray(alert.recommended_actions) && alert.recommended_actions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Acciones recomendadas:</h4>
                <ul className="text-sm space-y-1">
                  {alert.recommended_actions.map((action, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      {typeof action === 'string' ? action : JSON.stringify(action)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidencia de soporte */}
            {alert.supporting_evidence && Object.keys(alert.supporting_evidence).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Evidencia:</h4>
                <div className="text-sm space-y-1">
                  {Object.entries(alert.supporting_evidence).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-semibold">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de reconocimiento */}
            {!alert.acknowledged_by && (
              <Button
                onClick={() => handleAcknowledge(alert.id)}
                className="w-full"
                disabled={acknowledgeMutation.isPending}
              >
                {acknowledgeMutation.isPending ? 'Procesando...' : 'Reconocer Alerta'}
              </Button>
            )}

            {/* Información de reconocimiento */}
            {alert.acknowledged_by && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Reconocida por:</h4>
                <p className="text-sm text-gray-700">
                  {alert.acknowledged_by_name || 'Usuario'}
                </p>
                {alert.acknowledged_at && (
                  <p className="text-sm text-gray-600">
                    {new Date(alert.acknowledged_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 