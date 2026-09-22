// All TypeScript interfaces for JanSamadhan Innovation Hub
// Structured to closely match a future real backend schema

import type { EvidenceMetadata } from './evidenceTypes';
import type { GeminiUniversityRecommendation } from './aiReportTypes';

// ─── Auth & Roles ────────────────────────────────────────────────────────────

export type UserRole =
  | 'citizen'
  | 'government'
  | 'university'
  | 'faculty'
  | 'faculty_member'
  | 'student'
  | 'industry'
  | 'industry_partner'
  | 'government_officer'
  | 'government_admin'
  | 'university_admin'
  | 'industry_admin'
  | 'industry_mentor'
  | 'super_admin';

export type UserStatus = 'active' | 'pending_verification' | 'rejected' | 'suspended';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  // Role-specific profile id
  profileId: string;
  status?: UserStatus;
  isVerified?: boolean;
  statusReason?: string;
  rejectionReason?: string;
  organizationName?: string;
  institutionId?: string;
  verificationRequestedAt?: string;
}

// ─── Domain & Location ───────────────────────────────────────────────────────

export type ProblemDomain =
  | 'education'
  | 'healthcare'
  | 'agriculture'
  | 'water'
  | 'sanitation'
  | 'environment'
  | 'energy'
  | 'livelihoods'
  | 'accessibility'
  | 'infrastructure'
  | 'public_services';

export interface District {
  id: string;
  name: string;
  division: string;
  population: number;
  coordinates: { lat: number; lng: number };
  stats?: DistrictStats;
}

export interface DistrictStats {
  districtId: string;
  problemsSubmitted: number;
  problemsVerified: number;
  activeProjects: number;
  deployedSolutions: number;
  citizensImpacted: number;
}

// ─── Problem ─────────────────────────────────────────────────────────────────

export type ProblemStatus =
  | 'submitted'
  | 'ai_analysis'
  | 'government_review'
  | 'verified'
  | 'rejected'
  | 'duplicate'
  | 'matching'
  | 'allocated'
  | 'in_progress'
  | 'In Progress'
  | 'testing'
  | 'pilot'
  | 'deployed'
  | 'resolved'
  | 'Resolved'
  | 'Submitted'
  | 'Verified'
  | 'Rejected'
  | 'Ready for Matching'
  | 'University Assigned'
  | 'University Accepted'
  | 'University Declined'
  | 'Faculty Assigned'
  | 'Faculty Accepted'
  | 'Faculty Declined'
  | 'Team Accepted'
  | 'Team Declined'
  | 'Industry Collaboration';

export type ProblemVerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type ProblemAllocationStatus = 'Not Allocated' | 'Allocated' | 'Accepted' | 'Declined';
export type AllocationType = 'AI Recommended' | 'Government Override';

export type ProblemSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ProblemPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Problem {
  id: string;           // e.g. "JH-2026-00125" or "P-1024"
  problem_id?: string;
  title: string;
  description: string;
  domain: ProblemDomain;
  category?: string;    // alias for domain
  subcategory: string;
  status: ProblemStatus;
  severity: ProblemSeverity;
  priority: ProblemPriority;

  // Lifecycle statuses
  verification_status?: ProblemVerificationStatus;
  allocation_status?: ProblemAllocationStatus;

  // Location
  location?: string;
  districtId: string;
  district: string;
  state?: string;
  block?: string;
  village?: string;
  coordinates?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;

  // Citizen submission
  citizenId: string;
  citizen_id?: string;
  citizenName: string;
  citizen_name?: string;
  submittedAt: string;
  created_at?: string;

  // Impact & Evidence
  affectedPopulation: number;
  affected_people?: number;
  evidence?: string[] | EvidenceMetadata[];   // string[] for legacy, EvidenceMetadata[] for real uploads
  evidenceMetadata?: EvidenceMetadata[];      // structured evidence metadata from real uploads

  // AI analysis
  aiAnalysis?: AIAnalysis;
  aiSummary?: string;
  aiVerified?: boolean;
  aiVerificationStatus?: string;

  // Government Verification
  assigned_government_officer?: string | null;
  verifiedBy?: string | null;
  verified_by?: string | null;
  verifiedAt?: string | null;
  verified_at?: string | null;
  verificationNotes?: string | null;
  governmentDecision?: 'approved' | 'rejected' | 'more_info' | 'duplicate';

  // University Allocation
  assigned_university?: string | null;       // universityId
  assigned_university_name?: string | null;  // university name
  allocation_type?: AllocationType | null;
  allocated_by?: string | null;
  allocated_at?: string | null;
  override_reason?: string | null;
  accepted_at?: string | null;
  decline_reason?: string | null;
  allocation?: Allocation;

  // Faculty & Student Team Assignment
  assigned_faculty?: string | null;
  assigned_faculty_name?: string | null;
  assigned_faculty_dept?: string | null;
  assigned_team?: string | null;
  assigned_team_name?: string | null;
  faculty_status?: 'Pending' | 'Accepted' | 'Declined' | null;
  team_status?: 'Pending' | 'Accepted' | 'Declined' | null;
  project_status?: ProjectAssignmentStatus | string | null;
  project_assignment_id?: string | null;

  // Resolution & Outcome
  resolutionNotes?: string;
  resolvedAt?: string;

  tags: string[];
  updatedAt: string;
  updated_at?: string;
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export interface AIAnalysis {
  problemId: string;
  analyzedAt: string;

  // Classification
  domain: ProblemDomain;
  subcategory: string;
  tags: string[];

  // Scores (0–100)
  priorityScore: number;
  severityLevel: ProblemSeverity;
  confidence: number;          // 0–100%
  duplicateProbability: number; // 0–100%

  // Context
  affectedPopulation: number;
  estimatedImpact: string;
  recommendedExpertise: string[];
  suggestedApproach: string;

  // Matches (if duplicate detected)
  similarProblems?: Array<{ id: string; title: string; similarity: number }>;

  // Extended fields for complete AI report
  summary?: string;
  verification?: import('./aiReportTypes').AIVerification;
  completeness?: import('./aiReportTypes').AICompleteness;
  duplicateDetection?: import('./aiReportTypes').AIDuplicateDetection;
  aiExplanation?: string;
  recommendedAction?: string;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  fullReport?: import('./aiReportTypes').AIReport;

  // Disclaimer: always shown in UI
  disclaimer: string;
}

export * from './aiReportTypes';

// ─── University Match ─────────────────────────────────────────────────────────

export interface MatchingFactors {
  domainRelevance?: number;       // 25%
  universityExpertise?: number;   // 20%
  facultyAvailability?: number;   // 15%
  studentAvailability?: number;   // 10%
  infrastructure?: number;        // 10%
  previousExperience?: number;    // 10%
  geographicRelevance?: number;   // 5%
  projectCapacity?: number;       // 5%

  // Optional aliases for backward compatibility
  domainExpertise?: number;
  location?: number;
  facultyExpertise?: number;
  previousProjects?: number;
  capacity?: number;
}

export interface UniversityMatch {
  problemId: string;
  universityId: string;
  university: University;

  // Overall score 0–100
  matchScore: number;

  // Weighted factor breakdown
  factors: MatchingFactors;

  availableFaculty: number;
  availableStudents: number;
  estimatedTimeline: string; // e.g. "6–8 months"
  aiRecommendation: boolean; // true = AI recommended this one
  rank: number;              // 1 = top match
  explanation?: string;      // Generated explanation based on factor scores
  geminiRecommendation?: GeminiUniversityRecommendation; // Gemini 3.5 Flash-Lite institutional recommendation

  // AI disclaimer applies here too
}

// ─── Allocation ───────────────────────────────────────────────────────────────

export interface Allocation {
  id: string;
  allocation_id?: string;
  problemId: string;
  problem_id?: string;
  universityId: string;
  university_id?: string;
  university: string;
  universityName?: string;
  government_officer_id?: string;
  governmentOfficerId?: string;

  match_score?: number;
  matchScore?: number;
  allocation_type?: AllocationType;
  allocationType?: AllocationType;
  allocation_reason?: string;
  allocationReason?: string;
  override_reason?: string;
  overrideReason?: string;

  allocatedBy: string;             // officer name
  allocated_by?: string;
  allocatedAt: string;
  allocated_at?: string;
  status: 'pending' | 'accepted' | 'declined' | 'rejected' | 'completed';
  accepted_at?: string;
  decline_reason?: string;

  // Audit
  auditLog: AuditEntry[];
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  audit_id?: string;
  entityType?: 'problem' | 'allocation' | 'project' | 'funding' | 'deployment';
  entityId?: string;
  action: string;
  performedBy?: string;
  userId?: string;
  userEmail?: string;
  actor_id?: string;
  actor_role?: UserRole | string;
  role: UserRole;
  timestamp: string;
  details: string;
  problem_id?: string;
  previous_status?: string;
  new_status?: string;
  metadata?: Record<string, any>;
  aiRecommendation?: string;
  governmentDecision?: string;
}

// ─── University & Stakeholders ─────────────────────────────────────────────────

export interface University {
  id: string;
  university_id?: string;
  name: string;
  university_name?: string;
  shortName: string;
  type: 'government' | 'private' | 'deemed' | 'central';
  institution_type?: string;
  city: string;
  location?: string;
  districtId: string;
  district?: string;
  state?: string;
  established: number;
  naacGrade: string;
  accreditation?: string;
  domains: ProblemDomain[];
  research_areas?: string[];
  departments?: string[];
  facultyCount: number;
  faculty_count?: number;
  studentCount: number;
  available_faculty?: number;
  available_students?: number;
  infrastructure?: string[];
  previous_projects?: number;
  project_capacity?: number;
  available_duration?: string;
  activeProjects: number;
  completedProjects: number;
  logo?: string;
  contact: { email: string; phone: string; website: string };
  contact_information?: string;
  verification_status?: 'Verified' | 'Pending' | 'Rejected';
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
  designation: string;
  department: string;
  specializations: string[];
  experience: number;
  publications: number;
  activeProjects: number;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  universityId: string;
  name: string;
  enrollmentNo: string;
  year: number;
  program: string;
  department: string;
  skills: string[];
  cgpa?: number;
  email: string;
  avatar?: string;
  availability: 'available' | 'busy' | 'unavailable';
}

export interface IndustryPartner {
  id: string;
  name: string;
  type: 'startup' | 'msme' | 'corporate' | 'csr' | 'ngo';
  sector: string;
  city: string;
  domains: ProblemDomain[];
  collaborationTypes: Array<'mentorship' | 'funding' | 'technical' | 'testing' | 'deployment'>;
  totalFunding: number;    // in INR
  activeCollaborations: number;
  contact: { email: string; phone: string; website?: string };
  logo?: string;
}

// ─── Project & Team ────────────────────────────────────────────────────────────

export type ProjectPhase =
  | 'problem_understanding'
  | 'field_research'
  | 'requirement_analysis'
  | 'solution_design'
  | 'prototype'
  | 'testing'
  | 'pilot'
  | 'deployment';

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  problemId: string;
  problem: string;
  universityId: string;
  university: string;
  facultyId: string;
  faculty: string;
  teamId: string;
  domain: ProblemDomain;
  status: ProjectStatus;
  currentPhase: ProjectPhase;
  startDate: string;
  estimatedEndDate: string;
  milestones: Milestone[];
  overallProgress: number; // 0–100
  districtId: string;
  district: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  phase: ProjectPhase;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  dueDate: string;
  completedAt?: string;
  progress: number; // 0–100
  documents: string[];
  comments: Comment[];
  deliverables: string[];
}

export interface Team {
  id: string;
  projectId: string;
  name: string;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  studentId: string;
  student: Student;
  role: string;
  joinedAt: string;
  tasks: string[];
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  projectId: string;
  problem_id?: string;
  milestoneId: string;
  title: string;
  description: string;
  assignedTo: string; // studentId
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completedAt?: string;
  tags: string[];
}

// ─── Research & Prototype ─────────────────────────────────────────────────────

export interface ResearchEntry {
  id: string;
  projectId: string;
  type: 'site_visit' | 'survey' | 'interview' | 'data_collection' | 'analysis';
  title: string;
  date: string;
  location?: string;
  participants?: number;
  findings: string;
  photos?: string[];
  documents?: string[];
  conductedBy: string;
  problem_id?: string;
  problemTitle?: string;
}

export interface Prototype {
  id: string;
  projectId: string;
  problem_id?: string;
  problemTitle?: string;
  version: string;
  title: string;
  name?: string;
  description: string;
  architecture?: string;
  techStack: string[];
  screenshots?: string[];
  demoUrl?: string;
  repoUrl?: string;
  readinessScore: number; // 0–100
  status: 'draft' | 'development' | 'testing' | 'ready' | 'deployed' | 'field_pilot' | 'evaluation';
  updatedAt: string;
  fieldTestingStatus?: string;
  governmentFeedback?: string;
}

export interface ProblemEcosystem {
  problem: Problem;
  aiAnalysis?: AIAnalysis;
  assignment?: ProjectAssignment;
  project?: ProjectAssignment;
  team?: StudentTeam;
  squad?: StudentTeam;
  research?: ResearchEntry[];
  prototype?: Prototype;
  collaboration?: CollaborationRequest[];
  industryCollaboration?: CollaborationRequest | null;
  industryCommitment?: IndustryCommitment | null;
  pilotDeployment?: PilotDeploymentRequest | null;
  finalSubmission?: FinalGovernmentSubmission | null;
  funding?: FundingRequest;
  lifecycleStage: string;
}

// ─── Collaboration & Funding ───────────────────────────────────────────────────

export type CollaborationStatus =
  | 'not_requested'
  | 'support_required'
  | 'ai_matching'
  | 'industry_selected'
  | 'pending_spoc'
  | 'returned_to_faculty'
  | 'submitted_to_industry'
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'active'
  | 'meeting_requested'
  | 'mentoring'
  | 'funding_offered'
  | 'completed';

export interface CollaborationRequest {
  id: string;
  applicationId?: string; // Official ID generated when University SPOC dispatches e.g. IND-REQ-1029
  projectId: string;
  problem_id?: string;
  problemId?: string;
  project: string;
  projectTitle?: string;
  industryPartnerId: string;
  industryPartner: string;
  facultyId?: string;
  facultyName?: string;
  facultyEmail?: string;
  universityId?: string;
  universityName?: string;
  spocId?: string;
  spocName?: string;
  spocNotes?: string;
  spocFeedback?: string;
  spocReviewStatus?: 'pending' | 'approved' | 'returned';
  spocDispatchedAt?: string;
  studentTeamId?: string;
  studentTeamName?: string;
  researchId?: string;
  prototypeId?: string;
  currentStage?: string;
  requestedFunding?: number;
  fundingRequested?: number;
  durationMonths?: number;
  supportTypes?: string[];
  supportAreas?: string[];
  supportRequirements?: string[];
  projectSummary?: string;
  whyNeeded?: string;
  aiMatchScore?: number;
  aiMatchReasons?: string[];
  requestType: Array<'mentorship' | 'funding' | 'technical' | 'testing' | string>;
  status: CollaborationStatus;
  applicationStatus?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'active';
  requestedAt: string;
  submittedAt?: string;
  respondedAt?: string;
  message: string;
  response?: string;
  rejectionReason?: string;
  rejectionFeedback?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  expectedOutcome?: string;
  expectedTimeline?: string;
  additionalRequirements?: string;
  meetingDate?: string;
  industryMentor?: string;
  industryMentorId?: string;
  committedFunding?: number;
  commitment?: IndustryCommitment | null;
  technicalSupportDetails?: string;
  fieldTestingDetails?: string;
  deploymentSupportDetails?: string;
  expectedStartDate?: string;
  expectedDuration?: string;
}

export interface FundingRequest {
  id: string;
  projectId: string;
  problem_id?: string;
  project: string;
  industryPartnerId: string;
  industryPartner: string;
  requestedAmount: number;  // INR
  approvedAmount?: number;
  utilizedAmount?: number;
  status: 'pending' | 'approved' | 'partially_approved' | 'rejected' | 'completed';
  purpose: string;
  milestones: FundingMilestone[];
  requestedAt: string;
  approvedAt?: string;
}

export interface FundingMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'released' | 'utilized';
}

// ─── Pilot & Deployment ────────────────────────────────────────────────────────

export type PilotStage = 'planning' | 'installation' | 'testing' | 'live';

export interface Pilot {
  id: string;
  projectId: string;
  stage: PilotStage;
  location: string;
  districtId: string;
  startDate: string;
  endDate?: string;
  metrics: PilotMetric[];
  successScore: number; // 0–100
  beneficiaries: number;
  feedback: Feedback[];
  status: 'active' | 'completed' | 'failed';
}

export interface PilotMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  pilotId: string;
  problem: string;
  location: string;
  districtId: string;
  deployedAt: string;
  responsibleOrg: string;
  techPartner: string;
  maintenanceStatus: 'active' | 'scheduled' | 'pending';
  maintenanceNextDate?: string;
  citizensImpacted: number;
  status: 'live' | 'scaling' | 'maintained';
  governmentApprovedBy: string;
  approvedAt: string;
  metrics: PilotMetric[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'ai_update'
  | 'government_action'
  | 'collaboration'
  | 'funding'
  | 'deployment'
  | 'assignment'
  | 'status_change'
  | 'alert';

export interface Notification {
  id: string;
  userId: string;
  role?: string;
  problemId?: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

export interface ImpactMetric {
  label: string;
  value: number;
  unit?: string;
  trend?: number; // % change
  description?: string;
}

export interface Feedback {
  id: string;
  entityType: 'project' | 'pilot' | 'deployment';
  entityId: string;
  fromRole: UserRole;
  fromName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

// ─── Verification & Role Profiles ─────────────────────────────────────────────

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'info_requested';

export interface VerificationDocument {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  organizationName?: string;
  institutionId?: string;
  submittedAt: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  reviewerNotes?: string;
  requestedInfo?: string;
}

export interface CapabilityMatrix {
  domains: ProblemDomain[];
  labFacilities: string[];
  researchFocus: string[];
  rAndDCapacityScore: number; // 0-100
  patentsCount?: number;
  incubatorsAvailable?: boolean;
  specializedEquipment?: string[];
}

export interface CitizenProfile {
  id: string;
  userId: string;
  state: string;
  districtId: string;
  block?: string;
  village?: string;
  pincode?: string;
  aadhaarLast4?: string;
  isPhoneVerified: boolean;
  occupation?: string;
  preferredLanguage: string;
  problemsSubmittedCount: number;
}

export interface GovernmentProfile {
  id: string;
  userId: string;
  officialId: string;
  designation: string;
  department: string;
  ministry?: string;
  districtId: string;
  state: string;
  jurisdiction: 'district' | 'state' | 'central';
  permissions: string[];
  officialEmail: string;
  idCardDocumentId?: string;
}

export interface UniversityProfile {
  id: string;
  userId: string;
  universityId: string;
  universityName: string;
  aisheCode: string;
  accreditationGrade: string;
  establishedYear: number;
  website: string;
  address: string;
  state: string;
  districtId: string;
  capabilityMatrix: CapabilityMatrix;
  adminContactName: string;
  adminContactPhone: string;
  adminOfficialEmail: string;
  authLetterDocId?: string;
}

export interface FacultyProfile {
  id: string;
  userId: string;
  universityId: string;
  universityName: string;
  employeeId: string;
  designation: string;
  department: string;
  specializations: string[];
  publicationsCount: number;
  experienceYears: number;
  institutionalEmail: string;
  isApprovedByUniversity: boolean;
  idCardDocId?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  universityId: string;
  universityName: string;
  enrollmentNo: string;
  degree: string;
  department: string;
  yearOfStudy: number;
  expectedGraduationYear: number;
  skills: string[];
  cgpa?: number;
  isApprovedByUniversity: boolean;
  studentIdDocId?: string;
}

export interface IndustryProfile {
  id: string;
  userId: string;
  cinOrRegistrationNo: string;
  companyName: string;
  sector: string;
  domains: ProblemDomain[];
  csrBudgetAnnual?: number; // in INR
  collaborationInterests: Array<'mentorship' | 'funding' | 'technical' | 'testing' | 'deployment'>;
  officialWebsite: string;
  pointOfContactName: string;
  pointOfContactRole: string;
  companyAddress: string;
  state: string;
  dunsNumber?: string;
}

export interface AuditLogEntry {
  id: string;
  audit_id?: string;
  timestamp: string;
  action: string;
  userId: string;
  userEmail: string;
  performedBy?: string;
  actor_id?: string;
  actor_role?: string;
  role: UserRole;
  details: string;
  problem_id?: string;
  previous_status?: string;
  new_status?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// ─── University → Faculty → Student Team Workflow Types ───────────────────────

export type ProjectAssignmentStatus =
  | 'WAITING_FOR_UNIVERSITY'
  | 'UNIVERSITY_ACCEPTED'
  | 'UNIVERSITY_DECLINED'
  | 'FACULTY_MATCHING'
  | 'FACULTY_ASSIGNED'
  | 'WAITING_FOR_FACULTY'
  | 'FACULTY_ACCEPTED'
  | 'FACULTY_DECLINED'
  | 'TEAM_MATCHING'
  | 'TEAM_ASSIGNED'
  | 'WAITING_FOR_TEAM'
  | 'TEAM_ACCEPTED'
  | 'TEAM_DECLINED'
  | 'PROJECT_ACTIVE'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface FacultyMember {
  faculty_id: string;
  id?: string;
  user_id: string;
  university_id: string;
  university_name?: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  specialization: string;
  expertise: string[];
  research_areas: string[];
  technical_skills: string[];
  domain_expertise: string[];
  years_of_experience: number;
  qualification: string;
  current_projects: number;
  maximum_active_projects: number;
  current_active_projects: number;
  availability_status: 'Available' | 'Busy' | 'On Leave' | 'Unavailable';
  available_from?: string;
  preferred_problem_categories: string[];
  preferred_project_types: string[];
  location: string;
  languages?: string[];
  faculty_verification_status: 'Verified' | 'Pending' | 'Rejected';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMemberInfo {
  student_id: string;
  name: string;
  email: string;
  role: string;
  year: number;
  department: string;
  skills: string[];
}

export interface StudentTeam {
  team_id: string;
  id?: string;
  university_id: string;
  university_name?: string;
  team_name: string;
  team_leader_id: string;
  team_leader_name: string;
  team_members: TeamMemberInfo[];
  members?: TeamMemberInfo[];
  leader_name?: string;
  department: string;
  branch: string;
  year: string;
  year_of_study?: string;
  skills: string[];
  technical_skills: string[];
  domain_expertise: string[];
  domain_interests?: string[];
  projects_completed: number;
  past_hackathons_participated?: number;
  current_active_projects: number;
  maximum_active_projects: number;
  availability_status: 'Available' | 'Busy' | 'Unavailable';
  is_available?: boolean;
  preferred_problem_categories: string[];
  preferred_technology: string[];
  faculty_mentor_id?: string | null;
  team_verification_status: 'Verified' | 'Pending' | 'Rejected';
  verification_status?: 'Verified' | 'Pending' | 'Rejected';
  created_at?: string;
  updated_at?: string;
}

export interface FacultyMatchingFactors {
  domainRelevance: number;        // 25%
  researchExpertise: number;      // 20%
  technicalSkills: number;        // 15%
  departmentRelevance: number;    // 10%
  previousExperience: number;     // 10%
  availability: number;           // 10%
  currentWorkload: number;        // 5%
  projectPreference: number;      // 5%
}

export interface FacultyMatchResult {
  faculty_id: string;
  faculty: FacultyMember;
  matchScore: number;
  factors: FacultyMatchingFactors;
  explanation: string;
  aiRecommendation: boolean;
  rank: number;
}

export interface TeamMatchingFactors {
  technicalSkillMatch: number;    // 25%
  domainExpertise: number;        // 20%
  problemComplexityFit: number;   // 15%
  previousExperience: number;     // 10%
  availability: number;           // 10%
  currentWorkload: number;        // 5%
  technologyMatch: number;        // 10%
  teamCapacity: number;           // 5%
}

export interface TeamMatchResult {
  team_id: string;
  team: StudentTeam;
  matchScore: number;
  factors: TeamMatchingFactors;
  explanation: string;
  aiRecommendation: boolean;
  rank: number;
}

export interface AssignmentMilestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'changes_requested';
  submitted_at?: string;
  reviewed_at?: string;
  deliverables?: string[];
  student_notes?: string;
  faculty_remarks?: string;
  progress_percentage: number;
}

export interface ProjectAssignment {
  assignment_id: string;
  id?: string;
  problem_id: string;
  university_id: string;
  university_name?: string;
  faculty_id: string;
  faculty_name: string;
  faculty_department?: string;
  faculty_email?: string;
  faculty_expertise?: string[];
  team_id: string;
  team_name: string;
  team_department?: string;
  team_leader_name?: string;
  team_skills?: string[];
  assigned_by: string;
  assigned_at: string;
  faculty_match_score: number;
  team_match_score: number;
  overall_match_score: number;
  assignment_type: 'AI Recommended' | 'University Override';
  override_reason?: string;
  faculty_status: 'Pending' | 'Accepted' | 'Declined';
  faculty_response_at?: string;
  faculty_accepted_at?: string;
  faculty_decline_reason?: string;
  team_status: 'Pending' | 'Accepted' | 'Declined';
  team_response_at?: string;
  team_accepted_at?: string;
  team_decline_reason?: string;
  project_status: ProjectAssignmentStatus;
  milestones: AssignmentMilestone[];
  progress: number;
  created_at: string;
  updated_at: string;
}

// ─── Faculty → University Progress Update ────────────────────────────────────

export interface UniversityProjectUpdate {
  id: string;
  problemId: string;
  facultyId: string;
  facultyName: string;
  universityId: string;
  universityName?: string;
  researchProgress: number;     // 0-100
  prototypeProgress: number;    // 0-100
  studentProgress: number;      // 0-100
  currentStage: string;
  remainingWork: string;
  technicalChallenges?: string;
  industrySupportRequired: string[];
  reason: string;
  expectedTimeline: string;
  submittedAt: string;
  reviewedByUniversity?: boolean;
  reviewedAt?: string;
}

// ─── Real-Time Workspace Tasks ───────────────────────────────────────────────

export type WorkspaceTaskStatus = 'todo' | 'in_progress' | 'review' | 'approved' | 'completed';

export interface WorkspaceTask {
  id: string;
  problemId: string;
  projectId?: string;
  title: string;
  description: string;
  assignedTo: string;          // e.g. "Student Squad - Team Innovators-07"
  assignedRole?: 'student' | 'faculty' | 'industry' | string;
  assignedBy?: string;
  category?: 'hardware' | 'software' | 'testing' | 'field_trial' | 'compliance' | string;
  mentor?: string;              // e.g. "Industry Technical Expert"
  facultyReviewRequired?: boolean;
  status: WorkspaceTaskStatus;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

// ─── Industry Commitment & Funding Tracker ───────────────────────────────────

export type FundingTrancheStatus = 'committed' | 'approved' | 'released' | 'partially_utilized' | 'fully_utilized';

export interface IndustryCommitment {
  id: string;
  problemId: string;
  industryPartnerId: string;
  industryPartnerName: string;
  industryMentorId: string;
  industryMentorName: string;
  industryMentorRole: string;
  fundingCommitted: number;
  fundingCommitment?: number;
  fundingApproved: number;
  fundingReleased: number;
  fundingUtilized: number;
  fundingStatus: FundingTrancheStatus;
  mentorName?: string;
  mentorDesignation?: string;
  fieldTestingSites?: string;
  technicalSupportDetails?: string;
  fieldTestingDetails?: string;
  deploymentSupportDetails?: string;
  startDate: string;
  durationMonths: number;
  confirmedAt: string;
}

// ─── Pilot Deployment Request & Execution ─────────────────────────────────────

export type PilotDeploymentStatus =
  | 'draft'
  | 'requested'
  | 'under_govt_review'
  | 'approved'
  | 'active'
  | 'completed'
  | 'scaling_approved';

export interface PilotDeploymentRequest {
  id: string;
  problemId: string;
  projectId?: string;
  partnerId?: string;
  partnerName?: string;
  universityName?: string;
  facultyName?: string;
  targetLocation?: string;
  durationDays?: number;
  sampleSizeOrCoverage?: string;
  requiredGovtSupport?: string;
  successMetrics?: string;
  safetyProtocol?: string;
  requestedBy?: 'faculty' | 'industry';
  initiatedBy?: 'faculty' | 'industry';
  location?: string;
  targetBeneficiaries?: string;
  version?: string;
  hardwareRequirements?: string;
  expectedDuration?: string;
  testingMetrics?: string;
  responsibleTeams?: string;
  governmentDepartment?: string;
  status: PilotDeploymentStatus;
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  resultsSummary?: string;
  officialNotes?: string;
}

// ─── Final Government Submission & Scale Validation ───────────────────────────

export type GovernmentSubmissionStatus =
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'validated_for_scale'
  | 'resolved'
  | 'scaling_approved';

export interface FinalGovernmentSubmission {
  id: string;
  problemId: string;
  projectId?: string;
  partnerId?: string;
  partnerName?: string;
  universityName?: string;
  facultyName?: string;
  submittedBy?: string;
  submittedAt: string;
  pilotResults?: string;
  testingEvidence?: string;
  impactSummary?: string;
  futureRecommendations?: string;
  finalPrototypeVersion?: string;
  executiveSummary?: string;
  verifiedOutcomes?: string;
  costPerBeneficiary?: number;
  pilotTelemetryReportUrl?: string;
  scalingFeasibility?: 'ready_to_scale' | 'needs_minor_refinement' | 'pilot_expansion_recommended' | string;
  recommendedRolloutTimeline?: string;
  status: GovernmentSubmissionStatus;
  reviewedAt?: string;
  officialRemarks?: string;
  approvedForDistricts?: string[];
}

// ─── Project Activity Event ──────────────────────────────────────────────────

export interface ProjectActivityEvent {
  id: string;
  problemId: string;
  date: string;
  timestamp: string;
  actorRole: 'citizen' | 'government' | 'university' | 'faculty' | 'student' | 'industry';
  actorName: string;
  action: string;
  description: string;
  category: 'update' | 'application' | 'decision' | 'milestone' | 'prototype' | 'funding' | 'pilot' | 'government';
}



