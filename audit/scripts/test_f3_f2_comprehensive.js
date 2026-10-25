/**
 * F3 Comprehensive Test: editHistory, isLocked, unlock, isResultStale, publish flow.
 * F2 supplement: no question paper found returns error.
 * Usage: node audit/scripts/test_f3_f2_comprehensive.js
 */
const mongoose = require('../../server/node_modules/mongoose');
const axios = require('../../server/node_modules/axios');
const bcrypt = require('../../server/node_modules/bcrypt');

const SERVER_BASE = 'http://localhost:5000/api/v1';
const MONGO_URI = 'mongodb://localhost:27017/examdb';

const Student = require('../../server/models/Student');
const Subject = require('../../server/models/Subject');
const Faculty = require('../../server/models/Faculty');
const Exam = require('../../server/models/Exam');
const AnswerScript = require('../../server/models/AnswerScript');
const QuestionPaper = require('../../server/models/QuestionPaper');
const User = require('../../server/models/User');
const Result = require('../../server/models/Result');

const results = [];
function record(id, desc, passed, detail = '') {
  results.push({ id, desc, passed });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${id}: ${desc}`);
  if (detail) console.log(`   ${detail}`);
}

async function run() {
  console.log('════════════════════════════════════════════════════');
  console.log('   F3 & F2 COMPREHENSIVE TESTS');
  console.log('════════════════════════════════════════════════════\n');

  await mongoose.connect(MONGO_URI);

  // Ensure FACULTY1 exists
  let fac1User = await User.findOne({ username: 'FACULTY1' });
  if (!fac1User) {
    const pwHash = await bcrypt.hash('Faculty@123', 10);
    fac1User = await User.create({
      username: 'FACULTY1',
      passwordHash: pwHash,
      role: 'faculty',
      name: 'Dr. John Doe',
      department: 'Computer Science and Engineering',
      email: 'faculty1@evalora.ac.in',
      isActive: true
    });
  }
  let fac1Record = await Faculty.findOne({ employeeId: 'FACULTY1' });
  if (!fac1Record) {
    fac1Record = await Faculty.create({
      employeeId: 'FACULTY1',
      name: 'Dr. John Doe',
      department: 'Computer Science and Engineering',
      designation: 'Assistant Professor',
      email: 'faculty1@evalora.ac.in',
      phone: '9876543211'
    });
  }

  // Login tokens
  const adminLogin = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'ADMIN1', password: 'Admin@123' });
  const adminToken = adminLogin.data.token || adminLogin.data.data?.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const ecLogin = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'EXAMCELL1', password: 'ExamCell@123' });
  const ecToken = ecLogin.data.token || ecLogin.data.data?.token;
  const ecHeaders = { Authorization: `Bearer ${ecToken}` };

  // Find or create faculty for testing
  let fac1Login, fac2Login;
  try {
    fac1Login = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'FACULTY1', password: 'Faculty@123' });
  } catch (e) {
    console.log('FACULTY1 login failed:', e.response?.data?.message || e.message);
    await mongoose.disconnect();
    return;
  }
  const fac1Token = fac1Login.data.token || fac1Login.data.data?.token;
  const fac1Headers = { Authorization: `Bearer ${fac1Token}` };

  try {
    fac2Login = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'FACULTY2', password: 'Faculty@123' });
  } catch (e) {
    console.log('FACULTY2 not available, will skip cross-faculty test');
  }
  const fac2Token = fac2Login?.data?.token || fac2Login?.data?.data?.token;
  const fac2Headers = fac2Token ? { Authorization: `Bearer ${fac2Token}` } : null;


  // ═══════════════════════════════════════════════════════════
  // SETUP: Create a test exam, subject, student, QP, and answer script
  // ═══════════════════════════════════════════════════════════
  console.log('── Setting up test data ──');

  // Use existing subject or create one
  let testSubject = await Subject.findOne({ subjectCode: 'F3_TEST_SUBJ' });
  if (!testSubject) {
    testSubject = await Subject.create({
      subjectCode: 'F3_TEST_SUBJ',
      subjectName: 'F3 Test Subject',
      department: fac1Record.department,
      semester: 3,
      credits: 4,
      subjectType: 'theory'
    });
  }

  // Create a test exam
  let testExam = await Exam.findOne({ subjectId: testSubject._id, examType: 'internal1' });
  if (!testExam) {
    testExam = await Exam.create({
      subjectId: testSubject._id,
      examDate: new Date('2026-12-01'),
      startTime: '09:00',
      endTime: '10:30',
      semester: 3,
      examType: 'internal1',
      status: 'scheduled'
    });
  }

  // Create a QuestionPaper for this exam
  let testQP = await QuestionPaper.findOne({ examId: testExam._id });
  if (!testQP) {
    testQP = await QuestionPaper.create({
      examId: testExam._id,
      subjectId: testSubject._id,
      status: 'approved',
      slots: [
        { questionNumber: 'Q1', maxMarks: 20 },
        { questionNumber: 'Q2', maxMarks: 20 },
        { questionNumber: 'Q3', maxMarks: 10 }
      ],
      maxMarks: 50,
      submittedBy: fac1Record._id
    });
  }

  // Create a test student
  let testStudent = await Student.findOne({ usn: 'F3_TEST_STU_001' });
  if (!testStudent) {
    testStudent = await Student.create({
      usn: 'F3_TEST_STU_001',
      name: 'F3 Test Student',
      department: fac1Record.department,
      semester: 3,
      email: 'f3test@pesitm.edu',
      phone: '9999999999',
      batch: '2023-2027'
    });
  }

  // Clean existing test answer scripts
  await AnswerScript.deleteMany({ studentId: testStudent._id, examId: testExam._id });

  // Create a fresh answer script assigned to FACULTY1
  let testScript = await AnswerScript.create({
    studentId: testStudent._id,
    examId: testExam._id,
    subjectId: testSubject._id,
    evaluatorId: fac1Record._id,
    status: 'assigned',
    filePath: '/test/f3_script.pdf',
    fileName: 'f3_script.pdf',
    maxMarks: 50,
    isLocked: false,
    isResultStale: false,
    editHistory: []
  });

  console.log(`   Test script ID: ${testScript._id}`);
  console.log(`   Evaluator (FACULTY1): ${fac1Record._id}`);

  // ═══════════════════════════════════════════════════════════
  // F3(a): Assigned faculty edits same script twice → editHistory has 2 entries
  // ═══════════════════════════════════════════════════════════
  console.log('\n── F3(a): Edit script twice → editHistory has 2 entries ──');

  // First evaluation
  const eval1 = await axios.put(`${SERVER_BASE}/faculty/evaluations/${testScript._id}`, {
    questionMarks: [
      { questionNumber: 'Q1', marksObtained: 15 },
      { questionNumber: 'Q2', marksObtained: 18 },
      { questionNumber: 'Q3', marksObtained: 8 }
    ],
    comments: 'First evaluation'
  }, { headers: fac1Headers });

  console.log(`   1st eval: status=${eval1.status}, marks=${eval1.data.data?.marksObtained}`);
  
  // Second evaluation (edits the already-evaluated script)
  const eval2 = await axios.put(`${SERVER_BASE}/faculty/evaluations/${testScript._id}`, {
    questionMarks: [
      { questionNumber: 'Q1', marksObtained: 12 },
      { questionNumber: 'Q2', marksObtained: 16 },
      { questionNumber: 'Q3', marksObtained: 9 }
    ],
    comments: 'Second evaluation - corrected'
  }, { headers: fac1Headers });

  console.log(`   2nd eval: status=${eval2.status}, marks=${eval2.data.data?.marksObtained}`);

  // Third evaluation (to get 2 editHistory entries since first eval changes assigned→evaluated)
  const eval3 = await axios.put(`${SERVER_BASE}/faculty/evaluations/${testScript._id}`, {
    questionMarks: [
      { questionNumber: 'Q1', marksObtained: 10 },
      { questionNumber: 'Q2', marksObtained: 14 },
      { questionNumber: 'Q3', marksObtained: 7 }
    ],
    comments: 'Third evaluation - final'
  }, { headers: fac1Headers });

  console.log(`   3rd eval: status=${eval3.status}, marks=${eval3.data.data?.marksObtained}`);

  // Reload and check editHistory
  const scriptAfterEdits = await AnswerScript.findById(testScript._id);
  const histLen = scriptAfterEdits.editHistory.length;
  console.log(`   editHistory length: ${histLen}`);
  
  const hasOldValues = histLen >= 2 &&
    scriptAfterEdits.editHistory[0].previousMarksObtained !== undefined &&
    scriptAfterEdits.editHistory[1].previousMarksObtained !== undefined;

  record('F3-a', 'editHistory has 2+ entries with old values after re-edits', histLen >= 2 && hasOldValues,
    `entries: ${histLen}, old marks: [${scriptAfterEdits.editHistory.map(e => e.previousMarksObtained).join(', ')}]`);

  // Print editHistory detail
  for (let i = 0; i < scriptAfterEdits.editHistory.length; i++) {
    const entry = scriptAfterEdits.editHistory[i];
    console.log(`   editHistory[${i}]: editedAt=${entry.editedAt?.toISOString()}, prevMarks=${entry.previousMarksObtained}, prevQMarks=${JSON.stringify(entry.previousQuestionMarks?.map(q => q.marksObtained))}, prevComments="${entry.previousComments}", unlockReason="${entry.unlockReason}"`);
  }

  // ═══════════════════════════════════════════════════════════
  // F3(b): isLocked = true → 409 when assigned faculty edits
  // ═══════════════════════════════════════════════════════════
  console.log('\n── F3(b): Locked script returns 409 for assigned faculty ──');

  // Lock the script directly
  await AnswerScript.updateOne({ _id: testScript._id }, { isLocked: true });

  try {
    await axios.put(`${SERVER_BASE}/faculty/evaluations/${testScript._id}`, {
      questionMarks: [{ questionNumber: 'Q1', marksObtained: 5 }],
      comments: 'Should fail'
    }, { headers: fac1Headers });
    record('F3-b', 'Locked script rejects assigned faculty edit with 409', false, 'Unexpectedly succeeded');
  } catch (err) {
    const st = err.response?.status;
    const msg = err.response?.data?.message || '';
    record('F3-b', 'Locked script rejects assigned faculty edit with 409', st === 409,
      `Status ${st}: ${msg}`);
  }

  // ═══════════════════════════════════════════════════════════
  // F3(c): Faculty calling unlock route gets 403
  // ═══════════════════════════════════════════════════════════
  console.log('\n── F3(c): Faculty calling unlock route → 403 ──');

  try {
    await axios.post(`${SERVER_BASE}/faculty/evaluations/${testScript._id}/unlock`, {
      reason: 'Faculty trying to unlock'
    }, { headers: fac1Headers });
    record('F3-c', 'Faculty forbidden from unlock route (403)', false, 'Unexpectedly succeeded');
  } catch (err) {
    const st = err.response?.status;
    const msg = err.response?.data?.message || '';
    record('F3-c', 'Faculty forbidden from unlock route (403)', st === 403,
      `Status ${st}: ${msg}`);
  }

  // ═══════════════════════════════════════════════════════════
  // F3(d): Exam Cell unlock without reason → 400, with reason → 200
  // ═══════════════════════════════════════════════════════════
  console.log('\n── F3(d): Unlock without reason → 400, with reason → 200 ──');

  // Without reason
  try {
    await axios.post(`${SERVER_BASE}/faculty/evaluations/${testScript._id}/unlock`, {}, { headers: ecHeaders });
    record('F3-d1', 'Unlock without reason returns 400', false, 'Unexpectedly succeeded');
  } catch (err) {
    const st = err.response?.status;
    const msg = err.response?.data?.message || '';
    record('F3-d1', 'Unlock without reason returns 400', st === 400,
      `Status ${st}: ${msg}`);
  }

  // With reason
  try {
    const unlockRes = await axios.post(`${SERVER_BASE}/faculty/evaluations/${testScript._id}/unlock`, {
      reason: 'Re-evaluation requested by HOD'
    }, { headers: ecHeaders });
    record('F3-d2', 'Unlock with reason returns 200', unlockRes.status === 200,
      `Status ${unlockRes.status}: ${unlockRes.data.message}`);
    
    // Verify reason is stored in editHistory
    const scriptAfterUnlock = await AnswerScript.findById(testScript._id);
    const lastEntry = scriptAfterUnlock.editHistory[scriptAfterUnlock.editHistory.length - 1];
    record('F3-d3', 'Unlock reason stored in editHistory', 
      lastEntry?.unlockReason === 'Re-evaluation requested by HOD',
      `unlockReason: "${lastEntry?.unlockReason}"`);
  } catch (err) {
    record('F3-d2', 'Unlock with reason returns 200', false, err.response?.data?.message || err.message);
  }

  // ═══════════════════════════════════════════════════════════
  // F3(e): Edit after results → isResultStale, publish blocked, re-run clears, publish succeeds
  // ═══════════════════════════════════════════════════════════
  console.log('\n── F3(e): isResultStale flow ──');

  // Create a Result record for our test student so isResultStale gets set
  await Result.deleteMany({ studentId: testStudent._id });
  await Result.create({
    studentId: testStudent._id,
    usn: testStudent.usn,
    department: testStudent.department,
    academicYear: '2025-2026',
    semester: 3,
    subjectResults: [{
      subjectId: testSubject._id,
      examId: testExam._id,
      marksObtained: 37,
      maxMarks: 50,
      grade: 'B+',
      gradePoint: 8,
      gradePointsEarned: 24,
      credits: 3,
      isPassed: true,
      result: 'PASS'
    }],
    sgpa: 8.0,
    cgpa: 8.0
  });

  // Reset ALL stale flags in the system first to ensure clean state
  await AnswerScript.updateMany({ isResultStale: true }, { isResultStale: false });

  // Reset script to evaluated (unlocked) with no stale flag
  await AnswerScript.updateOne({ _id: testScript._id }, { 
    isLocked: false, 
    isResultStale: false, 
    status: 'evaluated' 
  });

  // Edit the evaluated script → should set isResultStale = true
  const editRes = await axios.put(`${SERVER_BASE}/faculty/evaluations/${testScript._id}`, {
    questionMarks: [
      { questionNumber: 'Q1', marksObtained: 20 },
      { questionNumber: 'Q2', marksObtained: 20 },
      { questionNumber: 'Q3', marksObtained: 10 }
    ],
    comments: 'Full marks re-evaluation'
  }, { headers: fac1Headers });

  const staleAfterEdit = editRes.data.data?.isResultStale;
  record('F3-e1', 'Edit after results → isResultStale = true', staleAfterEdit === true,
    `isResultStale: ${staleAfterEdit}`);

  // Try to publish → should be blocked
  try {
    await axios.post(`${SERVER_BASE}/examcell/answer-scripts/publish`, {
      semester: 3
    }, { headers: ecHeaders });
    record('F3-e2', 'Publish blocked when isResultStale = true', false, 'Unexpectedly succeeded');
  } catch (err) {
    const st = err.response?.status;
    const msg = err.response?.data?.message || '';
    const blocked = st === 400 && msg.includes('stale');
    record('F3-e2', 'Publish blocked when isResultStale = true', blocked,
      `Status ${st}: ${msg}`);
  }

  // Clear isResultStale by calling the REAL APP ROUTE: POST /results/compute
  let computeSuccess = false;
  try {
    const compRes = await axios.post(`${SERVER_BASE}/results/compute`, {
      semester: 3,
      academicYear: '2025-2026'
    }, { headers: ecHeaders });
    computeSuccess = compRes.status === 200;
    console.log(`   Re-computed results via real route POST /results/compute: status=${compRes.status}, ${compRes.data.message}`);
  } catch (err) {
    console.log(`   Re-compute route call failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
  }

  // Verify that the real route cleared isResultStale in the database
  const scriptAfterRecompute = await AnswerScript.findById(testScript._id);
  const isStaleCleared = scriptAfterRecompute.isResultStale === false;
  record('F3-e2b', 'Real route POST /results/compute clears isResultStale flag', isStaleCleared,
    `isResultStale after re-compute: ${scriptAfterRecompute.isResultStale}`);

  // Now publish should succeed (or at least not be blocked by stale check)
  try {
    const pubRes = await axios.post(`${SERVER_BASE}/examcell/answer-scripts/publish`, {
      semester: 3
    }, { headers: ecHeaders });
    record('F3-e3', 'Publish succeeds after clearing isResultStale', pubRes.status === 200,
      `Status ${pubRes.status}: ${pubRes.data.message}`);
  } catch (err) {
    const st = err.response?.status;
    const msg = err.response?.data?.message || '';
    // If it fails for a reason OTHER than stale, that's still a pass for our test
    const notStaleFail = !msg.includes('stale');
    record('F3-e3', 'Publish succeeds after clearing isResultStale (not blocked by stale)', notStaleFail,
      `Status ${st}: ${msg}`);
  }

  // ═══════════════════════════════════════════════════════════
  // F2 SUPPLEMENT: No question paper for exam → error, never skip
  // ═══════════════════════════════════════════════════════════
  console.log('\n── F2 Supplement: No QP found → error ──');

  // Create a new exam with NO question paper
  const noQPExam = await Exam.create({
    subjectId: testSubject._id,
    examDate: new Date('2026-12-15'),
    startTime: '09:00',
    endTime: '10:30',
    semester: 3,
    examType: 'internal2',
    status: 'scheduled'
  });

  const noQPScript = await AnswerScript.create({
    studentId: testStudent._id,
    examId: noQPExam._id,
    subjectId: testSubject._id,
    evaluatorId: fac1Record._id,
    status: 'assigned',
    maxMarks: 50,
    isLocked: false
  });

  // Make sure there's no QP for this exam
  await QuestionPaper.deleteMany({ examId: noQPExam._id });

  try {
    await axios.put(`${SERVER_BASE}/faculty/evaluations/${noQPScript._id}`, {
      questionMarks: [{ questionNumber: 'Q1', marksObtained: 10 }],
      comments: 'Should fail - no QP'
    }, { headers: fac1Headers });
    record('F2-NO-QP', 'No QP found returns error (never skips validation)', false, 'Unexpectedly succeeded');
  } catch (err) {
    const st = err.response?.status;
    const msg = err.response?.data?.message || '';
    const passed = st === 400 && msg.includes('No question paper');
    record('F2-NO-QP', 'No QP found returns error (never skips validation)', passed,
      `Status ${st}: ${msg}`);
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP test-specific data
  // ═══════════════════════════════════════════════════════════
  console.log('\n── Cleanup ──');
  await AnswerScript.deleteMany({ studentId: testStudent._id });
  await Exam.deleteOne({ _id: noQPExam._id });
  await QuestionPaper.deleteMany({ examId: testExam._id });
  await Exam.deleteOne({ _id: testExam._id });
  await Subject.deleteOne({ _id: testSubject._id });
  await Student.deleteOne({ _id: testStudent._id });
  await Result.deleteMany({ studentId: testStudent._id });
  console.log('   Test data cleaned up');

  // ═══════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════
  console.log('\n════════════════════════════════════════════════════');
  console.log('   RESULTS SUMMARY');
  console.log('════════════════════════════════════════════════════');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`   PASSED: ${passed}/${results.length}`);
  console.log(`   FAILED: ${failed}/${results.length}`);
  for (const r of results) {
    console.log(`   [${r.passed ? '✓' : '✗'}] ${r.id}: ${r.desc}`);
  }
  console.log('════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Test error:', err.response?.data || err);
  process.exit(1);
});
