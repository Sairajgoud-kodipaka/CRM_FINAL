'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import { Search, Eye, Edit } from 'lucide-react';

const customers = [
  { name: 'Priya S.', segment: 'Wedding', email: 'priya@gmail.com', phone: '9000000001', status: 'active', last: '7/30/2025' },
  { name: 'Amit R.', segment: 'High Value', email: 'amit@gmail.com', phone: '9000000002', status: 'inactive', last: '7/29/2025' },
  { name: 'Sneha K.', segment: 'Returning', email: 'sneha@gmail.com', phone: '9000000003', status: 'active', last: '7/28/2025' },
];

export default function MarketingCustomersPage() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Customers</h1>
          <p className="text-sm sm:text-base text-text-secondary mt-1">View and segment your customer base</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <span className="hidden sm:inline">Export JSON</span>
            <span className="sm:hidden">JSON</span>
          </Button>
        </div>
      </div>
      <Card className="p-3 sm:p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by name, email, or phone..." 
              className="pl-10 w-full text-sm" 
            />
          </div>
          <Select>
            <SelectTrigger className="w-full sm:w-40 text-sm">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="highvalue">High Value</SelectItem>
              <SelectItem value="returning">Returning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {customers.map((c, i) => (
              <Card key={i} className="p-4 cursor-pointer transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-text-primary mb-2">{c.name}</h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">Segment:</span>
                        <span className="text-text-primary">{c.segment}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">Email:</span>
                        <span className="text-text-primary truncate">{c.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">Phone:</span>
                        <span className="text-text-primary">{c.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">Status:</span>
                        <Badge variant="outline" className="capitalize text-xs">{c.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-secondary font-medium">Last Activity:</span>
                        <span className="text-text-primary">{c.last}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-white mt-2">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 text-left font-semibold text-text-secondary text-xs sm:text-sm">Customer</th>
                  <th className="px-3 sm:px-4 py-2 text-left font-semibold text-text-secondary text-xs sm:text-sm">Segment</th>
                  {!isTablet && (
                    <>
                      <th className="px-3 sm:px-4 py-2 text-left font-semibold text-text-secondary text-xs sm:text-sm">Email</th>
                      <th className="px-3 sm:px-4 py-2 text-left font-semibold text-text-secondary text-xs sm:text-sm">Last Activity</th>
                    </>
                  )}
                  <th className="px-3 sm:px-4 py-2 text-left font-semibold text-text-secondary text-xs sm:text-sm">Phone</th>
                  <th className="px-3 sm:px-4 py-2 text-left font-semibold text-text-secondary text-xs sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={i} className="border-t border-border hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 font-medium text-text-primary text-sm">{c.name}</td>
                    <td className="px-3 sm:px-4 py-2 text-text-primary text-sm">{c.segment}</td>
                    {!isTablet && (
                      <>
                        <td className="px-3 sm:px-4 py-2 text-text-primary text-sm">{c.email}</td>
                        <td className="px-3 sm:px-4 py-2 text-text-secondary text-sm">{c.last}</td>
                      </>
                    )}
                    <td className="px-3 sm:px-4 py-2 text-text-primary text-sm">{c.phone}</td>
                    <td className="px-3 sm:px-4 py-2">
                      <Badge variant="outline" className="capitalize text-xs">{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
