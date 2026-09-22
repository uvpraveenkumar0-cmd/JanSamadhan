import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { useApp } from '../context/AppContext';
import { Skeleton } from '../components/ui/Card';

// Eagerly loaded
import Landing from '../pages/Landing';

// Lazy-loaded role pages
const CitizenDashboard   = lazy(() => import('../pages/citizen/Dashboard'));
const CitizenProblems    = lazy(() => import('../pages/citizen/Problems'));
const CitizenSubmit      = lazy(() => import('../pages/citizen/ProblemSubmit'));
const CitizenTrack       = lazy(() => import('../pages/citizen/TrackStatus'));
const CitizenNotifications = lazy(() => import('../pages/citizen/Notifications'));
const CitizenProfile     = lazy(() => import('../pages/citizen/Profile'));

const GovDashboard       = lazy(() => import('../pages/government/Dashboard'));
const GovVerification    = lazy(() => import('../pages/government/VerificationQueue'));
const GovMatching        = lazy(() => import('../pages/government/AIMatching'));
const GovInstitutions    = lazy(() => import('../pages/government/Institutions'));
const GovIndustry        = lazy(() => import('../pages/government/IndustryPartners'));
const GovDistricts       = lazy(() => import('../pages/government/DistrictMap'));
const GovAnalytics       = lazy(() => import('../pages/government/Analytics'));
const GovAudit           = lazy(() => import('../pages/government/AuditLogs'));
const GovReports         = lazy(() => import('../pages/government/Reports'));
const GovSettings        = lazy(() => import('../pages/government/Settings'));

const UnivDashboard      = lazy(() => import('../pages/university/Dashboard'));
const UnivMarketplace    = lazy(() => import('../pages/university/Marketplace'));
const UnivTeams          = lazy(() => import('../pages/university/Teams'));
const UnivFaculty        = lazy(() => import('../pages/university/Faculty'));
const UnivProjects       = lazy(() => import('../pages/university/Projects'));
const UnivIndustry       = lazy(() => import('../pages/university/IndustryCollab'));
const UnivAnalytics      = lazy(() => import('../pages/university/Analytics'));
const UnivMatching       = lazy(() => import('../pages/university/FacultyTeamMatching'));

const FacultyDashboard   = lazy(() => import('../pages/faculty/Dashboard'));
const FacultyProjects    = lazy(() => import('../pages/faculty/Projects'));
const FacultyProjectDetail = lazy(() => import('../pages/faculty/ProjectDetail'));
const FacultyStudents    = lazy(() => import('../pages/faculty/Students'));
const FacultyResearch    = lazy(() => import('../pages/faculty/Research'));
const FacultyPrototypes  = lazy(() => import('../pages/faculty/Prototypes'));
const FacultyIndustry    = lazy(() => import('../pages/faculty/IndustryCollab'));
const FacultyAnalytics   = lazy(() => import('../pages/faculty/Analytics'));

const StudentDashboard   = lazy(() => import('../pages/student/Dashboard'));
const StudentTeam        = lazy(() => import('../pages/student/Team'));
const StudentTasks       = lazy(() => import('../pages/student/Tasks'));
const StudentResearch    = lazy(() => import('../pages/student/FieldResearch'));
const StudentPrototype   = lazy(() => import('../pages/student/Prototype'));
const StudentIndustry    = lazy(() => import('../pages/student/IndustryRequests'));
const StudentFeedback    = lazy(() => import('../pages/student/Feedback'));
const StudentNotifications = lazy(() => import('../pages/student/Notifications'));

const IndustryDashboard  = lazy(() => import('../pages/industry/Dashboard'));
const IndustryDiscover   = lazy(() => import('../pages/industry/ProjectDiscovery'));
const IndustryRequests   = lazy(() => import('../pages/industry/CollaborationRequests'));
const IndustryWorkspace  = lazy(() => import('../pages/industry/Workspace'));
const IndustryFunding    = lazy(() => import('../pages/industry/Funding'));
const IndustryPilots     = lazy(() => import('../pages/industry/PilotDeployment'));
const IndustryAnalytics  = lazy(() => import('../pages/industry/Analytics'));

// Lazy-loaded auth status gate pages & admin verification
const VerificationPending = lazy(() =>
  import('../pages/auth/VerificationPending').then((m) => ({ default: m.VerificationPending }))
);
const VerificationRejected = lazy(() =>
  import('../pages/auth/VerificationRejected').then((m) => ({ default: m.VerificationRejected }))
);
const AccountSuspended = lazy(() =>
  import('../pages/auth/AccountSuspended').then((m) => ({ default: m.AccountSuspended }))
);
const AccessDenied = lazy(() =>
  import('../pages/auth/AccessDenied').then((m) => ({ default: m.AccessDenied }))
);
const ProblemManagement = lazy(() =>
  import('../pages/admin/ProblemManagement').then((m) => ({ default: m.ProblemManagement }))
);

// Lazy-loaded auth page
const AuthPage = lazy(() => import('../pages/auth/AuthPage'));

import { normalizeRole } from '../utils/roleRouting';

function LoadingFallback() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (user.status === 'suspended') return <Navigate to="/account-suspended" replace />;
  if (user.status === 'rejected') return <Navigate to="/verification-rejected" replace />;
  if (user.status === 'pending_verification') return <Navigate to="/verification-pending" replace />;
  return <>{children}</>;  
}

function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'super_admin') return <>{children}</>;
  const normalized = normalizeRole(user.role);
  if (!normalized.includes(role)) {
    return <Navigate to="/access-denied" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/" replace />;
  const allowed = ['government', 'government_admin', 'government_officer', 'super_admin'];
  if (!allowed.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Public Landing */}
          <Route path="/" element={<Landing />} />

          {/* Public Role Authentication Routes */}
          <Route path="/:role/login" element={<AuthPage mode="login" />} />
          <Route path="/:role/register" element={<AuthPage mode="register" />} />

          {/* Status Gates & Access Denied (accessible when authenticated in that state) */}
          <Route path="/verification-pending" element={<VerificationPending />} />
          <Route path="/verification-rejected" element={<VerificationRejected />} />
          <Route path="/account-suspended" element={<AccountSuspended />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Protected App Shell */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            {/* Admin Problem Management */}
            <Route
              path="/admin/problems"
              element={
                <RequireAdmin>
                  <ProblemManagement />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/verification"
              element={
                <RequireAdmin>
                  <ProblemManagement />
                </RequireAdmin>
              }
            />

            {/* Citizen */}
            <Route path="/citizen/dashboard"     element={<RequireRole role="citizen"><CitizenDashboard /></RequireRole>} />
            <Route path="/citizen/problems"      element={<RequireRole role="citizen"><CitizenProblems /></RequireRole>} />
            <Route path="/citizen/problems/new"  element={<RequireRole role="citizen"><CitizenSubmit /></RequireRole>} />
            <Route path="/citizen/track"         element={<RequireRole role="citizen"><CitizenTrack /></RequireRole>} />
            <Route path="/citizen/track/:problemId" element={<RequireRole role="citizen"><CitizenTrack /></RequireRole>} />
            <Route path="/citizen/notifications" element={<RequireRole role="citizen"><CitizenNotifications /></RequireRole>} />
            <Route path="/citizen/profile"       element={<RequireRole role="citizen"><CitizenProfile /></RequireRole>} />

            {/* Government */}
            <Route path="/government/dashboard"   element={<RequireRole role="government"><GovDashboard /></RequireRole>} />
            <Route path="/government/verification" element={<RequireRole role="government"><GovVerification /></RequireRole>} />
            <Route path="/government/matching"    element={<RequireRole role="government"><GovMatching /></RequireRole>} />
            <Route path="/government/matching/:problemId" element={<RequireRole role="government"><GovMatching /></RequireRole>} />
            <Route path="/government/institutions" element={<RequireRole role="government"><GovInstitutions /></RequireRole>} />
            <Route path="/government/industry"    element={<RequireRole role="government"><GovIndustry /></RequireRole>} />
            <Route path="/government/districts"   element={<RequireRole role="government"><GovDistricts /></RequireRole>} />
            <Route path="/government/analytics"   element={<RequireRole role="government"><GovAnalytics /></RequireRole>} />
            <Route path="/government/audit"       element={<RequireRole role="government"><GovAudit /></RequireRole>} />
            <Route path="/government/reports"     element={<RequireRole role="government"><GovReports /></RequireRole>} />
            <Route path="/government/settings"    element={<RequireRole role="government"><GovSettings /></RequireRole>} />

            {/* University */}
            <Route path="/university/dashboard"   element={<RequireRole role="university"><UnivDashboard /></RequireRole>} />
            <Route path="/university/matching/:problemId" element={<RequireRole role="university"><UnivMatching /></RequireRole>} />
            <Route path="/university/marketplace" element={<RequireRole role="university"><UnivMarketplace /></RequireRole>} />
            <Route path="/university/teams"       element={<RequireRole role="university"><UnivTeams /></RequireRole>} />
            <Route path="/university/faculty"     element={<RequireRole role="university"><UnivFaculty /></RequireRole>} />
            <Route path="/university/projects"    element={<RequireRole role="university"><UnivProjects /></RequireRole>} />
            <Route path="/university/industry"    element={<RequireRole role="university"><UnivIndustry /></RequireRole>} />
            <Route path="/university/analytics"   element={<RequireRole role="university"><UnivAnalytics /></RequireRole>} />

            {/* Faculty */}
            <Route path="/faculty/dashboard"      element={<RequireRole role="faculty"><FacultyDashboard /></RequireRole>} />
            <Route path="/faculty/projects"       element={<RequireRole role="faculty"><FacultyProjects /></RequireRole>} />
            <Route path="/faculty/projects/:id"   element={<RequireRole role="faculty"><FacultyProjectDetail /></RequireRole>} />
            <Route path="/faculty/students"       element={<RequireRole role="faculty"><FacultyStudents /></RequireRole>} />
            <Route path="/faculty/research"       element={<RequireRole role="faculty"><FacultyResearch /></RequireRole>} />
            <Route path="/faculty/prototypes"     element={<RequireRole role="faculty"><FacultyPrototypes /></RequireRole>} />
            <Route path="/faculty/industry"       element={<RequireRole role="faculty"><FacultyIndustry /></RequireRole>} />
            <Route path="/faculty/analytics"      element={<RequireRole role="faculty"><FacultyAnalytics /></RequireRole>} />

            {/* Student */}
            <Route path="/student/dashboard"      element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
            <Route path="/student/team"           element={<RequireRole role="student"><StudentTeam /></RequireRole>} />
            <Route path="/student/tasks"          element={<RequireRole role="student"><StudentTasks /></RequireRole>} />
            <Route path="/student/research"       element={<RequireRole role="student"><StudentResearch /></RequireRole>} />
            <Route path="/student/prototype"      element={<RequireRole role="student"><StudentPrototype /></RequireRole>} />
            <Route path="/student/industry"       element={<RequireRole role="student"><StudentIndustry /></RequireRole>} />
            <Route path="/student/feedback"       element={<RequireRole role="student"><StudentFeedback /></RequireRole>} />
            <Route path="/student/notifications"  element={<RequireRole role="student"><StudentNotifications /></RequireRole>} />

            {/* Industry */}
            <Route path="/industry/dashboard"     element={<RequireRole role="industry"><IndustryDashboard /></RequireRole>} />
            <Route path="/industry/discover"      element={<RequireRole role="industry"><IndustryDiscover /></RequireRole>} />
            <Route path="/industry/requests"      element={<RequireRole role="industry"><IndustryRequests /></RequireRole>} />
            <Route path="/industry/workspace"     element={<RequireRole role="industry"><IndustryWorkspace /></RequireRole>} />
            <Route path="/industry/funding"       element={<RequireRole role="industry"><IndustryFunding /></RequireRole>} />
            <Route path="/industry/pilots"        element={<RequireRole role="industry"><IndustryPilots /></RequireRole>} />
            <Route path="/industry/analytics"     element={<RequireRole role="industry"><IndustryAnalytics /></RequireRole>} />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
