// Automated Test Script for Auth Lifecycle
// Tests all 6 roles: Citizen, Student, Government Officer, University Admin, Faculty, Industry Partner
// Validates:
// 1. REGISTER -> No active session stored, res.user is undefined
// 2. Refresh simulation -> user is still null
// 3. Wrong credentials -> returns "Invalid email or password."
// 4. LOGIN -> Authenticates, stores session, returns user
// 5. ROLE CHECK -> Centralized getDashboardForRole returns correct dashboard
// 6. LOGOUT -> Clears session

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

// Polyfill storages for Node test execution
(globalThis as any).localStorage = new MockStorage();
(globalThis as any).sessionStorage = new MockStorage();

import { authBackend } from '../src/services/authBackend';
import { db } from '../src/services/db';
import { getDashboardForRole, normalizeRole } from '../src/utils/roleRouting';

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
  console.log('====================================================');
  console.log('RUNNING FULL AUTH LIFECYCLE TEST MATRIX (6 ROLES)');
  console.log('====================================================\n');

  db.initialize();

  const timestamp = Date.now();

  const ROLES_TEST_DATA = [
    {
      roleName: 'CITIZEN',
      expectedRole: 'citizen',
      expectedDashboard: '/citizen/dashboard',
      email: `citizen_${timestamp}@test.in`,
      password: 'SecurePassword@123',
      registerFn: () =>
        authBackend.registerCitizen({
          name: 'Ravi Verma',
          email: `citizen_${timestamp}@test.in`,
          phone: '9876500001',
          password: 'SecurePassword@123',
          state: 'Jharkhand',
          districtId: 'ranchi',
        }),
    },
    {
      roleName: 'STUDENT',
      expectedRole: 'student',
      expectedDashboard: '/student/dashboard',
      email: `student_${timestamp}@test.in`,
      password: 'SecurePassword@123',
      registerFn: () =>
        authBackend.registerStudent({
          name: 'Ananya Roy',
          email: `student_${timestamp}@test.in`,
          phone: '9876500002',
          password: 'SecurePassword@123',
          universityId: 'univ1',
          universityName: 'BIT Sindri',
          enrollmentNo: `ENR-${timestamp}`,
          degree: 'B.Tech',
          department: 'Computer Science',
          yearOfStudy: 3,
          expectedGraduationYear: 2027,
          skills: 'React, Node, IoT',
        }),
    },
    {
      roleName: 'GOVERNMENT OFFICER',
      expectedRole: 'government',
      expectedDashboard: '/government/dashboard',
      email: `officer_${timestamp}@jharkhand.gov.in`,
      password: 'SecurePassword@123',
      registerFn: () =>
        authBackend.registerGovernment({
          name: 'Suresh Chandra IAS',
          email: `officer_${timestamp}@jharkhand.gov.in`,
          phone: '9876500003',
          password: 'SecurePassword@123',
          officialId: `GOV-${timestamp}`,
          designation: 'District Innovation Coordinator',
          department: 'Science & Technology',
          districtId: 'ranchi',
          state: 'Jharkhand',
          jurisdiction: 'district',
        }),
    },
    {
      roleName: 'UNIVERSITY ADMIN',
      expectedRole: 'university',
      expectedDashboard: '/university/dashboard',
      email: `univ_admin_${timestamp}@univ.ac.in`,
      password: 'SecurePassword@123',
      registerFn: () =>
        authBackend.registerUniversity({
          name: 'Dr. Meenakshi Sahu',
          email: `univ_admin_${timestamp}@univ.ac.in`,
          phone: '9876500004',
          password: 'SecurePassword@123',
          universityName: 'Ranchi Technical University',
          aisheCode: `U-AISHE-${timestamp}`,
          accreditationGrade: 'A+',
          establishedYear: 1985,
          website: 'https://rtu.ac.in',
          address: 'Ranchi, Jharkhand',
          state: 'Jharkhand',
          districtId: 'ranchi',
          domains: ['water', 'environment'],
          labFacilities: 'IoT Lab, Materials Lab',
          researchFocus: 'Sensor Networks',
          rAndDCapacityScore: 90,
        }),
    },
    {
      roleName: 'FACULTY',
      expectedRole: 'faculty',
      expectedDashboard: '/faculty/dashboard',
      email: `faculty_${timestamp}@bitsindri.ac.in`,
      password: 'SecurePassword@123',
      registerFn: () =>
        authBackend.registerFaculty({
          name: 'Dr. Arvind Mahato',
          email: `faculty_${timestamp}@bitsindri.ac.in`,
          phone: '9876500005',
          password: 'SecurePassword@123',
          universityId: 'univ1',
          universityName: 'BIT Sindri',
          employeeId: `EMP-${timestamp}`,
          designation: 'Associate Professor',
          department: 'Civil Engineering',
          specializations: 'Water Hydraulics',
          publicationsCount: 15,
          experienceYears: 12,
        }),
    },
    {
      roleName: 'INDUSTRY PARTNER',
      expectedRole: 'industry',
      expectedDashboard: '/industry/dashboard',
      email: `industry_${timestamp}@greentech.com`,
      password: 'SecurePassword@123',
      registerFn: () =>
        authBackend.registerIndustry({
          name: 'Vikramaditya Singhania',
          email: `industry_${timestamp}@greentech.com`,
          phone: '9876500006',
          password: 'SecurePassword@123',
          companyName: 'GreenTech Innovations Pvt Ltd',
          cinOrRegistrationNo: `U72200JH2026PTC${timestamp.toString().slice(-6)}`,
          sector: 'Renewable Energy & IoT',
          domains: ['energy', 'environment'],
          csrBudgetAnnual: 7500000,
          collaborationInterests: ['funding', 'mentorship'],
          officialWebsite: 'https://greentech.example.com',
          pointOfContactRole: 'Director of Technology',
          companyAddress: 'Tupudana Industrial Area, Ranchi',
          state: 'Jharkhand',
        }),
    },
  ];

  for (const roleTest of ROLES_TEST_DATA) {
    console.log(`\n--- Testing Role: ${roleTest.roleName} ---`);

    // Ensure state starts clean
    authBackend.logout();
    assert(authBackend.getCurrentUser() === null, `${roleTest.roleName}: Initial state is logged out`);

    // STEP 1: Registration
    console.log(`  Executing registration for ${roleTest.email}...`);
    const regResult = await roleTest.registerFn();

    assert(regResult.success === true, `${roleTest.roleName}: Registration succeeded`);
    assert(regResult.createdUser?.email === roleTest.email, `${roleTest.roleName}: Account created with correct email`);
    assert(regResult.createdUser?.role === roleTest.expectedRole, `${roleTest.roleName}: Account created with role '${roleTest.expectedRole}'`);

    // CRITICAL: Ensure NO session exists post-registration!
    assert(regResult.user === undefined, `${roleTest.roleName}: Registration does NOT return active user session`);
    assert(regResult.token === undefined, `${roleTest.roleName}: Registration does NOT return active session token`);
    assert(authBackend.getCurrentUser() === null, `${roleTest.roleName}: getCurrentUser() remains null after registration`);

    // STEP 2: Session Refresh Simulation (before login)
    // Simulating page refresh by fetching from storage:
    const reloadedUser = authBackend.getCurrentUser();
    assert(reloadedUser === null, `${roleTest.roleName}: Browser refresh after registration does NOT grant dashboard access`);

    // STEP 3: Negative Test - Wrong Password
    const badLogin = await authBackend.login(roleTest.email, 'WrongPassword@999');
    assert(badLogin.success === false, `${roleTest.roleName}: Login rejects wrong credentials`);
    assert(badLogin.message === 'Invalid email or password.', `${roleTest.roleName}: Returns clean error message`);
    assert(authBackend.getCurrentUser() === null, `${roleTest.roleName}: User remains logged out on failed attempt`);

    // STEP 4: Login with Registered Credentials
    console.log(`  Executing login for ${roleTest.email}...`);
    const loginResult = await authBackend.login(roleTest.email, roleTest.password, true);

    assert(loginResult.success === true, `${roleTest.roleName}: Login succeeded with registered credentials`);
    assert(loginResult.user !== undefined, `${roleTest.roleName}: Login returned authenticated user`);
    assert(loginResult.token !== undefined, `${roleTest.roleName}: Login returned session token`);
    assert(loginResult.status === 'active', `${roleTest.roleName}: User status is 'active' (NO pending verification)`);
    assert(loginResult.requiresStatusGate !== true, `${roleTest.roleName}: Institutional verification gate is bypassed for demo (requiresStatusGate is false/undefined)`);
    assert(authBackend.getCurrentUser()?.email === roleTest.email, `${roleTest.roleName}: Active session saved in storage`);

    // STEP 5: Role-based Dashboard Redirection Check
    const userRole = loginResult.user?.role;
    const targetDashboard = getDashboardForRole(userRole);
    assert(
      targetDashboard === roleTest.expectedDashboard,
      `${roleTest.roleName}: Centralized routing mapped role '${userRole}' -> '${roleTest.expectedDashboard}'`
    );

    // STEP 6: Refresh Simulation After Login
    const authenticatedAfterRefresh = authBackend.getCurrentUser();
    assert(
      authenticatedAfterRefresh?.email === roleTest.email,
      `${roleTest.roleName}: User remains authenticated after browser refresh`
    );

    // STEP 7: Logout
    authBackend.logout();
    assert(authBackend.getCurrentUser() === null, `${roleTest.roleName}: Logout terminates active session`);
  }

  // GLOBAL NEGATIVE TESTS
  console.log('\n--- Additional Global Negative Tests ---');

  // Negative test: Unknown email
  const unknownEmailLogin = await authBackend.login('nonexistent.user@random.org', 'AnyPassword');
  assert(unknownEmailLogin.success === false, 'Non-existent email is rejected');
  assert(unknownEmailLogin.message === 'Invalid email or password.', 'Non-existent email returns clean error message');

  // Role normalizer test
  assert(normalizeRole('government_officer').includes('government'), "normalizeRole maps 'government_officer' to include 'government'");
  assert(normalizeRole('university_admin').includes('university'), "normalizeRole maps 'university_admin' to include 'university'");
  assert(normalizeRole('industry_partner').includes('industry'), "normalizeRole maps 'industry_partner' to include 'industry'");
  assert(getDashboardForRole(null) === '/', 'getDashboardForRole(null) returns fallback root');
  assert(getDashboardForRole('unknown_role') === '/', 'getDashboardForRole(unknown) returns fallback root');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
