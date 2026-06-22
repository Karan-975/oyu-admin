import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { boreholesApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Droplets, Plus, Search, Filter, MapPin, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function BoreholesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [funcStatus, setFuncStatus] = useState('');
  const [opStatus, setOpStatus] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['boreholes', page, search, funcStatus, opStatus],
    queryFn: () =>
      boreholesApi
        .list({
          page,
          limit: 20,
          search: search || undefined,
          functionalStatus: funcStatus || undefined,
          operationalStatus: opStatus || undefined,
        })
        .then((r) => r.data),
  });

  const funcStatuses = ['', 'functional', 'partially_functional', 'non_functional', 'unknown'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Borehole Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.pagination?.total ? `${data.pagination.total} boreholes registered` : 'Complete borehole inventory'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/gis')}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all"
          >
            <MapPin size={16} /> Map View
          </button>
          <button
            onClick={() => navigate('/boreholes/new')}
            className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md shadow-teal-500/20"
          >
            <Plus size={18} /> Register Borehole
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, name, village, district..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {funcStatuses.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFuncStatus(status);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap',
                  funcStatus === status
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                {status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All'}
              </button>
            ))}
          </div>
          {/* FRS §7.4: Operational / Lifecycle status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Stage:</span>
            {[
              { value: '', label: 'All' },
              { value: 'newly_created', label: 'New' },
              { value: 'recce_in_progress', label: 'Recce' },
              { value: 'monitoring_pending', label: 'Monitoring' },
              { value: 'under_rehabilitation', label: 'Rehab' },
              { value: 'completed', label: 'Done' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setOpStatus(value); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap',
                  opStatus === value
                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Boreholes"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<Droplets size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No boreholes found" icon={<Droplets size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borehole</th>
                  <th>Location</th>
                  <th>GPS</th>
                  <th>Assigned NGO</th>
                  <th>Functional</th>
                  <th>Operational</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((borehole: any) => (
                  <tr key={borehole.id} className="cursor-pointer" onClick={() => navigate(`/boreholes/${borehole.id}`)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <Droplets size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">{borehole.borehole_code}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{borehole.name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-slate-600">{borehole.village}</p>
                      <p className="text-[10px] text-slate-400">{borehole.district}</p>
                    </td>
                    <td className="text-xs text-slate-400 font-mono">
                      {Number(borehole.latitude).toFixed(4)}, {Number(borehole.longitude).toFixed(4)}
                    </td>
                    <td>
                      {borehole.ngo_name ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Building2 size={12} className="text-teal-500" /> {borehole.ngo_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td><StatusBadge status={borehole.functional_status} /></td>
                    <td><StatusBadge status={borehole.operational_status} /></td>
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
