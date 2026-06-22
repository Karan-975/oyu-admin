import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, ngosApi } from '../../api/endpoints';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { 
  BarChart3, Download, FileText, Building2, MessageSquareWarning, 
  Droplets, Calendar, Users, Activity, ShieldCheck, HelpCircle, 
  Search, Filter
} from 'lucide-react';
import { cn } from '../../lib/utils';

type ReportType = 
  | 'borehole_lifecycle'
  | 'user_performance'
  | 'ngo_operational'
  | 'rehabilitation'
  | 'water_testing'
  | 'lsc_activity'
  | 'grievance'
  | 'monitoring'
  | 'assignment_access'
  | 'carbon_compliance'
  | 'audit_summary'
  | 'borehole_progress';

const reportTypes: { key: ReportType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { key: 'borehole_lifecycle', label: 'Borehole Lifecycle', description: 'Lifecycle status and stages across all boreholes', icon: <Droplets size={20} />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'user_performance', label: 'User Performance', description: 'Detailed member operational activity & edits log', icon: <Users size={20} />, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { key: 'ngo_operational', label: 'NGO Operational', description: 'NGO statistics, assigned sites, & member counts', icon: <Building2 size={20} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { key: 'rehabilitation', label: 'Rehabilitation Records', description: 'NGO rehabilitation progress & approval logs', icon: <BarChart3 size={20} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { key: 'water_testing', label: 'Water Testing', description: 'Testing parameter logs (pH, TDS, EC, Turbidity)', icon: <Activity size={20} />, color: 'bg-sky-50 text-sky-600 border-sky-200' },
  { key: 'lsc_activity', label: 'LSC Activity', description: 'LSC consultations rates and highlighted community feedback', icon: <FileText size={20} />, color: 'bg-violet-50 text-violet-600 border-violet-200' },
  { key: 'grievance', label: 'Grievance Reports', description: 'Grievance categories, resolution times, & counts', icon: <MessageSquareWarning size={20} />, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { key: 'monitoring', label: 'Monitoring Reports', description: 'Post-rehabilitation functionality checkups', icon: <ShieldCheck size={20} />, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'assignment_access', label: 'Assignments & Access', description: 'Module access logs & direct site allocations', icon: <HelpCircle size={20} />, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { key: 'carbon_compliance', label: 'Carbon & Compliance', description: 'KYC status and digital signature compliance logs', icon: <FileText size={20} />, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { key: 'audit_summary', label: 'Audit Logs Summary', description: 'Historical system modifications and changes timeline', icon: <ClockIcon size={20} />, color: 'bg-slate-50 text-slate-600 border-slate-200' },
  { key: 'borehole_progress', label: 'Borehole Progress', description: 'Borehole inventory with status and assignments', icon: <Droplets size={20} />, color: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
];

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  
  // Filtering States
  const [ngoFilter, setNgoFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', selectedReport, ngoFilter, startDate, endDate],
    queryFn: () => reportsApi.get(selectedReport!, { ngoId: ngoFilter || undefined, startDate: startDate || undefined, endDate: endDate || undefined }).then(r => r.data.data),
    enabled: !!selectedReport,
  });

  // Fetch NGOs for filter dropdown
  const { data: ngosData } = useQuery({
    queryKey: ['ngos-list-reports'],
    queryFn: () => ngosApi.list({ limit: 100 }).then((r) => r.data.data),
  });

  const exportCSV = () => {
    if (!reportData?.length) return;
    const headers = Object.keys(reportData[0]);
    const csv = [
      headers.join(','), 
      ...reportData.map((row: any) => headers.map(h => `"${row[h] ?? ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = `${selectedReport}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); 
    URL.revokeObjectURL(url);
  };

  // Filter client-side based on search query
  const filteredData = reportData?.filter((row: any) => {
    if (!searchQuery.trim()) return true;
    const searchString = Object.values(row)
      .map((val: any) => val?.toString()?.toLowerCase() ?? '')
      .join(' ');
    return searchString.includes(searchQuery.toLowerCase().trim());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Generate operational reports, apply filters, and export data in CSV format</p>
      </div>

      {/* Report Type Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((rt) => (
          <button 
            key={rt.key} 
            onClick={() => { setSelectedReport(rt.key); setSearchQuery(''); }}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition-all hover:shadow-md flex items-start gap-4',
              selectedReport === rt.key 
                ? 'border-teal-400 bg-teal-50/20 shadow-md shadow-teal-500/5' 
                : 'border-slate-100 bg-white hover:border-slate-200'
            )}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', rt.color)}>
              {rt.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{rt.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{rt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters and Table preview */}
      {selectedReport && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">
                {reportTypes.find(r => r.key === selectedReport)?.label} Report
              </h3>
            </div>
            {filteredData?.length > 0 && (
              <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100/70 transition-colors"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>

          {/* Filtering Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
            {/* Search filter */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search report records..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {/* NGO Filter */}
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              <select
                value={ngoFilter}
                onChange={(e) => setNgoFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">All Partner NGOs</option>
                {(ngosData ?? []).map((ngo: any) => (
                  <option key={ngo.id} value={ngo.id}>{ngo.name}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-500"
              />
            </div>

            {/* End Date */}
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-500"
              />
            </div>
          </div>

          {/* Report Data Preview Grid */}
          {isLoading ? (
            <PageLoader />
          ) : !filteredData?.length ? (
            <EmptyState title="No data matching filters" description="Adjust your filters or search criteria." icon={<BarChart3 size={40} />} />
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="data-table">
                <thead className="bg-slate-50">
                  <tr>
                    {Object.keys(filteredData[0]).map((key) => (
                      <th key={key} className="text-xs font-bold text-slate-600 px-4 py-3">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredData.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                      {Object.entries(row).map(([key, val]: any, j: number) => {
                        let content = val?.toString() ?? '—';
                        if (key?.toLowerCase()?.includes('date') || key?.toLowerCase()?.includes('_at')) {
                          if (val) {
                            try {
                              content = new Date(val).toLocaleDateString();
                            } catch (e) {}
                          }
                        }
                        return (
                          <td key={j} className="text-xs text-slate-600 px-4 py-3 whitespace-nowrap">
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClockIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
