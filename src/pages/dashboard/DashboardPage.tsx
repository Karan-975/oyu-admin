import {
  Building2, Users, Droplets, Activity, FileText, Hammer,
  Clock, MessageSquareWarning, TrendingUp, ArrowUpRight, ArrowDownRight,
  MapPin, CheckCircle2, AlertCircle, FlaskConical, Grid, PlusCircle, ClipboardList, BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/endpoints';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth.store';

interface SummaryCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: number;
}

export function DashboardPage() {
  const { user, isSuperAdmin } = useAuthStore();
  const isNgoAdmin = user?.roles?.includes('ngo_admin') && !isSuperAdmin();

  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data.data),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: () => dashboardApi.getActivities(10).then((r) => r.data.data),
  });

  const summary = summaryData ?? {};

  // ── FRS 8.2: NGO Admin Dashboard Cards
  const ngoAdminCards: SummaryCard[] = [
    {
      label: 'Total Active Users',
      value: summary.totalActiveUsers ?? summary.totalTeamMembers ?? 0,
      icon: <Users size={22} />,
      color: 'text-teal-600', bgColor: 'bg-teal-50', trend: 8,
    },
    {
      label: 'Assigned Locations',
      value: summary.totalAssignedLocations ?? 0,
      icon: <MapPin size={22} />,
      color: 'text-blue-600', bgColor: 'bg-blue-50',
    },
    {
      label: 'Accessible Boreholes',
      value: summary.totalAccessibleBoreholes ?? summary.totalBoreholes ?? 0,
      icon: <Droplets size={22} />,
      color: 'text-indigo-600', bgColor: 'bg-indigo-50', trend: 24,
    },
    {
      label: 'Activities In Progress',
      value: summary.activitiesInProgress ?? summary.surveysInProgress ?? 0,
      icon: <Activity size={22} />,
      color: 'text-violet-600', bgColor: 'bg-violet-50',
    },
    {
      label: 'Completed Activities',
      value: summary.completedActivities ?? 0,
      icon: <CheckCircle2 size={22} />,
      color: 'text-emerald-600', bgColor: 'bg-emerald-50', trend: 5,
    },
    {
      label: 'Pending Activities',
      value: summary.pendingActivities ?? 0,
      icon: <AlertCircle size={22} />,
      color: 'text-amber-600', bgColor: 'bg-amber-50',
    },
    {
      label: 'Monitoring Pending',
      value: summary.monitoringPending ?? 0,
      icon: <Clock size={22} />,
      color: 'text-orange-600', bgColor: 'bg-orange-50',
    },
    {
      label: 'Open Grievances',
      value: summary.openGrievances ?? 0,
      icon: <MessageSquareWarning size={22} />,
      color: 'text-rose-600', bgColor: 'bg-rose-50', trend: -7,
    },
    {
      label: 'Water Testing Pending',
      value: summary.waterTestingPending ?? 0,
      icon: <FlaskConical size={22} />,
      color: 'text-cyan-600', bgColor: 'bg-cyan-50',
    },
  ];

  // ── FRS 9.2: Super Admin Dashboard Cards (Full 13 cards)
  const superAdminCards: SummaryCard[] = [
    {
      label: 'Total NGOs',
      value: summary.totalNgos ?? 0,
      icon: <Building2 size={22} />,
      color: 'text-teal-600', bgColor: 'bg-teal-50', trend: 12,
    },
    {
      label: 'Total Active Users',
      value: summary.totalTeamMembers ?? 0,
      icon: <Users size={22} />,
      color: 'text-blue-600', bgColor: 'bg-blue-50', trend: 8,
    },
    {
      label: 'Total Boreholes',
      value: summary.totalBoreholes ?? 0,
      icon: <Droplets size={22} />,
      color: 'text-indigo-600', bgColor: 'bg-indigo-50', trend: 24,
    },
    {
      label: 'Boreholes Under Recce',
      value: summary.boreholesUnderRecce ?? 0,
      icon: <FileText size={22} />,
      color: 'text-sky-600', bgColor: 'bg-sky-50',
    },
    {
      label: 'Boreholes Pending Analysis',
      value: summary.boreholesPendingAnalysis ?? 0,
      icon: <AlertCircle size={22} />,
      color: 'text-violet-600', bgColor: 'bg-violet-50',
    },
    {
      label: 'Approved for Rehab',
      value: summary.boreholesApprovedRehab ?? 0,
      icon: <CheckCircle2 size={22} />,
      color: 'text-emerald-600', bgColor: 'bg-emerald-50',
    },
    {
      label: 'Under Rehabilitation',
      value: summary.boreholesUnderRehab ?? summary.rehabilitationInProgress ?? 0,
      icon: <Hammer size={22} />,
      color: 'text-amber-600', bgColor: 'bg-amber-50', trend: 15,
    },
    {
      label: 'Boreholes Completed',
      value: summary.boreholesCompleted ?? 0,
      icon: <CheckCircle2 size={22} />,
      color: 'text-teal-600', bgColor: 'bg-teal-50',
    },
    {
      label: 'Under Monitoring',
      value: summary.boreholesUnderMonitoring ?? summary.monitoringPending ?? 0,
      icon: <Clock size={22} />,
      color: 'text-orange-600', bgColor: 'bg-orange-50',
    },
    {
      label: 'Water Testing Pending',
      value: summary.waterTestingPending ?? 0,
      icon: <FlaskConical size={22} />,
      color: 'text-cyan-600', bgColor: 'bg-cyan-50',
    },
    {
      label: 'WCFT Pending',
      value: summary.wcftPending ?? 0,
      icon: <Activity size={22} />,
      color: 'text-pink-600', bgColor: 'bg-pink-50',
    },
    {
      label: 'Open Grievances',
      value: summary.openGrievances ?? 0,
      icon: <MessageSquareWarning size={22} />,
      color: 'text-rose-600', bgColor: 'bg-rose-50', trend: -7,
    },
    {
      label: 'Closed Grievances',
      value: summary.closedGrievances ?? 0,
      icon: <CheckCircle2 size={22} />,
      color: 'text-slate-600', bgColor: 'bg-slate-100',
    },
  ];

  // ── FRS 9.2: Super Admin Quick Actions
  const quickActions = [
    { label: 'Borehole Matrix', to: '/boreholes/matrix', icon: <Grid size={20} />, color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/70' },
    { label: 'Create Borehole', to: '/boreholes/new', icon: <PlusCircle size={20} />, color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-100 hover:bg-teal-100/70' },
    { label: 'LSC Records', to: '/surveys?type=lsc', icon: <ClipboardList size={20} />, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-100 hover:bg-blue-100/70' },
    { label: 'Grievance Management', to: '/grievances', icon: <MessageSquareWarning size={20} />, color: 'text-rose-600', bgColor: 'bg-rose-50 border-rose-100 hover:bg-rose-100/70' },
    { label: 'Water Testing Review', to: '/water-testing', icon: <FlaskConical size={20} />, color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-100 hover:bg-cyan-100/70' },
    { label: 'Reports Dashboard', to: '/reports', icon: <BarChart3 size={20} />, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-100 hover:bg-amber-100/70' },
  ];

  const cards = isNgoAdmin ? ngoAdminCards : superAdminCards;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isNgoAdmin
            ? `${user?.firstName ? `Welcome back, ${user.firstName}! ` : ''}Your NGO operations overview`
            : 'Platform overview and key operational metrics'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="stat-card group cursor-pointer bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200">
            <div className="flex items-start justify-between">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', card.bgColor, card.color)}>
                {card.icon}
              </div>
              {card.trend !== undefined && (
                <div className={cn(
                  'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                   card.trend >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                )}>
                  {card.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-slate-800">{(card.value ?? 0).toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Panel - Only for Super Admins / Platform Admins */}
      {!isNgoAdmin && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Quick Actions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quick access shortcuts to key Super Admin tasks</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all cursor-pointer",
                  action.bgColor
                )}
              >
                <div className={cn("mb-2 p-2 rounded-lg bg-white shadow-sm", action.color)}>
                  {action.icon}
                </div>
                <span className="text-xs font-semibold text-slate-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Borehole Progress Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly rehabilitation & monitoring activity</p>
            </div>
            <div className="flex gap-2">
              {['6M', '1Y', 'All'].map((period) => (
                <button key={period} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors">
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-teal-50/50 to-aqua-50/50 rounded-lg border border-dashed border-slate-200">
            <div className="text-center">
              <TrendingUp size={40} className="text-teal-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Charts load with live data</p>
              <p className="text-xs text-slate-300 mt-1">Connect backend to see Recharts visualization</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {(activitiesData ?? []).length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
                  <div className="w-8 h-8 rounded-full bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              (activitiesData as any[]).slice(0, 8).map((activity: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                    <Activity size={14} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{activity.first_name}</span> {activity.action} {activity.entity_type}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
