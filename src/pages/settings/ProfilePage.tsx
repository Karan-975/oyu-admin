import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';
import { User, Lock, Loader2, CheckCircle, Mail, Phone } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(2), lastName: z.string().min(2),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'password'>('profile');
  const [success, setSuccess] = useState('');

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (res) => { setUser(res.data.data); setSuccess('Profile updated'); setTimeout(() => setSuccess(''), 3000); },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => authApi.changePassword(data.currentPassword, data.newPassword, data.confirmPassword),
    onSuccess: () => { passwordForm.reset(); setSuccess('Password changed'); setTimeout(() => setSuccess(''), 3000); },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and security</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="gradient-primary px-6 py-8 text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold mx-auto backdrop-blur-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <h2 className="text-xl font-bold text-white mt-3">{user?.firstName} {user?.lastName}</h2>
          <p className="text-white/70 text-sm">{user?.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            {user?.roles?.map((r, i) => (
              <span key={i} className="px-3 py-1 bg-white/15 rounded-full text-white text-xs font-medium backdrop-blur-sm">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1.5">
        <button onClick={() => setTab('profile')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'profile' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
          <User size={16} /> Profile Info
        </button>
        <button onClick={() => setTab('password')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'password' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Lock size={16} /> Change Password
        </button>
      </div>

      {tab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
              <input {...profileForm.register('firstName')} className="form-input" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
              <input {...profileForm.register('lastName')} className="form-input" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500"><Mail size={16} /> {user?.email}</div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input {...profileForm.register('phone')} className="form-input" placeholder="+234..." /></div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileMutation.isPending}
              className="px-6 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-teal-500/20">
              {profileMutation.isPending && <Loader2 size={16} className="animate-spin" />} Save Changes
            </button>
          </div>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <input {...passwordForm.register('currentPassword')} type="password" className="form-input" />
            {passwordForm.formState.errors.currentPassword && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}</div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input {...passwordForm.register('newPassword')} type="password" className="form-input" />
            {passwordForm.formState.errors.newPassword && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>}</div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
            <input {...passwordForm.register('confirmPassword')} type="password" className="form-input" />
            {passwordForm.formState.errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}</div>
          <div className="flex justify-end">
            <button type="submit" disabled={passwordMutation.isPending}
              className="px-6 py-2.5 gradient-primary text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-teal-500/20">
              {passwordMutation.isPending && <Loader2 size={16} className="animate-spin" />} Change Password
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
