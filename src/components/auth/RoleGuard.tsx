import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

// Map sub-roles to primary portal roles for compatibility
function normalizeRole(role: UserRole): UserRole[] {
  if (role === 'government_officer' || role === 'government_admin') {
    return [role, 'government'];
  }
  if (role === 'university_admin') {
    return [role, 'university'];
  }
  if (role === 'industry_admin' || role === 'industry_mentor') {
    return [role, 'industry'];
  }
  return [role];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Super admin can access anything
  if (user.role === 'super_admin') {
    return children ? <>{children}</> : <Outlet />;
  }

  const userRoles = normalizeRole(user.role);
  const hasAccess = allowedRoles.some((allowed) => userRoles.includes(allowed));

  if (!hasAccess) {
    return <Navigate to="/access-denied" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
