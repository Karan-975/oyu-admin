import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '../../api/auth.api';
import { Droplet, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

const schema = z.object({ email: z.string().email('Please enter a valid email') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {} finally { setIsLoading(false); }
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
              <h2 className="text-xl font-bold text-slate-800 mb-2">Email Sent</h2>
              <p className="text-slate-500 text-sm mb-6">If an account exists with that email, you'll receive a password reset link.</p>
              <Link to="/login" className="text-teal-600 font-medium text-sm hover:text-teal-700 flex items-center gap-2 justify-center">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Forgot Password</h2>
              <p className="text-slate-500 text-sm mb-6">Enter your email to receive a reset link.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input {...register('email')} type="email" placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-3 gradient-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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
