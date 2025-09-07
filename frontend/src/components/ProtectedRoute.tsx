import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Auth state', {
    isAuthenticated,
    isLoading,
    pathname: location.pathname,
    requireAuth,
    userEmail: user?.email || 'null'
  });

  // Show loading spinner while authentication is being determined
  if (isLoading) {
    console.log('ProtectedRoute: Showing loading state');
    return <LoadingSpinner />;
  }

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    console.log('ProtectedRoute: Auth required but not authenticated, redirecting to login');
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If user is authenticated but trying to access login/register, redirect to home
  if (!requireAuth && isAuthenticated && 
      (location.pathname === '/login' || location.pathname === '/register')) {
    console.log('ProtectedRoute: Authenticated user accessing auth pages, redirecting to home');
    return <Navigate to="/" replace />;
  }

  // Render the protected component
  console.log('ProtectedRoute: Rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;