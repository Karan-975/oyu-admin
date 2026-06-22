import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { grievancesApi, usersApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { ArrowLeft, User, Calendar, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

export function GrievanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const { data: grievance, isLoading: isGrievanceLoading, error } = useQuery({
    queryKey: ['grievance', id],
    queryFn: () => grievancesApi.getById(id!).then(r => r.data.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then(r => r.data.data),
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => grievancesApi.assign(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievance', id] });
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) => grievancesApi.updateStatus(id!, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievance', id] });
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => grievancesApi.addComment(id!, commentText, isInternal),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['grievance', id] });
    },
  });

  const handleAssign = (userId: string) => {
    if (!userId) return;
    assignMutation.mutate(userId);
  };

  const handleUpdateStatus = (newStatus: string) => {
    const notes = prompt(`Enter notes for changing status to "${newStatus.replace(/_/g, ' ')}" (optional):`);
    if (notes === null) return;
    statusMutation.mutate({ status: newStatus, notes });
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    commentMutation.mutate();
  };

  if (isGrievanceLoading) return <PageLoader />;
  if (error || !grievance) {
    return (
      <EmptyState
        title="Grievance not found"
        description="The requested grievance does not exist or you do not have permission to view it."
        icon={<AlertCircle size={40} />}
      />
    );
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/grievances')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
          <ArrowLeft size={16} /> Back to List
        </button>
        <div className="flex items-center gap-2">
          {(grievance.status === 'submitted' || grievance.status === 'reopened' || grievance.status === 'draft') && (
            <button onClick={() => handleUpdateStatus('under_review')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
              Start Review
            </button>
          )}
          {grievance.status === 'under_review' && (
            <button onClick={() => handleUpdateStatus('action_in_progress')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors">
              Set Action In Progress
            </button>
          )}
          {grievance.status !== 'closed' && (
            <button onClick={() => handleUpdateStatus('closed')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-600 hover:bg-slate-700 rounded-lg shadow-sm transition-colors">
              <AlertCircle size={14} /> Close Grievance
            </button>
          )}
          {grievance.status === 'closed' && (
            <button onClick={() => handleUpdateStatus('reopened')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors">
              Reopen Grievance
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Grievance info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Grievance Info</h3>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Borehole</label>
                <p className="font-semibold text-slate-800 text-sm">{grievance.borehole_code || 'General / None'}</p>
                {grievance.borehole_name && <p className="text-xs text-slate-400">{grievance.borehole_name}</p>}
              </div>
              <div className="flex justify-between items-center py-1.5 border-y border-slate-50">
                <span className="text-xs text-slate-500 font-medium">Status</span>
                <StatusBadge status={grievance.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Priority</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded border uppercase ${priorityColors[grievance.priority] || 'bg-slate-50 text-slate-700'}`}>
                  {grievance.priority}
                </span>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Category</label>
                <p className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded px-2 py-1 mt-1 inline-block uppercase">
                  {grievance.category || 'General'}
                </p>
              </div>
            </div>
          </div>

          {/* Assignments and reporting metadata */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 border-b border-slate-50 pb-2">Assignments & Meta</h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">Reported At</p>
                  <p className="font-medium">{grievance.created_at ? new Date(grievance.created_at).toLocaleString() : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <User size={15} className="text-slate-400" />
                <div>
                  <p className="text-slate-400 text-[10px]">Reported By</p>
                  <p className="font-medium">{grievance.submitted_by_name ? `${grievance.submitted_by_name} ${grievance.submitted_by_last || ''}` : 'Field Staff'}</p>
                </div>
              </div>
              <div className="border-t border-slate-50 pt-3">
                <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Assigned To</label>
                <select
                  value={grievance.assigned_to || ''}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">-- Unassigned --</option>
                  {usersData?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Grievance title, description, and comments thread */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</span>
              <h2 className="text-lg font-bold text-slate-800 mt-0.5">{grievance.title}</h2>
            </div>
            <div className="border-t border-slate-50 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</span>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100/50">
                {grievance.description}
              </p>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-slate-400" />
              Activity & Comments
            </h3>

            {/* Comments list */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {grievance.comments && grievance.comments.length > 0 ? (
                grievance.comments.map((comment: any) => (
                  <div key={comment.id} className={`p-3 rounded-lg border ${comment.is_internal ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-600">{comment.first_name} {comment.last_name} {comment.is_internal && <span className="ml-1 text-[9px] text-amber-700 bg-amber-100/70 px-1 rounded uppercase font-extrabold">Internal</span>}</span>
                      <span>{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No comments logged yet.
                </div>
              )}
            </div>

            {/* Add comment box */}
            <form onSubmit={handlePostComment} className="border-t border-slate-100 pt-4 space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type a comment..."
                rows={3}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-1.5 text-xs text-slate-500 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  Mark as Internal Comment
                </label>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors shadow-sm"
                >
                  Post Comment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
