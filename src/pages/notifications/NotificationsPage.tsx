import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/endpoints';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { 
  Bell, CheckCheck, Check, Activity, ClipboardList, MessageSquareWarning, 
  Hammer, Settings, Eye, Archive, Trash2 
} from 'lucide-react';
import { cn } from '../../lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  assignment: <ClipboardList size={16} className="text-blue-500" />,
  approval: <Check size={16} className="text-emerald-500" />,
  rejection: <Activity size={16} className="text-red-500" />,
  rehabilitation: <Hammer size={16} className="text-amber-500" />,
  grievance: <MessageSquareWarning size={16} className="text-rose-500" />,
  system: <Settings size={16} className="text-slate-400" />,
};

type NotificationType = 'all' | 'assignment' | 'approval' | 'rejection' | 'rehabilitation' | 'grievance' | 'system';

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType>('all');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  // Load archived notifications from localStorage
  useEffect(() => {
    const archived = localStorage.getItem('oyu_archived_notifications');
    if (archived) {
      try {
        setArchivedIds(JSON.parse(archived));
      } catch (e) {}
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationsApi.list({ limit: 100, unreadOnly: unreadOnly ? 'true' : undefined }).then(r => r.data),
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent trigger click navigation
    const updated = [...archivedIds, id];
    setArchivedIds(updated);
    localStorage.setItem('oyu_archived_notifications', JSON.stringify(updated));
  };

  const clearAllArchived = () => {
    setArchivedIds([]);
    localStorage.removeItem('oyu_archived_notifications');
  };

  const handleNotificationClick = (n: any) => {
    if (!n.is_read) {
      markReadMutation.mutate(n.id);
    }
    
    // Support routing based on reference entity
    const refId = n.reference_id || n.referenceId;
    const refType = n.reference_type || n.referenceType;

    if (refId && refType) {
      switch (refType.toLowerCase()) {
        case 'borehole':
          navigate(`/boreholes/${refId}`);
          break;
        case 'survey':
          navigate(`/surveys/${refId}`);
          break;
        case 'grievance':
          navigate(`/grievances/${refId}`);
          break;
        case 'rehabilitation':
          navigate(`/rehabilitation/${refId}`);
          break;
        case 'water_testing':
        case 'water-testing':
          navigate(`/water-testing/${refId}`);
          break;
        case 'user':
          navigate(`/settings/users/${refId}/kyc-review`);
          break;
        default:
          break;
      }
    }
  };

  // Filter local results based on type and archive status
  const rawNotifications = data?.data ?? [];
  const filteredNotifications = rawNotifications.filter((n: any) => {
    // Exclude archived
    if (archivedIds.includes(n.id)) return false;
    
    // Filter by type
    if (selectedType === 'all') return true;
    return n.type?.toLowerCase() === selectedType;
  });

  const unreadCount = rawNotifications.filter((n: any) => !n.is_read && !archivedIds.includes(n.id)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {unreadCount ? `${unreadCount} unread notifications` : 'All caught up'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg border transition-colors',
              unreadOnly ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50'
            )}
          >
            {unreadOnly ? 'Showing Unread' : 'Show Unread Only'}
          </button>
          
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllReadMutation.mutate()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}

          {archivedIds.length > 0 && (
            <button 
              onClick={clearAllArchived}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <Trash2 size={14} /> Clear Archive List
            </button>
          )}
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-white rounded-xl border border-slate-100 shadow-sm p-1.5">
        {(['all', 'assignment', 'approval', 'rejection', 'rehabilitation', 'grievance', 'system'] as NotificationType[]).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className={cn(
              'px-3.5 py-2 rounded-lg text-xs font-semibold uppercase transition-all',
              selectedType === t 
                ? 'bg-teal-50 text-teal-700 shadow-sm font-bold' 
                : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : !filteredNotifications.length ? (
          <EmptyState title="No notifications found" description="You're all caught up!" icon={<Bell size={40} />} />
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((n: any) => (
              <div 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn(
                  'flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer group relative hover:bg-slate-50/50',
                  n.is_read ? 'bg-white' : 'bg-blue-50/25'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                  n.is_read ? 'bg-slate-50 border-slate-150' : 'bg-white border-blue-200 shadow-sm'
                )}>
                  {typeIcons[n.type?.toLowerCase()] ?? typeIcons.system}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm', n.is_read ? 'text-slate-600' : 'text-slate-800 font-bold')}>
                      {n.title}
                    </p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message || n.body}</p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                    
                    {n.reference_id && (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Eye size={10} /> View details
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Quick Action: Archive */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-6 top-1/2 -translate-y-1/2">
                  <button
                    onClick={(e) => handleArchive(e, n.id)}
                    title="Archive notification"
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
