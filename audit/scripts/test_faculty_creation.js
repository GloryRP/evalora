/**
 * Test Suite for Faculty Creation Resilience & Validation:
 * 1. New valid faculty creation
 * 2. Real duplicate Employee ID rejection
 * 3. Duplicate email rejection
 * 4. Failure after user creation (atomic rollback / no orphan left behind)
 *
 * Usage: node audit/scripts/test_faculty_creation.js
 */
const axios = require('../../server/node_modules/axios');
const mongoose = require('../../server/node_modules/mongoose');
const dotenv = require('../../server/node_modules/dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../server/.env') });

const SERVER_BASE = 'http://localhost:5000/api/v1';

async function runFacultyTests() {
  console.log('====================================================');
  console.log('   FACULTY CREATION VALIDATION & ROLLBACK TESTS');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
  const db = mongoose.connection.db;

  const results = [];
  function record(id, name, passed, details = '') {
    results.push({ id, name, passed, details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${id}: ${name}`);
    if (details) console.log(`   ${details}`);
  }

  let adminToken = '';
  try {
    const loginRes = await axios.post(`${SERVER_BASE}/auth/login`, {
      username: 'ADMIN1',
      password: 'Admin@123',
    });
    adminToken = loginRes.data.token || loginRes.data.data?.token;
  } catch (err) {
    console.error('Admin login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const testEmpId1 = `FAC_TEST_${Date.now().toString().slice(-4)}`;
  const testEmail1 = `faculty.${testEmpId1.toLowerCase()}@testcollege.edu`;

  // Pre-cleanup in case of prior run remnants
  await db.collection('users').deleteMany({ username: { $in: [testEmpId1, `${testEmpId1}_DUP`, `${testEmpId1}_FAIL`] } });
  await db.collection('faculties').deleteMany({ employeeId: { $in: [testEmpId1, `${testEmpId1}_DUP`, `${testEmpId1}_FAIL`] } });

  // TEST 1: Create a new valid faculty
  try {
    const res = await axios.post(`${SERVER_BASE}/admin/faculty`, {
      employeeId: testEmpId1,
      name: 'Dr. Valid Faculty Test',
      department: 'Computer Science and Engineering',
      designation: 'Associate Professor',
      email: testEmail1,
      phone: '9876543210',
    }, { headers: adminHeaders });

    const userDoc = await db.collection('users').findOne({ username: testEmpId1 });
    const facultyDoc = await db.collection('faculties').findOne({ employeeId: testEmpId1 });

    const passed = res.status === 201 && !!userDoc && !!facultyDoc && userDoc.email === testEmail1;
    record('TEST-1-VALID-FACULTY', 'Create new valid faculty member', passed, `HTTP ${res.status}, User ID: ${userDoc?._id}, Faculty ID: ${facultyDoc?._id}`);
  } catch (err) {
    record('TEST-1-VALID-FACULTY', 'Create new valid faculty member', false, err.response?.data?.message || err.message);
  }

  // TEST 2: Real duplicate Employee ID rejection
  try {
    let duplicateRejected = false;
    let errorMsg = '';
    try {
      await axios.post(`${SERVER_BASE}/admin/faculty`, {
        employeeId: testEmpId1,
        name: 'Duplicate ID Faculty',
        department: 'Computer Science and Engineering',
        designation: 'Professor',
        email: `other.${testEmpId1.toLowerCase()}@testcollege.edu`,
        phone: '9876543219',
      }, { headers: adminHeaders });
    } catch (err) {
      if (err.response?.status === 400) {
        duplicateRejected = true;
        errorMsg = err.response.data?.message;
      }
    }

    const passed = duplicateRejected && /already exists/i.test(errorMsg) && (/employee id/i.test(errorMsg) || /user/i.test(errorMsg));
    record('TEST-2-DUPLICATE-ID', 'Real duplicate Employee ID rejected with clear message', passed, `Status 400 received: "${errorMsg}"`);
  } catch (err) {
    record('TEST-2-DUPLICATE-ID', 'Real duplicate Employee ID rejected', false, err.message);
  }

  // TEST 3: Duplicate email rejection
  const testEmpId2 = `${testEmpId1}_DUP`;
  try {
    let emailRejected = false;
    let errorMsg = '';
    try {
      await axios.post(`${SERVER_BASE}/admin/faculty`, {
        employeeId: testEmpId2,
        name: 'Duplicate Email Faculty',
        department: 'Computer Science and Engineering',
        designation: 'Assistant Professor',
        email: testEmail1, // Same email as testEmpId1!
        phone: '9876543218',
      }, { headers: adminHeaders });
    } catch (err) {
      if (err.response?.status === 400) {
        emailRejected = true;
        errorMsg = err.response.data?.message;
      }
    }

    const orphanUser = await db.collection('users').findOne({ username: testEmpId2 });
    const passed = emailRejected && /email/i.test(errorMsg) && !orphanUser;
    record('TEST-3-DUPLICATE-EMAIL', 'Duplicate email rejected with field identified and no user created', passed, `Status 400 received: "${errorMsg}", Orphan user exists: ${!!orphanUser}`);
  } catch (err) {
    record('TEST-3-DUPLICATE-EMAIL', 'Duplicate email rejected', false, err.message);
  }

  // TEST 4: Failure after user is created (no orphan left behind)
  const testEmpIdFail = `${testEmpId1}_FAIL`;
  try {
    let requestFailed = false;
    let errorMsg = '';
    try {
      await axios.post(`${SERVER_BASE}/admin/faculty`, {
        employeeId: testEmpIdFail,
        name: 'Failing Profile Faculty',
        department: 'Computer Science and Engineering',
        designation: 'Professor',
        email: `fail.${testEmpIdFail.toLowerCase()}@testcollege.edu`,
        phone: '12345', // Invalid phone format -> fails Faculty validation
      }, { headers: adminHeaders });
    } catch (err) {
      requestFailed = true;
      errorMsg = err.response?.data?.message || err.message;
    }

    // Crucial check: verify that the user was NOT left behind as an orphan in the database!
    const orphanUser = await db.collection('users').findOne({ username: testEmpIdFail });
    const orphanFaculty = await db.collection('faculties').findOne({ employeeId: testEmpIdFail });

    const passed = requestFailed && !orphanUser && !orphanFaculty;
    record(
      'TEST-4-ROLLBACK-NO-ORPHAN',
      'Faculty failure after user creation performs rollback (no orphan user left behind)',
      passed,
      `Rejected with: "${errorMsg}", Orphan in users: ${!!orphanUser}, Orphan in faculties: ${!!orphanFaculty}`
    );
  } catch (err) {
    record('TEST-4-ROLLBACK-NO-ORPHAN', 'Rollback verification', false, err.message);
  }

  // Clean up test documents
  await db.collection('users').deleteMany({ username: { $in: [testEmpId1, testEmpId2, testEmpIdFail] } });
  await db.collection('faculties').deleteMany({ employeeId: { $in: [testEmpId1, testEmpId2, testEmpIdFail] } });

  console.log('\n====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`   FACULTY TESTS RESULT: ${results.filter(r => r.passed).length}/${results.length} PASSED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  return allPassed;
}

runFacultyTests().then(passed => {
  if (!passed) process.exit(1);
});
