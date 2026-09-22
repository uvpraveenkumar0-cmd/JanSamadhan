// Centralized Role Routing and Normalization Utility
// Ensures all authentication, registration, and guard redirections use consistent mappings.

export function getDashboardForRole(role?: string | null): string {
  if (!role) return '/';

  switch (role.toLowerCase()) {
    case 'citizen':
      return '/citizen/dashboard';

    case 'student':
      return '/student/dashboard';

    case 'government':
    case 'government_officer':
    case 'government_admin':
      return '/government/dashboard';

    case 'university':
    case 'university_admin':
      return '/university/dashboard';

    case 'faculty':
    case 'faculty_member':
      return '/faculty/dashboard';

    case 'industry':
    case 'industry_partner':
    case 'industry_admin':
    case 'industry_mentor':
    case 'company':
      return '/industry/dashboard';

    case 'super_admin':
      return '/government/dashboard';

    default:
      return '/';
  }
}

export function normalizeRole(role?: string | null): string[] {
  if (!role) return [];

  const r = role.toLowerCase();

  if (r === 'government' || r === 'government_officer' || r === 'government_admin') {
    return ['government', 'government_officer', 'government_admin'];
  }
  if (r === 'university' || r === 'university_admin') {
    return ['university', 'university_admin'];
  }
  if (
    r === 'industry' ||
    r === 'industry_partner' ||
    r === 'industry_admin' ||
    r === 'industry_mentor' ||
    r === 'company'
  ) {
    return ['industry', 'industry_partner', 'industry_admin', 'industry_mentor', 'company'];
  }
  if (r === 'faculty' || r === 'faculty_member') {
    return ['faculty', 'faculty_member'];
  }
  return [r];
}
