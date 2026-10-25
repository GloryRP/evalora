const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });

const User = require('../../../server/models/User');
const Student = require('../../../server/models/Student');
const Subject = require('../../../server/models/Subject');
const Exam = require('../../../server/models/Exam');
const AnswerScript = require('../../../server/models/AnswerScript');
const Result = require('../../../server/models/Result');
const Notification = require('../../../server/models/Notification');
const Faculty = require('../../../server/models/Faculty');

const BASE_URL = 'http://localhost:5000/api/v1';

async function main() {
  console.log('====================================================');
  console.log('STARTING INCOMPLETE MARKS FIX TEST SUITE');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB:', mongoose.connection.name);

  const baselineCounts = {
    users: await User.countDocuments(),
    students: await Student.countDocuments(),
    faculties: await Faculty.countDocuments(),
    subjects: await Subject.countDocuments(),
    scripts: await AnswerScript.countDocuments(),
    results: await Result.countDocuments(),
    notifications: await Notification.countDocuments()
  };
  console.log('Initial Database Counts:', baselineCounts);

  const faculty = await Faculty.findOne();
  if (!faculty) throw new Error('No faculty found in DB');

  const testReport = {
    timestamp: new Date().toISOString(),
    tests: [],
    baselineCounts,
    finalCounts: null
  };

  const tracked = {
    users: [],
    students: [],
    subjects: [],
    exams: [],
    scripts: [],
    results: [],
    notifications: []
  };

  try {
    // 1. Purge any leftover test records
    await Student.deleteMany({ usn: /^4PM23TST/ });
    await User.deleteMany({ username: /^4PM23TST/ });
    await Subject.deleteMany({ subjectCode: /^TST/ });
    await Exam.deleteMany({ examName: /^Test / });
    await AnswerScript.deleteMany({ academicYear: '2099-2100' });
    await Result.deleteMany({ academicYear: '2099-2100' });

    // 2. Login as EXAMCELL1
    console.log('\n--- Logging in as EXAMCELL1 ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'EXAMCELL1',
      password: 'ExamCell@123'
    });
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('EXAMCELL1 login successful.');

    // 3. Seed Students
    const dept = 'Test Engineering';
    const pwdHash = await bcrypt.hash('Student@123', 10);
    const students = {};

    for (let i = 1; i <= 5; i++) {
      const usn = `4PM23TST00${i}`;
      const name = `Test Student 00${i}`;
      const email = `chikalguddjyoti+t${i}@gmail.com`;

      const u = await User.create({
        username: usn,
        passwordHash: pwdHash,
        role: 'student',
        name,
        department: dept,
        email,
        phone: '9999999999',
        isActive: true,
        isFirstLogin: false
      });
      tracked.users.push(u._id);

      const s = await Student.create({
        usn,
        name,
        department: dept,
        semester: 5,
        email,
        phone: '9999999999',
        batch: '2023-2027'
      });
      tracked.students.push(s._id);
      students[usn] = s;
    }
    console.log('Created 5 test students.');

    // 4. Seed Subjects
    // Sem 4: TST401 (4 cr)
    const tst401 = await Subject.create({
      subjectCode: 'TST401',
      subjectName: 'Engineering Mathematics IV',
      department: dept,
      semester: 4,
      credits: 4,
      subjectType: 'theory'
    });
    tracked.subjects.push(tst401._id);

    // Sem 5: TST501 (4 cr), TST502 (3 cr), TST503 (2 cr)
    const tst501 = await Subject.create({
      subjectCode: 'TST501',
      subjectName: 'System Architecture',
      department: dept,
      semester: 5,
      credits: 4,
      subjectType: 'theory'
    });
    tracked.subjects.push(tst501._id);

    const tst502 = await Subject.create({
      subjectCode: 'TST502',
      subjectName: 'Database Management',
      department: dept,
      semester: 5,
      credits: 3,
      subjectType: 'theory'
    });
    tracked.subjects.push(tst502._id);

    const tst503 = await Subject.create({
      subjectCode: 'TST503',
      subjectName: 'Artificial Intelligence',
      department: dept,
      semester: 5,
      credits: 2,
      subjectType: 'theory'
    });
    tracked.subjects.push(tst503._id);

    console.log('Created 4 test subjects.');

    // 5. Seed Exams
    const examMap = {};
    const examDefs = [
      { sub: tst401, sem: 4, type: 'internal1', max: 50 },
      { sub: tst401, sem: 4, type: 'internal2', max: 50 },
      { sub: tst401, sem: 4, type: 'external', max: 100 },
      { sub: tst501, sem: 5, type: 'internal1', max: 50 },
      { sub: tst501, sem: 5, type: 'internal2', max: 50 },
      { sub: tst501, sem: 5, type: 'external', max: 100 },
      { sub: tst502, sem: 5, type: 'internal1', max: 50 },
      { sub: tst502, sem: 5, type: 'internal2', max: 50 },
      { sub: tst502, sem: 5, type: 'external', max: 100 },
      { sub: tst503, sem: 5, type: 'internal1', max: 50 },
      { sub: tst503, sem: 5, type: 'internal2', max: 50 },
      { sub: tst503, sem: 5, type: 'external', max: 100 }
    ];

    for (const d of examDefs) {
      const exam = await Exam.create({
        examName: `Test ${d.sub.subjectCode} ${d.type}`,
        examType: d.type,
        semester: d.sem,
        academicYear: '2099-2100',
        department: dept,
        subjectId: d.sub._id,
        examDate: new Date('2099-10-15'),
        startTime: '10:00',
        endTime: '13:00',
        totalMarks: d.max,
        passingMarks: d.max * 0.4,
        isPublished: true,
        createdBy: tracked.users[0]
      });
      tracked.exams.push(exam._id);
      examMap[`${d.sub.subjectCode}_${d.type}`] = exam;
    }
    console.log('Created 12 test exams.');

    // 6. Seed Answer Scripts
    async function addScript(usn, subCode, examType, marks) {
      const exam = examMap[`${subCode}_${examType}`];
      const student = students[usn];
      const script = await AnswerScript.create({
        examId: exam._id,
        subjectId: exam.subjectId,
        studentId: student._id,
        academicYear: '2099-2100',
        status: 'evaluated',
        marksObtained: marks,
        maxMarks: exam.totalMarks,
        isEvaluated: true,
        evaluatedAt: new Date(),
        evaluatorId: faculty._id,
        isLocked: false,
        isResultStale: false
      });
      tracked.scripts.push(script._id);
      return script;
    }

    // Sem 4:
    // Student 001: TST401 (40, 40, 80) -> CIE=40, SEE=40, Total=80, GP=9
    await addScript('4PM23TST001', 'TST401', 'internal1', 40);
    await addScript('4PM23TST001', 'TST401', 'internal2', 40);
    await addScript('4PM23TST001', 'TST401', 'external', 80);

    // Student 005: TST401 (40, 40, 80) -> CIE=40, SEE=40, Total=80, GP=9 (4 credits, 36 grade points)
    await addScript('4PM23TST005', 'TST401', 'internal1', 40);
    await addScript('4PM23TST005', 'TST401', 'internal2', 40);
    await addScript('4PM23TST005', 'TST401', 'external', 80);

    // Sem 5:
    // Student 001: COMPLETE (Unchanged results)
    // TST501: (45, 45, 92) -> CIE 45, SEE 46, Total 91 -> O (GP 10)
    await addScript('4PM23TST001', 'TST501', 'internal1', 45);
    await addScript('4PM23TST001', 'TST501', 'internal2', 45);
    await addScript('4PM23TST001', 'TST501', 'external', 92);
    // TST502: (45, 45, 92) -> CIE 45, SEE 46, Total 91 -> O (GP 10)
    await addScript('4PM23TST001', 'TST502', 'internal1', 45);
    await addScript('4PM23TST001', 'TST502', 'internal2', 45);
    await addScript('4PM23TST001', 'TST502', 'external', 92);
    // TST503: (47, 47, 94) -> CIE 47, SEE 47, Total 94 -> O (GP 10)
    await addScript('4PM23TST001', 'TST503', 'internal1', 47);
    await addScript('4PM23TST001', 'TST503', 'internal2', 47);
    await addScript('4PM23TST001', 'TST503', 'external', 94);

    // Student 002: MISSING INTERNAL 2 on TST501
    // TST501: Int1=40, Int2=MISSING, Ext=80
    await addScript('4PM23TST002', 'TST501', 'internal1', 40);
    // Missing internal2!
    await addScript('4PM23TST002', 'TST501', 'external', 80);
    // TST502: Complete (40, 40, 80) -> Grade A+ (GP 9)
    await addScript('4PM23TST002', 'TST502', 'internal1', 40);
    await addScript('4PM23TST002', 'TST502', 'internal2', 40);
    await addScript('4PM23TST002', 'TST502', 'external', 80);
    // TST503: Complete (40, 40, 80) -> Grade A+ (GP 9)
    await addScript('4PM23TST002', 'TST503', 'internal1', 40);
    await addScript('4PM23TST002', 'TST503', 'internal2', 40);
    await addScript('4PM23TST002', 'TST503', 'external', 80);

    // Student 003: MISSING SUBJECT TST503 (0 scripts for TST503)
    // TST501: (45, 45, 90) -> Grade O (GP 10, 4 cr)
    await addScript('4PM23TST003', 'TST501', 'internal1', 45);
    await addScript('4PM23TST003', 'TST501', 'internal2', 45);
    await addScript('4PM23TST003', 'TST501', 'external', 90);
    // TST502: (45, 45, 90) -> Grade O (GP 10, 3 cr)
    await addScript('4PM23TST003', 'TST502', 'internal1', 45);
    await addScript('4PM23TST003', 'TST502', 'internal2', 45);
    await addScript('4PM23TST003', 'TST502', 'external', 90);
    // TST503 has NO scripts!

    // Student 004: MISSING EXTERNAL on TST501
    // TST501: Int1=40, Int2=40, External MISSING
    await addScript('4PM23TST004', 'TST501', 'internal1', 40);
    await addScript('4PM23TST004', 'TST501', 'internal2', 40);
    // Missing external!
    // TST502: Complete (40, 40, 80) -> Grade A+ (GP 9)
    await addScript('4PM23TST004', 'TST502', 'internal1', 40);
    await addScript('4PM23TST004', 'TST502', 'internal2', 40);
    await addScript('4PM23TST004', 'TST502', 'external', 80);
    // TST503: Complete (40, 40, 80) -> Grade A+ (GP 9)
    await addScript('4PM23TST004', 'TST503', 'internal1', 40);
    await addScript('4PM23TST004', 'TST503', 'internal2', 40);
    await addScript('4PM23TST004', 'TST503', 'external', 80);

    // Student 005: CGPA Across Two Semesters with One Incomplete Subject
    // TST501 (4 cr): (45, 45, 90) -> Final 90 -> Grade O (GP 10) -> 40 points
    await addScript('4PM23TST005', 'TST501', 'internal1', 45);
    await addScript('4PM23TST005', 'TST501', 'internal2', 45);
    await addScript('4PM23TST005', 'TST501', 'external', 90);
    // TST502 (3 cr): (45, 45, 90) -> Final 90 -> Grade O (GP 10) -> 30 points
    await addScript('4PM23TST005', 'TST502', 'internal1', 45);
    await addScript('4PM23TST005', 'TST502', 'internal2', 45);
    await addScript('4PM23TST005', 'TST502', 'external', 90);
    // TST503 (2 cr): Incomplete (missing External)
    await addScript('4PM23TST005', 'TST503', 'internal1', 40);
    await addScript('4PM23TST005', 'TST503', 'internal2', 40);
    // Missing external!

    console.log(`Answer scripts seeded successfully (${tracked.scripts.length} scripts).`);

    // ================================================================
    // STEP 1: Compute and Publish Semester 4 (Prerequisite for CGPA)
    // ================================================================
    console.log('\n--- Computing Semester 4 ---');
    const sem4Compute = await axios.post(`${BASE_URL}/results/compute`, {
      semester: 4,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    console.log('Sem 4 compute response:', sem4Compute.data.message);
    const sem4Docs = await Result.find({ semester: 4, academicYear: '2099-2100' });
    sem4Docs.forEach(r => tracked.results.push(r._id));

    // Publish Semester 4
    console.log('Publishing Semester 4...');
    const sem4Pub = await axios.post(`${BASE_URL}/results/publish`, {
      semester: 4,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });
    console.log('Sem 4 publish response:', sem4Pub.data.message);

    // ================================================================
    // STEP 2: Compute Semester 5 Results
    // ================================================================
    console.log('\n--- Computing Semester 5 Results ---');
    const sem5Compute = await axios.post(`${BASE_URL}/results/compute`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    const computeBody = sem5Compute.data;
    console.log('Sem 5 Compute Status:', sem5Compute.status);
    console.log('Sem 5 Message:', computeBody.message);
    console.log('Incomplete Students Returned in API Response:', JSON.stringify(computeBody.incompleteStudents, null, 2));

    const sem5Docs = await Result.find({ semester: 5, academicYear: '2099-2100' });
    sem5Docs.forEach(r => tracked.results.push(r._id));

    const res001 = sem5Docs.find(r => r.usn === '4PM23TST001');
    const res002 = sem5Docs.find(r => r.usn === '4PM23TST002');
    const res003 = sem5Docs.find(r => r.usn === '4PM23TST003');
    const res004 = sem5Docs.find(r => r.usn === '4PM23TST004');
    const res005 = sem5Docs.find(r => r.usn === '4PM23TST005');

    // ================================================================
    // TEST 1: Missing Internal 2 (Student 002)
    // ================================================================
    console.log('\n--- Running Test 1: Missing Internal 2 (4PM23TST002) ---');
    const tst501_002 = res002.subjectResults.find(s => s.subjectCode === 'TST501');
    const tst1Passed = 
      tst501_002.isIncomplete === true &&
      tst501_002.grade === 'Incomplete' &&
      tst501_002.result === 'INCOMPLETE' &&
      tst501_002.marksObtained === null &&
      tst501_002.missingAssessments.includes('Internal 2') &&
      res002.isProvisional === true &&
      res002.hasIncompleteSubjects === true &&
      res002.overallResult === 'INCOMPLETE' &&
      res002.totalCredits === 5 && // TST502 (3) + TST503 (2) = 5. TST501 (4 cr) excluded!
      res002.sgpa === 9.00; // (3*9 + 2*9)/5 = 45/5 = 9.00

    testReport.tests.push({
      testId: 'TEST-1-MISSING-INTERNAL-2',
      scenario: 'Student missing Internal 2 assessment for TST501',
      expected: {
        subjectIncomplete: true,
        grade: 'Incomplete',
        result: 'INCOMPLETE',
        missingAssessments: ['Internal 2'],
        excludedFromCredits: true,
        totalCredits: 5,
        sgpa: 9.00,
        isProvisional: true,
        overallResult: 'INCOMPLETE'
      },
      actual: {
        subjectIncomplete: tst501_002?.isIncomplete,
        grade: tst501_002?.grade,
        result: tst501_002?.result,
        missingAssessments: tst501_002?.missingAssessments,
        totalCredits: res002?.totalCredits,
        sgpa: res002?.sgpa,
        isProvisional: res002?.isProvisional,
        overallResult: res002?.overallResult
      },
      status: tst1Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 1 Status:', tst1Passed ? 'PASS' : 'FAIL');

    // ================================================================
    // TEST 2: Missing Subject (Student 003)
    // ================================================================
    console.log('\n--- Running Test 2: Missing Subject (4PM23TST003) ---');
    const tst503_003 = res003.subjectResults.find(s => s.subjectCode === 'TST503');
    const tst2Passed = 
      tst503_003.isIncomplete === true &&
      tst503_003.grade === 'Incomplete' &&
      tst503_003.result === 'INCOMPLETE' &&
      tst503_003.missingAssessments.includes('Internal 1') &&
      tst503_003.missingAssessments.includes('Internal 2') &&
      tst503_003.missingAssessments.includes('External') &&
      res003.isProvisional === true &&
      res003.overallResult === 'INCOMPLETE' &&
      res003.totalCredits === 7 && // TST501 (4) + TST502 (3) = 7. TST503 excluded!
      res003.sgpa === 10.00; // (4*10 + 3*10)/7 = 70/7 = 10.00

    testReport.tests.push({
      testId: 'TEST-2-MISSING-SUBJECT',
      scenario: 'Student enrolled in Sem 5 with zero scripts for TST503',
      expected: {
        subjectIncomplete: true,
        grade: 'Incomplete',
        result: 'INCOMPLETE',
        missingAssessments: ['Internal 1', 'Internal 2', 'External'],
        excludedFromCredits: true,
        totalCredits: 7,
        sgpa: 10.00,
        isProvisional: true,
        overallResult: 'INCOMPLETE'
      },
      actual: {
        subjectIncomplete: tst503_003?.isIncomplete,
        grade: tst503_003?.grade,
        result: tst503_003?.result,
        missingAssessments: tst503_003?.missingAssessments,
        totalCredits: res003?.totalCredits,
        sgpa: res003?.sgpa,
        isProvisional: res003?.isProvisional,
        overallResult: res003?.overallResult
      },
      status: tst2Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 2 Status:', tst2Passed ? 'PASS' : 'FAIL');

    // ================================================================
    // TEST 3: Missing External (Student 004)
    // ================================================================
    console.log('\n--- Running Test 3: Missing External (4PM23TST004) ---');
    const tst501_004 = res004.subjectResults.find(s => s.subjectCode === 'TST501');
    const tst3Passed = 
      tst501_004.isIncomplete === true &&
      tst501_004.grade === 'Incomplete' &&
      tst501_004.result === 'INCOMPLETE' &&
      tst501_004.missingAssessments.includes('External') &&
      res004.isProvisional === true &&
      res004.overallResult === 'INCOMPLETE' &&
      res004.totalCredits === 5 &&
      res004.sgpa === 9.00;

    testReport.tests.push({
      testId: 'TEST-3-MISSING-EXTERNAL',
      scenario: 'Student missing External exam for TST501',
      expected: {
        subjectIncomplete: true,
        grade: 'Incomplete',
        result: 'INCOMPLETE',
        missingAssessments: ['External'],
        totalCredits: 5,
        sgpa: 9.00,
        isProvisional: true,
        overallResult: 'INCOMPLETE'
      },
      actual: {
        subjectIncomplete: tst501_004?.isIncomplete,
        grade: tst501_004?.grade,
        result: tst501_004?.result,
        missingAssessments: tst501_004?.missingAssessments,
        totalCredits: res004?.totalCredits,
        sgpa: res004?.sgpa,
        isProvisional: res004?.isProvisional,
        overallResult: res004?.overallResult
      },
      status: tst3Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 3 Status:', tst3Passed ? 'PASS' : 'FAIL');

    // ================================================================
    // TEST 4: Complete Student - Unchanged Results (Student 001)
    // ================================================================
    console.log('\n--- Running Test 4: Complete Student (4PM23TST001) ---');
    const allSubsPass = res001.subjectResults.every(s => !s.isIncomplete && s.grade === 'O' && s.result === 'PASS');
    const tst4Passed = 
      allSubsPass &&
      res001.isProvisional === false &&
      res001.hasIncompleteSubjects === false &&
      res001.overallResult === 'PASS' &&
      res001.totalCredits === 9 &&
      res001.sgpa === 10.00 &&
      res001.cgpa === 9.69;

    testReport.tests.push({
      testId: 'TEST-4-COMPLETE-STUDENT-UNCHANGED',
      scenario: 'Complete student with all assessments submitted and evaluated',
      expected: {
        allSubjectsComplete: true,
        allGradesO: true,
        overallResult: 'PASS',
        isProvisional: false,
        totalCredits: 9,
        sgpa: 10.00,
        cgpa: 9.69
      },
      actual: {
        allSubjectsComplete: res001?.subjectResults.every(s => !s.isIncomplete),
        allGradesO: res001?.subjectResults.every(s => s.grade === 'O'),
        overallResult: res001?.overallResult,
        isProvisional: res001?.isProvisional,
        totalCredits: res001?.totalCredits,
        sgpa: res001?.sgpa,
        cgpa: res001?.cgpa
      },
      status: tst4Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 4 Status:', tst4Passed ? 'PASS' : 'FAIL');

    // ================================================================
    // TEST 5: CGPA Across Two Semesters with One Incomplete Subject (Student 005)
    // ================================================================
    console.log('\n--- Running Test 5: CGPA Across Two Semesters (4PM23TST005) ---');
    const tst503_005 = res005.subjectResults.find(s => s.subjectCode === 'TST503');
    const tst5Passed = 
      tst503_005.isIncomplete === true &&
      res005.isProvisional === true &&
      res005.totalCredits === 7 &&
      res005.totalGradePoints === 70 &&
      res005.sgpa === 10.00 &&
      res005.cgpa === 9.64;

    testReport.tests.push({
      testId: 'TEST-5-CGPA-TWO-SEMESTERS-INCOMPLETE',
      scenario: 'Cumulative CGPA across Sem 4 (4 cr, 36 pts) and Sem 5 (7 cr completed, 1 sub 2 cr incomplete)',
      expected: {
        sem5CompletedCredits: 7,
        sem5GradePoints: 70,
        sem5ProvisionalSgpa: 10.00,
        cumulativeCredits: 11,
        cumulativeGradePoints: 106,
        provisionalCgpa: 9.64,
        isProvisional: true
      },
      actual: {
        sem5CompletedCredits: res005?.totalCredits,
        sem5GradePoints: res005?.totalGradePoints,
        sem5ProvisionalSgpa: res005?.sgpa,
        provisionalCgpa: res005?.cgpa,
        isProvisional: res005?.isProvisional
      },
      status: tst5Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 5 Status:', tst5Passed ? 'PASS' : 'FAIL');

    // ================================================================
    // TEST 6: Block "Publish All Results" while any subject is incomplete
    // ================================================================
    console.log('\n--- Running Test 6: Block Publish All Results ---');
    let publishAllBlocked = false;
    let blockMessage = '';
    let blockedByIncompleteFlag = false;

    try {
      await axios.post(`${BASE_URL}/results/publish`, {
        semester: 5,
        academicYear: '2099-2100',
        department: dept
      }, { headers: authHeaders });
    } catch (err) {
      if (err.response && err.response.status === 400) {
        publishAllBlocked = true;
        blockedByIncompleteFlag = err.response.data?.blockedByIncomplete;
        blockMessage = err.response.data?.message;
      }
    }

    const tst6Passed = publishAllBlocked && blockedByIncompleteFlag === true && blockMessage.includes('incomplete');
    testReport.tests.push({
      testId: 'TEST-6-BLOCK-PUBLISH-ALL',
      scenario: 'Attempting to Publish All Results when incomplete evaluations exist in the cohort',
      expected: {
        httpStatus: 400,
        blockedByIncomplete: true,
        messageContainsIncomplete: true
      },
      actual: {
        blocked: publishAllBlocked,
        blockedByIncomplete: blockedByIncompleteFlag,
        message: blockMessage
      },
      status: tst6Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 6 Status:', tst6Passed ? 'PASS' : 'FAIL');
    console.log('Block Message received:', blockMessage);

    // ================================================================
    // TEST 7: "Publish Complete Results Only" Option
    // ================================================================
    console.log('\n--- Running Test 7: Publish Complete Results Only ---');
    const pubCompleteRes = await axios.post(`${BASE_URL}/results/publish`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept,
      publishCompleteOnly: true
    }, { headers: authHeaders });

    const pubDocs = await Result.find({ semester: 5, academicYear: '2099-2100' });
    const student1Published = pubDocs.find(r => r.usn === '4PM23TST001')?.isPublished === true;
    const incompleteHeldBack = pubDocs.filter(r => r.usn !== '4PM23TST001').every(r => r.isPublished === false);

    const tst7Passed = 
      pubCompleteRes.status === 200 &&
      pubCompleteRes.data.count === 1 &&
      pubCompleteRes.data.heldBackCount === 4 &&
      student1Published &&
      incompleteHeldBack;

    testReport.tests.push({
      testId: 'TEST-7-PUBLISH-COMPLETE-ONLY',
      scenario: 'Publish Complete Results Only publishes only complete students and withholds incomplete',
      expected: {
        httpStatus: 200,
        publishedCount: 1,
        heldBackCount: 4,
        student001Published: true,
        incompleteHeldBack: true
      },
      actual: {
        httpStatus: pubCompleteRes.status,
        publishedCount: pubCompleteRes.data.count,
        heldBackCount: pubCompleteRes.data.heldBackCount,
        student001Published: student1Published,
        incompleteHeldBack: incompleteHeldBack
      },
      status: tst7Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 7 Status:', tst7Passed ? 'PASS' : 'FAIL');

    // ================================================================
    // TEST 8: Student My Results View
    // ================================================================
    console.log('\n--- Running Test 8: Student My Results View ---');
    // Login as student 001 (published)
    const st1Login = await axios.post(`${BASE_URL}/auth/login`, {
      username: '4PM23TST001',
      password: 'Student@123'
    });
    const st1Token = st1Login.data.token;
    const st1Results = await axios.get(`${BASE_URL}/results/my-results`, {
      headers: { Authorization: `Bearer ${st1Token}` }
    });

    const sem5St1 = st1Results.data.data.find(r => r.semester === 5);
    const tst8Passed = 
      st1Results.status === 200 &&
      sem5St1 &&
      sem5St1.sgpa === 10.00 &&
      sem5St1.cgpa === 9.69 &&
      sem5St1.overallResult === 'PASS' &&
      sem5St1.subjectResults.length === 3;

    testReport.tests.push({
      testId: 'TEST-8-STUDENT-MY-RESULTS-VIEW',
      scenario: 'Student 001 views their published results in /my-results',
      expected: {
        httpStatus: 200,
        sem5Found: true,
        sgpa: 10.00,
        cgpa: 9.69,
        overallResult: 'PASS'
      },
      actual: {
        httpStatus: st1Results.status,
        sem5Found: !!sem5St1,
        sgpa: sem5St1?.sgpa,
        cgpa: sem5St1?.cgpa,
        overallResult: sem5St1?.overallResult
      },
      status: tst8Passed ? 'PASS' : 'FAIL'
    });
    console.log('Test 8 Status:', tst8Passed ? 'PASS' : 'FAIL');

  } catch (err) {
    console.error('ERROR in test execution:', err.response?.data || err.message || err);
  } finally {
    // 7. Cleanup and verify counts
    console.log('\n--- Cleaning up test records ---');
    if (tracked.scripts.length > 0) await AnswerScript.deleteMany({ _id: { $in: tracked.scripts } });
    if (tracked.results.length > 0) await Result.deleteMany({ _id: { $in: tracked.results } });
    if (tracked.exams.length > 0) await Exam.deleteMany({ _id: { $in: tracked.exams } });
    if (tracked.subjects.length > 0) await Subject.deleteMany({ _id: { $in: tracked.subjects } });
    if (tracked.students.length > 0) await Student.deleteMany({ _id: { $in: tracked.students } });
    // Track notifications created for test users
    const createdNotifs = await Notification.find({ recipientId: { $in: tracked.users } }, '_id');
    createdNotifs.forEach(n => {
      if (!tracked.notifications.some(id => id.toString() === n._id.toString())) {
        tracked.notifications.push(n._id);
      }
    });

    if (tracked.notifications.length > 0) {
      await Notification.deleteMany({ _id: { $in: tracked.notifications } });
    }
    if (tracked.users.length > 0) {
      await User.deleteMany({ _id: { $in: tracked.users } });
    }

    const finalCounts = {
      users: await User.countDocuments(),
      students: await Student.countDocuments(),
      faculties: await Faculty.countDocuments(),
      subjects: await Subject.countDocuments(),
      scripts: await AnswerScript.countDocuments(),
      results: await Result.countDocuments(),
      notifications: await Notification.countDocuments()
    };
    testReport.finalCounts = finalCounts;
    console.log('Final Database Counts:', finalCounts);

    const countsMatch = JSON.stringify(baselineCounts) === JSON.stringify(finalCounts);
    console.log('Database Baseline & Final Counts Match:', countsMatch ? 'YES (100% CLEAN)' : 'NO');

    // Save test outputs to json
    fs.writeFileSync(
      path.join(__dirname, '../test_incomplete_fix_results.json'),
      JSON.stringify(testReport, null, 2)
    );
    console.log('Saved test outputs to audit/part7_8/test_incomplete_fix_results.json');

    console.log('\n====================================================');
    console.log('TEST SUITE EXECUTION SUMMARY');
    console.log('====================================================');
    testReport.tests.forEach(t => {
      console.log(`[${t.status}] ${t.testId}: ${t.scenario}`);
    });
    console.log('====================================================\n');

    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
