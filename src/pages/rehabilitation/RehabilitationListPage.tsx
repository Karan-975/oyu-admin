import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { rehabilitationApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Hammer, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RehabilitationListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['rehabilitation', page, statusFilter, stageFilter],
    queryFn: () => rehabilitationApi.list({ page, limit: 20, status: statusFilter || undefined, stage: stageFilter || undefined }).then(r => r.data),
  });

  const stages = ['', 'pre_assessment', 'activities', 'post_testing', 'community_handover', 'documentation'];
  const statuses = ['', 'pending', 'in_progress', 'completed', 'approved', 'rejected'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rehabilitation Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor borehole rehabilitation progress across all stages</p>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-1">
          {stages.slice(1).map((stage, i) => (
            <button key={stage} onClick={() => { setStageFilter(stageFilter === stage ? '' : stage); setPage(1); }}
              className={cn('flex-1 py-3 px-2 rounded-lg text-center text-xs font-semibold transition-all border-2',
                stageFilter === stage ? 'bg-teal-50 text-teal-700 border-teal-300' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100')}>
              <span className="block text-lg mb-0.5">{['🔍', '🔧', '🧪', '🤝', '📋'][i]}</span>
              {stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 p-4 border-b border-slate-100">
          <Filter size={16} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          {statuses.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                statusFilter === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50')}>
              {s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Rehabilitation records"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<Hammer size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No rehabilitation records" icon={<Hammer size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead><tr><th>Borehole</th><th>Submitted By</th><th>Stage</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
              <tbody>
                {data.data.map((r: any) => (
                  <tr key={r.id} className="cursor-pointer" onClick={() => navigate(`/rehabilitation/${r.id}`)}>
                    <td>
                      <p className="font-semibold text-sm text-slate-700">{r.borehole_code}</p>
                      <p className="text-[10px] text-slate-400">{r.borehole_name}</p>
                    </td>
                    <td className="text-sm text-slate-600">{r.created_by_name || 'Field team'}</td>
                    <td><span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase">{r.stage?.replace(/_/g, ' ')}</span></td>
                    <td className="text-xs text-slate-400">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'}</td>
                    <td className="text-xs text-slate-400">{r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
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
