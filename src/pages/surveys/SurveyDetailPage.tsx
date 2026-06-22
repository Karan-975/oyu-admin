import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surveysApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw,
  Calendar, User, FileText, BarChart2, MessageSquare, X, Loader2, Building2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth.store';

type ActionType = 'approve' | 'reject' | 'reopen' | 'remark';

export function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useAuthStore();
  const [modal, setModal] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.getById(id!).then(r => r.data.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['survey', id] });
    queryClient.invalidateQueries({ queryKey: ['surveys'] });
    setModal(null);
    setNotes('');
  };

  const approveMutation = useMutation({
    mutationFn: (notes?: string) => surveysApi.approve(id!, notes),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: (notes: string) => surveysApi.reject(id!, notes),
    onSuccess: invalidate,
  });

  const reopenMutation = useMutation({
    mutationFn: (notes?: string) => surveysApi.reopen(id!, notes),
    onSuccess: invalidate,
  });

  const isAnyPending = approveMutation.isPending || rejectMutation.isPending || reopenMutation.isPending;

  const handleModalSubmit = () => {
    if (!modal) return;
    if (modal === 'approve') approveMutation.mutate(notes || undefined);
    if (modal === 'reject') {
      if (!notes.trim()) { alert('Rejection reason is required.'); return; }
      rejectMutation.mutate(notes);
    }
    if (modal === 'reopen' || modal === 'remark') reopenMutation.mutate(notes || undefined);
  };

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <EmptyState
        title="Survey not found"
        description="The requested survey record does not exist or you lack permission to view it."
        icon={<FileText size={40} />}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate('/surveys')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to List
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {/* FRS 9.8: Super Admin — Approve / Reject when submitted */}
          {isSuperAdmin() && data.status === 'submitted' && (
            <>
              <button
                onClick={() => { setModal('approve'); setNotes(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                <CheckCircle2 size={14} /> Approve Survey
              </button>
              <button
                onClick={() => { setModal('reject'); setNotes(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
              >
                <XCircle size={14} /> Reject Survey
              </button>
            </>
          )}
          {/* FRS 8.6: NGO Admin + Super Admin — Add Remarks */}
          {(data.status === 'submitted' || data.status === 'draft') && (
            <button
              onClick={() => { setModal('remark'); setNotes(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition-colors"
            >
              <MessageSquare size={14} /> Add Remarks
            </button>
          )}
          {/* FRS 8.6: Reopen rejected surveys */}
          {data.status === 'rejected' && (
            <button
              onClick={() => { setModal('reopen'); setNotes(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
            >
              <RotateCcw size={14} /> Reopen Submission
            </button>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Survey Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Borehole</label>
                <p className="font-semibold text-slate-800 text-sm">{data.borehole_code}</p>
                <p className="text-xs text-slate-400">{data.borehole_name}</p>
              </div>
              {data.ngo_name && (
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">NGO</label>
                  <span className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                    <Building2 size={12} className="text-teal-500" /> {data.ngo_name}
                  </span>
                </div>
              )}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Survey Type / Module</label>
                <p className="text-sm font-medium text-violet-700 bg-violet-50/70 inline-block px-2 py-0.5 rounded uppercase">{data.survey_type}</p>
                <p className="text-xs text-slate-500 mt-1">{data.module_name}</p>
              </div>
              <div className="flex justify-between items-center py-1.5 border-y border-slate-50">
                <span className="text-xs text-slate-500">Status</span>
                <StatusBadge status={data.status} />
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <BarChart2 size={13} className="text-slate-400" /> Score
                </span>
                <span className="text-sm font-bold text-slate-700">{data.score ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Submission Details</h3>
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <User size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">Submitted By</p>
                  <p className="font-medium">
                    {data.first_name ? `${data.first_name} ${data.last_name}` : 'Field User'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">Submitted At</p>
                  <p className="font-medium">
                    {data.submitted_at ? new Date(data.submitted_at).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
              {data.reviewer_first && (
                <div className="flex items-center gap-2.5 border-t border-slate-50 pt-3">
                  <User size={15} className="text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-[10px]">Reviewed By</p>
                    <p className="font-medium">{data.reviewer_first} {data.reviewer_last}</p>
                  </div>
                </div>
              )}
              {data.review_notes && (
                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  <p className="text-[10px] text-amber-700 uppercase font-semibold">Reviewer Notes / Remarks</p>
                  <p className="text-xs text-amber-800 mt-1 italic">"{data.review_notes}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Values list */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Field Survey Inputs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Dynamic form answers submitted by field staff</p>
          </div>

          <div className="divide-y divide-slate-100">
            {data.values && data.values.length > 0 ? (
              data.values.map((val: any) => {
                let displayVal = val.value_text;
                if (val.value_json) {
                  try {
                    const parsed = JSON.parse(val.value_json);
                    displayVal = typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : val.value_json;
                  } catch {
                    displayVal = val.value_json;
                  }
                }
                const isCodeblock = displayVal && (displayVal.includes('{') || displayVal.length > 60);

                return (
                  <div key={val.id} className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="text-xs font-semibold text-slate-500 sm:col-span-1">
                      {val.field_key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                    <div className="sm:col-span-2">
                      {isCodeblock ? (
                        <pre className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 overflow-x-auto text-slate-600 font-mono max-h-40">
                          {displayVal}
                        </pre>
                      ) : (
                        <span className="text-sm text-slate-700 font-medium">{displayVal || '—'}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <FileText size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No field values recorded for this submission.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Action Modal (FRS 8.6: Add Remarks, Reopen Submission | FRS 9.8: Approve/Reject) */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {modal === 'approve' && 'Approve Survey'}
                {modal === 'reject' && 'Reject Survey'}
                {modal === 'reopen' && 'Reopen Submission'}
                {modal === 'remark' && 'Add Remarks'}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {modal === 'approve' && 'Add optional approval notes. The field team will see this.'}
              {modal === 'reject' && 'Provide a clear rejection reason (required). The field team will correct and resubmit.'}
              {modal === 'reopen' && 'Notes about why this submission is reopened for correction.'}
              {modal === 'remark' && 'Add review remarks requesting corrections. Survey will be reopened for the field team to resubmit.'}
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                modal === 'reject' || modal === 'remark'
                  ? 'Required — explain what needs to be corrected...'
                  : 'Optional notes...'
              }
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
            />
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                disabled={isAnyPending}
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2',
                  modal === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  modal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  'bg-amber-600 hover:bg-amber-700'
                )}
              >
                {isAnyPending && <Loader2 size={14} className="animate-spin" />}
                {modal === 'approve' && 'Approve'}
                {modal === 'reject' && 'Reject'}
                {modal === 'reopen' && 'Reopen'}
                {modal === 'remark' && 'Send Remarks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
