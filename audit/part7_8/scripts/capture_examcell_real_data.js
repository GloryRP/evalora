/**
 * capture_examcell_real_data.js
 * 
 * Implements Item 3:
 * 1. Print document counts before.
 * 2. Seed test records (TST USNs, AY 2099-2100) with one incomplete student.
 * 3. Save IDs to created_records.json.
 * 4. Compute results.
 * 5. Keep data in place while Puppeteer captures 4 screenshots:
 *    - Compute Results
 *    - Publish Results with the blocked message
 *    - Publish Complete Results Only button
 *    - Results View with an incomplete subject
 * 6. Inspect pages for NaN, undefined, blank areas, console errors.
 * 7. Clean up strictly by _id from created_records.json.
 * 8. Print document counts after and assert exact parity.
 */

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
const FRONTEND_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const CREATED_RECORDS_PATH = path.join(__dirname, '../created_records.json');

const AY = '2099-2100';
const SEM = 5;

const tracked = {
  users: [],
  students: [],
  faculties: [],
  subjects: [],
  exams: [],
  scripts: [],
  results: [],
  notifications: []
};

async function getDbCounts() {
  return {
    users: await User.countDocuments(),
    students: await Student.countDocuments(),
    faculties: await Faculty.countDocuments(),
    subjects: await Subject.countDocuments(),
    scripts: await AnswerScript.countDocuments(),
    results: await Result.countDocuments(),
    notifications: await Notification.countDocuments()
  };
}

async function loginInBrowser(page, username, password) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('input', { timeout: 10000 });
  const inputs = await page.$$('input');
  await inputs[0].click({ clickCount: 3 });
  await inputs[0].type(username);
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].type(password);
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));
}

function inspectPage(html, consoleErrors) {
  const hasNaN = />\s*NaN\s*</.test(html) || /\bNaN\b/.test(html.replace(/<!--[\s\S]*?-->/g, ''));
  const hasUndefined = />\s*undefined\s*</.test(html);
  const isBlank = html.length < 500;
  return {
    hasNaN,
    hasUndefined,
    isBlank,
    consoleErrorsCount: consoleErrors.length,
    consoleErrors
  };
}

async function main() {
  console.log('====================================================');
  console.log('   EXAM CELL REAL DATA SCREENSHOT CAPTURE & AUDIT');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB:', mongoose.connection.name);

  // 1. Initial document counts
  const countsBefore = await getDbCounts();
  console.log('\n--- DOCUMENT COUNTS BEFORE SEEDING ---');
  console.table(countsBefore);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const faculty = await Faculty.findOne();
  if (!faculty) throw new Error('No faculty found in DB');

  try {
    // 2. Seed Test Records
    console.log('\nSeeding test data for AY 2099-2100, Semester 5...');

    // Students
    const studentDefs = [
      { usn: '4PM23TST001', name: 'Suman G (Complete)', email: 'tst001@evalora.ac.in' },
      { usn: '4PM23TST002', name: 'Rahul V (Incomplete)', email: 'tst002@evalora.ac.in' }
    ];

    const students = [];
    for (const def of studentDefs) {
      const pwHash = await bcrypt.hash('TestPass@123', 10);
      const u = await User.create({
        username: def.usn,
        passwordHash: pwHash,
        role: 'student',
        name: def.name,
        email: def.email,
        department: 'Computer Science and Engineering'
      });
      tracked.users.push(u._id);

      const s = await Student.create({
        usn: def.usn,
        name: def.name,
        email: def.email,
        semester: SEM,
        department: 'Computer Science and Engineering',
        phone: '9988776655'
      });
      tracked.students.push(s._id);
      students.push(s);
    }

    // Subjects
    const subjects = [];
    for (const def of [
      { subjectCode: 'TST501', subjectName: 'Cloud Computing & DevOps', credits: 4, semester: SEM, department: 'Computer Science and Engineering', subjectType: 'theory' },
      { subjectCode: 'TST502', subjectName: 'Automata Theory & Computability', credits: 3, semester: SEM, department: 'Computer Science and Engineering', subjectType: 'theory' }
    ]) {
      const sub = await Subject.create(def);
      tracked.subjects.push(sub._id);
      subjects.push(sub);
    }

    // Exams (with academicYear AY)
    const exams = [];
    for (const def of [
      { subjectId: subjects[0]._id, semester: SEM, academicYear: AY, examType: 'internal1', examDate: new Date('2099-10-01'), startTime: '09:00', endTime: '10:30', status: 'completed' },
      { subjectId: subjects[0]._id, semester: SEM, academicYear: AY, examType: 'internal2', examDate: new Date('2099-11-01'), startTime: '09:00', endTime: '10:30', status: 'completed' },
      { subjectId: subjects[0]._id, semester: SEM, academicYear: AY, examType: 'external',  examDate: new Date('2099-12-01'), startTime: '09:00', endTime: '12:00', status: 'completed' },
      { subjectId: subjects[1]._id, semester: SEM, academicYear: AY, examType: 'internal1', examDate: new Date('2099-10-02'), startTime: '09:00', endTime: '10:30', status: 'completed' },
      { subjectId: subjects[1]._id, semester: SEM, academicYear: AY, examType: 'internal2', examDate: new Date('2099-11-02'), startTime: '09:00', endTime: '10:30', status: 'completed' },
      { subjectId: subjects[1]._id, semester: SEM, academicYear: AY, examType: 'external',  examDate: new Date('2099-12-02'), startTime: '09:00', endTime: '12:00', status: 'completed' }
    ]) {
      const e = await Exam.create(def);
      tracked.exams.push(e._id);
      exams.push(e);
    }

    // Answer scripts:
    // Student 1 (4PM23TST001) has all 6 scripts evaluated (Complete)
    // Student 2 (4PM23TST002) has TST501 internal2 missing (Incomplete)
    const scriptDefs = [
      { student: students[0], exam: exams[0], marks: 45, max: 50 },  // TST501 int1
      { student: students[0], exam: exams[1], marks: 42, max: 50 },  // TST501 int2
      { student: students[0], exam: exams[2], marks: 88, max: 100 }, // TST501 ext
      { student: students[0], exam: exams[3], marks: 44, max: 50 },  // TST502 int1
      { student: students[0], exam: exams[4], marks: 46, max: 50 },  // TST502 int2
      { student: students[0], exam: exams[5], marks: 90, max: 100 }, // TST502 ext
      // Student 2 (Incomplete student)
      { student: students[1], exam: exams[0], marks: 38, max: 50 },  // TST501 int1
      // TST501 int2 is intentionally MISSING!
      { student: students[1], exam: exams[2], marks: 74, max: 100 }, // TST501 ext
      { student: students[1], exam: exams[3], marks: 35, max: 50 },  // TST502 int1
      { student: students[1], exam: exams[4], marks: 38, max: 50 },  // TST502 int2
      { student: students[1], exam: exams[5], marks: 70, max: 100 }, // TST502 ext
    ];

    for (const def of scriptDefs) {
      const sc = await AnswerScript.create({
        studentId: def.student._id,
        examId: def.exam._id,
        subjectId: def.exam.subjectId,
        status: 'evaluated',
        marksObtained: def.marks,
        maxMarks: def.max,
        evaluatorId: faculty._id
      });
      tracked.scripts.push(sc._id);
    }
    console.log(`Seeded: 2 students, 2 subjects, 6 exams, 11 answer scripts.`);

    // 3. Compute Results via API
    const ecLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'EXAMCELL1',
      password: 'ExamCell@123'
    });
    const ecToken = ecLogin.data.token || ecLogin.data.data?.token;
    const ecHeaders = { Authorization: `Bearer ${ecToken}` };

    console.log('\nComputing results for Semester 5, AY 2099-2100...');
    const compRes = await axios.post(`${BASE_URL}/results/compute`, {
      semester: SEM,
      academicYear: AY,
      department: 'Computer Science and Engineering'
    }, { headers: ecHeaders });

    console.log('Compute API Result:', compRes.data.message);
    const computedResults = await Result.find({ academicYear: AY, semester: SEM });
    computedResults.forEach(r => tracked.results.push(r._id));

    // Save current created records to disk
    fs.writeFileSync(CREATED_RECORDS_PATH, JSON.stringify(tracked, null, 2));
    console.log('Saved created record IDs to:', CREATED_RECORDS_PATH);

    // 4. Puppeteer Browser Automation & Screenshot Capture
    console.log('\nLaunching Puppeteer to capture real-data UI screenshots...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Login as EXAMCELL1
    console.log('Logging in as EXAMCELL1 in Puppeteer...');
    await loginInBrowser(page, 'EXAMCELL1', 'ExamCell@123');

    // ----------------------------------------------------
    // SCREENSHOT 1: Compute Results Page
    // ----------------------------------------------------
    console.log('\nNavigating to /examcell/compute-results...');
    await page.goto(`${FRONTEND_URL}/examcell/compute-results`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input', { timeout: 10000 });

    // Fill parameters
    const textInputs = await page.$$('input[type="text"]');
    if (textInputs.length > 0) {
      await textInputs[0].click({ clickCount: 3 });
      await textInputs[0].type(AY);
    }
    await page.select('select', String(SEM));
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    // Click "Run GPA Agent" button to trigger fresh execution and display the summary card
    const computeButtons = await page.$$('button');
    for (const btn of computeButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Run GPA Agent') || text.includes('Compute Results')) {
        await btn.click();
        break;
      }
    }
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3500)));

    const computeHtml = await page.content();
    const computeAudit = inspectPage(computeHtml, consoleErrors);
    console.log('[Audit] Compute Results Page:', {
      hasNaN: computeAudit.hasNaN,
      hasUndefined: computeAudit.hasUndefined,
      isBlank: computeAudit.isBlank,
      consoleErrorsCount: computeAudit.consoleErrorsCount
    });

    const path1 = path.join(SCREENSHOT_DIR, '01_examcell_compute_results.png');
    await page.screenshot({ path: path1, fullPage: true });
    console.log('✓ Captured Screenshot 1:', path1);

    // ----------------------------------------------------
    // SCREENSHOT 2: Publish Results with Blocked Message
    // ----------------------------------------------------
    console.log('\nNavigating to /examcell/publish-results...');
    await page.goto(`${FRONTEND_URL}/examcell/publish-results`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input', { timeout: 10000 });

    // Set filter to AY 2099-2100, Sem 5 and refilter
    const pubInputs = await page.$$('input[type="text"]');
    if (pubInputs.length > 0) {
      await pubInputs[0].click({ clickCount: 3 });
      await pubInputs[0].type(AY);
    }
    const pubSelects = await page.$$('select');
    if (pubSelects.length > 0) {
      await pubSelects[0].select(String(SEM));
    }

    // Click Refilter
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Refilter')) {
        await btn.click();
        break;
      }
    }
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2500)));

    // Now click "Publish All Results" button to trigger the blocked toast error
    const buttonsAfterFilter = await page.$$('button');
    for (const btn of buttonsAfterFilter) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Publish All Results')) {
        await btn.click();
        break;
      }
    }
    // Wait for the red toast alert to render
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1500)));

    const pubBlockedHtml = await page.content();
    const pubBlockedAudit = inspectPage(pubBlockedHtml, consoleErrors);
    console.log('[Audit] Publish Results Blocked Page:', {
      hasNaN: pubBlockedAudit.hasNaN,
      hasUndefined: pubBlockedAudit.hasUndefined,
      isBlank: pubBlockedAudit.isBlank,
      consoleErrorsCount: pubBlockedAudit.consoleErrorsCount
    });

    const path2 = path.join(SCREENSHOT_DIR, '02_examcell_publish_blocked.png');
    await page.screenshot({ path: path2, fullPage: true });
    console.log('✓ Captured Screenshot 2:', path2);

    // ----------------------------------------------------
    // SCREENSHOT 3: Publish Complete Results Only Button
    // ----------------------------------------------------
    console.log('\nFocusing on Publish Complete Results Only button...');
    // Scroll down to the action buttons bar at bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const path3 = path.join(SCREENSHOT_DIR, '03_examcell_publish_complete_only_button.png');
    await page.screenshot({ path: path3, fullPage: false });
    console.log('✓ Captured Screenshot 3:', path3);

    // ----------------------------------------------------
    // SCREENSHOT 4: Results View with Incomplete Subject
    // ----------------------------------------------------
    console.log('\nNavigating to /examcell/results to view incomplete subject breakdown...');
    await page.goto(`${FRONTEND_URL}/examcell/results`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('input', { timeout: 10000 });

    const resInputs = await page.$$('input[type="text"]');
    if (resInputs.length > 0) {
      await resInputs[0].click({ clickCount: 3 });
      await resInputs[0].type(AY);
    }
    const resSelects = await page.$$('select');
    if (resSelects.length > 0) {
      await resSelects[0].select(String(SEM));
    }
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2500)));

    // Find and click "View Marks" on the student with "Result incomplete" or 4PM23TST002
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if (row.innerText.includes('4PM23TST002') || row.innerText.includes('Incomplete')) {
          const btn = row.querySelector('button');
          if (btn) btn.click();
          break;
        }
      }
    });
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

    const resViewHtml = await page.content();
    const resViewAudit = inspectPage(resViewHtml, consoleErrors);
    console.log('[Audit] Results View Page with Incomplete Modal:', {
      hasNaN: resViewAudit.hasNaN,
      hasUndefined: resViewAudit.hasUndefined,
      isBlank: resViewAudit.isBlank,
      consoleErrorsCount: resViewAudit.consoleErrorsCount
    });

    const path4 = path.join(SCREENSHOT_DIR, '04_examcell_results_view_incomplete.png');
    await page.screenshot({ path: path4, fullPage: true });
    console.log('✓ Captured Screenshot 4:', path4);

    await browser.close();
    console.log('\nAll 4 screenshots successfully captured and saved.');

  } finally {
    // 5. Strict cleanup strictly by _id from created_records.json
    console.log('\n--- CLEANING UP STRICTLY BY _ID FROM created_records.json ---');
    let toClean = tracked;
    if (fs.existsSync(CREATED_RECORDS_PATH)) {
      try {
        toClean = JSON.parse(fs.readFileSync(CREATED_RECORDS_PATH, 'utf8'));
      } catch (e) {}
    }

    if (toClean.notifications?.length) {
      const res = await Notification.deleteMany({ _id: { $in: toClean.notifications } });
      console.log(`Deleted notifications: ${res.deletedCount}`);
    }
    if (toClean.results?.length) {
      const res = await Result.deleteMany({ _id: { $in: toClean.results } });
      console.log(`Deleted results: ${res.deletedCount}`);
    }
    if (toClean.scripts?.length) {
      const res = await AnswerScript.deleteMany({ _id: { $in: toClean.scripts } });
      console.log(`Deleted scripts: ${res.deletedCount}`);
    }
    if (toClean.exams?.length) {
      const res = await Exam.deleteMany({ _id: { $in: toClean.exams } });
      console.log(`Deleted exams: ${res.deletedCount}`);
    }
    if (toClean.subjects?.length) {
      const res = await Subject.deleteMany({ _id: { $in: toClean.subjects } });
      console.log(`Deleted subjects: ${res.deletedCount}`);
    }
    if (toClean.students?.length) {
      const res = await Student.deleteMany({ _id: { $in: toClean.students } });
      console.log(`Deleted students: ${res.deletedCount}`);
    }
    if (toClean.users?.length) {
      const res = await User.deleteMany({ _id: { $in: toClean.users } });
      console.log(`Deleted users: ${res.deletedCount}`);
    }

    // 6. Final Counts & Parity Assert
    const countsAfter = await getDbCounts();
    console.log('\n--- DOCUMENT COUNTS AFTER CLEANUP ---');
    console.table(countsAfter);

    console.log('\n--- COMPARISON & PARITY AUDIT ---');
    let allMatched = true;
    for (const key of Object.keys(countsBefore)) {
      const match = countsBefore[key] === countsAfter[key];
      console.log(`  ${key.padEnd(15)}: Before = ${countsBefore[key]}, After = ${countsAfter[key]} -> ${match ? 'MATCH (100% CLEAN)' : 'MISMATCH!'}`);
      if (!match) allMatched = false;
    }

    console.log(`\nOVERALL PARITY: ${allMatched ? 'PERFECT 100% PARITY RESTORED' : 'PARITY ERROR DETECTED'}`);
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
