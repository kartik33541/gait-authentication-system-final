import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute guard component
 * Re-directs unauthenticated users to /auth with current path reference.
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[--bg-primary] text-[--text-primary]">
        <div className="w-10 h-10 border-2 border-white/10 border-t-[--accent-indigo] rounded-full animate-spin"></div>
        <p className="mt-4 text-micro text-[--text-muted] uppercase tracking-widest animate-pulse">
          INITIALIZING SECURE SESSION...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
