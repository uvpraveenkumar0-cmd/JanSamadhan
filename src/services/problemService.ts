// Problem service — connected directly to the persistent relational database engine (db.ts)
import type { Problem, ProblemStatus, ProblemDomain, ProblemVerificationStatus, ProblemAllocationStatus } from '../types';
import { db } from './db';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const problemService = {
  async getAll(filters?: {
    domain?: ProblemDomain;
    status?: ProblemStatus | string;
    verification_status?: ProblemVerificationStatus;
    allocation_status?: ProblemAllocationStatus;
    search?: string;
  }): Promise<Problem[]> {
    await delay(100);
    return db.getProblems(filters);
  },

  async getById(id: string): Promise<Problem | null> {
    await delay(100);
    return db.getProblemById(id);
  },

  async submit(data: Omit<Problem, 'id' | 'status' | 'submittedAt' | 'updatedAt' | 'verification_status' | 'allocation_status'> & {
    id?: string;
    status?: ProblemStatus;
    verification_status?: ProblemVerificationStatus;
    allocation_status?: ProblemAllocationStatus;
  }): Promise<Problem> {
    await delay(200);
    const existing = db.getProblems();
    const nextSeq = 1024 + existing.length;
    const id = data.id || `P-${nextSeq}`;
    const now = new Date().toISOString();

    const problem: Problem = {
      ...data,
      id,
      problem_id: id,
      citizenId: data.citizenId,
      citizen_id: data.citizenId,
      citizenName: data.citizenName,
      citizen_name: data.citizenName,
      title: data.title,
      description: data.description,
      domain: data.domain,
      category: data.category || data.domain,
      subcategory: data.subcategory,
      location: data.location || `${data.district}, Jharkhand`,
      districtId: data.districtId,
      district: data.district,
      state: data.state || 'Jharkhand',
      block: data.block,
      village: data.village,
      coordinates: data.coordinates,
      latitude: data.coordinates?.lat,
      longitude: data.coordinates?.lng,
      severity: data.severity,
      priority: data.priority || 'high',
      affectedPopulation: data.affectedPopulation || 100,
      affected_people: data.affectedPopulation || 100,
      evidence: data.evidence || [],
      evidenceMetadata: data.evidenceMetadata || [],
      submittedAt: now,
      created_at: now,
      updatedAt: now,
      updated_at: now,
      // Mandatory initial lifecycle state
      status: 'Submitted',
      verification_status: 'Pending',
      allocation_status: 'Not Allocated',
      assigned_university: null,
      assigned_university_name: null,
      assigned_government_officer: null,
      tags: data.tags || [data.domain, data.subcategory],
    };

    db.createProblem(problem);

    // Audit log
    db.logAction(
      'PROBLEM_SUBMITTED',
      { id: problem.citizenId, email: '', role: 'citizen', name: problem.citizenName },
      `Problem "${problem.title}" (${problem.id}) submitted by ${problem.citizenName}`,
      {
        problem_id: problem.id,
        new_status: 'Submitted',
        category: problem.category,
        district: problem.district,
      }
    );

    // Notification for government officers
    db.createNotification({
      userId: 'all',
      role: 'government',
      type: 'info',
      title: 'New Problem Submitted',
      message: `Citizen ${problem.citizenName} submitted problem ${problem.id}: "${problem.title}" in ${problem.district}.`,
      link: `/government/verification`,
    });

    return problem;
  },

  async verifyProblem(
    id: string,
    officerId: string,
    officerName: string,
    notes?: string
  ): Promise<Problem> {
    await delay(150);
    const existing = db.getProblemById(id);
    if (!existing) throw new Error(`Problem ${id} not found`);

    const now = new Date().toISOString();
    const updated = db.updateProblem(id, {
      verification_status: 'Verified',
      status: 'Verified',
      verifiedBy: officerName,
      verified_by: officerName,
      verifiedAt: now,
      verified_at: now,
      assigned_government_officer: officerId,
      verificationNotes: notes || 'Verified by Government Officer after administrative review',
      governmentDecision: 'approved',
    });

    if (!updated) throw new Error(`Failed to update problem ${id}`);

    // Audit log
    db.logAction(
      'PROBLEM_VERIFIED',
      { id: officerId, email: '', role: 'government_officer', name: officerName },
      `Problem "${updated.title}" (${updated.id}) verified by ${officerName}`,
      {
        problem_id: updated.id,
        previous_status: existing.status,
        new_status: 'Verified',
        officer: officerName,
        notes,
      }
    );

    // Notify citizen
    db.createNotification({
      userId: updated.citizenId,
      type: 'success',
      title: 'Problem Verified by Government',
      message: `Your problem "${updated.title}" has been verified by ${officerName}. It is now eligible for University AI Matching.`,
      link: `/citizen/track?problemId=${updated.id}`,
    });

    return updated;
  },

  async rejectProblem(
    id: string,
    officerId: string,
    officerName: string,
    reason: string
  ): Promise<Problem> {
    await delay(150);
    const existing = db.getProblemById(id);
    if (!existing) throw new Error(`Problem ${id} not found`);

    const now = new Date().toISOString();
    const updated = db.updateProblem(id, {
      verification_status: 'Rejected',
      status: 'Rejected',
      verifiedBy: officerName,
      verified_by: officerName,
      verifiedAt: now,
      verified_at: now,
      assigned_government_officer: officerId,
      verificationNotes: reason,
      governmentDecision: 'rejected',
    });

    if (!updated) throw new Error(`Failed to update problem ${id}`);

    // Audit log
    db.logAction(
      'PROBLEM_REJECTED',
      { id: officerId, email: '', role: 'government_officer', name: officerName },
      `Problem "${updated.title}" (${updated.id}) rejected by ${officerName}. Reason: ${reason}`,
      {
        problem_id: updated.id,
        previous_status: existing.status,
        new_status: 'Rejected',
        reason,
      }
    );

    // Notify citizen
    db.createNotification({
      userId: updated.citizenId,
      type: 'error',
      title: 'Problem Not Verified',
      message: `Your problem "${updated.title}" could not be verified by the Government. Reason: ${reason}`,
      link: `/citizen/track?problemId=${updated.id}`,
    });

    return updated;
  },

  async updateStatus(id: string, status: ProblemStatus | string, meta?: Partial<Problem>): Promise<Problem> {
    await delay(100);
    const existing = db.getProblemById(id);
    if (!existing) throw new Error(`Problem ${id} not found`);

    const updated = db.updateProblem(id, { status: status as ProblemStatus, ...meta });
    if (!updated) throw new Error(`Failed to update problem ${id}`);

    db.logAction(
      'STATUS_UPDATED',
      { id: meta?.assigned_government_officer || 'system', email: '', role: 'government_officer' },
      `Problem status updated to ${status} for ${id}`,
      {
        problem_id: id,
        previous_status: existing.status,
        new_status: status,
      }
    );

    return updated;
  },

  async getByCitizen(citizenId: string, alternateId?: string, citizenName?: string): Promise<Problem[]> {
    await delay(100);
    const all = db.getProblems();
    return all.filter(p => {
      const matchId = p.citizenId === citizenId || p.citizen_id === citizenId;
      const matchAlt = alternateId && (p.citizenId === alternateId || p.citizen_id === alternateId);
      const matchName = citizenName && (p.citizenName === citizenName || p.citizen_name === citizenName);
      return Boolean(matchId || matchAlt || matchName);
    });
  },

  async getVerificationQueue(): Promise<Problem[]> {
    await delay(100);
    const all = db.getProblems();
    return all.filter(p => {
      const s = p.status.toLowerCase();
      const vs = p.verification_status?.toLowerCase();
      return vs === 'pending' || ['submitted', 'ai_analysis', 'government_review'].includes(s);
    });
  },

  // CRITICAL BUSINESS RULE: Only Verified AND Not Allocated problems can enter AI Matching
  async getReadyForMatching(): Promise<Problem[]> {
    await delay(100);
    const all = db.getProblems();
    return all.filter(p => {
      const isVerified = p.verification_status === 'Verified' || p.status.toLowerCase() === 'verified';
      const isNotAllocated = p.allocation_status === 'Not Allocated' || !p.assigned_university;
      return isVerified && isNotAllocated;
    });
  },
};
