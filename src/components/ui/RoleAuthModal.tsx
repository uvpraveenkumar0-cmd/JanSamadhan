import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Eye,
  EyeOff,
  Users,
  ShieldCheck,
  Building2,
  BookOpen,
  GraduationCap,
  Briefcase,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import { backdropVariants, modalVariants } from '../../config/motion';
import type { UserRole, ProblemDomain } from '../../types';
import { authBackend, type LoginResult } from '../../services/authBackend';
import { db } from '../../services/db';
import { StepIndicator } from '../auth/StepIndicator';
import { PasswordStrengthMeter } from '../auth/PasswordStrengthMeter';
import { OTPVerification } from '../auth/OTPVerification';
import { FileUpload } from '../auth/FileUpload';
import { DISTRICTS } from '../../data/mockData';
import { getDashboardForRole } from '../../utils/roleRouting';

// ─── Role Catalogue ──────────────────────────────────────────────────────────

export type EcoRoleKey =
  | 'citizen'
  | 'government'
  | 'university'
  | 'faculty'
  | 'student'
  | 'industry'
  | 'company'; // Alias for industry

interface RoleMeta {
  key: EcoRoleKey;
  appRole: UserRole;
  label: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  Icon: React.ElementType;
  /** Tailwind text colour class */
  color: string;
  /** Tailwind bg class */
  bg: string;
  /** Tailwind border class */
  border: string;
  /** Hex for ring/focus */
  ringColor: string;
  route: string;
}

const ROLE_META: RoleMeta[] = [
  {
    key: 'citizen',
    appRole: 'citizen',
    label: 'Citizen Portal',
    subtitle: 'Report community problems and track their resolution.',
    emailLabel: 'Email or Mobile Number',
    emailPlaceholder: 'Enter your email or mobile',
    Icon: Users,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-500',
    ringColor: '#10b981',
    route: '/citizen/dashboard',
  },
  {
    key: 'government',
    appRole: 'government',
    label: 'Government Portal',
    subtitle: 'Manage, verify and coordinate community problem resolution.',
    emailLabel: 'Official Email / Government ID',
    emailPlaceholder: 'name@jharkhand.gov.in',
    Icon: ShieldCheck,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-500',
    ringColor: '#3b82f6',
    route: '/government/dashboard',
  },
  {
    key: 'university',
    appRole: 'university',
    label: 'University Portal',
    subtitle: 'Coordinate innovation teams and solve community challenges.',
    emailLabel: 'University Email / ID',
    emailPlaceholder: 'admin@university.ac.in',
    Icon: Building2,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    border: 'border-sky-500',
    ringColor: '#0284c7',
    route: '/university/dashboard',
  },
  {
    key: 'faculty',
    appRole: 'faculty',
    label: 'Faculty Portal',
    subtitle: 'Mentor teams and guide community innovation projects.',
    emailLabel: 'Faculty Email / ID',
    emailPlaceholder: 'faculty@university.ac.in',
    Icon: BookOpen,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-500',
    ringColor: '#9333ea',
    route: '/faculty/dashboard',
  },
  {
    key: 'student',
    appRole: 'student',
    label: 'Student Portal',
    subtitle: 'Collaborate with your team and build solutions for real-world problems.',
    emailLabel: 'Student Email / Enrollment ID',
    emailPlaceholder: 'student@university.ac.in',
    Icon: GraduationCap,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-500',
    ringColor: '#6366f1',
    route: '/student/dashboard',
  },
  {
    key: 'industry',
    appRole: 'industry',
    label: 'Industry Portal',
    subtitle: 'Mentor, support and collaborate on community innovation projects.',
    emailLabel: 'Official Email / Organization ID',
    emailPlaceholder: 'contact@company.com',
    Icon: Briefcase,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-500',
    ringColor: '#d97706',
    route: '/industry/dashboard',
  },
];

const DOMAINS_LIST: { id: ProblemDomain; label: string }[] = [
  { id: 'water', label: 'Water & Sanitation' },
  { id: 'agriculture', label: 'Agriculture & Rural Tech' },
  { id: 'healthcare', label: 'Healthcare & Nutrition' },
  { id: 'education', label: 'Education & Literacy' },
  { id: 'energy', label: 'Renewable Energy & Power' },
  { id: 'environment', label: 'Environment & Waste' },
  { id: 'infrastructure', label: 'Infrastructure & Roads' },
  { id: 'livelihoods', label: 'Livelihoods & Tribal Welfare' },
];

interface RoleAuthModalProps {
  initialRole: EcoRoleKey;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onModeChange?: (mode: 'login' | 'register') => void;
}

export function RoleAuthModal({ initialRole, initialMode = 'login', onClose, onModeChange }: RoleAuthModalProps) {
  const navigate = useNavigate();
  const { setUser, addToast } = useApp();

  const normalizedInitial = initialRole === 'company' ? 'industry' : initialRole;
  const [activeKey, setActiveKey] = useState<EcoRoleKey>(normalizedInitial);
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [regSuccess, setRegSuccess] = useState<{ roleLabel: string; email: string } | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // Multi-step Registration State
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState<Record<string, any>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    state: 'Jharkhand',
    districtId: 'ranchi',
    block: '',
    village: '',
    pincode: '',
    occupation: '',
    officialId: '',
    designation: '',
    department: '',
    ministry: 'Govt. of Jharkhand',
    jurisdiction: 'district',
    universityId: 'univ1',
    universityName: 'BIT Sindri',
    aisheCode: '',
    accreditationGrade: 'A',
    establishedYear: 1960,
    website: '',
    address: '',
    domains: ['water', 'environment'] as ProblemDomain[],
    labFacilities: '',
    researchFocus: '',
    rAndDCapacityScore: 80,
    employeeId: '',
    specializations: '',
    publicationsCount: 0,
    experienceYears: 5,
    enrollmentNo: '',
    degree: 'B.Tech',
    yearOfStudy: 3,
    expectedGraduationYear: 2027,
    skills: '',
    cgpa: 8.5,
    companyName: '',
    cinOrRegistrationNo: '',
    sector: 'CleanTech & Environmental Engineering',
    csrBudgetAnnual: 5000000,
    collaborationInterests: ['mentorship', 'funding', 'testing'] as Array<any>,
    docName: '',
  });

  // OTP Transient State for Citizen Registration
  const [otpState, setOtpState] = useState<{
    dispatched: boolean;
    simulatedCode?: string;
    error?: string;
    loading: boolean;
  }>({
    dispatched: false,
    loading: false,
  });

  const role =
    ROLE_META.find((r) => r.key === activeKey) ||
    ROLE_META.find((r) => r.key === 'industry')!;
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync initialRole
  useEffect(() => {
    const k = initialRole === 'company' ? 'industry' : initialRole;
    setActiveKey(k);
  }, [initialRole]);

  // Sync initialMode
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  // Clear form state when role changes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setAuthError(null);
    setShowPw(false);
    setDone(false);
    setSubmitting(false);
    setRegSuccess(null);
  }, [activeKey]);

  // Escape key handler
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleModeSwitch = useCallback((m: 'login' | 'register') => {
    setMode(m);
    setRegStep(1);
    setAuthError(null);
    setShowPw(false);
    setRegSuccess(null);
    onModeChange?.(m);
  }, [onModeChange]);

  // ─── LOGIN HANDLER ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthError('Please provide both email / ID and password.');
      return;
    }

    setSubmitting(true);
    setAuthError(null);

    try {
      const res: LoginResult = await authBackend.login(email, password, rememberMe);

      if (!res.success) {
        setSubmitting(false);
        if (res.requiresStatusGate && res.user) {
          setUser(res.user);
          onClose();
          if (res.status === 'pending_verification') {
            navigate('/verification-pending');
          } else if (res.status === 'rejected') {
            navigate('/verification-rejected');
          } else if (res.status === 'suspended') {
            navigate('/account-suspended');
          }
          return;
        }
        setAuthError(res.message || 'Login failed. Please check your credentials.');
        return;
      }

      if (res.user) {
        setUser(res.user);
      }

      setSubmitting(false);
      setDone(true);

      setTimeout(() => {
        onClose();
        if (res.requiresStatusGate) {
          if (res.status === 'pending_verification') {
            navigate('/verification-pending');
          } else if (res.status === 'rejected') {
            navigate('/verification-rejected');
          } else if (res.status === 'suspended') {
            navigate('/account-suspended');
          }
        } else if (res.user) {
          const targetRoute = getDashboardForRole(res.user.role);
          navigate(targetRoute);
        } else {
          navigate(role.route);
        }
      }, 400);
    } catch {
      setSubmitting(false);
      setAuthError('A system error occurred. Please try again.');
    }
  };

  // ─── FORGOT PASSWORD HANDLER ────────────────────────────────────────────────
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    const res = authBackend.forgotPassword(forgotEmail);
    setForgotDone(true);
    setForgotMessage(res.message);
  };

  // ─── CITIZEN OTP DISPATCH ───────────────────────────────────────────────────
  const triggerCitizenOTP = () => {
    setOtpState((prev) => ({ ...prev, loading: true, error: undefined }));
    const dest = regData.phone || regData.email;
    const res = authBackend.sendOTP(dest);
    setOtpState({
      dispatched: true,
      simulatedCode: res.simulatedCode,
      loading: false,
    });
  };

  const handleCitizenOTPVerify = async (code: string) => {
    setOtpState((prev) => ({ ...prev, loading: true, error: undefined }));
    const dest = regData.phone || regData.email;
    const verifyRes = authBackend.verifyOTP(dest, code);

    if (!verifyRes.success) {
      setOtpState((prev) => ({ ...prev, loading: false, error: verifyRes.message }));
      return;
    }

    // Complete Registration
    const regRes = await authBackend.registerCitizen({
      name: regData.name,
      email: regData.email,
      phone: regData.phone,
      password: regData.password,
      state: regData.state,
      districtId: regData.districtId,
      block: regData.block,
      village: regData.village,
      pincode: regData.pincode,
      occupation: regData.occupation,
    });

    setOtpState((prev) => ({ ...prev, loading: false }));

    if (regRes.success) {
      setRegSuccess({
        roleLabel: 'Citizen',
        email: regData.email,
      });
      addToast({
        type: 'success',
        title: 'Account Created Successfully',
        message: 'Please log in using your registered credentials.',
      });
    } else {
      setAuthError(regRes.message || 'Registration failed');
    }
  };

  // ─── INSTITUTIONAL REGISTRATION SUBMISSIONS ────────────────────────────────
  const handleInstitutionalSubmit = async () => {
    setSubmitting(true);
    setAuthError(null);

    let res: LoginResult;

    if (activeKey === 'government') {
      res = await authBackend.registerGovernment({
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        officialId: regData.officialId,
        designation: regData.designation,
        department: regData.department,
        ministry: regData.ministry,
        districtId: regData.districtId,
        state: regData.state,
        jurisdiction: regData.jurisdiction,
        idCardDocName: regData.docName,
      });
    } else if (activeKey === 'university') {
      res = await authBackend.registerUniversity({
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        universityName: regData.universityName,
        aisheCode: regData.aisheCode,
        accreditationGrade: regData.accreditationGrade,
        establishedYear: Number(regData.establishedYear) || 1960,
        website: regData.website,
        address: regData.address,
        state: regData.state,
        districtId: regData.districtId,
        domains: regData.domains,
        labFacilities: regData.labFacilities.split(',').map((s: string) => s.trim()).filter(Boolean),
        researchFocus: regData.researchFocus.split(',').map((s: string) => s.trim()).filter(Boolean),
        rAndDCapacityScore: Number(regData.rAndDCapacityScore) || 85,
        authLetterDocName: regData.docName,
      });
    } else if (activeKey === 'faculty') {
      res = await authBackend.registerFaculty({
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        universityId: regData.universityId,
        universityName: regData.universityName,
        employeeId: regData.employeeId,
        designation: regData.designation,
        department: regData.department,
        specializations: regData.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
        publicationsCount: Number(regData.publicationsCount) || 0,
        experienceYears: Number(regData.experienceYears) || 1,
        idCardDocName: regData.docName,
      });
    } else if (activeKey === 'student') {
      res = await authBackend.registerStudent({
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        universityId: regData.universityId,
        universityName: regData.universityName,
        enrollmentNo: regData.enrollmentNo,
        degree: regData.degree,
        department: regData.department,
        yearOfStudy: Number(regData.yearOfStudy) || 1,
        expectedGraduationYear: Number(regData.expectedGraduationYear) || 2027,
        skills: regData.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
        cgpa: Number(regData.cgpa) || 8.0,
        studentIdDocName: regData.docName,
      });
    } else {
      // Industry
      res = await authBackend.registerIndustry({
        name: regData.name,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        companyName: regData.companyName,
        cinOrRegistrationNo: regData.cinOrRegistrationNo,
        sector: regData.sector,
        domains: regData.domains,
        csrBudgetAnnual: Number(regData.csrBudgetAnnual) || 0,
        collaborationInterests: regData.collaborationInterests,
        officialWebsite: regData.website,
        pointOfContactRole: regData.designation,
        companyAddress: regData.address,
        state: regData.state,
        incorporationDocName: regData.docName,
      });
    }

    setSubmitting(false);

    if (res.success) {
      setRegSuccess({
        roleLabel: role.label,
        email: regData.email,
      });
      addToast({
        type: 'success',
        title: 'Account Created Successfully',
        message: 'Please log in using your registered credentials.',
      });
    } else {
      setAuthError(res.message || 'Registration failed');
    }
  };

  const { Icon } = role;
  const verifiedUniversities = db.getVerifiedUniversities();

  // Per-role accent colour for focus rings (hex)
  const focusRingStyle = { '--tw-ring-color': role.ringColor } as React.CSSProperties;

  return (
    <>
      {/* ── Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          ref={dialogRef}
          variants={modalVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >

          {/* ── Portal Identity Header */}
          <div
            className="px-6 pt-6 pb-5"
            style={{ borderBottom: '1px solid', borderColor: 'inherit' }}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Icon + Title block */}
              <div className="flex items-center gap-3.5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeKey}
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.75 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border',
                      role.bg,
                      role.border
                    )}
                  >
                    <Icon size={22} className={role.color} />
                  </motion.div>
                </AnimatePresence>
                <div>
                  <h2
                    id="auth-modal-title"
                    className="text-base font-bold text-slate-900 dark:text-white leading-tight"
                  >
                    {role.label}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug max-w-xs">
                    {role.subtitle}
                  </p>
                </div>
              </div>

              {/* Close + mode switcher */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Login / Register tabs */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleModeSwitch(m)}
                      className={cn(
                        'px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150',
                        mode === m
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      )}
                      aria-pressed={mode === m}
                    >
                      {m === 'login' ? 'Login' : 'Register'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Body */}
          <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">

            {/* Error Banner */}
            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <p>{authError}</p>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                REGISTRATION SUCCESS STATE (REGISTER ≠ LOGIN)
            ════════════════════════════════════════════════════════════════ */}
            {regSuccess && (
              <div className="py-6 px-2 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Account Created Successfully
                  </h3>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-sm mx-auto leading-relaxed">
                    Your {regSuccess.roleLabel} account has been created successfully.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Please log in using your registered email and password to access your dashboard.
                  </p>
                </div>
                <div className="pt-3 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const registeredEmail = regSuccess.email;
                      setRegSuccess(null);
                      setMode('login');
                      setEmail(registeredEmail);
                      setPassword('');
                      setAuthError(null);
                      onModeChange?.('login');
                    }}
                    className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    Continue to Login <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                LOGIN MODE
            ════════════════════════════════════════════════════════════════ */}
            {!regSuccess && mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>

                {/* Email / ID */}
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {role.emailLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={role.emailPlaceholder}
                      autoComplete="username"
                      required
                      style={focusRingStyle}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:border-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      style={focusRingStyle}
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:border-transparent transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotDone(false);
                      setForgotModalOpen(true);
                    }}
                    className="text-xs font-medium hover:underline transition-colors"
                    style={{ color: role.ringColor }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In CTA */}
                <button
                  type="submit"
                  disabled={submitting || done}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200',
                    'flex items-center justify-center gap-2',
                    'disabled:opacity-60 disabled:cursor-not-allowed',
                    'active:scale-[0.98]',
                  )}
                  style={{
                    background: done
                      ? '#16a34a'
                      : `linear-gradient(135deg, ${role.ringColor}e0, ${role.ringColor})`,
                    boxShadow: `0 2px 12px ${role.ringColor}40`,
                  }}
                  aria-busy={submitting}
                >
                  {done ? (
                    <><CheckCircle2 size={16} /> Signed In</>
                  ) : submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                  ) : (
                    <>Sign In <ArrowRight size={15} /></>
                  )}
                </button>

                {/* Switch to register */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('register')}
                    className="font-semibold hover:underline transition-colors"
                    style={{ color: role.ringColor }}
                  >
                    Create Account
                  </button>
                </p>
              </form>
            )}

            {/* ════════════════════════════════════════════════════════════════
                REGISTER MODE (Multi-Step Forms)
            ════════════════════════════════════════════════════════════════ */}
            {!regSuccess && mode === 'register' && (
              <div className="space-y-4">

                {/* Step progress indicator */}
                {activeKey === 'citizen' ? (
                  <StepIndicator
                    currentStep={regStep}
                    steps={[
                      { title: 'Personal Details' },
                      { title: 'Address & Location' },
                      { title: 'Verification' },
                    ]}
                  />
                ) : activeKey === 'university' ? (
                  <StepIndicator
                    currentStep={regStep}
                    steps={[
                      { title: 'Account' },
                      { title: 'Institution' },
                      { title: 'Capabilities' },
                      { title: 'Affiliation' },
                    ]}
                  />
                ) : (
                  <StepIndicator
                    currentStep={regStep}
                    steps={[
                      { title: 'Account' },
                      { title: 'Affiliation' },
                      { title: 'Documents' },
                    ]}
                  />
                )}

                {/* ── STEP 1: Basic Credentials (all roles) ── */}
                {regStep === 1 && (
                  <div className="space-y-3.5">

                    {/* Full name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={regData.name}
                          onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                          placeholder="Your full name"
                          autoComplete="name"
                          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
                        />
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {activeKey === 'government'
                          ? 'Official Government Email'
                          : activeKey === 'university' || activeKey === 'faculty' || activeKey === 'student'
                          ? 'Institutional Email (.ac.in / .edu)'
                          : activeKey === 'industry'
                          ? 'Corporate Business Email'
                          : 'Email Address'}{' '}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={regData.email}
                          onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                          placeholder={
                            activeKey === 'government'
                              ? 'name@jharkhand.gov.in'
                              : activeKey === 'industry'
                              ? 'contact@company.com'
                              : activeKey === 'citizen'
                              ? 'yourname@email.com'
                              : 'official@university.ac.in'
                          }
                          autoComplete="email"
                          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={regData.phone}
                          onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                          placeholder="10-digit mobile number"
                          autoComplete="tel"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Create Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={regData.password}
                          onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                          placeholder="Minimum 8 characters"
                          autoComplete="new-password"
                          className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          aria-label={showPw ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <PasswordStrengthMeter password={regData.password} />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!regData.name.trim() || !regData.email.trim() || !regData.phone.trim() || regData.password.length < 6) {
                          setAuthError('Please fill all required fields. Password must be at least 6 characters.');
                          return;
                        }
                        if (!/^\d{10}$/.test(regData.phone.trim())) {
                          setAuthError('Mobile number must contain exactly 10 digits.');
                          return;
                        }
                        setAuthError(null);
                        setRegStep(2);
                      }}
                      className="w-full mt-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                      style={{ background: `linear-gradient(135deg, ${role.ringColor}e0, ${role.ringColor})` }}
                    >
                      Continue <ArrowRight size={15} />
                    </button>

                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleModeSwitch('login')}
                        className="font-semibold hover:underline"
                        style={{ color: role.ringColor }}
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                )}

                {/* ── STEP 2: Role-Specific Details ── */}
                {regStep === 2 && (
                  <div className="space-y-3.5">

                    {/* CITIZEN — Location */}
                    {activeKey === 'citizen' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">State</label>
                            <input
                              type="text"
                              disabled
                              value={regData.state}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              District <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={regData.districtId}
                              onChange={(e) => setRegData({ ...regData, districtId: e.target.value })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              {DISTRICTS.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Block / Taluka</label>
                            <input
                              type="text"
                              value={regData.block}
                              onChange={(e) => setRegData({ ...regData, block: e.target.value })}
                              placeholder="e.g. Kanke"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Village / Ward</label>
                            <input
                              type="text"
                              value={regData.village}
                              onChange={(e) => setRegData({ ...regData, village: e.target.value })}
                              placeholder="e.g. Arsande"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Occupation</label>
                          <input
                            type="text"
                            value={regData.occupation}
                            onChange={(e) => setRegData({ ...regData, occupation: e.target.value })}
                            placeholder="e.g. Farmer, Teacher, Social Worker"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                      </>
                    )}

                    {/* GOVERNMENT */}
                    {activeKey === 'government' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              Employee / Govt ID <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.officialId}
                              onChange={(e) => setRegData({ ...regData, officialId: e.target.value })}
                              placeholder="e.g. JH-GOV-2022-019"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              Designation <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.designation}
                              onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                              placeholder="e.g. Joint Secretary"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Department / Directorate <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={regData.department}
                            onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                            placeholder="e.g. Dept of Higher & Technical Education"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jurisdiction Level</label>
                            <select
                              value={regData.jurisdiction}
                              onChange={(e) => setRegData({ ...regData, jurisdiction: e.target.value })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value="district">District</option>
                              <option value="state">State</option>
                              <option value="central">Central</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">District Assigned</label>
                            <select
                              value={regData.districtId}
                              onChange={(e) => setRegData({ ...regData, districtId: e.target.value })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              {DISTRICTS.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* UNIVERSITY */}
                    {activeKey === 'university' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Institution / University Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={regData.universityName}
                            onChange={(e) => setRegData({ ...regData, universityName: e.target.value })}
                            placeholder="e.g. Kolhan University Chaibasa"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              AISHE Code <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.aisheCode}
                              onChange={(e) => setRegData({ ...regData, aisheCode: e.target.value })}
                              placeholder="e.g. U-0205"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">NAAC Grade</label>
                            <select
                              value={regData.accreditationGrade}
                              onChange={(e) => setRegData({ ...regData, accreditationGrade: e.target.value })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value="A++">A++</option>
                              <option value="A+">A+</option>
                              <option value="A">A</option>
                              <option value="B++">B++</option>
                              <option value="B+">B+</option>
                              <option value="B">B</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Year of Establishment</label>
                            <input
                              type="number"
                              value={regData.establishedYear}
                              onChange={(e) => setRegData({ ...regData, establishedYear: e.target.value })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Official Website</label>
                            <input
                              type="url"
                              value={regData.website}
                              onChange={(e) => setRegData({ ...regData, website: e.target.value })}
                              placeholder="https://univ.ac.in"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* FACULTY */}
                    {activeKey === 'faculty' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            University / Institute <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={regData.universityId}
                            onChange={(e) => {
                              const found = verifiedUniversities.find((u) => u.id === e.target.value);
                              setRegData({ ...regData, universityId: e.target.value, universityName: found?.name || 'BIT Sindri' });
                            }}
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            {verifiedUniversities.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              Employee ID <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.employeeId}
                              onChange={(e) => setRegData({ ...regData, employeeId: e.target.value })}
                              placeholder="e.g. BIT-FAC-ENV-091"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              Designation <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.designation}
                              onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                              placeholder="Associate Professor"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Department <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={regData.department}
                            onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                            placeholder="e.g. Civil & Environmental Engineering"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Domain Specializations (comma separated)</label>
                          <input
                            type="text"
                            value={regData.specializations}
                            onChange={(e) => setRegData({ ...regData, specializations: e.target.value })}
                            placeholder="Water Quality, IoT Sensing, Soil Remediation"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                      </>
                    )}

                    {/* STUDENT */}
                    {activeKey === 'student' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            University / Institute <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={regData.universityId}
                            onChange={(e) => {
                              const found = verifiedUniversities.find((u) => u.id === e.target.value);
                              setRegData({ ...regData, universityId: e.target.value, universityName: found?.name || 'BIT Sindri' });
                            }}
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            {verifiedUniversities.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              Enrollment / Roll No <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.enrollmentNo}
                              onChange={(e) => setRegData({ ...regData, enrollmentNo: e.target.value })}
                              placeholder="2023-CS-049"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Degree Program</label>
                            <select
                              value={regData.degree}
                              onChange={(e) => setRegData({ ...regData, degree: e.target.value })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value="B.Tech">B.Tech / B.E.</option>
                              <option value="M.Tech">M.Tech / M.E.</option>
                              <option value="MCA">MCA / M.Sc</option>
                              <option value="Ph.D">Ph.D Research</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                            <input
                              type="text"
                              value={regData.department}
                              onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                              placeholder="Computer Science"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Year</label>
                            <select
                              value={regData.yearOfStudy}
                              onChange={(e) => setRegData({ ...regData, yearOfStudy: Number(e.target.value) })}
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                              <option value={1}>1st Year</option>
                              <option value={2}>2nd Year</option>
                              <option value={3}>3rd Year</option>
                              <option value={4}>4th Year / Final</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Skills (comma separated)</label>
                          <input
                            type="text"
                            value={regData.skills}
                            onChange={(e) => setRegData({ ...regData, skills: e.target.value })}
                            placeholder="IoT, Embedded C, Python, Prototyping"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                      </>
                    )}

                    {/* INDUSTRY */}
                    {activeKey === 'industry' && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Company / Organization Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={regData.companyName}
                            onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                            placeholder="e.g. AquaTech Solutions Pvt Ltd"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                              CIN / Registration No <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={regData.cinOrRegistrationNo}
                              onChange={(e) => setRegData({ ...regData, cinOrRegistrationNo: e.target.value })}
                              placeholder="U41000JH2019PTC013245"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Primary Sector</label>
                            <input
                              type="text"
                              value={regData.sector}
                              onChange={(e) => setRegData({ ...regData, sector: e.target.value })}
                              placeholder="Water & Environment"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Representative Title</label>
                            <input
                              type="text"
                              value={regData.designation}
                              onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                              placeholder="Director of CSR / Partnerships"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Annual CSR Budget (INR)</label>
                            <input
                              type="number"
                              value={regData.csrBudgetAnnual}
                              onChange={(e) => setRegData({ ...regData, csrBudgetAnnual: e.target.value })}
                              placeholder="5000000"
                              className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                      >
                        <ArrowLeft size={15} /> Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null);
                          if (activeKey === 'citizen') triggerCitizenOTP();
                          setRegStep(3);
                        }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                        style={{ background: `linear-gradient(135deg, ${role.ringColor}e0, ${role.ringColor})` }}
                      >
                        Continue <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: OTP / Capability Matrix / Document Upload ── */}
                {regStep === 3 && (
                  <div className="space-y-4">
                    {activeKey === 'citizen' ? (
                      /* Citizen OTP Verification */
                      <OTPVerification
                        destination={regData.phone || regData.email}
                        simulatedCode={otpState.simulatedCode}
                        isLoading={otpState.loading}
                        error={otpState.error}
                        onVerify={handleCitizenOTPVerify}
                        onResend={triggerCitizenOTP}
                      />
                    ) : activeKey === 'university' ? (
                      /* University Capability Matrix */
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Primary R&D Domains
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {DOMAINS_LIST.map((dom) => {
                              const checked = regData.domains?.includes(dom.id);
                              return (
                                <label
                                  key={dom.id}
                                  className={cn(
                                    'flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition',
                                    checked
                                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const copy = [...(regData.domains || [])];
                                      if (e.target.checked) { copy.push(dom.id); }
                                      else { const idx = copy.indexOf(dom.id); if (idx > -1) copy.splice(idx, 1); }
                                      setRegData({ ...regData, domains: copy });
                                    }}
                                    className="rounded text-sky-600 focus:ring-sky-500"
                                  />
                                  {dom.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Lab Facilities (comma separated)
                          </label>
                          <textarea
                            rows={2}
                            value={regData.labFacilities}
                            onChange={(e) => setRegData({ ...regData, labFacilities: e.target.value })}
                            placeholder="e.g. Environmental Engineering Lab, IoT Sensor Prototyping Station"
                            className="w-full py-2.5 px-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              R&D Capacity Score
                            </label>
                            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                              {regData.rAndDCapacityScore} / 100
                            </span>
                          </div>
                          <input
                            type="range"
                            min={40}
                            max={100}
                            value={regData.rAndDCapacityScore}
                            onChange={(e) => setRegData({ ...regData, rAndDCapacityScore: e.target.value })}
                            className="w-full accent-sky-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRegStep(2)}
                            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <ArrowLeft size={15} /> Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegStep(4)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
                            style={{ background: `linear-gradient(135deg, ${role.ringColor}e0, ${role.ringColor})` }}
                          >
                            Next: Affiliation <ArrowRight size={15} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Institutional Proof Upload */
                      <div className="space-y-4">
                        <FileUpload
                          label={
                            activeKey === 'government'
                              ? 'Official Government ID / Authorization Scan'
                              : activeKey === 'faculty'
                              ? 'Faculty Institutional ID Card / Employment Letter'
                              : activeKey === 'student'
                              ? 'Student Enrollment ID Card / Fee Receipt'
                              : 'Certificate of Incorporation / MCA Registration'
                          }
                          description="Attach a clear PDF, JPG or PNG scan (max 5 MB) for institutional verification."
                          onFileSelect={(fileName) => setRegData({ ...regData, docName: fileName })}
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRegStep(2)}
                            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5"
                          >
                            <ArrowLeft size={15} /> Back
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={handleInstitutionalSubmit}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
                            style={{ background: `linear-gradient(135deg, ${role.ringColor}e0, ${role.ringColor})` }}
                          >
                            {submitting ? (
                              <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                            ) : (
                              <><ShieldCheck size={15} /> Submit for Verification</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 4: University Affiliation Document ── */}
                {regStep === 4 && activeKey === 'university' && (
                  <div className="space-y-4">
                    <FileUpload
                      label="UGC / AICTE Affiliation Letter or VC Authorization Document"
                      description="Upload a signed and stamped institutional declaration (PDF/Scan, max 5 MB)."
                      onFileSelect={(fileName) => setRegData({ ...regData, docName: fileName })}
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition flex items-center gap-1.5"
                      >
                        <ArrowLeft size={15} /> Back
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleInstitutionalSubmit}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
                        style={{ background: `linear-gradient(135deg, ${role.ringColor}e0, ${role.ringColor})` }}
                      >
                        {submitting ? (
                          <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                        ) : (
                          <><ShieldCheck size={15} /> Submit for Council Verification</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </motion.div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ─────────────────────────────────────────── */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                Password Recovery
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {!forgotDone ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter your registered email address. A password reset link will be sent to your inbox.
                </p>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@organization.com"
                    autoComplete="email"
                    className="w-full py-2.5 pl-9 pr-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="py-2 px-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {forgotMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="w-full py-2.5 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 transition-colors hover:opacity-90"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
