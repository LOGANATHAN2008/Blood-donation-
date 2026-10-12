import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const allowedRoles = ['moderator', 'admin', 'superadmin'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          You do not have the required permissions to view the Admin Panel. If you believe this is an error, please contact the system administrator.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn-primary"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return <Outlet />;
}
