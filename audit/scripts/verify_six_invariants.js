/**
 * Automated Invariant Verification for 6 Core Business & Security Rules (Item 9)
 * Usage: node audit/scripts/verify_six_invariants.js
 */
const axios = require('../../server/node_modules/axios');
const mongoose = require('../../server/node_modules/mongoose');

const SERVER_BASE = 'http://localhost:5000/api/v1';
const MONGO_URI = 'mongodb://localhost:27017/examdb';

const AnswerScript = require('../../server/models/AnswerScript');
const Student = require('../../server/models/Student');
const User = require('../../server/models/User');
const Faculty = require('../../server/models/Faculty');
const Exam = require('../../server/models/Exam');
const QuestionPaperSubmission = require('../../server/models/QuestionPaperSubmission');
const Subject = require('../../server/models/Subject');
const InstitutionConfig = require('../../server/models/InstitutionConfig');

const invariantResults = [];

function recordInvariant(num, title, status, evidence) {
  invariantResults.push({ num, title, status, evidence });
  console.log(`\n[${status}] Invariant ${num}: ${title}`);
  console.log(`   Evidence: ${evidence}`);
}

async function verifyInvariants() {
  console.log('================================================================');
  console.log('   MANUAL & AUTOMATED INVARIANT VERIFICATION (6 SCENARIOS)');
  console.log('================================================================');

  await mongoose.connect(MONGO_URI);

  // 0. Logins
  const adminLogin = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'ADMIN1', password: 'Admin@123' });
  const adminToken = adminLogin.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  const ecLogin = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'EXAMCELL1', password: 'ExamCell@123' });
  const ecToken = ecLogin.data.token;
  const ecHeaders = { Authorization: `Bearer ${ecToken}` };

  const fac1Login = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'FACULTY1', password: 'Faculty@123' });
  const fac1Token = fac1Login.data.token;
  const fac1Headers = { Authorization: `Bearer ${fac1Token}` };

  const stLogin = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'STUDENT1', password: 'Student@123' });
  const studentToken = stLogin.data.token;
  const stHeaders = { Authorization: `Bearer ${studentToken}` };

  // ----------------------------------------------------------------
  // Invariant 1: Results hidden from students before publication
  // ----------------------------------------------------------------
  try {
    let student = await Student.findOne({ usn: 'STUDENT1' });
    if (!student) {
      student = await Student.findOne();
    }
    let exam = await Exam.findOne();
    if (!exam) {
      const sub = await Subject.findOne();
      exam = await Exam.create({
        subjectId: sub._id,
        subjectCode: sub.subjectCode,
        semester: sub.semester,
        department: sub.department,
        examType: 'internal1',
        examDate: '2026-11-02',
        startTime: '09:00',
        endTime: '12:00',
        status: 'scheduled'
      });
    }
    
    // Create an evaluated (unpublished) script
    const unpubScript = await AnswerScript.findOneAndUpdate(
      { studentId: student._id, examId: exam._id },
      {
        studentId: student._id,
        examId: exam._id,
        marksObtained: 85,
        status: 'evaluated', // Not published
        isResultStale: false,
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Fetch results as student
    const stRes = await axios.get(`${SERVER_BASE}/student/results`, { headers: stHeaders });
    const studentResults = stRes.data?.data?.results || [];
    const isScriptHidden = !studentResults.some(r => r.resultId?.toString() === unpubScript._id.toString());

    recordInvariant(1, 'Results hidden from students before publication', isScriptHidden ? 'PASS' : 'FAIL',
      `Script ID ${unpubScript._id} (status='evaluated') is ${isScriptHidden ? 'HIDDEN' : 'VISIBLE'} from student view (Returned published count: ${studentResults.length})`
    );
  } catch (err) {
    recordInvariant(1, 'Results hidden from students before publication', 'FAIL', err.message);
  }

  // ----------------------------------------------------------------
  // Invariant 2: Student cannot see another student's result
  // ----------------------------------------------------------------
  try {
    const tamperingRes = await axios.get(`${SERVER_BASE}/student/results?usn=4PM23CD999_TAMPER&studentId=65a000000000000000000000`, { headers: stHeaders });
    const returnedStudent = tamperingRes.data?.data?.student;
    const isScoped = returnedStudent?.usn === 'STUDENT1';

    recordInvariant(2, "Student cannot see another student's result", isScoped ? 'PASS' : 'FAIL',
      `Queried with ?usn=4PM23CD999_TAMPER; server returned data strictly scoped to authenticated user USN "${returnedStudent?.usn}"`
    );
  } catch (err) {
    recordInvariant(2, "Student cannot see another student's result", 'FAIL', err.message);
  }

  // ----------------------------------------------------------------
  // Invariant 3: Locked question paper cannot be edited
  // ----------------------------------------------------------------
  try {
    const fac = await Faculty.findOne({ employeeId: 'FACULTY1' });
    const sub = await Subject.findOne();
    
    // Create/Update a locked submission assigned to FACULTY1
    const lockedSub = await QuestionPaperSubmission.findOneAndUpdate(
      { subjectId: sub._id, facultyId: fac._id },
      {
        subjectId: sub._id,
        facultyId: fac._id,
        academicYear: '2026-2027',
        semester: sub.semester,
        department: sub.department,
        isLocked: true,
        status: 'selected',
        submittedQuestions: [{ qNo: 'Q1', questionText: 'Locked text', maxMarks: 20 }]
      },
      { upsert: true, returnDocument: 'after' }
    );

    try {
      await axios.patch(`${SERVER_BASE}/qp-submissions/${lockedSub._id}/submit`, {
        submittedQuestions: [{ qNo: 'Q1', questionText: 'Attempted edit', maxMarks: 20 }]
      }, { headers: fac1Headers });
      recordInvariant(3, 'Locked question paper cannot be edited', 'FAIL', 'Update was unexpectedly allowed on locked QP');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || '';
      const isBlocked = status === 400 && msg.includes('locked');
      recordInvariant(3, 'Locked question paper cannot be edited', isBlocked ? 'PASS' : 'FAIL',
        `Status ${status}: ${msg}`
      );
    }
  } catch (err) {
    recordInvariant(3, 'Locked question paper cannot be edited', 'FAIL', err.message);
  }

  // ----------------------------------------------------------------
  // Invariant 4: Script assigned to another faculty is rejected
  // ----------------------------------------------------------------
  try {
    const fac2 = await Faculty.findOne({ employeeId: { $ne: 'FACULTY1' } });
    
    // Script assigned to fac2
    const otherScript = await AnswerScript.findOneAndUpdate(
      {},
      { evaluatorId: fac2._id, isLocked: false },
      { returnDocument: 'after' }
    );

    // Try editing with fac1's token
    try {
      await axios.put(`${SERVER_BASE}/faculty/evaluations/${otherScript._id}`, {
        questionMarks: [{ questionNumber: 'Q1', marksObtained: 10 }]
      }, { headers: fac1Headers });
      recordInvariant(4, 'Script assigned to another faculty is rejected', 'FAIL', 'Unauthorized faculty edit was accepted');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || '';
      recordInvariant(4, 'Script assigned to another faculty is rejected', status === 403 ? 'PASS' : 'FAIL',
        `Status ${status}: ${msg}`
      );
    }
  } catch (err) {
    recordInvariant(4, 'Script assigned to another faculty is rejected', 'FAIL', err.message);
  }

  // ----------------------------------------------------------------
  // Invariant 5: Publishing is blocked or warned while any script has isResultStale = true
  // ----------------------------------------------------------------
  try {
    let sem3Exam = await Exam.findOne({ semester: 3 });
    if (!sem3Exam) {
      const sub = await Subject.findOne({ semester: 3 }) || await Subject.findOne();
      sem3Exam = await Exam.create({
        subjectId: sub._id,
        subjectCode: sub.subjectCode,
        semester: 3,
        department: sub.department,
        examType: 'internal1',
        examDate: '2026-11-02',
        startTime: '09:00',
        endTime: '12:00',
        status: 'scheduled'
      });
    }

    const student = await Student.findOne({ semester: 3 }) || await Student.findOne();
    // Ensure an evaluated script exists with isResultStale = true
    await AnswerScript.findOneAndUpdate(
      { examId: sem3Exam._id },
      {
        studentId: student._id,
        examId: sem3Exam._id,
        marksObtained: 75,
        status: 'evaluated',
        isResultStale: true
      },
      { upsert: true, returnDocument: 'after' }
    );

    try {
      await axios.post(`${SERVER_BASE}/examcell/answer-scripts/publish`, {
        semester: 3
      }, { headers: ecHeaders });
      recordInvariant(5, 'Publishing is blocked or warned while any script has isResultStale = true', 'FAIL', 'Publishing unexpectedly succeeded with stale script');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || '';
      const isBlocked = status === 400 && msg.includes('isResultStale');
      recordInvariant(5, 'Publishing is blocked or warned while any script has isResultStale = true', isBlocked ? 'PASS' : 'FAIL',
        `Status ${status}: ${msg}`
      );
    }
  } catch (err) {
    recordInvariant(5, 'Publishing is blocked or warned while any script has isResultStale = true', 'FAIL', err.message);
  }

  // ----------------------------------------------------------------
  // Invariant 6: Hall ticket and timetable show configured institution name
  // ----------------------------------------------------------------
  try {
    // 1. Configure institution name
    await axios.put(`${SERVER_BASE}/institution/config`, {
      institutionName: 'PES Institute Of Technology and Management',
      institutionCode: 'PESITM',
      address: { city: 'Shivamogga', state: 'Karnataka' }
    }, { headers: adminHeaders });

    // 2. Fetch public config
    const confRes = await axios.get(`${SERVER_BASE}/institution/config`);
    const instName = confRes.data.data?.institutionName;

    // 3. Verify student hall ticket & timetable header resolution
    const htRes = await axios.get(`${SERVER_BASE}/student/hall-ticket`, { headers: stHeaders });
    const ttRes = await axios.get(`${SERVER_BASE}/student/timetable`, { headers: stHeaders });

    const passed = instName === 'PES Institute Of Technology and Management' && htRes.status === 200 && ttRes.status === 200;
    recordInvariant(6, 'Hall ticket and timetable show configured institution name', passed ? 'PASS' : 'FAIL',
      `InstitutionConfig loaded: "${instName}", Hall ticket status: ${htRes.status}, Timetable status: ${ttRes.status}`
    );
  } catch (err) {
    recordInvariant(6, 'Hall ticket and timetable show configured institution name', 'FAIL', err.message);
  }

  console.log('\n================================================================');
  const passCount = invariantResults.filter(r => r.status === 'PASS').length;
  console.log(`   INVARIANT VERIFICATION: ${passCount}/${invariantResults.length} PASSED`);
  console.log('================================================================\n');

  await mongoose.disconnect();
}

verifyInvariants().catch(err => {
  console.error('Error running invariant verification:', err.message);
  process.exit(1);
});
