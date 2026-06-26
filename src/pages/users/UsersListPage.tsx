import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersApi, rolesApi } from '../../api/endpoints';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Pagination } from '../../components/ui/Pagination';
import { PageLoader, EmptyState } from '../../components/ui/PageLoader';
import { Users, Plus, Search, Filter, MoreVertical, Shield, KeyRound, Trash2, X, Loader2, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/auth.store';
import { getAssignableUserRoleSlugs } from '../../lib/access';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase letter')
  .regex(/[a-z]/, 'Must contain lowercase letter')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special character');

const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().max(50).optional().or(z.literal('')),
  password: passwordSchema,
  roleIds: z.string().array().min(1, 'At least one role required'),
  responsibleNgoAdminId: z.string().optional().or(z.literal('')),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

export function UsersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const currentUserRoles = currentUser?.roles ?? [];
  const [createError, setCreateError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search, statusFilter],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onMutate: (id: string) => {
      setDeleteError('');
      setPendingDeleteId(id);
    },
    onSuccess: (_response, deletedId) => {
      queryClient.setQueriesData({ queryKey: ['users'] }, (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((user: any) => user.id !== deletedId),
          pagination: oldData.pagination
            ? {
                ...oldData.pagination,
                total: Math.max((oldData.pagination.total ?? 1) - 1, 0),
              }
            : oldData.pagination,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to delete user.';
      setDeleteError(msg);
    },
    onSettled: () => setPendingDeleteId(null),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list().then(r => r.data.data),
  });

  const assignableRoleSlugs = getAssignableUserRoleSlugs(currentUserRoles);
  const assignableRoles = rolesData?.filter((role: any) =>
    assignableRoleSlugs.includes(role.slug) && role.slug !== 'contractor'
  ) ?? [];
  const isSuperAdmin = currentUserRoles.includes('super_admin');

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CreateUserForm>({
    defaultValues: { roleIds: [], responsibleNgoAdminId: '' },
    resolver: zodResolver(createUserSchema),
  });

  const selectedRoleIds = watch('roleIds') ?? [];
  const selectedRoleSlugs = assignableRoles
    .filter((role: any) => selectedRoleIds.includes(role.id))
    .map((role: any) => role.slug);
  const requiresResponsibleAdminSelection =
    isSuperAdmin &&
    selectedRoleSlugs.includes('ngo_team_member');

  const { data: ngoAdminsData, isLoading: loadingNgoAdmins } = useQuery({
    queryKey: ['users', 'ngo-admins-for-team-owner'],
    queryFn: () => usersApi.list({ limit: 100, roleSlug: 'ngo_admin', status: 'active' }).then(r => r.data.data),
    enabled: isSuperAdmin,
  });
  const ngoAdmins = ngoAdminsData ?? [];

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserForm) => usersApi.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      password: data.password,
      roleIds: data.roleIds,
      responsibleNgoAdminId: data.responsibleNgoAdminId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['ngo'] });
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      setShowCreateModal(false);
      setCreateError('');
      reset();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to create user.';
      setCreateError(msg);
    },
  });

  const handleCreateUser = (data: CreateUserForm) => {
    setCreateError('');
    if (requiresResponsibleAdminSelection && !data.responsibleNgoAdminId) {
      setCreateError('Please select the NGO Admin responsible for this team member.');
      return;
    }
    createUserMutation.mutate(data);
  };

  const handleDeleteUser = (user: any) => {
    if (user.id === currentUser?.id) {
      setDeleteError('You cannot delete your own logged-in account.');
      setActiveMenu(null);
      return;
    }

    setDeleteError('');
    setUserToDelete(user);
    setActiveMenu(null);
  };

  const toggleRole = (roleId: string) => {
    const nextRoleIds = selectedRoleIds.includes(roleId)
      ? selectedRoleIds.filter((id) => id !== roleId)
      : [...selectedRoleIds, roleId];
    setValue('roleIds', nextRoleIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform users and their roles</p>
        </div>
        <button
          onClick={() => navigate('/settings/users/new')}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md shadow-teal-500/20"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {deleteError && (
          <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError('')} className="text-red-400 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-4 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            {['', 'active', 'inactive', 'suspended'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  statusFilter === s ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-slate-500 border-slate-200 hover:bg-slate-50')}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState
            title="Unable to load Users"
            description={error instanceof Error ? error.message : 'Please refresh or try again later.'}
            icon={<Users size={40} />}
          />
        ) : !data?.data?.length ? (
          <EmptyState title="No users found" icon={<Users size={40} />} />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Responsible Admin</th>
                  <th>KYC Status</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user: any) => (
                  <tr key={user.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">{user.first_name} {user.last_name}</p>
                          {user.phone && <p className="text-[10px] text-slate-400">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">{user.email}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(user.roleNames ?? user.role_names?.split(',') ?? []).map((role: string, i: number) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-medium rounded-full">
                            <Shield size={10} /> {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">
                      {user.responsible_admin_name ?? 'Unassigned'}
                    </td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full",
                        user.roleSlugs?.includes('super_admin') ? 'bg-slate-100 text-slate-500' :
                        user.kycData?.kycStatus === 'Approved' ? 'bg-green-50 text-green-700' :
                        user.kycData?.kycStatus === 'Rejected' ? 'bg-red-50 text-red-700' :
                        user.kycData?.kycStatus === 'Awaiting Document Verification' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-700'
                      )}>
                        {user.roleSlugs?.includes('super_admin') ? 'N/A' : (user.kycData?.kycStatus || 'Pending KYC')}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td><StatusBadge status={user.status} /></td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical size={16} className="text-slate-400" />
                        </button>
                        {activeMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20 animate-scale-in">
                            <button
                              onClick={() => { setActiveMenu(null); navigate(`/settings/users/${user.id}/edit`); }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                            >
                              <User size={14} /> Edit Profile & KYC
                            </button>
                            {currentUserRoles.includes('super_admin') && user.roleSlugs?.includes('ngo_admin') && (
                              <button
                                onClick={() => { setActiveMenu(null); navigate(`/settings/users/${user.id}/kyc-review`); }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                              >
                                <Shield size={14} /> Review KYC
                              </button>
                            )}
                            <button onClick={() => setActiveMenu(null)} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50">
                              <KeyRound size={14} /> Reset Password
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={pendingDeleteId === user.id}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {pendingDeleteId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              {pendingDeleteId === user.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.pagination && (
              <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages}
                total={data.pagination.total} limit={data.pagination.limit} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-100 bg-white">
              <h2 className="text-lg font-semibold text-slate-800">Create New User</h2>
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); reset(); }} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            {createError && (
              <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                {createError}
              </div>
            )}
            <form onSubmit={handleSubmit(handleCreateUser)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name</label>
                <input {...register('firstName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="John" />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
                <input {...register('lastName')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Doe" />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input {...register('email')} type="email" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="john@example.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone (Optional)</label>
                <input {...register('phone')} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="+234..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input {...register('password')} type="password" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" placeholder="Min 8 chars, uppercase, number, special" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role(s)</label>
                {assignableRoles.length > 0 ? (
                  <div className="space-y-2">
                    {assignableRoles.map((role: any) => (
                      <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRoleIds.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-600">{role.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    You do not have permission to assign roles from this panel.
                  </div>
                )}
                {assignableRoles.length > 0 && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Available for your access: {assignableRoles.map((role: any) => role.name).join(', ')}.
                  </p>
                )}
                {errors.roleIds && <p className="text-xs text-red-500 mt-1">{errors.roleIds.message}</p>}
              </div>
              {isSuperAdmin && requiresResponsibleAdminSelection && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Responsible NGO Admin</label>
                  <select
                    {...register('responsibleNgoAdminId')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    disabled={loadingNgoAdmins}
                  >
                    <option value="">{loadingNgoAdmins ? 'Loading NGO Admins...' : 'Select responsible NGO Admin'}</option>
                    {ngoAdmins.map((admin: any) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.first_name} {admin.last_name} ({admin.email})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    This team member will be visible only to the selected NGO Admin.
                  </p>
                  {errors.responsibleNgoAdminId && <p className="text-xs text-red-500 mt-1">{errors.responsibleNgoAdminId.message}</p>}
                </div>
              )}
              {!isSuperAdmin && currentUserRoles.includes('ngo_admin') && (
                <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-700">
                  New NGO Team Members will be visible only in your team.
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowCreateModal(false); reset(); }} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={createUserMutation.isPending} className="flex-1 px-4 py-2 text-sm font-medium text-white gradient-primary rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {createUserMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Confirm Delete</h3>
              <button onClick={() => setUserToDelete(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong>{userToDelete.first_name} {userToDelete.last_name}</strong>? This user will no longer be able to access the system.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMutation.mutate(userToDelete.id);
                  setUserToDelete(null);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

