import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boreholesApi, usersApi } from '../../api/endpoints';
import { ArrowLeft, Loader2, Droplets, Sparkles, Info } from 'lucide-react';
import { PageLoader } from '../../components/ui/PageLoader';
import { useAuthStore } from '../../stores/auth.store';

// South Africa provinces per FRS context
const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

const boreholeSchema = z.object({
  boreholeCode: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  latitude: z.coerce.number().min(-90).max(90, 'Valid latitude required'),
  longitude: z.coerce.number().min(-180).max(180, 'Valid longitude required'),
  elevation: z.coerce.number().optional(),
  village: z.string().min(2, 'Village required'),
  ward: z.string().optional(),
  district: z.string().min(2, 'District required'),
  province: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  functionalStatus: z.string().min(1, 'Status required'),
  waterSource: z.string().optional(),
  depthMeters: z.coerce.number().optional(),
  staticWaterLevel: z.coerce.number().optional(),
  yieldLps: z.coerce.number().optional(),
  assignedNgoId: z.string().optional(),
  assignedMemberId: z.string().optional(),
  notes: z.string().optional(),
});

type BoreholeForm = z.infer<typeof boreholeSchema>;

function previewBoreholeCode(village?: string, province?: string) {
  if (!village) return null;
  const v = (village || 'BORE').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const p = (province || 'NA').replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 2).padEnd(2, 'X');
  return `${v}XXXX${p}`;
}

export function BoreholeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const [error, setError] = useState('');
  const { user, isSuperAdmin } = useAuthStore();

  const { data: existing, isLoading: loadingBh } = useQuery({
    queryKey: ['borehole', id],
    queryFn: () => boreholesApi.getById(id!).then(r => r.data.data),
    enabled: isEditing,
  });

  const { data: ngoAdminsList } = useQuery({
    queryKey: ['ngo-admins-select'],
    queryFn: () => usersApi.list({ page: 1, limit: 100, roleSlug: 'ngo_admin', status: 'active' }).then(r => r.data),
    enabled: isSuperAdmin(),
  });

  const { data: teamMembersList } = useQuery({
    queryKey: ['team-members-select', user?.ngoId],
    queryFn: () =>
      usersApi.list({
        page: 1, limit: 100,
        ngoId: user?.ngoId,
        roleSlug: 'ngo_team_member',
        status: 'active',
      }).then(r => r.data),
    enabled: !!user?.ngoId && user?.roles?.includes('ngo_admin'),
  });

  const { register, handleSubmit, formState: { errors }, control } = useForm<BoreholeForm>({
    resolver: zodResolver(boreholeSchema),
    values: isEditing && existing ? {
      boreholeCode: existing.borehole_code,
      name: existing.name,
      latitude: existing.latitude,
      longitude: existing.longitude,
      elevation: existing.elevation,
      village: existing.village,
      ward: existing.ward,
      district: existing.district,
      province: existing.province,
      county: existing.county,
      subCounty: existing.sub_county,
      functionalStatus: existing.functional_status,
      waterSource: existing.water_source,
      depthMeters: existing.depth_meters,
      staticWaterLevel: existing.static_water_level,
      yieldLps: existing.yield_lps,
      assignedNgoId: existing.assigned_ngo_id,
      assignedMemberId: isSuperAdmin()
        ? (existing.assigned_user_id ? `${existing.assigned_user_id}:${existing.assigned_ngo_id}` : '')
        : (existing.assigned_user_id || ''),
      notes: existing.notes,
    } : undefined,
  });

  // Live preview of auto-generated code
  const watchedVillage = useWatch({ control, name: 'village' });
  const watchedProvince = useWatch({ control, name: 'province' });
  const watchedCode = useWatch({ control, name: 'boreholeCode' });
  const codePreview = !watchedCode ? previewBoreholeCode(watchedVillage, watchedProvince) : null;

  const mutation = useMutation({
    mutationFn: async (data: BoreholeForm) => {
      const createPayload = { ...data } as any;
      delete createPayload.assignedNgoId;
      delete createPayload.assignedMemberId;
      if (!isEditing && isSuperAdmin() && data.assignedMemberId) {
        createPayload.assignedNgoAdminId = data.assignedMemberId.split(':')[0];
      }
      Object.keys(createPayload).forEach((key) => {
        if (createPayload[key] === '' || createPayload[key] === null) {
          delete createPayload[key];
        }
      });

      let res;
      if (!isEditing) {
        res = await boreholesApi.create(createPayload);
      } else {
        res = await boreholesApi.update(id!, createPayload);
      }
      const targetId = isEditing ? id! : res.data.data.id;

      if (isSuperAdmin() && isEditing) {
        const newNgoAdminValue = data.assignedMemberId || '';
        const oldNgoAdminValue = isEditing && existing?.assigned_user_id
          ? `${existing.assigned_user_id}:${existing.assigned_ngo_id}`
          : '';

        if (newNgoAdminValue !== oldNgoAdminValue) {
          if (newNgoAdminValue) {
            const [adminUserId, ngoId] = newNgoAdminValue.split(':');
            await boreholesApi.assignNgo(targetId, ngoId);
            await boreholesApi.assignUser(targetId, {
              userId: adminUserId,
              reason: isEditing ? 'Assigned during borehole update' : 'Assigned during borehole registration',
            });
          } else {
            await boreholesApi.assignUser(targetId, {
              userId: '',
              reason: 'Unassigned during borehole update',
            });
          }
        }
      } else if (user?.roles?.includes('ngo_admin')) {
        const memberChanged =
          data.assignedMemberId !== undefined &&
          data.assignedMemberId !== (existing?.assigned_user_id || '');
        if (memberChanged) {
          await boreholesApi.assignUser(targetId, {
            userId: data.assignedMemberId || '',
            reason: isEditing ? 'Reassigned via Admin Panel' : 'Assigned during borehole registration',
          });
        }
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boreholes'] });
      navigate(isEditing ? `/boreholes/${id}` : '/boreholes');
    },
    onError: (err: any) => {
      const validationErrors = err?.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors
            .map((item: any) => `${item.field || 'Field'}: ${item.message}`)
            .join(' ')
        : '';
      setError(validationMessage || err?.response?.data?.message || 'Something went wrong');
    },
  });

  if (isEditing && loadingBh) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} className="text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Droplets size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEditing ? 'Edit Borehole' : 'Register New Borehole'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update borehole information'
                : 'Borehole ID auto-generated from Village + Province (e.g. MAND0001GA)'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Identity */}
        <Section title="Identification">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Field label="Borehole Code (auto-generated if blank)" error={errors.boreholeCode?.message}>
                <input
                  {...register('boreholeCode')}
                  className="form-input"
                  placeholder="Leave blank to auto-generate"
                />
              </Field>
              {codePreview && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-teal-600">
                  <Sparkles size={12} />
                  <span>Will generate as: <strong>{codePreview}</strong> (sequence filled on save)</span>
                </div>
              )}
            </div>
            <Field label="Name *" error={errors.name?.message}>
              <input {...register('name')} className="form-input" placeholder="Borehole name" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Functional Status *" error={errors.functionalStatus?.message}>
              <select {...register('functionalStatus')} className="form-select">
                <option value="">Select...</option>
                <option value="functional">Functional</option>
                <option value="partially_functional">Partially Functional</option>
                <option value="non_functional">Non-Functional</option>
                <option value="unknown">Unknown</option>
              </select>
            </Field>
            <Field label="Water Source" error={errors.waterSource?.message}>
              <select {...register('waterSource')} className="form-select">
                <option value="">Select...</option>
                <option value="borehole">Borehole</option>
                <option value="shallow_well">Shallow Well</option>
                <option value="hand_dug_well">Hand Dug Well</option>
                <option value="spring">Spring</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Latitude *" error={errors.latitude?.message}>
              <input {...register('latitude')} type="number" step="any" className="form-input" placeholder="e.g. -26.2041" />
            </Field>
            <Field label="Longitude *" error={errors.longitude?.message}>
              <input {...register('longitude')} type="number" step="any" className="form-input" placeholder="e.g. 28.0473" />
            </Field>
            <Field label="Elevation (m)" error={errors.elevation?.message}>
              <input {...register('elevation')} type="number" className="form-input" placeholder="meters" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Village *" error={errors.village?.message}>
              <input {...register('village')} className="form-input" placeholder="Village name" />
            </Field>
            <Field label="District *" error={errors.district?.message}>
              <input {...register('district')} className="form-input" placeholder="District" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {/* FRS §7.7: Province is required for Borehole ID generation */}
            <Field label="Province" error={errors.province?.message}>
              <select {...register('province')} className="form-select">
                <option value="">Select Province...</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Ward">
              <input {...register('ward')} className="form-input" />
            </Field>
            <Field label="County">
              <input {...register('county')} className="form-input" />
            </Field>
          </div>
          <Field label="Sub-County">
            <input {...register('subCounty')} className="form-input" />
          </Field>
        </Section>

        {/* Technical */}
        <Section title="Technical Data">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Depth (m)">
              <input {...register('depthMeters')} type="number" className="form-input" />
            </Field>
            <Field label="Static Water Level (m)">
              <input {...register('staticWaterLevel')} type="number" step="any" className="form-input" />
            </Field>
            <Field label="Yield (L/s)">
              <input {...register('yieldLps')} type="number" step="any" className="form-input" />
            </Field>
          </div>
        </Section>

        {/* Assignments */}
        <Section title="Assignment">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2 text-xs text-blue-700">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              {isSuperAdmin()
                ? 'Select an NGO Admin to assign this borehole to their organization. The NGO Admin can then assign it to their team members.'
                : 'Select a team member from your NGO to assign field operations for this borehole.'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isSuperAdmin() ? (
              <Field label="Assign to NGO Admin">
                <select {...register('assignedMemberId')} className="form-select">
                  <option value="">None — Unassigned</option>
                  {ngoAdminsList?.data?.map((admin: any) => (
                    <option key={admin.id} value={`${admin.id}:${admin.ngo_id}`}>
                      {admin.first_name} {admin.last_name} ({admin.ngo_name || 'No NGO'})
                    </option>
                  ))}
                </select>
              </Field>
            ) : user?.roles?.includes('ngo_admin') ? (
              <Field label="Assign NGO Team Member">
                <select {...register('assignedMemberId')} className="form-select">
                  <option value="">None</option>
                  {teamMembersList?.data?.map((tm: any) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.first_name} {tm.last_name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>
          <Field label="Notes">
            <textarea
              {...register('notes')}
              className="form-input min-h-[80px]"
              placeholder="Internal notes..."
            />
          </Field>
        </Section>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-teal-500/20"
          >
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? 'Save Changes' : 'Register Borehole'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
