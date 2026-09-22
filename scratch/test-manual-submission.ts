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

async function testManualSubmission() {
  console.log('--- TESTING CITIZEN MANUAL PROBLEM SUBMISSION ---');
  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Test 1: Submit a problem with completely custom manual values
  const customSubcategory = 'Drainage Desiltation & Waste Clearing';
  const customVillage = 'Agripalli North Sector';
  const testCitizenId = 'cit-manual-test-101';
  const testCitizenName = 'Sunita Murmu';

  const newProblem = await problemService.submit({
    id: 'P-MANUAL-TEST-01',
    citizenId: testCitizenId,
    citizenName: testCitizenName,
    title: 'Severe Drain Blockage in Agripalli North Sector',
    description: 'Monsoon runoff is backing up into homes due to heavy silt and uncollected debris in main stormwater drain.',
    domain: 'infrastructure',
    category: 'Infrastructure',
    subcategory: customSubcategory,
    district: 'Ranchi',
    districtId: 'ranchi',
    state: 'Jharkhand',
    location: `${customVillage}, Ranchi, Jharkhand`,
    block: 'Kanke',
    village: customVillage,
    affectedPopulation: 2300,
    severity: 'high',
    priority: 'high',
  });

  assert(!!newProblem && !!newProblem.id, `Problem created with ID: ${newProblem?.id}`);
  assert(newProblem.subcategory === customSubcategory, `Subcategory saved exact manual string: "${newProblem.subcategory}"`);
  assert(newProblem.village === customVillage, `Village saved exact manual string: "${newProblem.village}"`);
  assert(newProblem.status === 'Submitted' || newProblem.status === 'Open', `Initial status is '${newProblem.status}'`);

  // Test 2: Problem appears in citizen's personal list (My Problems)
  const myProblems = await problemService.getByCitizen(testCitizenId, undefined, testCitizenName);
  const found = myProblems.find(p => p.id === newProblem.id);
  assert(!!found, `Problem found in citizen's My Problems query (total problems: ${myProblems.length})`);
  assert(found?.subcategory === customSubcategory, `Retrieved subcategory matches manual input: "${found?.subcategory}"`);
  assert(found?.village === customVillage, `Retrieved village matches manual input: "${found?.village}"`);

  // Test 3: Problem appears in global db getProblems (used by verification queue and dashboards)
  const allProblems = db.getProblems();
  const foundInAll = allProblems.find(p => p.id === newProblem.id);
  assert(!!foundInAll, `Problem found in global database problem pool`);
  assert(foundInAll?.location?.includes(customVillage) === true, `Location string accurately incorporates manual village: "${foundInAll?.location}"`);

  console.log(`\n================================`);
  console.log(`MANUAL SUBMISSION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`================================`);

  if (failed > 0) process.exit(1);
}

testManualSubmission().catch(err => {
  console.error(err);
  process.exit(1);
});
