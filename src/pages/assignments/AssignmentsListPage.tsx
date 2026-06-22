import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi } from '../../api/endpoints';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Clipboard, Search, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export function AssignmentsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['assignments', page, search, filterType],
    queryFn: () => assignmentsApi.list({ page, limit: 20, assigneeType: filterType || undefined }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Borehole Assignments</h1>
        <p className="text-sm text-slate-500 mt-1">Track assignments of boreholes to NGOs and field officers</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by borehole code or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-slate-400" />
            {['', 'ngo', 'user'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  filterType === type
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                {type === '' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Assignments"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<Clipboard size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState
            title="No assignments found"
            icon={<Clipboard size={40} />}
            description="Assignments will appear here once boreholes are assigned to NGOs or field officers."
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borehole</th>
                  <th>Assignee Type</th>
                  <th>Assignee Name</th>
                  <th>Module / Flow</th>
                  <th>Assigned By</th>
                  <th>Assigned At</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((assignment: any) => (
                  <tr key={assignment.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-sm text-slate-700">{assignment.borehole_code}</p>
                        <p className="text-[10px] text-slate-400">{assignment.borehole_name}</p>
                      </div>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          assignment.assignee_type === 'ngo'
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-purple-50 text-purple-700'
                        )}
                      >
                        {assignment.assignee_type.charAt(0).toUpperCase() + assignment.assignee_type.slice(1)}
                      </span>
                    </td>
                    <td className="text-sm text-slate-600">{assignment.assignee_name || '—'}</td>
                    <td>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">
                        {formatModuleLabel(assignment.module)}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">{assignment.assigned_by_name || '—'}</td>
                    <td className="text-xs text-slate-400">
                      {assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                          assignment.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : assignment.status === 'completed'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-50 text-slate-600'
                        )}
                      >
                        {assignment.status?.charAt(0).toUpperCase() + assignment.status?.slice(1) || 'N/A'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 line-clamp-2">{assignment.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

function formatModuleLabel(module?: string | null) {
  switch (module) {
    case 'flow_1':
      return 'Flow 1: LSC + Grievance';
    case 'flow_2':
      return 'Flow 2: Lifecycle';
    case 'borehole_recce':
      return 'Recce';
    case 'baseline_survey':
      return 'Baseline';
    case 'rehabilitation':
      return 'Rehabilitation';
    case 'monitoring_survey':
      return 'Monitoring';
    case 'lsc_survey':
      return 'LSC';
    case 'grievance':
      return 'Grievance';
    default:
      return 'All assigned modules';
  }
}
