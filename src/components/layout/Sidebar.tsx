import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard, MapPin, Droplets, ClipboardList, Building2,
  FileText, Hammer, MessageSquareWarning, Settings, BarChart3, Bell,
  ScrollText, Users, Shield, ChevronLeft, ChevronRight, Droplet
  , BadgeCheck
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  section?: string;
}

const navItems: NavItem[] = [
  { label: 'Complete KYC', path: '/kyc', icon: <BadgeCheck size={20} />, section: '' },
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, section: '' },
  // Operations
  { label: 'GIS Map', path: '/gis', icon: <MapPin size={20} />, section: 'Operations' },
  { 
    label: 'Boreholes', 
    path: '/boreholes', 
    icon: <Droplets size={20} />, 
    section: 'Operations',
    roles: ['super_admin', 'ngo_admin']
  },
  { 
    label: 'Assignments', 
    path: '/assignments', 
    icon: <ClipboardList size={20} />, 
    section: 'Operations',
    roles: ['super_admin', 'ngo_admin']
  },
  // Organizations
  { 
    label: 'NGOs', 
    path: '/ngos', 
    icon: <Building2 size={20} />, 
    section: 'Organizations',
    roles: ['super_admin']
  },
  // Field Operations
  { 
    label: 'Surveys', 
    path: '/surveys', 
    icon: <FileText size={20} />, 
    section: 'Field Operations',
    roles: ['super_admin', 'ngo_admin']
  },
  { 
    label: 'Rehabilitation', 
    path: '/rehabilitation', 
    icon: <Hammer size={20} />, 
    section: 'Field Operations',
    roles: ['super_admin', 'ngo_admin']
  },
  { 
    label: 'Grievances', 
    path: '/grievances', 
    icon: <MessageSquareWarning size={20} />, 
    section: 'Field Operations',
    roles: ['super_admin', 'ngo_admin']
  },
  // Configuration
  { 
    label: 'Form Builder', 
    path: '/form-builder', 
    icon: <Settings size={20} />, 
    section: 'Configuration',
    roles: ['super_admin']
  },
  { 
    label: 'Reports', 
    path: '/reports', 
    icon: <BarChart3 size={20} />, 
    section: 'Configuration',
    roles: ['super_admin', 'ngo_admin']
  },
  { label: 'Notifications', path: '/notifications', icon: <Bell size={20} />, section: 'Configuration' },
  // System
  { 
    label: 'Audit Logs', 
    path: '/audit-logs', 
    icon: <ScrollText size={20} />, 
    section: 'System',
    roles: ['super_admin']
  },
  { 
    label: 'Users', 
    path: '/settings/users', 
    icon: <Users size={20} />, 
    section: 'System',
    roles: ['super_admin', 'ngo_admin']
  },
  { 
    label: 'Roles', 
    path: '/settings/roles', 
    icon: <Shield size={20} />, 
    section: 'System',
    roles: ['super_admin']
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const userRoles = user?.roles ?? [];
  const kycApproved = ['approved', 'completed'].includes((user?.kycStatus ?? '').toLowerCase());
  const kycLocked = userRoles.includes('ngo_admin') && !userRoles.includes('super_admin') && !kycApproved;

  const filteredItems = navItems.filter((item) => {
    if (kycLocked) return item.path === '/kyc' || item.path === '/notifications';
    if (item.path === '/kyc') return userRoles.includes('ngo_admin') && !userRoles.includes('super_admin');
    if (!item.roles) return true;
    if (userRoles.includes('super_admin')) return true;
    return item.roles.some((role) => userRoles.includes(role));
  });

  const sections = filteredItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section ?? '';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Droplet size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold text-slate-800 leading-tight">OYU Green</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">ADMIN PANEL</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-hide">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="mb-1">
            {section && !collapsed && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {section}
              </p>
            )}
            {section && collapsed && <div className="my-2 border-t border-slate-100" />}
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-0')
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-slate-100 text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors shrink-0"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
