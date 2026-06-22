import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { boreholesApi, ngosApi } from '../../api/endpoints';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Pagination } from '../../components/ui/Pagination';
import { LayoutGrid, Search, Filter, Building2, MapPin, CheckCircle, HelpCircle, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BoreholeMatrixPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ngoFilter, setNgoFilter] = useState('');

  const queryParams: any = { page, limit: 15 };
  if (search.trim()) queryParams.search = search.trim();
  if (ngoFilter) queryParams.ngoId = ngoFilter;

  // Fetch matrix records
  const { data, isLoading, error } = useQuery({
    queryKey: ['boreholes-matrix', page, search.trim(), ngoFilter],
    queryFn: () => boreholesApi.getMatrix(queryParams).then((r) => r.data),
  });

  // Fetch NGOs for filter dropdown
  const { data: ngosData } = useQuery({
    queryKey: ['ngos-list-simple'],
    queryFn: () => ngosApi.list({ limit: 100 }).then((r) => r.data.data),
  });

  const renderCell = (status: string | null, submissionId: string | null, targetBaseUrl: string) => {
    if (!status) {
      return (
        <div className="flex items-center justify-center py-2 px-1 text-slate-400 bg-slate-50/50 rounded-lg text-xs font-semibold select-none border border-slate-100/50">
          <HelpCircle size={12} className="mr-1 opacity-70" /> Not Started
        </div>
      );
    }

    let badgeClass = '';
    let icon = null;
    let label = '';

    switch (status) {
      case 'approved':
      case 'completed':
      case 'published':
        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300';
        icon = <CheckCircle size={12} className="mr-1 shrink-0" />;
        label = 'Completed';
        break;
      case 'in_progress':
      case 'under_rehabilitation':
      case 'under_testing':
      case 'under_review':
      case 'report_uploaded':
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80 hover:border-blue-300';
        icon = <Play size={12} className="mr-1 shrink-0" />;
        label = 'In Progress';
        break;
      case 'submitted':
        badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80 hover:border-indigo-300';
        icon = <AlertCircle size={12} className="mr-1 shrink-0" />;
        label = 'Awaiting Review';
        break;
      case 'rejected':
        badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80 hover:border-rose-300';
        icon = <XIcon size={12} className="mr-1 shrink-0" />;
        label = 'Rejected';
        break;
      case 'reopened':
        badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80 hover:border-amber-300';
        icon = <RefreshCw size={12} className="mr-1 shrink-0 animate-spin-slow" />;
        label = 'Reopened';
        break;
      default:
        badgeClass = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
        label = status.replace(/_/g, ' ');
    }

    return (
      <button
        onClick={() => submissionId && navigate(`${targetBaseUrl}/${submissionId}`)}
        disabled={!submissionId}
        className={cn(
          "w-full flex items-center justify-center py-2 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-sm",
          badgeClass
        )}
      >
        {icon}
        <span className="truncate">{label.toUpperCase()}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="text-teal-600" size={24} /> Borehole Operational Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual lifecycle tracker showing status across all key operational stages and independent modules
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search boreholes by code or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            <select
              value={ngoFilter}
              onChange={(e) => { setNgoFilter(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">All Partner NGOs</option>
              {(ngosData ?? []).map((ngo: any) => (
                <option key={ngo.id} value={ngo.id}>{ngo.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load operational matrix"
            description={error instanceof Error ? error.message : 'Please check your connection.'}
            icon={<LayoutGrid size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No boreholes found" icon={<LayoutGrid size={40} />} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-150 text-left">
                <thead className="bg-slate-50 font-bold text-slate-600 text-xs">
                  <tr>
                    <th className="px-6 py-4 min-w-[200px]">Borehole Details</th>
                    <th className="px-4 py-4 text-center min-w-[140px]">1. Recce</th>
                    <th className="px-4 py-4 text-center min-w-[140px]">2. Baseline</th>
                    <th className="px-4 py-4 text-center min-w-[140px]">3. Rehabilitation</th>
                    <th className="px-4 py-4 text-center min-w-[140px]">4. Water Testing</th>
                    <th className="px-4 py-4 text-center min-w-[140px]">5. Monitoring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {data.data.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <button
                            onClick={() => navigate(`/boreholes/${row.id}`)}
                            className="font-bold text-slate-700 hover:text-teal-700 text-sm text-left truncate max-w-[220px]"
                          >
                            {row.name}
                          </button>
                          <span className="text-[10px] font-mono text-slate-400 mt-0.5">{row.borehole_code}</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-1 flex items-center gap-1">
                            <MapPin size={10} className="text-slate-400 shrink-0" /> {row.village}, {row.district}
                          </span>
                          {row.ngo_name && (
                            <span className="text-[10px] text-teal-600 font-semibold mt-1">
                              {row.ngo_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">{renderCell(row.recce_status, row.recce_id, '/surveys')}</td>
                      <td className="px-4 py-4">{renderCell(row.baseline_status, row.baseline_id, '/surveys')}</td>
                      <td className="px-4 py-4">{renderCell(row.rehab_status, row.rehab_id, '/rehabilitation')}</td>
                      <td className="px-4 py-4">{renderCell(row.water_testing_status, row.water_testing_id, '/water-testing')}</td>
                      <td className="px-4 py-4">{renderCell(row.monitoring_status, row.monitoring_id, '/surveys')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination && (
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  page={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  total={data.pagination.total}
                  limit={data.pagination.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function XIcon({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 16}
      height={size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
