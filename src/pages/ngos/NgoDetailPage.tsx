import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ngosApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/PageLoader';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Users, Droplets,
  Calendar, Pencil, Shield
} from 'lucide-react';

export function NgoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ngo, isLoading } = useQuery({
    queryKey: ['ngo', id],
    queryFn: () => ngosApi.getById(id!).then(r => r.data.data),
    enabled: !!id,
  });

  const { data: boreholes } = useQuery({
    queryKey: ['ngo-boreholes', id],
    queryFn: () => ngosApi.getBoreholes(id!).then(r => r.data.data),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (!ngo) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/ngos')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 text-xl font-bold">
              {ngo.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{ngo.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {ngo.registration_number && <span className="text-xs text-slate-400">Reg: {ngo.registration_number}</span>}
                <StatusBadge status={ngo.status} />
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => navigate(`/ngos/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all">
          <Pencil size={16} /> Edit NGO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Organization Details</h3>
            <div className="space-y-4">
              <InfoRow icon={<Building2 size={16} />} label="Contact Person" value={ngo.contact_person} />
              <InfoRow icon={<Mail size={16} />} label="Email" value={ngo.email} />
              <InfoRow icon={<Phone size={16} />} label="Phone" value={ngo.phone} />
              <InfoRow icon={<MapPin size={16} />} label="Address" value={ngo.address} />
              {ngo.region_name && <InfoRow icon={<MapPin size={16} />} label="Region" value={ngo.region_name} />}
              {ngo.website && <InfoRow icon={<Globe size={16} />} label="Website" value={ngo.website} />}
              <InfoRow icon={<Calendar size={16} />} label="Registered" value={new Date(ngo.created_at).toLocaleDateString()} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
              <Users size={20} className="text-teal-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{ngo.users?.length ?? 0}</p>
              <p className="text-xs text-slate-500">Team Members</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
              <Droplets size={20} className="text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{boreholes?.length ?? 0}</p>
              <p className="text-xs text-slate-500">Boreholes</p>
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Members */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Team Members</h3>
            </div>
            {ngo.users?.length ? (
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Roles</th><th>Status</th></tr></thead>
                <tbody>
                  {ngo.users.map((u: any) => (
                    <tr key={u.id}>
                      <td className="font-medium text-slate-700">{u.first_name} {u.last_name}</td>
                      <td className="text-xs text-slate-500">{u.email}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {(u.role_names?.split(',') ?? []).map((r: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-medium rounded-full">
                              <Shield size={8} /> {r.trim()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><StatusBadge status={u.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-400">No team members assigned yet</div>
            )}
          </div>

          {/* Assigned Boreholes */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Assigned Boreholes</h3>
            </div>
            {boreholes?.length ? (
              <table className="data-table">
                <thead><tr><th>Code</th><th>Name</th><th>Location</th><th>Functional</th><th>Operational</th></tr></thead>
                <tbody>
                  {boreholes.map((bh: any) => (
                    <tr key={bh.id} className="cursor-pointer" onClick={() => navigate(`/boreholes/${bh.id}`)}>
                      <td className="font-semibold text-sm text-slate-700">{bh.borehole_code}</td>
                      <td className="text-sm text-slate-600">{bh.name}</td>
                      <td className="text-xs text-slate-500">{bh.village}, {bh.district}</td>
                      <td><StatusBadge status={bh.functional_status} /></td>
                      <td><StatusBadge status={bh.operational_status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-12 text-center text-sm text-slate-400">No boreholes assigned yet</div>
            )}
          </div>
        </div>
      </div>
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
