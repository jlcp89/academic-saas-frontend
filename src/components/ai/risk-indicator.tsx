import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AcademicRiskPrediction } from '@/types/ai';

interface RiskIndicatorProps {
  prediction: AcademicRiskPrediction;
  showDetails?: boolean;
  className?: string;
}

export function RiskIndicator({ prediction, showDetails = false, className = '' }: RiskIndicatorProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
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

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW':
        return '🟢';
      case 'MEDIUM':
        return '🟡';
      case 'HIGH':
        return '🟠';
      case 'CRITICAL':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Nivel de Riesgo Académico
          </CardTitle>
          <Badge className={`${getRiskColor(prediction.risk_level)} border`}>
            {getRiskIcon(prediction.risk_level)} {prediction.risk_level}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Barra de progreso de riesgo */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Probabilidad de riesgo</span>
            <span className="font-semibold">{prediction.risk_percentage}%</span>
          </div>
          <Progress 
            value={prediction.risk_percentage} 
            className="h-3"
          />
        </div>

        {/* Confianza de la predicción */}
        <div className="flex justify-between text-sm">
          <span>Confianza de la predicción</span>
          <span className="font-semibold">{Math.round(prediction.confidence * 100)}%</span>
        </div>

        {showDetails && (
          <>
            {/* Factores principales */}
            {prediction.primary_factors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Factores principales:</h4>
                <ul className="text-sm space-y-1">
                  {prediction.primary_factors.map((factor, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Métricas específicas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Asistencia:</span>
                <span className="ml-2 font-semibold">
                  {prediction.attendance_rate ? `${Math.round(prediction.attendance_rate * 100)}%` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tareas completadas:</span>
                <span className="ml-2 font-semibold">
                  {prediction.assignment_completion_rate ? `${Math.round(prediction.assignment_completion_rate * 100)}%` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Calificación promedio:</span>
                <span className="ml-2 font-semibold">
                  {prediction.average_grade ? `${prediction.average_grade.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Entregas tardías:</span>
                <span className="ml-2 font-semibold">{prediction.late_submissions_count}</span>
              </div>
            </div>

            {/* Predicción de resultado */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Predicción:</h4>
              <p className="text-sm text-gray-700">{prediction.predicted_outcome}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 