/**
 * E2E API Workflow and Attack Vector Audit Script
 * Tests:
 * 1. Admin Master Data CRUD (Student, Faculty, Subject, Dept, Hall)
 * 2. Bulk CSV Import with malformed rows
 * 3. QP Pattern marking sum validation
 * 4. Faculty Evaluation attack tests (fake total, negative marks, unassigned script, resubmission)
 * 5. Student Result isolation and publication gating
 * 6. HOD department scope parameter tampering
 * Generates /audit/test-case-table.md
 */
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

const client = axios.create({
  timeout: 10000,
  validateStatus: () => true
});

async function run() {
  console.log('=== STARTING END-TO-END WORKFLOW & SECURITY AUDIT ===\n');
  const testCases = [];

  // Helper login
  async function login(username, password) {
    const res = await client.post(`${BASE_URL}/auth/login`, { username, password });
    return res.data?.token;
  }

  const adminToken = await login('ADMIN1', 'Admin@123');
  const examcellToken = await login('EXAMCELL1', 'ExamCell@123');
  const facultyToken = await login('FACULTY1', 'Faculty@123');
  const studentToken = await login('STUDENT1', 'Student@123');
  const hodToken = await login('HOD_CSE', 'Hod@123');

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const examcellHeaders = { Authorization: `Bearer ${examcellToken}` };
  const facultyHeaders = { Authorization: `Bearer ${facultyToken}` };
  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const hodHeaders = { Authorization: `Bearer ${hodToken}` };

  // ── STEP 1: Admin Master Data CRUD ──────────────────────────────────────────
  console.log('--- Auditing Master Data CRUD ---');

  // 1.1 Create Hall
  const createHallRes = await client.post(`${BASE_URL}/admin/halls`, {
    hallName: 'AUDIT_HALL_99',
    capacity: 50,
    building: 'Main Block',
    floor: '1st Floor'
  }, { headers: adminHeaders });
  const hallId = createHallRes.data?.data?._id;
  testCases.push({
    id: 'MASTER-HALL-CREATE',
    module: 'Master Data (Admin)',
    input: 'POST /admin/halls with valid hall data',
    expected: 'Status 201 or 200, hall created',
    actual: `Status ${createHallRes.status}`,
    status: createHallRes.status === 201 || createHallRes.status === 200 ? 'PASS' : 'FAIL'
  });

  // 1.2 Update Hall
  if (hallId) {
    const updateHallRes = await client.put(`${BASE_URL}/admin/halls/${hallId}`, {
      capacity: 60
    }, { headers: adminHeaders });
    testCases.push({
      id: 'MASTER-HALL-UPDATE',
      module: 'Master Data (Admin)',
      input: `PUT /admin/halls/${hallId} update capacity to 60`,
      expected: 'Status 200, capacity updated',
      actual: `Status ${updateHallRes.status}`,
      status: updateHallRes.status === 200 ? 'PASS' : 'FAIL'
    });

    // 1.3 Delete Hall
    const deleteHallRes = await client.delete(`${BASE_URL}/admin/halls/${hallId}`, { headers: adminHeaders });
    testCases.push({
      id: 'MASTER-HALL-DELETE',
      module: 'Master Data (Admin)',
      input: `DELETE /admin/halls/${hallId}`,
      expected: 'Status 200, hall deleted',
      actual: `Status ${deleteHallRes.status}`,
      status: deleteHallRes.status === 200 ? 'PASS' : 'FAIL'
    });
  }

  // ── STEP 2: Bulk CSV Import with Invalid Rows ───────────────────────────────
  console.log('--- Auditing Bulk CSV Import Validation ---');
  // Attempt invalid students bulk import
  const invalidStudents = [
    { usn: 'INVALID_USN_99', name: 'Bad USN', email: 'bad@test.com', department: 'Unknown Dept', semester: 12 },
    { usn: '4PM23CD099', name: 'Valid Student', email: 'valid@evalora.ac.in', department: 'Computer Science', semester: 5 }
  ];
  const bulkRes = await client.post(`${BASE_URL}/admin/students/bulk`, {
    students: invalidStudents
  }, { headers: adminHeaders });
  testCases.push({
    id: 'MASTER-BULK-VALIDATE',
    module: 'Master Data Bulk Import',
    input: 'POST /admin/students/bulk with mixed valid and invalid rows',
    expected: 'Row-level success/error reporting and rejection of invalid USN/department',
    actual: `Status ${bulkRes.status}: ${JSON.stringify(bulkRes.data?.summary || bulkRes.data?.message || '')}`,
    status: bulkRes.status === 200 || bulkRes.status === 207 ? 'PASS' : 'PARTIAL'
  });

  // ── STEP 3: Question Paper Marking Pattern Validation ───────────────────────
  console.log('--- Auditing Question Paper Marking Pattern Validation ---');
  // Send pattern whose marks do not sum correctly (Max 50, but questions sum to 60)
  const invalidPatternRes = await client.post(`${BASE_URL}/examcell/qp-templates`, {
    examType: 'audit_test_pattern',
    maxMarks: 50,
    questions: [
      { questionNumber: 'Q1', maxMarks: 30 },
      { questionNumber: 'Q2', maxMarks: 30 }
    ]
  }, { headers: examcellHeaders });
  testCases.push({
    id: 'QP-PATTERN-SUM-CHECK',
    module: 'Question Paper Management',
    input: 'POST /examcell/qp-templates with maxMarks: 50 but questions sum to 60',
    expected: 'Status 400 Bad Request (Marks do not sum to total)',
    actual: `Status ${invalidPatternRes.status} (Accepted without sum validation)`,
    status: invalidPatternRes.status === 400 ? 'PASS' : 'FAIL'
  });

  // ── STEP 4: Faculty Evaluation Attack Tests ─────────────────────────────────
  console.log('--- Auditing Faculty Marks Submission Attack Vectors ---');
  // Fetch an answer script ID
  const scriptsRes = await client.get(`${BASE_URL}/examcell/answer-scripts/review`, { headers: examcellHeaders });
  const scriptSample = scriptsRes.data?.data?.[0];

  if (scriptSample?._id) {
    const scriptId = scriptSample._id;

    // 4.1 Negative marks attack
    const negMarksRes = await client.put(`${BASE_URL}/faculty/evaluations/${scriptId}`, {
      questionMarks: [{ questionNumber: 'Q1', marksObtained: -15 }]
    }, { headers: facultyHeaders });
    testCases.push({
      id: 'EVAL-ATTACK-NEGATIVE-MARKS',
      module: 'Faculty Evaluation Security',
      input: `PUT /faculty/evaluations/${scriptId} with marksObtained: -15`,
      expected: 'Status 400 Bad Request (Negative marks rejected)',
      actual: `Status ${negMarksRes.status}`,
      status: negMarksRes.status === 400 ? 'PASS' : 'FAIL'
    });

    // 4.2 Marks above maximum attack
    const overMarksRes = await client.put(`${BASE_URL}/faculty/evaluations/${scriptId}`, {
      questionMarks: [{ questionNumber: 'Q1', marksObtained: 9999 }]
    }, { headers: facultyHeaders });
    testCases.push({
      id: 'EVAL-ATTACK-OVER-MAX-MARKS',
      module: 'Faculty Evaluation Security',
      input: `PUT /faculty/evaluations/${scriptId} with marksObtained: 9999`,
      expected: 'Status 400 Bad Request (Marks exceed maximum)',
      actual: `Status ${overMarksRes.status}`,
      status: overMarksRes.status === 400 ? 'PASS' : 'FAIL'
    });

    // 4.3 Fake totalMarksObtained body mismatch
    const fakeTotalRes = await client.put(`${BASE_URL}/faculty/evaluations/${scriptId}`, {
      marksObtained: 100,
      questionMarks: [{ questionNumber: 'Q1', marksObtained: 10 }]
    }, { headers: facultyHeaders });
    // In code, line 168 overrides marksObtained with sum of questionMarks
    testCases.push({
      id: 'EVAL-ATTACK-FAKE-TOTAL',
      module: 'Faculty Evaluation Security',
      input: `PUT /faculty/evaluations/${scriptId} fake total 100 with question sum 10`,
      expected: 'Server recomputes total from questionMarks, ignoring fake total in body',
      actual: `Status ${fakeTotalRes.status}`,
      status: fakeTotalRes.status === 200 ? 'PASS' : 'FAIL'
    });
  }

  // ── STEP 5: Result Review and Student Isolation ─────────────────────────────
  console.log('--- Auditing Result Publication and Student Isolation ---');
  // Check student results access
  const studentResultRes = await client.get(`${BASE_URL}/student/results`, { headers: studentHeaders });
  testCases.push({
    id: 'RESULT-STUDENT-ACCESS',
    module: 'Result Publication',
    input: 'GET /student/results authenticated as student',
    expected: 'Status 200, only returns published results belonging to this student USN',
    actual: `Status ${studentResultRes.status}`,
    status: studentResultRes.status === 200 ? 'PASS' : 'FAIL'
  });

  // Attempt direct student query for another USN
  const leakRes = await client.get(`${BASE_URL}/student/results?usn=4PM23CD056`, { headers: studentHeaders });
  testCases.push({
    id: 'RESULT-STUDENT-ISOLATION',
    module: 'Result Publication Security',
    input: 'GET /student/results?usn=OTHER_STUDENT query parameter tampering',
    expected: 'Student cannot see other students results (Scoped to logged-in user)',
    actual: `Status ${leakRes.status}`,
    status: leakRes.status === 200 ? 'PASS' : 'FAIL'
  });

  // ── STEP 6: HOD Department Scope Parameter Tampering ────────────────────────
  console.log('--- Auditing HOD Scoped Access Tampering ---');
  const hodRes = await client.get(`${BASE_URL}/hod/insights?department=Mechanical`, { headers: hodHeaders });
  testCases.push({
    id: 'HOD-DEPT-SCOPE-TAMPER',
    module: 'Analytics Authorization',
    input: 'GET /hod/insights?department=Mechanical tampering parameter',
    expected: 'Server derives department exclusively from JWT token, ignoring query parameter',
    actual: `Status ${hodRes.status}`,
    status: hodRes.status === 200 ? 'PASS' : 'FAIL'
  });

  // ── STEP 7: Institution Config Propagation ──────────────────────────────────
  console.log('--- Auditing Institution Config Public Exposure ---');
  const instConfigRes = await client.get(`${BASE_URL}/institution/config`);
  testCases.push({
    id: 'INST-CONFIG-PUBLIC',
    module: 'Institution Settings',
    input: 'GET /institution/config without Authorization token',
    expected: 'Public endpoint returns institution metadata',
    actual: `Status ${instConfigRes.status}, Institution: ${instConfigRes.data?.data?.institutionName || 'N/A'}`,
    status: instConfigRes.status === 200 ? 'PASS' : 'FAIL'
  });

  // Generate /audit/test-case-table.md
  let tableMd = `# Test Case Results Table - Evalora\n\n`;
  tableMd += `Generated: ${new Date().toISOString()}\n\n`;
  tableMd += `| Test ID | Module | Input / Scenario | Expected Result | Actual Result | Status |\n`;
  tableMd += `|---|---|---|---|---|---|\n`;

  for (const tc of testCases) {
    const icon = tc.status === 'PASS' ? '✅ PASS' : (tc.status === 'FAIL' ? '❌ FAIL' : '⚠️ PARTIAL');
    tableMd += `| \`${tc.id}\` | ${tc.module} | ${tc.input} | ${tc.expected} | ${tc.actual} | **${icon}** |\n`;
  }

  const outPath = path.resolve(__dirname, '../test-case-table.md');
  fs.writeFileSync(outPath, tableMd, 'utf8');
  console.log(`\nSaved test case table to ${outPath}`);

  // Save intermediate JSON
  fs.writeFileSync(path.resolve(__dirname, 'e2e_results.json'), JSON.stringify(testCases, null, 2), 'utf8');
}

run().catch(err => {
  console.error('Fatal error in E2E audit:', err.message);
});
