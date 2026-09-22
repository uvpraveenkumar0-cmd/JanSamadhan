import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    // Not logged in -> return to landing page with return path
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const path = location.pathname;

  // Status Gate Checks
  if (user.status === 'suspended' && path !== '/account-suspended') {
    return <Navigate to="/account-suspended" replace />;
  }

  if (user.status === 'rejected' && path !== '/verification-rejected') {
    return <Navigate to="/verification-rejected" replace />;
  }

  if (user.status === 'pending_verification' && path !== '/verification-pending') {
    return <Navigate to="/verification-pending" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
