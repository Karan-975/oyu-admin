import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rehabilitationApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Calendar, User, Hammer, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export function RehabilitationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['rehabilitation-record', id],
    queryFn: () => rehabilitationApi.getById(id!).then(r => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: (notes?: string) => rehabilitationApi.approve(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-record', id] });
      queryClient.invalidateQueries({ queryKey: ['rehabilitation'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (notes: string) => rehabilitationApi.reject(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-record', id] });
      queryClient.invalidateQueries({ queryKey: ['rehabilitation'] });
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (notes?: string) => rehabilitationApi.reopen(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rehabilitation-record', id] });
      queryClient.invalidateQueries({ queryKey: ['rehabilitation'] });
    },
  });

  const handleApprove = () => {
    const notes = prompt('Approval notes (optional):');
    if (notes === null) return;
    approveMutation.mutate(notes);
  };

  const handleReject = () => {
    const notes = prompt('Reason for rejection (required):');
    if (!notes) {
      alert('Rejection reason is required.');
      return;
    }
    rejectMutation.mutate(notes);
  };

  const handleReopen = () => {
    const notes = prompt('Reopen notes (optional):');
    if (notes === null) return;
    reopenMutation.mutate(notes);
  };

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <EmptyState
        title="Record not found"
        description="The requested rehabilitation record does not exist or you lack permission to view it."
        icon={<Hammer size={40} />}
      />
    );
  }

  const stages = ['pre_assessment', 'activities', 'post_testing', 'community_handover', 'documentation'];
  const currentStageIndex = stages.indexOf(data.stage);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/rehabilitation')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to List
        </button>
        <div className="flex items-center gap-2">
          {data.status === 'completed' && (
            <>
              <button onClick={handleApprove} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors">
                <CheckCircle2 size={14} /> Approve Stage
              </button>
              <button onClick={handleReject} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors">
                <XCircle size={14} /> Reject Stage
              </button>
            </>
          )}
          {data.status === 'rejected' && (
            <button onClick={handleReopen} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors">
              <RotateCcw size={14} /> Reopen Stage
            </button>
          )}
        </div>
      </div>

      {/* Stage Flow Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rehabilitation Progress</h3>
        <div className="flex flex-wrap items-center gap-3">
          {stages.map((stage, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isPassed = idx < currentStageIndex;
            return (
              <div key={stage} className="flex items-center gap-2">
                <div className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  isCurrent ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-sm' :
                  isPassed ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-white text-slate-300 border-slate-100'
                )}>
                  {stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                {idx < stages.length - 1 && <span className="text-slate-300">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Summary and Status */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Record Summary</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Borehole</label>
                <p className="font-semibold text-slate-800 text-sm">{data.borehole_code}</p>
                <p className="text-xs text-slate-400">{data.borehole_name}</p>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Field Team Member</label>
                <p className="font-semibold text-slate-800 text-sm flex items-center gap-1"><User size={14} className="text-slate-400" /> {data.created_by_name || 'Not available'}</p>
              </div>
              <div className="flex justify-between items-center py-1.5 border-y border-slate-50">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <StatusBadge status={data.status} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Tracking Metadata</h3>
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">Start Date</p>
                  <p className="font-medium">{data.start_date ? new Date(data.start_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">End Date</p>
                  <p className="font-medium">{data.end_date ? new Date(data.end_date).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 border-t border-slate-50 pt-3">
                <User size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">Logged By</p>
                  <p className="font-medium">{data.created_by_name || 'Field team'}</p>
                </div>
              </div>
              {data.reviewer_name && (
                <div className="flex items-center gap-2.5 border-t border-slate-50 pt-3">
                  <User size={15} className="text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-[10px]">Reviewed By</p>
                    <p className="font-medium">{data.reviewer_name}</p>
                  </div>
                </div>
              )}
              {data.review_notes && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Reviewer Notes</p>
                  <p className="text-xs text-slate-600 mt-1 italic">"{data.review_notes}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Log description */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Stage Description & Notes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Details logged during the rehabilitation activities</p>
          </div>

          <div className="border border-slate-100 p-4 rounded-xl bg-slate-50/50 space-y-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-teal-600 mt-0.5" />
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {data.description || 'No detailed description logged for this stage.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
