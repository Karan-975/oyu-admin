import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi, usersApi } from '../../api/endpoints';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { ScrollText, Search, Filter, User, Calendar, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

const actionColors: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
  status_change: 'bg-amber-50 text-amber-700',
  approve: 'bg-teal-50 text-teal-700',
  reject: 'bg-rose-50 text-rose-700',
  assign_ngo: 'bg-violet-50 text-violet-700',
  assign_contractor: 'bg-indigo-50 text-indigo-700',
  reset_password: 'bg-orange-50 text-orange-700',
  reopen: 'bg-yellow-50 text-yellow-700',
};

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  
  // Filter States
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch audit logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, entityType, action, userIdFilter, startDate, endDate],
    queryFn: () => auditApi.list({ 
      page, 
      limit: 50, 
      entityType: entityType || undefined, 
      action: action || undefined,
      userId: userIdFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }).then(r => r.data),
  });

  // Fetch users for filtering dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-list-audit-filter'],
    queryFn: () => usersApi.list({ limit: 100 }).then(r => r.data.data),
  });

  const entityTypes = ['', 'user', 'ngo', 'contractor', 'borehole', 'survey', 'grievance', 'rehabilitation', 'form_module', 'role'];
  const actions = ['', 'create', 'update', 'delete', 'status_change', 'approve', 'reject', 'assign_ngo', 'reset_password', 'reopen'];

  const exportLogsCSV = () => {
    if (!data?.data?.length) return;
    const reportData = data.data;
    const headers = ['id', 'created_at', 'action', 'entity_type', 'entity_id', 'ip_address', 'performed_by', 'email'];
    const csv = [
      headers.join(','),
      ...reportData.map((row: any) => [
        row.id,
        row.created_at,
        row.action,
        row.entity_type,
        row.entity_id,
        row.ip_address ?? '',
        `"${row.first_name ?? ''} ${row.last_name ?? ''}"`,
        row.email ?? ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Client side search matching email, name, entity_id
  const filteredData = data?.data?.filter((log: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const name = `${log.first_name ?? ''} ${log.last_name ?? ''}`.toLowerCase();
    const email = (log.email ?? '').toLowerCase();
    const entityId = (log.entity_id ?? '').toLowerCase();
    return name.includes(query) || email.includes(query) || entityId.includes(query);
  }) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScrollText className="text-teal-600" size={24} /> Activity Timeline & Audit Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Complete compliance audit trail of all actions and modifications</p>
        </div>
        {data?.data?.length > 0 && (
          <button
            onClick={exportLogsCSV}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors shadow-sm"
          >
            <Download size={14} /> Export Logs CSV
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
        {/* Filtering panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {/* User Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* User Dropdown */}
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-slate-400 shrink-0" />
            <select
              value={userIdFilter}
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Users</option>
              {(usersData ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
              ))}
            </select>
          </div>

          {/* Action Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Action Types</option>
              {actions.filter(Boolean).map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-500"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-500"
            />
          </div>
        </div>

        {/* Entity type tabs filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filter Entity:</span>
          {entityTypes.map((e) => (
            <button
              key={e}
              onClick={() => { setEntityType(e); setPage(1); }}
              className={cn(
                'px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all uppercase',
                entityType === e 
                  ? 'bg-teal-50 text-teal-700 border-teal-200' 
                  : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'
              )}
            >
              {e || 'All'}
            </button>
          ))}
        </div>

        {/* Data Grid Table */}
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Audit Logs"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<ScrollText size={40} />}
          />
        ) : !filteredData?.length ? (
          <EmptyState title="No activity matching filters found" icon={<ScrollText size={40} />} />
        ) : (
          <>
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Entity ID</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/20">
                      <td className="text-xs text-slate-400 whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.first_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-xs font-bold text-teal-600">
                              {log.first_name[0]}{log.last_name?.[0]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{log.first_name} {log.last_name}</p>
                              <p className="text-[10px] text-slate-400">{log.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">System Auto-action</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border',
                          actionColors[log.action] ?? 'bg-slate-50 text-slate-600 border-slate-200')}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600 uppercase font-semibold px-4 py-3">{log.entity_type}</td>
                      <td className="text-[10px] text-slate-400 font-mono px-4 py-3">
                        {log.entity_id ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                            {log.entity_id.slice(0, 8)}...
                          </span>
                        ) : '—'}
                      </td>
                      <td className="text-xs text-slate-400 px-4 py-3">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pagination && (
              <Pagination 
                page={data.pagination.page} 
                totalPages={data.pagination.totalPages} 
                total={data.pagination.total} 
                limit={data.pagination.limit} 
                onPageChange={setPage} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
