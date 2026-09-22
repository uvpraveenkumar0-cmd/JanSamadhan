import React, { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { RoleAuthModal, type EcoRoleKey } from '../../components/ui/RoleAuthModal';
import { getDashboardForRole } from '../../utils/roleRouting';
import Landing from '../Landing';

interface AuthPageProps {
  mode: 'login' | 'register';
}

function parseRoleParam(param?: string): EcoRoleKey {
  if (!param) return 'citizen';
  const p = param.toLowerCase();
  if (p === 'student') return 'student';
  if (p === 'government' || p === 'government_officer' || p === 'government-officer') return 'government';
  if (p === 'university' || p === 'university_admin' || p === 'university-admin') return 'university';
  if (p === 'faculty') return 'faculty';
  if (p === 'industry' || p === 'industry_partner' || p === 'industry-partner' || p === 'company') return 'industry';
  return 'citizen';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { user } = useApp();

  const ecoRole = useMemo(() => parseRoleParam(role), [role]);

  // If already genuinely logged in, redirect to correct role dashboard
  if (user && user.status === 'active') {
    return <Navigate to={getDashboardForRole(user.role)} replace />;
  }

  return (
    <>
      {/* Background landing view */}
      <Landing />

      {/* Modal locked to requested role and mode */}
      <RoleAuthModal
        key={`${ecoRole}-${mode}`}
        initialRole={ecoRole}
        initialMode={mode}
        onClose={() => navigate('/')}
        onModeChange={(newMode) => {
          const roleSlug = role || ecoRole;
          navigate(`/${roleSlug}/${newMode}`, { replace: true });
        }}
      />
    </>
  );
}
