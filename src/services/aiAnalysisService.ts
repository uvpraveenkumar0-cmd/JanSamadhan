// ─── AI Analysis Service ────────────────────────────────────────────────────
// Deterministic AI analysis engine that processes REAL submitted data.
// No mock values, no setTimeout simulation, no hardcoded results.
//
// When a real AI backend (Supabase Edge Function + Gemini/OpenAI) is added,
// replace the implementation of analyzeProblem() — the interface stays the same.

import type { Problem } from '../types';
import type {
  AIReport,
  AIClassification,
  AIVerification,
  AICompleteness,
  AIPriority,
  AIDuplicateDetection,
  AIPriorityLevel,
  AIVerificationStatus,
  AIDuplicateStatus,
  AIProcessingStage,
} from '../types/aiReportTypes';
import { aiReportSchema } from '../types/aiReportTypes';
import { DOMAIN_LABELS } from '../lib/utils';
import { geminiService, GEMINI_MODEL } from './geminiService';

// ─── Callback for stage updates ─────────────────────────────────────────────

export type StageCallback = (stage: AIProcessingStage) => void;

// ─── Domain Knowledge ───────────────────────────────────────────────────────
// Real domain expertise mapping used for classification and expertise detection

const DOMAIN_EXPERTISE_MAP: Record<string, string[]> = {
  water:       ['Water Resources Engineering', 'Environmental Science', 'IoT/Sensor Technology', 'Public Health', 'Civil Engineering'],
  health:      ['Public Health', 'Emergency Medicine', 'Healthcare Administration', 'Biomedical Engineering', 'Epidemiology'],
  education:   ['Educational Technology', 'Curriculum Design', 'Digital Learning', 'Teacher Training', 'Educational Psychology'],
  agriculture: ['Agricultural Science', 'Soil Science', 'AgriTech', 'Climate Science', 'Rural Economics'],
  infrastructure: ['Civil Engineering', 'Urban Planning', 'Transportation Engineering', 'Structural Engineering', 'Smart Cities'],
  environment: ['Environmental Engineering', 'Waste Management', 'Ecology', 'Climate Science', 'Renewable Energy'],
  governance:  ['Public Administration', 'Digital Governance', 'Policy Analysis', 'Data Analytics', 'Civic Tech'],
  energy:      ['Electrical Engineering', 'Renewable Energy', 'Power Systems', 'Energy Policy', 'Smart Grid Technology'],
  safety:      ['Public Safety', 'Disaster Management', 'Emergency Response', 'Risk Assessment', 'Security Systems'],
  digital:     ['Computer Science', 'Software Engineering', 'Data Science', 'Cybersecurity', 'UX Design'],
};

// Responsible Government Department Mapping
export const DOMAIN_DEPARTMENT_MAP: Record<string, string> = {
  water:          'Department of Drinking Water & Sanitation',
  health:         'Department of Health, Medical Education & Family Welfare',
  education:      'Department of School Education & Literacy',
  agriculture:    'Department of Agriculture, Animal Husbandry & Co-operative',
  infrastructure: 'Road Construction & Urban Development Department',
  environment:    'Department of Forest, Environment & Climate Change',
  energy:         'Energy Department',
  governance:     'Department of Personnel, Administrative Reforms & Rajbhasha',
  safety:         'Home, Prison & Disaster Management Department',
  digital:        'Department of Information Technology & e-Governance',
};

// Urgency keywords with weights
const URGENCY_KEYWORDS: Array<{ words: string[]; weight: number; category: string }> = [
  { words: ['death', 'dying', 'fatal', 'life-threatening', 'emergency', 'critical'], weight: 25, category: 'Life Safety' },
  { words: ['contamination', 'toxic', 'poison', 'hazardous', 'dangerous'], weight: 20, category: 'Health Hazard' },
  { words: ['outbreak', 'epidemic', 'pandemic', 'disease', 'infection'], weight: 20, category: 'Public Health Crisis' },
  { words: ['flood', 'drought', 'disaster', 'collapse', 'earthquake'], weight: 18, category: 'Natural Disaster' },
  { words: ['shortage', 'unavailable', 'lack', 'deficit', 'absent'], weight: 12, category: 'Resource Scarcity' },
  { words: ['children', 'pregnant', 'elderly', 'disabled', 'vulnerable'], weight: 15, category: 'Vulnerable Population' },
  { words: ['immediate', 'urgent', 'rapidly', 'worsening', 'deteriorating'], weight: 14, category: 'Time Sensitivity' },
  { words: ['remote', 'inaccessible', 'isolated', 'rural', 'tribal'], weight: 10, category: 'Geographic Vulnerability' },
  { words: ['hospital', 'clinic', 'ambulance', 'medical', 'doctor', 'nurse'], weight: 12, category: 'Healthcare Access' },
  { words: ['school', 'student', 'education', 'teacher', 'classroom'], weight: 8, category: 'Education Impact' },
  { words: ['drinking water', 'clean water', 'sanitation', 'sewage'], weight: 14, category: 'Basic Necessities' },
  { words: ['electricity', 'power cut', 'blackout', 'no power'], weight: 10, category: 'Essential Services' },
  { words: ['road', 'bridge', 'transport', 'connectivity'], weight: 8, category: 'Infrastructure' },
];

// ─── Text Utilities ─────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function extractKeyPhrases(text: string): string[] {
  const tokens = tokenize(text);
  const phrases: string[] = [];

  // Bigrams
  for (let i = 0; i < tokens.length - 1; i++) {
    phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  // Individual important tokens (>4 chars, not stopwords)
  const stopwords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'with', 'from', 'they', 'were', 'which', 'their', 'will', 'each', 'make', 'like', 'just', 'them', 'than', 'very', 'when', 'what', 'some', 'than', 'also', 'into', 'year', 'more', 'other', 'about', 'would', 'there', 'these', 'could', 'after', 'should', 'being', 'those', 'between', 'through', 'during', 'before']);
  for (const t of tokens) {
    if (t.length > 4 && !stopwords.has(t)) {
      phrases.push(t);
    }
  }

  return [...new Set(phrases)];
}

function computeTokenOverlap(textA: string, textB: string): number {
  const tokensA = new Set(tokenize(textA));
  const tokensB = new Set(tokenize(textB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return Math.round((overlap / union) * 100);
}

function extractSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

// ─── Analysis Functions ─────────────────────────────────────────────────────

function generateSummary(problem: Problem): string {
  const sentences = extractSentences(problem.description || '');
  if (sentences.length === 0) {
    return `A problem titled "${problem.title}" has been reported in ${problem.district || 'an unspecified location'}, Jharkhand.`;
  }

  // Take the first 2-3 most informative sentences
  const summaryParts: string[] = [];
  const maxSentences = Math.min(3, sentences.length);

  for (let i = 0; i < maxSentences; i++) {
    // Prefer sentences with more content words
    summaryParts.push(sentences[i]);
  }

  let summary = summaryParts.join('. ');
  if (!summary.endsWith('.')) summary += '.';

  // Add location context if not in the summary
  const locationMentioned = summary.toLowerCase().includes((problem.district || '').toLowerCase());
  if (!locationMentioned && problem.district) {
    summary += ` This issue was reported from ${problem.district}, Jharkhand.`;
  }

  return summary;
}

function classifyProblem(problem: Problem): AIClassification {
  const domain = problem.domain || 'governance';
  const domainLabel = DOMAIN_LABELS[domain] || domain;
  const subcategory = problem.subcategory || 'General';

  // Extract real keywords from the problem content
  const content = `${problem.title} ${problem.description} ${problem.subcategory || ''}`;
  const phrases = extractKeyPhrases(content);

  // Score keywords by frequency relevance
  const keywordCandidates: Map<string, number> = new Map();
  for (const phrase of phrases) {
    const count = keywordCandidates.get(phrase) || 0;
    keywordCandidates.set(phrase, count + 1);
  }

  // Sort by frequency and take top keywords
  const keywords = [...keywordCandidates.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  // Map expertise from domain + content analysis
  const baseExpertise = DOMAIN_EXPERTISE_MAP[domain] || ['General Research', 'Public Policy'];
  const expertise = baseExpertise.slice(0, 4);

  // Check for cross-domain expertise needs
  const contentLower = content.toLowerCase();
  if (contentLower.includes('iot') || contentLower.includes('sensor') || contentLower.includes('monitor')) {
    if (!expertise.includes('IoT/Sensor Technology')) expertise.push('IoT/Sensor Technology');
  }
  if (contentLower.includes('data') || contentLower.includes('analytics') || contentLower.includes('dashboard')) {
    if (!expertise.includes('Data Science')) expertise.push('Data Science');
  }
  if (contentLower.includes('mobile') || contentLower.includes('app') || contentLower.includes('software')) {
    if (!expertise.includes('Software Engineering')) expertise.push('Software Engineering');
  }

  const suggestedDepartment = DOMAIN_DEPARTMENT_MAP[domain] || `${domainLabel} Department`;

  return { domain, domainLabel, subcategory, keywords, requiredExpertise: expertise, suggestedDepartment };
}

function assessPriority(problem: Problem): AIPriority {
  let score = 30; // Base score
  const factors: AIPriority['factors'] = [];
  const content = `${problem.title} ${problem.description}`.toLowerCase();

  // Factor 1: Severity
  const severityMap: Record<string, number> = { low: 5, medium: 15, high: 25, critical: 35 };
  const severityScore = severityMap[problem.severity || 'medium'] || 15;
  score += severityScore;
  factors.push({
    name: 'Reported Severity',
    impact: `${(problem.severity || 'medium').toUpperCase()} severity adds ${severityScore} points`,
    weight: severityScore,
  });

  // Factor 2: Affected population
  const pop = problem.affectedPopulation || problem.affected_people || 100;
  let popScore = 0;
  if (pop >= 10000) popScore = 20;
  else if (pop >= 5000) popScore = 16;
  else if (pop >= 1000) popScore = 12;
  else if (pop >= 500) popScore = 8;
  else if (pop >= 100) popScore = 5;
  else popScore = 2;
  score += popScore;
  factors.push({
    name: 'Affected Population',
    impact: `${pop.toLocaleString()} people affected contributes ${popScore} points`,
    weight: popScore,
  });

  // Factor 3: Urgency keywords
  let urgencyScore = 0;
  const matchedCategories: string[] = [];
  for (const entry of URGENCY_KEYWORDS) {
    for (const word of entry.words) {
      if (content.includes(word)) {
        urgencyScore += entry.weight;
        if (!matchedCategories.includes(entry.category)) {
          matchedCategories.push(entry.category);
        }
        break; // Only count each category once
      }
    }
  }
  urgencyScore = Math.min(urgencyScore, 30); // Cap at 30
  score += urgencyScore;
  if (matchedCategories.length > 0) {
    factors.push({
      name: 'Urgency Analysis',
      impact: `Detected: ${matchedCategories.join(', ')}`,
      weight: urgencyScore,
    });
  }

  // Cap total score at 100
  score = Math.min(Math.max(score, 10), 98);

  // Determine level
  let level: AIPriorityLevel;
  if (score >= 85) level = 'CRITICAL';
  else if (score >= 65) level = 'HIGH';
  else if (score >= 40) level = 'MEDIUM';
  else level = 'LOW';

  // Generate reason
  const reasonParts: string[] = [];
  if (problem.severity === 'critical' || problem.severity === 'high') {
    reasonParts.push(`the reported ${problem.severity} severity`);
  }
  if (pop >= 500) {
    reasonParts.push(`a large affected population of ${pop.toLocaleString()} people`);
  }
  if (matchedCategories.length > 0) {
    reasonParts.push(`factors related to ${matchedCategories.slice(0, 3).join(', ').toLowerCase()}`);
  }
  if (reasonParts.length === 0) {
    reasonParts.push('the reported information and standard assessment criteria');
  }

  const reason = `The assessment considers ${reasonParts.join(', ')}.`;

  return { level, score, reason, factors };
}

function performVerification(problem: Problem, completeness: AICompleteness): AIVerification {
  let confidence = 50; // Base confidence

  // More complete submissions get higher confidence
  confidence += Math.floor(completeness.score * 0.3);

  // Description length adds confidence
  const descLen = (problem.description || '').length;
  if (descLen > 200) confidence += 10;
  else if (descLen > 100) confidence += 5;

  // Location specificity adds confidence
  if (problem.village) confidence += 3;
  if (problem.block) confidence += 3;
  if (problem.district) confidence += 4;

  // Evidence adds confidence
  const evidenceCount = problem.evidence?.length || 0;
  if (evidenceCount > 0) confidence += 5 + Math.min(evidenceCount * 2, 6);

  confidence = Math.min(Math.max(confidence, 30), 95);

  // Determine status
  let status: AIVerificationStatus;
  if (completeness.score < 50) {
    status = 'INSUFFICIENT_INFORMATION';
  } else if (completeness.missingInformation.length > 2) {
    status = 'NEEDS_REVIEW';
  } else {
    status = 'ASSESSED';
  }

  // Generate explanation
  let explanation: string;
  if (status === 'ASSESSED') {
    explanation = 'The submitted problem description, location, impact, and supporting information are sufficiently consistent and detailed for government review.';
  } else if (status === 'NEEDS_REVIEW') {
    explanation = `The submission provides a reasonable description but is missing some information (${completeness.missingInformation.join(', ')}). Additional details would strengthen the report for government verification.`;
  } else {
    explanation = 'The submitted information is insufficient for a complete assessment. Key details such as location, impact description, or problem specifics are missing. Government officers may need to request additional information from the citizen.';
  }

  return { status, confidence, explanation };
}

function checkCompleteness(problem: Problem): AICompleteness {
  const provided: string[] = [];
  const missing: string[] = [];
  const flags: string[] = [];

  // Check each field
  if (problem.title && problem.title.length >= 10) provided.push('Problem title');
  else missing.push('Detailed problem title');

  if (problem.description && problem.description.length >= 50) provided.push('Problem description');
  else if (problem.description && problem.description.length > 0) { provided.push('Problem description (brief)'); flags.push('Description is shorter than recommended'); }
  else missing.push('Problem description');

  if (problem.domain) provided.push('Problem domain');
  else missing.push('Problem domain/category');

  if (problem.subcategory) provided.push('Problem subcategory');
  else missing.push('Problem subcategory');

  if (problem.district) provided.push('District location');
  else missing.push('District location');

  if (problem.block) provided.push('Block/tehsil');
  else missing.push('Specific block/tehsil');

  if (problem.village) provided.push('Village/ward');
  else missing.push('Specific village or ward name');

  const pop = problem.affectedPopulation || problem.affected_people;
  if (pop && pop > 0) provided.push('Affected population estimate');
  else missing.push('Affected population estimate');

  if (problem.severity) provided.push('Severity assessment');
  else missing.push('Severity assessment');

  const evidenceCount = problem.evidence?.length || 0;
  if (evidenceCount > 0) provided.push(`Supporting evidence (${evidenceCount} file${evidenceCount > 1 ? 's' : ''})`);
  else missing.push('Supporting evidence (photos, documents, etc.)');

  // Consistency checks
  if (problem.description && problem.title) {
    const titleTokens = new Set(tokenize(problem.title));
    const descTokens = new Set(tokenize(problem.description));
    let titleInDesc = 0;
    for (const t of titleTokens) {
      if (descTokens.has(t)) titleInDesc++;
    }
    if (titleTokens.size > 0 && titleInDesc / titleTokens.size < 0.2) {
      flags.push('Title and description may not align closely');
    }
  }

  // Score calculation
  const totalChecks = provided.length + missing.length;
  const score = totalChecks > 0 ? Math.round((provided.length / totalChecks) * 100) : 0;

  return { score, providedFields: provided, missingInformation: missing, consistencyFlags: flags };
}

function detectDuplicates(
  problem: Problem,
  allProblems: Problem[],
): AIDuplicateDetection {
  const candidateContent = `${problem.title} ${problem.description} ${problem.subcategory || ''}`;
  const candidateDistrict = (problem.district || '').toLowerCase();

  const similar: AIDuplicateDetection['similarProblems'] = [];

  for (const existing of allProblems) {
    // Don't compare with self
    if (existing.id === problem.id || existing.problem_id === problem.id) continue;

    const existingContent = `${existing.title} ${existing.description} ${existing.subcategory || ''}`;

    // Compute content similarity
    let similarity = computeTokenOverlap(candidateContent, existingContent);

    // Boost if same domain
    if (existing.domain === problem.domain) similarity += 8;

    // Boost if same district
    if ((existing.district || '').toLowerCase() === candidateDistrict && candidateDistrict) {
      similarity += 7;
    }

    // Cap at 98
    similarity = Math.min(similarity, 98);

    if (similarity >= 25) {
      similar.push({
        id: existing.id || existing.problem_id || 'unknown',
        title: existing.title,
        similarity,
        status: existing.verification_status || existing.status || 'Unknown',
      });
    }
  }

  // Sort by similarity descending
  similar.sort((a, b) => b.similarity - a.similarity);
  const topSimilar = similar.slice(0, 5);

  // Determine duplicate status
  let status: AIDuplicateStatus = 'UNIQUE';
  let confidence = 90;
  let explanation = 'No existing problem was found with a sufficiently similar description, domain, and location.';

  if (topSimilar.length > 0 && topSimilar[0].similarity >= 70) {
    status = 'LIKELY_DUPLICATE';
    confidence = topSimilar[0].similarity;
    explanation = `A highly similar problem (${topSimilar[0].id}) was found with ${topSimilar[0].similarity}% similarity. The reports share significant overlap in description, domain, and/or location. Government review is recommended to determine whether these should be merged.`;
  } else if (topSimilar.length > 0 && topSimilar[0].similarity >= 45) {
    status = 'POSSIBLE_DUPLICATE';
    confidence = topSimilar[0].similarity;
    explanation = `A potentially related problem (${topSimilar[0].id}) was found with ${topSimilar[0].similarity}% similarity. The reports share some common elements. Both submissions have been retained for government review.`;
  } else if (topSimilar.length > 0) {
    confidence = 100 - topSimilar[0].similarity;
    explanation = `Some loosely related problems were found, but none with sufficient similarity to suggest duplication. This appears to be a unique report.`;
  }

  return { status, confidence, similarProblems: topSimilar, explanation };
}

function generateExplanation(
  problem: Problem,
  classification: AIClassification,
  priority: AIPriority,
  verification: AIVerification,
  duplicateDetection: AIDuplicateDetection,
): string {
  const parts: string[] = [];

  // Category explanation
  parts.push(`This problem has been categorized under ${classification.domainLabel} — ${classification.subcategory} based on the reported description and identified keywords.`);

  // Priority explanation
  parts.push(`The priority is assessed as ${priority.level} (${priority.score}/100) considering ${priority.factors.map(f => f.name.toLowerCase()).join(', ')}.`);

  // Verification explanation
  parts.push(`The verification assessment is "${verification.status}" with ${verification.confidence}% confidence. ${verification.explanation}`);

  // Duplicate explanation
  if (duplicateDetection.status === 'UNIQUE') {
    parts.push('No significant duplicate or similar problem was found in the existing database.');
  } else {
    parts.push(duplicateDetection.explanation);
  }

  return parts.join(' ');
}

function generateRecommendedAction(
  priority: AIPriority,
  verification: AIVerification,
  duplicateDetection: AIDuplicateDetection,
): string {
  if (duplicateDetection.status === 'LIKELY_DUPLICATE') {
    return 'Government review is recommended to determine whether this report should be merged with the identified similar problem.';
  }
  if (verification.status === 'INSUFFICIENT_INFORMATION') {
    return 'The government officer should request additional information from the citizen before proceeding with verification.';
  }
  if (priority.level === 'CRITICAL') {
    return 'Immediate government attention is recommended due to the critical nature of this problem.';
  }
  if (priority.level === 'HIGH') {
    return 'Priority government review is recommended. This problem should be processed promptly.';
  }
  return 'Government review is recommended. The submission will be processed according to standard procedures.';
}

// ─── Main Analysis Entry Point ──────────────────────────────────────────────

const AI_DISCLAIMER = 'AI-generated analysis is based on the submitted information and computational assessment. This is an automated preliminary report subject to government verification. Final decisions rest with authorized government officers.';

export const aiAnalysisService = {
  /**
   * Analyze a problem and generate a complete AI report.
   * All analysis is based on the actual submitted data.
   *
   * @param problem - The submitted problem
   * @param allProblems - All existing problems (for duplicate detection)
   * @param onStage - Optional callback for processing stage updates
   */
  async analyzeProblem(
    problem: Problem,
    allProblems: Problem[],
    onStage?: StageCallback,
  ): Promise<AIReport> {
    onStage?.('received');

    // If Gemini is available, run real Gemini 3.5 Flash-Lite analysis
    if (geminiService.isAvailable()) {
      try {
        onStage?.('understanding');

        // Execute problem analysis and duplicate check
        const [geminiAnalysis, geminiDuplicate] = await Promise.all([
          (async () => {
            onStage?.('categorizing');
            const res = await geminiService.analyzeProblem(problem);
            onStage?.('assessing_priority');
            return res;
          })(),
          (async () => {
            onStage?.('checking_duplicates');
            return await geminiService.detectDuplicates(problem, allProblems);
          })(),
        ]);

        onStage?.('verification');

        // Map candidate similar problems with full titles from allProblems
        const matchedSimilar = geminiDuplicate.possibleDuplicateProblemIds.map((simId) => {
          const match = allProblems.find((p) => (p.id || p.problem_id) === simId);
          return {
            id: simId,
            title: match?.title || `Problem ${simId}`,
            similarity: geminiDuplicate.similarityScore,
            status: match?.status || 'Active',
          };
        });

        // Determine verification status
        let verificationStatus: AIVerificationStatus = 'ASSESSED';
        if (geminiDuplicate.hasPotentialDuplicate && geminiDuplicate.similarityScore >= 70) {
          verificationStatus = 'POSSIBLE_DUPLICATE';
        } else if (geminiAnalysis.requiresGovernmentVerification || geminiAnalysis.urgency === 'Critical' || geminiAnalysis.urgency === 'High') {
          verificationStatus = 'NEEDS_REVIEW';
        }

        const report: AIReport = {
          id: `AIR-${problem.id}`,
          problemId: problem.id || problem.problem_id || '',
          summary: geminiAnalysis.summary,
          classification: {
            domain: problem.domain || 'water',
            domainLabel: DOMAIN_LABELS[problem.domain] || geminiAnalysis.category,
            subcategory: problem.subcategory, // Preserves citizen manual entry verbatim
            keywords: geminiAnalysis.technicalDomains,
            requiredExpertise: geminiAnalysis.technicalDomains,
            suggestedDepartment: geminiAnalysis.recommendedDepartments[0] || DOMAIN_DEPARTMENT_MAP[problem.domain],
          },
          verification: {
            status: verificationStatus,
            confidence: geminiAnalysis.aiConfidence,
            explanation: geminiAnalysis.reasoningSummary,
          },
          completeness: checkCompleteness(problem),
          priority: {
            level: (geminiAnalysis.urgency.toUpperCase() as AIPriorityLevel) || 'MEDIUM',
            score: geminiAnalysis.impactLevel,
            reason: geminiAnalysis.reasoningSummary,
            factors: [
              { name: 'Reported Severity', impact: geminiAnalysis.severity, weight: 35 },
              { name: 'Civic Urgency', impact: geminiAnalysis.urgency, weight: 30 },
              { name: 'Complexity', impact: geminiAnalysis.estimatedComplexity, weight: 20 },
              { name: 'Feasibility Score', impact: `${geminiAnalysis.feasibilityScore}/100`, weight: 15 },
            ],
          },
          duplicateDetection: {
            status: geminiDuplicate.hasPotentialDuplicate
              ? geminiDuplicate.similarityScore >= 75
                ? 'LIKELY_DUPLICATE'
                : 'POSSIBLE_DUPLICATE'
              : 'UNIQUE',
            confidence: geminiDuplicate.similarityScore,
            similarProblems: matchedSimilar,
            explanation: geminiDuplicate.reason,
          },
          aiExplanation: geminiAnalysis.reasoningSummary,
          recommendedAction: geminiAnalysis.recommendedApproach.join('. ') || 'Standard government officer review recommended.',
          processingStatus: 'completed',
          analyzedAt: new Date().toISOString(),
          disclaimer: AI_DISCLAIMER,
          geminiAnalysis,
          geminiDuplicate,
          modelUsed: GEMINI_MODEL,
        };

        const parsed = aiReportSchema.safeParse(report);
        if (parsed.success) {
          return parsed.data;
        } else {
          console.warn('[aiAnalysisService] Zod schema validation notice:', parsed.error.format());
          return report;
        }
      } catch (geminiErr: any) {
        console.error('[aiAnalysisService] Gemini 3.5 Flash-Lite execution failed:', geminiErr?.message || geminiErr);
        // Safe non-blocking failure: problem remains created, citizen informed gracefully
        return {
          id: `AIR-${problem.id}`,
          problemId: problem.id || problem.problem_id || '',
          summary: 'AI analysis is temporarily unavailable. Your problem has been submitted successfully and queued for official government review.',
          classification: {
            domain: problem.domain || 'water',
            domainLabel: DOMAIN_LABELS[problem.domain] || problem.domain || 'Civic Infrastructure',
            subcategory: problem.subcategory,
            keywords: [problem.domain, problem.subcategory].filter(Boolean) as string[],
            requiredExpertise: ['Civic Engineering'],
          },
          verification: {
            status: 'NEEDS_REVIEW',
            confidence: 0,
            explanation: 'Automated AI analysis is currently unavailable. An authorized officer will inspect this grievance directly.',
          },
          completeness: checkCompleteness(problem),
          priority: {
            level: (problem.severity?.toUpperCase() as AIPriorityLevel) || 'MEDIUM',
            score: 50,
            reason: 'Triage pending official verification',
            factors: [],
          },
          duplicateDetection: {
            status: 'UNIQUE',
            confidence: 0,
            similarProblems: [],
            explanation: 'Duplicate check pending officer review.',
          },
          aiExplanation: 'Automated Gemini AI analysis is currently offline. Your problem has been safely registered in the government queue.',
          recommendedAction: 'Official government verification recommended.',
          processingStatus: 'failed',
          analyzedAt: new Date().toISOString(),
          disclaimer: AI_DISCLAIMER,
          modelUsed: GEMINI_MODEL,
        };
      }
    }

    // Fallback if no API key configured: show clean unavailable notice rather than fake/mock data
    return {
      id: `AIR-${problem.id}`,
      problemId: problem.id || problem.problem_id || '',
      summary: 'AI analysis is temporarily unavailable. Your problem has been submitted successfully and queued for official government review.',
      classification: {
        domain: problem.domain || 'water',
        domainLabel: DOMAIN_LABELS[problem.domain] || problem.domain || 'Civic Infrastructure',
        subcategory: problem.subcategory,
        keywords: [problem.domain, problem.subcategory].filter(Boolean) as string[],
        requiredExpertise: ['Civic Engineering'],
      },
      verification: {
        status: 'NEEDS_REVIEW',
        confidence: 0,
        explanation: 'Gemini AI API key not configured. Problem queued for manual review.',
      },
      completeness: checkCompleteness(problem),
      priority: {
        level: (problem.severity?.toUpperCase() as AIPriorityLevel) || 'MEDIUM',
        score: 50,
        reason: 'Pending officer assessment',
        factors: [],
      },
      duplicateDetection: {
        status: 'UNIQUE',
        confidence: 0,
        similarProblems: [],
        explanation: 'No automated duplicate check performed.',
      },
      aiExplanation: 'AI analysis service is not configured. Government verification will proceed normally.',
      recommendedAction: 'Standard administrative review recommended.',
      processingStatus: 'failed',
      analyzedAt: new Date().toISOString(),
      disclaimer: AI_DISCLAIMER,
      modelUsed: 'None',
    };
  },
};
