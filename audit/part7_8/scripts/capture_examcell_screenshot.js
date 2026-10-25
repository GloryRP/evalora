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
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const baseline = {
    users: await User.countDocuments(),
    students: await Student.countDocuments(),
    faculties: await Faculty.countDocuments(),
    subjects: await Subject.countDocuments(),
    scripts: await AnswerScript.countDocuments(),
    results: await Result.countDocuments(),
    notifications: await Notification.countDocuments()
  };
  console.log('Baseline counts before screenshot:', baseline);

  const tracked = { users: [], students: [], subjects: [], exams: [], scripts: [], results: [], notifications: [] };
  let browser = null;

  try {
    const dept = 'Test Engineering';
    const pwdHash = await bcrypt.hash('Student@123', 10);
    const students = {};

    for (let i = 1; i <= 2; i++) {
      const usn = `4PM23TST00${i}`;
      const name = `Test Student 00${i}`;
      const email = `chikalguddjyoti+t${i}@gmail.com`;

      const u = await User.create({ username: usn, passwordHash: pwdHash, role: 'student', email, name, department: dept });
      tracked.users.push(u._id);

      const s = await Student.create({ usn, name, email, department: dept, semester: 5, academicYear: '2099-2100' });
      tracked.students.push(s._id);
      students[usn] = s;
    }

    const sub501 = await Subject.create({ subjectCode: 'TST501', subjectName: 'System Architecture', department: dept, semester: 5, credits: 4, subjectType: 'theory' });
    tracked.subjects.push(sub501._id);

    const sub502 = await Subject.create({ subjectCode: 'TST502', subjectName: 'Machine Learning', department: dept, semester: 5, credits: 3, subjectType: 'theory' });
    tracked.subjects.push(sub502._id);

    const sub503 = await Subject.create({ subjectCode: 'TST503', subjectName: 'Cloud Computing', department: dept, semester: 5, credits: 2, subjectType: 'theory' });
    tracked.subjects.push(sub503._id);

    const examDefs = [
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

    const examMap = {};
    for (const d of examDefs) {
      const e = await Exam.create({
        examName: d.name,
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
      tracked.exams.push(e._id);
      examMap[d.key] = e;
    }

    async function addScript(examKey, studentUsn, marks) {
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

    // Student 001: Missing 501_I2
    await addScript('501_I1', '4PM23TST001', 44);
    await addScript('501_EX', '4PM23TST001', 90);
    await addScript('502_I1', '4PM23TST001', 45);
    await addScript('502_I2', '4PM23TST001', 47);
    await addScript('502_EX', '4PM23TST001', 90);
    await addScript('503_I1', '4PM23TST001', 48);
    await addScript('503_I2', '4PM23TST001', 46);
    await addScript('503_EX', '4PM23TST001', 94);

    // Student 002: Fully complete
    await addScript('501_I1', '4PM23TST002', 40);
    await addScript('501_I2', '4PM23TST002', 40);
    await addScript('501_EX', '4PM23TST002', 80);
    await addScript('502_I1', '4PM23TST002', 35);
    await addScript('502_I2', '4PM23TST002', 35);
    await addScript('502_EX', '4PM23TST002', 70);
    await addScript('503_I1', '4PM23TST002', 40);
    await addScript('503_I2', '4PM23TST002', 40);
    await addScript('503_EX', '4PM23TST002', 80);

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, { username: 'EXAMCELL1', password: 'ExamCell@123' });
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    await axios.post(`${BASE_URL}/results/compute`, { semester: 5, academicYear: '2099-2100', department: dept }, { headers: authHeaders });
    const sem5Docs = await Result.find({ semester: 5, academicYear: '2099-2100' });
    sem5Docs.forEach(r => tracked.results.push(r._id));
    console.log(`Computed Semester 5 for ${sem5Docs.length} students.`);

    // Puppeteer browser screenshot
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to login...');
    await page.goto(`${CLIENT_URL}/login`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input[name="username"]', { timeout: 8000 });
    await page.type('input[name="username"]', 'EXAMCELL1');
    await page.type('input[name="password"]', 'ExamCell@123');
    await page.click('button[type="submit"]');

    // Wait for SPA client-side route transition to dashboard
    await page.waitForFunction(() => window.location.pathname.includes('dashboard'), { timeout: 10000 });
    console.log('Logged in successfully. Navigating to Publish Results...');

    await page.goto(`${CLIENT_URL}/examcell/publish-results`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('select', { timeout: 15000 });

    // Select Semester 5
    await page.select('select', '5');

    // Type Academic Year 2099-2100
    const textInput = await page.$('input[placeholder="Academic Year"]');
    if (textInput) {
      await textInput.click({ clickCount: 3 });
      await textInput.type('2099-2100');
    }

    // Click Refilter button
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.innerText, b);
      if (text.includes('Refilter')) {
        await b.click();
        break;
      }
    }

    // Wait for table of results to appear
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const shotPath = path.join(SCREENSHOT_DIR, '01_examcell_publish_results.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('✓ Successfully saved 01_examcell_publish_results.png (size:', fs.statSync(shotPath).size, 'bytes)');

    await browser.close();
    browser = null;

  } catch (err) {
    console.error('Error in screenshot capture:', err.message);
  } finally {
    if (browser) await browser.close();

    console.log('\n--- Cleaning up temporary screenshot test records strictly by _id ---');
    const notifs = await Notification.find({ recipientId: { $in: tracked.users } }, '_id');
    notifs.forEach(n => tracked.notifications.push(n._id));

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
    console.log('Final Database Counts:', finalCounts);
    const match = JSON.stringify(baseline) === JSON.stringify(finalCounts);
    console.log('Database Baseline & Final Counts Match:', match ? 'YES (100% CLEAN)' : 'NO');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
