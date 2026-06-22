import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';
import { Droplet, Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      const { user, accessToken, refreshToken } = response.data.data;
      
      const hasAdminRole = user.roles?.some((role: string) => 
        role === 'super_admin' || role === 'ngo_admin'
      );
      
      if (!hasAdminRole) {
        setError('Access Denied: Web panel is restricted to Super Admins and NGO Admins.');
        return;
      }

      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-hidden bg-slate-100 flex items-stretch">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-2/5 gradient-primary relative overflow-hidden items-center justify-center p-12 xl:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.14),_transparent_38%)]" />

        <div className="relative z-10 max-w-lg text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Droplet size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">OYU Green</h1>
              <p className="text-white/70 text-sm">Borehole Rehabilitation Platform</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Streamlined project oversight for water access initiatives.
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-10">
            Enterprise-ready admin tools for monitoring borehole rehabilitation, managing NGOs,
            coordinating contractors, and tracking operational impact in one secure dashboard.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'NGOs Managed', value: '50+' },
              { label: 'Boreholes Tracked', value: '2,000+' },
              { label: 'Surveys Completed', value: '8,500+' },
              { label: 'Communities Served', value: '500+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-3xl p-5 border border-white/10">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-white/70 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-12 lg:py-10 overflow-hidden">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl shadow-slate-900/5 rounded-[32px] p-8 md:p-10 max-h-[calc(100dvh-4rem)] overflow-hidden">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-3xl gradient-primary flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Droplet size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">OYU Green</h1>
              <p className="text-sm text-slate-500">Admin Panel</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-slate-900">Welcome back.</h2>
            <p className="text-slate-500 mt-2">Sign in to continue to your operational dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-4 bg-rose-50 border border-rose-200 rounded-2xl">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="admin@oyugreen.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-2">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
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

            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-500">New here? Contact your system administrator.</div>
              <Link to="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © {new Date().getFullYear()} OYU Green Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
