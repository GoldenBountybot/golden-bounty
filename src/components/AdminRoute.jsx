import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Admin-only route guard. Nest inside <ProtectedRoute> so authentication is
// already verified by the time this runs — AdminRoute only checks the admin
// role. Non-admins are redirected to the lobby; admins see <Outlet />.
export default function AdminRoute() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-stone-950">
        <div className="w-8 h-8 border-4 border-amber-300/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}