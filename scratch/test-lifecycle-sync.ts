class MockStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

(globalThis as any).localStorage = new MockStorage();
(globalThis as any).sessionStorage = new MockStorage();

import { db } from '../src/services/db';
import { problemService } from '../src/services/problemService';
import { matchingService } from '../src/services/matchingService';

async function runLifecycleSyncTest() {
  console.log('--- STARTING REAL PROBLEM LIFECYCLE SYNCHRONIZATION TEST ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Citizen Submits Problem
  const testCitizenId = 'cit-sync-test-999';
  const testCitizenName = 'Aarav Sharma';
  
  const createdProblem = await problemService.submit({
    id: 'P-TEST-SYNC-1',
    citizenId: testCitizenId,
    citizenName: testCitizenName,
    title: 'Severe Groundwater Salinity in Zone 4',
    description: 'Borewell water has high TDS (>1800 ppm), causing health issues in the community.',
    category: 'Water & Sanitation',
    domain: 'Water Management',
    district: 'Ranchi',
    state: 'Jharkhand',
    affectedPopulation: 4500,
    severity: 'high'
  });

  assert(!!createdProblem && !!createdProblem.id, `Citizen problem submitted with ID: ${createdProblem?.id}`);
  assert(createdProblem.status === 'Submitted' || createdProblem.status === 'Open', `Initial status is '${createdProblem.status}'`);

  // 2. Citizen Dashboard & My Problems Query Check
  const myProblems = await problemService.getByCitizen(testCitizenId, undefined, testCitizenName);
  assert(myProblems.some(p => p.id === createdProblem.id), `Problem appears in citizen's personal list (count: ${myProblems.length})`);

  // 3. Government Verifies Problem
  const verified = await db.updateProblem(createdProblem.id, {
    status: 'Verified',
    government_assigned: 'dept-water-resources',
    verified_at: new Date().toISOString()
  });
  assert(verified?.status === 'Verified', `Problem updated to 'Verified' by Government`);

  // 4. University Accepts Problem
  const universityAssigned = await db.updateProblem(createdProblem.id, {
    status: 'Assigned',
    assigned_university: 'BIT Sindri',
    assigned_university_name: 'Birla Institute of Technology Sindri',
    assigned_at: new Date().toISOString()
  });
  assert(universityAssigned?.status === 'Assigned', `Problem updated to 'Assigned' (University: ${universityAssigned?.assigned_university_name})`);

  // 5. University Assigns Faculty & Student Team
  const facultyTeamAssigned = await matchingService.assignFacultyAndTeam({
    problemId: createdProblem.id,
    universityId: 'univ1',
    facultyId: 'fac-1',
    teamId: 'team-1',
    assignedBy: 'Dr. Anita Sharma',
    facultyMatchScore: 92,
    teamMatchScore: 88,
    assignmentType: 'AI Recommended'
  });
  const updatedProblemAfterAssign = await db.getProblemById(createdProblem.id);
  assert(updatedProblemAfterAssign?.status === 'Faculty Assigned', `Problem updated to 'Faculty Assigned' (Faculty: ${updatedProblemAfterAssign?.assigned_faculty_name}, Team: ${updatedProblemAfterAssign?.assigned_team_name})`);

  // 6. Faculty Accepts Assignment
  const facultyAccepted = await matchingService.respondToFacultyAssignment(facultyTeamAssigned.id, 'Accepted');
  assert(facultyAccepted?.faculty_status === 'Accepted', `Faculty responded with 'Accepted'`);
  const updatedProblemAfterFaculty = await db.getProblemById(createdProblem.id);
  assert(updatedProblemAfterFaculty?.status === 'Faculty Accepted', `Problem status updated to 'Faculty Accepted'`);

  // 7. Student Team Accepts Assignment -> Activates Project to 'In Progress'
  const teamAccepted = await matchingService.respondToTeamAssignment(facultyTeamAssigned.id, 'Accepted');
  assert(teamAccepted?.team_status === 'Accepted', `Team responded with 'Accepted'`);
  const updatedProblemAfterTeam = await db.getProblemById(createdProblem.id);
  assert(updatedProblemAfterTeam?.status === 'In Progress' && updatedProblemAfterTeam?.project_status === 'PROJECT_ACTIVE', `Problem status updated to 'In Progress' with active project`);

  // 8. Industry Applies and Gets Approved
  const collabApp = db.submitIndustryApplication({
    id: `collab-${Date.now()}`,
    problem_id: createdProblem.id,
    projectId: createdProblem.id,
    project: createdProblem.title,
    universityId: 'univ1',
    universityName: 'BIT Sindri',
    facultyId: 'fac-1',
    facultyName: 'Dr. Anita Sharma',
    industryPartnerId: 'ind-org-42',
    industryPartner: 'AquaTech Clean Water CSR',
    requestType: ['Co-Funding & Grants', 'Technical Mentorship'],
    expectedOutcome: 'Commercial-grade RO and UV water purification plant deployed.',
    status: 'submitted',
  });
  assert(!!collabApp, `Industry collaboration application submitted with ID: ${collabApp.id}`);

  const reviewedCollab = db.reviewIndustryApplication(collabApp.id, 'accepted', {
    industryPartnerName: 'AquaTech Clean Water CSR',
    industryMentorName: 'Dr. K. S. Murthy',
    fundingCommitment: 1500000,
    technicalSupportDetails: 'Field RO telemetry and membrane filtration sensors.',
  });
  assert(reviewedCollab?.status === 'accepted', `Industry collaboration application accepted`);
  const updatedProblemAfterIndustry = await db.getProblemById(createdProblem.id);
  assert(updatedProblemAfterIndustry?.status === 'Industry Collaboration', `Problem updated to 'Industry Collaboration' upon CSR approval`);

  // 9. Government Evaluates Final Project & Approves Resolution
  const resolved = db.evaluateFinalProject(
    createdProblem.id,
    'validated_for_scale',
    'Project completed successfully with reverse osmosis pilot plant deployed.',
    ['Ranchi', 'Ramgarh']
  );
  assert(resolved?.status === 'validated_for_scale', `Government evaluation approved for scale`);

  // 10. Citizen Track Status verification
  const finalProblemState = await db.getProblemById(createdProblem.id);
  assert(finalProblemState?.status === 'resolved', `Final state for citizen tracking is 'resolved'`);
  assert(finalProblemState?.assigned_university_name === 'Birla Institute of Technology Sindri', `University name preserved for citizen tracking`);
  assert(finalProblemState?.assigned_faculty_name === 'Dr. Anita Sharma', `Faculty name preserved for citizen tracking`);
  assert(finalProblemState?.assigned_team_name === 'Team Innovators-07', `Team name preserved for citizen tracking`);
  assert(finalProblemState?.affectedPopulation === 4500, `Affected population preserved`);

  console.log(`\n================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runLifecycleSyncTest().catch(err => {
  console.error(err);
  process.exit(1);
});
