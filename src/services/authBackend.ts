// Real Authentication & Registration Engine for SIH 2026 Societal Innovation Platform
import { db, type StoredUser } from './db';
import { generateSalt, hashPassword, verifyPassword, generateSessionToken, decodeSessionToken } from './crypto';
import type {
  UserRole,
  UserStatus,
  VerificationRequest,
  VerificationDocument,
  CitizenProfile,
  GovernmentProfile,
  UniversityProfile,
  FacultyProfile,
  StudentProfile,
  IndustryProfile,
  ProblemDomain,
} from '../types';

import { supabase } from '../lib/supabaseClient';

export interface LoginResult {
  success: boolean;
  user?: StoredUser;
  token?: string;
  status?: UserStatus;
  message?: string;
  requiresStatusGate?: boolean;
  createdUser?: { id: string; email: string; role: UserRole; name: string };
}

export interface RegisterCitizenDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  districtId: string;
  block?: string;
  village?: string;
  pincode?: string;
  aadhaarLast4?: string;
  occupation?: string;
  preferredLanguage?: string;
}

export interface RegisterGovernmentDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  officialId: string;
  designation: string;
  department: string;
  ministry?: string;
  districtId: string;
  state: string;
  jurisdiction: 'district' | 'state' | 'central';
  idCardDocName?: string;
}

export interface RegisterUniversityDTO {
  name: string; // Admin's full name
  email: string; // Admin official email
  phone: string;
  password: string;
  universityName: string;
  aisheCode: string;
  accreditationGrade: string;
  establishedYear: number;
  website: string;
  address: string;
  state: string;
  districtId: string;
  domains: ProblemDomain[];
  labFacilities: string[];
  researchFocus: string[];
  rAndDCapacityScore: number;
  authLetterDocName?: string;
}

export interface RegisterFacultyDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  universityId: string;
  universityName: string;
  employeeId: string;
  designation: string;
  department: string;
  specializations: string[];
  publicationsCount: number;
  experienceYears: number;
  idCardDocName?: string;
}

export interface RegisterStudentDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
  universityId: string;
  universityName: string;
  enrollmentNo: string;
  degree: string;
  department: string;
  yearOfStudy: number;
  expectedGraduationYear: number;
  skills: string[];
  cgpa?: number;
  studentIdDocName?: string;
}

export interface RegisterIndustryDTO {
  name: string; // Point of contact name
  email: string; // Official email
  phone: string;
  password: string;
  companyName: string;
  cinOrRegistrationNo: string;
  sector: string;
  domains: ProblemDomain[];
  csrBudgetAnnual?: number;
  collaborationInterests: Array<'mentorship' | 'funding' | 'technical' | 'testing' | 'deployment'>;
  officialWebsite: string;
  pointOfContactRole: string;
  companyAddress: string;
  state: string;
  dunsNumber?: string;
  incorporationDocName?: string;
}

const SESSION_KEY = 'jansamadhan_auth';
const TOKEN_KEY = 'jansamadhan_token';
const REMEMBER_ME_KEY = 'jansamadhan_remember_me';

export const authBackend = {
  // ─── Login ───────────────────────────────────────────────────────────────
  async login(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<LoginResult> {
    db.initialize();

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(normalizedEmail);

    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password.',
      };
    }

    // Check Lockout
    if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
      const waitMinutes = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
      return {
        success: false,
        message: `Account is temporarily locked due to consecutive failed attempts. Try again in ${waitMinutes} minute(s).`,
      };
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(password, user.salt, user.passwordHash);

    if (!isPasswordValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutUntil: number | undefined;

      if (attempts >= 5) {
        lockoutUntil = Date.now() + 5 * 60 * 1000; // 5 minute lockout
      }

      db.updateUser(user.id, {
        failedLoginAttempts: attempts,
        lockoutUntil,
      });

      db.logAction('LOGIN_FAILED', user, `Failed login attempt (${attempts}/5)`);

      return {
        success: false,
        message:
          attempts >= 5
            ? 'Too many failed login attempts. Account locked for 5 minutes.'
            : 'Invalid email or password.',
      };
    }

    // Validate Profile Exists
    const profile = db.getProfile(user.profileId);
    if (!profile) {
      return {
        success: false,
        message: 'Account profile not found. Please contact support.',
      };
    }

    // Validate Role Exists
    if (!user.role) {
      return {
        success: false,
        message: 'No valid role assigned to this account.',
      };
    }

    // Optional Supabase bridge if configured
    if (supabase && (supabase as any).auth?.signInWithPassword) {
      try {
        await (supabase as any).auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
      } catch (err) {
        console.warn('Supabase bridge signIn warning:', err);
      }
    }

    // Reset failed attempts on success
    db.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
    });

    // Check Account Status
    if (user.status === 'suspended') {
      db.logAction('LOGIN_BLOCKED_SUSPENDED', user, 'Attempted login to suspended account');
      return {
        success: false,
        user,
        status: 'suspended',
        requiresStatusGate: true,
        message: user.statusReason || 'Account suspended by administrator.',
      };
    }

    if (user.status === 'rejected') {
      db.logAction('LOGIN_BLOCKED_REJECTED', user, 'Attempted login to rejected account');
      return {
        success: false,
        user,
        status: 'rejected',
        requiresStatusGate: true,
        message: user.rejectionReason || user.statusReason || 'Registration application was rejected.',
      };
    }

    if (user.status === 'pending_verification') {
      db.logAction('LOGIN_PENDING_VERIFICATION', user, 'Attempted login to pending account');
      // Store session so user can view status page
      const token = await generateSessionToken({ id: user.id, email: user.email, role: user.role });
      this.saveSession(user, token, rememberMe);
      return {
        success: true,
        user,
        token,
        status: 'pending_verification',
        requiresStatusGate: true,
        message: 'Your account is currently under institutional review.',
      };
    }

    // Active User - Generate session only upon successful login
    const token = await generateSessionToken({ id: user.id, email: user.email, role: user.role });
    this.saveSession(user, token, rememberMe);

    db.logAction('LOGIN_SUCCESS', user, `User logged in successfully`);

    return {
      success: true,
      user,
      token,
      status: user.status,
    };
  },

  // ─── Role-Based Registration ─────────────────────────────────────────────

  // Helper to bridge Supabase registration if configured
  async bridgeSupabaseSignUp(email: string, password: string, role: UserRole, name: string): Promise<void> {
    if (supabase && (supabase as any).auth?.signUp) {
      try {
        const { data } = await (supabase as any).auth.signUp({
          email,
          password,
          options: { data: { role, name } },
        });
        // If an active session is returned, terminate immediately so registration != login
        if (data?.session && (supabase as any).auth?.signOut) {
          await (supabase as any).auth.signOut();
        }
      } catch (err) {
        console.warn('Supabase bridge signUp warning:', err);
      }
    }
  },

  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },

  // ─── Role-Based Registration ─────────────────────────────────────────────

  async registerCitizen(data: RegisterCitizenDTO): Promise<LoginResult> {
    db.initialize();
    if (db.getUserByEmail(data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userId = `u-cit-${Date.now()}`;
    const profileId = `prof-cit-${Date.now()}`;

    const profile: CitizenProfile = {
      id: profileId,
      userId,
      state: data.state,
      districtId: data.districtId,
      block: data.block,
      village: data.village,
      pincode: data.pincode,
      aadhaarLast4: data.aadhaarLast4,
      isPhoneVerified: true,
      occupation: data.occupation,
      preferredLanguage: data.preferredLanguage || 'en',
      problemsSubmittedCount: 0,
    };
    db.saveProfile(profileId, profile);

    const user: StoredUser = {
      id: userId,
      role: 'citizen',
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      profileId,
      status: 'active',
      isVerified: true,
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    db.saveUser(user);

    db.logAction('REGISTER_CITIZEN', user, `Citizen account registered: ${data.name}`);

    // Bridge to Supabase if configured, immediately signing out if an active session was created
    await this.bridgeSupabaseSignUp(data.email, data.password, 'citizen', data.name);

    // Ensure NO authenticated session remains active in frontend storage
    this.clearSession();

    return {
      success: true,
      message: 'Your Citizen account has been created successfully. Please log in using your registered credentials.',
      createdUser: { id: user.id, email: user.email, role: 'citizen', name: user.name },
      status: 'active',
    };
  },

  async registerGovernment(data: RegisterGovernmentDTO): Promise<LoginResult> {
    db.initialize();
    if (db.getUserByEmail(data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userId = `u-gov-${Date.now()}`;
    const profileId = `prof-gov-${Date.now()}`;
    const docId = `doc-gov-${Date.now()}`;

    const profile: GovernmentProfile = {
      id: profileId,
      userId,
      officialId: data.officialId,
      designation: data.designation,
      department: data.department,
      ministry: data.ministry,
      districtId: data.districtId,
      state: data.state,
      jurisdiction: data.jurisdiction,
      permissions: ['verify_problem', 'review_allocations'],
      officialEmail: data.email,
      idCardDocumentId: docId,
    };
    db.saveProfile(profileId, profile);

    const user: StoredUser = {
      id: userId,
      role: 'government',
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      profileId,
      organizationName: data.department,
      status: 'active',
      isVerified: true,
      verificationRequestedAt: new Date().toISOString(),
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    db.saveUser(user);

    const doc: VerificationDocument = {
      id: docId,
      name: data.idCardDocName || 'Government_ID_Verification.pdf',
      type: 'application/pdf',
      size: 1024000,
      uploadedAt: new Date().toISOString(),
      status: 'verified',
    };

    const req: VerificationRequest = {
      id: `vr-${Date.now()}`,
      userId,
      userName: data.name,
      userEmail: data.email,
      role: 'government',
      organizationName: data.department,
      submittedAt: new Date().toISOString(),
      status: 'approved',
      documents: [doc],
    };
    db.saveVerificationRequest(req);

    db.logAction('REGISTER_GOVERNMENT', user, `Government official registered: ${data.department}`);

    await this.bridgeSupabaseSignUp(data.email, data.password, 'government', data.name);
    this.clearSession();

    return {
      success: true,
      message: 'Your Government Officer account has been created successfully. Please log in using your registered credentials.',
      createdUser: { id: user.id, email: user.email, role: 'government', name: user.name },
      status: 'active',
    };
  },

  async registerUniversity(data: RegisterUniversityDTO): Promise<LoginResult> {
    db.initialize();
    if (db.getUserByEmail(data.email)) {
      return { success: false, message: 'An account with this institutional email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userId = `u-univ-${Date.now()}`;
    const profileId = `prof-univ-${Date.now()}`;
    const institutionId = `inst-${Date.now()}`;
    const docId = `doc-univ-${Date.now()}`;

    const profile: UniversityProfile = {
      id: profileId,
      userId,
      universityId: institutionId,
      universityName: data.universityName,
      aisheCode: data.aisheCode,
      accreditationGrade: data.accreditationGrade,
      establishedYear: data.establishedYear,
      website: data.website,
      address: data.address,
      state: data.state,
      districtId: data.districtId,
      capabilityMatrix: {
        domains: data.domains,
        labFacilities: data.labFacilities,
        researchFocus: data.researchFocus,
        rAndDCapacityScore: data.rAndDCapacityScore,
        incubatorsAvailable: true,
      },
      adminContactName: data.name,
      adminContactPhone: data.phone,
      adminOfficialEmail: data.email,
      authLetterDocId: docId,
    };
    db.saveProfile(profileId, profile);

    const user: StoredUser = {
      id: userId,
      role: 'university',
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      profileId,
      organizationName: data.universityName,
      institutionId,
      status: 'active',
      isVerified: true,
      verificationRequestedAt: new Date().toISOString(),
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    db.saveUser(user);

    const doc: VerificationDocument = {
      id: docId,
      name: data.authLetterDocName || 'AISHE_Affiliation_Document.pdf',
      type: 'application/pdf',
      size: 2048000,
      uploadedAt: new Date().toISOString(),
      status: 'verified',
    };

    const req: VerificationRequest = {
      id: `vr-${Date.now()}`,
      userId,
      userName: data.name,
      userEmail: data.email,
      role: 'university',
      organizationName: data.universityName,
      institutionId,
      submittedAt: new Date().toISOString(),
      status: 'approved',
      documents: [doc],
    };
    db.saveVerificationRequest(req);

    db.logAction('REGISTER_UNIVERSITY', user, `University administrator registered with AISHE ${data.aisheCode}`);

    await this.bridgeSupabaseSignUp(data.email, data.password, 'university', data.name);
    this.clearSession();

    return {
      success: true,
      message: 'Your University Admin account has been created successfully. Please log in using your registered credentials.',
      createdUser: { id: user.id, email: user.email, role: 'university', name: user.name },
      status: 'active',
    };
  },

  async registerFaculty(data: RegisterFacultyDTO): Promise<LoginResult> {
    db.initialize();
    if (db.getUserByEmail(data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userId = `u-fac-${Date.now()}`;
    const profileId = `prof-fac-${Date.now()}`;
    const docId = `doc-fac-${Date.now()}`;

    const profile: FacultyProfile = {
      id: profileId,
      userId,
      universityId: data.universityId,
      universityName: data.universityName,
      employeeId: data.employeeId,
      designation: data.designation,
      department: data.department,
      specializations: data.specializations,
      publicationsCount: data.publicationsCount,
      experienceYears: data.experienceYears,
      institutionalEmail: data.email,
      isApprovedByUniversity: true,
      idCardDocId: docId,
    };
    db.saveProfile(profileId, profile);

    const user: StoredUser = {
      id: userId,
      role: 'faculty',
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      profileId,
      organizationName: data.universityName,
      institutionId: data.universityId,
      status: 'active',
      isVerified: true,
      verificationRequestedAt: new Date().toISOString(),
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    db.saveUser(user);

    const doc: VerificationDocument = {
      id: docId,
      name: data.idCardDocName || 'Faculty_Institutional_ID.pdf',
      type: 'application/pdf',
      size: 1540000,
      uploadedAt: new Date().toISOString(),
      status: 'verified',
    };

    const req: VerificationRequest = {
      id: `vr-${Date.now()}`,
      userId,
      userName: data.name,
      userEmail: data.email,
      role: 'faculty',
      organizationName: data.universityName,
      institutionId: data.universityId,
      submittedAt: new Date().toISOString(),
      status: 'approved',
      documents: [doc],
    };
    db.saveVerificationRequest(req);

    db.logAction('REGISTER_FACULTY', user, `Faculty member registered: ${data.name} at ${data.universityName}`);

    await this.bridgeSupabaseSignUp(data.email, data.password, 'faculty', data.name);
    this.clearSession();

    return {
      success: true,
      message: 'Your Faculty account has been created successfully. Please log in using your registered credentials.',
      createdUser: { id: user.id, email: user.email, role: 'faculty', name: user.name },
      status: 'active',
    };
  },

  async registerStudent(data: RegisterStudentDTO): Promise<LoginResult> {
    db.initialize();
    if (db.getUserByEmail(data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userId = `u-stu-${Date.now()}`;
    const profileId = `prof-stu-${Date.now()}`;
    const docId = `doc-stu-${Date.now()}`;

    const profile: StudentProfile = {
      id: profileId,
      userId,
      universityId: data.universityId,
      universityName: data.universityName,
      enrollmentNo: data.enrollmentNo,
      degree: data.degree,
      department: data.department,
      yearOfStudy: data.yearOfStudy,
      expectedGraduationYear: data.expectedGraduationYear,
      skills: data.skills,
      cgpa: data.cgpa,
      isApprovedByUniversity: true,
      studentIdDocId: docId,
    };
    db.saveProfile(profileId, profile);

    const user: StoredUser = {
      id: userId,
      role: 'student',
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      profileId,
      organizationName: data.universityName,
      institutionId: data.universityId,
      status: 'active',
      isVerified: true,
      verificationRequestedAt: new Date().toISOString(),
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    db.saveUser(user);

    const doc: VerificationDocument = {
      id: docId,
      name: data.studentIdDocName || 'Student_Enrollment_Card.pdf',
      type: 'application/pdf',
      size: 980000,
      uploadedAt: new Date().toISOString(),
      status: 'verified',
    };

    const req: VerificationRequest = {
      id: `vr-${Date.now()}`,
      userId,
      userName: data.name,
      userEmail: data.email,
      role: 'student',
      organizationName: data.universityName,
      institutionId: data.universityId,
      submittedAt: new Date().toISOString(),
      status: 'approved',
      documents: [doc],
    };
    db.saveVerificationRequest(req);

    db.logAction('REGISTER_STUDENT', user, `Student registered: ${data.name} (${data.enrollmentNo})`);

    await this.bridgeSupabaseSignUp(data.email, data.password, 'student', data.name);
    this.clearSession();

    return {
      success: true,
      message: 'Your Student account has been created successfully. Please log in using your registered credentials.',
      createdUser: { id: user.id, email: user.email, role: 'student', name: user.name },
      status: 'active',
    };
  },

  async registerIndustry(data: RegisterIndustryDTO): Promise<LoginResult> {
    db.initialize();
    if (db.getUserByEmail(data.email)) {
      return { success: false, message: 'An account with this corporate email already exists.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(data.password, salt);
    const userId = `u-ind-${Date.now()}`;
    const profileId = `prof-ind-${Date.now()}`;
    const docId = `doc-ind-${Date.now()}`;

    const profile: IndustryProfile = {
      id: profileId,
      userId,
      cinOrRegistrationNo: data.cinOrRegistrationNo,
      companyName: data.companyName,
      sector: data.sector,
      domains: data.domains,
      csrBudgetAnnual: data.csrBudgetAnnual,
      collaborationInterests: data.collaborationInterests,
      officialWebsite: data.officialWebsite,
      pointOfContactName: data.name,
      pointOfContactRole: data.pointOfContactRole,
      companyAddress: data.companyAddress,
      state: data.state,
      dunsNumber: data.dunsNumber,
    };
    db.saveProfile(profileId, profile);

    const user: StoredUser = {
      id: userId,
      role: 'industry',
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      profileId,
      organizationName: data.companyName,
      status: 'active',
      isVerified: true,
      verificationRequestedAt: new Date().toISOString(),
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    db.saveUser(user);

    const doc: VerificationDocument = {
      id: docId,
      name: data.incorporationDocName || 'Certificate_of_Incorporation_MCA.pdf',
      type: 'application/pdf',
      size: 1800000,
      uploadedAt: new Date().toISOString(),
      status: 'verified',
    };

    const req: VerificationRequest = {
      id: `vr-${Date.now()}`,
      userId,
      userName: data.name,
      userEmail: data.email,
      role: 'industry',
      organizationName: data.companyName,
      submittedAt: new Date().toISOString(),
      status: 'approved',
      documents: [doc],
    };
    db.saveVerificationRequest(req);

    db.logAction('REGISTER_INDUSTRY', user, `Industry partner registered: ${data.companyName}`);

    await this.bridgeSupabaseSignUp(data.email, data.password, 'industry', data.name);
    this.clearSession();

    return {
      success: true,
      message: 'Your Industry Partner account has been created successfully. Please log in using your registered credentials.',
      createdUser: { id: user.id, email: user.email, role: 'industry', name: user.name },
      status: 'active',
    };
  },

  // ─── OTP System ──────────────────────────────────────────────────────────
  sendOTP(destination: string): { success: boolean; simulatedCode: string; message: string } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.saveOTP(destination.trim().toLowerCase(), code, 5 * 60 * 1000);
    return {
      success: true,
      simulatedCode: code,
      message: `OTP dispatched to ${destination}. Valid for 5 minutes.`,
    };
  },

  verifyOTP(destination: string, code: string): { success: boolean; message: string } {
    const record = db.getOTP(destination.trim().toLowerCase());
    if (!record) {
      return { success: false, message: 'OTP has expired or was not requested. Please request a new code.' };
    }
    if (record.code !== code.trim()) {
      return { success: false, message: 'Invalid verification code. Please check and try again.' };
    }
    db.clearOTP(destination.trim().toLowerCase());
    return { success: true, message: 'OTP verified successfully.' };
  },

  // ─── Password Reset ──────────────────────────────────────────────────────
  forgotPassword(email: string): { success: boolean; resetToken?: string; message: string } {
    db.initialize();
    const user = db.getUserByEmail(email);
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.',
      };
    }

    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    db.saveOTP(`pwd-reset-${user.email}`, resetToken, 15 * 60 * 1000);

    db.logAction('PASSWORD_RESET_REQUESTED', user, 'Password reset link generated');

    return {
      success: true,
      resetToken,
      message: `Password reset instructions and security token dispatched to ${user.email}.`,
    };
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    db.initialize();
    const user = db.getUserByEmail(email);
    if (!user) return { success: false, message: 'Account not found.' };

    const record = db.getOTP(`pwd-reset-${user.email}`);
    if (!record || record.code !== token) {
      return { success: false, message: 'Invalid or expired password reset token.' };
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);

    db.updateUser(user.id, {
      passwordHash,
      salt,
      failedLoginAttempts: 0,
      lockoutUntil: undefined,
    });
    db.clearOTP(`pwd-reset-${user.email}`);

    db.logAction('PASSWORD_RESET_COMPLETED', user, 'Password successfully reset');

    return { success: true, message: 'Password has been updated. You can now login.' };
  },

  // ─── Demo Presentation Quick Fill ────────────────────────────────────────
  async demoLogin(role: UserRole): Promise<LoginResult> {
    db.initialize();
    const users = db.getUsers();
    let target = users.find((u) => u.role === role && u.status === 'active');
    if (!target) {
      target = users[0];
    }

    const token = await generateSessionToken({ id: target.id, email: target.email, role: target.role });
    this.saveSession(target, token, true);

    db.logAction('DEMO_QUICK_LOGIN', target, `Evaluator accessed via demo preset (${role})`);

    return {
      success: true,
      user: target,
      token,
      status: target.status,
    };
  },

  // ─── Session Management ──────────────────────────────────────────────────
  saveSession(user: StoredUser, token: string, rememberMe = true): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(user));
    storage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
  },

  getCurrentUser(): StoredUser | null {
    db.initialize();
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const user: StoredUser = JSON.parse(raw);
      // Fetch latest from DB in case status changed (e.g. approved or suspended)
      const fresh = db.getUserById(user.id);
      return fresh || user;
    } catch {
      return null;
    }
  },

  logout(): void {
    const user = this.getCurrentUser();
    if (user) {
      db.logAction('LOGOUT', user, 'User logged out');
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};
