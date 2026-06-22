import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { contractorsApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Wrench, Plus, Search, Filter, MoreVertical, Eye, Pencil, Trash2, Users, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ContractorsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contractors', page, search, statusFilter],
    queryFn: () => contractorsApi.list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contractorsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contractors'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contractor Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage rehabilitation contractors</p>
        </div>
        <button onClick={() => navigate('/contractors/new')}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md shadow-teal-500/20">
          <Plus size={18} /> Add Contractor
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search contractors..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {['', 'active', 'inactive', 'suspended'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  statusFilter === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50')}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Contractors"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<Wrench size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No contractors found" icon={<Wrench size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr><th>Company</th><th>Contact</th><th>Email</th><th>Specialization</th><th>Boreholes</th><th>Users</th><th>Status</th><th className="w-12"></th></tr>
              </thead>
              <tbody>
                {data.data.map((c: any) => (
                  <tr key={c.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-aqua-50 flex items-center justify-center text-aqua-600 font-bold text-sm shrink-0">
                          {c.company_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">{c.company_name}</p>
                          {c.registration_number && <p className="text-[10px] text-slate-400">{c.registration_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">{c.contact_person}</td>
                    <td className="text-xs text-slate-500">{c.email}</td>
                    <td className="text-xs text-slate-500">{c.specialization || '—'}</td>
                    <td className="text-center text-sm font-semibold text-slate-700">{c.borehole_count ?? 0}</td>
                    <td className="text-center"><span className="flex items-center justify-center gap-1 text-sm text-slate-500"><Users size={12} /> {c.user_count ?? 0}</span></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div className="relative">
                        <button onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical size={16} className="text-slate-400" />
                        </button>
                        {activeMenu === c.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-scale-in">
                            <button onClick={() => { navigate(`/contractors/${c.id}`); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"><Eye size={14} /> View</button>
                            <button onClick={() => { navigate(`/contractors/${c.id}/edit`); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"><Pencil size={14} /> Edit</button>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(c.id); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
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
