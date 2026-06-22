import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/auth.api';
import { Droplet, Eye, EyeOff, Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

const schema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  confirmPassword: z.string().min(1, 'Confirm password required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authApi.resetPassword(token, data.password, data.confirmPassword);
      setSent(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Droplet size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">OYU Green</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-teal-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Password Reset Successful</h2>
              <p className="text-slate-500 text-sm mb-6">Your password has been updated. Redirecting to login...</p>
              <Link to="/login" className="text-teal-600 font-medium text-sm hover:text-teal-700 flex items-center gap-2 justify-center">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Reset Password</h2>
              <p className="text-slate-500 text-sm mb-6">Enter a new password to regain access to your account.</p>

              {error && (
                <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="w-full pr-12 py-3 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-rose-500 mt-2">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="w-full pr-12 py-3 pl-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  {errors.confirmPassword && <p className="text-xs text-rose-500 mt-2">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 gradient-primary text-white font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <Link to="/login" className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-4 flex items-center gap-2 justify-center">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
