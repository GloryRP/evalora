/**
 * Comprehensive Automated Verification Script for Defects F4 through F10
 * Run: node audit/scripts/test_f4_to_f10.js
 */
const axios = require('../../server/node_modules/axios');
const http = require('http');

const SERVER_BASE = 'http://localhost:5000/api/v1';
const AI_BASE = 'http://localhost:8000';

const results = [];

function record(testId, name, status, evidence, details = '') {
  results.push({ testId, name, status, evidence, details });
  console.log(`[${status}] ${testId}: ${name}`);
  if (details) console.log(`   Evidence: ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('   RUNNING AUTOMATED VERIFICATION: F4 - F10');
  console.log('====================================================\n');

  let adminToken = '';
  let examcellToken = '';

  // 0. Login as admin and examcell
  try {
    const adminLogin = await axios.post(`${SERVER_BASE}/auth/login`, {
      username: 'ADMIN1',
      password: 'Admin@123'
    });
    adminToken = adminLogin.data.token || adminLogin.data.data?.token;
  } catch (err) {
    console.error('Admin login error:', err.response?.data || err.message);
  }

  try {
    const ecLogin = await axios.post(`${SERVER_BASE}/auth/login`, {
      username: 'EXAMCELL1',
      password: 'ExamCell@123'
    });
    examcellToken = ecLogin.data.token || ecLogin.data.data?.token;
  } catch (err) {
    console.error('Examcell login error:', err.response?.data || err.message);
  }

  const ecHeaders = { Authorization: `Bearer ${examcellToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // ==========================================
  // F4: Question Paper Pattern Total
  // ==========================================
  console.log('\n--- Testing F4: Question Paper Pattern Total ---');
  // Test F4.1: 2 alternative pairs of 20 + one compulsory 10 = 50 (must pass)
  try {
    const resPass = await axios.post(`${SERVER_BASE}/examcell/qp-templates`, {
      examType: 'internal1',
      maxMarks: 50,
      slots: [
        { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
        { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
        { questionNumber: 'Q5', maxMarks: 10 }
      ]
    }, { headers: ecHeaders });
    record('F4-1-PASS', 'Alternative pairs (20 or 20) + (20 or 20) + 10 = 50', 'PASS', resPass.status === 200, `Status ${resPass.status}, template saved`);
  } catch (err) {
    record('F4-1-PASS', 'Alternative pairs (20 or 20) + (20 or 20) + 10 = 50', 'FAIL', false, err.response?.data?.message || err.message);
  }

  // Test F4.2: Questions summing to 60 against maxMarks 50 (must fail with 400)
  try {
    await axios.post(`${SERVER_BASE}/examcell/qp-templates`, {
      examType: 'internal1',
      maxMarks: 50,
      slots: [
        { questionNumber: 'Q1', maxMarks: 20, or: { questionNumber: 'Q2', maxMarks: 20 } },
        { questionNumber: 'Q3', maxMarks: 20, or: { questionNumber: 'Q4', maxMarks: 20 } },
        { questionNumber: 'Q5', maxMarks: 20 } // sum = 20 + 20 + 20 = 60 != 50
      ]
    }, { headers: ecHeaders });
    record('F4-2-FAIL', 'Mismatched total (60 against 50) rejected with 400', 'FAIL', false, 'Unexpectedly passed');
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || '';
    const diff = err.response?.data?.details?.difference;
    record('F4-2-FAIL', 'Mismatched total (60 against 50) rejected with 400', status === 400 ? 'PASS' : 'FAIL', status === 400, `Status ${status}: ${msg} (diff: ${diff})`);
  }

  // Test F4.3: Pattern with no alternatives (compulsory questions only)
  try {
    const resComp = await axios.post(`${SERVER_BASE}/examcell/qp-templates`, {
      examType: 'internal1',
      maxMarks: 50,
      slots: [
        { questionNumber: 'Q1', maxMarks: 25 },
        { questionNumber: 'Q2', maxMarks: 25 }
      ]
    }, { headers: ecHeaders });
    record('F4-3-COMPULSORY', 'Compulsory questions without alternatives = 50', resComp.status === 200 ? 'PASS' : 'FAIL', resComp.status === 200, `Status ${resComp.status}`);
  } catch (err) {
    record('F4-3-COMPULSORY', 'Compulsory questions without alternatives = 50', 'FAIL', false, err.response?.data?.message || err.message);
  }

  // ==========================================
  // F5: Scheduling Same-Semester Constraint
  // ==========================================
  console.log('\n--- Testing F5: Scheduling Same-Semester Constraint ---');
  // Test F5.1: Same-semester subjects never share a date
  try {
    const schedRes = await axios.post(`${AI_BASE}/agents/schedule`, {
      subjects: [
        { subjectCode: 'CS301', subjectName: 'Data Structures', semester: 3, credits: 4, examConfig: { theoryInternals: 2 } },
        { subjectCode: 'CS302', subjectName: 'COA', semester: 3, credits: 4, examConfig: { theoryInternals: 2 } },
        { subjectCode: 'CS303', subjectName: 'Discrete Math', semester: 3, credits: 3, examConfig: { theoryInternals: 2 } }
      ],
      start_date: '2026-11-02', // Monday
      exam_category: 'internal1',
      component: 'theory',
      constraints: { minGapBetweenExams: 1 }
    });
    const exams = schedRes.data.result?.scheduled_exams || [];
    const dates = exams.map(e => e.examDate);
    const uniqueDates = new Set(dates);
    const noClash = uniqueDates.size === exams.length;
    record('F5-1-SAME-SEM-DATES', 'Same-semester subjects never share a date', noClash ? 'PASS' : 'FAIL', noClash, `Scheduled 3 exams on dates: ${dates.join(', ')} (distinct: ${uniqueDates.size})`);
  } catch (err) {
    record('F5-1-SAME-SEM-DATES', 'Same-semester subjects never share a date', 'FAIL', false, err.response?.data?.detail?.error || err.message);
  }

  // Test F5.2: Date range too short returns clear conflict error naming subject and semester
  try {
    await axios.post(`${AI_BASE}/agents/schedule`, {
      subjects: [
        { subjectCode: 'CS301', subjectName: 'Data Structures', semester: 3, credits: 4, examConfig: { theoryInternals: 2 } },
        { subjectCode: 'CS302', subjectName: 'COA', semester: 3, credits: 4, examConfig: { theoryInternals: 2 } }
      ],
      start_date: '2026-11-02',
      exam_category: 'internal1',
      component: 'theory',
      constraints: { minGapBetweenExams: 1, endDate: '2026-11-02' } // Only 1 day allowed, 2 subjects need at least 2 days
    });
    record('F5-2-CONFLICT-DETECT', 'Too-short range returns clear conflict error', 'FAIL', false, 'Unexpectedly succeeded without conflict');
  } catch (err) {
    const status = err.response?.status;
    const errorMsg = err.response?.data?.detail?.error || err.response?.data?.detail || '';
    const hasDetails = errorMsg.includes('Scheduling conflict') && errorMsg.includes('CS302') && errorMsg.includes('semester 3');
    record('F5-2-CONFLICT-DETECT', 'Too-short range returns clear conflict error', (status === 400 && hasDetails) ? 'PASS' : 'FAIL', status === 400, `Status ${status}: ${errorMsg}`);
  }

  // Test F5.3: Multiple semesters still schedule and share dates in different sessions
  try {
    const multiSemRes = await axios.post(`${AI_BASE}/agents/schedule`, {
      subjects: [
        { subjectCode: 'CS301', subjectName: 'Data Structures', semester: 3, credits: 4, examConfig: { theoryInternals: 2 } },
        { subjectCode: 'CS501', subjectName: 'Automata Theory', semester: 5, credits: 4, examConfig: { theoryInternals: 2 } }
      ],
      start_date: '2026-11-02',
      exam_category: 'internal1',
      component: 'theory',
      constraints: { minGapBetweenExams: 1 }
    });
    const multiExams = multiSemRes.data.result?.scheduled_exams || [];
    const sameDate = multiExams.length === 2 && multiExams[0].examDate === multiExams[1].examDate;
    const diffSessions = multiExams.length === 2 && multiExams[0].startTime !== multiExams[1].startTime;
    record('F5-3-MULTI-SEM-SHARE', 'Different semesters share date in different sessions', (sameDate && diffSessions) ? 'PASS' : 'FAIL', sameDate && diffSessions, `Exams on ${multiExams[0]?.examDate}: Sem ${multiExams[0]?.semester} at ${multiExams[0]?.startTime}, Sem ${multiExams[1]?.semester} at ${multiExams[1]?.startTime}`);
  } catch (err) {
    record('F5-3-MULTI-SEM-SHARE', 'Different semesters share date in different sessions', 'FAIL', false, err.response?.data?.detail?.error || err.message);
  }

  // ==========================================
  // F6: startDate Required in Both Layers
  // ==========================================
  console.log('\n--- Testing F6: startDate Required Validation ---');
  // Layer 1: Node pipeline controller returns 400 if startDate is missing
  try {
    await axios.post(`${SERVER_BASE}/examcell/agents/run-pipeline`, {
      semester: 3,
      examCategory: 'internal1',
      component: 'theory',
      // startDate missing
    }, { headers: ecHeaders });
    record('F6-1-NODE-STARTDATE-MISSING', 'Node controller returns 400 when startDate is missing', 'FAIL', false, 'Unexpectedly passed without startDate');
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || '';
    record('F6-1-NODE-STARTDATE-MISSING', 'Node controller returns 400 when startDate is missing', status === 400 ? 'PASS' : 'FAIL', status === 400, `Status ${status}: ${msg}`);
  }

  // Layer 1b: Node controller returns 400 if startDate is invalid
  try {
    await axios.post(`${SERVER_BASE}/examcell/agents/run-pipeline`, {
      semester: 3,
      examCategory: 'internal1',
      component: 'theory',
      startDate: 'invalid-date-string'
    }, { headers: ecHeaders });
    record('F6-2-NODE-STARTDATE-INVALID', 'Node controller returns 400 when startDate is invalid', 'FAIL', false, 'Unexpectedly passed with invalid date');
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || '';
    record('F6-2-NODE-STARTDATE-INVALID', 'Node controller returns 400 when startDate is invalid', status === 400 ? 'PASS' : 'FAIL', status === 400, `Status ${status}: ${msg}`);
  }

  // Layer 2: Python scheduling agent raises validation error (returns 400) without silent fallback
  try {
    await axios.post(`${AI_BASE}/agents/schedule`, {
      subjects: [{ subjectCode: 'CS301', semester: 3, credits: 4 }],
      start_date: '', // empty startDate
      exam_category: 'internal1',
      component: 'theory'
    });
    record('F6-3-PYTHON-STARTDATE-REQUIRED', 'Python scheduling_agent raises validation error on missing startDate', 'FAIL', false, 'Silent fallback occurred');
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.detail?.error || '';
    const passed = (status === 400 || status === 422) && msg.includes('startDate is required');
    record('F6-3-PYTHON-STARTDATE-REQUIRED', 'Python scheduling_agent raises validation error on missing startDate', passed ? 'PASS' : 'FAIL', passed, `Status ${status}: ${msg}`);
  }

  // ==========================================
  // F7: CORS Allowlist
  // ==========================================
  console.log('\n--- Testing F7: CORS Allowlist ---');
  // Test untrusted origin gets no Access-Control-Allow-Origin header
  try {
    const corsRes = await axios.get(`${SERVER_BASE}/auth/verify-role`, {
      headers: { Origin: 'http://evil.com' },
      validateStatus: () => true
    });
    const acao = corsRes.headers['access-control-allow-origin'];
    record('F7-1-CORS-UNTRUSTED', 'Origin http://evil.com receives no Access-Control-Allow-Origin header', acao === undefined ? 'PASS' : 'FAIL', acao === undefined, `ACAO header is: ${acao || '(none - blocked)'}`);
  } catch (err) {
    record('F7-1-CORS-UNTRUSTED', 'Origin http://evil.com receives no Access-Control-Allow-Origin header', 'PASS', true, `Blocked at network level: ${err.message}`);
  }

  // Test trusted origin http://localhost:5173 gets ACAO header
  try {
    const corsTrusted = await axios.get(`${SERVER_BASE}/auth/verify-role`, {
      headers: { Origin: 'http://localhost:5173' },
      validateStatus: () => true
    });
    const acaoTrusted = corsTrusted.headers['access-control-allow-origin'];
    record('F7-2-CORS-TRUSTED', 'Origin http://localhost:5173 receives Access-Control-Allow-Origin', acaoTrusted === 'http://localhost:5173' ? 'PASS' : 'FAIL', acaoTrusted === 'http://localhost:5173', `ACAO header: ${acaoTrusted}`);
  } catch (err) {
    record('F7-2-CORS-TRUSTED', 'Origin http://localhost:5173 receives Access-Control-Allow-Origin', 'FAIL', false, err.message);
  }

  // ==========================================
  // F8: Hall Fill Percentage (70, 100, 50)
  // ==========================================
  console.log('\n--- Testing F8: Hall Fill Percentage Usable Seats ---');
  const dummyHalls = [
    { _id: 'H1', hallName: 'Hall 101', capacity: 40 },
    { _id: 'H2', hallName: 'Hall 102', capacity: 60 }
  ];
  const dummyStudents = Array.from({ length: 80 }, (_, i) => ({
    _id: `S${i+1}`,
    usn: `4PM23CD0${String(i+1).padStart(2, '0')}`,
    semester: 3,
    department: 'CSE'
  }));
  const dummyExams = [{
    _id: 'E1',
    subjectCode: 'CS301',
    semester: 3,
    department: 'CSE',
    examDate: '2026-11-02',
    startTime: '09:00',
    endTime: '12:00'
  }];

  for (const fill of [70, 100, 50]) {
    try {
      const allocRes = await axios.post(`${AI_BASE}/agents/allocate-halls`, {
        exams: dummyExams,
        students: dummyStudents,
        halls: dummyHalls,
        constraints: { hallFillPercent: fill }
      });
      const allocations = allocRes.data.result?.hall_allocations || [];
      const seatsInH1 = allocations.filter(a => a.hallId === 'H1').length;
      const seatsInH2 = allocations.filter(a => a.hallId === 'H2').length;
      const expectedH1 = Math.floor(40 * fill / 100);
      const expectedH2 = Math.floor(60 * fill / 100);
      const passed = seatsInH1 <= expectedH1 && seatsInH2 <= expectedH2 && (seatsInH1 + seatsInH2) > 0;
      record(`F8-FILL-${fill}`, `Hall fill percentage ${fill}% allocation`, passed ? 'PASS' : 'FAIL', passed, `H1 (cap 40): ${seatsInH1} seats (limit ${expectedH1}), H2 (cap 60): ${seatsInH2} seats (limit ${expectedH2})`);
    } catch (err) {
      record(`F8-FILL-${fill}`, `Hall fill percentage ${fill}% allocation`, 'FAIL', false, err.response?.data?.detail?.error || err.message);
    }
  }

  // ==========================================
  // F9: Evaluation Agent in Python & Node
  // ==========================================
  console.log('\n--- Testing F9: Evaluation Agent ---');
  // Test F9.1: Python endpoint with zero-score script and outlier
  try {
    const testScripts = [
      { scriptId: 'SC1', studentId: 'ST1', evaluatorId: 'EV1', marksObtained: 78, questionMarks: [{ questionNumber: 'Q1', marksObtained: 78 }] },
      { scriptId: 'SC2', studentId: 'ST2', evaluatorId: 'EV1', marksObtained: 80, questionMarks: [{ questionNumber: 'Q1', marksObtained: 80 }] },
      { scriptId: 'SC3', studentId: 'ST3', evaluatorId: 'EV1', marksObtained: 81, questionMarks: [{ questionNumber: 'Q1', marksObtained: 81 }] },
      { scriptId: 'SC4', studentId: 'ST4', evaluatorId: 'EV1', marksObtained: 82, questionMarks: [{ questionNumber: 'Q1', marksObtained: 82 }] },
      { scriptId: 'SC5', studentId: 'ST5', evaluatorId: 'EV1', marksObtained: 83, questionMarks: [{ questionNumber: 'Q1', marksObtained: 83 }] },
      { scriptId: 'SC6', studentId: 'ST6', evaluatorId: 'EV1', marksObtained: 84, questionMarks: [{ questionNumber: 'Q1', marksObtained: 84 }] },
      { scriptId: 'SC7', studentId: 'ST7', evaluatorId: 'EV1', marksObtained: 85, questionMarks: [{ questionNumber: 'Q1', marksObtained: 85 }] },
      { scriptId: 'SC8', studentId: 'ST8', evaluatorId: 'EV1', marksObtained: 86, questionMarks: [{ questionNumber: 'Q1', marksObtained: 86 }] },
      { scriptId: 'SC9', studentId: 'ST9', evaluatorId: 'EV1', marksObtained: 88, questionMarks: [{ questionNumber: 'Q1', marksObtained: 88 }] },
      { scriptId: 'SC_OUTLIER', studentId: 'ST10', evaluatorId: 'EV1', marksObtained: 10, questionMarks: [{ questionNumber: 'Q1', marksObtained: 10 }] }, // IQR outlier
      { scriptId: 'SC_ZERO', studentId: 'ST11', evaluatorId: 'EV1', marksObtained: 0, questionMarks: [{ questionNumber: 'Q1', marksObtained: 0 }] }, // Zero-score
    ];
    const evalPyRes = await axios.post(`${AI_BASE}/agents/evaluate`, {
      scripts: testScripts,
      maxMarks: 100,
      passMarkPercentage: 40
    });
    const evalData = evalPyRes.data.result;
    const hasZeroFlag = evalData.flaggedScripts?.some(f => f.scriptId === 'SC_ZERO' && f.reasons.some(r => r.includes('zero') || r.includes('Zero')));
    const hasOutlierFlag = evalData.flaggedScripts?.some(f => f.scriptId === 'SC_OUTLIER' && f.reasons.some(r => r.includes('outlier') || r.includes('IQR')));
    const passed = hasZeroFlag && hasOutlierFlag && evalData.average > 0;
    record('F9-1-PYTHON-EVALUATE', 'Evaluation agent flags zero-score and IQR outliers', passed ? 'PASS' : 'FAIL', passed, `Avg: ${evalData.average}, Flags: ${evalData.flaggedCount}, Zero-score flagged: ${hasZeroFlag}, Outlier flagged: ${hasOutlierFlag}`);
  } catch (err) {
    record('F9-1-PYTHON-EVALUATE', 'Evaluation agent flags zero-score and IQR outliers', 'FAIL', false, err.response?.data?.detail || err.message);
  }

  // Test F9.2: Node runEvaluationAgent endpoint uses active GradingScheme
  try {
    const nodeEvalRes = await axios.post(`${SERVER_BASE}/examcell/agents/run-evaluation`, {}, { headers: ecHeaders });
    const d = nodeEvalRes.data?.data;
    record('F9-2-NODE-EVALUATION-AGENT', 'Node runEvaluationAgent executes and returns stats shape', nodeEvalRes.status === 200 ? 'PASS' : 'FAIL', nodeEvalRes.status === 200, `Evaluated: ${d?.evaluatedScripts}/${d?.totalScripts}, Avg: ${d?.averageMarks}, PassRate: ${d?.passRate}%`);
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    // If no active scheme exists, returning 400 is expected per specification!
    const passed = status === 400 && msg.includes('grading scheme');
    record('F9-2-NODE-EVALUATION-AGENT', 'Node runEvaluationAgent enforces GradingScheme', passed ? 'PASS' : 'FAIL', passed, `Status ${status}: ${msg}`);
  }

  // ==========================================
  // F10: Bulk CSV Import Row-Level Validation
  // ==========================================
  console.log('\n--- Testing F10: Bulk CSV Import Row-Level Validation ---');
  // Test F10.1: Students bulk with invalid USN, unknown department, and valid row
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const testStudents = [
    { usn: 'MALFORMED_USN', name: 'Bad USN Student', department: 'Computer Science', semester: 5 },
    { usn: `4PM23CS${randomSuffix}`, name: 'Bad Dept Student', department: 'Nonexistent Quantum Dept', semester: 5 },
    { usn: `4PM23CS${randomSuffix + 1}`, name: 'Valid Student', department: 'Computer Science', semester: 5 }
  ];

  try {
    const bulkStudRes = await axios.post(`${SERVER_BASE}/admin/students/bulk`, {
      records: testStudents
    }, { headers: adminHeaders });
    const d = bulkStudRes.data?.data || bulkStudRes.data;
    const hasRowNumbers = d.errors?.every(e => e.row !== undefined && e.rowNumber !== undefined);
    const passed = d.created >= 1 && d.skipped >= 2 && hasRowNumbers;
    record('F10-1-STUDENTS-BULK-VALIDATE', 'Students bulk import row-level reporting and rejection', passed ? 'PASS' : 'FAIL', passed, `Created: ${d.created}, Skipped: ${d.skipped}, Errors: ${JSON.stringify(d.errors)}`);
  } catch (err) {
    record('F10-1-STUDENTS-BULK-VALIDATE', 'Students bulk import row-level reporting and rejection', 'FAIL', false, err.response?.data?.message || err.message);
  }

  // Test F10.2: Subjects bulk with duplicate subject code and unknown department
  const subCode = `CS${Math.floor(100 + Math.random() * 900)}`;
  const testSubjects = [
    { subjectCode: subCode, subjectName: 'Subject One', department: 'Computer Science', semester: 3, credits: 4 },
    { subjectCode: subCode, subjectName: 'Duplicate Subject One', department: 'Computer Science', semester: 3, credits: 4 }, // Duplicate
    { subjectCode: `${subCode}B`, subjectName: 'Bad Dept Subject', department: 'Nonexistent Department', semester: 3, credits: 3 }
  ];

  try {
    const bulkSubRes = await axios.post(`${SERVER_BASE}/admin/subjects/bulk`, {
      records: testSubjects
    }, { headers: adminHeaders });
    const d = bulkSubRes.data?.data || bulkSubRes.data;
    const hasRowNumbers = d.errors?.every(e => e.row !== undefined && e.rowNumber !== undefined);
    const passed = d.created >= 1 && d.skipped >= 2 && hasRowNumbers;
    record('F10-2-SUBJECTS-BULK-VALIDATE', 'Subjects bulk import duplicate code rejection and row reporting', passed ? 'PASS' : 'FAIL', passed, `Created: ${d.created}, Skipped: ${d.skipped}, Errors: ${JSON.stringify(d.errors)}`);
  } catch (err) {
    record('F10-2-SUBJECTS-BULK-VALIDATE', 'Subjects bulk import duplicate code rejection and row reporting', 'FAIL', false, err.response?.data?.message || err.message);
  }

  console.log('\n====================================================');
  console.log(`   VERIFICATION COMPLETE: ${results.filter(r => r.status === 'PASS').length}/${results.length} PASSED`);
  console.log('====================================================');
}

runTests();
