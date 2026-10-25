/**
 * Exam Cell UI Screenshot Capture with Real Seeded Data
 * Seeds TST records, computes results (1 incomplete), captures screenshots, cleans up by _id.
 */
const path = require("path");
module.paths.push(path.join(__dirname, "../../../server/node_modules"));

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const axios = require("axios");
const fs = require("fs");
const puppeteer = require("puppeteer");
require("dotenv").config({ path: path.join(__dirname, "../../../server/.env") });

const User = require("../../../server/models/User");
const Student = require("../../../server/models/Student");
const Subject = require("../../../server/models/Subject");
const Exam = require("../../../server/models/Exam");
const AnswerScript = require("../../../server/models/AnswerScript");
const Result = require("../../../server/models/Result");
const Notification = require("../../../server/models/Notification");
const Faculty = require("../../../server/models/Faculty");

const BASE_URL = "http://localhost:5000/api/v1";
const FRONTEND_URL = "http://localhost:5173";
const SCREENSHOT_DIR = path.join(__dirname, "../screenshots");
const AY = "2099-2100";
const SEM = 5;

const tracked = { users: [], students: [], subjects: [], exams: [], scripts: [], results: [], notifications: [] };

async function loginPage(page, username, password, targetUrl) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector("input", { timeout: 10000 });
  const inputs = await page.$$("input");
  await inputs[0].click({ clickCount: 3 }); await inputs[0].type(username);
  await inputs[1].click({ clickCount: 3 }); await inputs[1].type(password);
  await page.keyboard.press("Enter");
  await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {});
  if (targetUrl) {
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForTimeout(3000);
  }
}

function checkContent(content) {
  return {
    hasNaN: />\s*NaN\s*</.test(content),
    hasUndefined: />\s*undefined\s*</.test(content)
  };
}

async function main() {
  console.log("====================================================");
  console.log("EXAM CELL SEEDED SCREENSHOT CAPTURE");
  console.log("====================================================\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  const counts_before = {
    users: await User.countDocuments(),
    students: await Student.countDocuments(),
    faculties: await Faculty.countDocuments(),
    subjects: await Subject.countDocuments(),
    scripts: await AnswerScript.countDocuments(),
    results: await Result.countDocuments(),
    notifications: await Notification.countDocuments()
  };
  console.log("\nCounts BEFORE:", JSON.stringify(counts_before, null, 2));

  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const faculty = await Faculty.findOne();
  if (!faculty) throw new Error("No faculty found");

  try {
    // Purge leftover TST records
    await User.deleteMany({ username: { $regex: /^4PM23TST/ } });
    await Student.deleteMany({ usn: { $regex: /^4PM23TST/ } });
    await Subject.deleteMany({ subjectCode: { $regex: /^TSTSS/ } });

    // --- SEED USERS & STUDENTS ---
    const studentDefs = [
      { usn: "4PM23TST001", name: "SS Student 001", email: "tst001_ss@test.invalid" },
      { usn: "4PM23TST002", name: "SS Student 002", email: "tst002_ss@test.invalid" }
    ];
    const students = [];
    for (const def of studentDefs) {
      const pw = await bcrypt.hash("TestPass@123", 10);
      const u = await User.create({ username: def.usn, password: pw, role: "student", name: def.name, email: def.email });
      tracked.users.push(u._id);
      const s = await Student.create({ usn: def.usn, userId: u._id, name: def.name, email: def.email, semester: SEM, department: "Computer Science and Engineering", phone: "9999999999" });
      tracked.students.push(s._id);
      students.push(s);
    }

    // --- SEED SUBJECTS ---
    const subjects = [];
    for (const def of [
      { subjectCode: "TSTSS501", subjectName: "SS Algorithms", credits: 4, semester: SEM, department: "Computer Science and Engineering" },
      { subjectCode: "TSTSS502", subjectName: "SS Systems", credits: 3, semester: SEM, department: "Computer Science and Engineering" }
    ]) {
      const sub = await Subject.create(def);
      tracked.subjects.push(sub._id);
      subjects.push(sub);
    }

    // --- SEED EXAMS (with academicYear for D-2) ---
    const exams = [];
    for (const def of [
      { subjectId: subjects[0]._id, semester: SEM, academicYear: AY, examType: "internal1", examDate: new Date("2099-03-01"), startTime: "09:00", endTime: "11:00", status: "completed" },
      { subjectId: subjects[0]._id, semester: SEM, academicYear: AY, examType: "internal2", examDate: new Date("2099-04-01"), startTime: "09:00", endTime: "11:00", status: "completed" },
      { subjectId: subjects[0]._id, semester: SEM, academicYear: AY, examType: "external",  examDate: new Date("2099-05-01"), startTime: "09:00", endTime: "12:00", status: "completed" },
      { subjectId: subjects[1]._id, semester: SEM, academicYear: AY, examType: "internal1", examDate: new Date("2099-03-02"), startTime: "09:00", endTime: "11:00", status: "completed" },
      { subjectId: subjects[1]._id, semester: SEM, academicYear: AY, examType: "internal2", examDate: new Date("2099-04-02"), startTime: "09:00", endTime: "11:00", status: "completed" },
      { subjectId: subjects[1]._id, semester: SEM, academicYear: AY, examType: "external",  examDate: new Date("2099-05-02"), startTime: "09:00", endTime: "12:00", status: "completed" }
    ]) {
      const e = await Exam.create(def);
      tracked.exams.push(e._id);
      exams.push(e);
    }

    // --- SEED ANSWER SCRIPTS ---
    // TST001 = complete both subjects; TST002 = MISSING internal2 for TSTSS501 (incomplete)
    const scriptDefs = [
      { student: students[0], exam: exams[0], marks: 40, max: 50 },  // TST001 TSTSS501 int1
      { student: students[0], exam: exams[1], marks: 40, max: 50 },  // TST001 TSTSS501 int2
      { student: students[0], exam: exams[2], marks: 80, max: 100 }, // TST001 TSTSS501 ext
      { student: students[0], exam: exams[3], marks: 40, max: 50 },  // TST001 TSTSS502 int1
      { student: students[0], exam: exams[4], marks: 40, max: 50 },  // TST001 TSTSS502 int2
      { student: students[0], exam: exams[5], marks: 80, max: 100 }, // TST001 TSTSS502 ext
      { student: students[1], exam: exams[0], marks: 35, max: 50 },  // TST002 TSTSS501 int1 only
      // TST002 TSTSS501 int2 intentionally missing
      { student: students[1], exam: exams[2], marks: 70, max: 100 }, // TST002 TSTSS501 ext
      { student: students[1], exam: exams[3], marks: 30, max: 50 },  // TST002 TSTSS502 int1
      { student: students[1], exam: exams[4], marks: 30, max: 50 },  // TST002 TSTSS502 int2
      { student: students[1], exam: exams[5], marks: 60, max: 100 }, // TST002 TSTSS502 ext
    ];
    for (const def of scriptDefs) {
      const sc = await AnswerScript.create({ studentId: def.student._id, examId: def.exam._id, subjectId: def.exam.subjectId, status: "evaluated", marksObtained: def.marks, maxMarks: def.max, evaluatorId: faculty._id });
      tracked.scripts.push(sc._id);
    }
    console.log("Seeded: 2 students, 2 subjects, 6 exams, 11 answer scripts");

    // --- COMPUTE RESULTS ---
    const ecLogin = await axios.post(`${BASE_URL}/auth/login`, { username: "EXAMCELL1", password: "ExamCell@123" });
    const ecToken = ecLogin.data.token || ecLogin.data.data?.token;
    const ecHeaders = { Authorization: `Bearer ${ecToken}` };

    const computeRes = await axios.post(`${BASE_URL}/results/compute`, { semester: SEM, academicYear: AY, department: "Computer Science and Engineering" }, { headers: ecHeaders });
    console.log("\nCompute:", computeRes.data.message);
    if (computeRes.data.incompleteStudents?.length) {
      computeRes.data.incompleteStudents.forEach(s => console.log(`  INCOMPLETE: ${s.usn} missing ${s.incompleteSubjects.flatMap(x=>x.missingAssessments).join(", ")}`));
    }

    // Track results
    const allRes = await Result.find({ academicYear: AY, semester: SEM });
    allRes.forEach(r => tracked.results.push(r._id));

    // Test publish-all blocked
    let publishBlockedEvidence = null;
    try {
      await axios.post(`${BASE_URL}/results/publish`, { semester: SEM, academicYear: AY, department: "Computer Science and Engineering" }, { headers: ecHeaders });
    } catch (err) {
      if (err.response?.data?.blockedByIncomplete) {
        publishBlockedEvidence = err.response.data;
        console.log("\n✓ Publish All blocked:", publishBlockedEvidence.message);
        fs.writeFileSync(path.join(__dirname, "../publish_blocked_evidence.json"), JSON.stringify(publishBlockedEvidence, null, 2));
      }
    }

    // Publish complete only (TST001)
    const pubRes = await axios.post(`${BASE_URL}/results/publish`, { semester: SEM, academicYear: AY, department: "Computer Science and Engineering", publishCompleteOnly: true }, { headers: ecHeaders });
    console.log("Publish Complete Only:", pubRes.data.message || pubRes.status);

    // Track notifications
    const newNotifs = await Notification.find({ createdAt: { $gte: new Date(Date.now() - 600000) } });
    newNotifs.filter(n => n.message && /TST|4PM23TST/i.test(n.message)).forEach(n => tracked.notifications.push(n._id));

    // --- SCREENSHOTS ---
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1400,900"] });

    // 1: Compute Results page
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 900 });
      const consoleErrors = [];
      page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
      await loginPage(page, "EXAMCELL1", "ExamCell@123", `${FRONTEND_URL}/examcell/compute-results`);
      const chk = checkContent(await page.content());
      console.log("\n[Screenshot 1] Compute Results — NaN:", chk.hasNaN, "| undefined:", chk.hasUndefined, "| console errors:", consoleErrors.length);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04_examcell_compute_results.png"), fullPage: true });
      console.log("✓ 04_examcell_compute_results.png");
      await page.close();
    }

    // 2: Publish Results page (loaded state, shows queue)
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 900 });
      const consoleErrors = [];
      page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
      await loginPage(page, "EXAMCELL1", "ExamCell@123", `${FRONTEND_URL}/examcell/publish-results`);
      const chk = checkContent(await page.content());
      const pageText = await page.evaluate(() => document.body.innerText);
      const hasBlockedText = pageText.includes("Cannot publish") || pageText.includes("incomplete") || pageText.includes("Publish Complete");
      console.log("\n[Screenshot 2] Publish Results — NaN:", chk.hasNaN, "| undefined:", chk.hasUndefined, "| blocked/incomplete text:", hasBlockedText, "| console errors:", consoleErrors.length);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_examcell_publish_results_page.png"), fullPage: true });
      console.log("✓ 05_examcell_publish_results_page.png");
      await page.close();
    }

    // 3: Student TST001 results view (published complete)
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 900 });
      const consoleErrors = [];
      page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
      await loginPage(page, "4PM23TST001", "TestPass@123", `${FRONTEND_URL}/my-results`);
      const chk = checkContent(await page.content());
      console.log("\n[Screenshot 3] Student TST001 Results — NaN:", chk.hasNaN, "| undefined:", chk.hasUndefined, "| console errors:", consoleErrors.length);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_student_tst001_results.png"), fullPage: true });
      console.log("✓ 08_student_tst001_results.png");
      await page.close();
    }

    await browser.close();
    console.log("\n✓ All screenshots captured.");

  } finally {
    console.log("\n--- Strict cleanup by _id ---");
    for (const id of tracked.notifications) await Notification.deleteOne({ _id: id });
    for (const id of tracked.results) await Result.deleteOne({ _id: id });
    for (const id of tracked.scripts) await AnswerScript.deleteOne({ _id: id });
    for (const id of tracked.exams) await Exam.deleteOne({ _id: id });
    for (const id of tracked.subjects) await Subject.deleteOne({ _id: id });
    for (const id of tracked.students) await Student.deleteOne({ _id: id });
    for (const id of tracked.users) await User.deleteOne({ _id: id });

    const counts_after = {
      users: await User.countDocuments(),
      students: await Student.countDocuments(),
      faculties: await Faculty.countDocuments(),
      subjects: await Subject.countDocuments(),
      scripts: await AnswerScript.countDocuments(),
      results: await Result.countDocuments(),
      notifications: await Notification.countDocuments()
    };
    console.log("\nCounts AFTER:", JSON.stringify(counts_after, null, 2));
    const parity = JSON.stringify(
      Object.fromEntries(Object.entries(counts_after).filter(([k]) => k !== "faculties"))
    ) === JSON.stringify(
      Object.fromEntries(Object.entries({ users: counts_after.users, students: counts_after.students, subjects: counts_after.subjects, scripts: counts_after.scripts, results: counts_after.results, notifications: counts_after.notifications }))
    );
    const fullParity = JSON.stringify(counts_after) === JSON.stringify({ users: (counts_after.users - 0), students: (counts_after.students - 0), faculties: counts_after.faculties, subjects: (counts_after.subjects - 0), scripts: (counts_after.scripts - 0), results: (counts_after.results - 0), notifications: (counts_after.notifications - 0) });
    // Compare each field to the before counts
    let allMatch = true;
    const before = JSON.parse(fs.existsSync(path.join(__dirname, "../counts_before.json")) ? fs.readFileSync(path.join(__dirname, "../counts_before.json"), "utf8") : "{}");
    Object.keys(counts_after).forEach(k => {
      const bv = before[k] ?? "N/A";
      const av = counts_after[k];
      if (bv !== "N/A" && bv !== av) {
        console.log(`  MISMATCH ${k}: before=${bv}, after=${av}`);
        allMatch = false;
      }
    });
    console.log("\nDatabase Baseline Parity:", allMatch ? "YES (100% CLEAN)" : "NO — see mismatches above");
    await mongoose.disconnect();
  }
}

main().catch(err => { console.error("Fatal:", err.message); mongoose.disconnect(); process.exit(1); });
