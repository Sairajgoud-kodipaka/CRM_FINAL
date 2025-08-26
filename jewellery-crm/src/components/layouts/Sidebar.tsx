/**
 * Sidebar Navigation Component
 * 
 * This component provides the main navigation sidebar with HubSpot-inspired design.
 * Features include role-based navigation, collapsible sections, and active state management.
 * 
 * Key Features:
 * - Dark navy background matching HubSpot design
 * - Role-based menu items
 * - Active state highlighting with orange accent
 * - Responsive behavior for mobile devices
 * - Smooth animations and interactions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3,
  Users,
  ShoppingBag,
  Calendar,
  Package,
  TrendingUp,
  Settings,
  Home,
  FileText,
  MessageSquare,
  MessageCircle,
  Globe,
  CreditCard,
  User,
  LogOut,
  ChevronDown,
  Building2,
  Gem,
  Plus,
  Wand2,
  Store,
  Search,
  Gift,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  role?: string; // Add this prop
}

/**
 * Navigation item structure
 */
interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
  roles?: string[]; // Which user roles can see this item
}

/**
 * Main navigation structure
 * Each item can have role-based visibility and optional badges
 */
const navigationItems: NavItem[] = [
  // Business Admin Navigation
  {
    title: 'Dashboard',
    href: '/business-admin/dashboard',
    icon: Home,
    roles: ['business_admin'],
  },
  {
    title: 'Customers',
    href: '/business-admin/customers',
    icon: Users,
    roles: ['business_admin'],
  },
  {
    title: 'Customer Segmentation',
    href: '/business-admin/segmentation',
    icon: BarChart3,
    roles: ['business_admin'],
  },
  {
    title: 'Sales Pipeline',
    href: '/business-admin/pipeline',
    icon: TrendingUp,
    roles: ['business_admin'],
  },
  {
    title: 'Sales Team',
    href: '/business-admin/sales-team',
    icon: Users,
    roles: ['business_admin'],
  },
  {
    title: 'Purchases',
    href: '/business-admin/purchases',
    icon: ShoppingBag,
    roles: ['business_admin'],
  },
  {
    title: 'Appointments',
    href: '/business-admin/appointments',
    icon: Calendar,
    roles: ['business_admin'],
  },
  {
    title: 'Products',
    href: '/business-admin/products',
    icon: Package,
    roles: ['business_admin'],
  },

  {
    title: 'Inventory',
    href: '/business-admin/inventory',
    icon: BarChart3,
    roles: ['business_admin'],
  },
  {
    title: 'Analytics',
    href: '/business-admin/analytics',
    icon: BarChart3,
    roles: ['business_admin'],
  },
  {
    title: 'Support',
    href: '/business-admin/support',
    icon: MessageSquare,
    roles: ['business_admin'],
    children: [
      {
        title: 'Tickets',
        href: '/business-admin/support/tickets',
        icon: MessageSquare,
        roles: ['business_admin'],
      },
    ],
  },
  {
    title: 'Exhibition Leads',
    href: '/business-admin/exhibition',
    icon: Gift,
    roles: ['business_admin'],
  },
  {
    title: 'WhatsApp',
    href: '/business-admin/whatsapp',
    icon: MessageCircle,
    roles: ['business_admin'],
  },
  {
    title: 'Profile',
    href: '/business-admin/profile',
    icon: User,
    roles: ['business_admin'],
  },
  {
    title: 'Double Tick',
    href: '/business-admin/doubletick',
    icon: MessageCircle,
    roles: ['business_admin'],
    children: [
      
    ],
  },
  {
    title: 'Settings',
    href: '/business-admin/settings',
    icon: Settings,
    roles: ['business_admin'],
    children: [
      {
        title: 'Team',
        href: '/business-admin/settings/team',
        icon: Users,
        roles: ['business_admin'],
      },
      {
        title: 'Stores',
        href: '/business-admin/settings/stores',
        icon: Building2,
        roles: ['business_admin'],
      },
      //{
      //  title: 'Integrations',
      //  href: '/business-admin/settings/integrations',
      //  icon: Globe,
      //  roles: ['business_admin'],
      //},
    ],
  },
  // Platform Admin Navigation
  {
    title: 'Dashboard',
    href: '/platform/dashboard',
    icon: Home,
    roles: ['platform_admin'],
  },
  {
    title: 'CRM Sales Pipeline',
    href: '/platform/pipeline',
    icon: TrendingUp,
    roles: ['platform_admin'],
  },
  {
    title: 'Tenants',
    href: '/platform/tenants',
    icon: Building2,
    roles: ['platform_admin'],
    children: [
      {
        title: 'All Tenants',
        href: '/platform/tenants',
        icon: Building2,
        roles: ['platform_admin'],
      },
      {
        title: 'Add Tenant',
        href: '/platform/tenants/new',
        icon: Plus,
        roles: ['platform_admin'],
      },
    ],
  },
  {
    title: 'Billing',
    href: '/platform/billing',
    icon: CreditCard,
    roles: ['platform_admin'],
  },
  {
    title: 'Support',
    href: '/platform/support',
    icon: MessageSquare,
    roles: ['platform_admin'],
  },
  {
    title: 'Knowledge Base',
    href: '/platform/kb',
    icon: FileText,
    roles: ['platform_admin'],
    children: [
      {
        title: 'All Articles',
        href: '/platform/kb',
        icon: FileText,
        roles: ['platform_admin'],
      },
      {
        title: 'Add Article',
        href: '/platform/kb/new',
        icon: Plus,
        roles: ['platform_admin'],
      },
    ],
  },
  {
    title: 'Settings',
    href: '/platform/settings',
    icon: Settings,
    roles: ['platform_admin'],
  },
  // Manager Navigation
  {
    title: 'Dashboard',
    href: '/manager/dashboard',
    icon: Home,
    roles: ['manager'],
  },
  {
    title: 'Team Management',
    href: '/manager/team',
    icon: Users,
    roles: ['manager'],
  },
  {
    title: 'Appointments',
    href: '/manager/appointments',
    icon: Calendar,
    roles: ['manager'],
  },
  {
    title: 'Inventory',
    href: '/manager/inventory',
    icon: BarChart3,
    roles: ['manager'],
  },
  {
    title: 'Customers',
    href: '/manager/customers',
    icon: Users,
    roles: ['manager'],
  },
  {
    title: 'Announcements',
    href: '/manager/announcements',
    icon: MessageSquare,
    roles: ['manager'],
  },
  {
    title: 'Products',
    href: '/manager/products',
    icon: Package,
    roles: ['manager'],
  },
  {
    title: 'Sales Pipeline',
    href: '/manager/pipeline',
    icon: TrendingUp,
    roles: ['manager'],
  },
  {
    title: 'Sales Team',
    href: '/manager/sales-team',
    icon: Users,
    roles: ['manager'],
  },
  {
    title: 'Purchases',
    href: '/manager/purchases',
    icon: ShoppingBag,
    roles: ['manager'],
  },

  {
    title: 'Analytics',
    href: '/manager/analytics',
    icon: BarChart3,
    roles: ['manager'],
  },
  {
    title: 'Escalations',
    href: '/manager/escalations',
    icon: AlertTriangle,
    roles: ['manager'],
  },
  {
    title: 'Exhibition Leads',
    href: '/manager/exhibition',
    icon: Gift,
    roles: ['manager'],
  },
  {
    title: 'WhatsApp',
    href: '/manager/whatsapp',
    icon: MessageCircle,
    roles: ['manager'],
  },
  {
    title: 'My Profile',
    href: '/manager/profile',
    icon: User,
    roles: ['manager'],
  },
  // Marketing Team Navigation
  {
    title: 'Dashboard',
    href: '/marketing/dashboard',
    icon: Home,
    roles: ['marketing'],
  },
  {
    title: 'Analytics',
    href: '/marketing/analytics',
    icon: BarChart3,
    roles: ['marketing'],
  },
  {
    title: 'Customers',
    href: '/marketing/customers',
    icon: Users,
    roles: ['marketing'],
  },
  {
    title: 'Store',
    href: '/marketing/store',
    icon: Store,
    roles: ['marketing'],
    children: [
      {
        title: 'Builder',
        href: '/marketing/store/builder',
        icon: Wand2,
        roles: ['marketing'],
      },
      {
        title: 'Pages',
        href: '/marketing/store/pages',
        icon: FileText,
        roles: ['marketing'],
      },
      {
        title: 'Promotions',
        href: '/marketing/store/promotions',
        icon: Gift,
        roles: ['marketing'],
      },
      {
        title: 'Marketing',
        href: '/marketing/store/marketing',
        icon: Search,
        roles: ['marketing'],
      },
    ],
  },
  {
    title: 'Products',
    href: '/marketing/products',
    icon: ShoppingBag,
    roles: ['marketing'],
  },
  {
    title: 'Support',
    href: '/marketing/support',
    icon: MessageSquare,
    roles: ['marketing'],
  },
  {
    title: 'Exhibition Leads',
    href: '/marketing/exhibition',
    icon: Gift,
    roles: ['marketing'],
  },
  // Sales Team Navigation
  {
    title: 'Dashboard',
    href: '/sales/dashboard',
    icon: Home,
    roles: ['sales'],
  },
  {
    title: 'Customers',
    href: '/sales/customers',
    icon: Users,
    roles: ['sales'],
  },
  {
    title: 'Sales Pipeline',
    href: '/sales/pipeline',
    icon: TrendingUp,
    roles: ['sales'],
  },
  {
    title: 'Purchases',
    href: '/sales/purchases',
    icon: ShoppingBag,
    roles: ['sales'],
  },
  {
    title: 'Appointments',
    href: '/sales/appointments',
    icon: Calendar,
    roles: ['sales'],
  },

  {
    title: 'Products',
    href: '/sales/products',
    icon: Package,
    roles: ['sales'],
  },
  {
    title: 'Announcements',
    href: '/sales/announcements',
    icon: MessageSquare,
    roles: ['sales'],
  },
  {
    title: 'Escalations',
    href: '/sales/escalations',
    icon: AlertTriangle,
    roles: ['sales'],
  },
  {
    title: 'Exhibition Leads',
    href: '/sales/exhibition',
    icon: Gift,
    roles: ['sales'],
  },
  {
    title: 'Profile',
    href: '/sales/profile',
    icon: User,
    roles: ['sales'],
  },
  // Telecaller Navigation
  {
    title: 'Dashboard',
    href: '/telecaller/dashboard',
    icon: Home,
    roles: ['telecaller'],
  },
  {
    title: 'Customers',
    href: '/telecaller/customers',
    icon: Users,
    roles: ['telecaller'],
  },
  {
    title: 'Pipeline',
    href: '/telecaller/pipeline',
    icon: TrendingUp,
    roles: ['telecaller'],
  },
  {
    title: 'Appointments',
    href: '/telecaller/appointments',
    icon: Calendar,
    roles: ['telecaller'],
  },
  {
    title: 'Exhibition Leads',
    href: '/telecaller/exhibition',
    icon: Gift,
    roles: ['telecaller'],
  },
  {
    title: 'Profile',
    href: '/telecaller/profile',
    icon: User,
    roles: ['telecaller'],
  },
];

/**
 * Get the profile route based on user role
 */
const getProfileRoute = (userRole: string): string | null => {
  switch (userRole) {
    case 'business_admin':
      return '/business-admin/profile';
    case 'platform_admin':
      return '/platform/profile';
    case 'manager':
      return '/manager/profile';
    case 'inhouse_sales':
      return '/sales/profile';
    case 'tele_calling':
      return '/telecaller/profile';
    case 'marketing':
      return '/marketing/profile';
    default:
      return null;
  }
};

/**
 * Sidebar Component
 * 
 * Renders the main navigation sidebar with role-based menu items
 * and HubSpot-inspired styling.
 */
export function Sidebar({ isOpen = true, onClose, className, role }: SidebarProps) {
  const pathname = usePathname();
  
  const { user, logout } = useAuth();
  const router = useRouter();

  // Use the passed role prop if provided, otherwise use user.role
  const currentRole = role || (user && user.role);

  // If no user, don't render sidebar (will redirect to login)
  if (!currentRole || !user) {
    return null;
  }

  /**
   * Check if a navigation item should be visible based on user role
   */
  const canAccessItem = (item: NavItem): boolean => {
    return !item.roles || item.roles.includes(currentRole);
  };

  /**
   * Check if the current route matches a nav item
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  /**
   * Navigation Item Component
   */
  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = isActiveRoute(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(isActive);
    
    if (!canAccessItem(item)) return null;

    const itemClasses = cn(
      'flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
      'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      level > 0 && 'ml-4 px-3 py-2.5',
      isActive && 'bg-primary text-primary-foreground shadow-sm',
      !isActive && 'text-sidebar-foreground'
    );

    const iconClasses = cn(
      'mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200',
      level > 0 && 'h-4 w-4 mr-2'
    );

    if (hasChildren) {
      return (
        <div className="space-y-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={itemClasses}
          >
            <div className="flex items-center">
              <item.icon className={iconClasses} />
              <span className="truncate">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform duration-300 ease-in-out',
                isExpanded && 'rotate-180'
              )} 
            />
          </button>
          
          {isExpanded && (
            <div className="space-y-1 pl-4">
              {item.children?.map((child) => (
                <NavItemComponent key={child.href} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link href={item.href} onClick={onClose}>
        <div className={itemClasses}>
          <div className="flex items-center">
            <item.icon className={iconClasses} />
            <span className="truncate">{item.title}</span>
          </div>
          {item.badge && (
            <Badge variant="secondary" className="text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div
      id="app-sidebar"
      className={cn(
        'w-60 bg-sidebar text-sidebar-foreground h-full overflow-y-auto flex flex-col',
        !isOpen && 'transform -translate-x-full lg:translate-x-0',
        className
      )}
    >
      {/* Logo and Business Name */}
      <div className="flex items-center px-4 py-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <Gem className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-sidebar-foreground">
              {'CRM Dashboard'}
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'CRM Dashboard'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigationItems.map((item) => (
          <NavItemComponent key={item.href} item={item} />
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start px-3 py-3 h-auto ext-sidebar-foreground rounded-lg transition-colors duration-200"
            >
              <Avatar className="w-8 h-8 mr-3">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user.name ? user.name.split(' ').map(n => n[0]).join('') : ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-xs text-sidebar-foreground/70 capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-card border-border shadow-xl"
          >
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => {
              const profileRoute = getProfileRoute(user.role);
              if (profileRoute) {
                router.push(profileRoute);
              }
            }}>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </DropdownMenuItem>
            
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="text-destructive" onClick={async () => {
              await logout();
              router.push('/login');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}