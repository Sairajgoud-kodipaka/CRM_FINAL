'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building, Mail, Phone, MapPin, Globe, User, Lock } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TenantFormData {
  name: string;
  business_type: string;
  industry: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  subscription_plan: string;
  admin_username: string;
  admin_email: string;
  admin_password: string;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState<TenantFormData>({
    name: '',
    business_type: 'jewelry_store',
    industry: 'jewelry',
    description: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    subscription_plan: 'professional',
    admin_username: '',
    admin_email: '',
    admin_password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    let value = e.target.value;
    
    // Auto-format website URL if it doesn't have a scheme
    if (e.target.name === 'website' && value && !value.startsWith('http://') && !value.startsWith('https://')) {
      // Don't auto-add https:// here, let the backend handle it
      // Just ensure it's not empty and has some content
    }
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    setForm({ ...form, [e.target.name]: value });
  }

  function handleSelectChange(name: string, value: string) {
    // Clear error when user makes a selection
    if (error) {
      setError(null);
    }
    
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Enhanced validation
      const requiredFields = ['name', 'admin_username', 'admin_email', 'admin_password'];
      const missingFields = requiredFields.filter(field => !form[field as keyof TenantFormData]);
      
      if (missingFields.length > 0) {
        setError(`Missing required fields: ${missingFields.join(', ')}`);
        setSubmitting(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.admin_email)) {
        setError('Please enter a valid email address for the admin account');
        setSubmitting(false);
        return;
      }
      
      // Validate password strength
      if (form.admin_password.length < 8) {
        setError('Admin password must be at least 8 characters long');
        setSubmitting(false);
        return;
      }
      
      // Validate business name
      if (form.name.trim().length < 2) {
        setError('Business name must be at least 2 characters long');
        setSubmitting(false);
        return;
      }
      
      const response = await apiService.createTenant(form);
      
      if (response.success) {
        router.push('/platform/tenants');
      } else {
        setError(`Failed to create tenant: ${response.message}`);
      }
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError(`Failed to create tenant: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Create New Business (Tenant)</h1>
        <Link href="/platform/tenants">
          <Button variant="outline">← Back to Tenants</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <Card className="p-6">
          <h2 className="text-lg font-medium text-text-primary mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Business Information
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Business Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter business name"
                required
              />
            </div>

            <div>
              <Label htmlFor="business_type">Business Type *</Label>
              <Select value={form.business_type} onValueChange={(value) => handleSelectChange('business_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jewelry_store">Jewelry Store</SelectItem>
                  <SelectItem value="goldsmith">Goldsmith</SelectItem>
                  <SelectItem value="diamond_merchant">Diamond Merchant</SelectItem>
                  <SelectItem value="silver_merchant">Silver Merchant</SelectItem>
                  <SelectItem value="jewelry_wholesaler">Jewelry Wholesaler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select value={form.industry} onValueChange={(value) => handleSelectChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter business description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="subscription_plan">Subscription Plan *</Label>
              <Select value={form.subscription_plan} onValueChange={(value) => handleSelectChange('subscription_plan', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-lg font-medium text-text-primary mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Contact Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="business@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="www.example.com or https://www.example.com"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Enter business address"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Admin Account */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-text-primary mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Admin Account
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="admin_username">Admin Username *</Label>
              <Input
                id="admin_username"
                name="admin_username"
                value={form.admin_username}
                onChange={handleChange}
                placeholder="admin_username"
                required
              />
            </div>

            <div>
              <Label htmlFor="admin_email">Admin Email *</Label>
              <Input
                id="admin_email"
                name="admin_email"
                type="email"
                value={form.admin_email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="admin_password">Admin Password *</Label>
              <Input
                id="admin_password"
                name="admin_password"
                type="password"
                value={form.admin_password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 mt-6 border-red-200 bg-red-50">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex gap-2 mt-6">
        <Button 
          onClick={handleSubmit} 
          className="btn-primary" 
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Tenant...
            </>
          ) : (
            'Create Tenant'
          )}
        </Button>
        <Link href="/platform/tenants">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
    </div>
  );
}
 
 