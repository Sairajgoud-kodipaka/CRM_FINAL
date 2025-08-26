'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Building2,
  BarChart3,
  Globe,
  Activity,
  Zap,
  Award,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Star,
  Crown,
  Shield,
  Zap as Lightning,
  X
} from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface CRMLead {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  industry: string;
  company_size: string;
  budget_range: string;
  stage: string;
  probability: number;
  expected_value: number;
  actual_value: number;
  expected_close_date?: string;
  actual_close_date?: string;
  notes?: string;
  next_action?: string;
  next_action_date?: string;
  assigned_to: string;
  source: string;
  created_at: string;
  updated_at: string;
}

interface CRMPipelineStats {
  total_leads: number;
  total_value: number;
  won_deals: number;
  conversion_rate: number;
  avg_deal_value: number;
  monthly_recurring_revenue: number;
  customer_lifetime_value: number;
  sales_velocity: number;
}

interface SalesRepPerformance {
  id: number;
  name: string;
  total_leads: number;
  won_deals: number;
  total_value: number;
  conversion_rate: number;
  avg_deal_value: number;
  performance_score: number;
  last_activity: string;
}

const crmPipelineStages = [
  { name: 'Lead Generation', value: 'lead_generation', color: 'bg-slate-100 text-slate-800' },
  { name: 'Qualification', value: 'qualification', color: 'bg-blue-100 text-blue-800' },
  { name: 'Demo & Presentation', value: 'demo_presentation', color: 'bg-purple-100 text-purple-800' },
  { name: 'Proposal', value: 'proposal', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Negotiation', value: 'negotiation', color: 'bg-orange-100 text-orange-800' },
  { name: 'Contract Signing', value: 'contract_signing', color: 'bg-indigo-100 text-indigo-800' },
  { name: 'Closed Won', value: 'closed_won', color: 'bg-green-100 text-green-800' },
  { name: 'Closed Lost', value: 'closed_lost', color: 'bg-red-100 text-red-800' },
];

export default function CRMSalesPipelinePage() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [stats, setStats] = useState<CRMPipelineStats>({
    total_leads: 0,
    total_value: 0,
    won_deals: 0,
    conversion_rate: 0,
    avg_deal_value: 0,
    monthly_recurring_revenue: 0,
    customer_lifetime_value: 0,
    sales_velocity: 0,
  });
  const [salesRepPerformance, setSalesRepPerformance] = useState<SalesRepPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    industry: '',
    company_size: '',
    budget_range: '',
    stage: 'lead_generation',
    probability: 25,
    expected_value: 0,
    source: 'website',
    notes: '',
    next_action: '',
    next_action_date: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchCRMPipelineData();
  }, [searchTerm, stageFilter, sourceFilter]);

  const fetchCRMPipelineData = async () => {
    try {
      setLoading(true);
      // For platform admin, we'll fetch CRM sales pipeline data
      const response = await apiService.getCRMSalesPipeline({
        stage: stageFilter || undefined,
        source: sourceFilter || undefined,
      });
      
      if (response.success) {
        const data = response.data as any;
        const leadsData = Array.isArray(data) ? data : data.results || [];
        
        console.log('CRM pipeline data received:', leadsData);
        
        setLeads(leadsData);
        
        // Calculate CRM sales stats
        const totalLeads = leadsData.length;
        const totalValue = leadsData.reduce((sum: number, lead: CRMLead) => {
          const value = lead.expected_value;
          if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
            return sum;
          }
          return sum + (typeof value === 'number' ? value : parseFloat(value) || 0);
        }, 0);
        
        const wonDeals = leadsData.filter((lead: CRMLead) => lead.stage === 'closed_won').length;
        const conversionRate = totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;
        const averageDealValue = totalLeads > 0 ? totalValue / totalLeads : 0;
        
        setStats({
          total_leads: totalLeads,
          total_value: totalValue,
          won_deals: wonDeals,
          conversion_rate: conversionRate,
          avg_deal_value: averageDealValue,
          monthly_recurring_revenue: totalValue * 0.12, // 12 months MRR
          customer_lifetime_value: averageDealValue * 24, // 2 years LTV
          sales_velocity: 15, // days
        });
      } else {
        // Handle API response with no data
        setLeads([]);
        setSalesRepPerformance([]);
        setStats({
          total_leads: 0,
          total_value: 0,
          won_deals: 0,
          conversion_rate: 0,
          avg_deal_value: 0,
          monthly_recurring_revenue: 0,
          customer_lifetime_value: 0,
          sales_velocity: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch CRM pipeline data:', error);
      // Set empty data instead of demo data
      setLeads([]);
      setSalesRepPerformance([]);
      setStats({
        total_leads: 0,
        total_value: 0,
        won_deals: 0,
        conversion_rate: 0,
        avg_deal_value: 0,
        monthly_recurring_revenue: 0,
        customer_lifetime_value: 0,
        sales_velocity: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = () => {
    setShowAddLeadModal(true);
  };

  const handleCloseModal = () => {
    setShowAddLeadModal(false);
    setNewLead({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      industry: '',
      company_size: '',
      budget_range: '',
      stage: 'lead_generation',
      probability: 25,
      expected_value: 0,
      source: 'website',
      notes: '',
      next_action: '',
      next_action_date: '',
      assigned_to: '',
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setNewLead(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitLead = async () => {
    try {
      // TODO: Implement API call to create lead
      console.log('Creating new lead:', newLead);
      
      // For now, just add to local state
      const newLeadWithId = {
        ...newLead,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        actual_value: 0,
      };
      
      setLeads(prev => [...prev, newLeadWithId]);
      handleCloseModal();
      
      // Refresh data
      fetchCRMPipelineData();
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  const handleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleLeadAction = (leadId: number, action: string) => {
    console.log(`Performing action ${action} on lead ${leadId}`);
    // TODO: Implement lead actions (edit, delete, move stage, etc.)
  };

  const handleSalesRepAction = (repId: number, action: string) => {
    console.log(`Performing action ${action} on sales rep ${repId}`);
    // TODO: Implement sales rep actions
  };

  const handleMonitorActivity = () => {
    console.log('Opening activity monitoring');
    // TODO: Implement activity monitoring
  };

  const handleStartProspecting = () => {
    console.log('Starting prospecting campaign');
    // TODO: Implement prospecting campaign
  };

  const getStageColor = (stage: string) => {
    const stageConfig = crmPipelineStages.find(s => s.value === stage);
    return stageConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount) || !isFinite(amount)) {
      return '₹0.00';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter(lead => lead.stage === stage);
  };

  const safeFormatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    return formatDate(dateString);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'website': return <Globe className="w-4 h-4" />;
      case 'referral': return <Users className="w-4 h-4" />;
      case 'cold call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">CRM Sales Pipeline</h1>
          <p className="text-text-secondary mt-1">Sell our CRM platform to potential customers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleFilters}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={handleAddLead}
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Search</label>
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Stage</label>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stages</option>
                  {crmPipelineStages.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Source</label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRM Sales Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.total_value)}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Monthly Recurring Revenue</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.monthly_recurring_revenue)}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Customer Lifetime Value</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(stats.customer_lifetime_value)}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">Sales Velocity</p>
                <p className="text-2xl font-bold text-text-primary">{stats.sales_velocity} days</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Lightning className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Rep Performance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Sales Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-text-secondary">Loading performance data...</div>
            </div>
          ) : salesRepPerformance.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-text-secondary mb-2">No sales rep data</div>
              <Button 
                variant="outline"
                onClick={() => console.log('Add sales representatives')}
              >
                Add sales representatives
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {salesRepPerformance.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{rep.name}</div>
                      <div className="text-sm text-text-secondary">
                        {rep.total_leads} leads • {formatCurrency(rep.total_value)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-text-secondary">Conversion</div>
                      <div className="font-medium">{rep.conversion_rate}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-text-secondary">Avg Deal</div>
                      <div className="font-medium">{formatCurrency(rep.avg_deal_value)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-text-secondary">Performance</div>
                      <div className={`font-medium ${getPerformanceColor(rep.performance_score)}`}>
                        {rep.performance_score}%
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPerformanceIcon(rep.performance_score)}
                      <Badge variant="outline" className={getPerformanceColor(rep.performance_score)}>
                        {rep.won_deals}/{rep.total_leads} won
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRM Sales Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
        {crmPipelineStages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.value);
          const stageValue = stageLeads.reduce((sum, lead) => {
            const value = lead.expected_value;
            if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
              return sum;
            }
            return sum + (typeof value === 'number' ? value : parseFloat(value) || 0);
          }, 0);
          
          return (
            <Card key={stage.value} className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{stage.name}</span>
                  <Badge variant="outline" className={stage.color}>
                    {stageLeads.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <div key={lead.id} className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${
                      lead.stage === 'closed_won' ? 'bg-green-50 border-green-200' : ''
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-text-primary">{lead.company_name}</h4>
                        <div className="flex items-center gap-1">
                          {lead.stage === 'closed_won' && (
                            <span className="text-green-600 text-xs">🎉</span>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLeadAction(lead.id, 'menu')}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-text-secondary">
                        <p>Contact: {lead.contact_person}</p>
                        <p>Industry: {lead.industry}</p>
                        <p className={lead.stage === 'closed_won' ? 'font-medium text-green-700' : ''}>
                          {formatCurrency(lead.expected_value)}
                        </p>
                        <p>Probability: {lead.probability}%</p>
                        <p>Expected: {safeFormatDate(lead.expected_close_date)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {getSourceIcon(lead.source)}
                          <span className="text-xs">{lead.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-center py-8 text-text-secondary text-sm">
                      No leads in this stage
                    </div>
                  )}
                </div>
                {stageLeads.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <p className="text-xs text-text-secondary">Stage Value: {formatCurrency(stageValue)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Sales Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-text-secondary">Loading activity...</div>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-secondary mb-2">No sales activity</div>
                <Button 
                  variant="outline"
                  onClick={handleStartProspecting}
                >
                  Start prospecting
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${getStageColor(lead.stage).split(' ')[0]}`}></div>
                      <div>
                        <div className="font-medium text-text-primary">{lead.company_name}</div>
                        <div className="text-sm text-text-secondary">
                          {lead.contact_person} • {lead.industry} • {formatCurrency(lead.expected_value)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStageColor(lead.stage)}>
                        {lead.stage.replace('_', ' ')}
                      </Badge>
                      <p className="text-xs text-text-secondary mt-1">
                        {safeFormatDate(lead.expected_close_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Sales Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-text-secondary mb-2">No insights available</div>
                <Button 
                  variant="outline"
                  onClick={handleMonitorActivity}
                >
                  Monitor activity
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-text-primary">High-Value Prospects</div>
                      <div className="text-sm text-text-secondary">
                        {leads.filter(l => l.expected_value > 100000).length} leads over ₹100K
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {formatCurrency(leads.filter(l => l.expected_value > 100000).reduce((sum, l) => sum + l.expected_value, 0))}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-text-primary">Successful Conversions</div>
                      <div className="text-sm text-text-secondary">
                        {leads.filter(l => l.stage === 'closed_won').length} deals closed this month
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {stats.conversion_rate.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-text-primary">Sales Cycle</div>
                      <div className="text-sm text-text-secondary">Avg {stats.sales_velocity} days per stage</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    Fast
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-text-primary">Lead Quality</div>
                      <div className="text-sm text-text-secondary">
                        {leads.filter(l => l.probability > 50).length} qualified leads
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {leads.length > 0 ? Math.round((leads.filter(l => l.probability > 50).length / leads.length) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
                 </Card>
       </div>

              {/* Add Lead Modal */}
       {showAddLeadModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseModal}>
           <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-text-primary">Add New Lead</h2>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={handleCloseModal}
                 className="text-text-secondary hover:text-text-primary"
               >
                 <X className="w-5 h-5" />
               </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Company Information */}
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Company Name *
                   </label>
                   <input
                     type="text"
                     value={newLead.company_name}
                     onChange={(e) => handleInputChange('company_name', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter company name"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Contact Person *
                   </label>
                   <input
                     type="text"
                     value={newLead.contact_person}
                     onChange={(e) => handleInputChange('contact_person', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter contact person name"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Email *
                   </label>
                   <input
                     type="email"
                     value={newLead.email}
                     onChange={(e) => handleInputChange('email', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter email address"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Phone
                   </label>
                   <input
                     type="tel"
                     value={newLead.phone}
                     onChange={(e) => handleInputChange('phone', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter phone number"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Industry
                   </label>
                   <input
                     type="text"
                     value={newLead.industry}
                     onChange={(e) => handleInputChange('industry', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter industry"
                   />
                 </div>
               </div>

               {/* Deal Information */}
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Company Size
                   </label>
                   <select
                     value={newLead.company_size}
                     onChange={(e) => handleInputChange('company_size', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Select company size</option>
                     <option value="1-10">1-10 employees</option>
                     <option value="11-50">11-50 employees</option>
                     <option value="51-200">51-200 employees</option>
                     <option value="201-500">201-500 employees</option>
                     <option value="500+">500+ employees</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Budget Range
                   </label>
                   <select
                     value={newLead.budget_range}
                     onChange={(e) => handleInputChange('budget_range', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="">Select budget range</option>
                     <option value="₹10K-50K">₹10K-50K</option>
                     <option value="₹50K-100K">₹50K-100K</option>
                     <option value="₹100K-500K">₹100K-500K</option>
                     <option value="₹500K-1M">₹500K-1M</option>
                     <option value="₹1M+">₹1M+</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Expected Value (₹)
                   </label>
                   <input
                     type="number"
                     value={newLead.expected_value}
                     onChange={(e) => handleInputChange('expected_value', parseFloat(e.target.value) || 0)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter expected deal value"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Probability (%)
                   </label>
                   <input
                     type="number"
                     min="0"
                     max="100"
                     value={newLead.probability}
                     onChange={(e) => handleInputChange('probability', parseInt(e.target.value) || 0)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="Enter probability percentage"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Lead Source
                   </label>
                   <select
                     value={newLead.source}
                     onChange={(e) => handleInputChange('source', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     <option value="website">Website</option>
                     <option value="referral">Referral</option>
                     <option value="cold_call">Cold Call</option>
                     <option value="email">Email</option>
                     <option value="social_media">Social Media</option>
                     <option value="trade_show">Trade Show</option>
                   </select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Stage
                   </label>
                   <select
                     value={newLead.stage}
                     onChange={(e) => handleInputChange('stage', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   >
                     {crmPipelineStages.map((stage) => (
                       <option key={stage.value} value={stage.value}>
                         {stage.name}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>

             {/* Additional Fields */}
             <div className="mt-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-text-secondary mb-2">
                   Notes
                 </label>
                 <textarea
                   value={newLead.notes}
                   onChange={(e) => handleInputChange('notes', e.target.value)}
                   rows={3}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Enter any additional notes about this lead"
                 />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Next Action
                   </label>
                   <input
                     type="text"
                     value={newLead.next_action}
                     onChange={(e) => handleInputChange('next_action', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="e.g., Schedule demo, Send proposal"
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-text-secondary mb-2">
                     Next Action Date
                   </label>
                   <input
                     type="date"
                     value={newLead.next_action_date}
                     onChange={(e) => handleInputChange('next_action_date', e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   />
                 </div>
               </div>
             </div>

             {/* Modal Actions */}
             <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
               <Button
                 variant="outline"
                 onClick={handleCloseModal}
               >
                 Cancel
               </Button>
               <Button
                 onClick={handleSubmitLead}
                 disabled={!newLead.company_name || !newLead.contact_person || !newLead.email}
                 className="btn-primary"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Add Lead
               </Button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
