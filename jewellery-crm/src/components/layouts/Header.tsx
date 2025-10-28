/**
 * Header Component
 *
 * Top navigation bar with search, notifications, and user menu.
 * Features HubSpot-inspired design with clean white background.
 *
 * Key Features:
 * - Global search functionality
 * - Notification center
 * - User profile dropdown
 * - Mobile-responsive design
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  Search,
  Menu,
  Settings,
  HelpCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications';

interface HeaderProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  className?: string;
}

/**
 * Header Component
 *
 * Renders the top navigation bar with search, actions, and user menu.
 */
export function Header({
  onSidebarToggle,
  showSidebarToggle = false,
  className
}: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);



  /**
   * Handle search submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /**
   * Handle search input changes
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleSidebarToggle = () => {

    if (onSidebarToggle) {
      onSidebarToggle();
    }
  };

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      'border-b border-border',
      className
    )}>
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {/* Mobile/Tablet Sidebar Toggle */}
          {showSidebarToggle && (
            <Button
              id="sidebar-toggle"
              variant="ghost"
              size="icon"
              onClick={handleSidebarToggle}
              className="h-9 w-9 touch-manipulation flex-shrink-0"
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          )}

          {/* Search Bar - Responsive sizing with proper constraints */}
          <form onSubmit={handleSearch} className="relative flex-1 min-w-0 max-w-sm sm:max-w-md lg:max-w-lg">
            <div className={cn(
              'relative flex items-center w-full',
              isSearchFocused && 'z-50'
            )}>
              <Search className="absolute left-2 sm:left-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers, products, orders..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  'pl-6 sm:pl-10 pr-3 sm:pr-4 py-2 w-full',
                  'focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'transition-all duration-200',
                  'text-xs sm:text-sm'
                )}
              />
            </div>

            {/* Search Suggestions (when focused) */}
            {isSearchFocused && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quick Actions
                  </div>
                  <div className="space-y-1">
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm">
                      Search for &ldquo;{searchQuery}&rdquo; in customers
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm">
                      Search for &ldquo;{searchQuery}&rdquo; in products
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm">
                      Search for &ldquo;{searchQuery}&rdquo; in orders
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Section - Responsive controls with proper spacing */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Notifications */}
          <NotificationBell />

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                {mounted ? (
                  <>
                    <Sun className="h-3 w-3 sm:h-4 sm:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-3 w-3 sm:h-4 sm:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </>
                ) : (
                  <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Settings className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help Menu - Hidden on small screens */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sr-only">Help</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Keyboard Shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Contact Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Report a Bug
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Business Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}


