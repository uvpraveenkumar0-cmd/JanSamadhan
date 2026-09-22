import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LogOut,
  Mail,
  Phone,
  Building2,
  Briefcase,
  GraduationCap,
  BookOpen,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  IdCard,
  Award,
  Hash,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { VerificationBadge } from '../auth/VerificationBadge';
import { backdropVariants, drawerVariants } from '../../config/motion';
import { cn } from '../../lib/utils';
import type {
  CitizenProfile,
  GovernmentProfile,
  UniversityProfile,
  FacultyProfile,
  StudentProfile,
  IndustryProfile,
} from '../../types';

interface UserProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen Portal',
  government: 'Government Officer',
  government_admin: 'Government Admin',
  government_officer: 'Government Officer',
  university: 'University Admin',
  university_admin: 'University Admin',
  faculty: 'Faculty Mentor',
  faculty_member: 'Faculty Mentor',
  student: 'Student Innovator',
  industry: 'Industry Partner',
  industry_partner: 'Industry Partner',
  industry_admin: 'Industry Admin',
  industry_mentor: 'Industry Mentor',
  super_admin: 'Super Admin',
};

const ROLE_THEMES: Record<string, { bg: string; text: string; border: string; ring: string; avatarBg: string }> = {
  citizen: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    ring: 'ring-emerald-500/20',
    avatarBg: 'bg-emerald-600',
  },
  government: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'ring-blue-500/20',
    avatarBg: 'bg-blue-600',
  },
  government_officer: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'ring-blue-500/20',
    avatarBg: 'bg-blue-600',
  },
  government_admin: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'ring-blue-500/20',
    avatarBg: 'bg-blue-600',
  },
  university: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    ring: 'ring-sky-500/20',
    avatarBg: 'bg-sky-600',
  },
  university_admin: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
    ring: 'ring-sky-500/20',
    avatarBg: 'bg-sky-600',
  },
  faculty: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    ring: 'ring-purple-500/20',
    avatarBg: 'bg-purple-600',
  },
  faculty_member: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    ring: 'ring-purple-500/20',
    avatarBg: 'bg-purple-600',
  },
  student: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    ring: 'ring-indigo-500/20',
    avatarBg: 'bg-indigo-600',
  },
  industry: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    ring: 'ring-amber-500/20',
    avatarBg: 'bg-amber-600',
  },
  industry_partner: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    ring: 'ring-amber-500/20',
    avatarBg: 'bg-amber-600',
  },
};

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserProfileDrawer({ open, onClose }: UserProfileDrawerProps) {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Fetch full persisted profile if available
  const profile = useMemo(() => {
    if (!user?.profileId) return null;
    return db.getProfile(user.profileId);
  }, [user?.profileId]);

  if (!user) return null;

  const roleKey = user.role.toLowerCase();
  const theme = ROLE_THEMES[roleKey] || {
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    ring: 'ring-slate-500/20',
    avatarBg: 'bg-slate-700',
  };

  const roleLabel = ROLE_LABELS[roleKey] || user.role;
  const initials = getInitials(user.name);

  // Type casts for profile roles
  const citProfile = profile as CitizenProfile | null;
  const govProfile = profile as GovernmentProfile | null;
  const univProfile = profile as UniversityProfile | null;
  const facProfile = profile as FacultyProfile | null;
  const stuProfile = profile as StudentProfile | null;
  const indProfile = profile as IndustryProfile | null;

  // Extract phone number (from user or profile)
  const phone = user.phone || univProfile?.adminContactPhone;

  // Extract institution / organization
  const organization =
    user.organizationName ||
    govProfile?.department ||
    univProfile?.universityName ||
    facProfile?.universityName ||
    stuProfile?.universityName ||
    indProfile?.companyName;

  // Extract department
  const department =
    govProfile?.department ||
    facProfile?.department ||
    stuProfile?.department;

  // Extract designation / title
  const designation =
    govProfile?.designation ||
    facProfile?.designation ||
    indProfile?.pointOfContactRole ||
    citProfile?.occupation;

  // Extract identification code
  const officialId =
    govProfile?.officialId ||
    univProfile?.aisheCode ||
    facProfile?.employeeId ||
    stuProfile?.enrollmentNo ||
    indProfile?.cinOrRegistrationNo;

  const idLabel =
    govProfile?.officialId
      ? 'Official Government ID'
      : univProfile?.aisheCode
      ? 'AISHE Code'
      : facProfile?.employeeId
      ? 'Employee / Faculty ID'
      : stuProfile?.enrollmentNo
      ? 'Student Enrollment No.'
      : indProfile?.cinOrRegistrationNo
      ? 'CIN / Registration No.'
      : null;

  // Extract location
  const location = (() => {
    if (citProfile?.state || citProfile?.districtId) {
      const parts = [citProfile.village, citProfile.block, citProfile.districtId, citProfile.state]
        .filter(Boolean)
        .map((s) => s!.charAt(0).toUpperCase() + s!.slice(1));
      return parts.join(', ');
    }
    if (govProfile?.state || govProfile?.districtId) {
      return `${govProfile.districtId ? `${govProfile.districtId}, ` : ''}${govProfile.state || 'Jharkhand'}`;
    }
    if (univProfile?.address || univProfile?.state) {
      return univProfile.address || univProfile.state;
    }
    if (indProfile?.companyAddress || indProfile?.state) {
      return indProfile.companyAddress || indProfile.state;
    }
    return null;
  })();

  const handleLogoutClick = () => {
    onClose();
    logout();
    navigate('/', { replace: true });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="profile-drawer-title" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              variants={drawerVariants('right')}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              {/* ─── Drawer Header ─── */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                    <IdCard size={18} />
                  </div>
                  <div>
                    <h2 id="profile-drawer-title" className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Profile
                    </h2>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">Account overview & credentials</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close Profile"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ─── Drawer Scrollable Body ─── */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* 1. Identity Hero Card */}
                <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="relative mb-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
                      />
                    ) : (
                      <div
                        className={cn(
                          'w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold tracking-wider shadow-md ring-4',
                          theme.avatarBg,
                          theme.ring
                        )}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow">
                      <VerificationBadge status={user.status} isVerified={user.isVerified} size="sm" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{user.name}</h3>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                        theme.bg,
                        theme.text,
                        theme.border
                      )}
                    >
                      {roleLabel}
                    </span>
                    {user.isVerified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Account Information */}
                <div className="space-y-2.5">
                  <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    Account Information
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {/* Email */}
                    <div className="flex items-start gap-3 py-2 first:pt-0">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">Email Address</p>
                        <p className="text-slate-800 dark:text-slate-100 font-semibold break-all">{user.email}</p>
                      </div>
                    </div>

                    {/* Mobile / Phone */}
                    {phone && (
                      <div className="flex items-start gap-3 py-2">
                        <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">Mobile Phone</p>
                          <p className="text-slate-800 dark:text-slate-100 font-semibold">{phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {location && (
                      <div className="flex items-start gap-3 py-2 last:pb-0">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">Location</p>
                          <p className="text-slate-800 dark:text-slate-100 font-semibold">{location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Institution / Organization Information */}
                {(organization || designation || department || officialId) && (
                  <div className="space-y-2.5">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Institution & Organization
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {organization && (
                        <div className="flex items-start gap-3 py-2 first:pt-0">
                          <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">
                              Organization / Entity
                            </p>
                            <p className="text-slate-800 dark:text-slate-100 font-semibold">{organization}</p>
                          </div>
                        </div>
                      )}

                      {department && department !== organization && (
                        <div className="flex items-start gap-3 py-2">
                          <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">Department</p>
                            <p className="text-slate-800 dark:text-slate-100 font-semibold">{department}</p>
                          </div>
                        </div>
                      )}

                      {designation && (
                        <div className="flex items-start gap-3 py-2">
                          <Award className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">Designation / Role</p>
                            <p className="text-slate-800 dark:text-slate-100 font-semibold">{designation}</p>
                          </div>
                        </div>
                      )}

                      {officialId && idLabel && (
                        <div className="flex items-start gap-3 py-2 last:pb-0">
                          <Hash className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium">{idLabel}</p>
                            <p className="text-slate-800 dark:text-slate-100 font-mono font-semibold text-xs">
                              {officialId}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Portal-Specific Details */}
                {/* Student specific: Program, Year, Skills, CGPA */}
                {stuProfile && (
                  <div className="space-y-2.5">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Academic Details
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                      {stuProfile.degree && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Program / Degree</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{stuProfile.degree}</span>
                        </div>
                      )}
                      {stuProfile.yearOfStudy && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Year of Study</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Year {stuProfile.yearOfStudy} (Class of {stuProfile.expectedGraduationYear || 2027})
                          </span>
                        </div>
                      )}
                      {stuProfile.cgpa && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Current CGPA</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stuProfile.cgpa}</span>
                        </div>
                      )}
                      {Array.isArray(stuProfile.skills) && stuProfile.skills.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                          <span className="text-2xs text-slate-400 block mb-1.5">Registered Skillsets</span>
                          <div className="flex flex-wrap gap-1">
                            {stuProfile.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-2xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Faculty specific: Specializations & Publications */}
                {facProfile && (
                  <div className="space-y-2.5">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Research & Experience
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                      {facProfile.experienceYears !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Teaching Experience</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {facProfile.experienceYears} Years
                          </span>
                        </div>
                      )}
                      {facProfile.publicationsCount !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Published Papers</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {facProfile.publicationsCount} Publications
                          </span>
                        </div>
                      )}
                      {Array.isArray(facProfile.specializations) && facProfile.specializations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800">
                          <span className="text-2xs text-slate-400 block mb-1.5">Domain Specializations</span>
                          <div className="flex flex-wrap gap-1">
                            {facProfile.specializations.map((spec, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-2xs font-medium"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* University specific: Accreditation, Year, Capacity */}
                {univProfile && (
                  <div className="space-y-2.5">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Institutional Credentials
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                      {univProfile.accreditationGrade && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">NAAC / Accreditation</span>
                          <span className="font-semibold text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/50">
                            Grade {univProfile.accreditationGrade}
                          </span>
                        </div>
                      )}
                      {univProfile.establishedYear && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Year Established</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {univProfile.establishedYear}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Industry specific: Sector & CSR Budget */}
                {indProfile && (
                  <div className="space-y-2.5">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Corporate Details
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                      {indProfile.sector && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Industrial Sector</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{indProfile.sector}</span>
                        </div>
                      )}
                      {indProfile.csrBudgetAnnual !== undefined && indProfile.csrBudgetAnnual > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Annual CSR Civic Budget</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{indProfile.csrBudgetAnnual.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Citizen specific: Problems submitted & Language */}
                {citProfile && (
                  <div className="space-y-2.5">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                      Citizen Activity
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Community Grievances Filed</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {citProfile.problemsSubmittedCount || 0} Problems
                        </span>
                      </div>
                      {citProfile.preferredLanguage && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 dark:text-slate-400">Preferred Language</span>
                          <span className="uppercase font-semibold text-slate-800 dark:text-slate-200">
                            {citProfile.preferredLanguage}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Account Status Card */}
                <div className="space-y-2.5">
                  <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                    Account Status
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {user.status === 'active' ? 'Active Demo Session' : user.status || 'Active'}
                      </span>
                    </div>
                    {user.createdAt && (
                      <span className="text-2xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Drawer Footer (Logout) ─── */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer shadow-sm"
                >
                  <LogOut size={15} />
                  <span>Sign Out of Portal</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
