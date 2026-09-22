// Automated Verification Script for User Profile Drawer Across All 6 Roles
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

import { authBackend } from '../src/services/authBackend';
import { db } from '../src/services/db';
import type { UserRole } from '../src/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('VERIFYING USER PROFILE DRAWER DATA ACROSS ALL 6 PORTAL ROLES');
  console.log('================================================================\n');

  db.initialize();

  const ROLES_TO_TEST: { role: UserRole; email: string; label: string }[] = [
    { role: 'citizen', email: 'priya@example.com', label: 'Citizen Portal' },
    { role: 'government', email: 'rajesh@jharkhand.gov', label: 'Government Officer' },
    { role: 'university', email: 'anita@bitsindri.ac.in', label: 'University Admin' },
    { role: 'faculty', email: 'vinod@bitsindri.ac.in', label: 'Faculty Mentor' },
    { role: 'student', email: 'arjun@student.ac', label: 'Student Innovator' },
    { role: 'industry', email: 'meera@aquatech.com', label: 'Industry Partner' },
  ];

  for (const roleItem of ROLES_TO_TEST) {
    console.log(`\n--- Testing Profile Extraction for: ${roleItem.role.toUpperCase()} (${roleItem.email}) ---`);

    // 1. Authenticate user
    const users = db.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === roleItem.email.toLowerCase());
    assert(user !== undefined, `${roleItem.role}: User exists in database`);

    if (!user) continue;

    // 2. Validate basic user fields
    assert(Boolean(user.name), `${roleItem.role}: User name is defined (${user.name})`);
    assert(user.email === roleItem.email, `${roleItem.role}: User email matches (${user.email})`);
    assert(user.status === 'active', `${roleItem.role}: User status is 'active'`);
    assert(Boolean(user.profileId), `${roleItem.role}: User has valid profileId (${user.profileId})`);

    // 3. Fetch detailed profile from db
    const profile = db.getProfile(user.profileId);
    assert(profile !== null, `${roleItem.role}: Profile record retrieved successfully`);

    // 4. Role-specific field validations
    if (roleItem.role === 'citizen') {
      assert(Boolean(profile.state), 'Citizen: State is available');
      assert(Boolean(profile.districtId), 'Citizen: District ID is available');
      assert(Boolean(profile.occupation), 'Citizen: Occupation is available');
      assert(profile.problemsSubmittedCount !== undefined, 'Citizen: Problems submitted count is available');
    } else if (roleItem.role === 'government') {
      assert(Boolean(profile.officialId), `Government: Official ID is available (${profile.officialId})`);
      assert(Boolean(profile.department), `Government: Department is available (${profile.department})`);
      assert(Boolean(profile.designation), `Government: Designation is available (${profile.designation})`);
    } else if (roleItem.role === 'university') {
      assert(Boolean(profile.universityName), `University: University Name is available (${profile.universityName})`);
      assert(Boolean(profile.aisheCode), `University: AISHE Code is available (${profile.aisheCode})`);
      assert(Boolean(profile.accreditationGrade), `University: NAAC Grade is available (${profile.accreditationGrade})`);
    } else if (roleItem.role === 'faculty') {
      assert(Boolean(profile.universityName), `Faculty: University Name is available (${profile.universityName})`);
      assert(Boolean(profile.employeeId), `Faculty: Employee ID is available (${profile.employeeId})`);
      assert(Boolean(profile.department), `Faculty: Department is available (${profile.department})`);
      assert(Array.isArray(profile.specializations), 'Faculty: Specializations list is available');
    } else if (roleItem.role === 'student') {
      assert(Boolean(profile.universityName), `Student: University Name is available (${profile.universityName})`);
      assert(Boolean(profile.enrollmentNo), `Student: Enrollment No is available (${profile.enrollmentNo})`);
      assert(Boolean(profile.degree), `Student: Degree program is available (${profile.degree})`);
      assert(profile.yearOfStudy !== undefined, `Student: Year of study is available (${profile.yearOfStudy})`);
    } else if (roleItem.role === 'industry') {
      assert(Boolean(profile.companyName), `Industry: Company Name is available (${profile.companyName})`);
      assert(Boolean(profile.cinOrRegistrationNo), `Industry: CIN is available (${profile.cinOrRegistrationNo})`);
      assert(Boolean(profile.sector), `Industry: Industrial Sector is available (${profile.sector})`);
      assert(profile.csrBudgetAnnual !== undefined, `Industry: Annual CSR Budget is available (${profile.csrBudgetAnnual})`);
    }
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
