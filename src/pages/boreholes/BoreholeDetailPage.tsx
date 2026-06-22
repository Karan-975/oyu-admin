import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boreholesApi, usersApi, waterTestingApi, grievancesApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState, PageLoader } from '../../components/ui/PageLoader';
import {
  ArrowLeft, Droplets, MapPin, Building2, Users, Calendar, Pencil,
  Clock, FileText, Hammer, ClipboardList, GitBranch, Loader2, Plus,
  AlertTriangle, ShieldAlert, Sparkles, Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';

type Tab = 'overview' | 'timeline' | 'assignments' | 'surveys' | 'lsc' | 'rehabilitation' | 'water-testing' | 'grievances';

export function BoreholeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [assignmentUserId, setAssignmentUserId] = useState('');
  const [assignmentReason, setAssignmentReason] = useState('');
  const [assignmentModules, setAssignmentModules] = useState<string[]>([]);

  const { data: bh, isLoading, error, refetch } = useQuery({
    queryKey: ['borehole', id],
    queryFn: () => boreholesApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['borehole-timeline', id],
    queryFn: () => boreholesApi.getTimeline(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 'timeline',
  });

  const { data: assignments } = useQuery({
    queryKey: ['borehole-assignments', id],
    queryFn: () => boreholesApi.getAssignments(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 'assignments',
  });

  const { data: teamMembers, isLoading: loadingTeamMembers } = useQuery({
    queryKey: ['borehole-team-members', id, bh?.assigned_ngo_id],
    queryFn: () =>
      usersApi
        .list({
          page: 1,
          limit: 100,
          ngoId: bh?.assigned_ngo_id || undefined,
          roleSlug: 'ngo_team_member',
          status: 'active',
        })
        .then((r) => r.data.data),
    enabled: !!id && !!bh?.assigned_ngo_id && activeTab === 'assignments',
  });

  const { data: surveys } = useQuery({
    queryKey: ['borehole-surveys', id],
    queryFn: () => boreholesApi.getSurveys(id!).then((r) => r.data.data),
    enabled: !!id && (activeTab === 'surveys' || activeTab === 'lsc'),
  });

  const { data: rehab } = useQuery({
    queryKey: ['borehole-rehab', id],
    queryFn: () => boreholesApi.getRehabilitation(id!).then((r) => r.data.data),
    enabled: !!id && activeTab === 'rehabilitation',
  });

  const { data: waterTests } = useQuery({
    queryKey: ['borehole-water-tests', id],
    queryFn: () => waterTestingApi.list({ boreholeId: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'water-testing',
  });

  const { data: grievances } = useQuery({
    queryKey: ['borehole-grievances', id],
    queryFn: () => grievancesApi.list({ boreholeId: id, limit: 50 }).then((r) => r.data.data),
    enabled: !!id && activeTab === 'grievances',
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      boreholesApi.assignUser(id!, {
        userId: assignmentUserId,
        modules: assignmentModules,
        reason: assignmentReason || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['borehole-assignments', id] });
      await queryClient.invalidateQueries({ queryKey: ['borehole', id] });
      setAssignmentUserId('');
      setAssignmentReason('');
      setAssignmentModules([]);
    },
  });

  if (isLoading) return <PageLoader />;
  if (error || !bh) {
    const message = (error as any)?.response?.data?.message
      || (error instanceof Error ? error.message : 'The borehole details could not be loaded.');

    return (
      <div className="space-y-5">
        <button
          onClick={() => navigate('/boreholes')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft size={17} /> Back to Boreholes
        </button>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-10">
          <EmptyState
            title="Unable to open borehole"
            description={message}
            icon={<AlertTriangle size={40} />}
            action={{
              label: 'Try Again',
              onClick: () => void refetch(),
            }}
          />
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <Droplets size={16} /> },
    { key: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
    { key: 'assignments', label: 'Assignments', icon: <ClipboardList size={16} /> },
    { key: 'surveys', label: 'Surveys', icon: <FileText size={16} /> },
    { key: 'lsc', label: 'LSC Consultation', icon: <Users size={16} />, count: bh.lsc_count },
    { key: 'rehabilitation', label: 'Rehabilitation', icon: <Hammer size={16} /> },
    { key: 'water-testing', label: 'Water Testing', icon: <Sparkles size={16} /> },
    { key: 'grievances', label: 'Grievances', icon: <ShieldAlert size={16} />, count: bh.grievance_count },
  ];

  const getStepStatusDetails = (status: string | null, submissionId: string | null, urlPrefix: string) => {
    if (!status) {
      return {
        label: 'Not Started',
        colorClass: 'text-slate-400 bg-slate-100 border-slate-200',
        lineColorClass: 'bg-slate-200',
        action: null
      };
    }
    switch (status) {
      case 'approved':
      case 'completed':
      case 'published':
        return {
          label: 'Completed',
          colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
          lineColorClass: 'bg-emerald-500',
          action: () => navigate(`${urlPrefix}/${submissionId}`)
        };
      case 'in_progress':
      case 'under_rehabilitation':
      case 'under_testing':
      case 'under_review':
      case 'report_uploaded':
        return {
          label: 'In Progress',
          colorClass: 'text-blue-700 bg-blue-50 border-blue-300 animate-pulse',
          lineColorClass: 'bg-blue-400',
          action: submissionId ? () => navigate(`${urlPrefix}/${submissionId}`) : null
        };
      case 'submitted':
        return {
          label: 'Awaiting Review',
          colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-300',
          lineColorClass: 'bg-indigo-400',
          action: () => navigate(`${urlPrefix}/${submissionId}`)
        };
      case 'rejected':
        return {
          label: 'Rejected',
          colorClass: 'text-rose-700 bg-rose-50 border-rose-300',
          lineColorClass: 'bg-rose-400',
          action: () => navigate(`${urlPrefix}/${submissionId}`)
        };
      case 'reopened':
        return {
          label: 'Reopened',
          colorClass: 'text-amber-700 bg-amber-50 border-amber-300',
          lineColorClass: 'bg-amber-400',
          action: () => navigate(`${urlPrefix}/${submissionId}`)
        };
      default:
        return {
          label: status.replace(/_/g, ' '),
          colorClass: 'text-slate-700 bg-slate-50 border-slate-300',
          lineColorClass: 'bg-slate-300',
          action: submissionId ? () => navigate(`${urlPrefix}/${submissionId}`) : null
        };
    }
  };

  const steps = [
    { name: '1. Recce', ...getStepStatusDetails(bh.recce_status, bh.recce_id, '/surveys') },
    { name: '2. Baseline', ...getStepStatusDetails(bh.baseline_status, bh.baseline_id, '/surveys') },
    { name: '3. Rehabilitation', ...getStepStatusDetails(bh.rehab_status, bh.rehab_id, '/rehabilitation') },
    { name: '4. Water Testing', ...getStepStatusDetails(bh.water_testing_status, bh.water_testing_id, '/water-testing') },
    { name: '5. Monitoring', ...getStepStatusDetails(bh.monitoring_status, bh.monitoring_id, '/surveys') },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/boreholes')} className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
              <Droplets size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{bh.borehole_code}</h1>
                <StatusBadge status={bh.functional_status} />
                <StatusBadge status={bh.operational_status} />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{bh.name}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/boreholes/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
        >
          <Pencil size={16} /> Edit
        </button>
      </div>

      {/* Lifecycle Progress Stepper */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Borehole Operational Lifecycle Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((step, idx) => (
            <div key={step.name} className="relative flex flex-col items-center text-center p-3.5 bg-slate-50/50 rounded-xl border border-slate-100/75 hover:bg-slate-50 transition-all">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 mb-2",
                  step.colorClass
                )}>
                  {idx + 1}
                </div>
                <span className="text-xs font-bold text-slate-700">{step.name}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase">{step.label}</span>
              </div>
              
              {step.action && (
                <button
                  onClick={step.action}
                  className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-150 hover:bg-teal-100 transition-colors"
                >
                  <Eye size={10} /> VIEW
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative',
              activeTab === tab.key ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            {tab.icon} {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">Location Details</h3>
            <InfoRow icon={<MapPin size={16} />} label="Province" value={bh.province || '—'} />
            <InfoRow icon={<MapPin size={16} />} label="Village" value={bh.village} />
            <InfoRow icon={<MapPin size={16} />} label="District" value={bh.district} />
            {bh.region_name && <InfoRow icon={<MapPin size={16} />} label="Region" value={bh.region_name} />}
            <InfoRow
              icon={<MapPin size={16} />}
              label="GPS Coordinates"
              value={`${Number(bh.latitude).toFixed(6)}, ${Number(bh.longitude).toFixed(6)}`}
            />
            {bh.elevation && <InfoRow icon={<MapPin size={16} />} label="Elevation" value={`${bh.elevation}m`} />}
            <InfoRow icon={<Calendar size={16} />} label="Registered" value={new Date(bh.created_at).toLocaleDateString()} />
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Assignments</h3>
              <button
                type="button"
                onClick={() => setActiveTab('assignments')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100"
              >
                <Users size={14} /> Assign Team Member
              </button>
            </div>
            <div className="p-4 rounded-lg bg-teal-50/50 border border-teal-100">
              <div className="flex items-center gap-2 text-teal-700 mb-1">
                <Building2 size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Assigned NGO</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{bh.ngo_name || 'Not assigned'}</p>
            </div>
            <div className="p-4 rounded-lg bg-aqua-50/50 border border-aqua-100">
              <div className="flex items-center gap-2 text-aqua-700 mb-1">
                <Users size={16} /> <span className="text-xs font-semibold uppercase tracking-wider">Field Team</span>
              </div>
              <p className="text-sm font-semibold text-slate-700">Rehabilitation handled by assigned NGO Team Members</p>
            </div>
            {bh.score && (
              <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Priority Score</div>
                <p className="text-2xl font-bold text-slate-800">{bh.score}/100</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Map Preview</h3>
            <div className="h-48 rounded-lg bg-gradient-to-br from-teal-50 to-blue-50 border border-dashed border-slate-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={32} className="text-teal-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Map Preview Ready</p>
                <p className="text-[10px] text-slate-300 mt-1 font-mono">
                  {Number(bh.latitude).toFixed(4)}, {Number(bh.longitude).toFixed(4)}
                </p>
              </div>
            </div>
            {bh.notes && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-slate-600">{bh.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-6">Activity Timeline</h3>
          {timeline?.length ? (
            <div className="relative pl-8 space-y-6">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
              {timeline.map((entry: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-5 w-6 h-6 rounded-full bg-teal-50 border-2 border-teal-400 flex items-center justify-center">
                    <GitBranch size={10} className="text-teal-600" />
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {entry.action?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">{entry.description}</p>
                    {entry.first_name && <p className="text-[10px] text-slate-400 mt-1">by {entry.first_name} {entry.last_name}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No timeline events yet</p>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Assign NGO Team Member</h3>
              <p className="text-xs text-slate-500 mt-1">
                Assign one or more survey modules to a team member. Each selected module creates its own active assignment.
              </p>
            </div>

            {!bh.assigned_ngo_id ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Assign an NGO to this borehole first, then you can allocate team members and survey modules.
              </div>
            ) : (
              <div className="space-y-4">
                {!loadingTeamMembers && !(teamMembers ?? []).length && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    No active NGO Team Members are available. Create a team member first, then return here to assign this borehole.
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Team Member">
                    <select
                      value={assignmentUserId}
                      onChange={(e) => setAssignmentUserId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      disabled={loadingTeamMembers}
                    >
                      <option value="">Select an NGO team member</option>
                      {(teamMembers ?? []).map((member: any) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Reason">
                    <input
                      value={assignmentReason}
                      onChange={(e) => setAssignmentReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      placeholder="Optional note for this assignment"
                    />
                  </Field>
                </div>

                <Field label="Survey Modules">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {assignmentModuleOptions.map((option) => {
                      const checked = assignmentModules.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            'flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors',
                            checked ? 'border-teal-200 bg-teal-50/60' : 'border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setAssignmentModules((prev) =>
                                prev.includes(option.value)
                                  ? prev.filter((value) => value !== option.value)
                                  : [...prev, option.value]
                              );
                            }}
                            className="mt-1 rounded border-slate-300"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-700">{option.label}</span>
                            <span className="block text-xs text-slate-500 mt-0.5">{option.description}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAssignmentUserId('');
                      setAssignmentReason('');
                      setAssignmentModules([]);
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    disabled={assignMutation.isPending || !assignmentUserId || !assignmentModules.length}
                    onClick={() => assignMutation.mutate()}
                    className="px-5 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-teal-500/20"
                  >
                    {assignMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                    <Plus size={16} />
                    Assign Member
                  </button>
                </div>
                {assignMutation.isError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {(assignMutation.error as any)?.response?.data?.message
                      || (assignMutation.error instanceof Error
                        ? assignMutation.error.message
                        : 'The team member could not be assigned.')}
                  </div>
                )}
                {assignMutation.isSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Team member assigned successfully.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Assignment History</h3>
            </div>
            {assignments?.length ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Assignee</th>
                    <th>Module</th>
                    <th>Assigned By</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a: any) => (
                    <tr key={a.id}>
                      <td>
                        <span
                          className={cn(
                            'text-xs font-semibold px-2 py-1 rounded-full',
                            a.assignee_type === 'ngo' ? 'bg-teal-50 text-teal-700' : 'bg-aqua-50 text-aqua-700'
                          )}
                        >
                          {a.assignee_type?.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-sm font-medium text-slate-700">{a.assignee_name}</td>
                      <td className="text-xs text-slate-500">{formatModuleLabel(a.module)}</td>
                      <td className="text-xs text-slate-500">
                        {a.assigned_by_name} {a.assigned_by_last}
                      </td>
                      <td className="text-xs text-slate-400">{new Date(a.assigned_at).toLocaleDateString()}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-xs text-slate-500 max-w-[200px] truncate">{a.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-400">No assignments yet</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'surveys' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Survey Records</h3></div>
          {surveys?.filter((s: any) => s.survey_type !== 'lsc')?.length ? (
            <table className="data-table">
              <thead><tr><th>Type</th><th>Module</th><th>Assigned To</th><th>Submitted</th><th>Score</th><th>Status</th></tr></thead>
              <tbody>
                {surveys.filter((s: any) => s.survey_type !== 'lsc').map((s: any) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => navigate(`/surveys/${s.id}`)}>
                    <td className="text-xs font-semibold text-slate-700 uppercase">{s.survey_type}</td>
                    <td className="text-sm text-slate-600">{s.module_name}</td>
                    <td className="text-xs text-slate-500">{s.first_name ? `${s.first_name} ${s.last_name}` : '—'}</td>
                    <td className="text-xs text-slate-400">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}</td>
                    <td className="text-sm font-semibold text-slate-700">{s.score ?? '—'}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-6 py-12 text-center text-sm text-slate-400">No lifecycle surveys recorded</div>}
        </div>
      )}

      {activeTab === 'lsc' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800 font-sans">LSC Consultation Records</h3></div>
          {surveys?.filter((s: any) => s.survey_type === 'lsc')?.length ? (
            <table className="data-table">
              <thead><tr><th>Type</th><th>Module</th><th>Assigned To</th><th>Submitted</th><th>Score</th><th>Status</th></tr></thead>
              <tbody>
                {surveys.filter((s: any) => s.survey_type === 'lsc').map((s: any) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => navigate(`/surveys/${s.id}`)}>
                    <td className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full uppercase text-center inline-block mt-2">LSC</td>
                    <td className="text-sm text-slate-600">{s.module_name}</td>
                    <td className="text-xs text-slate-500">{s.first_name ? `${s.first_name} ${s.last_name}` : '—'}</td>
                    <td className="text-xs text-slate-400">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}</td>
                    <td className="text-sm font-semibold text-slate-700">{s.score ?? '—'}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-6 py-12 text-center text-sm text-slate-400">No LSC consultations recorded</div>}
        </div>
      )}

      {activeTab === 'rehabilitation' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Rehabilitation Records</h3></div>
          {rehab?.length ? (
            <table className="data-table">
              <thead><tr><th>Stage</th><th>Submitted By</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
              <tbody>
                {rehab.map((r: any) => (
                  <tr key={r.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => navigate(`/rehabilitation/${r.id}`)}>
                    <td className="text-xs font-semibold text-slate-700 uppercase">{r.stage?.replace(/_/g, ' ')}</td>
                    <td className="text-sm text-slate-600">{r.created_by_name || '—'}</td>
                    <td className="text-xs text-slate-400">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'}</td>
                    <td className="text-xs text-slate-400">{r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-6 py-12 text-center text-sm text-slate-400">No rehabilitation records</div>}
        </div>
      )}

      {activeTab === 'water-testing' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Water Testing Records</h3></div>
          {waterTests?.length ? (
            <table className="data-table">
              <thead><tr><th>Test ID</th><th>Submission Date</th><th>Tested By</th><th>Extracted pH</th><th>Extracted TDS</th><th>Status</th></tr></thead>
              <tbody>
                {waterTests.map((wt: any) => (
                  <tr key={wt.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => navigate(`/water-testing/${wt.id}`)}>
                    <td className="text-xs font-mono font-bold text-slate-600">{wt.id.slice(0, 8).toUpperCase()}</td>
                    <td className="text-xs text-slate-400">{wt.submission_date ? new Date(wt.submission_date).toLocaleDateString() : '—'}</td>
                    <td className="text-xs text-slate-500">{wt.submitted_by_name || '—'}</td>
                    <td className="text-sm text-slate-700 font-semibold">{wt.ph_level ?? '—'}</td>
                    <td className="text-sm text-slate-700 font-semibold">{wt.tds ?? '—'} mg/L</td>
                    <td><StatusBadge status={wt.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-6 py-12 text-center text-sm text-slate-400">No water testing records found</div>}
        </div>
      )}

      {activeTab === 'grievances' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Grievances</h3></div>
          {grievances?.length ? (
            <table className="data-table">
              <thead><tr><th>Grievance ID</th><th>Issue Type</th><th>Date Reported</th><th>Reporter Name</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {grievances.map((g: any) => (
                  <tr key={g.id} className="cursor-pointer hover:bg-slate-50/50" onClick={() => navigate(`/grievances/${g.id}`)}>
                    <td className="text-xs font-mono font-bold text-slate-600">{g.id.slice(0, 8).toUpperCase()}</td>
                    <td className="text-sm text-slate-600">{g.issue_type?.replace(/_/g, ' ')}</td>
                    <td className="text-xs text-slate-400">{g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}</td>
                    <td className="text-xs text-slate-500">{g.reporter_name || '—'}</td>
                    <td className="text-xs">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full font-bold",
                        g.priority === 'high' ? 'bg-red-50 text-red-700' :
                        g.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                      )}>
                        {g.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td><StatusBadge status={g.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="px-6 py-12 text-center text-sm text-slate-400">No reported grievances found</div>}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const assignmentModuleOptions = [
  { value: 'flow_1', label: 'Flow 1', description: 'LSC consultation and grievance handling.' },
  { value: 'flow_2', label: 'Flow 2', description: 'Recce, baseline, rehabilitation, and monitoring.' },
  { value: 'borehole_recce', label: 'Recce', description: 'Initial site inspection and borehole verification.' },
  { value: 'baseline_survey', label: 'Baseline Survey', description: 'Household and community baseline work.' },
  { value: 'lsc_survey', label: 'LSC Consultation', description: 'Community consultation and feedback.' },
  { value: 'rehabilitation', label: 'Rehabilitation', description: 'Repair and rehabilitation work.' },
  { value: 'monitoring_survey', label: 'Monitoring Survey', description: 'Follow-up monitoring and condition tracking.' },
  { value: 'grievance', label: 'Grievance Report', description: 'Issue reporting and escalation.' },
] as const;

function formatModuleLabel(module?: string | null) {
  switch (module) {
    case 'flow_1':
      return 'Flow 1: LSC + Grievance';
    case 'flow_2':
      return 'Flow 2: Lifecycle';
    case 'borehole_recce':
      return 'Recce';
    case 'baseline_survey':
      return 'Baseline';
    case 'rehabilitation':
      return 'Rehabilitation';
    case 'monitoring_survey':
      return 'Monitoring';
    case 'lsc_survey':
      return 'LSC';
    case 'grievance':
      return 'Grievance';
    default:
      return 'All assigned modules';
  }
}
