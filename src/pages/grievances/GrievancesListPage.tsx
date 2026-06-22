import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { grievancesApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { MessageSquareWarning, Search, Filter, Eye, UserPlus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function GrievancesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['grievances', page, statusFilter, priorityFilter],
    queryFn: () => grievancesApi.list({ page, limit: 20, status: statusFilter || undefined, priority: priorityFilter || undefined }).then(r => r.data),
  });

  const statuses = ['', 'draft', 'submitted', 'under_review', 'action_in_progress', 'closed', 'reopened'];
  const priorities = ['', 'low', 'medium', 'high', 'critical'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Grievance Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track and resolve community grievances</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            {statuses.map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  statusFilter === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50')}>
                {s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Priority:</span>
            {priorities.map((p) => (
              <button key={p} onClick={() => { setPriorityFilter(p); setPage(1); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  priorityFilter === p ? 'bg-rose-50 text-rose-700 border-rose-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50')}>
                {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Grievances"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<MessageSquareWarning size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No grievances found" icon={<MessageSquareWarning size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Borehole</th><th>Category</th><th>Priority</th><th>Submitted By</th><th>Assigned To</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {data.data.map((g: any) => (
                  <tr key={g.id} className="cursor-pointer" onClick={() => navigate(`/grievances/${g.id}`)}>
                    <td>
                      <p className="font-medium text-sm text-slate-700 max-w-[250px] truncate">{g.title}</p>
                      <p className="text-[10px] text-slate-400 max-w-[250px] truncate">{g.description}</p>
                    </td>
                    <td className="text-xs text-slate-500">{g.borehole_code || '—'}</td>
                    <td className="text-xs text-slate-500">{g.category || '—'}</td>
                    <td><StatusBadge status={g.priority} /></td>
                    <td className="text-xs text-slate-500">{g.submitted_by_name ? `${g.submitted_by_name} ${g.submitted_by_last}` : '—'}</td>
                    <td className="text-xs text-slate-500">{g.assigned_to_name || <span className="text-slate-300">Unassigned</span>}</td>
                    <td><StatusBadge status={g.status} /></td>
                    <td className="text-xs text-slate-400">{new Date(g.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pagination && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />}
          </>
        )}
      </div>
    </div>
  );
}
