// Automated Test Script for End-to-End AI Industry Collaboration Workflow
const storageMap = new Map<string, string>();
(global as any).localStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

import { db } from '../src/services/db';

async function runTest() {
  console.log('--- Step 1: Initialize Database & Verify Seed Cleanliness ---');
  db.initialize();

  const initialCollabs = db.getIndustryCollaborations('P-1029');
  console.log(`P-1029 Initial Collaborations Count: ${initialCollabs.length}`);
  if (initialCollabs.length > 0) {
    console.log(`P-1029 status: ${initialCollabs[0].status}`);
  } else {
    console.log('P-1029 has NO premature industry request (Correct: not_requested).');
  }

  console.log('\n--- Step 2: AI Industry Matching Engine for P-1029 (Transformer Issue) ---');
  const recs = db.getIndustryRecommendations('P-1029', [
    'Funding',
    'Technical Mentorship',
    'Hardware / Equipment',
    'Field Testing',
  ]);
  console.log(`AI Recommendations Found: ${recs.length}`);
  recs.forEach((r, idx) => {
    console.log(`\nRecommendation #${idx + 1}: ${r.partner.name}`);
    console.log(`Sector: ${r.partner.sector}`);
    console.log(`Match Score: ${r.matchScore}% (${r.fitLevel} Relevance)`);
    console.log('Reasons:');
    r.matchReasons.forEach(reason => console.log(`  ${reason}`));
  });

  // Verify that AgriTech or AquaTech are NOT recommended for an electrical problem
  const hasAgri = recs.some(r => r.partner.id === 'partner-agritech-01');
  const hasAqua = recs.some(r => r.partner.id === 'partner-aquatech-04');
  console.log(`\nIs AgriTech in recommendations? ${hasAgri} (Should be false)`);
  console.log(`Is AquaTech in recommendations? ${hasAqua} (Should be false)`);
  if (hasAgri || hasAqua) {
    throw new Error('AI Matching failed: recommended unrelated partner for electrical problem!');
  }

  console.log('\n--- Step 3: Faculty Selects Industry & Sends Request to University SPOC ---');
  const facultyReq = db.submitFacultyIndustryRequest('P-1029', {
    selectedPartnerId: 'partner-juvnl-02',
    supportRequirements: ['Funding', 'Technical Mentorship', 'Hardware / Equipment', 'Field Testing'],
    whyNeeded: 'Substation telemetry protocols and high-voltage test bench validation required before field installation.',
    expectedOutcome: 'Deploy IoT transformer health monitor with auto-trip safety relay on campus transformer.',
    requestedFunding: 150000,
    expectedTimeline: '4 to 6 months',
  });
  console.log(`Faculty Request ID: ${facultyReq.id}`);
  console.log(`Status after Faculty selection: ${facultyReq.status}`);
  console.log(`SPOC Review Status: ${facultyReq.spocReviewStatus}`);
  if (facultyReq.status !== 'pending_spoc') {
    throw new Error(`Expected status 'pending_spoc' but got '${facultyReq.status}'!`);
  }

  console.log('\n--- Step 4: University SPOC Reviews & Dispatches Official Industry Application ---');
  const officialApp = db.spocSendOfficialIndustryApplication(
    facultyReq.id,
    'Institutional review complete. Endorsed by University SPOC for official co-pilot field development.'
  );
  if (!officialApp) throw new Error('SPOC dispatch returned null!');
  console.log(`Official Application ID: ${officialApp.applicationId}`);
  console.log(`Status after SPOC dispatch: ${officialApp.status}`);
  console.log(`SPOC Dispatched At: ${officialApp.spocDispatchedAt}`);
  if (officialApp.status !== 'submitted_to_industry') {
    throw new Error(`Expected status 'submitted_to_industry' but got '${officialApp.status}'!`);
  }

  console.log('\n--- Step 5: Industry Reviews Dossier & Accepts Collaboration ---');
  const acceptedCollab = db.reviewIndustryApplication(facultyReq.id, 'accepted', {
    industryPartnerName: 'Jharkhand Urja Vikas Nigam (JUVNL Technical Innovation Cell)',
    industryMentorName: 'Er. Saurabh Srivastava',
    industryMentorRole: 'Executive Engineer (Substations & SCADA)',
    fundingCommitment: 150000,
    fieldTestingDetails: 'Ramgarh 33/11kV Substation & College Distribution Yard',
    technicalSupportDetails: 'JUVNL SCADA IEC-60870-5-104 Telemetry Protocol Access',
    deploymentSupportDetails: 'High-Voltage Rogowski Calibration Bench, 24V Auxiliary DC Power Supply',
    durationMonths: 4,
  });
  if (!acceptedCollab) throw new Error('Industry acceptance returned null!');
  console.log(`Status after Industry Acceptance: ${acceptedCollab.status}`);
  console.log(`Assigned Industry Mentor: ${acceptedCollab.industryMentor}`);
  console.log(`Committed Funding: ₹${acceptedCollab.committedFunding?.toLocaleString()}`);

  const commitment = db.getIndustryCommitment('P-1029');
  console.log(`Industry Commitment Created: ${commitment?.industryPartnerName} (Funding: ₹${commitment?.fundingCommitted})`);

  const tasks = db.getWorkspaceTasks('P-1029');
  console.log(`Workspace Tasks Seeded: ${tasks.length} tasks ready for Students, Faculty & Industry.`);

  console.log('\n--- Step 6: Problem Ecosystem Lifecycle Stage ---');
  const eco = db.getProblemEcosystem('P-1029');
  console.log(`Current Lifecycle Stage: ${eco?.lifecycleStage}`);

  console.log('\n=== ALL WORKFLOW STAGES PASSED SUCCESSFULLY! ===');
}

runTest().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
