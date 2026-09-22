// University service — AI matching engine, allocation, and acceptance workflow
import type { University, UniversityMatch, Allocation, Problem, MatchingFactors, AllocationType } from '../types';
import { db } from './db';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const MATCHING_WEIGHTS = {
  domainRelevance: 25,
  universityExpertise: 20,
  facultyAvailability: 15,
  studentAvailability: 10,
  infrastructure: 10,
  previousExperience: 10,
  geographicRelevance: 5,
  projectCapacity: 5,
};

function calculateFactorScores(problem: Problem, univ: University): {
  score: number;
  factors: MatchingFactors;
  explanation: string;
} {
  const pDomain = (problem.domain || '').toLowerCase();
  const pCategory = (problem.category || '').toLowerCase();
  const pSubcategory = (problem.subcategory || '').toLowerCase();
  const pTitle = (problem.title || '').toLowerCase();
  const pDistrict = (problem.district || '').toLowerCase();

  // 1. Domain Relevance (25%)
  let domainRelevance = 45;
  if (univ.domains.some(d => d.toLowerCase() === pDomain || pCategory.includes(d.toLowerCase()))) {
    domainRelevance = 95;
  } else if (univ.domains.some(d => ['water', 'environment', 'infrastructure'].includes(d) && ['water', 'environment'].includes(pDomain))) {
    domainRelevance = 85;
  } else if (univ.research_areas?.some(ra => ra.toLowerCase().includes(pDomain) || ra.toLowerCase().includes(pCategory))) {
    domainRelevance = 90;
  }

  // 2. University Expertise (20%)
  let universityExpertise = 60;
  const researchText = (univ.research_areas || []).join(' ').toLowerCase();
  const deptText = (univ.departments || []).join(' ').toLowerCase();
  if (researchText.includes(pSubcategory) || researchText.includes(pDomain)) {
    universityExpertise = 96;
  } else if (deptText.includes(pDomain) || deptText.includes('environmental') || deptText.includes('civil')) {
    universityExpertise = 90;
  } else if (univ.naacGrade.includes('A')) {
    universityExpertise = 84;
  }

  // 3. Faculty Availability (15%)
  const facultyAvail = univ.available_faculty ?? Math.min(Math.max(Math.floor(univ.facultyCount / 40), 1), 6);
  let facultyAvailability = Math.min(70 + facultyAvail * 6.5, 98);

  // 4. Student Availability (10%)
  const studentsAvail = univ.available_students ?? Math.min(Math.max(Math.floor(univ.studentCount / 200), 5), 30);
  let studentAvailability = Math.min(75 + Math.floor(studentsAvail / 1.5), 96);

  // 5. Infrastructure Capability (10%)
  const infraCount = (univ.infrastructure || []).length;
  let infrastructure = Math.min(70 + infraCount * 6, 98);

  // 6. Previous Project Experience (10%)
  const prevProjects = univ.previous_projects ?? univ.completedProjects ?? 10;
  let previousExperience = Math.min(70 + Math.floor(prevProjects / 3), 96);

  // 7. Geographic Relevance (5%)
  let geographicRelevance = 70;
  const uDistrict = (univ.district || univ.districtId || '').toLowerCase();
  const uCity = (univ.city || '').toLowerCase();
  if (uDistrict.includes(pDistrict) || pDistrict.includes(uDistrict) || uCity.includes(pDistrict)) {
    geographicRelevance = 95;
  } else if (univ.state?.toLowerCase() === 'jharkhand' || univ.city) {
    geographicRelevance = 85;
  }

  // 8. Project Capacity (5%)
  const capacity = univ.project_capacity ?? 5;
  let projectCapacity = Math.min(75 + capacity * 4, 95);

  // Calculate overall weighted score
  const totalScore = Math.round(
    (domainRelevance * MATCHING_WEIGHTS.domainRelevance +
      universityExpertise * MATCHING_WEIGHTS.universityExpertise +
      facultyAvailability * MATCHING_WEIGHTS.facultyAvailability +
      studentAvailability * MATCHING_WEIGHTS.studentAvailability +
      infrastructure * MATCHING_WEIGHTS.infrastructure +
      previousExperience * MATCHING_WEIGHTS.previousExperience +
      geographicRelevance * MATCHING_WEIGHTS.geographicRelevance +
      projectCapacity * MATCHING_WEIGHTS.projectCapacity) /
      100
  );

  const factors: MatchingFactors = {
    domainRelevance,
    universityExpertise,
    facultyAvailability,
    studentAvailability,
    infrastructure,
    previousExperience,
    geographicRelevance,
    projectCapacity,
    // Aliases
    domainExpertise: domainRelevance,
    location: geographicRelevance,
    facultyExpertise: universityExpertise,
    previousProjects: previousExperience,
    capacity: projectCapacity,
  };

  // Dynamic contextual explanation
  const topStrengths: string[] = [];
  if (domainRelevance >= 90) topStrengths.push(`high domain relevance (${domainRelevance}%) in ${problem.category || problem.domain}`);
  if (universityExpertise >= 90) topStrengths.push('specialized research departments');
  if (facultyAvail >= 3) topStrengths.push(`${facultyAvail} available faculty mentors`);
  if (infrastructure >= 90) topStrengths.push('advanced lab infrastructure');
  if (geographicRelevance >= 90) topStrengths.push(`strong local presence in ${problem.district}`);

  const explanation = `${univ.name} has ${topStrengths.join(', ')}. Estimated completion timeframe: ${univ.available_duration || '6–8 months'}.`;

  return { score: totalScore, factors, explanation };
}

export const universityService = {
  async getAll(): Promise<University[]> {
    await delay(100);
    return db.getUniversities();
  },

  async getById(id: string): Promise<University | null> {
    await delay(100);
    return db.getUniversityById(id);
  },

  async getMatches(problemId: string): Promise<UniversityMatch[]> {
    await delay(350); // Simulate matching analysis
    const problem = db.getProblemById(problemId);
    if (!problem) throw new Error(`Problem ${problemId} not found`);

    // Only verified universities participate
    const universities = db.getUniversities().filter(
      u => !u.verification_status || u.verification_status === 'Verified'
    );

    if (universities.length === 0) return [];

    const matches: UniversityMatch[] = universities.map(univ => {
      const { score, factors, explanation } = calculateFactorScores(problem, univ);
      const faculty = univ.available_faculty ?? 3;
      const students = univ.available_students ?? 15;
      const timeline = univ.available_duration ?? '6–8 months';

      return {
        problemId,
        universityId: univ.id,
        university: univ,
        matchScore: score,
        factors,
        availableFaculty: faculty,
        availableStudents: students,
        estimatedTimeline: timeline,
        aiRecommendation: false,
        rank: 0,
        explanation,
      };
    });

    // Sort descending by matchScore
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Assign rank and top recommendation
    matches.forEach((m, idx) => {
      m.rank = idx + 1;
      m.aiRecommendation = idx === 0;
    });

    // Log AI matching event
    db.logAction(
      'AI_MATCHING_COMPLETED',
      { id: 'ai-engine', email: 'ai@jansamadhan.gov', role: 'government' },
      `AI University Matching computed ${matches.length} ranked institutions for problem ${problemId}`,
      {
        problem_id: problemId,
        top_match: matches[0]?.university.name,
        top_score: matches[0]?.matchScore,
      }
    );

    return matches;
  },

  async allocate(
    problemId: string,
    universityId: string,
    officer: { id: string; name: string; email?: string; role?: string },
    isOverride: boolean = false,
    overrideReason?: string
  ): Promise<Allocation> {
    await delay(200);
    const problem = db.getProblemById(problemId);
    if (!problem) throw new Error(`Problem ${problemId} not found`);

    // Prevent duplicate allocation
    if (problem.allocation_status === 'Allocated' || problem.allocation_status === 'Accepted') {
      throw new Error(`Problem ${problemId} has already been allocated to ${problem.assigned_university_name || 'a university'}`);
    }

    const university = db.getUniversityById(universityId);
    if (!university) throw new Error(`University ${universityId} not found`);

    const now = new Date().toISOString();
    const allocationType: AllocationType = isOverride ? 'Government Override' : 'AI Recommended';

    // Compute or fetch score
    const { score } = calculateFactorScores(problem, university);

    // 1. Update Problem Record
    const updatedProblem = db.updateProblem(problemId, {
      assigned_university: university.id,
      assigned_university_name: university.name,
      allocation_status: 'Allocated',
      status: 'University Assigned',
      allocation_type: allocationType,
      allocated_by: officer.name,
      allocated_at: now,
      override_reason: isOverride ? overrideReason : null,
    });

    if (!updatedProblem) throw new Error(`Failed to update problem ${problemId} allocation`);

    // 2. Create Allocation Record
    const allocationId = `alloc-${Date.now()}`;
    const allocation: Allocation = {
      id: allocationId,
      allocation_id: allocationId,
      problemId,
      problem_id: problemId,
      universityId: university.id,
      university_id: university.id,
      university: university.name,
      universityName: university.name,
      government_officer_id: officer.id,
      governmentOfficerId: officer.id,
      allocatedBy: officer.name,
      allocated_by: officer.name,
      allocatedAt: now,
      allocated_at: now,
      matchScore: score,
      match_score: score,
      allocationType,
      allocation_type: allocationType,
      overrideReason: isOverride ? overrideReason : undefined,
      override_reason: isOverride ? overrideReason : undefined,
      status: 'pending',
      auditLog: [],
    };

    db.createAllocation(allocation);

    // 3. Log Audit
    db.logAction(
      'UNIVERSITY_ALLOCATED',
      { id: officer.id, email: officer.email || '', role: 'government_officer', name: officer.name },
      `Problem ${problem.id} allocated to ${university.name} (${allocationType})`,
      {
        problem_id: problemId,
        university_id: university.id,
        university_name: university.name,
        allocation_type: allocationType,
        match_score: score,
        override_reason: overrideReason,
      }
    );

    if (isOverride) {
      db.logAction(
        'AI_RECOMMENDATION_OVERRIDDEN',
        { id: officer.id, email: officer.email || '', role: 'government_officer', name: officer.name },
        `AI Top recommendation overridden in favor of ${university.name}. Reason: ${overrideReason}`,
        {
          problem_id: problemId,
          selected_university: university.name,
          override_reason: overrideReason,
        }
      );
    }

    // 4. Notifications
    // Notify university
    db.createNotification({
      userId: university.id,
      type: 'info',
      title: 'New Problem Assigned to Your Institution',
      message: `Government of Jharkhand has officially assigned problem ${problem.id}: "${problem.title}" to ${university.name}. Please review and accept.`,
      link: `/university/marketplace`,
    });

    // Notify citizen
    db.createNotification({
      userId: problem.citizenId,
      type: 'success',
      title: 'University Assigned to Your Problem',
      message: `Your problem "${problem.title}" has been assigned to ${university.name} for research and solution development.`,
      link: `/citizen/track?problemId=${problem.id}`,
    });

    return allocation;
  },

  async respondToAllocation(
    problemId: string,
    universityId: string,
    decision: 'accept' | 'decline',
    reason?: string
  ): Promise<Problem> {
    await delay(200);
    const problem = db.getProblemById(problemId);
    if (!problem) throw new Error(`Problem ${problemId} not found`);

    const university = db.getUniversityById(universityId);
    const uniName = university?.name || 'Assigned University';
    const now = new Date().toISOString();

    if (decision === 'accept') {
      const updated = db.updateProblem(problemId, {
        allocation_status: 'Accepted',
        status: 'University Accepted',
        accepted_at: now,
      });

      db.updateAllocation(problemId, {
        status: 'accepted',
        accepted_at: now,
      });

      // Audit log
      db.logAction(
        'UNIVERSITY_ACCEPTED',
        { id: universityId, email: '', role: 'university', name: uniName },
        `${uniName} accepted assignment for problem ${problemId}`,
        {
          problem_id: problemId,
          university_id: universityId,
          new_status: 'University Accepted',
        }
      );

      // Notify Government Officer
      db.createNotification({
        userId: 'all',
        role: 'government',
        type: 'success',
        title: 'University Accepted Problem Assignment',
        message: `${uniName} has officially accepted assignment for problem ${problem.id}: "${problem.title}".`,
        link: `/government/verification`,
      });

      // Notify Citizen
      db.createNotification({
        userId: problem.citizenId,
        type: 'success',
        title: 'University Accepted Your Problem',
        message: `${uniName} has officially accepted your problem and scheduled project commencement.`,
        link: `/citizen/track?problemId=${problem.id}`,
      });

      return updated!;
    } else {
      // Declined
      const updated = db.updateProblem(problemId, {
        allocation_status: 'Declined',
        status: 'University Declined',
        decline_reason: reason || 'Capacity constraint',
        assigned_university: null,
        assigned_university_name: null,
      });

      db.updateAllocation(problemId, {
        status: 'declined',
        decline_reason: reason || 'Capacity constraint',
      });

      // Audit log
      db.logAction(
        'UNIVERSITY_DECLINED',
        { id: universityId, email: '', role: 'university', name: uniName },
        `${uniName} declined assignment for problem ${problemId}. Reason: ${reason}`,
        {
          problem_id: problemId,
          university_id: universityId,
          decline_reason: reason,
        }
      );

      // Notify Government Officer
      db.createNotification({
        userId: 'all',
        role: 'government',
        type: 'warning',
        title: 'University Declined Assignment',
        message: `${uniName} declined assignment for problem ${problem.id}. Reason: ${reason}. Problem has returned for re-allocation.`,
        link: `/government/matching?problemId=${problem.id}`,
      });

      return updated!;
    }
  },
};
