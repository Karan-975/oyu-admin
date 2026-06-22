import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const roles = user?.roles ?? [];
  const canUseAdminPanel = roles.includes('super_admin') || roles.includes('ngo_admin');
  if (!canUseAdminPanel) return <Navigate to="/login" replace />;
  const kycApproved = ['approved', 'completed'].includes((user?.kycStatus ?? '').toLowerCase());
  const kycAllowedPaths = ['/kyc', '/notifications', '/settings/profile'];
  if (
    roles.includes('ngo_admin') &&
    !roles.includes('super_admin') &&
    !kycApproved &&
    !kycAllowedPaths.some((path) => location.pathname.startsWith(path))
  ) {
    return <Navigate to="/kyc" replace />;
  }
  return <>{children}</>;
}
