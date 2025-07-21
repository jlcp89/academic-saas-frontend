'use client';

import React from 'react';
import { useStudentRiskDashboard } from '@/lib/api/ai';
import { RiskIndicator } from '@/components/ai/risk-indicator';
import { LearningRecommendations } from '@/components/ai/learning-recommendations';
import { PredictiveAlerts } from '@/components/ai/predictive-alerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUpdateAllPredictions } from '@/lib/api/ai';
import { Loader2, RefreshCw } from 'lucide-react';

export default function AIRiskDashboard() {
  const { data: dashboardData, isLoading, error, refetch } = useStudentRiskDashboard();
  const updatePredictionsMutation = useUpdateAllPredictions();

  const handleRefresh = async () => {
    try {
      await updatePredictionsMutation.mutateAsync();
      refetch();
    } catch (error) {
      console.error('Error refreshing predictions:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando análisis de riesgo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Error al cargar el dashboard de riesgo</p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">No se encontraron datos de riesgo</p>
            <Button onClick={handleRefresh} disabled={updatePredictionsMutation.isPending}>
              {updatePredictionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Calcular Riesgo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { risk_prediction, recent_recommendations, active_alerts, status } = dashboardData;

  if (status === 'calculating') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Calculando tu riesgo académico</h2>
            <p className="text-gray-600 mb-4">
              Estamos analizando tus datos para generar predicciones personalizadas.
              Esto puede tomar unos minutos.
            </p>
            <Button onClick={() => refetch()}>Verificar estado</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard de Riesgo Académico</h1>
            <p className="text-gray-600 mt-2">
              Análisis inteligente de tu rendimiento académico y recomendaciones personalizadas
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={updatePredictionsMutation.isPending}
          >
            {updatePredictionsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal - Indicador de riesgo */}
        <div className="lg:col-span-2">
          <RiskIndicator 
            prediction={risk_prediction} 
            showDetails={true}
            className="mb-6"
          />

          {/* Sugerencias de mejora */}
          <Card>
            <CardHeader>
              <CardTitle>Sugerencias de Mejora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {risk_prediction.primary_factors.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium">{factor}</h4>
                      <p className="text-sm text-gray-600">
                        {factor === 'Asistencia baja' && 'Considera mejorar tu asistencia a clases para mantener un mejor rendimiento.'}
                        {factor === 'Tareas incompletas' && 'Completa todas las tareas asignadas para mejorar tus calificaciones.'}
                        {factor === 'Calificaciones bajas' && 'Revisa los conceptos fundamentales y busca ayuda adicional si es necesario.'}
                        {factor === 'Baja participación' && 'Participa más activamente en las discusiones de clase.'}
                        {factor === 'Entregas tardías' && 'Organiza mejor tu tiempo para entregar las tareas a tiempo.'}
                        {factor === 'Inactividad reciente' && 'Mantén un acceso regular a la plataforma para estar al día.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna lateral - Alertas y recomendaciones */}
        <div className="space-y-6">
          {/* Alertas activas */}
          <PredictiveAlerts alerts={active_alerts} />

          {/* Recomendaciones recientes */}
          <LearningRecommendations recommendations={recent_recommendations} />
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">¿Cómo funciona?</h4>
                <p className="text-gray-600">
                  Nuestro sistema de IA analiza múltiples factores de tu rendimiento académico 
                  para predecir posibles riesgos y generar recomendaciones personalizadas.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Factores analizados</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Asistencia a clases</li>
                  <li>• Completitud de tareas</li>
                  <li>• Calificaciones promedio</li>
                  <li>• Participación en clase</li>
                  <li>• Tiempo de estudio</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Actualización</h4>
                <p className="text-gray-600">
                  Las predicciones se actualizan automáticamente cada día. 
                  Puedes forzar una actualización manual usando el botón "Actualizar".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 