import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../../api/endpoints';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Shield, Check, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

export function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const { data: rolesData, isLoading: loadingRoles, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list().then(r => r.data.data),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.listPermissions().then(r => r.data.data),
  });

  const { data: roleDetail } = useQuery({
    queryKey: ['role-detail', selectedRoleId],
    queryFn: () => rolesApi.getById(selectedRoleId!).then(r => r.data.data),
    enabled: !!selectedRoleId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rolesApi.updatePermissions(roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-detail', selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const togglePermission = (permId: string) => {
    if (!roleDetail || !selectedRoleId) return;
    const currentPerms: string[] = roleDetail.permissions?.map((p: any) => p.id) ?? [];
    const newPerms = currentPerms.includes(permId)
      ? currentPerms.filter((id: string) => id !== permId)
      : [...currentPerms, permId];
    updateMutation.mutate({ roleId: selectedRoleId, permissionIds: newPerms });
  };

  // Group permissions by module
  const groupedPerms = (permissionsData ?? []).reduce<Record<string, any[]>>((acc, p: any) => {
    const module = p.slug?.split(':')[0] ?? 'other';
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});

  if (loadingRoles) return <PageLoader />;

  if (rolesError) {
    return (
      <div className="p-6">
        <EmptyState
          title="Unable to load Roles & Permissions"
          description={rolesError instanceof Error ? rolesError.message : 'Please refresh or try again later.'}
          icon={<Shield size={40} />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Roles & Permissions</h1>
        <p className="text-sm text-slate-500 mt-1">Configure access control for each role</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Roles</h3>
          </div>
          <div className="p-2 space-y-1">
            {rolesData?.map((role: any) => (
              <button key={role.id} onClick={() => setSelectedRoleId(role.id)}
                className={cn('w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all',
                  selectedRoleId === role.id ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50')}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  selectedRoleId === role.id ? 'bg-teal-100' : 'bg-slate-100')}>
                  <Shield size={14} className={selectedRoleId === role.id ? 'text-teal-600' : 'text-slate-400'} />
                </div>
                <div>
                  <p className="text-sm font-medium">{role.display_name ?? role.name}</p>
                  <p className="text-[10px] text-slate-400">{role.user_count ?? 0} users</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          {!selectedRoleId ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <Shield size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Select a role to configure permissions</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Permissions for: <span className="text-teal-600">{roleDetail?.display_name ?? roleDetail?.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{roleDetail?.description}</p>
                </div>
                {updateMutation.isPending && <span className="text-xs text-teal-500 animate-pulse">Saving...</span>}
              </div>

              <div className="p-6 space-y-6">
                {Object.entries(groupedPerms).map(([module, perms]) => (
                  <div key={module}>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      {module}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {perms.map((perm: any) => {
                        const isActive = roleDetail?.permissions?.some((p: any) => p.id === perm.id);
                        return (
                          <button key={perm.id} onClick={() => togglePermission(perm.id)}
                            className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all',
                              isActive ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200')}>
                            <div className={cn('w-5 h-5 rounded flex items-center justify-center shrink-0',
                              isActive ? 'bg-teal-500' : 'bg-slate-100')}>
                              {isActive ? <Check size={12} className="text-white" /> : <X size={10} className="text-slate-300" />}
                            </div>
                            <span className="truncate">{perm.slug?.split(':')[1]?.replace(/_/g, ' ') ?? perm.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
