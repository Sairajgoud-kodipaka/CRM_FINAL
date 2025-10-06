'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  message: string;
  details?: any;
}

export function ApiConnectionTest() {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testEndpoints = [
    { name: 'Health Check', url: '/api/health/' },
    { name: 'Assignments', url: '/api/telecalling/assignments/' },
    { name: 'Dashboard', url: '/api/telecalling/dashboard/me/' },
    { name: 'Customer Visits', url: '/api/telecalling/customer-visits/' },
  ];

  const testApiConnection = async () => {
    setIsRunning(true);
    setResults([]);

    for (const endpoint of testEndpoints) {
      // Add loading state
      setResults(prev => [...prev, {
        endpoint: endpoint.name,
        status: 'loading',
        message: 'Testing...'
      }]);

      try {
        const response = await apiService.get(endpoint.url);
        
        setResults(prev => prev.map(r => 
          r.endpoint === endpoint.name 
            ? {
                endpoint: endpoint.name,
                status: 'success',
                message: `✅ Success (${response.status})`,
                details: response.data
              }
            : r
        ));
      } catch (error: any) {
        let message = '❌ Failed';
        let details = null;

        if (error.message?.includes('Failed to fetch')) {
          message = '❌ Connection Failed - Backend not running?';
        } else if (error.response?.status === 401) {
          message = '⚠️ Authentication Required (Expected)';
          details = 'This endpoint requires login';
        } else if (error.response?.status === 403) {
          message = '⚠️ Access Denied (Expected)';
          details = 'This endpoint requires proper permissions';
        } else if (error.response?.status === 404) {
          message = '❌ Not Found - Endpoint missing';
        } else {
          message = `❌ Error: ${error.message}`;
          details = error.response?.data || error.message;
        }

        setResults(prev => prev.map(r => 
          r.endpoint === endpoint.name 
            ? {
                endpoint: endpoint.name,
                status: 'error',
                message,
                details
              }
            : r
        ));
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'loading':
        return <Badge className="bg-blue-100 text-blue-800">Loading</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">API Connection Test</h3>
        <Button 
          onClick={testApiConnection} 
          disabled={isRunning}
          className="bg-primary-500 hover:bg-primary-600 text-white"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(result.status)}
              <div>
                <p className="font-medium text-text-primary">{result.endpoint}</p>
                <p className="text-sm text-text-secondary">{result.message}</p>
                {result.details && (
                  <details className="mt-1">
                    <summary className="text-xs text-text-muted cursor-pointer">
                      View Details
                    </summary>
                    <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            {getStatusBadge(result.status)}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• If "Connection Failed": Start backend with <code>python manage.py runserver</code></li>
            <li>• If "Authentication Required": This is normal for protected endpoints</li>
            <li>• If "Not Found": Check if the endpoint exists in backend URLs</li>
            <li>• If "Access Denied": Check user permissions and role</li>
          </ul>
        </div>
      )}
    </Card>
  );
}
