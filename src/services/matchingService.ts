// Matching Engine for University -> Faculty -> Student Team Workflow
import type {
  Problem,
  FacultyMember,
  StudentTeam,
  FacultyMatchResult,
  TeamMatchResult,
  FacultyMatchingFactors,
  TeamMatchingFactors,
  ProjectAssignment,
  AssignmentMilestone,
} from '../types';
import { db } from './db';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const FACULTY_MATCHING_WEIGHTS = {
  domainRelevance: 25,
  researchExpertise: 20,
  technicalSkills: 15,
  departmentRelevance: 10,
  previousExperience: 10,
  availability: 10,
  currentWorkload: 5,
  projectPreference: 5,
};

export const TEAM_MATCHING_WEIGHTS = {
  technicalSkillMatch: 25,
  domainExpertise: 20,
  problemComplexityFit: 15,
  previousExperience: 10,
  availability: 10,
  currentWorkload: 5,
  technologyMatch: 10,
  teamCapacity: 5,
};

function calculateFacultyScores(
  problem: Problem,
  faculty: FacultyMember
): { score: number; factors: FacultyMatchingFactors; explanation: string } {
  const pDomain = (problem.domain || '').toLowerCase();
  const pCategory = (problem.category || '').toLowerCase();
  const pSub = (problem.subcategory || '').toLowerCase();
  const pDesc = (problem.description || '').toLowerCase();

  // 1. Problem Domain Relevance (25%)
  let domainRelevance = 50;
  if (
    faculty.domain_expertise.some(
      (d) => d.toLowerCase().includes(pDomain) || pCategory.toLowerCase().includes(d.toLowerCase())
    )
  ) {
    domainRelevance = 96;
  } else if (faculty.preferred_problem_categories.some((c) => c.toLowerCase().includes(pCategory.toLowerCase()))) {
    domainRelevance = 90;
  }

  // 2. Research Expertise (20%)
  let researchExpertise = 55;
  const researchStr = faculty.research_areas.join(' ').toLowerCase();
  if (researchStr.includes(pSub) || researchStr.includes('drainage') || researchStr.includes('water')) {
    researchExpertise = 94;
  } else if (faculty.research_areas.length > 2) {
    researchExpertise = 85;
  }

  // 3. Technical Skills (15%)
  let technicalSkills = 60;
  const skillsStr = faculty.technical_skills.join(' ').toLowerCase();
  if (skillsStr.includes('hec-ras') || skillsStr.includes('hydraulic') || skillsStr.includes('iot')) {
    technicalSkills = 90;
  } else if (faculty.technical_skills.length >= 3) {
    technicalSkills = 82;
  }

  // 4. Department Relevance (10%)
  let departmentRelevance = 50;
  const dept = faculty.department.toLowerCase();
  if (dept.includes('civil') || dept.includes('environmental') || dept.includes('water')) {
    departmentRelevance = 95;
  } else if (dept.includes('computer') || dept.includes('information')) {
    departmentRelevance = 80;
  }

  // 5. Previous Project Experience (10%)
  const expYears = faculty.years_of_experience;
  let previousExperience = Math.min(65 + expYears * 2, 95);

  // 6. Availability (10%)
  let availability = 50;
  if (faculty.availability_status === 'Available') availability = 90;
  else if (faculty.availability_status === 'Busy') availability = 60;

  // 7. Current Workload (5%)
  const remaining = Math.max(faculty.maximum_active_projects - faculty.current_active_projects, 0);
  let currentWorkload = Math.min(60 + remaining * 14, 92);

  // 8. Project Preference (5%)
  let projectPreference = 70;
  if (faculty.preferred_problem_categories.some((c) => pCategory.toLowerCase().includes(c.toLowerCase()))) {
    projectPreference = 92;
  }

  const score = Math.round(
    (domainRelevance * FACULTY_MATCHING_WEIGHTS.domainRelevance +
      researchExpertise * FACULTY_MATCHING_WEIGHTS.researchExpertise +
      technicalSkills * FACULTY_MATCHING_WEIGHTS.technicalSkills +
      departmentRelevance * FACULTY_MATCHING_WEIGHTS.departmentRelevance +
      previousExperience * FACULTY_MATCHING_WEIGHTS.previousExperience +
      availability * FACULTY_MATCHING_WEIGHTS.availability +
      currentWorkload * FACULTY_MATCHING_WEIGHTS.currentWorkload +
      projectPreference * FACULTY_MATCHING_WEIGHTS.projectPreference) /
      100
  );

  const factors: FacultyMatchingFactors = {
    domainRelevance,
    researchExpertise,
    technicalSkills,
    departmentRelevance,
    previousExperience,
    availability,
    currentWorkload,
    projectPreference,
  };

  const topStrength =
    domainRelevance >= 90
      ? 'strong domain expertise in drainage systems and water resources'
      : researchExpertise >= 90
      ? 'specialized research alignment'
      : 'relevant engineering skills';

  const explanation = `Recommended because the faculty member has ${topStrength}, ${faculty.years_of_experience} years of experience, and project capacity available (${faculty.current_active_projects}/${faculty.maximum_active_projects} active).`;

  return { score, factors, explanation };
}

function calculateTeamScores(
  problem: Problem,
  team: StudentTeam
): { score: number; factors: TeamMatchingFactors; explanation: string } {
  const pCategory = (problem.category || '').toLowerCase();
  const pSub = (problem.subcategory || '').toLowerCase();

  // 1. Technical Skill Match (25%)
  let technicalSkillMatch = 55;
  const techStr = team.technical_skills.join(' ').toLowerCase();
  if (techStr.includes('iot') && (techStr.includes('python') || techStr.includes('hydraulic'))) {
    technicalSkillMatch = 92;
  } else if (team.technical_skills.length >= 4) {
    technicalSkillMatch = 84;
  }

  // 2. Domain Expertise (20%)
  let domainExpertise = 50;
  if (
    team.domain_expertise.some(
      (d) => d.toLowerCase().includes('water') || d.toLowerCase().includes('drainage') || d.toLowerCase().includes('smart')
    )
  ) {
    domainExpertise = 90;
  }

  // 3. Problem Complexity Fit (15%)
  let problemComplexityFit = 75;
  if (team.year.includes('3rd') || team.year.includes('4th')) {
    problemComplexityFit = 90;
  }

  // 4. Previous Experience (10%)
  let previousExperience = Math.min(60 + team.projects_completed * 10, 95);

  // 5. Availability (10%)
  let availability = team.availability_status === 'Available' ? 90 : 55;

  // 6. Current Workload (5%)
  const loadRemaining = Math.max(team.maximum_active_projects - team.current_active_projects, 0);
  let currentWorkload = Math.min(60 + loadRemaining * 15, 90);

  // 7. Technology Match (10%)
  let technologyMatch = 65;
  const prefTech = team.preferred_technology.join(' ').toLowerCase();
  if (prefTech.includes('iot') || prefTech.includes('telemetry') || prefTech.includes('cad')) {
    technologyMatch = 94;
  }

  // 8. Team Capacity (5%)
  let teamCapacity = Math.min(70 + team.team_members.length * 5, 92);

  const score = Math.round(
    (technicalSkillMatch * TEAM_MATCHING_WEIGHTS.technicalSkillMatch +
      domainExpertise * TEAM_MATCHING_WEIGHTS.domainExpertise +
      problemComplexityFit * TEAM_MATCHING_WEIGHTS.problemComplexityFit +
      previousExperience * TEAM_MATCHING_WEIGHTS.previousExperience +
      availability * TEAM_MATCHING_WEIGHTS.availability +
      currentWorkload * TEAM_MATCHING_WEIGHTS.currentWorkload +
      technologyMatch * TEAM_MATCHING_WEIGHTS.technologyMatch +
      teamCapacity * TEAM_MATCHING_WEIGHTS.teamCapacity) /
      100
  );

  const factors: TeamMatchingFactors = {
    technicalSkillMatch,
    domainExpertise,
    problemComplexityFit,
    previousExperience,
    availability,
    currentWorkload,
    technologyMatch,
    teamCapacity,
  };

  const explanation = `Strong interdisciplinary capability in ${team.skills.slice(0, 3).join(', ')} with ${team.projects_completed} completed innovations and available project capacity.`;

  return { score, factors, explanation };
}

export const matchingService = {
  async matchProblemToFaculty(problem: Problem, universityId: string): Promise<FacultyMatchResult[]> {
    await delay(350);
    const allFaculty = db.getFaculty(universityId);

    // Business Rules:
    // 1. Must be verified
    // 2. Must not be Unavailable
    // 3. Must not exceed maximum active projects
    const eligible = allFaculty.filter(
      (f) =>
        f.faculty_verification_status === 'Verified' &&
        f.availability_status !== 'Unavailable' &&
        f.current_active_projects < f.maximum_active_projects
    );

    const scored = eligible.map((faculty) => {
      const { score, factors, explanation } = calculateFacultyScores(problem, faculty);
      return {
        faculty_id: faculty.faculty_id,
        faculty,
        matchScore: score,
        factors,
        explanation,
        aiRecommendation: false,
        rank: 0,
      };
    });

    // Rank descending
    scored.sort((a, b) => b.matchScore - a.matchScore);

    scored.forEach((item, idx) => {
      item.rank = idx + 1;
      item.aiRecommendation = idx === 0;
    });

    return scored;
  },

  async matchProblemToTeams(
    problem: Problem,
    universityId: string,
    facultyMentorId?: string
  ): Promise<TeamMatchResult[]> {
    await delay(350);
    const allTeams = db.getStudentTeams(universityId);

    // Business Rules:
    // 1. Must be verified
    // 2. Must not be Unavailable
    // 3. Must not exceed maximum active projects
    const eligible = allTeams.filter(
      (t) =>
        t.team_verification_status === 'Verified' &&
        t.availability_status !== 'Unavailable' &&
        t.current_active_projects < t.maximum_active_projects
    );

    const scored = eligible.map((team) => {
      const { score, factors, explanation } = calculateTeamScores(problem, team);
      return {
        team_id: team.team_id,
        team,
        matchScore: score,
        factors,
        explanation,
        aiRecommendation: false,
        rank: 0,
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    scored.forEach((item, idx) => {
      item.rank = idx + 1;
      item.aiRecommendation = idx === 0;
    });

    return scored;
  },

  async assignFacultyAndTeam(params: {
    problemId: string;
    universityId: string;
    facultyId: string;
    teamId: string;
    assignedBy: string;
    facultyMatchScore: number;
    teamMatchScore: number;
    assignmentType: 'AI Recommended' | 'University Override';
    overrideReason?: string;
  }): Promise<ProjectAssignment> {
    await delay(300);

    const problem = db.getProblemById(params.problemId);
    if (!problem) throw new Error(`Problem ${params.problemId} not found.`);

    // Enforce business rule: only unassigned faculty & team for this problem
    const existing = db.getProjectAssignmentByProblemId(params.problemId);
    if (existing && existing.project_status === 'PROJECT_ACTIVE') {
      throw new Error(`Problem ${params.problemId} already has an active project assignment.`);
    }

    const faculty = db.getFacultyById(params.facultyId);
    if (!faculty) throw new Error(`Faculty ${params.facultyId} not found.`);
    if (faculty.current_active_projects >= faculty.maximum_active_projects) {
      throw new Error(`Faculty ${faculty.name} has reached maximum active projects capacity.`);
    }

    const team = db.getStudentTeamById(params.teamId);
    if (!team) throw new Error(`Student Team ${params.teamId} not found.`);
    if (team.current_active_projects >= team.maximum_active_projects) {
      throw new Error(`Student Team ${team.team_name} has reached maximum project capacity.`);
    }

    const overall = Math.round((params.facultyMatchScore + params.teamMatchScore) / 2);
    const assignmentId = `asgn-${Date.now()}-${params.problemId}`;
    const now = new Date().toISOString();

    const initialMilestones: AssignmentMilestone[] = [
      {
        id: `ms-1-${params.problemId}`,
        title: 'Phase 1: Field Site Inspection & Silt Sump Telemetry Design',
        description: 'Ground survey of storm drainage channels in Ranchi, silt depth assessment, and IoT sensor schematic.',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        progress_percentage: 20,
      },
      {
        id: `ms-2-${params.problemId}`,
        title: 'Phase 2: Hydraulic CAD Modeling & Sensor Mesh Integration',
        description: 'HEC-RAS stormwater simulation and LoRaWAN silt telemetry testbed deployment.',
        due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        progress_percentage: 0,
      },
      {
        id: `ms-3-${params.problemId}`,
        title: 'Phase 3: Municipal Pilot Demonstration & Validation Report',
        description: 'Final field validation in coordination with Ranchi Municipal Corporation and Government Officers.',
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        progress_percentage: 0,
      },
    ];

    const assignment: ProjectAssignment = {
      assignment_id: assignmentId,
      id: assignmentId,
      problem_id: params.problemId,
      university_id: params.universityId,
      university_name: faculty.university_name || 'BIT Sindri',
      faculty_id: faculty.faculty_id,
      faculty_name: faculty.name,
      faculty_department: faculty.department,
      faculty_email: faculty.email,
      team_id: team.team_id,
      team_name: team.team_name,
      team_department: team.department,
      assigned_by: params.assignedBy,
      assigned_at: now,
      faculty_match_score: params.facultyMatchScore,
      team_match_score: params.teamMatchScore,
      overall_match_score: overall,
      assignment_type: params.assignmentType,
      override_reason: params.overrideReason,
      faculty_status: 'Pending',
      team_status: 'Pending',
      project_status: 'FACULTY_ASSIGNED',
      milestones: initialMilestones,
      progress: 10,
      created_at: now,
      updated_at: now,
    };

    db.createProjectAssignment(assignment);

    // Update Problem Record with single-source-of-truth assigned faculty & team
    db.updateProblem(params.problemId, {
      assigned_faculty: faculty.faculty_id,
      assigned_faculty_name: faculty.name,
      assigned_faculty_dept: faculty.department,
      assigned_team: team.team_id,
      assigned_team_name: team.team_name,
      faculty_status: 'Pending',
      team_status: 'Pending',
      project_status: 'FACULTY_ASSIGNED',
      status: 'Faculty Assigned',
    });

    // Audit log
    db.logAction(
      'FACULTY_AND_TEAM_ASSIGNED',
      { id: 'univ-admin', email: 'admin@bitsindri.ac.in', role: 'university', name: params.assignedBy },
      `Assigned Faculty Mentor (${faculty.name}) and Student Team (${team.team_name}) to Problem ${problem.id}`,
      {
        problem_id: problem.id,
        assignment_id: assignmentId,
        faculty_id: faculty.faculty_id,
        team_id: team.team_id,
        faculty_match_score: params.facultyMatchScore,
        team_match_score: params.teamMatchScore,
        assignment_type: params.assignmentType,
        override_reason: params.overrideReason,
        previous_status: problem.status,
        new_status: 'FACULTY_ASSIGNED',
      }
    );

    // Notifications
    db.createNotification({
      userId: faculty.user_id,
      type: 'assignment',
      title: 'New Project Mentorship Assignment',
      message: `You have been nominated as Project Mentor for "${problem.title}" (${problem.id}). Match Score: ${params.facultyMatchScore}%. Please review and accept.`,
      link: '/faculty/dashboard',
    });

    db.createNotification({
      userId: team.team_leader_id,
      type: 'assignment',
      title: 'New Problem Assigned to Your Team',
      message: `Your team (${team.team_name}) has been assigned to work on "${problem.title}" (${problem.id}) under mentor ${faculty.name}. Please review and accept.`,
      link: '/student/dashboard',
    });

    if (problem.citizenId) {
      db.createNotification({
        userId: problem.citizenId,
        type: 'status_change',
        title: 'Faculty & Student Team Assigned',
        message: `Your problem "${problem.title}" (${problem.id}) has been assigned to mentor ${faculty.name} and ${team.team_name} at ${faculty.university_name}.`,
        link: `/citizen/track?problemId=${problem.id}`,
      });
    }

    return assignment;
  },

  async respondToFacultyAssignment(
    assignmentId: string,
    response: 'Accepted' | 'Declined',
    reason?: string,
    actorName = 'Dr. Anita Sharma'
  ): Promise<ProjectAssignment> {
    await delay(300);
    const assignment = db.getProjectAssignmentById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found.`);

    const now = new Date().toISOString();

    if (response === 'Accepted') {
      const willBeActive = assignment.team_status === 'Accepted';
      const updatedStatus = willBeActive ? 'PROJECT_ACTIVE' : 'FACULTY_ACCEPTED';

      const updated = db.updateProjectAssignment(assignmentId, {
        faculty_status: 'Accepted',
        faculty_response_at: now,
        project_status: updatedStatus,
      });

      // Update problem record single source of truth
      db.updateProblem(assignment.problem_id, {
        faculty_status: 'Accepted',
        status: willBeActive ? 'In Progress' : 'Faculty Accepted',
      });

      // Update faculty current active projects count
      const faculty = db.getFacultyById(assignment.faculty_id);
      if (faculty) {
        db.updateFaculty(faculty.faculty_id, {
          current_active_projects: faculty.current_active_projects + 1,
          availability_status:
            faculty.current_active_projects + 1 >= faculty.maximum_active_projects ? 'Busy' : 'Available',
        });
      }

      db.logAction(
        'FACULTY_ACCEPTED',
        { id: assignment.faculty_id, email: assignment.faculty_email || '', role: 'faculty', name: actorName },
        `Faculty Mentor (${assignment.faculty_name}) accepted assignment for Problem ${assignment.problem_id}`,
        {
          problem_id: assignment.problem_id,
          assignment_id: assignmentId,
          previous_status: assignment.project_status,
          new_status: updatedStatus,
        }
      );

      db.createNotification({
        userId: assignment.university_id,
        type: 'status_change',
        title: 'Faculty Mentor Accepted Assignment',
        message: `${assignment.faculty_name} has accepted mentorship for Problem ${assignment.problem_id}.`,
        link: '/university/dashboard',
      });

      if (willBeActive) {
        this.triggerProjectActivation(updated!);
      }

      return updated!;
    } else {
      // Faculty declined
      const updated = db.updateProjectAssignment(assignmentId, {
        faculty_status: 'Declined',
        faculty_response_at: now,
        faculty_decline_reason: reason,
        project_status: 'FACULTY_DECLINED',
      });

      db.updateProblem(assignment.problem_id, {
        faculty_status: 'Declined',
        status: 'Faculty Declined',
      });

      db.logAction(
        'FACULTY_DECLINED',
        { id: assignment.faculty_id, email: assignment.faculty_email || '', role: 'faculty', name: actorName },
        `Faculty Mentor (${assignment.faculty_name}) declined assignment for Problem ${assignment.problem_id}. Reason: ${reason}`,
        {
          problem_id: assignment.problem_id,
          assignment_id: assignmentId,
          decline_reason: reason,
          previous_status: assignment.project_status,
          new_status: 'FACULTY_DECLINED',
        }
      );

      db.createNotification({
        userId: assignment.university_id,
        type: 'alert',
        title: 'Faculty Mentor Declined Assignment',
        message: `${assignment.faculty_name} declined assignment for Problem ${assignment.problem_id}. Reason: ${reason}. Please assign another faculty member.`,
        link: `/university/matching/${assignment.problem_id}`,
      });

      return updated!;
    }
  },

  async respondToTeamAssignment(
    assignmentId: string,
    response: 'Accepted' | 'Declined',
    reason?: string,
    actorName = 'Arjun Singh'
  ): Promise<ProjectAssignment> {
    await delay(300);
    const assignment = db.getProjectAssignmentById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found.`);

    const now = new Date().toISOString();

    if (response === 'Accepted') {
      const willBeActive = assignment.faculty_status === 'Accepted';
      const updatedStatus = willBeActive ? 'PROJECT_ACTIVE' : 'TEAM_ACCEPTED';

      const updated = db.updateProjectAssignment(assignmentId, {
        team_status: 'Accepted',
        team_response_at: now,
        project_status: updatedStatus,
      });

      // Update problem record single source of truth
      db.updateProblem(assignment.problem_id, {
        team_status: 'Accepted',
        status: willBeActive ? 'In Progress' : 'Team Accepted',
      });

      // Update team current active projects count
      const team = db.getStudentTeamById(assignment.team_id);
      if (team) {
        db.updateStudentTeam(team.team_id, {
          current_active_projects: team.current_active_projects + 1,
          availability_status:
            team.current_active_projects + 1 >= team.maximum_active_projects ? 'Busy' : 'Available',
        });
      }

      db.logAction(
        'TEAM_ACCEPTED',
        { id: assignment.team_id, email: 'team@student.ac', role: 'student', name: actorName },
        `Student Team (${assignment.team_name}) accepted project assignment for Problem ${assignment.problem_id}`,
        {
          problem_id: assignment.problem_id,
          assignment_id: assignmentId,
          previous_status: assignment.project_status,
          new_status: updatedStatus,
        }
      );

      db.createNotification({
        userId: assignment.university_id,
        type: 'status_change',
        title: 'Student Team Accepted Project',
        message: `${assignment.team_name} has accepted project assignment for Problem ${assignment.problem_id}.`,
        link: '/university/dashboard',
      });

      db.createNotification({
        userId: assignment.faculty_id,
        type: 'status_change',
        title: 'Student Team Accepted Your Mentorship',
        message: `${assignment.team_name} has officially accepted the project and joined your mentorship for Problem ${assignment.problem_id}.`,
        link: '/faculty/dashboard',
      });

      if (willBeActive) {
        this.triggerProjectActivation(updated!);
      }

      return updated!;
    } else {
      // Team declined
      const updated = db.updateProjectAssignment(assignmentId, {
        team_status: 'Declined',
        team_response_at: now,
        team_decline_reason: reason,
        project_status: 'TEAM_DECLINED',
      });

      db.updateProblem(assignment.problem_id, {
        team_status: 'Declined',
        status: 'Team Declined',
      });

      db.logAction(
        'TEAM_DECLINED',
        { id: assignment.team_id, email: 'team@student.ac', role: 'student', name: actorName },
        `Student Team (${assignment.team_name}) declined project assignment for Problem ${assignment.problem_id}. Reason: ${reason}`,
        {
          problem_id: assignment.problem_id,
          assignment_id: assignmentId,
          decline_reason: reason,
          previous_status: assignment.project_status,
          new_status: 'TEAM_DECLINED',
        }
      );

      db.createNotification({
        userId: assignment.university_id,
        type: 'alert',
        title: 'Student Team Declined Project',
        message: `${assignment.team_name} declined assignment for Problem ${assignment.problem_id}. Reason: ${reason}.`,
        link: `/university/matching/${assignment.problem_id}`,
      });

      return updated!;
    }
  },

  triggerProjectActivation(assignment: ProjectAssignment) {
    db.updateProblem(assignment.problem_id, {
      project_status: 'PROJECT_ACTIVE',
      status: 'In Progress',
    });

    db.logAction(
      'PROJECT_ACTIVATED',
      { id: 'system', email: 'system@jharkhand.gov', role: 'government', name: 'JanSamadhan Innovation Hub Engine' },
      `Three-way acceptance complete! Project for Problem ${assignment.problem_id} is now officially ACTIVE.`,
      {
        problem_id: assignment.problem_id,
        assignment_id: assignment.assignment_id,
        university_name: assignment.university_name,
        faculty_name: assignment.faculty_name,
        team_name: assignment.team_name,
        previous_status: 'UNIVERSITY_ACCEPTED',
        new_status: 'PROJECT_ACTIVE',
      }
    );

    const problem = db.getProblemById(assignment.problem_id);
    if (problem?.citizenId) {
      db.createNotification({
        userId: problem.citizenId,
        type: 'status_change',
        title: 'Project Activated & Development Started!',
        message: `Exciting news! Faculty Mentor ${assignment.faculty_name} and ${assignment.team_name} at ${assignment.university_name} have both accepted and initiated work on your problem "${problem.title}".`,
        link: `/citizen/track?problemId=${problem.id}`,
      });
    }

    db.createNotification({
      userId: 'u-gov-1',
      type: 'status_change',
      title: 'R&D Project Active',
      message: `Problem ${assignment.problem_id} ("${problem?.title}") is now actively under R&D with ${assignment.university_name} (${assignment.faculty_name} & ${assignment.team_name}).`,
      link: '/government/dashboard',
    });
  },

  async updateMilestoneReview(
    assignmentId: string,
    milestoneId: string,
    decision: 'approved' | 'changes_requested',
    remarks: string,
    reviewerName = 'Dr. Anita Sharma'
  ): Promise<ProjectAssignment> {
    await delay(300);
    const assignment = db.getProjectAssignmentById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found.`);

    const now = new Date().toISOString();
    const updatedMilestones = assignment.milestones.map((m) => {
      if (m.id === milestoneId) {
        return {
          ...m,
          status: decision === 'approved' ? ('approved' as const) : ('changes_requested' as const),
          reviewed_at: now,
          faculty_remarks: remarks,
          progress_percentage: decision === 'approved' ? 100 : m.progress_percentage,
        };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter((m) => m.status === 'approved').length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    const updated = db.updateProjectAssignment(assignmentId, {
      milestones: updatedMilestones,
      progress: Math.max(progress, 25),
    });

    db.logAction(
      decision === 'approved' ? 'MILESTONE_APPROVED' : 'MILESTONE_CHANGES_REQUESTED',
      { id: assignment.faculty_id, email: assignment.faculty_email || '', role: 'faculty', name: reviewerName },
      `Faculty Mentor ${reviewerName} ${decision === 'approved' ? 'approved' : 'requested changes on'} milestone ${milestoneId}`,
      { problem_id: assignment.problem_id, milestoneId, remarks }
    );

    db.createNotification({
      userId: assignment.team_id,
      type: decision === 'approved' ? 'status_change' : 'alert',
      title: decision === 'approved' ? 'Milestone Approved by Faculty Mentor' : 'Changes Requested on Milestone',
      message: remarks,
      link: '/student/dashboard',
    });

    return updated!;
  },
};
