import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^VITE_GEMINI_API_KEY=(.+)$/);
    if (match) {
      apiKey = match[1].trim();
      break;
    }
  }
}
console.log('Testing with API key present:', !!apiKey);

if (!apiKey) {
  console.error('Error: VITE_GEMINI_API_KEY is not defined in .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const MODEL = 'gemini-3.5-flash-lite';

async function testAll() {
  console.log('\n--- 1. Testing Live Problem Analysis with gemini-3.5-flash-lite ---');
  const sampleProblem = {
    title: 'Severe Arsenic and Fluoride Contamination in Village Borewells',
    category: 'Water Quality',
    subcategory: 'Groundwater Contamination',
    district: 'Ranchi',
    village: 'Hesag',
    description: 'Multiple village tube wells show yellow tint and metallic taste. Health center reported teeth staining and joint pains among schoolchildren. Over 400 households depend exclusively on these wells.',
    affectedPopulation: 1200,
  };

  const analysisPrompt = `Analyze the following citizen-reported problem:
Title: ${sampleProblem.title}
Category: ${sampleProblem.category}
Subcategory: ${sampleProblem.subcategory}
District: ${sampleProblem.district}
Village: ${sampleProblem.village}
Description: ${sampleProblem.description}
Affected Population: ${sampleProblem.affectedPopulation}`;

  const analysisResp = await ai.models.generateContent({
    model: MODEL,
    contents: analysisPrompt,
    config: {
      systemInstruction: 'You are an expert civic engineering & grievance triage AI for Jharkhand JanSamadhan Hub. Provide accurate, practical assessments.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          urgency: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
          impactLevel: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          feasibilityScore: { type: Type.INTEGER },
          technicalDomains: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedDepartments: { type: Type.ARRAY, items: { type: Type.STRING } },
          potentialCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
          potentialRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedApproach: { type: Type.STRING },
          aiConfidence: { type: Type.INTEGER },
          reasoningSummary: { type: Type.STRING },
        },
        required: [
          'summary', 'severity', 'urgency', 'impactLevel', 'feasibilityScore',
          'technicalDomains', 'recommendedDepartments', 'potentialCauses',
          'potentialRisks', 'recommendedApproach', 'aiConfidence', 'reasoningSummary'
        ],
      },
    },
  });

  const analysis = JSON.parse(analysisResp.text || '{}');
  console.log('✓ Analysis result received:');
  console.log('  Severity:', analysis.severity);
  console.log('  Feasibility Score:', analysis.feasibilityScore);
  console.log('  AI Confidence:', analysis.aiConfidence);
  console.log('  Technical Domains:', analysis.technicalDomains);
  console.log('  Recommended Approach:', analysis.recommendedApproach.slice(0, 100) + '...');

  console.log('\n--- 2. Testing Live Duplicate Detection with gemini-3.5-flash-lite ---');
  const duplicateResp = await ai.models.generateContent({
    model: MODEL,
    contents: `New: ${sampleProblem.title} in Hesag, Ranchi.
Candidate 1: Borewell drinking water testing high for heavy metals in Hesag village.
Candidate 2: Broken solar streetlights along highway in Ormanjhi.`,
    config: {
      systemInstruction: 'Identify duplicate or closely related civic issues.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hasPotentialDuplicate: { type: Type.BOOLEAN },
          similarityScore: { type: Type.INTEGER },
          possibleDuplicateProblemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          reason: { type: Type.STRING },
        },
        required: ['hasPotentialDuplicate', 'similarityScore', 'possibleDuplicateProblemIds', 'reason'],
      },
    },
  });

  const dup = JSON.parse(duplicateResp.text || '{}');
  console.log('✓ Duplicate check result:');
  console.log('  Has duplicate:', dup.hasPotentialDuplicate);
  console.log('  Similarity score:', dup.similarityScore);
  console.log('  Reason:', dup.reason.slice(0, 100) + '...');

  console.log('\n--- 3. Testing Live Academic University Matching with gemini-3.5-flash-lite ---');
  const uniResp = await ai.models.generateContent({
    model: MODEL,
    contents: `Problem: Water contamination in Ranchi borewells.
Universities:
1. BIT Mesra (id: u1) - Depts: Environmental Science, Chemical Engineering, Civil Engineering.
2. Ranchi University (id: u2) - Depts: Zoology, Botany, Chemistry.`,
    config: {
      systemInstruction: 'Recommend the best matching accredited academic institutions for technical research.',
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
                matchScore: { type: Type.INTEGER },
                matchingDomains: { type: Type.ARRAY, items: { type: Type.STRING } },
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

  const unis = JSON.parse(uniResp.text || '{}');
  console.log('✓ University recommendations:');
  console.log(JSON.stringify(unis.recommendations, null, 2));

  console.log('\n=============================================');
  console.log('ALL GEMINI 3.5 FLASH-LITE LIVE API TESTS PASSED!');
  console.log('=============================================');
}

testAll().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
