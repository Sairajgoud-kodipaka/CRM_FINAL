'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Users, 
  BarChart3, 
  Settings,
  Phone,
  Activity
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/business-admin/doubletick',
    icon: Activity,
    description: 'Overview and quick stats'
  },
  {
    name: 'Sessions',
    href: '/business-admin/doubletick/sessions',
    icon: Phone,
    description: 'Manage WhatsApp connections'
  },
  {
    name: 'Bot Builder',
    href: '/business-admin/doubletick/bot-builder',
    icon: Bot,
    description: 'Create automated responses'
  },
  {
    name: 'Campaigns',
    href: '/business-admin/doubletick/campaigns',
    icon: Send,
    description: 'Marketing campaigns'
  },
  {
    name: 'Team',
    href: '/business-admin/doubletick/team',
    icon: Users,
    description: 'Manage team members'
  },
  {
    name: 'Analytics',
    href: '/business-admin/doubletick/analytics',
    icon: BarChart3,
    description: 'Performance metrics'
  },
  {
    name: 'Settings',
    href: '/business-admin/doubletick/settings',
    icon: Settings,
    description: 'Configuration options'
  }
];

export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">DoubleTick WhatsApp Business</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Double-Tick System</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <span>Status: Connected</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-6">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:text-green-700 hover:bg-green-50'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5',
                        isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-green-500'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={cn(
                        'text-xs',
                        isActive ? 'text-green-600' : 'text-gray-500'
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-white rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="font-medium text-green-600">2</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Online Team</span>
                  <span className="font-medium text-blue-600">3</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending Messages</span>
                  <span className="font-medium text-orange-600">5</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active Campaigns</span>
                  <span className="font-medium text-purple-600">1</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">WAHA Server</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Webhooks</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bot Engine</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
