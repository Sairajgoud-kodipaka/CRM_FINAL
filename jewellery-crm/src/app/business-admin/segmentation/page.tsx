'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  Minus,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Search,
  Settings,
  MoreHorizontal,
  RefreshCw,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  Info,
  Star,
  Clock,
  Mail,
  Phone,
  MapPin as LocationIcon,
  Grid3X3,
  List,
  Tag
} from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { useAuth } from '@/hooks/useAuth';
import SegmentDetailsModal from '@/components/segmentation/SegmentDetailsModal';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  percentage: number;
  growth: number;
  tags: string[];
  category: 'demographic' | 'behavioral' | 'transactional' | 'engagement';
  lastUpdated: string;
}

interface SegmentationData {
  segments: CustomerSegment[];
  totalCustomers: number;
  activeCustomers: number;
  viewType: 'table' | 'cards';
}

// Backend API response structure
interface BackendAnalytics {
  total_customers: number;
  active_customers: number;
  segment_counts: { [key: string]: number };
  segment_growth: { [key: string]: number };
  insights: {
    top_growing_segment: {
      name: string;
      count: number;
      growth: number;
    };
    conversion_opportunity: {
      leads: number;
      conversion_rate: number;
    };
    at_risk_customers: {
      count: number;
      percentage: number;
    };
  };
}

export default function CustomerSegmentationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [segmentationData, setSegmentationData] = useState<SegmentationData | null>(null);
  const [viewType, setViewType] = useState<'table' | 'cards'>('table');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchSegmentationData();
  }, []);

  const fetchSegmentationData = async () => {
    try {
      setLoading(true);

      // Fetch real segmentation data from API
      const response = await apiService.getSegmentationAnalytics();

      if (response.success && response.data) {
        const analytics: BackendAnalytics = response.data.analytics;

        // Transform backend data to frontend format
        const segments: CustomerSegment[] = Object.entries(analytics.segment_counts).map(([segmentName, count]) => {
          const percentage = analytics.total_customers > 0 ? (count / analytics.total_customers) * 100 : 0;
          const growth = analytics.segment_growth[segmentName] || 0;

          // Map segment names to categories and tags
          const segmentMapping = {
            'High-Value Buyer': { category: 'transactional' as const, tags: ['VIP', 'Premium', 'High-Spend'] },
            'Mid-Tier Buyer': { category: 'transactional' as const, tags: ['Regular', 'Mid-Spend'] },
            'Budget Buyer': { category: 'transactional' as const, tags: ['Budget', 'Price-Conscious'] },
            'Frequent Buyer': { category: 'behavioral' as const, tags: ['Loyal', 'Regular', 'Repeat'] },
            'At-Risk Customer': { category: 'behavioral' as const, tags: ['Churn-Risk', 'Inactive', 'Re-engagement'] },
            'Occasion Shopper': { category: 'demographic' as const, tags: ['Wedding', 'Occasion', 'Event'] },
            'Diamond Lover': { category: 'behavioral' as const, tags: ['Diamond', 'Luxury', 'Premium'] },
            'Gold Investor': { category: 'behavioral' as const, tags: ['Gold', 'Investment', 'Traditional'] },
            'Online Buyer': { category: 'behavioral' as const, tags: ['Online', 'Digital', 'E-commerce'] },
            'Walk-in Buyer': { category: 'behavioral' as const, tags: ['Store', 'Physical', 'In-person'] },
            'New Customer': { category: 'demographic' as const, tags: ['New', 'Recent', 'Onboarding'] },
            'Loyal Patron': { category: 'behavioral' as const, tags: ['Loyal', 'VIP', 'Long-term'] }
          };

          const mapping = segmentMapping[segmentName as keyof typeof segmentMapping] || {
            category: 'behavioral' as const,
            tags: ['General']
          };

          return {
            id: segmentName.toLowerCase().replace(/\s+/g, '-'),
            name: segmentName,
            description: getSegmentDescription(segmentName),
            customerCount: count,
            percentage,
            growth,
            tags: mapping.tags,
            category: mapping.category,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        });

        const transformedData: SegmentationData = {
          segments,
          totalCustomers: analytics.total_customers,
          activeCustomers: analytics.active_customers,
          viewType: 'table'
        };

        setSegmentationData(transformedData);
      } else {

        // Set empty data if API fails
        setSegmentationData({
          segments: [],
          totalCustomers: 0,
          activeCustomers: 0,
          viewType: 'table'
        });
      }
    } catch (error) {

      // Set empty data on error
      setSegmentationData({
        segments: [],
        totalCustomers: 0,
        activeCustomers: 0,
        viewType: 'table'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSegmentDescription = (segmentName: string): string => {
    const descriptions = {
      'High-Value Buyer': 'Customers with total spend > ₹1,00,000',
      'Mid-Tier Buyer': 'Customers with total spend ₹25,000 - ₹1,00,000',
      'Budget Buyer': 'Customers with total spend < ₹25,000',
      'Frequent Buyer': 'Customers with 3+ purchases in last 6 months',
      'At-Risk Customer': 'No purchase in last 12 months',
      'Occasion Shopper': 'Customers purchasing for special occasions',
      'Diamond Lover': 'Customers who prefer diamond jewelry',
      'Gold Investor': 'Customers who prefer gold jewelry',
      'Online Buyer': 'Customers who primarily shop online',
      'Walk-in Buyer': 'Customers who primarily shop in-store',
      'New Customer': 'Customers acquired in last 3 months',
      'Loyal Patron': 'Long-term customers with high loyalty'
    };

    return descriptions[segmentName as keyof typeof descriptions] || 'Customer segment';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      demographic: Users,
      behavioral: Target,
      transactional: DollarSign,
      engagement: Activity
    };
    return iconMap[category as keyof typeof iconMap] || Users;
  };

  const getCategoryColor = (category: string) => {
    const colorMap = {
      demographic: 'bg-blue-100 text-blue-800',
      behavioral: 'bg-green-100 text-green-800',
      transactional: 'bg-purple-100 text-purple-800',
      engagement: 'bg-orange-100 text-orange-800'
    };
    return colorMap[category as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  // Action handlers
  const handleViewSegment = async (segmentName: string) => {
    try {
      setSelectedSegment(segmentName);
      setShowSegmentModal(true);
    } catch (error) {

    }
  };

  const handleExportSegments = async () => {
    try {
      setExporting(true);

      // Create CSV data
      const csvData = [];
      csvData.push(['Segment Name', 'Customer Count', 'Percentage', 'Growth %', 'Category', 'Tags', 'Last Updated']);

      if (segmentationData?.segments) {
        segmentationData.segments.forEach(segment => {
          csvData.push([
            segment.name,
            segment.customerCount.toString(),
            segment.percentage.toFixed(1),
            segment.growth.toFixed(1),
            segment.category,
            segment.tags.join('; '),
            segment.lastUpdated
          ]);
        });
      }

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `customer-segments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);


    } catch (error) {

    } finally {
      setExporting(false);
    }
  };

  const handleCreateSegment = () => {
    setShowSegmentModal(true);
  };

  const handleCloseSegmentModal = () => {
    setShowSegmentModal(false);
    setSelectedSegment(null);
  };

  const filteredSegments = segmentationData?.segments.filter(segment => {
    const matchesSearch = segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         segment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         segment.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || segment.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 opacity-50 text-blue-600" />
            <div className="text-gray-600">Loading customer segments...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!segmentationData || segmentationData.segments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Segmentation</h1>
            <p className="text-gray-600 mt-1">Manage and analyze customer segments</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={fetchSegmentationData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Segment
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 mb-2">No segmentation data available</div>
            <div className="text-sm text-gray-500 mb-4">
              {segmentationData?.totalCustomers === 0
                ? "No customers found in the system"
                : "Segmentation data is being processed"}
            </div>
            <Button variant="outline" onClick={fetchSegmentationData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Segmentation</h1>
          <p className="text-gray-600 mt-1">Manage and analyze customer segments</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={fetchSegmentationData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleExportSegments}
            disabled={exporting}
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button
            size="sm"
            className="flex items-center gap-2"
            onClick={handleCreateSegment}
          >
            <Plus className="w-4 h-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{segmentationData.totalCustomers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{segmentationData.activeCustomers.toLocaleString()}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Segments</p>
                <p className="text-2xl font-bold text-gray-900">{segmentationData.segments.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search segments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="demographic">Demographic</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewType === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('table')}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={viewType === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewType('cards')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Cards
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments Display */}
      {viewType === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Segment</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Customers</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Percentage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Growth</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Updated</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSegments.map((segment) => {
                    const CategoryIcon = getCategoryIcon(segment.category);
                    const categoryColor = getCategoryColor(segment.category);
                    const growthIcon = segment.growth > 0 ? ArrowUpRight : segment.growth < 0 ? ArrowDownRight : Minus;
                    const growthColor = segment.growth > 0 ? 'text-green-600' : segment.growth < 0 ? 'text-red-600' : 'text-gray-600';

                    return (
                      <tr key={segment.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{segment.name}</div>
                            <div className="text-sm text-gray-600">{segment.description}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4 text-gray-600" />
                            <Badge variant="secondary" className={categoryColor}>
                              {segment.category}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{segment.customerCount.toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${segment.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{segment.percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`flex items-center gap-1 ${growthColor}`}>
                            {React.createElement(growthIcon, { className: 'w-4 h-4' })}
                            <span className="text-sm font-medium">{Math.abs(segment.growth).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {segment.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">{segment.lastUpdated}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSegment(segment.name)}
                              title="View segment details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportSegments()}
                              title="Export segment data"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="More actions">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSegments.map((segment) => {
            const CategoryIcon = getCategoryIcon(segment.category);
            const categoryColor = getCategoryColor(segment.category);
            const growthIcon = segment.growth > 0 ? ArrowUpRight : segment.growth < 0 ? ArrowDownRight : Minus;
            const growthColor = segment.growth > 0 ? 'text-green-600' : segment.growth < 0 ? 'text-red-600' : 'text-gray-600';

            return (
              <Card key={segment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${categoryColor}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{segment.name}</h4>
                        <p className="text-xs text-gray-600">{segment.category}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={categoryColor}>
                      {segment.percentage.toFixed(1)}%
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{segment.description}</p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{segment.customerCount.toLocaleString()}</span>
                      <div className={`flex items-center gap-1 ${growthColor}`}>
                        {React.createElement(growthIcon, { className: 'w-3 h-3' })}
                        <span className="text-xs font-medium">{Math.abs(segment.growth).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${segment.percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {segment.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">Updated: {segment.lastUpdated}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleViewSegment(segment.name)}
                          title="View segment details"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleExportSegments()}
                          title="Export segment data"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          title="More actions"
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Segment Details Modal */}
      <SegmentDetailsModal
        open={showSegmentModal}
        onClose={handleCloseSegmentModal}
        segmentName={selectedSegment}
        segmentData={segmentationData?.segments.find(s => s.name === selectedSegment)}
      />
    </div>
  );
}
