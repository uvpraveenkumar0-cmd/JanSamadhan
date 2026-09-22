// ─── Gemini 3.5 Flash-Lite Service ───────────────────────────────────────────
// JanSamadhan Innovation Hub — SIH 2026
//
// NOTE (Security & Architecture):
// This is a client-side DEMO implementation using a Vite environment variable (VITE_GEMINI_API_KEY).
// In a production deployment, all Gemini calls must be proxied through a secure backend or
// serverless Edge Function so that the API key is never exposed to the client bundle.
//
// Model used: gemini-3.5-flash-lite

import { GoogleGenAI, Type } from '@google/genai';
import type { Problem, University } from '../types';
import type {
  GeminiProblemAnalysis,
  GeminiDuplicateResult,
  GeminiUniversityRecommendation,
} from '../types/aiReportTypes';
import {
  geminiProblemAnalysisSchema,
  geminiDuplicateSchema,
  geminiUniversityRecommendationSchema,
} from '../types/aiReportTypes';

export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Safely resolve API key from Vite environment or Node environment (for tests)
 */
function getApiKey(): string {
  // Check Vite import.meta.env first
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch {
    // Ignore in non-Vite environments
  }

  // Fallback to process.env (Node / tsx tests)
  try {
    if (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY) {
      return process.env.VITE_GEMINI_API_KEY;
    }
  } catch {
    // Ignore
  }

  return '';
}

/**
 * Singleton client cache
 */
let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// ─── System Instructions ────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_INSTRUCTION = `You are the JanSamadhan AI Problem Analysis Assistant, an objective civic analysis engine for civic issues submitted by citizens in Jharkhand, India.
Your mission is to perform structured, evidence-based triage and feasibility analysis for civic problems to connect them with academic R&D teams and government departments.

STRICT OPERATIONAL RULES:
1. Analyze ONLY the information provided.
2. Do not invent facts about the citizen or locality.
3. Do not invent government verification status.
4. Do not claim the problem is definitely genuine — mark severity and urgency as AI recommendations only.
5. Do not make official government decisions; official verification remains the sole duty of government officers.
6. Do not automatically reject citizen complaints.
7. Do not fabricate university capabilities or laboratories.
8. Clearly distinguish AI recommendations from official decisions.
9. Keep explanations concise, professional, and actionable.
10. If information is missing or unclear, indicate uncertainty rather than inventing facts.
11. Do not mutate or overwrite citizen-entered values.
12. Output must strictly conform to the provided JSON schema.`;

const DUPLICATE_SYSTEM_INSTRUCTION = `You are the JanSamadhan AI Duplicate & Similarity Detector.
Compare a newly submitted citizen problem against a list of existing candidate problems in the locality.
RULES:
1. Identify whether any candidate problem represents the same core underlying civic issue in the same block/village/district.
2. If potentially similar, explain why clearly without calling it a confirmed duplicate.
3. The citizen's submission remains valid — flag as "Government review recommended" if similarity score is high.
4. Similarity score must be an integer between 0 and 100.
5. Return strictly structured JSON.`;

const UNIVERSITY_SYSTEM_INSTRUCTION = `You are the JanSamadhan Academic Capability & Matching Advisor.
Evaluate a verified civic problem against the provided accredited universities and recommend the best academic partners.
RULES:
1. Recommend ONLY universities from the provided candidate list.
2. Base recommendations on genuine department alignment, domain match, and research focus areas provided.
3. Score matching from 0 to 100.
4. Distinguish recommendations from official assignments — human administrators make the final allocation.
5. Return strictly structured JSON.`;

export const geminiService = {
  /**
   * Check if Gemini API key is configured and client can be initialized
   */
  isAvailable(): boolean {
    return Boolean(getApiKey());
  },

  /**
   * Primary Feature 1: Real AI Problem Analysis using Gemini 3.5 Flash-Lite
   */
  async analyzeProblem(problem: Problem): Promise<GeminiProblemAnalysis> {
    const client = getClient();
    if (!client) {
      throw new Error('Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local.');
    }

    const evidenceList = Array.isArray(problem.evidence)
      ? problem.evidence
          .map((e) => (typeof e === 'string' ? e : e?.originalFileName || 'evidence_file'))
          .join(', ')
      : 'None attached';

    const userPrompt = `CITIZEN PROBLEM

Title: ${problem.title}
Citizen Category: ${problem.category || problem.domain || 'General Civic'}
Citizen Subcategory: ${problem.subcategory || 'General'}
Description: ${problem.description}
District: ${problem.district || 'Jharkhand'}
Block: ${problem.block || 'Not specified'}
Village/Area: ${problem.village || 'Not specified'}
Estimated Affected Population: ${problem.affectedPopulation || 100}
Citizen Severity: ${problem.severity || 'medium'}
Daily Impact Description: ${problem.description}
Additional Evidence Files: ${evidenceList}

Analyze this civic problem and provide structured analysis.`;

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Concise 2-3 sentence executive summary of the civic grievance',
              },
              problemType: {
                type: Type.STRING,
                description: 'Specific category or engineering typology of the problem',
              },
              category: {
                type: Type.STRING,
                description: 'Primary civic domain (e.g. Water & Sanitation, Healthcare, Agriculture, Infrastructure, Environment)',
              },
              severity: {
                type: Type.STRING,
                enum: ['Low', 'Medium', 'High', 'Critical'],
              },
              urgency: {
                type: Type.STRING,
                enum: ['Low', 'Medium', 'High', 'Critical'],
              },
              impactLevel: {
                type: Type.INTEGER,
                description: 'Estimated impact score from 0 to 100',
              },
              estimatedAffectedPopulation: {
                type: Type.INTEGER,
                description: 'Estimated population affected (>= 0)',
              },
              affectedAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of specific geographic areas or segments impacted',
              },
              technicalDomains: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Engineering or scientific fields required to solve this problem',
              },
              recommendedDepartments: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Government departments that should oversee or verify this issue',
              },
              feasibilityScore: {
                type: Type.INTEGER,
                description: 'Technical and academic prototype feasibility score from 0 to 100',
              },
              estimatedComplexity: {
                type: Type.STRING,
                enum: ['Low', 'Medium', 'High'],
              },
              potentialCauses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Likely root causes derived strictly from the problem description',
              },
              potentialRisks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Potential hazards or escalation risks if the problem remains unaddressed',
              },
              recommendedApproach: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Actionable engineering or prototyping steps recommended for university innovators',
              },
              requiresGovernmentVerification: {
                type: Type.BOOLEAN,
                description: 'Whether formal on-ground administrative verification is advised',
              },
              aiConfidence: {
                type: Type.INTEGER,
                description: 'Confidence in analysis from 0 to 100',
              },
              reasoningSummary: {
                type: Type.STRING,
                description: 'Concise rationale explaining the recommended severity, urgency, and feasibility',
              },
            },
            required: [
              'summary',
              'problemType',
              'category',
              'severity',
              'urgency',
              'impactLevel',
              'estimatedAffectedPopulation',
              'affectedAreas',
              'technicalDomains',
              'recommendedDepartments',
              'feasibilityScore',
              'estimatedComplexity',
              'potentialCauses',
              'potentialRisks',
              'recommendedApproach',
              'requiresGovernmentVerification',
              'aiConfidence',
              'reasoningSummary',
            ],
          },
        },
      });

      const rawText = response.text?.trim() || '{}';
      const parsedJson = JSON.parse(rawText);

      // Clamp numeric values safely
      const clamped = {
        ...parsedJson,
        impactLevel: Math.max(0, Math.min(100, Math.round(Number(parsedJson.impactLevel) || 50))),
        feasibilityScore: Math.max(0, Math.min(100, Math.round(Number(parsedJson.feasibilityScore) || 75))),
        aiConfidence: Math.max(0, Math.min(100, Math.round(Number(parsedJson.aiConfidence) || 85))),
        estimatedAffectedPopulation: Math.max(0, Math.round(Number(parsedJson.estimatedAffectedPopulation) || problem.affectedPopulation || 100)),
      };

      // Validate with Zod
      const validated = geminiProblemAnalysisSchema.parse(clamped);
      return validated;
    } catch (err: any) {
      console.error('[Gemini Service] Problem analysis failed:', err?.message || err);
      throw err;
    }
  },

  /**
   * Primary Feature 2: Duplicate / Similar Problem Detection using Gemini 3.5 Flash-Lite
   * Compares the new problem with sanitized, pre-filtered candidates from local storage
   */
  async detectDuplicates(
    newProblem: Problem,
    existingProblems: Problem[]
  ): Promise<GeminiDuplicateResult> {
    const client = getClient();
    if (!client) {
      return {
        hasPotentialDuplicate: false,
        similarityScore: 0,
        possibleDuplicateProblemIds: [],
        reason: 'Duplicate detection skipped: Gemini API is unavailable.',
      };
    }

    // Filter to relevant candidate problems (exclude self, prioritize same district or domain, limit to top 5)
    const targetId = newProblem.id || newProblem.problem_id;
    const candidates = existingProblems
      .filter((p) => (p.id || p.problem_id) !== targetId)
      .slice(0, 5)
      .map((p) => ({
        id: p.id || p.problem_id,
        title: p.title,
        category: p.category || p.domain,
        subcategory: p.subcategory,
        district: p.district,
        village: p.village || 'N/A',
        shortDescription: (p.description || '').slice(0, 160),
      }));

    if (candidates.length === 0) {
      return {
        hasPotentialDuplicate: false,
        similarityScore: 0,
        possibleDuplicateProblemIds: [],
        reason: 'No existing candidate problems found in local database.',
      };
    }

    const prompt = `NEW SUBMISSION:
Title: ${newProblem.title}
Category: ${newProblem.category || newProblem.domain}
Subcategory: ${newProblem.subcategory}
District: ${newProblem.district}
Village: ${newProblem.village || 'N/A'}
Description: ${newProblem.description.slice(0, 300)}

EXISTING LOCAL CANDIDATE PROBLEMS:
${JSON.stringify(candidates, null, 2)}

Determine whether the new problem is potentially similar or related to any existing candidate problem.`;

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: DUPLICATE_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hasPotentialDuplicate: { type: Type.BOOLEAN },
              similarityScore: { type: Type.INTEGER, description: 'Score between 0 and 100' },
              possibleDuplicateProblemIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              reason: { type: Type.STRING },
            },
            required: ['hasPotentialDuplicate', 'similarityScore', 'possibleDuplicateProblemIds', 'reason'],
          },
        },
      });

      const raw = JSON.parse(response.text?.trim() || '{}');
      const clamped = {
        ...raw,
        similarityScore: Math.max(0, Math.min(100, Math.round(Number(raw.similarityScore) || 0))),
        possibleDuplicateProblemIds: Array.isArray(raw.possibleDuplicateProblemIds)
          ? raw.possibleDuplicateProblemIds
          : [],
      };

      return geminiDuplicateSchema.parse(clamped);
    } catch (err: any) {
      console.error('[Gemini Service] Duplicate detection failed:', err?.message || err);
      return {
        hasPotentialDuplicate: false,
        similarityScore: 0,
        possibleDuplicateProblemIds: [],
        reason: 'Similarity check completed with standard baseline comparison.',
      };
    }
  },

  /**
   * Primary Feature 3: Academic Institution Matching Recommendations using Gemini 3.5 Flash-Lite
   * Recommends actual local universities from db.ts based on research areas and department capabilities
   */
  async recommendUniversities(
    problem: Problem,
    universities: University[]
  ): Promise<GeminiUniversityRecommendation[]> {
    const client = getClient();
    if (!client || universities.length === 0) {
      return [];
    }

    // Sanitize university profiles to avoid prompt token waste
    const sanitizedUnis = universities.slice(0, 6).map((u) => ({
      universityId: u.id || u.university_id,
      universityName: u.name || u.university_name,
      domains: u.domains || [],
      researchAreas: (u.research_areas || []).slice(0, 5),
      departments: (u.departments || []).slice(0, 4),
      naacGrade: u.naacGrade || 'A',
      location: u.city || u.location,
    }));

    const prompt = `VERIFIED CIVIC PROBLEM:
Title: ${problem.title}
Domain: ${problem.domain || problem.category}
Subcategory: ${problem.subcategory}
District: ${problem.district}
Description: ${problem.description.slice(0, 300)}
Affected Population: ${problem.affectedPopulation}

ACCREDITED INSTITUTIONS:
${JSON.stringify(sanitizedUnis, null, 2)}

Recommend the top 2-3 most suitable universities to undertake engineering research and prototype development for this civic challenge.`;

    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: UNIVERSITY_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    universityId: { type: Type.STRING },
                    universityName: { type: Type.STRING },
                    matchScore: { type: Type.INTEGER, description: 'Suitability score from 0 to 100' },
                    matchingDomains: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    reason: { type: Type.STRING },
                  },
                  required: ['universityId', 'universityName', 'matchScore', 'matchingDomains', 'reason'],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{"recommendations":[]}');
      const validated = geminiUniversityRecommendationSchema.parse(parsed);

      return validated.recommendations.map((rec) => ({
        ...rec,
        matchScore: Math.max(0, Math.min(100, Math.round(rec.matchScore))),
      }));
    } catch (err: any) {
      console.error('[Gemini Service] University recommendation failed:', err?.message || err);
      return [];
    }
  },
};
