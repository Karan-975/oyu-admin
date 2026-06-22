import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ngosApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Building2, Plus, Search, Filter, MoreVertical, Eye, Pencil, Trash2, Users, MapPin, Send, CheckCircle, XCircle, Edit } from 'lucide-react';
import { cn } from '../../lib/utils';

export function NgosListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const queryParams: any = { page, limit: 20 };
  if (search.trim()) queryParams.search = search.trim();
  if (statusFilter) queryParams.status = statusFilter;

  const { data, isLoading, error } = useQuery({
    queryKey: ['ngos', page, search.trim(), statusFilter],
    queryFn: () => ngosApi.list(queryParams).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ngosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setActiveMenu(null);
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ngosApi.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setActiveMenu(null);
    },
  });

  const sendKycMutation = useMutation({
    mutationFn: (id: string) => ngosApi.sendKyc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setActiveMenu(null);
    },
  });

  const signKycMutation = useMutation({
    mutationFn: (id: string) => ngosApi.signKyc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setActiveMenu(null);
    },
  });

  const approveKycMutation = useMutation({
    mutationFn: (id: string) => ngosApi.approveKyc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setActiveMenu(null);
    },
  });

  const rejectKycMutation = useMutation({
    mutationFn: (id: string) => ngosApi.rejectKyc(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setActiveMenu(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">NGO Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage partner NGO organizations and onboarding status</p>
        </div>
        <button
          onClick={() => navigate('/ngos/new')}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md shadow-teal-500/20"
        >
          <Plus size={18} /> Add NGO
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search NGOs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {['', 'active', 'inactive', 'suspended'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  statusFilter === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load NGOs"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<Building2 size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No NGOs found" icon={<Building2 size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Region</th>
                  <th>Boreholes</th>
                  <th>Users</th>
                  <th>KYC Status</th>
                  <th>Signature</th>
                  <th>Status</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((ngo: any) => (
                  <tr key={ngo.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-sm shrink-0">
                          {ngo.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">{ngo.name}</p>
                          {ngo.registration_number && <p className="text-[10px] text-slate-400">{ngo.registration_number}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600">{ngo.contact_person}</td>
                    <td className="text-slate-500 text-xs">{ngo.email}</td>
                    <td>
                      {ngo.region_name && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} /> {ngo.region_name}
                        </span>
                      )}
                    </td>
                    <td className="text-center font-semibold text-slate-700">
                      {ngo.borehole_count ?? 0}
                    </td>
                    <td className="text-center text-slate-500 text-xs">
                      <div className="flex items-center justify-center gap-1">
                        <Users size={12} /> {ngo.user_count ?? 0}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={ngo.kyc_status || 'pending_kyc'} />
                    </td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border",
                        ngo.signature_status === 'signed'
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {ngo.signature_status === 'signed' ? 'Signed' : 'Pending'}
                      </span>
                    </td>
                    <td><StatusBadge status={ngo.status} /></td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === ngo.id ? null : ngo.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical size={16} className="text-slate-400" />
                        </button>
                        {activeMenu === ngo.id && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-scale-in">
                            <button onClick={() => { navigate(`/ngos/${ngo.id}`); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50">
                              <Eye size={14} /> View Details
                            </button>
                            <button onClick={() => { navigate(`/ngos/${ngo.id}/edit`); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50">
                              <Pencil size={14} /> Edit
                            </button>

                            {/* KYC Actions */}
                            {(!ngo.kyc_status || ngo.kyc_status === 'pending_kyc') && (
                              <button onClick={() => { sendKycMutation.mutate(ngo.id); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-sky-600 hover:bg-sky-50">
                                <Send size={14} /> Send KYC to NGO
                              </button>
                            )}

                            {ngo.kyc_status === 'pending_signature' && (
                              <button onClick={() => { signKycMutation.mutate(ngo.id); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-teal-600 hover:bg-teal-50">
                                <Edit size={14} /> Sign KYC (NGO)
                              </button>
                            )}

                            {ngo.kyc_status === 'pending_approval' && (
                              <>
                                <button onClick={() => { approveKycMutation.mutate(ngo.id); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-emerald-600 hover:bg-emerald-50">
                                  <CheckCircle size={14} /> Approve KYC
                                </button>
                                <button onClick={() => { rejectKycMutation.mutate(ngo.id); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50">
                                  <XCircle size={14} /> Reject KYC
                                </button>
                              </>
                            )}

                            <button onClick={() => { toggleStatus.mutate({ id: ngo.id, status: ngo.status === 'active' ? 'inactive' : 'active' }); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-amber-600 hover:bg-amber-50">
                              {ngo.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => { if (confirm('Delete this NGO?')) deleteMutation.mutate(ngo.id); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
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
