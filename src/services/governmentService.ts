// Government service — verification queue, analytics, audit logs
import type { Problem, AuditEntry } from '../types';
import {
  ANALYTICS_BY_DOMAIN, ANALYTICS_BY_DISTRICT,
  ANALYTICS_MONTHLY, DEMO_AUDIT_LOG, GLOBAL_IMPACT_STATS, DISTRICTS,
} from '../data/mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const governmentService = {
  async getAnalyticsByDomain() {
    await delay(600 + Math.random() * 400);
    return ANALYTICS_BY_DOMAIN;
  },

  async getAnalyticsByDistrict() {
    await delay(600 + Math.random() * 400);
    return ANALYTICS_BY_DISTRICT;
  },

  async getMonthlyAnalytics() {
    await delay(600 + Math.random() * 400);
    return ANALYTICS_MONTHLY;
  },

  async getImpactStats() {
    await delay(500);
    return GLOBAL_IMPACT_STATS;
  },

  async getAuditLog(entityId?: string): Promise<AuditEntry[]> {
    await delay(200);
    const dbLogs = (await import('./db')).db.getAuditLogs();
    const mapped: AuditEntry[] = dbLogs.map(l => ({
      id: l.id,
      audit_id: l.audit_id || l.id,
      entityType: 'problem',
      entityId: l.problem_id || 'system',
      action: l.action,
      performedBy: l.performedBy || l.userEmail,
      role: l.role,
      timestamp: l.timestamp,
      details: l.details,
      problem_id: l.problem_id,
      previous_status: l.previous_status,
      new_status: l.new_status,
      metadata: l.metadata,
    }));
    const combined = [...mapped, ...DEMO_AUDIT_LOG];
    if (entityId) return combined.filter(a => a.entityId === entityId || a.problem_id === entityId);
    return combined;
  },

  async getDistrictStats() {
    await delay(500);
    return DISTRICTS.map(d => ({
      ...d,
      stats: {
        districtId: d.id,
        problemsSubmitted: Math.floor(Math.random() * 500 + 100),
        problemsVerified: Math.floor(Math.random() * 400 + 80),
        activeProjects: Math.floor(Math.random() * 20 + 2),
        deployedSolutions: Math.floor(Math.random() * 10 + 1),
        citizensImpacted: Math.floor(Math.random() * 50000 + 5000),
      },
    }));
  },
};
