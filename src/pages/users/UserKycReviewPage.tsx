import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { usersApi } from '../../api/endpoints';
import { PageLoader } from '../../components/ui/PageLoader';
import { useAuthStore } from '../../stores/auth.store';

const documentFields: Record<string, string> = {
  passportPhotoUrl: 'Passport Photograph',
  idDocumentUrl: 'Identity Document',
  addressProofUrl: 'Address Proof',
  cancelledChequeUrl: 'Bank Document',
  signatureUrl: 'Applicant Signature',
};

const hiddenFields = new Set([
  'kycStatus',
  'reviewedBy',
  'approvedBy',
  'officeSignatureUrl',
  'officeRemarks',
  ...Object.keys(documentFields),
]);

export function UserKycReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = useAuthStore((state) => state.user?.roles?.includes('super_admin') ?? false);
  const currentUserName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim() || currentUser?.email || 'Super Admin';
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-kyc-review', id],
    queryFn: () => usersApi.getById(id!).then((response) => response.data.data),
    enabled: Boolean(id),
  });

  const reviewMutation = useMutation({
    mutationFn: (status: 'Approved' | 'Rejected') => usersApi.update(id!, {
      kycData: {
        ...(user?.kycData ?? {}),
        kycStatus: status,
        reviewedBy: currentUserName,
        approvedBy: status === 'Approved' ? currentUserName : '',
        officeRemarks: remarks,
        reviewedAt: new Date().toISOString(),
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-kyc-review', id] });
      navigate('/settings/users');
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Unable to update KYC status.'),
  });

  if (isLoading) return <PageLoader />;
  if (!isSuperAdmin) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">Only Super Admin can review KYC submissions.</div>;
  if (!user) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">KYC applicant not found.</div>;

  const kyc = user.kycData ?? {};
  const status = kyc.kycStatus ?? 'Pending KYC';
  const submittedEntries = Object.entries(kyc).filter(([key, value]) =>
    !hiddenFields.has(key) &&
    value !== '' &&
    value !== null &&
    value !== undefined &&
    (!Array.isArray(value) || value.length > 0)
  );

  const review = (status: 'Approved' | 'Rejected') => {
    setError('');
    if (status === 'Rejected' && !remarks.trim()) {
      setError('Remarks are required when rejecting KYC.');
      return;
    }
    reviewMutation.mutate(status);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/settings/users')} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">KYC verification</p>
            <h1 className="text-2xl font-bold text-slate-800">{user.first_name} {user.last_name}</h1>
            <p className="text-sm text-slate-500">{user.email} · {user.phone || 'No phone provided'}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
          status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
          status === 'Rejected' ? 'bg-red-50 text-red-700' :
          'bg-amber-50 text-amber-700'
        }`}>{status}</span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <ShieldCheck className="text-teal-600" />
          <div>
            <h2 className="font-bold text-slate-800">Submitted KYC Information</h2>
            <p className="text-xs text-slate-500">Read-only applicant data submitted for verification.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {submittedEntries.map(([key, value]) => (
            <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{formatLabel(key)}</p>
              <div className="mt-1 break-words text-sm font-semibold text-slate-700">{formatValue(value)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <FileText className="text-teal-600" />
          <div>
            <h2 className="font-bold text-slate-800">Uploaded Documents</h2>
            <p className="text-xs text-slate-500">Open each document before making a decision.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(documentFields).map(([key, label]) => {
            const url = kyc[key];
            return (
              <div key={key} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-700">{label}</p>
                {url ? (
                  <>
                    {isImageUrl(url) && <img src={url} alt={label} className="mt-3 h-40 w-full rounded-lg border bg-slate-50 object-contain" />}
                    <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:underline">
                      <ExternalLink size={13} /> Open original document
                    </a>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-red-500">Not uploaded</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-slate-800">Super Admin Decision</h2>
        <p className="mt-1 text-xs text-slate-500">Remarks are mandatory for rejection and will be sent to the NGO Admin.</p>
        <textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          rows={4}
          placeholder="Enter verification remarks or reason for rejection..."
          className="form-input mt-4"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => review('Rejected')}
            disabled={reviewMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle size={17} /> Reject KYC
          </button>
          <button
            onClick={() => review('Approved')}
            disabled={reviewMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {reviewMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
            Approve KYC
          </button>
        </div>
      </section>
    </div>
  );
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(value: any): React.ReactNode {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(value, null, 2)}</pre>;
  return String(value);
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || url.includes('/image/upload/');
}

