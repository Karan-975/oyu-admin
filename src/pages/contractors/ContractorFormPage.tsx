import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contractorsApi } from '../../api/endpoints';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { PageLoader } from '../../components/ui/PageLoader';

const contractorSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  registrationNumber: z.string().max(100).optional(),
  contactPerson: z.string().min(2, 'Contact person is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
  regionId: z.string().uuid().optional().or(z.literal('')),
  specialization: z.string().max(255).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type ContractorForm = z.infer<typeof contractorSchema>;

export function ContractorFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ContractorForm>({
    resolver: zodResolver(contractorSchema),
    defaultValues: {
      companyName: '',
      registrationNumber: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      regionId: '',
      specialization: '',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ContractorForm) => contractorsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      navigate('/contractors');
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Unable to create contractor'),
  });

  if (mutation.isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
            <Building2 size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create Contractor</h1>
            <p className="text-xs text-slate-500">Register a new rehabilitation contractor.</p>
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">{error}</div>}

      <form onSubmit={handleSubmit((data) => {
        const payload = {
          ...data,
          registrationNumber: data.registrationNumber?.trim() || undefined,
          regionId: data.regionId?.trim() || undefined,
          specialization: data.specialization?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        } as any;
        mutation.mutate(payload);
      })} className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-100">
        <div className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-slate-800">Contractor Details</h3>
          <FormField label="Company Name" error={errors.companyName?.message}>
            <input {...register('companyName')} className="form-input" placeholder="e.g. Greenfield Contractors" />
          </FormField>
          <FormField label="Registration Number" error={errors.registrationNumber?.message}>
            <input {...register('registrationNumber')} className="form-input" placeholder="Optional" />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Contact Person" error={errors.contactPerson?.message}>
              <input {...register('contactPerson')} className="form-input" placeholder="Full name" />
            </FormField>
            <FormField label="Phone" error={errors.phone?.message}>
              <input {...register('phone')} className="form-input" placeholder="+234..." />
            </FormField>
          </div>
          <FormField label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" className="form-input" placeholder="contractor@example.com" />
          </FormField>
          <FormField label="Address" error={errors.address?.message}>
            <textarea {...register('address')} className="form-input min-h-[96px]" placeholder="Contractor address" />
          </FormField>
          <FormField label="Specialization" error={errors.specialization?.message}>
            <input {...register('specialization')} className="form-input" placeholder="e.g. drilling, civil works" />
          </FormField>
          <FormField label="Notes" error={errors.notes?.message}>
            <textarea {...register('notes')} className="form-input min-h-[96px]" placeholder="Internal notes" />
          </FormField>
        </div>

        <div className="p-6 flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/contractors')} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isLoading}
            className="px-6 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
            {mutation.isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            Create Contractor
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}
