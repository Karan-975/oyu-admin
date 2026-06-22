import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Account status
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  suspended: { label: 'Suspended', className: 'bg-red-50 text-red-600 border-red-200' },
  pending_activation: { label: 'Pending Activation', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  access_restricted: { label: 'Access Restricted', className: 'bg-orange-50 text-orange-700 border-orange-200' },

  // Functional status
  functional: { label: 'Functional', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partially_functional: { label: 'Partial', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  non_functional: { label: 'Non-Functional', className: 'bg-red-50 text-red-600 border-red-200' },
  unknown: { label: 'Unknown', className: 'bg-slate-50 text-slate-500 border-slate-200' },

  // ── FRS Section 7.4 / 7.5: Borehole Lifecycle Stages
  newly_created: { label: 'Newly Created', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  recce_in_progress: { label: 'Recce In Progress', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  recce_completed: { label: 'Recce Completed', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  baseline_pending: { label: 'Baseline Pending', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  baseline_completed: { label: 'Baseline Completed', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  rehabilitation_in_progress: { label: 'Rehab In Progress', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_rehabilitation: { label: 'Under Rehab', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  rehabilitation_completed: { label: 'Rehab Completed', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  monitoring_pending: { label: 'Monitoring Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  monitoring_completed: { label: 'Monitoring Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  decommissioned: { label: 'Decommissioned', className: 'bg-gray-50 text-gray-500 border-gray-200' },

  // Workflow / Survey status
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-500 border-slate-200' },
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
  reopened: { label: 'Reopened', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  under_review: { label: 'Under Review', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  resolved: { label: 'Resolved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Closed', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  resubmitted: { label: 'Resubmitted', className: 'bg-sky-50 text-sky-700 border-sky-200' },

  // Priority
  low: { label: 'Low', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  high: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },

  // Rehab / general stages
  pending: { label: 'Pending', className: 'bg-slate-50 text-slate-500 border-slate-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },

  // NGO onboarding statuses (FRS 9.3)
  pending_kyc: { label: 'Pending KYC', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending_signature: { label: 'Pending Signature', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  pending_approval: { label: 'Pending Approval', className: 'bg-violet-50 text-violet-700 border-violet-200' },

  // Water testing statuses (FRS 9.11)
  sample_collected: { label: 'Sample Collected', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  under_testing: { label: 'Under Testing', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  report_uploaded: { label: 'Report Uploaded', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },

  // Grievance statuses (FRS 7.13)
  action_in_progress: { label: 'Action In Progress', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—',
    className: 'bg-slate-50 text-slate-500 border-slate-200',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full border', config.className, className)}>
      {config.label}
    </span>
  );
}
