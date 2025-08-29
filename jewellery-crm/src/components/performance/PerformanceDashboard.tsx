import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../lib/performance-monitor';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  BarChart3,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface PerformanceMetrics {
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  slowestEndpoint: string;
  slowestResponseTime: number;
  cacheHitRate: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    slowestEndpoint: '',
    slowestResponseTime: 0,
    cacheHitRate: 0,
  });
  const [endpointMetrics, setEndpointMetrics] = useState<Map<string, any>>(new Map());
  const [isVisible, setIsVisible] = useState(false);

  const updateMetrics = () => {
    const currentMetrics = performanceMonitor.getMetrics();
    const cacheHitRate = performanceMonitor.getCacheHitRate();
    const endpoints = performanceMonitor.getAllEndpointMetrics();

    setMetrics({
      ...currentMetrics,
      cacheHitRate,
    });
    setEndpointMetrics(endpoints);
  };

  useEffect(() => {
    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const resetMetrics = () => {
    performanceMonitor.reset();
    updateMetrics();
  };

  const exportMetrics = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPerformanceColor = (responseTime: number) => {
    if (responseTime < 200) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHitRateColor = (rate: number) => {
    if (rate > 80) return 'text-green-600';
    if (rate > 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border overflow-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <div className="flex space-x-2">
            <Button onClick={exportMetrics} variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={resetMetrics} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={() => setIsVisible(false)} variant="outline" size="sm">
              ✕
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.apiCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getCacheHitRateColor(metrics.cacheHitRate)}`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {metrics.cacheHits} hits / {metrics.cacheMisses} misses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.averageResponseTime)}`}>
                {metrics.averageResponseTime.toFixed(0)}ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Slowest Endpoint</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium truncate" title={metrics.slowestEndpoint}>
                {metrics.slowestEndpoint || 'N/A'}
              </div>
              <div className={`text-lg font-bold ${getPerformanceColor(metrics.slowestResponseTime)}`}>
                {metrics.slowestResponseTime.toFixed(0)}ms
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Performance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Endpoint Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(endpointMetrics.entries())
                .sort(([, a], [, b]) => b.averageTime - a.averageTime)
                .slice(0, 10)
                .map(([endpoint, data]) => (
                  <div key={endpoint} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={endpoint}>
                        {endpoint}
                      </div>
                      <div className="text-xs text-gray-500">
                        {data.count} calls • Last: {new Date(data.lastCall).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getPerformanceColor(data.averageTime)}`}>
                          {data.averageTime.toFixed(0)}ms avg
                        </div>
                        <div className="text-xs text-gray-500">
                          {data.slowestTime.toFixed(0)}ms max
                        </div>
                      </div>
                      <Badge variant={data.averageTime > 1000 ? "destructive" : "secondary"}>
                        {data.averageTime > 1000 ? "Slow" : "Fast"}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Performance Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Cache hit rate above 80%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Response time under 500ms</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Monitor slow endpoints</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Use optimized fetch hooks</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
