import type {
  User,
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
  AuditLogEntry,
  Problem,
  Allocation,
  University,
  Notification,
  FacultyMember,
  StudentTeam,
  ProjectAssignment,
  ResearchEntry,
  Prototype,
  CollaborationRequest,
  Task,
  ProblemEcosystem,
  UniversityProjectUpdate,
  WorkspaceTask,
  IndustryCommitment,
  PilotDeploymentRequest,
  FinalGovernmentSubmission,
  ProjectActivityEvent,
  IndustryPartner,
} from '../types';
import { UNIVERSITIES, INDUSTRY_PARTNERS } from '../data/mockData';

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
  phone?: string;
  failedLoginAttempts: number;
  lockoutUntil?: number;
  status: UserStatus;
  isVerified: boolean;
  statusReason?: string;
  rejectionReason?: string;
  organizationName?: string;
  institutionId?: string;
}

const STORAGE_KEYS = {
  USERS: 'jih_users_v2',
  PROFILES: 'jih_profiles_v2',
  VERIFICATIONS: 'jih_verification_requests_v2',
  AUDIT_LOGS: 'jih_audit_logs_v2',
  OTPS: 'jih_otps_v2',
  ACTIVE_SESSION: 'jansamadhan_auth',
  PROBLEMS: 'jih_problems_v2',
  ALLOCATIONS: 'jih_allocations_v2',
  NOTIFICATIONS: 'jih_notifications_v2',
  UNIVERSITIES: 'jih_universities_v2',
  FACULTY: 'jih_faculty_v2',
  STUDENT_TEAMS: 'jih_student_teams_v2',
  PROJECT_ASSIGNMENTS: 'jih_project_assignments_v2',
  RESEARCH_ENTRIES: 'jih_research_entries_v2',
  PROTOTYPES: 'jih_prototypes_v2',
  INDUSTRY_COLLABORATIONS: 'jih_industry_collab_v2',
  TASKS: 'jih_tasks_v2',
  UNIVERSITY_UPDATES: 'jih_univ_updates_v2',
  INDUSTRY_COMMITMENTS: 'jih_industry_commitments_v2',
  PILOT_DEPLOYMENTS: 'jih_pilot_deployments_v2',
  FINAL_SUBMISSIONS: 'jih_final_submissions_v2',
  PROJECT_ACTIVITIES: 'jih_project_activities_v2',
  WORKSPACE_TASKS: 'jih_workspace_tasks_v2',
  INDUSTRY_PARTNERS_KEY: 'jih_industry_partners_v2',
};

// Default pre-computed SHA-256 hash for "Password@123" with salt "jih_default_salt_2026"
// SHA-256("jih_default_salt_2026:Password@123")
// We also compute dynamically if needed.
const DEFAULT_SALT = 'jih_default_salt_2026';
// echo -n "jih_default_salt_2026:Password@123" | sha256sum ->
const DEFAULT_PWD_HASH = 'ca1ce0858b7e06debbfb96b714b9d9d0011e8c5c46942637b9818d0db6327b7f';

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse ${key} from storage:`, e);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to storage:`, e);
  }
}

export const db = {
  // ─── Initialization & Seed Data ──────────────────────────────────────────
  initialize(): void {
    const existing = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existing) {
      this.seedInitialData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROBLEMS)) {
      this.seedProblems();
    } else {
      this.ensureP1028Problem();
    }
    if (!localStorage.getItem(STORAGE_KEYS.UNIVERSITIES)) {
      this.seedUniversities();
    }
    if (!localStorage.getItem(STORAGE_KEYS.FACULTY)) {
      this.seedFaculty();
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENT_TEAMS)) {
      this.seedStudentTeams();
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROJECT_ASSIGNMENTS) || safeGetItem<ProjectAssignment[]>(STORAGE_KEYS.PROJECT_ASSIGNMENTS, []).length === 0) {
      this.seedProjectAssignments();
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESEARCH_ENTRIES)) {
      this.seedResearchEntries();
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROTOTYPES)) {
      this.seedPrototypes();
    }
    if (!localStorage.getItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS)) {
      this.seedIndustryCollaborations();
    } else {
      // Ensure P-1029 does not have premature accepted mock collaboration
      const existingCollabs = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
      const staleIdx = existingCollabs.findIndex(c => (c.problem_id === 'P-1029' || c.projectId === 'P-1029') && c.id === 'ind-p1029');
      if (staleIdx >= 0) {
        existingCollabs.splice(staleIdx, 1);
        safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, existingCollabs);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      this.seedTasks();
    }
    this.ensureEcosystemData();
  },

  seedProblems(): void {
    const initialProblems: Problem[] = [
      {
        id: 'JH-2026-00125',
        problem_id: 'JH-2026-00125',
        title: 'Smart Drinking Water Quality Monitoring for Rural Village',
        description:
          'Our village (Hesag Panchayat) has been facing severe drinking water quality issues for the past 3 years. The hand-pump water is suspected to have high fluoride, arsenic, and coliform bacteria levels. We have no way to regularly test the water locally. Nearest testing lab is 45 km away in Ranchi. Children are falling sick frequently. We need a continuous water quality monitoring solution that can alert villagers in real-time and share data with local administration.',
        domain: 'water',
        category: 'Water & Sanitation',
        subcategory: 'Water Quality Monitoring',
        status: 'Submitted',
        verification_status: 'Pending',
        allocation_status: 'Not Allocated',
        severity: 'critical',
        priority: 'urgent',
        location: 'Ranchi, Jharkhand',
        districtId: 'ranchi',
        district: 'Ranchi',
        state: 'Jharkhand',
        block: 'Kanke',
        village: 'Hesag Panchayat',
        coordinates: { lat: 23.3441, lng: 85.3096 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Priya Kumari',
        citizen_name: 'Priya Kumari',
        affectedPopulation: 1247,
        affected_people: 1247,
        assigned_university: null,
        evidence: ['water-sample-color.jpg', 'health-clinic-report.pdf'],
        submittedAt: '2026-08-15T09:30:00Z',
        created_at: '2026-08-15T09:30:00Z',
        updatedAt: '2026-08-15T09:30:00Z',
        updated_at: '2026-08-15T09:30:00Z',
        tags: ['water-quality', 'fluoride', 'rural', 'health', 'IoT', 'real-time'],
      },
      {
        id: 'P-1025',
        problem_id: 'P-1025',
        title: 'Smart Waste Collection & Recycling Optimization System',
        description:
          'Municipal solid waste overflows along the commercial market hub and residential blocks. Waste collection trucks lack GPS-guided route optimization and fill-level telemetry, leading to hazardous accumulation and blocked drainage. We require an automated waste container fill-monitoring system with route scheduling.',
        domain: 'environment',
        category: 'Waste Management',
        subcategory: 'Solid Waste Routing',
        status: 'Verified',
        verification_status: 'Verified',
        allocation_status: 'Not Allocated',
        severity: 'medium',
        priority: 'high',
        location: 'Jamshedpur, Jharkhand',
        districtId: 'jamshedpur',
        district: 'East Singhbhum',
        state: 'Jharkhand',
        block: 'Golmuri',
        village: 'Sakchi',
        coordinates: { lat: 22.8046, lng: 86.2029 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Amit Soren',
        citizen_name: 'Amit Soren',
        affectedPopulation: 4200,
        affected_people: 4200,
        assigned_university: null,
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-09-01T10:30:00Z',
        verified_at: '2026-09-01T10:30:00Z',
        verificationNotes: 'Ground inspection completed by Ward Sanitation Officer. Confirmed high waste backlog.',
        evidence: ['waste-hub-overflow.jpg'],
        submittedAt: '2026-08-20T11:15:00Z',
        created_at: '2026-08-20T11:15:00Z',
        updatedAt: '2026-09-01T10:30:00Z',
        updated_at: '2026-09-01T10:30:00Z',
        tags: ['waste', 'environment', 'IoT', 'smart-city', 'routing'],
      },
      {
        id: 'P-1026',
        problem_id: 'P-1026',
        title: 'Solar Powered Micro-Cold Storage for Tribal Vegetable Farmers',
        description:
          'Tribal farmers produce seasonal tomato, cauliflower, and greens but experience up to 40% spoilage within 48 hours due to lack of grid power and affordable decentralized cold rooms. We require a 2-5 MT solar-powered micro cold storage unit with thermal energy backup.',
        domain: 'agriculture',
        category: 'Agriculture & Cold Chain',
        subcategory: 'Post-Harvest Solar Cold Storage',
        status: 'Verified',
        verification_status: 'Verified',
        allocation_status: 'Not Allocated',
        severity: 'high',
        priority: 'urgent',
        location: 'Khunti, Jharkhand',
        districtId: 'khunti',
        district: 'Khunti',
        state: 'Jharkhand',
        block: 'Murhu',
        village: 'Torpa',
        coordinates: { lat: 23.0714, lng: 85.28 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Birsa Munda',
        citizen_name: 'Birsa Munda',
        affectedPopulation: 850,
        affected_people: 850,
        assigned_university: null,
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-09-02T14:20:00Z',
        verified_at: '2026-09-02T14:20:00Z',
        verificationNotes: 'Verified via District Agriculture Officer. Urgent requirement for SHG farm clusters.',
        evidence: ['spoiled-produce.jpg'],
        submittedAt: '2026-08-25T14:00:00Z',
        created_at: '2026-08-25T14:00:00Z',
        updatedAt: '2026-09-02T14:20:00Z',
        updated_at: '2026-09-02T14:20:00Z',
        tags: ['agriculture', 'solar', 'cold-storage', 'tribal', 'livelihoods'],
      },
      {
        id: 'P-1027',
        problem_id: 'P-1027',
        title: 'Automated Early Maternal Health Monitoring for Remote Anganwadis',
        description:
          'Remote sub-centers in Dumka lack diagnostic equipment to detect high-risk pregnancies (anemia, pre-eclampsia, gestational diabetes) early. A portable diagnostic kit linked via cellular mesh to district hospitals is urgently needed.',
        domain: 'healthcare',
        category: 'Healthcare & Nutrition',
        subcategory: 'Maternal Health Diagnostic Kit',
        status: 'Submitted',
        verification_status: 'Pending',
        allocation_status: 'Not Allocated',
        severity: 'critical',
        priority: 'urgent',
        location: 'Dumka, Jharkhand',
        districtId: 'dumka',
        district: 'Dumka',
        state: 'Jharkhand',
        block: 'Ranishwar',
        village: 'Kumrabad',
        coordinates: { lat: 24.2667, lng: 87.25 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Sunita Devi',
        citizen_name: 'Sunita Devi',
        affectedPopulation: 1950,
        affected_people: 1950,
        assigned_university: null,
        evidence: ['anganwadi-center.jpg'],
        submittedAt: '2026-09-03T16:45:00Z',
        created_at: '2026-09-03T16:45:00Z',
        updatedAt: '2026-09-03T16:45:00Z',
        updated_at: '2026-09-03T16:45:00Z',
        tags: ['healthcare', 'maternal', 'diagnostic', 'rural', 'nutrition'],
      },
      {
        id: 'P-1028',
        problem_id: 'P-1028',
        title: 'Drainage Problem & Stormwater Overflow Redressal',
        description:
          'The roadside storm drains are clogged and structurally damaged across major arterial junctions in Ranchi. During monsoons, severe stormwater backflow inundates residential colonies and market complexes. We require an engineered drainage redesign with IoT silt-level telemetry and structural overhaul.',
        domain: 'water',
        category: 'Water & Sanitation',
        subcategory: 'Drainage Systems & Flood Prevention',
        status: 'University Accepted',
        verification_status: 'Verified',
        allocation_status: 'Accepted',
        severity: 'high',
        priority: 'high',
        location: 'Ranchi, Jharkhand',
        districtId: 'ranchi',
        district: 'Ranchi',
        state: 'Jharkhand',
        coordinates: { lat: 23.3441, lng: 85.3096 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Priya Kumari',
        citizen_name: 'Priya Kumari',
        affectedPopulation: 14500,
        affected_people: 14500,
        assigned_university: 'univ1',
        assigned_university_name: 'BIT Sindri',
        allocated_by: 'Rajesh Kumar IAS',
        allocated_at: '2026-09-07T10:32:00Z',
        accepted_at: '2026-09-07T10:40:00Z',
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-09-07T10:25:00Z',
        evidence: ['drainage-clog-1.jpg'],
        submittedAt: '2026-09-07T10:10:00Z',
        created_at: '2026-09-07T10:10:00Z',
        updatedAt: '2026-09-07T10:40:00Z',
        updated_at: '2026-09-07T10:40:00Z',
        tags: ['drainage', 'water-sanitation', 'IoT', 'stormwater', 'infrastructure'],
      },
    ];
    safeSetItem(STORAGE_KEYS.PROBLEMS, initialProblems);
  },

  ensureP1028Problem(): void {
    const list = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
    let updated = false;
    if (!list.some(p => p.id === 'P-1028' || p.problem_id === 'P-1028')) {
      list.unshift({
        id: 'P-1028',
        problem_id: 'P-1028',
        title: 'Drainage Problem & Stormwater Overflow Redressal',
        description:
          'The roadside storm drains are clogged and structurally damaged across major arterial junctions in Ranchi. During monsoons, severe stormwater backflow inundates residential colonies and market complexes. We require an engineered drainage redesign with IoT silt-level telemetry and structural overhaul.',
        domain: 'water',
        category: 'Water & Sanitation',
        subcategory: 'Drainage Systems & Flood Prevention',
        status: 'University Accepted',
        verification_status: 'Verified',
        allocation_status: 'Accepted',
        severity: 'high',
        priority: 'high',
        location: 'Ranchi, Jharkhand',
        districtId: 'ranchi',
        district: 'Ranchi',
        state: 'Jharkhand',
        coordinates: { lat: 23.3441, lng: 85.3096 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Priya Kumari',
        citizen_name: 'Priya Kumari',
        affectedPopulation: 14500,
        affected_people: 14500,
        assigned_university: 'univ1',
        assigned_university_name: 'BIT Sindri',
        allocated_by: 'Rajesh Kumar IAS',
        allocated_at: '2026-09-07T10:32:00Z',
        accepted_at: '2026-09-07T10:40:00Z',
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-09-07T10:25:00Z',
        evidence: ['drainage-clog-1.jpg'],
        submittedAt: '2026-09-07T10:10:00Z',
        created_at: '2026-09-07T10:10:00Z',
        updatedAt: '2026-09-07T10:40:00Z',
        updated_at: '2026-09-07T10:40:00Z',
        tags: ['drainage', 'water-sanitation', 'IoT', 'stormwater', 'infrastructure'],
      });
      updated = true;
    }
    if (!list.some(p => p.id === 'P-1014' || p.problem_id === 'P-1014')) {
      list.unshift({
        id: 'P-1014',
        problem_id: 'P-1014',
        title: 'Delayed Detection of Pest Outbreaks in Organic Farming',
        description:
          'Smallholder organic farmers in Ranchi rural belt face severe crop losses due to late detection of pest infestations. Manual scouting is infrequent. We require an AI-driven vision and sensor system for early pest detection and localized alerts.',
        domain: 'agriculture',
        category: 'Agriculture',
        subcategory: 'Pest Detection & Crop Protection',
        status: 'in_progress',
        verification_status: 'Verified',
        allocation_status: 'Accepted',
        severity: 'high',
        priority: 'urgent',
        location: 'Kanke, Ranchi, Jharkhand',
        districtId: 'ranchi',
        district: 'Ranchi',
        state: 'Jharkhand',
        coordinates: { lat: 23.412, lng: 85.321 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Birsa Munda Farmer SHG',
        citizen_name: 'Birsa Munda Farmer SHG',
        affectedPopulation: 3800,
        affected_people: 3800,
        assigned_university: 'univ1',
        assigned_university_name: 'BIT Sindri',
        allocated_by: 'Rajesh Kumar IAS',
        allocated_at: '2026-08-25T10:00:00Z',
        accepted_at: '2026-08-26T11:00:00Z',
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-08-25T10:00:00Z',
        evidence: ['pest-damage-leaves.jpg'],
        submittedAt: '2026-08-20T08:00:00Z',
        created_at: '2026-08-20T08:00:00Z',
        updatedAt: '2026-08-26T11:00:00Z',
        updated_at: '2026-08-26T11:00:00Z',
        tags: ['agriculture', 'pest-detection', 'AI', 'organic-farming', 'IoT'],
      });
      updated = true;
    }
    if (!list.some(p => p.id === 'P-1030' || p.problem_id === 'P-1030')) {
      list.unshift({
        id: 'P-1030',
        problem_id: 'P-1030',
        title: 'Delayed Detection of Pest Outbreaks and Crop Pathogens in Marginal Farms',
        description:
          'Smallholder marginal farmers in Ranchi and surrounding rural blocks experience 30–50% seasonal crop loss due to late detection of fungal pathogens, armyworm, and borer infestations. Manual scouting is infrequent. We require an automated AI-driven vision and sensor system for early pest detection and localized alerts.',
        domain: 'agriculture',
        category: 'Agriculture',
        subcategory: 'Crop Protection / Pest Detection',
        status: 'in_progress',
        verification_status: 'Verified',
        allocation_status: 'Accepted',
        severity: 'high',
        priority: 'urgent',
        location: 'Rajam, Ranchi, Jharkhand',
        districtId: 'ranchi',
        district: 'Ranchi',
        state: 'Jharkhand',
        coordinates: { lat: 23.3441, lng: 85.3096 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Birsa Munda Farmer SHG',
        citizen_name: 'Birsa Munda Farmer SHG',
        affectedPopulation: 7800,
        affected_people: 7800,
        assigned_university: 'univ1',
        assigned_university_name: 'BIT Sindri',
        allocated_by: 'Rajesh Kumar IAS',
        allocated_at: '2026-08-25T10:00:00Z',
        accepted_at: '2026-08-26T11:00:00Z',
        assigned_faculty: 'fac-4',
        assigned_faculty_name: 'Dr. Vinod Mishra',
        assigned_team: 'team-1',
        assigned_team_name: 'Team Innovators-07',
        project_status: 'PROJECT_ACTIVE',
        project_assignment_id: 'asgn-pest-001',
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-08-25T10:00:00Z',
        evidence: ['pest-damage-leaves.jpg'],
        submittedAt: '2026-08-20T08:00:00Z',
        created_at: '2026-08-20T08:00:00Z',
        updatedAt: '2026-08-26T11:00:00Z',
        updated_at: '2026-08-26T11:00:00Z',
        tags: ['agriculture', 'pest-detection', 'AI', 'crop-pathogens', 'IoT'],
      });
      updated = true;
    }
    if (!list.some(p => p.id === 'P-1029' || p.problem_id === 'P-1029')) {
      list.unshift({
        id: 'P-1029',
        problem_id: 'P-1029',
        title: 'Transformer issue in college',
        description:
          'Frequent thermal overloads and oil degradation in the 250kVA step-down distribution transformer cause recurring blackouts across engineering laboratories and workshops. Requires IoT non-invasive current and temperature telemetry with automated overload load-shedding control.',
        domain: 'energy',
        category: 'Energy',
        subcategory: 'Power Distribution & Grid Reliability',
        status: 'in_progress',
        verification_status: 'Verified',
        allocation_status: 'Accepted',
        severity: 'high',
        priority: 'high',
        location: 'Rajam, Ramgarh, Jharkhand',
        districtId: 'ramgarh',
        district: 'Ramgarh',
        state: 'Jharkhand',
        coordinates: { lat: 23.6, lng: 85.5167 },
        citizenId: 'prof-cit-1',
        citizen_id: 'prof-cit-1',
        citizenName: 'Ramesh Mahto (College Admin)',
        citizen_name: 'Ramesh Mahto (College Admin)',
        affectedPopulation: 3500,
        affected_people: 3500,
        assigned_university: 'univ1',
        assigned_university_name: 'BIT Sindri',
        allocated_by: 'Dr. Anita Sharma',
        allocated_at: '2026-09-02T10:00:00Z',
        accepted_at: '2026-09-03T11:00:00Z',
        assigned_faculty: 'fac-4',
        assigned_faculty_name: 'Dr. Vinod Mishra',
        assigned_team: 'team-2',
        assigned_team_name: 'Smart Infrastructure Team',
        project_status: 'PROJECT_ACTIVE',
        project_assignment_id: 'asgn-trans-002',
        verifiedBy: 'Rajesh Kumar IAS',
        verified_by: 'Rajesh Kumar IAS',
        verifiedAt: '2026-09-02T10:00:00Z',
        evidence: ['transformer-overheat.jpg'],
        submittedAt: '2026-08-28T09:00:00Z',
        created_at: '2026-08-28T09:00:00Z',
        updatedAt: '2026-09-03T11:00:00Z',
        updated_at: '2026-09-03T11:00:00Z',
        tags: ['energy', 'transformer', 'grid-reliability', 'IoT', 'thermal'],
      });
      updated = true;
    }
    if (updated) {
      safeSetItem(STORAGE_KEYS.PROBLEMS, list);
    }
  },

  seedUniversities(): void {
    const initialUniversities: University[] = [
      {
        id: 'univ1',
        university_id: 'univ1',
        name: 'BIT Sindri',
        university_name: 'BIT Sindri',
        shortName: 'BIT Sindri',
        type: 'government',
        institution_type: 'Government Technical Institute',
        city: 'Sindri',
        location: 'Sindri, Dhanbad',
        districtId: 'dhanbad',
        district: 'Dhanbad',
        state: 'Jharkhand',
        established: 1949,
        naacGrade: 'A',
        accreditation: 'NAAC A Grade / NBA Accredited',
        domains: ['water', 'environment', 'energy', 'infrastructure'],
        research_areas: [
          'Water Quality Monitoring',
          'Arsenic & Fluoride Remediation',
          'Rural Sanitation',
          'IoT Environmental Sensors',
          'Renewable Energy Systems',
        ],
        departments: [
          'Civil & Environmental Engineering',
          'Chemical Engineering',
          'Computer Applications',
          'Mechanical Engineering',
        ],
        facultyCount: 187,
        faculty_count: 187,
        studentCount: 4200,
        available_faculty: 4,
        available_students: 18,
        previous_projects: 34,
        project_capacity: 5,
        available_duration: '6–8 months',
        verification_status: 'Verified',
        infrastructure: [
          'Hydraulics & Water Resources Lab',
          'Environmental Engineering Testing Lab',
          'AAS Spectrometer Station',
          'IoT Sensor Prototyping Facility',
          'Solar Microgrid Research Station',
        ],
        activeProjects: 12,
        completedProjects: 34,
        contact: { email: 'admin@bitsindri.ac.in', phone: '0326-2350605', website: 'www.bitsindri.ac.in' },
        contact_information: 'Dr. Anita Sharma (+91-326-2350605, admin@bitsindri.ac.in)',
      },
      {
        id: 'univ2',
        university_id: 'univ2',
        name: 'NIT Jamshedpur',
        university_name: 'NIT Jamshedpur',
        shortName: 'NIT JSR',
        type: 'central',
        institution_type: 'National Institute of Technology (INI)',
        city: 'Jamshedpur',
        location: 'Jamshedpur',
        districtId: 'jamshedpur',
        district: 'East Singhbhum',
        state: 'Jharkhand',
        established: 1960,
        naacGrade: 'A+',
        accreditation: 'NAAC A+ Grade / Institute of National Importance',
        domains: ['infrastructure', 'energy', 'water', 'environment', 'agriculture'],
        research_areas: [
          'Water Treatment Technologies',
          'Environmental Geotechnics',
          'Sensor Networks',
          'Automation',
          'Renewable Microgrids',
        ],
        departments: [
          'Civil Engineering',
          'Computer Science & Engineering',
          'Electrical Engineering',
          'Mechanical Engineering',
        ],
        facultyCount: 260,
        faculty_count: 260,
        studentCount: 5400,
        available_faculty: 3,
        available_students: 22,
        previous_projects: 56,
        project_capacity: 6,
        available_duration: '7–9 months',
        verification_status: 'Verified',
        infrastructure: [
          'Advanced Water Testing Facility',
          'GIS & Remote Sensing Lab',
          'Embedded Systems & Robotics Centre',
        ],
        activeProjects: 18,
        completedProjects: 56,
        contact: { email: 'admin@nitjsr.ac.in', phone: '0657-2374000', website: 'www.nitjsr.ac.in' },
        contact_information: 'Dr. R. K. Prasad (+91-657-2374000, admin@nitjsr.ac.in)',
      },
      {
        id: 'univ-iit-dhanbad',
        university_id: 'univ-iit-dhanbad',
        name: 'IIT (ISM) Dhanbad',
        university_name: 'IIT (ISM) Dhanbad',
        shortName: 'IIT Dhanbad',
        type: 'central',
        institution_type: 'Indian Institute of Technology (INI)',
        city: 'Dhanbad',
        location: 'Dhanbad',
        districtId: 'dhanbad',
        district: 'Dhanbad',
        state: 'Jharkhand',
        established: 1926,
        naacGrade: 'A++',
        accreditation: 'NAAC A++ Grade / Institute of National Importance',
        domains: ['water', 'environment', 'energy', 'infrastructure', 'agriculture'],
        research_areas: [
          'Groundwater Hydrogeology',
          'Water Resources Engineering',
          'Environmental Science & Engineering',
          'Sensor Systems',
          'Mine Water Remediation',
        ],
        departments: [
          'Department of Environmental Science & Engineering',
          'Civil Engineering',
          'Computer Science & Engineering',
        ],
        facultyCount: 340,
        faculty_count: 340,
        studentCount: 7800,
        available_faculty: 5,
        available_students: 25,
        previous_projects: 82,
        project_capacity: 8,
        available_duration: '6–9 months',
        verification_status: 'Verified',
        infrastructure: [
          'Central Research Facility (CRF)',
          'Hydrogeology Research Lab',
          'Microbiology & Water Quality Analysis Centre',
          'High Performance Computing Cluster',
        ],
        activeProjects: 24,
        completedProjects: 82,
        contact: { email: 'dean_rnd@iitism.ac.in', phone: '0326-2235001', website: 'www.iitism.ac.in' },
        contact_information: 'Prof. S. Sengupta (+91-326-2235001, dean_rnd@iitism.ac.in)',
      },
      {
        id: 'univ3',
        university_id: 'univ3',
        name: 'Ranchi University',
        university_name: 'Ranchi University',
        shortName: 'RU Ranchi',
        type: 'government',
        institution_type: 'State Public University',
        city: 'Ranchi',
        location: 'Ranchi',
        districtId: 'ranchi',
        district: 'Ranchi',
        state: 'Jharkhand',
        established: 1960,
        naacGrade: 'B+',
        accreditation: 'NAAC B+ Grade',
        domains: ['education', 'healthcare', 'livelihoods', 'agriculture', 'public_services'],
        research_areas: [
          'Public Health & Sanitation',
          'Rural Community Development',
          'Botany & Soil Studies',
          'Tribal Healthcare Support',
        ],
        departments: [
          'Life Sciences',
          'Chemistry',
          'Social Work & Rural Development',
        ],
        facultyCount: 312,
        faculty_count: 312,
        studentCount: 18000,
        available_faculty: 2,
        available_students: 12,
        previous_projects: 22,
        project_capacity: 4,
        available_duration: '8–12 months',
        verification_status: 'Verified',
        infrastructure: ['General Chemistry Lab', 'Public Health Field Testing Unit'],
        activeProjects: 8,
        completedProjects: 22,
        contact: { email: 'admin@ranchiuniversity.ac.in', phone: '0651-2208210', website: 'www.ranchiuniversity.ac.in' },
        contact_information: 'Registrar Office (+91-651-2208210, admin@ranchiuniversity.ac.in)',
      },
      {
        id: 'univ4',
        university_id: 'univ4',
        name: 'XLRI Jamshedpur',
        university_name: 'XLRI Jamshedpur',
        shortName: 'XLRI',
        type: 'deemed',
        institution_type: 'Premier Management Institute',
        city: 'Jamshedpur',
        location: 'Jamshedpur',
        districtId: 'jamshedpur',
        district: 'East Singhbhum',
        state: 'Jharkhand',
        established: 1949,
        naacGrade: 'A++',
        accreditation: 'AACSB / AMBA / NAAC A++',
        domains: ['livelihoods', 'public_services', 'accessibility', 'education'],
        research_areas: [
          'Social Innovation Policy',
          'Rural Livelihoods & Supply Chains',
          'Public Governance Systems',
        ],
        departments: [
          'Social Entrepreneurship Centre',
          'Operations & Supply Chain Management',
        ],
        facultyCount: 95,
        faculty_count: 95,
        studentCount: 1200,
        available_faculty: 2,
        available_students: 8,
        previous_projects: 15,
        project_capacity: 3,
        available_duration: '5–7 months',
        verification_status: 'Verified',
        infrastructure: ['Social Entrepreneurship Incubation Lab', 'Data Analytics Studio'],
        activeProjects: 6,
        completedProjects: 15,
        contact: { email: 'admin@xlri.ac.in', phone: '0657-3983333', website: 'www.xlri.ac.in' },
        contact_information: 'Prof. M. Verma (+91-657-3983333, admin@xlri.ac.in)',
      },
    ];
    safeSetItem(STORAGE_KEYS.UNIVERSITIES, initialUniversities);
  },

  seedFaculty(): void {
    const initialFaculty: FacultyMember[] = [
      {
        faculty_id: 'fac-1',
        id: 'fac-1',
        user_id: 'u-fac-2',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        name: 'Dr. Anita Sharma',
        email: 'anita.sharma@bitsindri.ac.in',
        phone: '+91-98351-24567',
        department: 'Civil Engineering',
        designation: 'Associate Professor',
        specialization: 'Water Resources Engineering',
        expertise: ['Water Quality', 'Hydrology', 'Drainage Systems', 'Environmental Engineering', 'GIS Mapping'],
        research_areas: ['Urban Water Management', 'Smart Water Monitoring', 'Stormwater Drainage Systems', 'Hydrological Modeling'],
        technical_skills: ['Hydraulic Modeling', 'HEC-RAS', 'EPANET', 'GIS / Remote Sensing', 'Water Quality Testing', 'IoT Sensors'],
        domain_expertise: ['Water & Sanitation', 'Infrastructure', 'Environment'],
        years_of_experience: 14,
        qualification: 'Ph.D. in Water Resources Engineering, M.Tech (Civil)',
        current_projects: 1,
        maximum_active_projects: 3,
        current_active_projects: 1,
        availability_status: 'Available',
        preferred_problem_categories: ['Water & Sanitation', 'Infrastructure', 'Smart Cities'],
        preferred_project_types: ['Applied Research', 'Pilot Field Implementation', 'Municipal Redesign'],
        location: 'Sindri, Dhanbad, Jharkhand',
        languages: ['English', 'Hindi'],
        faculty_verification_status: 'Verified',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        faculty_id: 'fac-2',
        id: 'fac-2',
        user_id: 'u-fac-3',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        name: 'Dr. Rahul Kumar',
        email: 'rahul.kumar@bitsindri.ac.in',
        phone: '+91-98351-78901',
        department: 'Environmental Engineering',
        designation: 'Professor',
        specialization: 'Wastewater Treatment & Environmental Engineering',
        expertise: ['Wastewater Treatment', 'Solid Waste', 'Pollution Control', 'Environmental Audits', 'Drainage Assessment'],
        research_areas: ['Industrial Effluent Remediation', 'Urban Drainage Contamination', 'Eco-Filtration'],
        technical_skills: ['Chemical Analysis', 'Bioreactor Design', 'Environmental Auditing', 'Water Sampling'],
        domain_expertise: ['Environment', 'Water & Sanitation'],
        years_of_experience: 18,
        qualification: 'Ph.D. in Environmental Engineering',
        current_projects: 2,
        maximum_active_projects: 3,
        current_active_projects: 2,
        availability_status: 'Available',
        preferred_problem_categories: ['Waste Management', 'Environment', 'Water & Sanitation'],
        preferred_project_types: ['Remediation Pilot', 'Environmental Assessment'],
        location: 'Sindri, Dhanbad, Jharkhand',
        languages: ['English', 'Hindi'],
        faculty_verification_status: 'Verified',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        faculty_id: 'fac-3',
        id: 'fac-3',
        user_id: 'u-fac-4',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        name: 'Dr. Sanjay Sinha',
        email: 'sanjay.sinha@bitsindri.ac.in',
        phone: '+91-98351-34567',
        department: 'Computer Science & Engineering',
        designation: 'Professor',
        specialization: 'IoT & Embedded Sensor Systems',
        expertise: ['IoT Architectures', 'Wireless Sensor Networks', 'Real-time Telemetry', 'Cloud Systems'],
        research_areas: ['Smart City Sensing', 'Edge Computing for Municipal Utilities', 'Water Level Telemetry'],
        technical_skills: ['Python', 'C/C++', 'Embedded Linux', 'MQTT', 'Cloud IoT', 'LoRaWAN'],
        domain_expertise: ['Smart Cities', 'Water & Sanitation', 'Infrastructure'],
        years_of_experience: 16,
        qualification: 'Ph.D. in Computer Science',
        current_projects: 2,
        maximum_active_projects: 3,
        current_active_projects: 2,
        availability_status: 'Available',
        preferred_problem_categories: ['Smart Cities', 'Infrastructure', 'Water & Sanitation'],
        preferred_project_types: ['IoT Telemetry Prototyping'],
        location: 'Sindri, Dhanbad, Jharkhand',
        languages: ['English', 'Hindi'],
        faculty_verification_status: 'Verified',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        faculty_id: 'fac-4',
        id: 'fac-4',
        user_id: 'u-fac-1',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        name: 'Dr. Vinod Mishra',
        email: 'vinod@bitsindri.ac.in',
        phone: '+91-98351-45678',
        department: 'Civil & Environmental Engineering',
        designation: 'Associate Professor',
        specialization: 'Water Quality Modeling & Filtration',
        expertise: ['Water Quality Modeling', 'Filtration Systems', 'IoT Monitoring'],
        research_areas: ['Rural Drinking Water Purification', 'Micro-filtration Units'],
        technical_skills: ['Water Testing', 'CAD Design', 'IoT Sensor Setup'],
        domain_expertise: ['Water & Sanitation', 'Environment'],
        years_of_experience: 14,
        qualification: 'Ph.D. in Civil Engineering',
        current_projects: 1,
        maximum_active_projects: 3,
        current_active_projects: 1,
        availability_status: 'Available',
        preferred_problem_categories: ['Water & Sanitation'],
        preferred_project_types: ['Filtration Prototyping'],
        location: 'Sindri, Dhanbad, Jharkhand',
        languages: ['English', 'Hindi'],
        faculty_verification_status: 'Verified',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        faculty_id: 'fac-5',
        id: 'fac-5',
        user_id: 'u-fac-5',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        name: 'Dr. Manoj Tirkey',
        email: 'manoj.tirkey@bitsindri.ac.in',
        phone: '+91-98351-56789',
        department: 'Mining & Geotechnical Engineering',
        designation: 'Associate Professor',
        specialization: 'Geotechnical Site Exploration',
        expertise: ['Slope Stability', 'Soil Testing', 'Mine Drainage'],
        research_areas: ['Acid Mine Drainage', 'Subsurface Hydrology'],
        technical_skills: ['Soil Mechanics', 'GIS', 'Drilling Core Analysis'],
        domain_expertise: ['Infrastructure', 'Mining'],
        years_of_experience: 12,
        qualification: 'Ph.D. in Geotechnical Engineering',
        current_projects: 3,
        maximum_active_projects: 3,
        current_active_projects: 3,
        availability_status: 'Busy',
        preferred_problem_categories: ['Infrastructure'],
        preferred_project_types: ['Field Geotech'],
        location: 'Sindri, Dhanbad, Jharkhand',
        languages: ['English', 'Hindi'],
        faculty_verification_status: 'Verified',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
    ];
    safeSetItem(STORAGE_KEYS.FACULTY, initialFaculty);
  },

  seedStudentTeams(): void {
    const initialTeams: StudentTeam[] = [
      {
        team_id: 'team-1',
        id: 'team-1',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        team_name: 'Team Innovators-07',
        team_leader_id: 'u-stu-1',
        team_leader_name: 'Arjun Singh',
        team_members: [
          {
            student_id: 'stu-1',
            name: 'Arjun Singh',
            email: 'arjun@student.ac',
            role: 'Team Lead & IoT Architect',
            year: 3,
            department: 'Computer Science & Engineering',
            skills: ['Python', 'IoT Architecture', 'C++', 'System Design'],
          },
          {
            student_id: 'stu-2',
            name: 'Pooja Kumari',
            email: 'pooja@student.ac',
            role: 'Hydraulic Modeling Specialist',
            year: 3,
            department: 'Civil Engineering',
            skills: ['HEC-RAS', 'Hydraulics', 'AutoCAD', 'Surveying'],
          },
          {
            student_id: 'stu-3',
            name: 'Rohit Verma',
            email: 'rohit@student.ac',
            role: 'Frontend & Dashboard Developer',
            year: 3,
            department: 'Computer Science & Engineering',
            skills: ['React', 'TypeScript', 'TailwindCSS', 'REST APIs'],
          },
          {
            student_id: 'stu-4',
            name: 'Sneha Das',
            email: 'sneha@student.ac',
            role: 'Hardware & Sensor Lead',
            year: 3,
            department: 'Electronics & Communication',
            skills: ['Microcontrollers', 'LoRaWAN', 'PCB Design', 'Telemetry'],
          },
        ],
        department: 'Computer Science & Engineering',
        branch: 'CSE & Interdisciplinary',
        year: '3rd Year',
        skills: ['Python', 'React', 'IoT', 'Machine Learning', 'Data Analytics', 'Hydraulics Basics'],
        technical_skills: ['Python', 'React', 'IoT Sensors', 'Machine Learning', 'Data Analytics', 'HEC-RAS'],
        domain_expertise: ['Smart Cities', 'Water Management', 'IoT Monitoring', 'Drainage Systems'],
        projects_completed: 3,
        current_active_projects: 1,
        maximum_active_projects: 2,
        availability_status: 'Available',
        preferred_problem_categories: ['Water & Sanitation', 'Smart Cities', 'Waste Management'],
        preferred_technology: ['IoT Silt Telemetry', 'Municipal Dashboard', 'LoRaWAN'],
        faculty_mentor_id: 'fac-1',
        team_verification_status: 'Verified',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        team_id: 'team-2',
        id: 'team-2',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        team_name: 'Smart Infrastructure Team',
        team_leader_id: 'u-stu-2',
        team_leader_name: 'Pooja Kumari',
        team_members: [
          {
            student_id: 'stu-21',
            name: 'Pooja Kumari',
            email: 'pooja.lead@student.ac',
            role: 'Team Leader & Structural Modeler',
            year: 4,
            department: 'Civil Engineering',
            skills: ['AutoCAD Civil 3D', 'HEC-RAS', 'Hydraulics'],
          },
          {
            student_id: 'stu-22',
            name: 'Vikash Kumar',
            email: 'vikash@student.ac',
            role: 'Geotechnical Analyst',
            year: 4,
            department: 'Civil Engineering',
            skills: ['Soil Testing', 'Structural Drafting'],
          },
          {
            student_id: 'stu-23',
            name: 'Anjali Tirkey',
            email: 'anjali@student.ac',
            role: 'GIS & Elevation Mapper',
            year: 4,
            department: 'Civil Engineering',
            skills: ['QGIS', 'Hydrological Mapping'],
          },
        ],
        department: 'Civil Engineering',
        branch: 'Civil & Water Resources',
        year: '4th Year',
        skills: ['Drainage Design', 'HEC-RAS', 'Civil CAD', 'Surveying', 'GIS Mapping', 'Water Flow Simulation'],
        technical_skills: ['Civil CAD', 'Hydraulic Modeling', 'AutoCAD Civil 3D', 'Surveying', 'GIS'],
        domain_expertise: ['Infrastructure', 'Water & Sanitation', 'Urban Drainage Design'],
        projects_completed: 2,
        current_active_projects: 1,
        maximum_active_projects: 2,
        availability_status: 'Available',
        preferred_problem_categories: ['Infrastructure', 'Water & Sanitation'],
        preferred_technology: ['Civil CAD Modeling', 'Stormwater Flow Simulators'],
        team_verification_status: 'Verified',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        team_id: 'team-3',
        id: 'team-3',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        team_name: 'HydroTech Rovers',
        team_leader_id: 'u-stu-3',
        team_leader_name: 'Karan Mehra',
        team_members: [
          {
            student_id: 'stu-31',
            name: 'Karan Mehra',
            email: 'karan@student.ac',
            role: 'Team Lead',
            year: 3,
            department: 'Electronics & Communication',
            skills: ['LoRaWAN', 'Firmware', 'Solar Inverters'],
          },
        ],
        department: 'Electronics & Communication',
        branch: 'ECE Embedded Devices',
        year: '3rd Year',
        skills: ['LoRaWAN', 'Firmware', 'Solar Inverters', 'Telemetry', 'Ultrasonic Sensors'],
        technical_skills: ['Embedded C', 'Hardware Prototyping', 'Wireless Mesh'],
        domain_expertise: ['IoT Sensing', 'Water Monitoring'],
        projects_completed: 1,
        current_active_projects: 0,
        maximum_active_projects: 2,
        availability_status: 'Available',
        preferred_problem_categories: ['Water & Sanitation', 'Energy'],
        preferred_technology: ['Solar Ultrasonic Nodes'],
        team_verification_status: 'Verified',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
      {
        team_id: 'team-4',
        id: 'team-4',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        team_name: 'Apex Coders',
        team_leader_id: 'u-stu-4',
        team_leader_name: 'Gaurav Roy',
        team_members: [],
        department: 'Computer Science & Engineering',
        branch: 'CSE',
        year: '4th Year',
        skills: ['Full Stack', 'Cloud Architecture'],
        technical_skills: ['React', 'NodeJS', 'MongoDB'],
        domain_expertise: ['Web Services', 'Education'],
        projects_completed: 4,
        current_active_projects: 2,
        maximum_active_projects: 2,
        availability_status: 'Busy',
        preferred_problem_categories: ['Education'],
        preferred_technology: ['Web Platforms'],
        team_verification_status: 'Verified',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-01T10:00:00Z',
      },
    ];
    safeSetItem(STORAGE_KEYS.STUDENT_TEAMS, initialTeams);
  },

  seedProjectAssignments(): void {
    const initialAssignments: ProjectAssignment[] = [
      {
        assignment_id: 'asgn-pest-001',
        id: 'asgn-pest-001',
        problem_id: 'P-1030',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Civil & Interdisciplinary Engineering',
        faculty_expertise: ['IoT Architectures', 'Wireless Sensor Networks', 'Real-time Telemetry'],
        team_id: 'team-1',
        team_name: 'Team Innovators-07',
        team_department: 'Computer Science & Engineering',
        team_leader_name: 'Arjun Singh',
        team_skills: ['Python', 'IoT Architecture', 'C++', 'Machine Learning'],
        assigned_by: 'Rajesh Kumar IAS',
        assigned_at: '2026-08-25T10:00:00Z',
        faculty_match_score: 94,
        team_match_score: 91,
        overall_match_score: 93,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-08-26T11:00:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-08-26T14:30:00Z',
        project_status: 'PROJECT_ACTIVE',
        progress: 86,
        milestones: [
          {
            id: 'm-pest-1',
            title: 'Problem Definition & Agronomic Sensor Requirement Analysis',
            description: 'Field survey with Kanke organic farmers and specification of optical/environmental sensors.',
            due_date: '2026-09-05',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Comprehensive survey report. Sensor specifications meet threshold accuracy requirements.',
          },
          {
            id: 'm-pest-2',
            title: 'Pest Image Dataset Collection & Optical Sensor Prototyping',
            description: 'Collection of 2,400 annotated insect infestation images across vegetable clusters.',
            due_date: '2026-09-15',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'High quality labeling achieved with validation from Birsa Agricultural University.',
          },
          {
            id: 'm-pest-3',
            title: 'AI Computer Vision Model Training & Edge Deployment',
            description: 'YOLOv8 nano model quantization for battery-powered camera traps.',
            due_date: '2026-09-25',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Achieved 92.4% mAP on field test set. Edge inference within 180ms.',
          },
          {
            id: 'm-pest-4',
            title: 'Field Validation with Kanke Farmer SHG & Real-time Alerts',
            description: 'Deploy 5 solar sensor nodes across pilot plots and test SMS alert dispatch.',
            due_date: '2026-10-10',
            status: 'in_progress',
            progress_percentage: 60,
          },
          {
            id: 'm-pest-5',
            title: 'Final System Handover & Municipal Agricultural Dashboard',
            description: 'Integration with District Agriculture Office portal and user manual release.',
            due_date: '2026-10-30',
            status: 'pending',
            progress_percentage: 0,
          },
        ],
        created_at: '2026-08-25T10:00:00Z',
        updated_at: '2026-09-18T16:00:00Z',
      },
      {
        assignment_id: 'asgn-trans-002',
        id: 'asgn-trans-002',
        problem_id: 'P-1029',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Electrical & Electronics Engineering',
        faculty_expertise: ['Power Distribution', 'IoT Telemetry', 'Grid Reliability'],
        team_id: 'team-2',
        team_name: 'Smart Infrastructure Team',
        team_department: 'Electrical / Infrastructure',
        team_leader_name: 'Pooja Kumari',
        team_skills: ['IoT Sensors', 'Thermal Telemetry', 'Circuit Modeling'],
        assigned_by: 'Dr. Anita Sharma',
        assigned_at: '2026-09-02T10:00:00Z',
        faculty_match_score: 95,
        team_match_score: 90,
        overall_match_score: 93,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-09-02T11:30:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-09-03T09:00:00Z',
        project_status: 'PROJECT_ACTIVE',
        progress: 65,
        milestones: [
          {
            id: 'm-trans-1',
            title: 'Campus Transformer Load Audit & Thermal Profiling',
            description: 'Deploy clamp meters and FLIR thermal camera to analyze peak hour heating.',
            due_date: '2026-09-10',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Identified chronic overloads between 11 AM - 3 PM.',
          },
          {
            id: 'm-trans-2',
            title: 'IoT Non-invasive Rogowski Sensor Node Prototyping',
            description: 'Assemble DIN-rail ESP32 telemetry unit with top-oil PT100 probe.',
            due_date: '2026-09-22',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'High measurement accuracy verified against laboratory standards.',
          },
          {
            id: 'm-trans-3',
            title: 'Automated Secondary Feeder Trip Relay Integration',
            description: 'Implement firmware safety trip logic when oil temp > 85°C.',
            due_date: '2026-10-05',
            status: 'in_progress',
            progress_percentage: 60,
          },
          {
            id: 'm-trans-4',
            title: 'JUVNL Grid Protocol Integration & Final Commissioning',
            description: 'Handover live telemetry dashboard to campus maintenance and JUVNL technicians.',
            due_date: '2026-10-25',
            status: 'pending',
            progress_percentage: 0,
          },
        ],
        created_at: '2026-09-02T10:00:00Z',
        updated_at: '2026-09-15T12:00:00Z',
      },
      {
        assignment_id: 'asgn-drain-002',
        id: 'asgn-drain-002',
        problem_id: 'P-1028',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Civil & Interdisciplinary Engineering',
        faculty_expertise: ['Hydrology', 'Drainage Systems', 'HEC-RAS'],
        team_id: 'team-2',
        team_name: 'Smart Infrastructure Team',
        team_department: 'Civil Engineering',
        team_leader_name: 'Pooja Kumari',
        team_skills: ['Drainage Design', 'HEC-RAS', 'Civil CAD', 'GIS Mapping'],
        assigned_by: 'Rajesh Kumar IAS',
        assigned_at: '2026-09-07T10:32:00Z',
        faculty_match_score: 96,
        team_match_score: 92,
        overall_match_score: 94,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-09-07T11:15:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-09-07T14:00:00Z',
        project_status: 'PROJECT_ACTIVE',
        progress: 72,
        milestones: [
          {
            id: 'm-drain-1',
            title: 'Hydrological Survey & Silt Level Mapping',
            description: 'Topographic contour analysis and cross-sectional silt depth measurement of Ranchi arterial drains.',
            due_date: '2026-09-15',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Accurate elevation mapping and flow volume calculation.',
          },
          {
            id: 'm-drain-2',
            title: 'IoT Ultrasonic Telemetry Firmware & Solar Node Assembly',
            description: 'Enclosure prototyping for IP67 ultrasonic water level sensors.',
            due_date: '2026-09-28',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Waterproof enclosure validated under pressure test.',
          },
          {
            id: 'm-drain-3',
            title: 'Municipal Dashboard Integration & Alert Dispatch',
            description: 'Real-time telemetry push to Municipal Corporation cloud dashboard.',
            due_date: '2026-10-15',
            status: 'submitted',
            progress_percentage: 70,
            student_notes: 'REST endpoints wired up and sample telemetry stream live.',
          },
          {
            id: 'm-drain-4',
            title: 'Monsoon Stress-Testing & Culvert Structural Retrofit',
            description: 'Simulated flood stress testing and culvert expansion blueprint.',
            due_date: '2026-11-05',
            status: 'pending',
            progress_percentage: 0,
          },
        ],
        created_at: '2026-09-07T10:32:00Z',
        updated_at: '2026-09-19T11:00:00Z',
      },
      {
        assignment_id: 'asgn-water-003',
        id: 'asgn-water-003',
        problem_id: 'JH-2026-00125',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Civil & Interdisciplinary Engineering',
        faculty_expertise: ['Water Quality', 'IoT Environmental Sensors'],
        team_id: 'team-3',
        team_name: 'HydroTech Rovers',
        team_department: 'Electronics & Communication',
        team_leader_name: 'Karan Mehra',
        team_skills: ['LoRaWAN', 'Firmware', 'Telemetry', 'Ultrasonic Sensors'],
        assigned_by: 'Rajesh Kumar IAS',
        assigned_at: '2026-08-16T10:00:00Z',
        faculty_match_score: 91,
        team_match_score: 88,
        overall_match_score: 90,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-08-17T09:30:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-08-17T11:00:00Z',
        project_status: 'PROJECT_ACTIVE',
        progress: 45,
        milestones: [
          {
            id: 'm-water-1',
            title: 'Chemical Spectrometry & Fluoride Baseline Sampling',
            description: 'Hesag Panchayat handpump baseline testing across 12 borewells.',
            due_date: '2026-09-01',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Confirmed high fluoride in 4 borewells.',
          },
          {
            id: 'm-water-2',
            title: 'Sensor Probe Calibration & LoRaWAN Node Setup',
            description: 'Spectrophotometric optical sensors calibrated with lab standards.',
            due_date: '2026-09-22',
            status: 'in_progress',
            progress_percentage: 50,
          },
          {
            id: 'm-water-3',
            title: 'Village Alert Display & SMS Notification Gateway',
            description: 'Solar e-ink community status board for safe water indication.',
            due_date: '2026-10-15',
            status: 'pending',
            progress_percentage: 0,
          },
          {
            id: 'm-water-4',
            title: 'Field Durability Trial & PHED Department Integration',
            description: '30-day continuous logging and PHED portal API integration.',
            due_date: '2026-11-10',
            status: 'pending',
            progress_percentage: 0,
          },
        ],
        created_at: '2026-08-16T10:00:00Z',
        updated_at: '2026-09-17T14:20:00Z',
      },
      {
        assignment_id: 'asgn-solar-004',
        id: 'asgn-solar-004',
        problem_id: 'P-1026',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Civil & Interdisciplinary Engineering',
        faculty_expertise: ['Renewable Systems', 'Rural Technology'],
        team_id: 'team-1',
        team_name: 'Team Innovators-07',
        team_department: 'Computer Science & Engineering',
        team_leader_name: 'Arjun Singh',
        team_skills: ['Thermal Energy', 'IoT', 'Embedded Systems'],
        assigned_by: 'Rajesh Kumar IAS',
        assigned_at: '2026-08-01T10:00:00Z',
        faculty_match_score: 89,
        team_match_score: 86,
        overall_match_score: 88,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-08-02T10:00:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-08-02T12:00:00Z',
        project_status: 'COMPLETED',
        progress: 100,
        milestones: [
          {
            id: 'm-solar-1',
            title: 'Thermal Capacity Modeling & PV Array Sizing',
            description: 'Sizing solar array and PCM thermal storage for 2 MT capacity.',
            due_date: '2026-08-10',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Sizing verified and certified.',
          },
          {
            id: 'm-solar-2',
            title: 'Insulated Chamber Fabrication & PCM Thermal Storage',
            description: 'Assembly of polyurethane insulated chamber with eutectic plates.',
            due_date: '2026-08-20',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Insulation meets 48-hour thermal hold requirement.',
          },
          {
            id: 'm-solar-3',
            title: 'Microcontroller Temperature Telemetry & Inverter Setup',
            description: 'Dual temperature telemetry and automated solar inverter switching.',
            due_date: '2026-08-30',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Stable telemetry logging via GSM module.',
          },
          {
            id: 'm-solar-4',
            title: 'SHG Commissioning & 30-Day Vegetable Shelf-Life Validation',
            description: 'Field handover to Murhu tribal farmers with 0% produce spoilage over trial period.',
            due_date: '2026-09-10',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Outstanding community impact. Farmers saved ₹45,000 in first 3 weeks.',
          },
        ],
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-09-10T12:00:00Z',
      },
      {
        assignment_id: 'asgn-waste-005',
        id: 'asgn-waste-005',
        problem_id: 'P-1025',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Civil & Interdisciplinary Engineering',
        faculty_expertise: ['Smart Cities', 'Municipal Waste Management'],
        team_id: 'team-4',
        team_name: 'Apex Coders',
        team_department: 'Computer Science & Engineering',
        team_leader_name: 'Gaurav Roy',
        team_skills: ['Full Stack', 'Cloud Architecture', 'Routing Algorithms'],
        assigned_by: 'Rajesh Kumar IAS',
        assigned_at: '2026-09-12T14:00:00Z',
        faculty_match_score: 85,
        team_match_score: 82,
        overall_match_score: 84,
        assignment_type: 'AI Recommended',
        faculty_status: 'Pending',
        team_status: 'Pending',
        project_status: 'WAITING_FOR_FACULTY',
        progress: 0,
        milestones: [
          {
            id: 'm-waste-1',
            title: 'RFID & Ultrasonic Bin Fill-Level Node Design',
            description: 'Battery-optimized ultrasonic fill sensor design for outdoor dumpsters.',
            due_date: '2026-10-15',
            status: 'pending',
            progress_percentage: 0,
          },
          {
            id: 'm-waste-2',
            title: 'Fleet Route Optimization Algorithm & Driver App',
            description: 'Dynamic TSP route recalculation based on threshold bin capacity.',
            due_date: '2026-11-01',
            status: 'pending',
            progress_percentage: 0,
          },
        ],
        created_at: '2026-09-12T14:00:00Z',
        updated_at: '2026-09-12T14:00:00Z',
      },
    ];
    safeSetItem(STORAGE_KEYS.PROJECT_ASSIGNMENTS, initialAssignments);
  },

  seedResearchEntries(): void {
    const initialResearch: ResearchEntry[] = [
      {
        id: 'res-p1030',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        problemTitle: 'Delayed Detection of Pest Outbreaks and Crop Pathogens in Marginal Farms',
        type: 'analysis',
        title: 'Deep Learning Vision Models for In-Field Crop Pest and Pathogen Identification on Low-Power Edge Devices',
        date: '2026-09-01',
        location: 'Rajam & Kanke Organic Vegetable Cluster, Ranchi',
        participants: 45,
        findings: 'Baseline sampling revealed 42% of tomato and brinjal plants showed undetected early blight lesions. Edge quantization of YOLOv8 nano on low-power devices achieved 92.4% mean Average Precision (mAP) with inference latency under 180ms.',
        documents: ['agri-pest-edge-ai-validation.pdf', 'pathogen-spectral-dataset.xlsx'],
        conductedBy: 'Dr. Anita Sharma & Team Innovators-07',
      },
      {
        id: 'res-p1029',
        projectId: 'P-1029',
        problem_id: 'P-1029',
        problemTitle: 'Transformer issue in college',
        type: 'data_collection',
        title: 'Non-Invasive IoT Telemetry & Thermal Stress Modeling for Campus Distribution Transformers',
        date: '2026-09-08',
        location: 'Engineering Workshops Substation, Ramgarh',
        participants: 12,
        findings: 'Thermal imaging logged core casing temperatures exceeding 94°C during peak lab operating windows (11 AM–2 PM). Rogowski current telemetry verified 28% neutral imbalance under uncoordinated phase loads.',
        documents: ['transformer-thermal-audit.pdf', 'load-profile-telemetry.csv'],
        conductedBy: 'Dr. Anita Sharma & Smart Infrastructure Team',
      },
      {
        id: 'res-p1028',
        projectId: 'P-1028',
        problem_id: 'P-1028',
        problemTitle: 'Urban Stormwater Drainage Clogging and Silt Accumulation',
        type: 'site_visit',
        title: 'Acoustic & Ultrasonic Silt Profiling in Urban Stormwater Arteries',
        date: '2026-09-12',
        location: 'Arterial Stormwater Drains, Ranchi City',
        participants: 28,
        findings: 'Subterranean silt beds restrict flow capacity by up to 64% in culverts prior to surface waterlogging. Dual ultrasonic transducers provide millimeter accuracy in silt bed contour mapping.',
        documents: ['ranchi-drain-silt-cross-section.pdf'],
        conductedBy: 'Smart Infrastructure Team',
      },
      {
        id: 'res-jh00125',
        projectId: 'JH-2026-00125',
        problem_id: 'JH-2026-00125',
        problemTitle: 'Smart Drinking Water Quality Monitoring for Rural Village',
        type: 'survey',
        title: 'Spectrophotometric Fluoride and Arsenic Telemetry for Rural Groundwater Handpumps',
        date: '2026-08-28',
        location: 'Hesag Panchayat, Kanke, Ranchi',
        participants: 60,
        findings: '4 of 12 community borewells exceeded the WHO safe fluoride limit (1.5 mg/L), peaking at 3.8 mg/L. Reagent colorimetric optical sensors detect threshold breach in real-time.',
        documents: ['hesag-water-fluoride-lab-report.pdf'],
        conductedBy: 'HydroTech Rovers & Dr. Anita Sharma',
      },
    ];
    safeSetItem(STORAGE_KEYS.RESEARCH_ENTRIES, initialResearch);
  },

  seedPrototypes(): void {
    const initialPrototypes: Prototype[] = [
      {
        id: 'pro-p1030',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        problemTitle: 'Delayed Detection of Pest Outbreaks and Crop Pathogens in Marginal Farms',
        version: 'v2.1',
        title: 'AI Crop Disease & Pest Outbreak Early Warning Camera Trap',
        description: 'Autonomous solar-powered optical camera node with onboard AI edge inference (YOLOv8 nano) and LoRaWAN long-range telemetry. Automatically identifies early blight, armyworms, and aphids, and dispatches localized Hindi SMS alerts to marginal farmers.',
        architecture: 'Solar PV (15W) -> LiFePO4 BMS -> Raspberry Pi Zero 2W + Edge TPU -> Sony IMX708 Optical Trap -> LoRaWAN Node -> Cloud Gateway',
        techStack: ['Python', 'YOLOv8 Nano', 'LoRaWAN', 'Embedded C', 'FastAPI', 'React'],
        readinessScore: 86,
        status: 'field_pilot',
        updatedAt: '2026-09-18T16:00:00Z',
        fieldTestingStatus: 'Deployed in 5 pilot vegetable plots in Kanke cluster. Successfully issued 14 preventative spray warnings with 94.2% accuracy.',
        governmentFeedback: 'Birsa Agricultural University and Dept. of Agriculture validated field pest traps. Recommended expansion to Ramgarh district.',
      },
      {
        id: 'pro-p1029',
        projectId: 'P-1029',
        problem_id: 'P-1029',
        problemTitle: 'Transformer issue in college',
        version: 'v1.4',
        title: 'IoT Smart Transformer Health Monitoring & Overload Auto-Trip System',
        description: 'DIN-rail mounted edge controller with non-invasive Rogowski current sensors and dual PT100 temperature probes. Computes real-time thermal gradient and triggers a fast 24V solid-state secondary trip when safe limits are breached.',
        architecture: 'Rogowski Coils + PT100 RTDs -> Signal Conditioning -> ESP32-S3 DIN-Rail MCU -> 4G GSM MQTT Uplink -> JUVNL Substation Dashboard',
        techStack: ['C++', 'ESP-IDF', 'MQTT', 'FreeRTOS', 'Rogowski Telemetry', 'Next.js'],
        readinessScore: 65,
        status: 'testing',
        updatedAt: '2026-09-15T12:00:00Z',
        fieldTestingStatus: 'Bench tested up to 120% continuous overload simulation. Auto-trip verified at 340ms latency without voltage sag.',
        governmentFeedback: 'JUVNL Technical Innovation Cell reviewed architecture. Field trial approval granted for college substation.',
      },
      {
        id: 'pro-p1028',
        projectId: 'P-1028',
        problem_id: 'P-1028',
        problemTitle: 'Urban Stormwater Drainage Clogging and Silt Accumulation',
        version: 'v1.8',
        title: 'Acoustic Ultrasonic Silt Profiler & Subterranean Drain Flow Telemetry',
        description: 'Submersible IP68 ultrasonic transducer array mounted inside Ranchi municipal stormwater arterial drains to monitor real-time silt bed accumulation and prevent monsoon flash floods.',
        techStack: ['Ultrasonic Transducers', 'LoRaWAN', 'Solar Harvester', 'QGIS', 'React'],
        readinessScore: 72,
        status: 'field_pilot',
        updatedAt: '2026-09-19T11:00:00Z',
        fieldTestingStatus: 'Operating in 3 culverts along Main Road, Ranchi. Telemetered 320mm silt deposit before recent rains.',
        governmentFeedback: 'Ranchi Municipal Corporation deployed desiltation excavator based on system alert.',
      },
      {
        id: 'pro-jh00125',
        projectId: 'JH-2026-00125',
        problem_id: 'JH-2026-00125',
        problemTitle: 'Smart Drinking Water Quality Monitoring for Rural Village',
        version: 'v1.0',
        title: 'AquaGuard Solar Fluoride & Coliform Real-time Water Monitor',
        description: 'Low-cost spectrophotometric optical sensor unit installed directly on community borewell handpumps in Hesag village with automated LED warning alerts.',
        techStack: ['Spectrophotometry', 'Microcontroller', 'LoRaWAN', 'SMS Gateway'],
        readinessScore: 45,
        status: 'development',
        updatedAt: '2026-09-17T14:20:00Z',
        fieldTestingStatus: 'Laboratory prototype calibrated against standard fluoride solutions up to 10 ppm.',
      },
    ];
    safeSetItem(STORAGE_KEYS.PROTOTYPES, initialPrototypes);
  },

  seedIndustryCollaborations(): void {
    const initialCollaborations: CollaborationRequest[] = [
      {
        id: 'ind-p1030',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        project: 'AI Crop Disease & Pest Outbreak Early Warning Camera Trap',
        industryPartnerId: 'partner-agritech-01',
        industryPartner: 'AgriTech Jharkhand Solutions Pvt. Ltd.',
        requestType: ['funding', 'technical', 'testing'],
        status: 'accepted',
        requestedAt: '2026-09-02T10:00:00Z',
        respondedAt: '2026-09-05T14:30:00Z',
        message: 'AgriTech Jharkhand is co-funding pilot manufacturing for 50 camera nodes across Ranchi vegetable clusters and providing field technician support.',
        response: 'Approved ₹3,50,000 co-pilot funding. Our agronomy team will participate in weekly field evaluations starting next Monday.',
      },
      {
        id: 'ind-p1028',
        projectId: 'P-1028',
        problem_id: 'P-1028',
        project: 'Acoustic Ultrasonic Silt Profiler & Subterranean Drain Flow Telemetry',
        industryPartnerId: 'partner-juidco-03',
        industryPartner: 'Jharkhand Urban Infrastructure Development Company (JUIDCO)',
        requestType: ['funding', 'testing'],
        status: 'accepted',
        requestedAt: '2026-09-10T14:00:00Z',
        respondedAt: '2026-09-12T11:30:00Z',
        message: 'Integration with Ranchi Smart City Integrated Command and Control Centre (ICCC).',
        response: 'JUIDCO has approved API gateway integration and provisioned ₹4,00,000 smart city deployment grant.',
      },
      {
        id: 'ind-jh00125',
        projectId: 'JH-2026-00125',
        problem_id: 'JH-2026-00125',
        project: 'AquaGuard Solar Fluoride & Coliform Real-time Water Monitor',
        industryPartnerId: 'partner-aquatech-04',
        industryPartner: 'AquaTech Solutions India',
        requestType: ['technical', 'testing'],
        status: 'accepted',
        requestedAt: '2026-08-25T10:00:00Z',
        respondedAt: '2026-08-27T15:00:00Z',
        message: 'Request for optical reagent supply and mass spectrometry cross-validation.',
        response: 'Supplied reagent test kits and agreed to conduct free secondary water tests at our certified Ranchi lab.',
      },
    ];
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, initialCollaborations);
  },

  seedTasks(): void {
    const initialTasks: Task[] = [
      {
        id: 'task-p1030-1',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        milestoneId: 'm-pest-4',
        title: 'Deploy Edge AI Camera Traps in Kanke Organic Cluster',
        description: 'Install 5 solar-powered camera nodes on 5-acre plots and verify LoRaWAN packet delivery to local gateway.',
        assignedTo: 'stu-1',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-09-25',
        tags: ['Hardware', 'Field Deployment', 'LoRaWAN'],
      },
      {
        id: 'task-p1030-2',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        milestoneId: 'm-pest-2',
        title: 'Fungal Leaf Spot Dataset Annotation',
        description: 'Complete bounding-box labeling on 2,400 field images of brinjal and tomato crops.',
        assignedTo: 'stu-2',
        status: 'completed',
        priority: 'medium',
        dueDate: '2026-09-12',
        completedAt: '2026-09-12T15:00:00Z',
        tags: ['Dataset', 'Machine Learning', 'Labeling'],
      },
      {
        id: 'task-p1030-3',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        milestoneId: 'm-pest-4',
        title: 'Farmer SMS Advisory Gateway Integration',
        description: 'Connect Twilio/Govt SMS gateway API to send Hindi language alerts when pest severity index exceeds 60%.',
        assignedTo: 'stu-3',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-09-28',
        tags: ['Backend', 'SMS Gateway', 'Alerts'],
      },
      {
        id: 'task-p1030-4',
        projectId: 'P-1030',
        problem_id: 'P-1030',
        milestoneId: 'm-pest-3',
        title: 'Power Consumption Optimization for LiFePO4 Solar Node',
        description: 'Configure deep sleep mode on ESP32/Pi Zero to ensure 48-hour continuous runtime under overcast monsoon skies.',
        assignedTo: 'stu-4',
        status: 'completed',
        priority: 'medium',
        dueDate: '2026-09-18',
        completedAt: '2026-09-18T11:00:00Z',
        tags: ['Firmware', 'Power Management'],
      },
    ];
    safeSetItem(STORAGE_KEYS.TASKS, initialTasks);
  },

  ensureEcosystemData(): void {
    // 1. Ensure project assignments link to P-1030 and P-1029
    const assignments = safeGetItem<ProjectAssignment[]>(STORAGE_KEYS.PROJECT_ASSIGNMENTS, []);
    let assignmentsUpdated = false;
    for (const a of assignments) {
      if (a.assignment_id === 'asgn-pest-001' && a.problem_id !== 'P-1030') {
        a.problem_id = 'P-1030';
        assignmentsUpdated = true;
      }
    }
    if (!assignments.some(a => a.problem_id === 'P-1030')) {
      assignments.unshift({
        assignment_id: 'asgn-pest-001',
        id: 'asgn-pest-001',
        problem_id: 'P-1030',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Civil & Interdisciplinary Engineering',
        faculty_expertise: ['IoT Architectures', 'Wireless Sensor Networks', 'Real-time Telemetry'],
        team_id: 'team-1',
        team_name: 'Team Innovators-07',
        team_department: 'Computer Science & Engineering',
        team_leader_name: 'Arjun Singh',
        team_skills: ['Python', 'IoT Architecture', 'C++', 'Machine Learning'],
        assigned_by: 'Rajesh Kumar IAS',
        assigned_at: '2026-08-25T10:00:00Z',
        faculty_match_score: 94,
        team_match_score: 91,
        overall_match_score: 93,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-08-26T11:00:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-08-26T14:30:00Z',
        project_status: 'PROJECT_ACTIVE',
        progress: 86,
        milestones: [
          {
            id: 'm-pest-1',
            title: 'Problem Definition & Agronomic Sensor Requirement Analysis',
            description: 'Field survey with Kanke organic farmers and specification of optical/environmental sensors.',
            due_date: '2026-09-05',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Comprehensive survey report. Sensor specifications meet threshold accuracy requirements.',
          },
          {
            id: 'm-pest-2',
            title: 'Pest Image Dataset Collection & Optical Sensor Prototyping',
            description: 'Collection of 2,400 annotated insect infestation images across vegetable clusters.',
            due_date: '2026-09-15',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'High quality labeling achieved with validation from Birsa Agricultural University.',
          },
          {
            id: 'm-pest-3',
            title: 'AI Computer Vision Model Training & Edge Deployment',
            description: 'YOLOv8 nano model quantization for battery-powered camera traps.',
            due_date: '2026-09-25',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Achieved 92.4% mAP on field test set. Edge inference within 180ms.',
          },
          {
            id: 'm-pest-4',
            title: 'Field Validation with Kanke Farmer SHG & Real-time Alerts',
            description: 'Deploy 5 solar sensor nodes across pilot plots and test SMS alert dispatch.',
            due_date: '2026-10-10',
            status: 'in_progress',
            progress_percentage: 60,
          },
        ],
        created_at: '2026-08-25T10:00:00Z',
        updated_at: '2026-09-18T16:00:00Z',
      });
      assignmentsUpdated = true;
    }
    if (!assignments.some(a => a.problem_id === 'P-1029')) {
      assignments.push({
        assignment_id: 'asgn-trans-002',
        id: 'asgn-trans-002',
        problem_id: 'P-1029',
        university_id: 'univ1',
        university_name: 'BIT Sindri',
        faculty_id: 'fac-1',
        faculty_name: 'Dr. Anita Sharma',
        faculty_email: 'anita.sharma@bitsindri.ac.in',
        faculty_department: 'Electrical & Electronics Engineering',
        faculty_expertise: ['Power Distribution', 'IoT Telemetry', 'Grid Reliability'],
        team_id: 'team-2',
        team_name: 'Smart Infrastructure Team',
        team_department: 'Electrical / Infrastructure',
        team_leader_name: 'Pooja Kumari',
        team_skills: ['IoT Sensors', 'Thermal Telemetry', 'Circuit Modeling'],
        assigned_by: 'Dr. Anita Sharma',
        assigned_at: '2026-09-02T10:00:00Z',
        faculty_match_score: 95,
        team_match_score: 90,
        overall_match_score: 93,
        assignment_type: 'AI Recommended',
        faculty_status: 'Accepted',
        faculty_accepted_at: '2026-09-02T11:30:00Z',
        team_status: 'Accepted',
        team_accepted_at: '2026-09-03T09:00:00Z',
        project_status: 'PROJECT_ACTIVE',
        progress: 65,
        milestones: [
          {
            id: 'm-trans-1',
            title: 'Campus Transformer Load Audit & Thermal Profiling',
            description: 'Deploy clamp meters and FLIR thermal camera to analyze peak hour heating.',
            due_date: '2026-09-10',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'Identified chronic overloads between 11 AM - 3 PM.',
          },
          {
            id: 'm-trans-2',
            title: 'IoT Non-invasive Rogowski Sensor Node Prototyping',
            description: 'Assemble DIN-rail ESP32 telemetry unit with top-oil PT100 probe.',
            due_date: '2026-09-22',
            status: 'approved',
            progress_percentage: 100,
            faculty_remarks: 'High measurement accuracy verified against laboratory standards.',
          },
        ],
        created_at: '2026-09-02T10:00:00Z',
        updated_at: '2026-09-15T12:00:00Z',
      });
      assignmentsUpdated = true;
    }
    if (assignmentsUpdated) {
      safeSetItem(STORAGE_KEYS.PROJECT_ASSIGNMENTS, assignments);
    }

    // 2. Ensure Research Entries
    const research = safeGetItem<ResearchEntry[]>(STORAGE_KEYS.RESEARCH_ENTRIES, []);
    if (!research.some(r => r.problem_id === 'P-1030')) {
      this.seedResearchEntries();
    }

    // 3. Ensure Prototypes
    const prototypes = safeGetItem<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
    if (!prototypes.some(p => p.problem_id === 'P-1030')) {
      this.seedPrototypes();
    }

    // 4. Ensure Industry Collaborations
    const collabs = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    if (!collabs.some(c => c.problem_id === 'P-1030')) {
      this.seedIndustryCollaborations();
    }

    // 5. Ensure Tasks
    const tasks = safeGetItem<Task[]>(STORAGE_KEYS.TASKS, []);
    if (!tasks.some(t => t.problem_id === 'P-1030')) {
      this.seedTasks();
    }
  },

  seedInitialData(): void {
    const users: StoredUser[] = [
      {
        id: 'u-cit-1',
        role: 'citizen',
        name: 'Priya Kumari',
        email: 'priya@example.com',
        phone: '9876543210',
        profileId: 'prof-cit-1',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-gov-1',
        role: 'government',
        name: 'Rajesh Kumar IAS',
        email: 'rajesh@jharkhand.gov',
        phone: '9876543211',
        profileId: 'prof-gov-1',
        organizationName: 'Department of Higher & Technical Education',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-gov-admin-1',
        role: 'government_admin',
        name: 'Amitabh Sen',
        email: 'admin.gov@jharkhand.gov',
        phone: '9876543212',
        profileId: 'prof-gov-admin-1',
        organizationName: 'State Innovation & Technology Council',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-univ-1',
        role: 'university',
        name: 'Dr. Anita Sharma',
        email: 'anita@bitsindri.ac.in',
        phone: '9876543213',
        profileId: 'prof-univ-1',
        institutionId: 'univ1',
        organizationName: 'BIT Sindri',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-fac-1',
        role: 'faculty',
        name: 'Dr. Vinod Mishra',
        email: 'vinod@bitsindri.ac.in',
        phone: '9876543214',
        profileId: 'prof-fac-1',
        institutionId: 'univ1',
        organizationName: 'BIT Sindri',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-fac-2',
        role: 'faculty',
        name: 'Dr. Anita Sharma',
        email: 'anita.sharma@bitsindri.ac.in',
        phone: '9835124567',
        profileId: 'prof-fac-2',
        institutionId: 'univ1',
        organizationName: 'BIT Sindri',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-stu-1',
        role: 'student',
        name: 'Arjun Singh',
        email: 'arjun@student.ac',
        phone: '9876543215',
        profileId: 'prof-stu-1',
        institutionId: 'univ1',
        organizationName: 'BIT Sindri',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-stu-2',
        role: 'student',
        name: 'Pooja Kumari',
        email: 'pooja@student.ac',
        phone: '9876543217',
        profileId: 'prof-stu-2',
        institutionId: 'univ1',
        organizationName: 'BIT Sindri',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-ind-1',
        role: 'industry',
        name: 'Meera Patel',
        email: 'meera@aquatech.com',
        phone: '9876543216',
        profileId: 'prof-ind-1',
        organizationName: 'AquaTech Solutions Pvt Ltd',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'u-super-1',
        role: 'super_admin',
        name: 'Super Administrator',
        email: 'superadmin@jharkhand.gov',
        phone: '9876543299',
        profileId: 'prof-super-1',
        organizationName: 'Jharkhand Innovation Hub State Command',
        status: 'active',
        isVerified: true,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-01T10:00:00Z',
      },
      // Pending verification test account
      {
        id: 'u-pending-univ',
        role: 'university',
        name: 'Dr. Ramesh Soren (Registrar)',
        email: 'pending.univ@kolhan.ac.in',
        phone: '9876543220',
        profileId: 'prof-pending-univ',
        institutionId: 'univ-kolhan',
        organizationName: 'Kolhan University Chaibasa',
        status: 'pending_verification',
        isVerified: false,
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-09-01T12:00:00Z',
        verificationRequestedAt: '2026-09-01T12:00:00Z',
      },
      // Rejected account test account
      {
        id: 'u-rejected-fac',
        role: 'faculty',
        name: 'Alok Verma',
        email: 'rejected.fac@example.com',
        phone: '9876543221',
        profileId: 'prof-rejected-fac',
        organizationName: 'Independent Technical Institute',
        status: 'rejected',
        isVerified: false,
        statusReason: 'Employee identity document could not be validated against university registry records.',
        rejectionReason: 'Employee identity document could not be validated against university registry records.',
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-09-02T14:30:00Z',
      },
      // Suspended account test account
      {
        id: 'u-suspended-user',
        role: 'citizen',
        name: 'Rohan Sharma',
        email: 'suspended.user@example.com',
        phone: '9876543222',
        profileId: 'prof-suspended-cit',
        status: 'suspended',
        isVerified: true,
        statusReason: 'Account suspended following administrative review regarding inappropriate submission content.',
        passwordHash: DEFAULT_PWD_HASH,
        salt: DEFAULT_SALT,
        failedLoginAttempts: 0,
        createdAt: '2026-08-15T09:00:00Z',
      },
    ];

    const profiles: Record<string, any> = {
      'prof-cit-1': {
        id: 'prof-cit-1',
        userId: 'u-cit-1',
        state: 'Jharkhand',
        districtId: 'ranchi',
        block: 'Kanke',
        village: 'Arsande',
        pincode: '834006',
        aadhaarLast4: '4821',
        isPhoneVerified: true,
        occupation: 'Community Worker / Social Activist',
        preferredLanguage: 'hi',
        problemsSubmittedCount: 3,
      } as CitizenProfile,
      'prof-gov-1': {
        id: 'prof-gov-1',
        userId: 'u-gov-1',
        officialId: 'JH-GOV-2018-091',
        designation: 'Special Secretary (Technical Education)',
        department: 'Higher & Technical Education',
        ministry: 'Government of Jharkhand',
        districtId: 'ranchi',
        state: 'Jharkhand',
        jurisdiction: 'state',
        permissions: ['verify_problem', 'allocate_university', 'approve_budget', 'view_all'],
        officialEmail: 'rajesh@jharkhand.gov',
      } as GovernmentProfile,
      'prof-univ-1': {
        id: 'prof-univ-1',
        userId: 'u-univ-1',
        universityId: 'univ1',
        universityName: 'BIT Sindri',
        aisheCode: 'U-0205',
        accreditationGrade: 'A',
        establishedYear: 1949,
        website: 'https://www.bitsindri.ac.in',
        address: 'Sindri, Dhanbad, Jharkhand - 828123',
        state: 'Jharkhand',
        districtId: 'dhanbad',
        capabilityMatrix: {
          domains: ['water', 'environment', 'energy', 'infrastructure'],
          labFacilities: ['Environmental Engineering Lab', 'Hydraulics & Water Resources Lab', 'Renewable Energy R&D Center', 'IoT Sensor Prototyping Facility'],
          researchFocus: ['Arsenic & Fluoride Water Remediation', 'Low-cost Rural Filtration', 'Solar Microgrid Systems'],
          rAndDCapacityScore: 92,
          patentsCount: 14,
          incubatorsAvailable: true,
          specializedEquipment: ['AAS Spectrometer', 'Gas Chromatography', '3D Prototyping Station'],
        },
        adminContactName: 'Dr. Anita Sharma',
        adminContactPhone: '+91-326-2350605',
        adminOfficialEmail: 'anita@bitsindri.ac.in',
      } as UniversityProfile,
      'prof-fac-1': {
        id: 'prof-fac-1',
        userId: 'u-fac-1',
        universityId: 'univ1',
        universityName: 'BIT Sindri',
        employeeId: 'BIT-FAC-ENV-042',
        designation: 'Associate Professor & Head of Environmental Tech',
        department: 'Civil & Environmental Engineering',
        specializations: ['Water Quality Modeling', 'Filtration Systems', 'IoT Monitoring'],
        publicationsCount: 28,
        experienceYears: 14,
        institutionalEmail: 'vinod@bitsindri.ac.in',
        isApprovedByUniversity: true,
      } as FacultyProfile,
      'prof-stu-1': {
        id: 'prof-stu-1',
        userId: 'u-stu-1',
        universityId: 'univ1',
        universityName: 'BIT Sindri',
        enrollmentNo: '2023-CS-049',
        degree: 'B.Tech',
        department: 'Computer Science & Engineering',
        yearOfStudy: 3,
        expectedGraduationYear: 2027,
        skills: ['Embedded C', 'IoT Architecture', 'Python', 'React', 'Data Analysis'],
        cgpa: 8.9,
        isApprovedByUniversity: true,
      } as StudentProfile,
      'prof-ind-1': {
        id: 'prof-ind-1',
        userId: 'u-ind-1',
        cinOrRegistrationNo: 'U41000JH2019PTC013245',
        companyName: 'AquaTech Solutions Pvt Ltd',
        sector: 'Water & Environmental Engineering',
        domains: ['water', 'sanitation', 'environment'],
        csrBudgetAnnual: 5000000,
        collaborationInterests: ['mentorship', 'funding', 'testing', 'deployment'],
        officialWebsite: 'https://aquatech-solutions.in',
        pointOfContactName: 'Meera Patel',
        pointOfContactRole: 'Director of Corporate Partnerships & CSR',
        companyAddress: 'Plot 42, Industrial Area, Namkum, Ranchi, Jharkhand',
        state: 'Jharkhand',
        dunsNumber: '91-827-4632',
      } as IndustryProfile,
    };

    const verifications: VerificationRequest[] = [
      {
        id: 'vr-pending-1',
        userId: 'u-pending-univ',
        userName: 'Dr. Ramesh Soren (Registrar)',
        userEmail: 'pending.univ@kolhan.ac.in',
        role: 'university',
        organizationName: 'Kolhan University Chaibasa',
        institutionId: 'univ-kolhan',
        submittedAt: '2026-09-01T12:00:00Z',
        status: 'pending',
        documents: [
          {
            id: 'doc-1',
            name: 'AISHE_Certificate_Kolhan_Univ.pdf',
            type: 'application/pdf',
            size: 1420000,
            uploadedAt: '2026-09-01T11:50:00Z',
            status: 'pending',
          },
          {
            id: 'doc-2',
            name: 'VC_Authorization_Letter.pdf',
            type: 'application/pdf',
            size: 890000,
            uploadedAt: '2026-09-01T11:55:00Z',
            status: 'pending',
          },
        ],
      },
      {
        id: 'vr-rejected-1',
        userId: 'u-rejected-fac',
        userName: 'Alok Verma',
        userEmail: 'rejected.fac@example.com',
        role: 'faculty',
        organizationName: 'Independent Technical Institute',
        submittedAt: '2026-09-02T14:30:00Z',
        status: 'rejected',
        rejectionReason: 'Employee identity document could not be validated against university registry records.',
        reviewedBy: 'Rajesh Kumar IAS',
        reviewedAt: '2026-09-03T10:15:00Z',
        documents: [
          {
            id: 'doc-rej-1',
            name: 'Faculty_ID_Scan.jpg',
            type: 'image/jpeg',
            size: 450000,
            uploadedAt: '2026-09-02T14:28:00Z',
            status: 'rejected',
          },
        ],
      },
    ];

    const auditLogs: AuditLogEntry[] = [
      {
        id: 'audit-001',
        timestamp: '2026-08-01T10:00:00Z',
        action: 'SYSTEM_INITIALIZATION',
        userId: 'u-super-1',
        userEmail: 'superadmin@jharkhand.gov',
        role: 'super_admin',
        details: 'Initial system RBAC database seeded with institutional roles and verified credentials.',
      },
    ];

    safeSetItem(STORAGE_KEYS.USERS, users);
    safeSetItem(STORAGE_KEYS.PROFILES, profiles);
    safeSetItem(STORAGE_KEYS.VERIFICATIONS, verifications);
    safeSetItem(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  },

  // ─── User CRUD ───────────────────────────────────────────────────────────
  getUsers(): StoredUser[] {
    this.initialize();
    return safeGetItem<StoredUser[]>(STORAGE_KEYS.USERS, []);
  },

  getUserById(id: string): StoredUser | null {
    const users = this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  getUserByEmail(email: string): StoredUser | null {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  saveUser(user: StoredUser): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    safeSetItem(STORAGE_KEYS.USERS, users);
  },

  updateUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    safeSetItem(STORAGE_KEYS.USERS, users);
    return users[index];
  },

  // ─── Profiles ────────────────────────────────────────────────────────────
  getProfiles(): Record<string, any> {
    return safeGetItem<Record<string, any>>(STORAGE_KEYS.PROFILES, {});
  },

  getProfile<T = any>(profileId: string): T | null {
    const profiles = this.getProfiles();
    return (profiles[profileId] as T) || null;
  },

  saveProfile(profileId: string, data: any): void {
    const profiles = this.getProfiles();
    profiles[profileId] = data;
    safeSetItem(STORAGE_KEYS.PROFILES, profiles);
  },

  // ─── Verification Requests ───────────────────────────────────────────────
  getVerificationRequests(): VerificationRequest[] {
    return safeGetItem<VerificationRequest[]>(STORAGE_KEYS.VERIFICATIONS, []);
  },

  getVerificationRequestById(id: string): VerificationRequest | null {
    const reqs = this.getVerificationRequests();
    return reqs.find((r) => r.id === id) || null;
  },

  getVerificationRequestByUserId(userId: string): VerificationRequest | null {
    const reqs = this.getVerificationRequests();
    return reqs.find((r) => r.userId === userId) || null;
  },

  saveVerificationRequest(req: VerificationRequest): void {
    const reqs = this.getVerificationRequests();
    const idx = reqs.findIndex((r) => r.id === req.id);
    if (idx >= 0) {
      reqs[idx] = req;
    } else {
      reqs.unshift(req);
    }
    safeSetItem(STORAGE_KEYS.VERIFICATIONS, reqs);
  },

  updateVerificationRequest(id: string, updates: Partial<VerificationRequest>): VerificationRequest | null {
    const reqs = this.getVerificationRequests();
    const idx = reqs.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    reqs[idx] = { ...reqs[idx], ...updates };
    safeSetItem(STORAGE_KEYS.VERIFICATIONS, reqs);
    return reqs[idx];
  },

  // ─── Verified Universities Lookup ────────────────────────────────────────
  getVerifiedUniversities(): Array<{ id: string; name: string }> {
    // Return verified universities from mockData + dynamically registered universities
    const list = UNIVERSITIES.map((u) => ({ id: u.id, name: u.name }));
    const registeredUnivs = this.getUsers().filter(
      (u) => (u.role === 'university' || u.role === 'university_admin') && u.status === 'active' && u.organizationName
    );
    for (const u of registeredUnivs) {
      if (!list.some((existing) => existing.name.toLowerCase() === u.organizationName?.toLowerCase())) {
        list.push({ id: u.institutionId || u.id, name: u.organizationName! });
      }
    }
    return list;
  },

  // ─── Audit Logs ──────────────────────────────────────────────────────────
  getAuditLogs(): AuditLogEntry[] {
    return safeGetItem<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  logAction(
    action: string,
    user: { id: string; email: string; role: UserRole | string; name?: string },
    details: string,
    metadata?: Record<string, any>
  ): void {
    const logs = this.getAuditLogs();
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      audit_id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      userId: user.id,
      userEmail: user.email,
      role: (user.role as UserRole) || 'government',
      actor_id: user.id,
      actor_role: user.role,
      performedBy: user.name || user.email,
      details,
      problem_id: metadata?.problem_id || metadata?.problemId,
      previous_status: metadata?.previous_status || metadata?.previousStatus,
      new_status: metadata?.new_status || metadata?.newStatus,
      metadata,
    };
    logs.unshift(entry);
    safeSetItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500)); // Cap to 500 entries
  },

  // ─── Problem CRUD ────────────────────────────────────────────────────────
  getProblems(filters?: {
    domain?: string;
    status?: string;
    verification_status?: string;
    allocation_status?: string;
    search?: string;
  }): Problem[] {
    this.initialize();
    let problems = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
    if (filters?.domain) {
      problems = problems.filter((p) => p.domain === filters.domain);
    }
    if (filters?.status) {
      problems = problems.filter((p) => p.status.toLowerCase() === filters.status!.toLowerCase());
    }
    if (filters?.verification_status) {
      problems = problems.filter((p) => p.verification_status === filters.verification_status);
    }
    if (filters?.allocation_status) {
      problems = problems.filter((p) => p.allocation_status === filters.allocation_status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      problems = problems.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.problem_id && p.problem_id.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.citizenName?.toLowerCase().includes(q) ||
          p.subcategory?.toLowerCase().includes(q)
      );
    }
    return problems;
  },

  getProblemById(id: string): Problem | null {
    this.initialize();
    const problems = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
    return problems.find((p) => p.id === id || p.problem_id === id) || null;
  },

  createProblem(problem: Problem): Problem {
    this.initialize();
    const problems = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
    const existsIdx = problems.findIndex((p) => p.id === problem.id);
    if (existsIdx >= 0) {
      problems[existsIdx] = problem;
    } else {
      problems.unshift(problem);
    }
    safeSetItem(STORAGE_KEYS.PROBLEMS, problems);
    return problem;
  },

  updateProblem(id: string, updates: Partial<Problem>): Problem | null {
    this.initialize();
    const problems = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
    const idx = problems.findIndex((p) => p.id === id || p.problem_id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    problems[idx] = {
      ...problems[idx],
      ...updates,
      updatedAt: now,
      updated_at: now,
    };
    safeSetItem(STORAGE_KEYS.PROBLEMS, problems);
    return problems[idx];
  },

  deleteProblem(id: string): boolean {
    this.initialize();
    const problems = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
    const filtered = problems.filter((p) => p.id !== id && p.problem_id !== id);
    if (filtered.length === problems.length) return false;
    safeSetItem(STORAGE_KEYS.PROBLEMS, filtered);
    return true;
  },

  // ─── University CRUD ─────────────────────────────────────────────────────
  getUniversities(): University[] {
    this.initialize();
    const list = safeGetItem<University[]>(STORAGE_KEYS.UNIVERSITIES, []);
    // Also merge in dynamically registered active universities
    const registeredUsers = this.getUsers().filter(
      (u) => (u.role === 'university' || u.role === 'university_admin') && u.status === 'active' && u.organizationName
    );
    for (const u of registeredUsers) {
      if (!list.some((existing) => existing.name.toLowerCase() === u.organizationName?.toLowerCase())) {
        list.push({
          id: u.institutionId || u.id,
          university_id: u.institutionId || u.id,
          name: u.organizationName!,
          university_name: u.organizationName!,
          shortName: u.organizationName!,
          type: 'government',
          institution_type: 'Accredited Higher Education Institution',
          city: 'Jharkhand',
          districtId: 'ranchi',
          district: 'Ranchi',
          state: 'Jharkhand',
          established: 2000,
          naacGrade: 'A',
          accreditation: 'Approved',
          domains: ['water', 'environment', 'infrastructure', 'agriculture'],
          research_areas: ['Applied Sciences', 'Community Innovations'],
          departments: ['Science & Technology'],
          facultyCount: 50,
          faculty_count: 50,
          studentCount: 1500,
          available_faculty: 3,
          available_students: 15,
          previous_projects: 10,
          project_capacity: 4,
          available_duration: '6–10 months',
          verification_status: 'Verified',
          activeProjects: 2,
          completedProjects: 8,
          contact: { email: u.email, phone: u.phone || '', website: '' },
          contact_information: `${u.name} (${u.email})`,
        });
      }
    }
    return list;
  },

  getUniversityById(id: string): University | null {
    const list = this.getUniversities();
    return list.find((u) => u.id === id || u.university_id === id) || null;
  },

  // ─── Allocation CRUD ─────────────────────────────────────────────────────
  getAllocations(): Allocation[] {
    this.initialize();
    return safeGetItem<Allocation[]>(STORAGE_KEYS.ALLOCATIONS, []);
  },

  getAllocationById(id: string): Allocation | null {
    return this.getAllocations().find((a) => a.id === id || a.allocation_id === id) || null;
  },

  getAllocationByProblemId(problemId: string): Allocation | null {
    return this.getAllocations().find((a) => a.problemId === problemId || a.problem_id === problemId) || null;
  },

  createAllocation(allocation: Allocation): Allocation {
    this.initialize();
    const allocations = this.getAllocations();
    const idx = allocations.findIndex((a) => a.id === allocation.id || a.problemId === allocation.problemId);
    if (idx >= 0) {
      allocations[idx] = allocation;
    } else {
      allocations.unshift(allocation);
    }
    safeSetItem(STORAGE_KEYS.ALLOCATIONS, allocations);
    return allocation;
  },

  updateAllocation(id: string, updates: Partial<Allocation>): Allocation | null {
    this.initialize();
    const allocations = this.getAllocations();
    const idx = allocations.findIndex((a) => a.id === id || a.allocation_id === id || a.problemId === id);
    if (idx === -1) return null;
    allocations[idx] = { ...allocations[idx], ...updates };
    safeSetItem(STORAGE_KEYS.ALLOCATIONS, allocations);
    return allocations[idx];
  },

  // ─── Notifications CRUD ──────────────────────────────────────────────────
  getNotifications(userId?: string): Notification[] {
    this.initialize();
    const notifs = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (userId) {
      return notifs.filter((n) => n.userId === userId || n.userId === 'all');
    }
    return notifs;
  },

  createNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'> & { id?: string }): Notification {
    this.initialize();
    const notifs = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const entry: Notification = {
      ...n,
      id: n.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    notifs.unshift(entry);
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 500));
    return entry;
  },

  markNotificationRead(id: string): void {
    this.initialize();
    const notifs = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx >= 0) {
      notifs[idx].read = true;
      safeSetItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },

  markAllNotificationsRead(userId?: string): void {
    this.initialize();
    let notifs = safeGetItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs = notifs.map((n) => (!userId || n.userId === userId ? { ...n, read: true } : n));
    safeSetItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // ─── Faculty CRUD ────────────────────────────────────────────────────────
  getFaculty(universityId?: string): FacultyMember[] {
    this.initialize();
    const list = safeGetItem<FacultyMember[]>(STORAGE_KEYS.FACULTY, []);
    if (universityId) {
      return list.filter(f => f.university_id === universityId || f.university_id === 'univ1');
    }
    return list;
  },

  getFacultyById(id: string): FacultyMember | null {
    const list = this.getFaculty();
    return list.find(f => f.faculty_id === id || f.id === id || f.user_id === id) || null;
  },

  updateFaculty(id: string, updates: Partial<FacultyMember>): FacultyMember | null {
    this.initialize();
    const list = safeGetItem<FacultyMember[]>(STORAGE_KEYS.FACULTY, []);
    const idx = list.findIndex(f => f.faculty_id === id || f.id === id || f.user_id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    safeSetItem(STORAGE_KEYS.FACULTY, list);
    return list[idx];
  },

  // ─── Student Teams CRUD ──────────────────────────────────────────────────
  getStudentTeams(universityId?: string): StudentTeam[] {
    this.initialize();
    const list = safeGetItem<StudentTeam[]>(STORAGE_KEYS.STUDENT_TEAMS, []);
    if (universityId) {
      return list.filter(t => t.university_id === universityId || t.university_id === 'univ1');
    }
    return list;
  },

  getStudentTeamById(id: string): StudentTeam | null {
    const list = this.getStudentTeams();
    return list.find(t => t.team_id === id || t.id === id || t.team_leader_id === id) || null;
  },

  updateStudentTeam(id: string, updates: Partial<StudentTeam>): StudentTeam | null {
    this.initialize();
    const list = safeGetItem<StudentTeam[]>(STORAGE_KEYS.STUDENT_TEAMS, []);
    const idx = list.findIndex(t => t.team_id === id || t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    safeSetItem(STORAGE_KEYS.STUDENT_TEAMS, list);
    return list[idx];
  },

  // ─── Project Assignments CRUD ────────────────────────────────────────────
  getProjectAssignments(filters?: {
    problem_id?: string;
    university_id?: string;
    faculty_id?: string;
    team_id?: string;
  }): ProjectAssignment[] {
    this.initialize();
    let list = safeGetItem<ProjectAssignment[]>(STORAGE_KEYS.PROJECT_ASSIGNMENTS, []);
    if (filters?.problem_id) {
      list = list.filter(a => a.problem_id === filters.problem_id);
    }
    if (filters?.university_id) {
      list = list.filter(a => a.university_id === filters.university_id);
    }
    if (filters?.faculty_id) {
      list = list.filter(a => a.faculty_id === filters.faculty_id || a.faculty_email === filters.faculty_id);
    }
    if (filters?.team_id) {
      list = list.filter(a => a.team_id === filters.team_id);
    }
    return list;
  },

  getProjectAssignmentById(id: string): ProjectAssignment | null {
    const list = this.getProjectAssignments();
    return list.find(a => a.assignment_id === id || a.id === id) || null;
  },

  getProjectAssignmentByProblemId(problemId: string): ProjectAssignment | null {
    const list = this.getProjectAssignments();
    return list.find(a => a.problem_id === problemId) || null;
  },

  createProjectAssignment(assignment: ProjectAssignment): ProjectAssignment {
    this.initialize();
    const list = safeGetItem<ProjectAssignment[]>(STORAGE_KEYS.PROJECT_ASSIGNMENTS, []);
    const idx = list.findIndex(a => a.assignment_id === assignment.assignment_id || a.problem_id === assignment.problem_id);
    if (idx >= 0) {
      list[idx] = assignment;
    } else {
      list.unshift(assignment);
    }
    safeSetItem(STORAGE_KEYS.PROJECT_ASSIGNMENTS, list);

    // Also update Problem table with assigned faculty and team fields
    this.updateProblem(assignment.problem_id, {
      assigned_faculty: assignment.faculty_id,
      assigned_faculty_name: assignment.faculty_name,
      assigned_faculty_dept: assignment.faculty_department,
      assigned_team: assignment.team_id,
      assigned_team_name: assignment.team_name,
      faculty_status: assignment.faculty_status,
      team_status: assignment.team_status,
      project_status: assignment.project_status,
      project_assignment_id: assignment.assignment_id,
      status: assignment.project_status === 'PROJECT_ACTIVE' ? 'in_progress' : 'University Accepted',
    });

    return assignment;
  },

  updateProjectAssignment(id: string, updates: Partial<ProjectAssignment>): ProjectAssignment | null {
    this.initialize();
    const list = safeGetItem<ProjectAssignment[]>(STORAGE_KEYS.PROJECT_ASSIGNMENTS, []);
    const idx = list.findIndex(a => a.assignment_id === id || a.id === id || a.problem_id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    safeSetItem(STORAGE_KEYS.PROJECT_ASSIGNMENTS, list);

    // Sync back to problem
    const updated = list[idx];
    this.updateProblem(updated.problem_id, {
      assigned_faculty: updated.faculty_id,
      assigned_faculty_name: updated.faculty_name,
      assigned_faculty_dept: updated.faculty_department,
      assigned_team: updated.team_id,
      assigned_team_name: updated.team_name,
      faculty_status: updated.faculty_status,
      team_status: updated.team_status,
      project_status: updated.project_status,
      status: updated.project_status === 'PROJECT_ACTIVE' ? 'in_progress' : 'University Accepted',
    });

    return updated;
  },

  // ─── OTP Transient Store ─────────────────────────────────────────────────
  saveOTP(identifier: string, code: string, expiresMs = 5 * 60 * 1000): void {
    const otps = safeGetItem<Record<string, { code: string; expiresAt: number }>>(STORAGE_KEYS.OTPS, {});
    otps[identifier] = {
      code,
      expiresAt: Date.now() + expiresMs,
    };
    safeSetItem(STORAGE_KEYS.OTPS, otps);
  },

  getOTP(identifier: string): { code: string; expiresAt: number } | null {
    const otps = safeGetItem<Record<string, { code: string; expiresAt: number }>>(STORAGE_KEYS.OTPS, {});
    const record = otps[identifier];
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      delete otps[identifier];
      safeSetItem(STORAGE_KEYS.OTPS, otps);
      return null;
    }
    return record;
  },

  clearOTP(identifier: string): void {
    const otps = safeGetItem<Record<string, { code: string; expiresAt: number }>>(STORAGE_KEYS.OTPS, {});
    delete otps[identifier];
    safeSetItem(STORAGE_KEYS.OTPS, otps);
  },

  // ─── Research Entries CRUD ───────────────────────────────────────────────
  getResearchEntries(problemId?: string): ResearchEntry[] {
    this.initialize();
    const list = safeGetItem<ResearchEntry[]>(STORAGE_KEYS.RESEARCH_ENTRIES, []);
    if (problemId) {
      return list.filter(r => r.problem_id === problemId || r.projectId === problemId);
    }
    return list;
  },

  addResearchEntry(entry: ResearchEntry): ResearchEntry {
    this.initialize();
    const list = safeGetItem<ResearchEntry[]>(STORAGE_KEYS.RESEARCH_ENTRIES, []);
    list.unshift(entry);
    safeSetItem(STORAGE_KEYS.RESEARCH_ENTRIES, list);
    return entry;
  },

  // ─── Prototypes CRUD ─────────────────────────────────────────────────────
  getPrototypes(problemId?: string): Prototype[] {
    this.initialize();
    const list = safeGetItem<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
    if (problemId) {
      return list.filter(p => p.problem_id === problemId || p.projectId === problemId);
    }
    return list;
  },

  getPrototypeByProblemId(problemId: string): Prototype | null {
    const list = this.getPrototypes();
    return list.find(p => p.problem_id === problemId || p.projectId === problemId) || null;
  },

  createPrototype(proto: Prototype): Prototype {
    this.initialize();
    const list = safeGetItem<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
    const idx = list.findIndex(p => p.id === proto.id || (proto.problem_id && p.problem_id === proto.problem_id));
    if (idx >= 0) {
      list[idx] = proto;
    } else {
      list.unshift(proto);
    }
    safeSetItem(STORAGE_KEYS.PROTOTYPES, list);
    return proto;
  },

  updatePrototype(id: string, updates: Partial<Prototype>): Prototype | null {
    this.initialize();
    const list = safeGetItem<Prototype[]>(STORAGE_KEYS.PROTOTYPES, []);
    const idx = list.findIndex(p => p.id === id || p.problem_id === id || p.projectId === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    safeSetItem(STORAGE_KEYS.PROTOTYPES, list);
    return list[idx];
  },

  // ─── Industry Collaborations CRUD ────────────────────────────────────────
  getIndustryCollaborations(problemId?: string): CollaborationRequest[] {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    if (problemId) {
      return list.filter(c => c.problem_id === problemId || c.projectId === problemId);
    }
    return list;
  },

  createIndustryCollaboration(collab: CollaborationRequest): CollaborationRequest {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    list.unshift(collab);
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);
    return collab;
  },

  updateIndustryCollaboration(id: string, updates: Partial<CollaborationRequest>): CollaborationRequest | null {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, respondedAt: new Date().toISOString() };
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);
    return list[idx];
  },

  // ─── Tasks CRUD ──────────────────────────────────────────────────────────
  getTasks(problemId?: string): Task[] {
    this.initialize();
    const list = safeGetItem<Task[]>(STORAGE_KEYS.TASKS, []);
    if (problemId) {
      return list.filter(t => t.problem_id === problemId || t.projectId === problemId);
    }
    return list;
  },

  createTask(task: Task): Task {
    this.initialize();
    const list = safeGetItem<Task[]>(STORAGE_KEYS.TASKS, []);
    list.unshift(task);
    safeSetItem(STORAGE_KEYS.TASKS, list);
    return task;
  },

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    this.initialize();
    const list = safeGetItem<Task[]>(STORAGE_KEYS.TASKS, []);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates };
    safeSetItem(STORAGE_KEYS.TASKS, list);
    return list[idx];
  },

  // ─── Unified Problem Ecosystem ───────────────────────────────────────────
  getProblemEcosystem(problemId: string): ProblemEcosystem | null {
    this.initialize();
    const problem = this.getProblemById(problemId);
    if (!problem) return null;

    const assignment = this.getProjectAssignmentByProblemId(problemId) || undefined;
    const team = assignment?.team_id ? this.getStudentTeamById(assignment.team_id) || undefined : undefined;
    const research = this.getResearchEntries(problemId);
    const prototype = this.getPrototypeByProblemId(problemId) || undefined;
    const collaboration = this.getIndustryCollaborations(problemId);
    const commitment = this.getIndustryCommitment(problemId);
    const pilot = this.getPilotDeployment(problemId);
    const finalSub = this.getFinalGovernmentSubmission(problemId);

    // Determine lifecycle stage
    let lifecycleStage = 'Citizen Grievance Submitted';
    if (finalSub?.status === 'validated_for_scale') {
      lifecycleStage = 'Validated for District Scale Deployment';
    } else if (pilot?.status === 'active' || pilot?.status === 'completed') {
      lifecycleStage = 'Field Pilot & Deployment Active';
    } else if (commitment || collaboration.some(c => c.status === 'accepted')) {
      lifecycleStage = 'Industry Co-Innovation & Pilot Execution';
    } else if (collaboration.some(c => c.status === 'submitted' || c.status === 'under_review')) {
      lifecycleStage = 'Industry Collaboration Under Review';
    } else if (prototype?.status === 'field_pilot' || prototype?.status === 'deployed') {
      lifecycleStage = 'Field Pilot & Real-World Testing';
    } else if (prototype && prototype.readinessScore > 50) {
      lifecycleStage = 'Prototype Engineering & Evaluation';
    } else if (assignment?.project_status === 'PROJECT_ACTIVE') {
      lifecycleStage = 'Active University & Student R&D';
    } else if (assignment) {
      lifecycleStage = 'University Assigned';
    } else if (problem.verification_status === 'Verified') {
      lifecycleStage = 'Government Verified & Routing';
    }

    return {
      problem,
      assignment,
      team,
      research,
      prototype,
      collaboration,
      lifecycleStage,
    };
  },

  // ─── Registered Industry Partners ────────────────────────────────────────
  getIndustryPartners(): IndustryPartner[] {
    this.initialize();
    const list = safeGetItem<IndustryPartner[]>(STORAGE_KEYS.INDUSTRY_PARTNERS_KEY, []);
    if (list.length > 0) return list;

    const seedPartners: IndustryPartner[] = [
      {
        id: 'partner-agritech-01',
        name: 'AgriTech Jharkhand Solutions Pvt. Ltd.',
        type: 'startup',
        sector: 'AgriTech & Computer Vision',
        city: 'Ranchi',
        domains: ['agriculture', 'environment', 'water'],
        collaborationTypes: ['mentorship', 'funding', 'technical', 'testing', 'deployment'],
        totalFunding: 2500000,
        activeCollaborations: 2,
        contact: { email: 'partnerships@agritech-jh.in', phone: '+91 98350 12345', website: 'www.agritech-jh.in' },
      },
      {
        id: 'partner-juvnl-02',
        name: 'Jharkhand Urja Vikas Nigam (JUVNL Technical Innovation Cell)',
        type: 'corporate',
        sector: 'Electrical Grid & Power Infrastructure',
        city: 'Ranchi',
        domains: ['energy', 'infrastructure'],
        collaborationTypes: ['technical', 'testing', 'deployment'],
        totalFunding: 1800000,
        activeCollaborations: 1,
        contact: { email: 'innovation@juvnl.org.in', phone: '0651-2490123' },
      },
      {
        id: 'partner-juidco-03',
        name: 'Jharkhand Urban Infrastructure Development Company (JUIDCO)',
        type: 'corporate',
        sector: 'Smart Cities & Urban Drainage Systems',
        city: 'Ranchi',
        domains: ['infrastructure', 'sanitation', 'environment'],
        collaborationTypes: ['funding', 'technical', 'deployment'],
        totalFunding: 4500000,
        activeCollaborations: 3,
        contact: { email: 'smartcity@juidco.co.in', phone: '0651-2244111', website: 'www.juidco.jharkhand.gov.in' },
      },
      {
        id: 'partner-aquatech-04',
        name: 'AquaTech Solutions India',
        type: 'startup',
        sector: 'Water Quality & Chemical Sensors',
        city: 'Jamshedpur',
        domains: ['water', 'environment', 'sanitation'],
        collaborationTypes: ['testing', 'mentorship', 'technical'],
        totalFunding: 1200000,
        activeCollaborations: 1,
        contact: { email: 'labs@aquatech-india.com', phone: '0657-2233445' },
      },
      {
        id: 'partner-tata-05',
        name: 'Tata Steel Technology & CSR Division',
        type: 'csr',
        sector: 'Industrial IoT & Rural Technology Scaling',
        city: 'Jamshedpur',
        domains: ['agriculture', 'education', 'infrastructure', 'livelihoods'],
        collaborationTypes: ['funding', 'mentorship', 'deployment'],
        totalFunding: 7500000,
        activeCollaborations: 4,
        contact: { email: 'csr-tech@tatasteel.com', phone: '0657-6655444', website: 'www.tatasteel.com/csr' },
      },
      {
        id: 'partner-greenenergy-06',
        name: 'GreenEnergy Jharkhand MSME',
        type: 'msme',
        sector: 'Renewable Telemetry & Edge Solar Systems',
        city: 'Dhanbad',
        domains: ['energy', 'agriculture'],
        collaborationTypes: ['mentorship', 'technical', 'testing'],
        totalFunding: 950000,
        activeCollaborations: 1,
        contact: { email: 'solutions@greenenergy-jh.in', phone: '0326-2300045' },
      },
    ];

    safeSetItem(STORAGE_KEYS.INDUSTRY_PARTNERS_KEY, seedPartners);
    return seedPartners;
  },

  getIndustryPartnerById(id: string): IndustryPartner | null {
    const list = this.getIndustryPartners();
    return list.find(p => p.id === id) || null;
  },

  getIndustryRecommendations(
    problemId: string,
    requestedSupport?: string[]
  ): Array<{
    partner: IndustryPartner;
    matchScore: number;
    matchReasons: string[];
    fitLevel: 'High' | 'Medium' | 'Low';
  }> {
    const problem = this.getProblemById(problemId);
    const prototype = this.getPrototypeByProblemId(problemId);
    const assignment = this.getProjectAssignmentByProblemId(problemId);
    const partners = this.getIndustryPartners();

    if (!problem) return [];

    const domain = (problem.domain || problem.category || '').toLowerCase();
    const textContext = `${problem.title} ${problem.description} ${problem.subcategory || ''} ${prototype?.techStack.join(' ') || ''} ${prototype?.title || ''} ${prototype?.description || ''} ${assignment?.faculty_department || ''} ${assignment?.team_skills?.join(' ') || ''}`.toLowerCase();

    const results: Array<{
      partner: IndustryPartner;
      matchScore: number;
      matchReasons: string[];
      fitLevel: 'High' | 'Medium' | 'Low';
    }> = [];

    for (const partner of partners) {
      const matchReasons: string[] = [];
      let score = 50;
      let hasGenuineMatch = false;

      // Project-Specific Domain Matching
      if (
        domain.includes('energy') ||
        textContext.includes('transformer') ||
        textContext.includes('power') ||
        textContext.includes('substation') ||
        textContext.includes('grid')
      ) {
        if (partner.id === 'partner-juvnl-02') {
          hasGenuineMatch = true;
          score = 96;
          matchReasons.push('✓ Electrical Grid & Power Infrastructure domain');
          matchReasons.push('✓ High-Voltage Substation Telemetry & Hardware Testing Bench');
          matchReasons.push('✓ JUVNL Grid Protocol Integration & Safety Engineering');
          if (requestedSupport?.some(s => s.toLowerCase().includes('field') || s.toLowerCase().includes('test'))) {
            matchReasons.push('✓ Direct Substation Field Trial Site Access');
          }
          if (requestedSupport?.some(s => s.toLowerCase().includes('mentor') || s.toLowerCase().includes('tech'))) {
            matchReasons.push('✓ Senior Power Systems Engineering Mentorship');
          }
          if (requestedSupport?.some(s => s.toLowerCase().includes('hard') || s.toLowerCase().includes('equip'))) {
            matchReasons.push('✓ DIN-Rail Relay & Rogowski Sensor Integration Hardware');
          }
        } else if (partner.id === 'partner-tata-05') {
          hasGenuineMatch = true;
          score = 84;
          matchReasons.push('✓ Industrial Electrical Infrastructure & Instrumentation domain');
          matchReasons.push('✓ Heavy Industrial IoT Sensor Validation & Field Safety Standards');
          matchReasons.push('✓ Corporate CSR Co-Pilot Capital & Scaling Support');
          if (requestedSupport?.some(s => s.toLowerCase().includes('fund'))) {
            matchReasons.push('✓ Industrial Pilot Co-Funding Grant Facility');
          }
        } else {
          // Strictly exclude unrelated domains (no agritech, water, municipal drainage)
          continue;
        }
      } else if (
        domain.includes('agri') ||
        textContext.includes('pest') ||
        textContext.includes('crop') ||
        textContext.includes('farm') ||
        textContext.includes('pathogen')
      ) {
        if (partner.id === 'partner-agritech-01') {
          hasGenuineMatch = true;
          score = 95;
          matchReasons.push('✓ Agriculture & Agronomy domain');
          matchReasons.push('✓ AI / Computer Vision edge camera trap validation');
          matchReasons.push('✓ Dedicated Vegetable Cluster Field Trial Sites across Ranchi & Ramgarh');
          if (requestedSupport?.some(s => s.toLowerCase().includes('fund'))) {
            matchReasons.push('✓ Up to ₹5 Lakhs Seed Co-Pilot Grant Allocation');
          }
          if (requestedSupport?.some(s => s.toLowerCase().includes('mentor') || s.toLowerCase().includes('tech'))) {
            matchReasons.push('✓ Technical Mentorship from Senior Agronomists & Vision Engineers');
          }
          if (requestedSupport?.some(s => s.toLowerCase().includes('field') || s.toLowerCase().includes('deploy'))) {
            matchReasons.push('✓ Field Testing & Deployment Support across 5 Farmer Clusters');
          }
        } else if (partner.id === 'partner-tata-05') {
          hasGenuineMatch = true;
          score = 78;
          matchReasons.push('✓ Rural Livelihoods & Smart Agriculture CSR Scaling');
          matchReasons.push('✓ District-level Farmer Producer Organization (FPO) pilot testbed');
        } else {
          continue;
        }
      } else if (
        domain.includes('water') ||
        textContext.includes('fluoride') ||
        textContext.includes('arsenic') ||
        textContext.includes('drinking water')
      ) {
        if (partner.id === 'partner-aquatech-04') {
          hasGenuineMatch = true;
          score = 94;
          matchReasons.push('✓ Water Quality & Environmental Chemistry domain');
          matchReasons.push('✓ Mass Spectrometry Cross-Validation Lab & Reagent Supply');
          matchReasons.push('✓ Certified Water Testing & Calibration Facilities in Ranchi');
        } else if (partner.id === 'partner-tata-05') {
          hasGenuineMatch = true;
          score = 80;
          matchReasons.push('✓ Community Water Purification & Rural Health CSR Wing');
          matchReasons.push('✓ Scaling Support for Panchayati Raj Clean Drinking Water Programs');
        } else {
          continue;
        }
      } else if (
        textContext.includes('drain') ||
        textContext.includes('flood') ||
        textContext.includes('stormwater') ||
        textContext.includes('silt')
      ) {
        if (partner.id === 'partner-juidco-03') {
          hasGenuineMatch = true;
          score = 95;
          matchReasons.push('✓ Urban Infrastructure & Smart Cities domain');
          matchReasons.push('✓ Municipal Subterranean Culvert Access & Silt Telemetry Pilot Sites');
          matchReasons.push('✓ Ranchi Smart City Integrated Command and Control Centre (ICCC) API Gateway');
        } else {
          continue;
        }
      } else {
        const partnerDomains = partner.domains.map(d => d.toLowerCase());
        if (partnerDomains.some(d => domain.includes(d) || textContext.includes(d))) {
          hasGenuineMatch = true;
          score = 72;
          matchReasons.push(`✓ Domain Alignment: ${partner.sector}`);
          matchReasons.push(`✓ Industrial Engineering & Deployment Facilities in ${partner.city}`);
        }
      }

      if (!hasGenuineMatch) continue;

      if (prototype) {
        if (prototype.readinessScore >= 80) {
          matchReasons.push(`✓ High Prototype Readiness (${prototype.readinessScore}%) fits Pilot Deployment`);
        } else if (prototype.readinessScore >= 50) {
          matchReasons.push(`✓ Functional Prototype (${prototype.readinessScore}%) ready for Safety & Stress Testing`);
        }
      }

      const fitLevel: 'High' | 'Medium' | 'Low' = score >= 80 ? 'High' : score >= 65 ? 'Medium' : 'Low';
      results.push({
        partner,
        matchScore: score,
        matchReasons,
        fitLevel,
      });
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  },

  // ─── Faculty Industry Support Request Flow ────────────────────────────────
  submitFacultyIndustryRequest(
    problemId: string,
    payload: {
      selectedPartnerId: string;
      supportRequirements: string[];
      whyNeeded: string;
      expectedOutcome: string;
      requestedFunding?: number;
      expectedTimeline?: string;
      additionalRequirements?: string;
      currentStage?: string;
    }
  ): CollaborationRequest {
    this.initialize();
    const problem = this.getProblemById(problemId);
    const assignment = this.getProjectAssignmentByProblemId(problemId);
    const prototype = this.getPrototypeByProblemId(problemId);
    const partner = this.getIndustryPartnerById(payload.selectedPartnerId);

    if (!problem || !partner) {
      throw new Error('Problem or Industry Partner not found');
    }

    const recs = this.getIndustryRecommendations(problemId, payload.supportRequirements);
    const matched = recs.find(r => r.partner.id === partner.id);

    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    const existingIdx = list.findIndex(c => c.problem_id === problemId || c.projectId === problemId);

    const requestId = `freq-${problemId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-${Date.now()}`;
    const requestEntry: CollaborationRequest = {
      id: existingIdx >= 0 ? list[existingIdx].id : requestId,
      projectId: problemId,
      problem_id: problemId,
      problemId: problemId,
      project: problem.title,
      projectTitle: problem.title,
      industryPartnerId: partner.id,
      industryPartner: partner.name,
      facultyId: assignment?.faculty_id || 'fac-1',
      facultyName: assignment?.faculty_name || 'Dr. Anita Sharma',
      facultyEmail: assignment?.faculty_email || 'faculty@bitsindri.ac.in',
      universityId: assignment?.university_id || 'univ1',
      universityName: assignment?.university_name || 'BIT Sindri',
      studentTeamId: assignment?.team_id,
      studentTeamName: assignment?.team_name,
      prototypeId: prototype?.id,
      currentStage: payload.currentStage || prototype?.status || 'Prototype Testing',
      requestedFunding: payload.requestedFunding || 150000,
      supportRequirements: payload.supportRequirements,
      supportTypes: payload.supportRequirements,
      supportAreas: payload.supportRequirements,
      requestType: payload.supportRequirements.map(s => s.toLowerCase()),
      whyNeeded: payload.whyNeeded,
      expectedOutcome: payload.expectedOutcome,
      expectedTimeline: payload.expectedTimeline || '4 to 6 months',
      additionalRequirements: payload.additionalRequirements,
      aiMatchScore: matched?.matchScore || 92,
      aiMatchReasons: matched?.matchReasons || [`✓ ${partner.sector} domain capability`],
      status: 'pending_spoc',
      applicationStatus: 'draft',
      requestedAt: new Date().toISOString(),
      message: payload.whyNeeded,
      spocReviewStatus: 'pending',
    };

    if (existingIdx >= 0) {
      list[existingIdx] = requestEntry;
    } else {
      list.unshift(requestEntry);
    }
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);

    // Notify University SPOC
    this.createNotification({
      userId: 'university',
      role: 'university',
      problemId,
      type: 'collaboration',
      title: 'New Industry Collaboration Request',
      message: `${requestEntry.facultyName} has requested industry collaboration with ${partner.name} for Problem ${problemId}. SPOC review and official application dispatch required.`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId,
      actorRole: 'faculty',
      actorName: requestEntry.facultyName || 'Faculty Lead',
      action: 'Submitted Industry Support Request to University SPOC',
      description: `Selected ${partner.name} following AI matching. Support requested: ${payload.supportRequirements.join(', ')}. Forwarded to University SPOC for official review.`,
      category: 'application',
    });

    return requestEntry;
  },

  // ─── University SPOC Official Application Dispatch ────────────────────────
  spocSendOfficialIndustryApplication(requestId: string, notes?: string): CollaborationRequest | null {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    const idx = list.findIndex(c => c.id === requestId);
    if (idx === -1) return null;

    const collab = list[idx];
    const problemId = collab.problem_id || collab.projectId;
    const cleanNum = problemId.replace(/[^0-9]/g, '') || '1029';
    const officialAppId = `IND-REQ-${cleanNum}`;

    collab.applicationId = officialAppId;
    collab.status = 'submitted_to_industry';
    collab.applicationStatus = 'submitted';
    collab.spocNotes = notes;
    collab.spocReviewStatus = 'approved';
    collab.spocDispatchedAt = new Date().toISOString();
    collab.submittedAt = new Date().toISOString();

    list[idx] = collab;
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);

    // Immediately notify Selected Industry
    this.createNotification({
      userId: 'industry',
      role: 'industry',
      problemId,
      type: 'collaboration',
      title: 'New Collaboration Application Received',
      message: `Official application ${officialAppId} dispatched by University SPOC (${collab.universityName}) for Project ${problemId} (${collab.project}). Inspect complete dossier to review.`,
    });

    // Notify Faculty
    this.createNotification({
      userId: 'faculty',
      role: 'faculty',
      problemId,
      type: 'collaboration',
      title: 'Official Industry Application Dispatched',
      message: `University SPOC has officially submitted Application ${officialAppId} to ${collab.industryPartner}.`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId,
      actorRole: 'university',
      actorName: 'University SPOC',
      action: `Sent Official Industry Collaboration Application (${officialAppId})`,
      description: `Dispatched official application dossier to ${collab.industryPartner}. SPOC Notes: ${notes || 'Verified and forwarded for co-pilot pilot development'}.`,
      category: 'application',
    });

    return collab;
  },

  // ─── University SPOC Return to Faculty ────────────────────────────────────
  spocReturnRequestToFaculty(requestId: string, feedback: string): CollaborationRequest | null {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    const idx = list.findIndex(c => c.id === requestId);
    if (idx === -1) return null;

    const collab = list[idx];
    const problemId = collab.problem_id || collab.projectId;

    collab.status = 'returned_to_faculty';
    collab.spocReviewStatus = 'returned';
    collab.spocFeedback = feedback;

    list[idx] = collab;
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);

    // Notify Faculty
    this.createNotification({
      userId: 'faculty',
      role: 'faculty',
      problemId,
      type: 'warning',
      title: 'University SPOC Requested Changes',
      message: `University SPOC returned your industry request for Problem ${problemId}. Required changes: "${feedback}". Please modify and resubmit.`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId,
      actorRole: 'university',
      actorName: 'University SPOC',
      action: 'Returned Industry Request to Faculty',
      description: `Requested changes for ${collab.industryPartner} application. Feedback: "${feedback}".`,
      category: 'application',
    });

    return collab;
  },

  // ─── University Project Updates CRUD ─────────────────────────────────────
  getUniversityUpdates(problemId?: string): UniversityProjectUpdate[] {
    this.initialize();
    const list = safeGetItem<UniversityProjectUpdate[]>(STORAGE_KEYS.UNIVERSITY_UPDATES, []);
    if (problemId) {
      return list.filter(u => u.problemId === problemId);
    }
    return list;
  },

  addUniversityUpdate(update: UniversityProjectUpdate): UniversityProjectUpdate {
    this.initialize();
    const list = safeGetItem<UniversityProjectUpdate[]>(STORAGE_KEYS.UNIVERSITY_UPDATES, []);
    list.unshift(update);
    safeSetItem(STORAGE_KEYS.UNIVERSITY_UPDATES, list);

    // Notify University Admin
    this.createNotification({
      userId: 'university',
      role: 'university',
      problemId: update.problemId,
      type: 'assignment',
      title: 'New Faculty Project Progress Update',
      message: `${update.facultyName} submitted progress update for Problem ${update.problemId} (Prototype: ${update.prototypeProgress}%, Stage: ${update.currentStage}). Industry support required: ${update.industrySupportRequired.join(', ')}.`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId: update.problemId,
      actorRole: 'faculty',
      actorName: update.facultyName,
      action: 'Submitted Project Progress Update to University',
      description: `Reported ${update.prototypeProgress}% prototype readiness at stage "${update.currentStage}". Identified industry support needs: ${update.industrySupportRequired.join(', ')}.`,
      category: 'update',
    });

    return update;
  },

  // ─── Industry Applications & Review Decision ─────────────────────────────
  submitIndustryApplication(app: CollaborationRequest): CollaborationRequest {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    const entry: CollaborationRequest = {
      ...app,
      status: 'submitted',
      applicationStatus: 'submitted',
      requestedAt: app.requestedAt || new Date().toISOString(),
    };
    list.unshift(entry);
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);

    // Notify Selected Industry
    this.createNotification({
      userId: 'industry',
      role: 'industry',
      problemId: entry.problem_id || entry.projectId,
      type: 'collaboration',
      title: 'New Collaboration Application Received',
      message: `${entry.facultyName || 'Faculty Mentor'} from ${entry.universityName || 'University'} submitted an application for Project ${entry.problem_id || entry.projectId} (${entry.project}).`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId: entry.problem_id || entry.projectId,
      actorRole: 'faculty',
      actorName: entry.facultyName || 'Faculty Lead',
      action: `Submitted Industry Collaboration Application to ${entry.industryPartner}`,
      description: `Formal request for ${entry.requestType.join(', ')}. Expected outcome: ${entry.expectedOutcome || 'Field pilot deployment'}.`,
      category: 'application',
    });

    return entry;
  },

  reviewIndustryApplication(
    id: string,
    decision: 'accepted' | 'rejected',
    payload: {
      industryPartnerName: string;
      industryMentorName?: string;
      industryMentorId?: string;
      industryMentorRole?: string;
      fundingCommitment?: number;
      technicalSupportDetails?: string;
      fieldTestingDetails?: string;
      deploymentSupportDetails?: string;
      startDate?: string;
      durationMonths?: number;
      rejectionReason?: string;
      rejectionFeedback?: string;
      rejectedBy?: string;
    }
  ): CollaborationRequest | null {
    this.initialize();
    const list = safeGetItem<CollaborationRequest[]>(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, []);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const collab = list[idx];
    const problemId = collab.problem_id || collab.projectId;

    if (decision === 'accepted') {
      collab.status = 'accepted';
      collab.applicationStatus = 'accepted';
      collab.respondedAt = new Date().toISOString();
      collab.industryMentor = payload.industryMentorName || 'Senior Technical Specialist';
      collab.industryMentorId = payload.industryMentorId || 'mentor-ind-1';
      collab.committedFunding = payload.fundingCommitment || 350000;
      collab.technicalSupportDetails = payload.technicalSupportDetails;
      collab.fieldTestingDetails = payload.fieldTestingDetails;
      collab.deploymentSupportDetails = payload.deploymentSupportDetails;
      collab.expectedStartDate = payload.startDate || new Date().toISOString().split('T')[0];
      collab.expectedDuration = `${payload.durationMonths || 6} months`;
      collab.response = payload.technicalSupportDetails || `Accepted co-pilot partnership with ₹${payload.fundingCommitment?.toLocaleString() || '3,50,000'} commitment.`;

      // Save or update Industry Commitment
      const commitments = safeGetItem<IndustryCommitment[]>(STORAGE_KEYS.INDUSTRY_COMMITMENTS, []);
      const existingIdx = commitments.findIndex(c => c.problemId === problemId);
      const newCommitment: IndustryCommitment = {
        id: `commit-${Date.now()}`,
        problemId,
        industryPartnerId: collab.industryPartnerId,
        industryPartnerName: payload.industryPartnerName,
        industryMentorId: payload.industryMentorId || 'mentor-ind-1',
        industryMentorName: payload.industryMentorName || 'Senior Technical Specialist',
        industryMentorRole: payload.industryMentorRole || 'Co-Pilot Technical Lead',
        fundingCommitted: payload.fundingCommitment || 350000,
        fundingApproved: payload.fundingCommitment || 350000,
        fundingReleased: 0,
        fundingUtilized: 0,
        fundingStatus: 'approved',
        technicalSupportDetails: payload.technicalSupportDetails,
        fieldTestingDetails: payload.fieldTestingDetails,
        deploymentSupportDetails: payload.deploymentSupportDetails,
        startDate: payload.startDate || new Date().toISOString().split('T')[0],
        durationMonths: payload.durationMonths || 6,
        confirmedAt: new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        commitments[existingIdx] = newCommitment;
      } else {
        commitments.push(newCommitment);
      }
      safeSetItem(STORAGE_KEYS.INDUSTRY_COMMITMENTS, commitments);

      // Seed default workspace tasks if not present
      this.ensureDefaultWorkspaceTasks(problemId, collab.industryPartner);

      // Notify Faculty
      this.createNotification({
        userId: 'faculty',
        role: 'faculty',
        problemId,
        type: 'collaboration',
        title: 'Industry Collaboration Accepted!',
        message: `${payload.industryPartnerName} accepted collaboration for Problem ${problemId}. Assigned Mentor: ${payload.industryMentorName}. Funding Commitment: ₹${payload.fundingCommitment?.toLocaleString() || '3,50,000'}.`,
      });

      // Notify Student Team
      this.createNotification({
        userId: 'student',
        role: 'student',
        problemId,
        type: 'collaboration',
        title: 'Industry Co-Pilot Active',
        message: `${payload.industryPartnerName} joined Problem ${problemId} sprint. Technical mentor ${payload.industryMentorName} is now connected.`,
      });

      // Notify University SPOC
      this.createNotification({
        userId: 'university',
        role: 'university',
        problemId,
        type: 'collaboration',
        title: 'Industry Accepted Collaboration Request',
        message: `${payload.industryPartnerName} accepted the official collaboration request for Problem ${problemId}. Workspace is now active.`,
      });

      // Log Activity Event
      this.logProjectActivity({
        problemId,
        actorRole: 'industry',
        actorName: payload.industryPartnerName,
        action: 'Accepted Industry Collaboration Application',
        description: `Ratified co-pilot partnership with ₹${payload.fundingCommitment?.toLocaleString() || '3,50,000'} funding commitment. Assigned Industry Mentor: ${payload.industryMentorName}.`,
        category: 'decision',
      });
    } else {
      // Rejection
      collab.status = 'rejected';
      collab.applicationStatus = 'rejected';
      collab.respondedAt = new Date().toISOString();
      collab.rejectionReason = payload.rejectionReason || 'Project alignment outside current corporate CSR/testing mandate';
      collab.rejectionFeedback = payload.rejectionFeedback || 'Project scope requires additional lab validation before pilot stage';
      collab.rejectedBy = payload.rejectedBy || payload.industryPartnerName;
      collab.rejectedAt = new Date().toISOString();

      // Notify Faculty (Important: Project is NOT rejected, only application)
      this.createNotification({
        userId: 'faculty',
        role: 'faculty',
        problemId,
        type: 'warning',
        title: 'Industry Application Declined',
        message: `${payload.industryPartnerName} declined collaboration for Problem ${problemId}. Reason: ${payload.rejectionReason}. You may review feedback and apply to another partner.`,
      });

      // Notify University SPOC
      this.createNotification({
        userId: 'university',
        role: 'university',
        problemId,
        type: 'warning',
        title: 'Industry Declined Collaboration Request',
        message: `${payload.industryPartnerName} declined collaboration for Problem ${problemId}. Reason: ${payload.rejectionReason}.`,
      });

      // Log Activity Event
      this.logProjectActivity({
        problemId,
        actorRole: 'industry',
        actorName: payload.industryPartnerName,
        action: 'Declined Industry Collaboration Application',
        description: `Application declined. Reason: ${payload.rejectionReason}. Feedback: "${payload.rejectionFeedback || 'None'}"`,
        category: 'decision',
      });
    }

    list[idx] = collab;
    safeSetItem(STORAGE_KEYS.INDUSTRY_COLLABORATIONS, list);
    return collab;
  },

  // ─── Industry Commitment & Funding Tranches ──────────────────────────────
  getIndustryCommitment(problemId: string): IndustryCommitment | null {
    this.initialize();
    const list = safeGetItem<IndustryCommitment[]>(STORAGE_KEYS.INDUSTRY_COMMITMENTS, []);
    const found = list.find(c => c.problemId === problemId);
    if (found) return found;

    // Default seeded commitment for P-1030 if active
    if (problemId === 'P-1030') {
      const def: IndustryCommitment = {
        id: 'commit-p1030',
        problemId: 'P-1030',
        industryPartnerId: 'partner-agritech-01',
        industryPartnerName: 'AgriTech Jharkhand Solutions Pvt. Ltd.',
        industryMentorId: 'mentor-agri-1',
        industryMentorName: 'Er. Rajesh Vardhan (Principal Agronomy Systems Lead)',
        industryMentorRole: 'Corporate Innovation Lead',
        fundingCommitted: 350000,
        fundingApproved: 350000,
        fundingReleased: 150000,
        fundingUtilized: 85000,
        fundingStatus: 'partially_utilized',
        technicalSupportDetails: 'Optical edge camera calibration and cloud telemetry server allocation.',
        fieldTestingDetails: 'Provision of 50 field test poles in Kanke Vegetable Cooperative.',
        deploymentSupportDetails: 'Logistics and solar panel mounting hardware.',
        startDate: '2026-09-05',
        durationMonths: 6,
        confirmedAt: '2026-09-05T14:30:00Z',
      };
      return def;
    }

    return null;
  },

  releaseFundingTranche(problemId: string, amount: number, note?: string): IndustryCommitment | null {
    this.initialize();
    const list = safeGetItem<IndustryCommitment[]>(STORAGE_KEYS.INDUSTRY_COMMITMENTS, []);
    let idx = list.findIndex(c => c.problemId === problemId);

    if (idx === -1 && problemId === 'P-1030') {
      const def = this.getIndustryCommitment('P-1030')!;
      list.push(def);
      idx = list.length - 1;
    }

    if (idx === -1) return null;

    const commit = list[idx];
    const newReleased = Math.min(commit.fundingApproved, commit.fundingReleased + amount);
    commit.fundingReleased = newReleased;
    commit.fundingStatus = newReleased >= commit.fundingApproved ? 'fully_utilized' : 'partially_utilized';
    list[idx] = commit;
    safeSetItem(STORAGE_KEYS.INDUSTRY_COMMITMENTS, list);

    // Notify Faculty & Students
    this.createNotification({
      userId: 'faculty',
      role: 'faculty',
      problemId,
      type: 'funding',
      title: 'Industry Funding Tranche Released',
      message: `₹${amount.toLocaleString()} has been released by ${commit.industryPartnerName} for hardware manufacturing (${note || 'Milestone Tranche'}).`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId,
      actorRole: 'industry',
      actorName: commit.industryPartnerName,
      action: `Released Funding Tranche: ₹${amount.toLocaleString()}`,
      description: `Funding released to University R&D account. Total released to date: ₹${newReleased.toLocaleString()} of ₹${commit.fundingApproved.toLocaleString()} approved.`,
      category: 'funding',
    });

    return commit;
  },

  // ─── Real-Time Workspace Tasks ───────────────────────────────────────────
  getWorkspaceTasks(problemId: string): WorkspaceTask[] {
    this.initialize();
    const list = safeGetItem<WorkspaceTask[]>(STORAGE_KEYS.WORKSPACE_TASKS, []);
    const filtered = list.filter(t => t.problemId === problemId);
    if (filtered.length > 0) return filtered;

    if (problemId === 'P-1030') {
      return this.ensureDefaultWorkspaceTasks('P-1030', 'AgriTech Jharkhand Solutions Pvt. Ltd.');
    }
    return [];
  },

  ensureDefaultWorkspaceTasks(problemId: string, partnerName: string): WorkspaceTask[] {
    const defaultTasks: WorkspaceTask[] = [
      {
        id: `wtask-${problemId}-1`,
        problemId,
        title: 'Optimize YOLOv8 Edge Inference on Solar Trap ESP32-S3',
        description: 'Compress model weights using INT8 quantization to achieve sub-400ms inference on solar battery constraint.',
        assignedTo: 'Team Innovators-07',
        mentor: `${partnerName} (Edge AI Specialist)`,
        facultyReviewRequired: true,
        status: 'completed',
        dueDate: '2026-09-18',
        completedAt: '2026-09-17T18:00:00Z',
        createdAt: '2026-09-06T10:00:00Z',
      },
      {
        id: `wtask-${problemId}-2`,
        problemId,
        title: 'Fabricate Weatherproof IP67 Solar Housing for Marginal Rain Conditions',
        description: 'Design and 3D print 10 test units for monsoon field endurance testing in Kanke cluster.',
        assignedTo: 'Team Innovators-07',
        mentor: `${partnerName} (Hardware Engineer)`,
        facultyReviewRequired: true,
        status: 'approved',
        dueDate: '2026-09-24',
        createdAt: '2026-09-10T11:00:00Z',
      },
      {
        id: `wtask-${problemId}-3`,
        problemId,
        title: 'Deploy Telemetry MQTT Broker & SMS Alert Gateway for Farmers',
        description: 'Integrate Hindi & Nagpuri voice alerts triggered when threshold pest counts exceed 15 bugs/trap/hour.',
        assignedTo: 'Team Innovators-07',
        mentor: `${partnerName} (Cloud Telemetry Lead)`,
        facultyReviewRequired: false,
        status: 'in_progress',
        dueDate: '2026-09-30',
        createdAt: '2026-09-15T09:30:00Z',
      },
      {
        id: `wtask-${problemId}-4`,
        problemId,
        title: 'Conduct Multi-Cluster Field Pilot Validation with District Agronomists',
        description: 'Field benchmark against conventional manual trap sampling across 3 Panchayats.',
        assignedTo: 'Team Innovators-07 & Industry Field Team',
        mentor: `${partnerName} (Agronomy Director)`,
        facultyReviewRequired: true,
        status: 'todo',
        dueDate: '2026-10-10',
        createdAt: '2026-09-18T14:00:00Z',
      },
    ];

    const list = safeGetItem<WorkspaceTask[]>(STORAGE_KEYS.WORKSPACE_TASKS, []);
    const others = list.filter(t => t.problemId !== problemId);
    safeSetItem(STORAGE_KEYS.WORKSPACE_TASKS, [...defaultTasks, ...others]);
    return defaultTasks;
  },

  addWorkspaceTask(problemId: string, task: Omit<WorkspaceTask, 'id' | 'createdAt'>): WorkspaceTask {
    this.initialize();
    const list = safeGetItem<WorkspaceTask[]>(STORAGE_KEYS.WORKSPACE_TASKS, []);
    const entry: WorkspaceTask = {
      ...task,
      id: `wtask-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(entry);
    safeSetItem(STORAGE_KEYS.WORKSPACE_TASKS, list);

    this.logProjectActivity({
      problemId,
      actorRole: 'student',
      actorName: task.assignedTo,
      action: `Created Engineering Task: "${task.title}"`,
      description: `Task assigned to ${task.assignedTo}. Due: ${task.dueDate}. Status: ${task.status.toUpperCase()}.`,
      category: 'milestone',
    });

    return entry;
  },

  updateWorkspaceTask(problemId: string, taskId: string, updates: Partial<WorkspaceTask>): WorkspaceTask | null {
    this.initialize();
    const list = safeGetItem<WorkspaceTask[]>(STORAGE_KEYS.WORKSPACE_TASKS, []);
    const idx = list.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    const oldStatus = list[idx].status;
    list[idx] = { ...list[idx], ...updates };
    if (updates.status === 'completed' && !list[idx].completedAt) {
      list[idx].completedAt = new Date().toISOString();
    }
    safeSetItem(STORAGE_KEYS.WORKSPACE_TASKS, list);

    if (updates.status && updates.status !== oldStatus) {
      this.logProjectActivity({
        problemId,
        actorRole: 'student',
        actorName: list[idx].assignedTo,
        action: `Updated Task Status: "${list[idx].title}" → ${updates.status.toUpperCase()}`,
        description: `Task state transitioned from ${oldStatus.toUpperCase()} to ${updates.status.toUpperCase()}.`,
        category: 'milestone',
      });
    }

    return list[idx];
  },

  // ─── Pilot Deployment Workflow ───────────────────────────────────────────
  getPilotDeployment(problemId: string): PilotDeploymentRequest | null {
    this.initialize();
    const list = safeGetItem<PilotDeploymentRequest[]>(STORAGE_KEYS.PILOT_DEPLOYMENTS, []);
    const found = list.find(p => p.problemId === problemId);
    if (found) return found;

    if (problemId === 'P-1030') {
      const def: PilotDeploymentRequest = {
        id: 'pilot-p1030',
        problemId: 'P-1030',
        initiatedBy: 'faculty',
        location: 'Kanke Block, Ranchi District (Villages: Bero, Itki, Mandar)',
        targetBeneficiaries: '3,200 Smallholder Farmers across 450 Hectares',
        version: 'v0.9-rc2 (Solar Edge Mesh)',
        hardwareRequirements: '50 Optical Smart Traps, 5 Mesh LoRa Gateways, 50 Solar Panels',
        expectedDuration: '45 Days Field Operational Trial',
        testingMetrics: 'Mean Time Between False Alarms, Pest ID Precision (mAP >= 90%), Alert Dispatch Latency (< 120s)',
        responsibleTeams: 'BIT Sindri Team Innovators-07 & AgriTech Jharkhand Field Operations',
        governmentDepartment: 'Department of Agriculture & Farmers Welfare, Govt. of Jharkhand',
        status: 'active',
        requestedAt: '2026-09-12T10:00:00Z',
        approvedAt: '2026-09-15T16:00:00Z',
        resultsSummary: 'Initial 14 days completed: 94.2% pest identification accuracy on Spodoptera frugiperda and Helicoverpa armigera. Zero edge device outages.',
      };
      return def;
    }

    return null;
  },

  requestPilotDeployment(req: PilotDeploymentRequest): PilotDeploymentRequest {
    this.initialize();
    const list = safeGetItem<PilotDeploymentRequest[]>(STORAGE_KEYS.PILOT_DEPLOYMENTS, []);
    const entry: PilotDeploymentRequest = {
      ...req,
      id: req.id || `pilot-${Date.now()}`,
      status: 'under_govt_review',
      requestedAt: new Date().toISOString(),
    };
    list.unshift(entry);
    safeSetItem(STORAGE_KEYS.PILOT_DEPLOYMENTS, list);

    // Notify Government
    this.createNotification({
      userId: 'government',
      role: 'government',
      problemId: entry.problemId,
      type: 'deployment',
      title: 'Pilot Deployment Request Awaiting Review',
      message: `Field pilot requested for Problem ${entry.problemId} at ${entry.location} targeting ${entry.targetBeneficiaries}. Department review required.`,
    });

    // Log Activity Event
    this.logProjectActivity({
      problemId: entry.problemId,
      actorRole: entry.initiatedBy === 'faculty' ? 'faculty' : 'industry',
      actorName: entry.initiatedBy === 'faculty' ? 'Faculty Lead' : 'Industry Co-Pilot',
      action: 'Requested Real-World Field Pilot Deployment',
      description: `Targeting ${entry.location} (${entry.targetBeneficiaries}). Hardware version: ${entry.version}. Submitted for official government clearance.`,
      category: 'pilot',
    });

    return entry;
  },

  updatePilotDeployment(problemId: string, updates: Partial<PilotDeploymentRequest>): PilotDeploymentRequest | null {
    this.initialize();
    const list = safeGetItem<PilotDeploymentRequest[]>(STORAGE_KEYS.PILOT_DEPLOYMENTS, []);
    let idx = list.findIndex(p => p.problemId === problemId);

    if (idx === -1 && problemId === 'P-1030') {
      const def = this.getPilotDeployment('P-1030')!;
      list.push(def);
      idx = list.length - 1;
    }

    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };
    if (updates.status === 'approved' && !list[idx].approvedAt) {
      list[idx].approvedAt = new Date().toISOString();
    }
    if (updates.status === 'completed' && !list[idx].completedAt) {
      list[idx].completedAt = new Date().toISOString();
    }
    safeSetItem(STORAGE_KEYS.PILOT_DEPLOYMENTS, list);

    if (updates.status === 'approved') {
      this.createNotification({
        userId: 'faculty',
        role: 'faculty',
        problemId,
        type: 'deployment',
        title: 'Government Approved Field Pilot Deployment!',
        message: `Official clearance granted for field trial in ${list[idx].location}. Deployment phase is now ACTIVE.`,
      });
      this.createNotification({
        userId: 'industry',
        role: 'industry',
        problemId,
        type: 'deployment',
        title: 'Government Approved Field Pilot Deployment',
        message: `Field deployment clearance granted for Problem ${problemId}.`,
      });
      this.logProjectActivity({
        problemId,
        actorRole: 'government',
        actorName: 'District Agriculture Directorate',
        action: 'Approved Field Pilot Deployment',
        description: `Official authorization granted for 45-day operational field pilot across ${list[idx].location}.`,
        category: 'pilot',
      });
    } else if (updates.status === 'completed') {
      this.logProjectActivity({
        problemId,
        actorRole: 'faculty',
        actorName: 'Faculty Lead & Industry Field Team',
        action: 'Field Pilot Deployment Completed',
        description: `Field testing concluded with documented operational results: ${list[idx].resultsSummary || 'Testing metrics achieved'}.`,
        category: 'pilot',
      });
    }

    return list[idx];
  },

  // ─── Final Government Submission & Scale Validation ───────────────────────
  getFinalGovernmentSubmission(problemId: string): FinalGovernmentSubmission | null {
    this.initialize();
    const list = safeGetItem<FinalGovernmentSubmission[]>(STORAGE_KEYS.FINAL_SUBMISSIONS, []);
    return list.find(s => s.problemId === problemId) || null;
  },

  submitFinalProjectToGovernment(sub: FinalGovernmentSubmission): FinalGovernmentSubmission {
    this.initialize();
    const list = safeGetItem<FinalGovernmentSubmission[]>(STORAGE_KEYS.FINAL_SUBMISSIONS, []);
    const entry: FinalGovernmentSubmission = {
      ...sub,
      id: sub.id || `final-${Date.now()}`,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    list.unshift(entry);
    safeSetItem(STORAGE_KEYS.FINAL_SUBMISSIONS, list);

    this.createNotification({
      userId: 'government',
      role: 'government',
      problemId: entry.problemId,
      type: 'government_action',
      title: 'Final Completed Project Dossier Submitted',
      message: `Complete solution for Problem ${entry.problemId} submitted by ${entry.submittedBy} with verified pilot results. Official scaling validation required.`,
    });

    this.logProjectActivity({
      problemId: entry.problemId,
      actorRole: 'faculty',
      actorName: entry.submittedBy || 'Faculty Lead',
      action: 'Submitted Final Completed Solution to Government',
      description: `Comprehensive project dossier submitted including field pilot telemetry, testing evidence, and scaling recommendations.`,
      category: 'government',
    });

    return entry;
  },

  evaluateFinalProject(
    problemId: string,
    decision: 'validated_for_scale' | 'changes_requested',
    remarks: string,
    approvedDistricts?: string[]
  ): FinalGovernmentSubmission | null {
    this.initialize();
    const list = safeGetItem<FinalGovernmentSubmission[]>(STORAGE_KEYS.FINAL_SUBMISSIONS, []);
    let idx = list.findIndex(s => s.problemId === problemId);

    if (idx === -1) {
      // Create initial submission to record evaluation
      const newEntry: FinalGovernmentSubmission = {
        id: `final-${Date.now()}`,
        problemId,
        submittedBy: 'Dr. Anita Sharma & Team Innovators-07',
        submittedAt: new Date().toISOString(),
        pilotResults: 'Field pilot demonstrated 94.2% detection accuracy and 4-day early infestation warning.',
        testingEvidence: 'Empirical datasets and solar battery telemetry verified by AgriTech Jharkhand.',
        impactSummary: 'Saved an estimated 35% crop losses across pilot hectares in Kanke cluster.',
        futureRecommendations: 'Deploy 500 edge camera trap units across 10 agricultural blocks in Jharkhand.',
        finalPrototypeVersion: 'v1.0-Production-Ready',
        status: decision,
        reviewedAt: new Date().toISOString(),
        officialRemarks: remarks,
        approvedForDistricts: approvedDistricts || ['Ranchi', 'Ramgarh', 'Hazaribagh'],
      };
      list.unshift(newEntry);
      idx = 0;
    } else {
      list[idx].status = decision;
      list[idx].reviewedAt = new Date().toISOString();
      list[idx].officialRemarks = remarks;
      if (approvedDistricts) list[idx].approvedForDistricts = approvedDistricts;
    }

    safeSetItem(STORAGE_KEYS.FINAL_SUBMISSIONS, list);

    // If validated for scale, mark parent Problem as resolved / validated
    if (decision === 'validated_for_scale') {
      const problems = safeGetItem<Problem[]>(STORAGE_KEYS.PROBLEMS, []);
      const pIdx = problems.findIndex(p => p.id === problemId || p.problem_id === problemId);
      if (pIdx >= 0) {
        problems[pIdx].status = 'resolved';
        problems[pIdx].resolutionNotes = `Government approved for multi-district deployment scale across ${(approvedDistricts || ['Ranchi', 'Ramgarh', 'Hazaribagh']).join(', ')}. Official Remarks: ${remarks}`;
        problems[pIdx].resolvedAt = new Date().toISOString();
        safeSetItem(STORAGE_KEYS.PROBLEMS, problems);
      }

      // Notify Citizen
      this.createNotification({
        userId: 'citizen',
        role: 'citizen',
        problemId,
        type: 'success',
        title: 'Your Grievance Has Been Validated & Approved for Scale!',
        message: `Grievance ${problemId} successfully solved through University research, student prototype, industry co-pilot, and field pilot trials. Approved for public deployment by Government of Jharkhand.`,
      });

      // Notify Faculty, University, Industry
      this.createNotification({
        userId: 'faculty',
        role: 'faculty',
        problemId,
        type: 'success',
        title: 'Government Validated Project for District Scaling!',
        message: `Solution for Problem ${problemId} has been officially approved for field scaling across ${(approvedDistricts || ['Ranchi', 'Ramgarh']).join(', ')}.`,
      });

      this.logProjectActivity({
        problemId,
        actorRole: 'government',
        actorName: 'Principal Secretary, Agriculture & Farmers Welfare',
        action: 'Official Government Scaling Validation Granted',
        description: `Validated for deployment scale across ${(approvedDistricts || ['Ranchi', 'Ramgarh', 'Hazaribagh']).join(', ')}. Official remarks: "${remarks}". Problem transitioned to RESOLVED.`,
        category: 'government',
      });
    }

    return list[idx];
  },

  // ─── Real-Time Chronological Activity Timeline ───────────────────────────
  getProjectTimeline(problemId: string): ProjectActivityEvent[] {
    this.initialize();
    const list = safeGetItem<ProjectActivityEvent[]>(STORAGE_KEYS.PROJECT_ACTIVITIES, []);
    const filtered = list.filter(e => e.problemId === problemId);
    if (filtered.length > 0) return filtered;

    // Seed default authentic timeline events for P-1030 if not present
    if (problemId === 'P-1030') {
      const defaultEvents: ProjectActivityEvent[] = [
        {
          id: 'act-p1030-1',
          problemId: 'P-1030',
          date: '2026-08-28',
          timestamp: '2026-08-28T09:15:00Z',
          actorRole: 'faculty',
          actorName: 'Dr. Anita Sharma',
          action: 'Project Progress Update Submitted to University',
          description: 'Updated BIT Sindri Academic Council with 78% research maturity and 86% prototype readiness. Flagged requirement for corporate co-pilot funding and field testbeds.',
          category: 'update',
        },
        {
          id: 'act-p1030-2',
          problemId: 'P-1030',
          date: '2026-09-02',
          timestamp: '2026-09-02T10:00:00Z',
          actorRole: 'faculty',
          actorName: 'Dr. Anita Sharma',
          action: 'Dispatched Industry Collaboration Application',
          description: 'Submitted formal proposal to AgriTech Jharkhand Solutions Pvt. Ltd. requesting ₹3,50,000 co-pilot funding and vegetable cluster camera trap testbeds.',
          category: 'application',
        },
        {
          id: 'act-p1030-3',
          problemId: 'P-1030',
          date: '2026-09-05',
          timestamp: '2026-09-05T14:30:00Z',
          actorRole: 'industry',
          actorName: 'AgriTech Jharkhand Solutions Pvt. Ltd.',
          action: 'Accepted Industry Collaboration Application',
          description: 'Approved ₹3,50,000 funding commitment and assigned Er. Rajesh Vardhan as Industry Mentor for prototype edge model validation.',
          category: 'decision',
        },
        {
          id: 'act-p1030-4',
          problemId: 'P-1030',
          date: '2026-09-08',
          timestamp: '2026-09-08T11:00:00Z',
          actorRole: 'industry',
          actorName: 'AgriTech Jharkhand Solutions Pvt. Ltd.',
          action: 'Released Milestone Tranche 1: ₹1,50,000',
          description: 'Disbursed initial capital for procuring 50 high-resolution macro-lens camera modules and solar charging controllers.',
          category: 'funding',
        },
        {
          id: 'act-p1030-5',
          problemId: 'P-1030',
          date: '2026-09-12',
          timestamp: '2026-09-12T10:00:00Z',
          actorRole: 'faculty',
          actorName: 'Dr. Anita Sharma',
          action: 'Requested 45-Day Field Pilot Deployment',
          description: 'Submitted operational pilot request to Department of Agriculture for testing across 450 hectares in Kanke block.',
          category: 'pilot',
        },
        {
          id: 'act-p1030-6',
          problemId: 'P-1030',
          date: '2026-09-15',
          timestamp: '2026-09-15T16:00:00Z',
          actorRole: 'government',
          actorName: 'District Agriculture Directorate',
          action: 'Approved Field Pilot Deployment',
          description: 'Granted official administrative sanction for operational pilot testing with Bero, Itki, and Mandar Farmer SHGs.',
          category: 'pilot',
        },
      ];
      safeSetItem(STORAGE_KEYS.PROJECT_ACTIVITIES, [...defaultEvents, ...list]);
      return defaultEvents;
    }

    return [];
  },

  logProjectActivity(event: Omit<ProjectActivityEvent, 'id' | 'timestamp' | 'date'>): ProjectActivityEvent {
    this.initialize();
    const list = safeGetItem<ProjectActivityEvent[]>(STORAGE_KEYS.PROJECT_ACTIVITIES, []);
    const now = new Date();
    const entry: ProjectActivityEvent = {
      ...event,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
    };
    list.unshift(entry);
    safeSetItem(STORAGE_KEYS.PROJECT_ACTIVITIES, list.slice(0, 500));
    return entry;
  },
};

