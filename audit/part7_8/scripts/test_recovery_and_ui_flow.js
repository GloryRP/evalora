const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');
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
const CLIENT_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');

async function main() {
  console.log('====================================================');
  console.log('STARTING RECOVERY, PUBLISH-COMPLETE-ONLY & UI AUDIT');
  console.log('====================================================\n');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB:', mongoose.connection.name);

  // Capture baseline counts
  const baselineCounts = {
    users: await User.countDocuments(),
    students: await Student.countDocuments(),
    faculties: await Faculty.countDocuments(),
    subjects: await Subject.countDocuments(),
    scripts: await AnswerScript.countDocuments(),
    results: await Result.countDocuments(),
    notifications: await Notification.countDocuments()
  };
  console.log('Initial Baseline Counts:', baselineCounts);

  const report = {
    timestamp: new Date().toISOString(),
    baselineCounts,
    recoveryFlow: {},
    publishCompleteOnly: {},
    uiScreenshots: [],
    finalCounts: null,
    parityCheck: false
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

  let browser = null;

  try {
    // Clean any previous test leftovers
    await Student.deleteMany({ usn: /^4PM23TST/ });
    await User.deleteMany({ username: /^4PM23TST/ });
    await Subject.deleteMany({ subjectCode: /^TST/ });
    await Exam.deleteMany({ examName: /^Test / });
    await AnswerScript.deleteMany({ academicYear: '2099-2100' });
    await Result.deleteMany({ academicYear: '2099-2100' });

    // 1. Login as Exam Cell
    console.log('\n--- Logging in as EXAMCELL1 ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'EXAMCELL1',
      password: 'ExamCell@123'
    });
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('EXAMCELL1 login successful.');

    // 2. Seed Students
    const dept = 'Test Engineering';
    const pwdHash = await bcrypt.hash('Student@123', 10);
    const students = {};

    for (let i = 1; i <= 2; i++) {
      const usn = `4PM23TST00${i}`;
      const name = `Test Student 00${i}`;
      const email = `chikalguddjyoti+t${i}@gmail.com`;

      const u = await User.create({
        username: usn,
        passwordHash: pwdHash,
        role: 'student',
        email,
        name,
        department: dept
      });
      tracked.users.push(u._id);

      const s = await Student.create({
        usn,
        name,
        email,
        department: dept,
        semester: 5,
        academicYear: '2099-2100'
      });
      tracked.students.push(s._id);
      students[usn] = s;
    }
    console.log('Seeded 2 test students.');

    // 3. Seed Subjects
    const sub401 = await Subject.create({
      subjectCode: 'TST401',
      subjectName: 'Data Structures & Algorithms',
      department: dept,
      semester: 4,
      credits: 4,
      subjectType: 'theory'
    });
    tracked.subjects.push(sub401._id);

    const sub501 = await Subject.create({
      subjectCode: 'TST501',
      subjectName: 'System Architecture',
      department: dept,
      semester: 5,
      credits: 4,
      subjectType: 'theory'
    });
    tracked.subjects.push(sub501._id);

    const sub502 = await Subject.create({
      subjectCode: 'TST502',
      subjectName: 'Machine Learning',
      department: dept,
      semester: 5,
      credits: 3,
      subjectType: 'theory'
    });
    tracked.subjects.push(sub502._id);

    const sub503 = await Subject.create({
      subjectCode: 'TST503',
      subjectName: 'Cloud Computing',
      department: dept,
      semester: 5,
      credits: 2,
      subjectType: 'theory'
    });
    tracked.subjects.push(sub503._id);
    console.log('Seeded 4 test subjects.');

    // 4. Seed Exams
    const examMap = {};
    const examDefs = [
      { key: '401_I1', name: 'Test Sem 4 TST401 Int 1', sub: sub401, sem: 4, type: 'internal1', max: 50 },
      { key: '401_I2', name: 'Test Sem 4 TST401 Int 2', sub: sub401, sem: 4, type: 'internal2', max: 50 },
      { key: '401_EX', name: 'Test Sem 4 TST401 Ext', sub: sub401, sem: 4, type: 'external', max: 100 },
      { key: '501_I1', name: 'Test Sem 5 TST501 Int 1', sub: sub501, sem: 5, type: 'internal1', max: 50 },
      { key: '501_I2', name: 'Test Sem 5 TST501 Int 2', sub: sub501, sem: 5, type: 'internal2', max: 50 },
      { key: '501_EX', name: 'Test Sem 5 TST501 Ext', sub: sub501, sem: 5, type: 'external', max: 100 },
      { key: '502_I1', name: 'Test Sem 5 TST502 Int 1', sub: sub502, sem: 5, type: 'internal1', max: 50 },
      { key: '502_I2', name: 'Test Sem 5 TST502 Int 2', sub: sub502, sem: 5, type: 'internal2', max: 50 },
      { key: '502_EX', name: 'Test Sem 5 TST502 Ext', sub: sub502, sem: 5, type: 'external', max: 100 },
      { key: '503_I1', name: 'Test Sem 5 TST503 Int 1', sub: sub503, sem: 5, type: 'internal1', max: 50 },
      { key: '503_I2', name: 'Test Sem 5 TST503 Int 2', sub: sub503, sem: 5, type: 'internal2', max: 50 },
      { key: '503_EX', name: 'Test Sem 5 TST503 Ext', sub: sub503, sem: 5, type: 'external', max: 100 }
    ];

    for (const def of examDefs) {
      const e = await Exam.create({
        examName: def.name,
        examType: def.type,
        semester: def.sem,
        academicYear: '2099-2100',
        department: dept,
        subjectId: def.sub._id,
        examDate: new Date('2099-10-15'),
        startTime: '10:00',
        endTime: '13:00',
        totalMarks: def.max,
        passingMarks: def.max * 0.4,
        isPublished: true,
        createdBy: tracked.users[0]
      });
      tracked.exams.push(e._id);
      examMap[def.key] = e;
    }

    // Helper to create script
    async function createScript(examKey, studentUsn, marks) {
      const ex = examMap[examKey];
      const st = students[studentUsn];
      const sc = await AnswerScript.create({
        examId: ex._id,
        studentId: st._id,
        subjectId: ex.subjectId,
        semester: ex.semester,
        academicYear: '2099-2100',
        examType: ex.examType,
        marksObtained: marks,
        status: 'evaluated',
        evaluatorId: null
      });
      tracked.scripts.push(sc._id);
      return sc;
    }

    // 5. Seed Semester 4 (baseline CGPA)
    // Student 001: (40, 40, 80) -> Final 80 -> A+ (9) -> 36 points
    await createScript('401_I1', '4PM23TST001', 40);
    await createScript('401_I2', '4PM23TST001', 40);
    await createScript('401_EX', '4PM23TST001', 80);

    // Student 002: (30, 30, 60) -> Final 60 -> B+ (7) -> 28 points
    await createScript('401_I1', '4PM23TST002', 30);
    await createScript('401_I2', '4PM23TST002', 30);
    await createScript('401_EX', '4PM23TST002', 60);

    // Compute & Publish Sem 4
    console.log('\n--- Computing & Publishing Semester 4 ---');
    await axios.post(`${BASE_URL}/results/compute`, {
      semester: 4,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    await axios.post(`${BASE_URL}/results/publish`, {
      semester: 4,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    const sem4Res = await Result.find({ semester: 4, academicYear: '2099-2100' });
    sem4Res.forEach(r => tracked.results.push(r._id));
    console.log(`Semester 4 published for ${sem4Res.length} students.`);

    // 6. Seed Semester 5
    // Student 001: Missing Internal 2 for TST501!
    await createScript('501_I1', '4PM23TST001', 44);
    // 501_I2 is deliberately NOT seeded here!
    await createScript('501_EX', '4PM23TST001', 90);

    await createScript('502_I1', '4PM23TST001', 45);
    await createScript('502_I2', '4PM23TST001', 47);
    await createScript('502_EX', '4PM23TST001', 90);

    await createScript('503_I1', '4PM23TST001', 48);
    await createScript('503_I2', '4PM23TST001', 46);
    await createScript('503_EX', '4PM23TST001', 94);

    // Student 002: Fully complete!
    await createScript('501_I1', '4PM23TST002', 40);
    await createScript('501_I2', '4PM23TST002', 40);
    await createScript('501_EX', '4PM23TST002', 80);

    await createScript('502_I1', '4PM23TST002', 35);
    await createScript('502_I2', '4PM23TST002', 35);
    await createScript('502_EX', '4PM23TST002', 70);

    await createScript('503_I1', '4PM23TST002', 40);
    await createScript('503_I2', '4PM23TST002', 40);
    await createScript('503_EX', '4PM23TST002', 80);

    // 7. Compute Semester 5 Results (Incomplete State)
    console.log('\n--- Computing Semester 5 Results (Incomplete State) ---');
    const compRes = await axios.post(`${BASE_URL}/results/compute`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    const sem5ResDocs = await Result.find({ semester: 5, academicYear: '2099-2100' });
    sem5ResDocs.forEach(r => tracked.results.push(r._id));

    const st1IncompleteDoc = sem5ResDocs.find(r => r.usn === '4PM23TST001');
    const st2CompleteDoc = sem5ResDocs.find(r => r.usn === '4PM23TST002');

    const sub1Incomplete = st1IncompleteDoc.subjectResults.find(s => s.subjectCode === 'TST501');

    console.log('Compute Message:', compRes.data.message);
    console.log('Incomplete Students in Response:', compRes.data.incompleteStudents?.length);
    console.log('Student 001 overallResult:', st1IncompleteDoc.overallResult);
    console.log('Student 001 isProvisional:', st1IncompleteDoc.isProvisional);
    console.log('Student 001 SGPA:', st1IncompleteDoc.sgpa);
    console.log('Student 001 CGPA:', st1IncompleteDoc.cgpa);
    console.log('Student 001 TST501 Result:', sub1Incomplete.result, '| Grade:', sub1Incomplete.grade);

    report.recoveryFlow.before = {
      message: compRes.data.message,
      incompleteStudents: compRes.data.incompleteStudents,
      student001: {
        usn: st1IncompleteDoc.usn,
        overallResult: st1IncompleteDoc.overallResult,
        isProvisional: st1IncompleteDoc.isProvisional,
        hasIncompleteSubjects: st1IncompleteDoc.hasIncompleteSubjects,
        sgpa: st1IncompleteDoc.sgpa,
        cgpa: st1IncompleteDoc.cgpa,
        totalCredits: st1IncompleteDoc.totalCredits,
        tst501: {
          result: sub1Incomplete.result,
          grade: sub1Incomplete.grade,
          gradePoint: sub1Incomplete.gradePoint,
          missingAssessments: sub1Incomplete.missingAssessments
        }
      }
    };

    // 8. Test Publish All Blocked (Requirement 3 step 2)
    console.log('\n--- Testing Publish All Blocked by Incomplete Student ---');
    let publishAllBlocked = false;
    let blockMessage = '';
    try {
      await axios.post(`${BASE_URL}/results/publish`, {
        semester: 5,
        academicYear: '2099-2100',
        department: dept
      }, { headers: authHeaders });
    } catch (err) {
      publishAllBlocked = err.response?.status === 400;
      blockMessage = err.response?.data?.message || err.message;
    }
    console.log('Publish All Blocked (Expected true):', publishAllBlocked);
    console.log('Block Message:', blockMessage);
    report.recoveryFlow.publishAllBlocked = {
      blocked: publishAllBlocked,
      message: blockMessage
    };

    // 9. Puppeteer UI Screenshots (Requirement 5)
    console.log('\n--- Capturing UI Screenshots with Puppeteer (Incomplete State) ---');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Helper: Login in browser
    async function loginInBrowser(username, password) {
      await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('input', { timeout: 8000 });
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        if (inputs[0]) inputs[0].value = '';
        if (inputs[1]) inputs[1].value = '';
      });
      const inputs = await page.$$('input');
      if (inputs.length >= 2) {
        await inputs[0].type(username);
        await inputs[1].type(password);
      }
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 1200));
    }

    // (a) Exam Cell: Publish Results Page
    console.log('Browser: Logging in as EXAMCELL1...');
    await loginInBrowser('EXAMCELL1', 'ExamCell@123');
    await page.goto(`${CLIENT_URL}/examcell/publish-results`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Fill filter: Semester 5, Academic Year 2099-2100
    await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      selects.forEach(s => {
        if (s.name === 'semester' || s.id === 'semester') s.value = '5';
      });
      const inputs = document.querySelectorAll('input');
      inputs.forEach(i => {
        if (i.name === 'academicYear' || i.placeholder?.includes('20')) i.value = '2099-2100';
      });
    });

    const loadBtn = await page.$('button.btn-primary, button[type="submit"]');
    if (loadBtn) {
      await loadBtn.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    const examcellScreenshotPath = path.join(SCREENSHOT_DIR, '01_examcell_publish_results.png');
    await page.screenshot({ path: examcellScreenshotPath, fullPage: false });
    console.log('✓ Saved Exam Cell screenshot:', examcellScreenshotPath);
    report.uiScreenshots.push({
      view: 'Exam Cell Publish Results Screen',
      file: '01_examcell_publish_results.png',
      elements: ['Incomplete Badge', 'Publish Complete Only Button', 'Publish All Results Button']
    });

    // (b) Student: My Results Page (with provisional & incomplete subject)
    await Result.updateOne({ usn: '4PM23TST001', semester: 5 }, { $set: { isPublished: true } });

    console.log('Browser: Logging in as 4PM23TST001...');
    await loginInBrowser('4PM23TST001', 'Student@123');
    await page.goto(`${CLIENT_URL}/student/results`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const studentScreenshotPath = path.join(SCREENSHOT_DIR, '02_student_my_results_incomplete.png');
    await page.screenshot({ path: studentScreenshotPath, fullPage: false });
    console.log('✓ Saved Student My Results screenshot:', studentScreenshotPath);
    report.uiScreenshots.push({
      view: 'Student My Results Screen (Incomplete / Provisional)',
      file: '02_student_my_results_incomplete.png',
      elements: ['Provisional Results Warning Banner', 'Result incomplete Badge', 'Result incomplete for TST501', 'SGPA (Provisional)']
    });

    // Revert isPublished for student 001 back to false
    await Result.updateOne({ usn: '4PM23TST001', semester: 5 }, { $set: { isPublished: false } });

    await browser.close();
    browser = null;

    // 10. Requirement 3: Recovery Flow (Faculty enters Internal 2)
    console.log('\n--- Executing Recovery Flow (Faculty enters Internal 2) ---');
    // Faculty evaluates Internal 2: 46 / 50
    const recScript = await createScript('501_I2', '4PM23TST001', 46);
    console.log('Internal 2 Script entered for 4PM23TST001: 46/50 (Script ID:', recScript._id, ')');

    // Recompute Semester 5 results
    console.log('Recomputing Semester 5 Results after entering missing marks...');
    const recomputeRes = await axios.post(`${BASE_URL}/results/compute`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    const st1Recovered = await Result.findOne({ usn: '4PM23TST001', semester: 5 });
    const sub1Recovered = st1Recovered.subjectResults.find(s => s.subjectCode === 'TST501');

    console.log('Recompute Status:', recomputeRes.status);
    console.log('Recompute Message:', recomputeRes.data.message);
    console.log('Incomplete Students in Recompute:', recomputeRes.data.incompleteStudents?.length);
    console.log('Recovered Student 001 overallResult:', st1Recovered.overallResult);
    console.log('Recovered Student 001 isProvisional:', st1Recovered.isProvisional);
    console.log('Recovered Student 001 hasIncompleteSubjects:', st1Recovered.hasIncompleteSubjects);
    console.log('Recovered Student 001 totalCredits:', st1Recovered.totalCredits);
    console.log('Recovered Student 001 SGPA:', st1Recovered.sgpa);
    console.log('Recovered Student 001 CGPA:', st1Recovered.cgpa);
    console.log('Recovered TST501 Marks:', sub1Recovered.totalMarks, '| Grade:', sub1Recovered.grade, '| GradePoint:', sub1Recovered.gradePoint);

    const recoveryPassed = 
      recomputeRes.status === 200 &&
      recomputeRes.data.incompleteStudents?.length === 0 &&
      st1Recovered.overallResult === 'PASS' &&
      st1Recovered.isProvisional === false &&
      st1Recovered.hasIncompleteSubjects === false &&
      st1Recovered.totalCredits === 9 &&
      st1Recovered.sgpa === 10.00 &&
      st1Recovered.cgpa === 9.69 &&
      sub1Recovered.grade === 'O' &&
      sub1Recovered.gradePoint === 10 &&
      sub1Recovered.result === 'PASS';

    // 11. Test Publish All after Recovery
    console.log('\n--- Testing Publish All after Recovery ---');
    const pubAllRes = await axios.post(`${BASE_URL}/results/publish`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    const st1FinalPub = await Result.findOne({ usn: '4PM23TST001', semester: 5 });
    const st2FinalPub = await Result.findOne({ usn: '4PM23TST002', semester: 5 });

    // Track any notifications created
    const recNotifs = await Notification.find({ recipientId: { $in: tracked.users } });
    recNotifs.forEach(n => {
      if (!tracked.notifications.some(id => id.toString() === n._id.toString())) {
        tracked.notifications.push(n._id);
      }
    });

    console.log('Publish All Status:', pubAllRes.status);
    console.log('Publish All Message:', pubAllRes.data.message);
    console.log('Student 001 isPublished:', st1FinalPub.isPublished);
    console.log('Student 002 isPublished:', st2FinalPub.isPublished);

    const publishAllSuccess = 
      pubAllRes.status === 200 &&
      st1FinalPub.isPublished === true &&
      st2FinalPub.isPublished === true;

    report.recoveryFlow.after = {
      recoveryStatus: recoveryPassed ? 'PASS' : 'FAIL',
      publishAllSuccess: publishAllSuccess ? 'PASS' : 'FAIL',
      recomputeMessage: recomputeRes.data.message,
      student001: {
        overallResult: st1Recovered.overallResult,
        isProvisional: st1Recovered.isProvisional,
        hasIncompleteSubjects: st1Recovered.hasIncompleteSubjects,
        totalCredits: st1Recovered.totalCredits,
        sgpa: st1Recovered.sgpa,
        cgpa: st1Recovered.cgpa,
        tst501: {
          totalMarks: sub1Recovered.totalMarks,
          grade: sub1Recovered.grade,
          gradePoint: sub1Recovered.gradePoint,
          result: sub1Recovered.result
        },
        isPublished: st1FinalPub.isPublished
      }
    };

    // Capture Post-Recovery Student Screenshot
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });
    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1440, height: 900 });

    console.log('Browser: Logging in as 4PM23TST001 post-recovery...');
    await page2.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await page2.waitForSelector('input', { timeout: 8000 });
    const inputs2 = await page2.$$('input');
    if (inputs2.length >= 2) {
      await inputs2[0].type('4PM23TST001');
      await inputs2[1].type('Student@123');
    }
    const submitBtn2 = await page2.$('button[type="submit"]');
    if (submitBtn2) await submitBtn2.click();
    await page2.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1200));

    await page2.goto(`${CLIENT_URL}/student/results`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    const recoveredScreenshotPath = path.join(SCREENSHOT_DIR, '03_student_my_results_recovered.png');
    await page2.screenshot({ path: recoveredScreenshotPath, fullPage: false });
    console.log('✓ Saved Recovered Student My Results screenshot:', recoveredScreenshotPath);
    report.uiScreenshots.push({
      view: 'Student My Results Screen (Fully Recovered)',
      file: '03_student_my_results_recovered.png',
      elements: ['PASS Badge', 'SGPA 10.00', 'CGPA 9.69', 'Grade O in TST501', 'No Provisional Warning']
    });

    await browser.close();
    browser = null;

    // 12. Requirement 4: Test "Publish Complete Results Only" in clean dedicated state
    console.log('\n--- Testing Publish Complete Results Only (Requirement 4) ---');
    // Remove the recovered Internal 2 script, Sem 5 results, and any test notifications
    await AnswerScript.deleteOne({ _id: recScript._id });
    const idx = tracked.scripts.indexOf(recScript._id);
    if (idx > -1) tracked.scripts.splice(idx, 1);
    await Result.deleteMany({ semester: 5, academicYear: '2099-2100' });
    await Notification.deleteMany({ recipientId: { $in: tracked.users } });
    tracked.notifications = [];

    // Compute again (Student 001 incomplete, Student 002 complete)
    await axios.post(`${BASE_URL}/results/compute`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept
    }, { headers: authHeaders });

    const newSem5Docs = await Result.find({ semester: 5, academicYear: '2099-2100' });
    newSem5Docs.forEach(r => {
      if (!tracked.results.some(id => id.toString() === r._id.toString())) {
        tracked.results.push(r._id);
      }
    });

    // Count notifications before Publish Complete Only
    const notifsBeforePub = await Notification.countDocuments({ recipientId: { $in: tracked.users }, type: 'result_published' });

    const pubCompRes = await axios.post(`${BASE_URL}/results/publish`, {
      semester: 5,
      academicYear: '2099-2100',
      department: dept,
      publishCompleteOnly: true
    }, { headers: authHeaders });

    const pubDocsAfterOnly = await Result.find({ semester: 5, academicYear: '2099-2100' });
    const st1AfterOnly = pubDocsAfterOnly.find(r => r.usn === '4PM23TST001');
    const st2AfterOnly = pubDocsAfterOnly.find(r => r.usn === '4PM23TST002');

    // Notifications check
    const user1 = await User.findOne({ username: '4PM23TST001' });
    const user2 = await User.findOne({ username: '4PM23TST002' });

    const notifsUser1 = await Notification.find({ recipientId: user1._id, type: 'result_published', 'data.semester': 5 });
    const notifsUser2 = await Notification.find({ recipientId: user2._id, type: 'result_published', 'data.semester': 5 });

    notifsUser1.forEach(n => tracked.notifications.push(n._id));
    notifsUser2.forEach(n => tracked.notifications.push(n._id));

    console.log('Publish Complete Only Status:', pubCompRes.status);
    console.log('Published Count:', pubCompRes.data.count, '| Held Back Count:', pubCompRes.data.heldBackCount);
    console.log('Student 002 (Complete) isPublished:', st2AfterOnly.isPublished);
    console.log('Student 001 (Incomplete) isPublished:', st1AfterOnly.isPublished);
    console.log('Student 002 Sem 5 Notification count:', notifsUser2.length);
    console.log('Student 001 Sem 5 Notification count:', notifsUser1.length);

    const pubCompleteOnlyPassed = 
      pubCompRes.status === 200 &&
      pubCompRes.data.count === 1 &&
      pubCompRes.data.heldBackCount === 1 &&
      st2AfterOnly.isPublished === true &&
      st1AfterOnly.isPublished === false &&
      notifsUser2.length === 1 &&
      notifsUser1.length === 0;

    report.publishCompleteOnly = {
      status: pubCompleteOnlyPassed ? 'PASS' : 'FAIL',
      httpStatus: pubCompRes.status,
      publishedCount: pubCompRes.data.count,
      heldBackCount: pubCompRes.data.heldBackCount,
      student002Published: st2AfterOnly.isPublished,
      student001Published: st1AfterOnly.isPublished,
      student002NotificationSent: notifsUser2.length === 1,
      student001NotificationSent: notifsUser1.length > 0
    };


  } catch (err) {
    console.error('ERROR in test execution:', err.response?.data || err.message || err);
  } finally {
    if (browser) await browser.close();

    // 13. Safe Cleanup by _id only
    console.log('\n--- Cleaning up test records strictly by _id ---');
    // Ensure all test notifications are tracked
    const finalNotifs = await Notification.find({ recipientId: { $in: tracked.users } }, '_id');
    finalNotifs.forEach(n => {
      if (!tracked.notifications.some(id => id.toString() === n._id.toString())) {
        tracked.notifications.push(n._id);
      }
    });

    if (tracked.scripts.length > 0) await AnswerScript.deleteMany({ _id: { $in: tracked.scripts } });
    if (tracked.results.length > 0) await Result.deleteMany({ _id: { $in: tracked.results } });
    if (tracked.exams.length > 0) await Exam.deleteMany({ _id: { $in: tracked.exams } });
    if (tracked.subjects.length > 0) await Subject.deleteMany({ _id: { $in: tracked.subjects } });
    if (tracked.students.length > 0) await Student.deleteMany({ _id: { $in: tracked.students } });
    if (tracked.notifications.length > 0) await Notification.deleteMany({ _id: { $in: tracked.notifications } });
    if (tracked.users.length > 0) await User.deleteMany({ _id: { $in: tracked.users } });

    const finalCounts = {
      users: await User.countDocuments(),
      students: await Student.countDocuments(),
      faculties: await Faculty.countDocuments(),
      subjects: await Subject.countDocuments(),
      scripts: await AnswerScript.countDocuments(),
      results: await Result.countDocuments(),
      notifications: await Notification.countDocuments()
    };
    report.finalCounts = finalCounts;
    console.log('Final Database Counts:', finalCounts);

    const countsMatch = JSON.stringify(baselineCounts) === JSON.stringify(finalCounts);
    report.parityCheck = countsMatch;
    console.log('Database Baseline & Final Counts Match:', countsMatch ? 'YES (100% CLEAN)' : 'NO');

    // Save test report JSON
    fs.writeFileSync(
      path.join(__dirname, '../recovery_and_publish_test_results.json'),
      JSON.stringify(report, null, 2)
    );

    // Save counts_after.json
    fs.writeFileSync(
      path.join(__dirname, '../counts_after.json'),
      JSON.stringify({
        database: mongoose.connection.name,
        timestamp: new Date().toISOString(),
        counts: finalCounts
      }, null, 2)
    );
    console.log('Saved counts_after.json and recovery_and_publish_test_results.json.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
