'use client';

import React, { useState } from 'react';
import { useRiskPredictions, useCalculateRisk } from '@/lib/api/ai';
import { RiskIndicator } from '@/components/ai/risk-indicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, AlertTriangle, RefreshCw } from 'lucide-react';
import { AcademicRiskPrediction } from '@/types/ai';

export default function ProfessorRiskDashboard() {
  const [filters, setFilters] = useState({
    risk_level: '',
    search: '',
  });
  
  const { data: predictions, isLoading, error, refetch } = useRiskPredictions(filters);
  const calculateRiskMutation = useCalculateRisk();

  const handleCalculateRisk = async (studentId: number) => {
    try {
      await calculateRiskMutation.mutateAsync({ student_id: studentId });
      refetch();
    } catch (error) {
      console.error('Error calculating risk:', error);
    }
  };

  const getRiskStats = () => {
    if (!predictions) return { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
    
    return {
      total: predictions.length,
      low: predictions.filter(p => p.risk_level === 'LOW').length,
      medium: predictions.filter(p => p.risk_level === 'MEDIUM').length,
      high: predictions.filter(p => p.risk_level === 'HIGH').length,
      critical: predictions.filter(p => p.risk_level === 'CRITICAL').length,
    };
  };

  const stats = getRiskStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando predicciones de riesgo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Error al cargar las predicciones de riesgo</p>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Riesgo Académico</h1>
        <p className="text-gray-600 mt-2">
          Monitoreo de riesgo académico de estudiantes y gestión de alertas
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Estudiantes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.low}</div>
            <div className="text-sm text-gray-600">Riesgo Bajo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
            <div className="text-sm text-gray-600">Riesgo Medio</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
            <div className="text-sm text-gray-600">Riesgo Alto</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <div className="text-sm text-gray-600">Riesgo Crítico</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Buscar estudiante</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre o email del estudiante"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Nivel de riesgo</label>
              <Select 
                value={filters.risk_level} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, risk_level: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los niveles</SelectItem>
                  <SelectItem value="LOW">Riesgo Bajo</SelectItem>
                  <SelectItem value="MEDIUM">Riesgo Medio</SelectItem>
                  <SelectItem value="HIGH">Riesgo Alto</SelectItem>
                  <SelectItem value="CRITICAL">Riesgo Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de estudiantes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Estudiantes en Riesgo</h2>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {!predictions || predictions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No se encontraron estudiantes con predicciones de riesgo</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions
              .filter(prediction => 
                !filters.search || 
                prediction.student_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                prediction.student_email.toLowerCase().includes(filters.search.toLowerCase())
              )
              .filter(prediction => 
                !filters.risk_level || 
                prediction.risk_level === filters.risk_level
              )
              .map((prediction) => (
                <Card key={prediction.id} className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{prediction.student_name}</CardTitle>
                        <p className="text-sm text-gray-600">{prediction.student_email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={
                            prediction.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                            prediction.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            prediction.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-green-100 text-green-800 border-green-200'
                          }
                        >
                          {prediction.risk_level}
                        </Badge>
                        {prediction.risk_level === 'CRITICAL' && (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <RiskIndicator prediction={prediction} showDetails={false} />
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Última actualización: {new Date(prediction.last_updated).toLocaleDateString()}
                      </div>
                      <Button
                        onClick={() => handleCalculateRisk(prediction.student)}
                        size="sm"
                        disabled={calculateRiskMutation.isPending}
                      >
                        {calculateRiskMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Calculando...
                          </>
                        ) : (
                          'Recalcular'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Información para Profesores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">Acciones recomendadas:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Revisa estudiantes con riesgo CRÍTICO prioritariamente</li>
                  <li>• Contacta a estudiantes con riesgo ALTO para intervención</li>
                  <li>• Monitorea estudiantes con riesgo MEDIO regularmente</li>
                  <li>• Usa las recomendaciones generadas por IA para guiar intervenciones</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Factores de riesgo:</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Asistencia menor al 80%</li>
                  <li>• Completitud de tareas menor al 70%</li>
                  <li>• Calificaciones promedio menores a 70%</li>
                  <li>• Más de 7 días sin acceso a la plataforma</li>
                  <li>• Múltiples entregas tardías</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 