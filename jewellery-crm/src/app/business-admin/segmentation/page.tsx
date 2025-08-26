'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign, 
  UserCheck, 
  ShoppingBag, 
  Heart, 
  MapPin,
  Calendar,
  Wand2,
  Filter,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';

interface CustomerTag {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string;
}

interface SegmentData {
  name: string;
  count: number;
  percentage: number;
  growth: number;
  value?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface SegmentAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  segments: {
    [key: string]: SegmentData[];
  };
}

const categoryIcons = {
  intent: Target,
  product: ShoppingBag,
  revenue: DollarSign,
  demographic: Users,
  source: MapPin,
  status: UserCheck,
  community: Heart,
  event: Calendar,
  custom: Wand2,
};

const categoryColors = {
  intent: 'bg-blue-100 text-blue-800 border-blue-200',
  product: 'bg-green-100 text-green-800 border-green-200',
  revenue: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  demographic: 'bg-purple-100 text-purple-800 border-purple-200',
  source: 'bg-orange-100 text-orange-800 border-orange-200',
  status: 'bg-red-100 text-red-800 border-red-200',
  community: 'bg-pink-100 text-pink-800 border-pink-200',
  event: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  custom: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function CustomerSegmentationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [tagsByCategory, setTagsByCategory] = useState<{ [key: string]: CustomerTag[] }>({});
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [analytics, setAnalytics] = useState<SegmentAnalytics | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [categoriesRes, tagsRes, customersRes] = await Promise.all([
        apiService.getCustomerTagCategories(),
        apiService.getCustomerTagsByCategory(),
        apiService.getClients({ page: 1, limit: 1000 })
      ]);

      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }

      if (tagsRes.success) {
        setTagsByCategory(tagsRes.data || {});
      }

      if (customersRes.success) {
        const customerData = Array.isArray(customersRes.data) ? customersRes.data : customersRes.data?.results || [];
        setCustomers(customerData);
        generateAnalytics(customerData, tagsRes.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch segmentation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalytics = (customerData: any[], tagsData: { [key: string]: CustomerTag[] }) => {
    const totalCustomers = customerData.length;
    const activeCustomers = customerData.filter(c => c.status === 'customer').length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = customerData.filter(c => 
      new Date(c.created_at) >= thisMonth
    ).length;

    const segments: { [key: string]: SegmentData[] } = {};

    // Generate segment data for each category
    Object.keys(tagsData).forEach(category => {
      const categoryTags = tagsData[category] || [];
      const categorySegments: SegmentData[] = [];

      categoryTags.forEach(tag => {
        // Count customers with this tag (simulated for demo)
        const taggedCustomers = Math.floor(Math.random() * totalCustomers * 0.3);
        const percentage = totalCustomers > 0 ? (taggedCustomers / totalCustomers) * 100 : 0;
        const growth = Math.floor(Math.random() * 20) - 10; // Random growth between -10% and 10%

        categorySegments.push({
          name: tag.name,
          count: taggedCustomers,
          percentage,
          growth,
          value: category === 'revenue' ? taggedCustomers * 1000 + Math.floor(Math.random() * 5000) : undefined,
          icon: categoryIcons[category as keyof typeof categoryIcons] || Users,
          color: categoryColors[category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'
        });
      });

      // Sort by count descending
      categorySegments.sort((a, b) => b.count - a.count);
      segments[category] = categorySegments;
    });

    // Add status-based segments if not already present
    if (!segments.status) {
      const statusCounts = {
        customer: customerData.filter(c => c.status === 'customer').length,
        lead: customerData.filter(c => c.status === 'lead').length,
        prospect: customerData.filter(c => c.status === 'prospect').length,
        inactive: customerData.filter(c => c.status === 'inactive').length,
        exhibition: customerData.filter(c => c.status === 'exhibition').length,
      };

      segments.status = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: totalCustomers > 0 ? (count / totalCustomers) * 100 : 0,
        growth: Math.floor(Math.random() * 20) - 10,
        icon: UserCheck,
        color: categoryColors.status
      }));
    }

    setAnalytics({
      totalCustomers,
      activeCustomers,
      newThisMonth,
      segments
    });
  };

  const renderSegmentCard = (segment: SegmentData, categoryKey: string) => {
    const Icon = segment.icon;
    const growthIcon = segment.growth > 0 ? ArrowUpRight : segment.growth < 0 ? ArrowDownRight : Minus;
    const growthColor = segment.growth > 0 ? 'text-green-600' : segment.growth < 0 ? 'text-red-600' : 'text-gray-600';

    return (
      <Card key={segment.name} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${segment.color.split(' ')[0]} ${segment.color.split(' ')[0]}/10`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-text-primary">{segment.name}</h4>
                <p className="text-xs text-text-secondary capitalize">{categoryKey.replace('_', ' ')}</p>
              </div>
            </div>
            <Badge variant="outline" className={segment.color}>
              {segment.percentage.toFixed(1)}%
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-primary">{segment.count.toLocaleString()}</span>
              <div className={`flex items-center space-x-1 ${growthColor}`}>
                {React.createElement(growthIcon, { className: 'w-3 h-3' })}
                <span className="text-xs font-medium">{Math.abs(segment.growth)}%</span>
              </div>
            </div>
            
            <Progress value={segment.percentage} className="h-2" />
            
            {segment.value && (
              <p className="text-xs text-text-secondary">
                Avg. Value: ${segment.value.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading customer segmentation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">Customer Segmentation</h1>
          <p className="text-text-secondary mt-1">Analyze customer segments and behavior patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Advanced Filters
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Total Customers</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.totalCustomers.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Active Customers</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.activeCustomers.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">New This Month</p>
                  <p className="text-2xl font-bold text-text-primary">{analytics.newThisMonth.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Conversion Rate</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {analytics.totalCustomers > 0 ? ((analytics.activeCustomers / analytics.totalCustomers) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segmentation Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Filter */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Segment Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedCategory('all')}
            >
              <PieChart className="w-4 h-4 mr-2" />
              All Categories
            </Button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.value as keyof typeof categoryIcons] || Users;
              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Segments Grid */}
        <div className="lg:col-span-3">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.slice(0, 4).map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                  {cat.label.split(' ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="space-y-6">
                {Object.entries(analytics?.segments || {}).map(([categoryKey, segments]) => (
                  <div key={categoryKey}>
                    <h3 className="text-lg font-semibold text-text-primary mb-3 capitalize">
                      {categoryKey.replace('_', ' ')} Segments
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {segments.slice(0, 6).map((segment) => renderSegmentCard(segment, categoryKey))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {Object.entries(analytics?.segments || {}).map(([categoryKey, segments]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary capitalize">
                      {categoryKey.replace('_', ' ')} Segments
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {segments.length} segments
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map((segment) => renderSegmentCard(segment, categoryKey))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Insights Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Segmentation Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Top Growing Segment</h4>
              <p className="text-sm text-blue-700">
                High-value customers show 15% growth this month, driven by premium product interest.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Conversion Opportunity</h4>
              <p className="text-sm text-green-700">
                35% of leads show strong purchase intent - ideal for targeted campaigns.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">At-Risk Segment</h4>
              <p className="text-sm text-orange-700">
                Inactive customers (12%) need re-engagement campaigns to prevent churn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
