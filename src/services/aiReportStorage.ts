// ─── AI Report Storage Service ──────────────────────────────────────────────
// Manages local persistence of generated AI problem analysis reports.
// Reports are stored by problem ID in localStorage and synchronized with the problem record.

import type { AIReport } from '../types/aiReportTypes';
import type { AIAnalysis, ProblemDomain, ProblemSeverity } from '../types';
import { db } from './db';

const STORAGE_KEY = 'jih_ai_reports';

function safeGetReports(): Record<string, AIReport> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to read AI reports from localStorage:', err);
    return {};
  }
}

function safeSetReports(reports: Record<string, AIReport>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to write AI reports to localStorage:', err);
  }
}

export const aiReportStorage = {
  /**
   * Save an AI report both in the dedicated AI report registry and within the problem record
   */
  saveAIReport(report: AIReport): AIReport {
    const reports = safeGetReports();
    reports[report.problemId] = report;
    safeSetReports(reports);

    // Also synchronize to the problem record in db
    try {
      const legacyAnalysis: AIAnalysis = {
        problemId: report.problemId,
        analyzedAt: report.analyzedAt,
        domain: report.classification.domain as ProblemDomain,
        subcategory: report.classification.subcategory,
        tags: report.classification.keywords,
        priorityScore: report.priority.score,
        severityLevel: (report.priority.level.toLowerCase() as ProblemSeverity) || 'medium',
        confidence: report.verification.confidence,
        duplicateProbability: report.duplicateDetection.confidence,
        affectedPopulation: 0,
        estimatedImpact: report.priority.reason,
        recommendedExpertise: report.classification.requiredExpertise,
        suggestedApproach: report.recommendedAction,
        similarProblems: report.duplicateDetection.similarProblems.map((sp) => ({
          id: sp.id,
          title: sp.title,
          similarity: sp.similarity,
        })),
        disclaimer: report.disclaimer,
        // Extended properties
        summary: report.summary,
        verification: report.verification,
        completeness: report.completeness,
        duplicateDetection: report.duplicateDetection,
        aiExplanation: report.aiExplanation,
        recommendedAction: report.recommendedAction,
        processingStatus: report.processingStatus,
        fullReport: report,
      };

      db.updateProblem(report.problemId, {
        aiAnalysis: legacyAnalysis,
        aiSummary: report.summary,
        aiVerified: report.verification.status === 'ASSESSED',
        aiVerificationStatus: report.verification.status,
      });
    } catch (err) {
      console.warn('Could not sync AI report to db problem:', err);
    }

    return report;
  },

  /**
   * Retrieve an AI report by problem ID
   */
  getAIReport(problemId: string): AIReport | null {
    if (!problemId) return null;

    // Check dedicated storage first
    const reports = safeGetReports();
    if (reports[problemId]) {
      return reports[problemId];
    }

    // Fallback: check problem record in db
    const problem = db.getProblemById(problemId);
    if (problem?.aiAnalysis) {
      const analysis = problem.aiAnalysis as AIAnalysis & { fullReport?: AIReport };
      if (analysis.fullReport) {
        return analysis.fullReport;
      }
    }

    return null;
  },

  /**
   * Get all stored AI reports
   */
  getAllAIReports(): AIReport[] {
    const reports = safeGetReports();
    return Object.values(reports);
  },

  /**
   * Delete an AI report
   */
  deleteAIReport(problemId: string): boolean {
    const reports = safeGetReports();
    if (!reports[problemId]) return false;
    delete reports[problemId];
    safeSetReports(reports);
    return true;
  },
};
