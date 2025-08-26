import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScopedVisibility, getScopeDisplayText } from '@/lib/scoped-visibility';
import { Shield, Users, Store, User } from 'lucide-react';

interface ScopeIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const ScopeIndicator: React.FC<ScopeIndicatorProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { userScope, canAccessAllData, canAccessStoreData, canAccessOwnData } = useScopedVisibility();

  const getScopeIcon = () => {
    switch (userScope.type) {
      case 'all':
        return <Shield className="w-4 h-4" />;
      case 'store':
        return <Store className="w-4 h-4" />;
      case 'own':
        return <User className="w-4 h-4" />;
      case 'none':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getScopeColor = () => {
    switch (userScope.type) {
      case 'all':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'store':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'own':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'none':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!showDetails) {
    return (
      <Badge 
        variant="outline" 
        className={`flex items-center gap-1 ${getScopeColor()} ${className}`}
      >
        {getScopeIcon()}
        {getScopeDisplayText(userScope)}
      </Badge>
    );
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getScopeIcon()}
          Access Scope
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Scope:</span>
          <Badge variant="outline" className={getScopeColor()}>
            {getScopeDisplayText(userScope)}
          </Badge>
        </div>
        
        <div className="text-xs text-gray-500">
          {userScope.description}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>All Data Access:</span>
            <Badge variant={canAccessAllData ? "default" : "secondary"}>
              {canAccessAllData ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span>Store Data Access:</span>
            <Badge variant={canAccessStoreData ? "default" : "secondary"}>
              {canAccessStoreData ? "Yes" : "No"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span>Own Data Access:</span>
            <Badge variant={canAccessOwnData ? "default" : "secondary"}>
              {canAccessOwnData ? "Yes" : "No"}
            </Badge>
          </div>
        </div>
        
        {userScope.filters && Object.keys(userScope.filters).length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs text-gray-500 mb-1">Active Filters:</div>
            <div className="space-y-1">
              {Object.entries(userScope.filters).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScopeIndicator; 