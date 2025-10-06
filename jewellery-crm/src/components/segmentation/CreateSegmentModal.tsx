'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  X, 
  Target, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Calendar, 
  MapPin,
  Wand2,
  Save,
  Eye,
  Filter,
  Zap,
  Sparkles
} from 'lucide-react';

interface CreateSegmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSegmentCreated?: (segment: any) => void;
}

interface Criteria {
  id: string;
  field: string;
  operator: string;
  value: string;
  type: 'demographic' | 'behavioral' | 'transactional' | 'engagement';
}

const fieldOptions = {
  demographic: [
    { value: 'age', label: 'Age', icon: Users },
    { value: 'location', label: 'Location', icon: MapPin },
    { value: 'gender', label: 'Gender', icon: Users },
  ],
  behavioral: [
    { value: 'purchase_frequency', label: 'Purchase Frequency', icon: ShoppingBag },
    { value: 'last_purchase', label: 'Last Purchase Date', icon: Calendar },
    { value: 'browsing_behavior', label: 'Browsing Behavior', icon: Eye },
  ],
  transactional: [
    { value: 'total_spent', label: 'Total Spent', icon: DollarSign },
    { value: 'average_order', label: 'Average Order Value', icon: DollarSign },
    { value: 'product_category', label: 'Product Category', icon: ShoppingBag },
  ],
  engagement: [
    { value: 'email_opens', label: 'Email Opens', icon: Target },
    { value: 'website_visits', label: 'Website Visits', icon: Eye },
    { value: 'social_engagement', label: 'Social Engagement', icon: Users },
  ],
};

const operatorOptions = {
  numeric: ['equals', 'greater_than', 'less_than', 'between'],
  text: ['equals', 'contains', 'starts_with', 'ends_with'],
  date: ['equals', 'after', 'before', 'between'],
  boolean: ['equals', 'is_true', 'is_false'],
};

export default function CreateSegmentModal({ open, onOpenChange, onSegmentCreated }: CreateSegmentModalProps) {
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [activeTab, setActiveTab] = useState<'demographic'>('demographic');

  const addCriteria = (type: Criteria['type']) => {
    const newCriteria: Criteria = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: '',
      type,
    };
    setCriteria([...criteria, newCriteria]);
  };

  const removeCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriteria = (id: string, updates: Partial<Criteria>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSave = () => {
    const segment = {
      name: segmentName,
      description: segmentDescription,
      criteria,
      createdAt: new Date().toISOString(),
    };
    
    onSegmentCreated?.(segment);
    onOpenChange(false);
    
    // Reset form
    setSegmentName('');
    setSegmentDescription('');
    setCriteria([]);
  };

  const getFieldType = (field: string) => {
    if (['age', 'total_spent', 'average_order', 'purchase_frequency'].includes(field)) return 'numeric';
    if (['last_purchase'].includes(field)) return 'date';
    if (['email_opens', 'website_visits'].includes(field)) return 'boolean';
    return 'text';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Create New Customer Segment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Segment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="segment-name">Segment Name</Label>
                  <Input
                    id="segment-name"
                    placeholder="e.g., High-Value Customers"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment-description">Description</Label>
                  <Input
                    id="segment-description"
                    placeholder="Brief description of this segment"
                    value={segmentDescription}
                    onChange={(e) => setSegmentDescription(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criteria Builder */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Segment Criteria</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {criteria.length} criteria added
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="demographic" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Demographic
                  </TabsTrigger>
                  <TabsTrigger value="behavioral" className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Behavioral
                  </TabsTrigger>
                  <TabsTrigger value="transactional" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Transactional
                  </TabsTrigger>
                  <TabsTrigger value="engagement" className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Engagement
                  </TabsTrigger>
                </TabsList>

                {Object.entries(fieldOptions).map(([type, fields]) => (
                  <TabsContent key={type} value={type} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {fields.map((field) => (
                        <Button
                          key={field.value}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                          onClick={() => addCriteria(type as Criteria['type'])}
                        >
                          <field.icon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">{field.label}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Criteria List */}
              {criteria.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">Applied Criteria</h4>
                  {criteria.map((criterion) => {
                    const fieldOption = Object.values(fieldOptions)
                      .flat()
                      .find(f => f.value === criterion.field);
                    
                    return (
                      <div key={criterion.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {fieldOption && <fieldOption.icon className="w-4 h-4 text-blue-600" />}
                            <span className="font-medium">{fieldOption?.label || criterion.field}</span>
                            <Badge variant="outline" className="text-xs">
                              {criterion.type}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriteria(criterion.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Field</Label>
                            <Select
                              value={criterion.field}
                              onValueChange={(value) => updateCriteria(criterion.id, { field: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(fieldOptions)
                                  .flat()
                                  .map((field) => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Operator</Label>
                            <Select
                              value={criterion.operator}
                              onValueChange={(value) => updateCriteria(criterion.id, { operator: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {operatorOptions[getFieldType(criterion.field) as keyof typeof operatorOptions]?.map((op) => (
                                  <SelectItem key={op} value={op}>
                                    {op.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Value</Label>
                            <Input
                              placeholder="Enter value"
                              value={criterion.value}
                              onChange={(e) => updateCriteria(criterion.id, { value: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {criteria.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Segment Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{segmentName || 'Untitled Segment'}</h4>
                    <p className="text-sm text-gray-600">{segmentDescription || 'No description provided'}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {criteria.map((criterion) => {
                      const fieldOption = Object.values(fieldOptions)
                        .flat()
                        .find(f => f.value === criterion.field);
                      
                      return (
                        <Badge key={criterion.id} variant="secondary" className="text-xs">
                          {fieldOption?.label} {criterion.operator} {criterion.value}
                        </Badge>
                      );
                    })}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Estimated customers: <span className="font-semibold text-blue-600">~1,250</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!segmentName || criteria.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Create Segment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
