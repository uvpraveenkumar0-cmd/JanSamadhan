// Industry service — real-time collaboration requests, partners, funding
import type { CollaborationRequest, FundingRequest, IndustryPartner } from '../types';
import { db } from './db';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const industryService = {
  async getPartners(): Promise<IndustryPartner[]> {
    await delay(100);
    return db.getIndustryPartners();
  },

  async getCollaborationRequests(partnerId?: string): Promise<CollaborationRequest[]> {
    await delay(100);
    const all = db.getIndustryCollaborations();
    // Industry should ONLY see applications officially dispatched by University SPOC
    const dispatched = all.filter(c => 
      ['submitted_to_industry', 'submitted', 'under_review', 'accepted', 'rejected'].includes(c.status)
    );
    if (partnerId) return dispatched.filter(c => c.industryPartnerId === partnerId);
    return dispatched;
  },

  async reviewApplication(
    id: string,
    decision: 'accepted' | 'rejected',
    payload: any
  ): Promise<CollaborationRequest | null> {
    await delay(150);
    return db.reviewIndustryApplication(id, decision, payload);
  },

  async updateCollaborationStatus(
    id: string,
    status: CollaborationRequest['status'],
    response?: string,
    rejectionReason?: string,
  ): Promise<CollaborationRequest | null> {
    await delay(100);
    return db.updateIndustryCollaboration(id, { status, response, rejectionReason });
  },

  async getFundingRequests(partnerId?: string): Promise<FundingRequest[]> {
    await delay(100);
    const collabs = db.getIndustryCollaborations();
    const commitments = collabs.filter(c => c.status === 'accepted' && (c.committedFunding || 0) > 0);
    return commitments.map(c => ({
      id: `fund-${c.id}`,
      projectId: c.problem_id || c.projectId,
      problem_id: c.problem_id || c.projectId,
      project: c.project,
      industryPartnerId: c.industryPartnerId,
      industryPartner: c.industryPartner,
      requestedAmount: c.requestedFunding || 350000,
      approvedAmount: c.committedFunding || 350000,
      utilizedAmount: 85000,
      status: 'approved',
      purpose: 'Edge camera trap sensor hardware and field trial deployment',
      milestones: [
        { id: 'fm-1', title: 'Procure 50 Edge Camera Sensor Modules', amount: 150000, dueDate: '2026-09-15', status: 'released' },
        { id: 'fm-2', title: 'Field Weatherproof IP67 Housing Assembly', amount: 100000, dueDate: '2026-09-30', status: 'pending' },
        { id: 'fm-3', title: 'Telemetry Gateway & Pilot Deployment Operations', amount: 100000, dueDate: '2026-10-15', status: 'pending' },
      ],
      requestedAt: c.requestedAt,
      approvedAt: c.respondedAt,
    }));
  },

  async approveFunding(id: string, amount: number): Promise<FundingRequest> {
    await delay(100);
    return {
      id,
      projectId: 'P-1030',
      project: 'AI Crop Disease & Pest Outbreak Early Warning Camera Trap',
      industryPartnerId: 'partner-agritech-01',
      industryPartner: 'AgriTech Jharkhand Solutions Pvt. Ltd.',
      requestedAmount: amount,
      approvedAmount: amount,
      status: 'approved',
      purpose: 'Prototype scaling and hardware validation',
      milestones: [],
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };
  },
};
