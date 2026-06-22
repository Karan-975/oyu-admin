import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, FileCheck2, Loader2, LockKeyhole, Upload } from 'lucide-react';
import { filesApi, usersApi } from '../../api/endpoints';
import { PageLoader } from '../../components/ui/PageLoader';
import { useAuthStore } from '../../stores/auth.store';

const emptyKyc = {
  dob: '',
  gender: '',
  residentialAddress: '',
  passportPhotoUrl: '',
  idType: 'National ID',
  idNumber: '',
  idExpiryDate: '',
  idDocumentUrl: '',
  addressProofType: 'Utility Bill',
  addressProofUrl: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifscCode: '',
  projectRole: 'NGO Administrator',
  emergencyName: '',
  emergencyRelation: '',
  emergencyPhone: '',
  emergencyAddress: '',
  agreedToCodeOfConduct: false,
  agreedToDataPrivacy: false,
  agreedToSafeguarding: false,
  applicantDeclarationName: '',
  declarationDate: new Date().toISOString().split('T')[0],
  signatureUrl: '',
};

export function KycCompletionPage() {
  const currentUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [form, setForm] = useState<Record<string, any>>(emptyKyc);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-kyc'],
    queryFn: () => usersApi.getMyKyc().then((response) => response.data.data),
  });

  useEffect(() => {
    if (data?.kycData) {
      setForm({ ...emptyKyc, ...data.kycData });
      if (currentUser && currentUser.kycStatus !== data.kycData.kycStatus) {
        setUser({
          ...currentUser,
          kycData: data.kycData,
          kycStatus: data.kycData.kycStatus,
        });
      }
    }
  }, [currentUser, data, setUser]);

  const mutation = useMutation({
    mutationFn: () => usersApi.submitMyKyc(form),
    onSuccess: (response) => {
      const kycData = response.data.data.kycData;
      setForm({ ...emptyKyc, ...kycData });
      if (currentUser) {
        setUser({
          ...currentUser,
          kycData,
          kycStatus: kycData.kycStatus,
        });
      }
      setError('');
      setSuccess('KYC submitted successfully. Super Admin verification is now pending.');
    },
    onError: (err: any) => {
      setSuccess('');
      setError(err?.response?.data?.message ?? 'Unable to submit KYC. Please review the form and try again.');
    },
  });

  const update = (field: string, value: any) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const upload = async (file: File | undefined, field: string) => {
    if (!file) return;
    setUploading(field);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('entityType', 'user_kyc');
      body.append('entityId', currentUser?.id ?? 'self');
      body.append('documentField', field);
      const response = await filesApi.upload(body);
      const uploadedUrl = response.data.data.url || response.data.data.s3Url;
      if (!uploadedUrl) throw new Error('Upload completed but no document URL was returned.');
      update(field, uploadedUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Document upload failed.');
    } finally {
      setUploading('');
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const required = [
      'dob',
      'gender',
      'residentialAddress',
      'passportPhotoUrl',
      'idNumber',
      'idDocumentUrl',
      'addressProofUrl',
      'applicantDeclarationName',
      'signatureUrl',
    ];
    if (required.some((field) => !form[field])) {
      setError('Complete all required fields and upload the required documents.');
      return;
    }
    if (!form.agreedToCodeOfConduct || !form.agreedToDataPrivacy || !form.agreedToSafeguarding) {
      setError('All compliance declarations must be accepted.');
      return;
    }
    mutation.mutate();
  };

  if (isLoading) return <PageLoader />;

  const status = form.kycStatus || currentUser?.kycStatus || 'Pending KYC';
  const approved = ['approved', 'completed'].includes(status.toLowerCase());
  const awaiting = status === 'Awaiting Document Verification';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 to-teal-600 p-7 text-white shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">Identity and compliance</p>
            <h1 className="mt-2 text-2xl font-bold">NGO Administrator KYC</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-50">
              Complete this verification before accessing boreholes, assignments, surveys, reports, or team management.
            </p>
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-3 text-right backdrop-blur">
            <p className="text-[10px] uppercase tracking-wider text-teal-100">Current status</p>
            <p className="mt-1 text-sm font-bold">{status}</p>
          </div>
        </div>
      </div>

      {!approved && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <LockKeyhole className="mt-0.5 shrink-0" size={18} />
          <p>Operational access remains locked until Super Admin approval. Notifications, profile settings, and this KYC page remain available.</p>
        </div>
      )}

      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">{success}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      {approved ? (
        <div className="rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-emerald-500" size={52} />
          <h2 className="mt-4 text-xl font-bold text-slate-800">KYC Approved</h2>
          <p className="mt-2 text-sm text-slate-500">Your operational access has been enabled. Sign in again if the dashboard does not open automatically.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-6">
          <Section title="Personal Information">
            <Field label="Date of Birth *"><input type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} className="form-input" /></Field>
            <Field label="Gender *">
              <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="form-input">
                <option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="Residential Address *" wide><textarea value={form.residentialAddress} onChange={(e) => update('residentialAddress', e.target.value)} className="form-input min-h-24" /></Field>
            <UploadField label="Passport Photograph *" value={form.passportPhotoUrl} busy={uploading === 'passportPhotoUrl'} onFile={(file) => upload(file, 'passportPhotoUrl')} />
          </Section>

          <Section title="Identity and Address Verification">
            <Field label="ID Type *">
              <select value={form.idType} onChange={(e) => update('idType', e.target.value)} className="form-input">
                <option>National ID</option><option>Passport</option><option>Driver&apos;s License</option><option>Voter&apos;s Card</option>
              </select>
            </Field>
            <Field label="ID Number *"><input value={form.idNumber} onChange={(e) => update('idNumber', e.target.value)} className="form-input" /></Field>
            <Field label="ID Expiry Date"><input type="date" value={form.idExpiryDate} onChange={(e) => update('idExpiryDate', e.target.value)} className="form-input" /></Field>
            <UploadField label="Identity Document *" value={form.idDocumentUrl} busy={uploading === 'idDocumentUrl'} onFile={(file) => upload(file, 'idDocumentUrl')} />
            <Field label="Address Proof Type">
              <select value={form.addressProofType} onChange={(e) => update('addressProofType', e.target.value)} className="form-input">
                <option>Utility Bill</option><option>Bank Statement</option><option>Tenancy Agreement</option>
              </select>
            </Field>
            <UploadField label="Address Proof *" value={form.addressProofUrl} busy={uploading === 'addressProofUrl'} onFile={(file) => upload(file, 'addressProofUrl')} />
          </Section>

          <Section title="Bank and Emergency Details">
            <Field label="Bank Name"><input value={form.bankName} onChange={(e) => update('bankName', e.target.value)} className="form-input" /></Field>
            <Field label="Account Name"><input value={form.accountName} onChange={(e) => update('accountName', e.target.value)} className="form-input" /></Field>
            <Field label="Account Number"><input value={form.accountNumber} onChange={(e) => update('accountNumber', e.target.value)} className="form-input" /></Field>
            <Field label="Sort / SWIFT Code"><input value={form.ifscCode} onChange={(e) => update('ifscCode', e.target.value)} className="form-input" /></Field>
            <Field label="Emergency Contact Name"><input value={form.emergencyName} onChange={(e) => update('emergencyName', e.target.value)} className="form-input" /></Field>
            <Field label="Emergency Contact Phone"><input value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} className="form-input" /></Field>
          </Section>

          <Section title="Declarations and Signature">
            <div className="col-span-full space-y-3">
              <Check label="I agree to the OYU Green Code of Conduct." checked={form.agreedToCodeOfConduct} onChange={(value) => update('agreedToCodeOfConduct', value)} />
              <Check label="I consent to the processing of my information under the data privacy policy." checked={form.agreedToDataPrivacy} onChange={(value) => update('agreedToDataPrivacy', value)} />
              <Check label="I agree to safeguarding and field-operation requirements." checked={form.agreedToSafeguarding} onChange={(value) => update('agreedToSafeguarding', value)} />
            </div>
            <Field label="Declaration Name *"><input value={form.applicantDeclarationName} onChange={(e) => update('applicantDeclarationName', e.target.value)} className="form-input" /></Field>
            <Field label="Declaration Date *"><input type="date" value={form.declarationDate} onChange={(e) => update('declarationDate', e.target.value)} className="form-input" /></Field>
            <UploadField label="Applicant Signature *" value={form.signatureUrl} busy={uploading === 'signatureUrl'} onFile={(file) => upload(file, 'signatureUrl')} />
          </Section>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <FileCheck2 className="text-teal-600" size={22} />
              {awaiting ? 'You may update and resubmit while verification is pending.' : 'Your submission will be sent to Super Admin for verification.'}
            </div>
            <button disabled={mutation.isPending || Boolean(uploading)} className="flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {awaiting ? 'Resubmit KYC' : 'Submit KYC'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-base font-bold text-slate-800">{title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? 'md:col-span-2' : ''}><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}

function UploadField({ label, value, busy, onFile }: { label: string; value?: string; busy: boolean; onFile: (file?: File) => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 hover:border-teal-400">
        <span>{busy ? 'Uploading...' : value ? 'Document uploaded' : 'Choose document'}</span>
        {busy ? <Loader2 size={16} className="animate-spin" /> : value ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Upload size={16} />}
        <input type="file" accept="image/*,.pdf" className="hidden" disabled={busy} onChange={(event) => onFile(event.target.files?.[0])} />
      </label>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 rounded border-slate-300" /><span>{label}</span></label>;
}
