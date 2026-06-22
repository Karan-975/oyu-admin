import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { waterTestingApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { FlaskConical, Search, Filter, Eye, Calendar, MapPin, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function WaterTestingListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const queryParams: any = { page, limit: 20 };
  if (search.trim()) queryParams.search = search.trim();
  if (statusFilter) queryParams.status = statusFilter;

  const { data, isLoading, error } = useQuery({
    queryKey: ['water-testing', page, search.trim(), statusFilter],
    queryFn: () => waterTestingApi.list(queryParams).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="text-teal-600 animate-pulse" size={24} /> Water Quality Testing
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review lab reports and manage chemical & biological water parameters</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by borehole code, village..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-slate-400 mr-1" />
            {['', 'submitted', 'report_uploaded', 'published', 'rejected'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                  statusFilter === s
                    ? 'bg-teal-550 bg-teal-600 text-white border-teal-600'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50 bg-white'
                )}
              >
                {s ? s.replace(/_/g, ' ').toUpperCase() : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Failed to load water testing records"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<FlaskConical size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No water testing records found" description="Records appear here once field teams collect water samples." icon={<FlaskConical size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test ID</th>
                  <th>Borehole</th>
                  <th>Location</th>
                  <th>Submitted By</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((record: any) => (
                  <tr key={record.id} className="group hover:bg-slate-50/55 transition-all">
                    <td className="font-semibold text-slate-700 text-xs truncate max-w-[120px]">
                      {record.id.slice(0, 8).toUpperCase()}...
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{record.borehole_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 py-0.5 rounded w-max mt-0.5">{record.borehole_code}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-slate-500 text-xs">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {record.village}</span>
                        <span className="text-[10px] pl-4">{record.district}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {record.submitted_by_name?.charAt(0)}
                        </div>
                        <span className="truncate max-w-[120px]">{record.submitted_by_name || 'Field Member'}</span>
                      </div>
                    </td>
                    <td className="text-slate-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {new Date(record.submission_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => navigate(`/water-testing/${record.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition-all text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
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
