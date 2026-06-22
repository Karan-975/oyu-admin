import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { surveysApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { FileText, Search, Filter, Eye, CheckCircle, XCircle, RotateCcw, MessageSquare, Building2, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth.store';

export function SurveysListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  // Remarks modal state
  const [remarksModal, setRemarksModal] = useState<{ surveyId: string; action: 'approve' | 'reject' | 'reopen' | 'remark' } | null>(null);
  const [remarksText, setRemarksText] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['surveys', page, search, statusFilter, typeFilter],
    queryFn: () =>
      surveysApi
        .list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined, surveyType: typeFilter || undefined })
        .then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => surveysApi.approve(id, notes),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['surveys'] }); setRemarksModal(null); setRemarksText(''); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => surveysApi.reject(id, notes),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['surveys'] }); setRemarksModal(null); setRemarksText(''); },
  });

  const reopenMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => surveysApi.reopen(id, notes),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['surveys'] }); setRemarksModal(null); setRemarksText(''); },
  });

  const handleModalSubmit = () => {
    if (!remarksModal) return;
    if (remarksModal.action === 'approve') approveMutation.mutate({ id: remarksModal.surveyId, notes: remarksText });
    if (remarksModal.action === 'reject') {
      if (!remarksText.trim()) { alert('Rejection reason is required.'); return; }
      rejectMutation.mutate({ id: remarksModal.surveyId, notes: remarksText });
    }
    if (remarksModal.action === 'reopen') reopenMutation.mutate({ id: remarksModal.surveyId, notes: remarksText });
    if (remarksModal.action === 'remark') {
      // For "Add Remarks" — NGO Admin adds a note without changing status
      // We use the reopen endpoint with a note prefix to indicate remarks
      reopenMutation.mutate({ id: remarksModal.surveyId, notes: remarksText });
    }
  };

  const surveyTypes = ['', 'recce', 'baseline', 'lsc', 'monitoring'];
  // FRS 8.6 / 9.8 status filters
  const statuses = ['', 'draft', 'submitted', 'approved', 'rejected', 'reopened'];

  const isAnyPending = approveMutation.isPending || rejectMutation.isPending || reopenMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Survey Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, and manage field survey submissions — add remarks and reopen as needed
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 min-w-[250px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by borehole code or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Type:</span>
            {surveyTypes.map((s) => (
              <button
                key={s}
                onClick={() => { setTypeFilter(s); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  typeFilter === s ? 'bg-violet-50 text-violet-700 border-violet-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                )}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Types'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  'px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors',
                  statusFilter === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-400 border-slate-100 hover:bg-slate-50'
                )}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Surveys"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<FileText size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No surveys found" icon={<FileText size={40} />} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Borehole</th>
                    <th>Type</th>
                    <th>Module</th>
                    <th>Assigned To</th>
                    {isSuperAdmin() && <th>NGO</th>}
                    <th>Submitted</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((s: any) => (
                    <tr key={s.id} className="group">
                      <td>
                        <div>
                          <p className="font-semibold text-sm text-slate-700">{s.borehole_code}</p>
                          <p className="text-[10px] text-slate-400">{s.borehole_name}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full uppercase">
                          {s.survey_type}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{s.module_name}</td>
                      <td className="text-xs text-slate-500">{s.first_name ? `${s.first_name} ${s.last_name}` : '—'}</td>
                      {isSuperAdmin() && (
                        <td>
                          {s.ngo_name ? (
                            <span className="flex items-center gap-1 text-xs text-slate-600">
                              <Building2 size={11} className="text-teal-500" /> {s.ngo_name}
                            </span>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </td>
                      )}
                      <td className="text-xs text-slate-400">
                        {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="text-sm font-semibold text-slate-700">{s.score ?? '—'}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          {/* View */}
                          <button
                            onClick={() => navigate(`/surveys/${s.id}`)}
                            title="View Details"
                            className="p-1.5 rounded-lg hover:bg-slate-100"
                          >
                            <Eye size={14} className="text-slate-500" />
                          </button>

                          {/* Approve (Super Admin only, when submitted) */}
                          {isSuperAdmin() && s.status === 'submitted' && (
                            <button
                              onClick={() => { setRemarksModal({ surveyId: s.id, action: 'approve' }); setRemarksText(''); }}
                              title="Approve"
                              className="p-1.5 rounded-lg hover:bg-emerald-50"
                            >
                              <CheckCircle size={14} className="text-emerald-500" />
                            </button>
                          )}

                          {/* Reject (Super Admin only, when submitted) */}
                          {isSuperAdmin() && s.status === 'submitted' && (
                            <button
                              onClick={() => { setRemarksModal({ surveyId: s.id, action: 'reject' }); setRemarksText(''); }}
                              title="Reject"
                              className="p-1.5 rounded-lg hover:bg-red-50"
                            >
                              <XCircle size={14} className="text-red-500" />
                            </button>
                          )}

                          {/* Add Remarks (NGO Admin + Super Admin — FRS 8.6, 9.8) */}
                          {(s.status === 'submitted' || s.status === 'draft') && (
                            <button
                              onClick={() => { setRemarksModal({ surveyId: s.id, action: 'remark' }); setRemarksText(''); }}
                              title="Add Remarks"
                              className="p-1.5 rounded-lg hover:bg-violet-50"
                            >
                              <MessageSquare size={14} className="text-violet-500" />
                            </button>
                          )}

                          {/* Reopen (FRS 8.6: NGO Admin can reopen rejected) */}
                          {s.status === 'rejected' && (
                            <button
                              onClick={() => { setRemarksModal({ surveyId: s.id, action: 'reopen' }); setRemarksText(''); }}
                              title="Reopen Submission"
                              className="p-1.5 rounded-lg hover:bg-amber-50"
                            >
                              <RotateCcw size={14} className="text-amber-500" />
                            </button>
                          )}
                        </div>
                      </td>
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

      {/* ── Remarks / Action Modal (FRS 8.6: Add Remarks, Reopen Submission) */}
      {remarksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {remarksModal.action === 'approve' && 'Approve Survey'}
                {remarksModal.action === 'reject' && 'Reject Survey'}
                {remarksModal.action === 'reopen' && 'Reopen Submission'}
                {remarksModal.action === 'remark' && 'Add Remarks'}
              </h3>
              <button
                onClick={() => setRemarksModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {remarksModal.action === 'approve' && 'Add optional approval notes before approving this survey submission.'}
              {remarksModal.action === 'reject' && 'Provide a rejection reason. The field team will see this message.'}
              {remarksModal.action === 'reopen' && 'Provide notes about why this submission is being reopened for correction.'}
              {remarksModal.action === 'remark' && 'Add remarks requesting corrections. The field team will be notified to resubmit.'}
            </p>
            <textarea
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              placeholder={
                remarksModal.action === 'reject' || remarksModal.action === 'remark'
                  ? 'Remarks are required...'
                  : 'Optional notes...'
              }
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
            />
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRemarksModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={isAnyPending}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2',
                  remarksModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  remarksModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-amber-600 hover:bg-amber-700'
                )}
              >
                {isAnyPending && <Loader2 size={14} className="animate-spin" />}
                {remarksModal.action === 'approve' && 'Approve'}
                {remarksModal.action === 'reject' && 'Reject'}
                {remarksModal.action === 'reopen' && 'Reopen'}
                {remarksModal.action === 'remark' && 'Send Remarks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
