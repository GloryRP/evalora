/**
 * Clean Benchmark: Clear all benchmark/test data, seed exact dataset, run 5x, report reconciled table.
 * Usage: node audit/scripts/benchmark_clean_rerun.js
 */
const mongoose = require('../../server/node_modules/mongoose');
const axios = require('../../server/node_modules/axios');
const bcrypt = require('../../server/node_modules/bcrypt');

const SERVER_BASE = 'http://localhost:5000/api/v1';
const MONGO_URI = process.env.BENCH_MONGO_URI || 'mongodb://localhost:27017/examdb_bench';

const Student = require('../../server/models/Student');
const Subject = require('../../server/models/Subject');
const Hall = require('../../server/models/Hall');
const Faculty = require('../../server/models/Faculty');
const Department = require('../../server/models/Department');
const Exam = require('../../server/models/Exam');
const HallAllocation = require('../../server/models/HallAllocation');
const InvigilatorAssignment = require('../../server/models/InvigilatorAssignment');
const User = require('../../server/models/User');

async function run() {
  console.log('================================================================');
  console.log('   CLEAN BENCHMARK: RECONCILED NUMBERS');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log(`✓ Connected to MongoDB: ${MONGO_URI}`);
  console.log(`  Database name: ${mongoose.connection.db.databaseName}`);
  console.log(`  Host: ${mongoose.connection.host}:${mongoose.connection.port}\n`);

  // ═══════════════════════════════════════════════════════════
  // STEP 1: CLEAN ALL BENCHMARK AND LEFTOVER AUDIT DATA
  // ═══════════════════════════════════════════════════════════
  console.log('── STEP 1: Cleaning ALL benchmark/test/audit data ──');

  // Remove ALL students (we will seed exactly 400 benchmark students)
  const studDel = await Student.deleteMany({});
  const studUserDel = await User.deleteMany({ role: 'student' });

  // Remove ALL subjects (we will seed exactly 18 benchmark subjects)
  const subjDel = await Subject.deleteMany({});

  // Remove ALL halls (we will seed exactly 10 benchmark halls)
  const hallDel = await Hall.deleteMany({});

  // Remove ALL faculty & non-system user accounts (we will seed exactly 20 benchmark faculty)
  const facDel = await Faculty.deleteMany({});
  const facUserDel = await User.deleteMany({ 
    username: { $nin: ['ADMIN1', 'EXAMCELL1', 'HOD1', 'PRINCIPAL1'] },
    role: { $in: ['faculty', 'hod', 'student'] }
  });

  // Clean all exams, allocations, invigilation duties, scripts, results, agent runs
  const examDel = await Exam.deleteMany({});
  const allocDel = await HallAllocation.deleteMany({});
  const dutyDel = await InvigilatorAssignment.deleteMany({});
  await mongoose.connection.db.collection('agentruns').deleteMany({});
  
  console.log(`   Deleted: ${studDel.deletedCount} students, ${subjDel.deletedCount} subjects`);
  console.log(`   Deleted: ${hallDel.deletedCount} halls, ${facDel.deletedCount} faculty, ${facUserDel.deletedCount} users`);
  console.log(`   Deleted: ${examDel.deletedCount} exams, ${allocDel.deletedCount} allocations, ${dutyDel.deletedCount} duties`);

  // ═══════════════════════════════════════════════════════════
  // STEP 2: SEED THE BENCHMARK DATASET
  // ═══════════════════════════════════════════════════════════
  console.log('\n── STEP 2: Seeding benchmark dataset ──');
  
  // Verify departments exist
  const depts = await Department.find();
  const deptNames = depts.map(d => d.name || d.departmentName);
  console.log(`   Existing departments: ${deptNames.join(', ')}`);

  const deptList = [
    'Computer Science and Engineering',
    'Information Science and Engineering',
    'Electronics and Communication Engineering',
    'Mechanical Engineering'
  ];

  // 2a. Seed 18 Subjects (6 per semester)
  const subjectsData = [];
  const semConfigs = [
    { sem: 3, codes: ['CS301', 'CS302', 'CS303', 'IS301', 'EC301', 'ME301'] },
    { sem: 5, codes: ['CS501', 'CS502', 'CS503', 'IS501', 'EC501', 'ME501'] },
    { sem: 7, codes: ['CS701', 'CS702', 'CS703', 'IS701', 'EC701', 'ME701'] },
  ];
  for (const group of semConfigs) {
    for (const code of group.codes) {
      const dept = code.startsWith('CS') ? deptList[0] :
                   code.startsWith('IS') ? deptList[1] :
                   code.startsWith('EC') ? deptList[2] : deptList[3];
      subjectsData.push({
        subjectCode: `BENCH_${code}`,
        subjectName: `Benchmark ${code}`,
        department: dept,
        semester: group.sem,
        credits: 4,
        subjectType: 'theory',
        examConfig: { theoryInternals: 2, theoryExternal: true }
      });
    }
  }
  const createdSubjects = await Subject.insertMany(subjectsData);
  console.log(`   ✓ ${createdSubjects.length} subjects (Sem 3: 6, Sem 5: 6, Sem 7: 6)`);

  // 2b. Seed 10 Halls (4 of 60, 6 of 50 = raw 540, usable @70%: 378)
  const hallsData = [];
  for (let i = 1; i <= 10; i++) {
    hallsData.push({
      hallName: `BENCH_HALL_${i}`,
      building: i <= 5 ? 'Main Block' : 'Tech Block',
      floor: ((i - 1) % 3) + 1,
      capacity: i <= 4 ? 60 : 50,
      facilities: ['CCTV']
    });
  }
  const createdHalls = await Hall.insertMany(hallsData);
  const totalRaw = createdHalls.reduce((a, h) => a + h.capacity, 0);
  const totalUsable70 = createdHalls.reduce((a, h) => a + Math.floor(h.capacity * 0.7), 0);
  console.log(`   ✓ ${createdHalls.length} halls (raw capacity: ${totalRaw}, usable @70%: ${totalUsable70})`);

  // 2c. Seed 20 Faculty (4 HODs + 16 professors)
  await Faculty.deleteMany({ employeeId: /^BENCH_FAC_/ });
  await User.deleteMany({ username: /^BENCH_FAC_/ });
  const defaultHash = await bcrypt.hash('Faculty@123', 10);
  const facultyData = [];
  let fIdx = 1;
  for (const dept of deptList) {
    // 1 HOD
    facultyData.push({
      employeeId: `BENCH_FAC_${String(fIdx).padStart(3, '0')}`,
      name: `HOD ${dept.split(' ')[0]}`,
      department: dept,
      designation: 'HOD',
      email: `benchfac${fIdx}@pesitm.edu`,
      phone: `98800${String(fIdx).padStart(5, '0')}`
    });
    fIdx++;
    // 4 regular
    for (let j = 0; j < 4; j++) {
      facultyData.push({
        employeeId: `BENCH_FAC_${String(fIdx).padStart(3, '0')}`,
        name: `Dr. Faculty ${fIdx} (${dept.split(' ')[0]})`,
        department: dept,
        designation: j % 2 === 0 ? 'Associate Professor' : 'Assistant Professor',
        email: `benchfac${fIdx}@pesitm.edu`,
        phone: `98800${String(fIdx).padStart(5, '0')}`
      });
      fIdx++;
    }
  }
  const createdFaculty = await Faculty.insertMany(facultyData);
  for (const f of createdFaculty) {
    await User.create({
      username: f.employeeId,
      passwordHash: defaultHash,
      role: f.designation === 'HOD' ? 'hod' : 'faculty',
      name: f.name,
      department: f.department,
      email: f.email,
      isActive: true
    });
  }
  console.log(`   ✓ ${createdFaculty.length} faculty (4 HODs + 16 professors)`);

  // 2d. Seed 400 Students  
  await Student.deleteMany({ usn: /^4PM23BN/ });
  await User.deleteMany({ username: /^4PM23BN/ });
  const studentsData = [];
  const semDist = [
    { sem: 3, count: 150 },
    { sem: 5, count: 150 },
    { sem: 7, count: 100 }
  ];
  let sIdx = 1;
  for (const dist of semDist) {
    for (let i = 0; i < dist.count; i++) {
      const dept = deptList[i % deptList.length];
      const usn = `4PM23BN${String(sIdx).padStart(3, '0')}`;
      studentsData.push({
        usn,
        name: `Student ${sIdx}`,
        department: dept,
        semester: dist.sem,
        email: `${usn.toLowerCase()}@pesitm.edu`,
        phone: `99000${String(sIdx).padStart(5, '0')}`,
        batch: '2023-2027'
      });
      sIdx++;
    }
  }
  const createdStudents = await Student.insertMany(studentsData);
  console.log(`   ✓ ${createdStudents.length} students (Sem3: 150, Sem5: 150, Sem7: 100)`);

  // Show per-semester, per-department student distribution
  console.log('\n── Student Distribution by Semester & Department ──');
  for (const dist of semDist) {
    for (const dept of deptList) {
      const count = studentsData.filter(s => s.semester === dist.sem && s.department === dept).length;
      console.log(`   Sem ${dist.sem} / ${dept.split(' ')[0]}: ${count} students`);
    }
  }

  // Show subjects per semester and which departments take them
  console.log('\n── Subjects & Eligible Students per Exam ──');
  for (const group of semConfigs) {
    console.log(`   Semester ${group.sem}:`);
    for (const code of group.codes) {
      const dept = code.startsWith('CS') ? deptList[0] :
                   code.startsWith('IS') ? deptList[1] :
                   code.startsWith('EC') ? deptList[2] : deptList[3];
      const eligible = studentsData.filter(s => s.semester === group.sem && s.department === dept).length;
      console.log(`     BENCH_${code} (${dept.split(' ')[0]}): ${eligible} eligible students`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 3: RUN PIPELINE 5 TIMES (SEMESTER 3)
  // ═══════════════════════════════════════════════════════════
  console.log('\n── STEP 3: Running pipeline 5 times for Semester 3 ──');
  
  const ecLogin = await axios.post(`${SERVER_BASE}/auth/login`, { username: 'EXAMCELL1', password: 'ExamCell@123' });
  const ecToken = ecLogin.data.token || ecLogin.data.data?.token;
  const headers = { Authorization: `Bearer ${ecToken}` };

  const payload = {
    semester: 3,
    examCategory: 'internal1',
    component: 'theory',
    startDate: '2026-11-02',
    constraints: {
      hallFillPercent: 70,
      minGapBetweenExams: 1,
    }
  };

  const runs = [];
  for (let r = 1; r <= 5; r++) {
    // Clean previous run's exams for semester 3
    const prevExams = await Exam.find({ semester: 3, examType: 'internal1' });
    if (prevExams.length > 0) {
      const prevIds = prevExams.map(e => e._id);
      await HallAllocation.deleteMany({ examId: { $in: prevIds } });
      await InvigilatorAssignment.deleteMany({ examId: { $in: prevIds } });
      await Exam.deleteMany({ _id: { $in: prevIds } });
    }

    const t0 = Date.now();
    const res = await axios.post(`${SERVER_BASE}/examcell/agents/run-pipeline`, payload, { headers });
    const dur = Date.now() - t0;
    
    const data = res.data.data || res.data;
    runs.push({
      run: r,
      duration: dur,
      status: res.status,
      scheduledCount: data.scheduledCount || data.scheduled_count || 0,
      allocatedStudents: data.allocatedStudentsCount || data.allocated_students_count || 0,
    });
    console.log(`   Run ${r}: ${dur}ms | Status ${res.status} | Exams: ${runs[r-1].scheduledCount} | Allocated: ${runs[r-1].allocatedStudents}`);
  }

  const avgMs = Math.round(runs.reduce((a, r) => a + r.duration, 0) / runs.length);

  // ═══════════════════════════════════════════════════════════
  // STEP 4: VERIFY CONSTRAINTS (a-f) AND COLLECT DETAILED NUMBERS
  // ═══════════════════════════════════════════════════════════
  console.log('\n── STEP 4: Constraint verification & reconciled numbers ──');

  const sem3Exams = await Exam.find({ semester: 3, examType: 'internal1' }).populate('subjectId');
  const sem3Ids = sem3Exams.map(e => e._id);
  const allocations = await HallAllocation.find({ examId: { $in: sem3Ids } });
  const duties = await InvigilatorAssignment.find({ examId: { $in: sem3Ids } }).populate('facultyId hallId');

  console.log(`\n   Exams scheduled for Semester 3: ${sem3Exams.length}`);
  
  // Per-exam detail
  let totalSeatAllocations = 0;
  let totalEligible = 0;
  let totalUnseated = 0;
  const examDetails = [];
  for (const ex of sem3Exams) {
    const subjCode = ex.subjectId?.subjectCode || 'unknown';
    const dept = ex.subjectId?.department || 'unknown';
    const eligible = await Student.countDocuments({ semester: 3, department: dept });
    const seated = allocations.filter(a => a.examId.toString() === ex._id.toString()).length;
    const unseated = eligible - seated;
    totalSeatAllocations += seated;
    totalEligible += eligible;
    totalUnseated += Math.max(0, unseated);
    
    // Count halls used for this exam
    const hallsUsed = new Set(allocations.filter(a => a.examId.toString() === ex._id.toString()).map(a => a.hallId?.toString())).size;
    
    examDetails.push({ subjCode, dept: dept.split(' ')[0], eligible, seated, unseated, hallsUsed, date: ex.examDate });
  }

  console.log('\n┌─────────────────┬──────────────┬──────────┬────────┬──────────┬───────────┐');
  console.log('│ Subject         │ Department   │ Eligible │ Seated │ Unseated │ Halls Used│');
  console.log('├─────────────────┼──────────────┼──────────┼────────┼──────────┼───────────┤');
  for (const ed of examDetails) {
    const subj = ed.subjCode.padEnd(15);
    const dept = ed.dept.padEnd(12);
    console.log(`│ ${subj} │ ${dept} │ ${String(ed.eligible).padStart(8)} │ ${String(ed.seated).padStart(6)} │ ${String(ed.unseated).padStart(8)} │ ${String(ed.hallsUsed).padStart(9)} │`);
  }
  console.log('├─────────────────┼──────────────┼──────────┼────────┼──────────┼───────────┤');
  console.log(`│ TOTAL           │              │ ${String(totalEligible).padStart(8)} │ ${String(totalSeatAllocations).padStart(6)} │ ${String(totalUnseated).padStart(8)} │           │`);
  console.log('└─────────────────┴──────────────┴──────────┴────────┴──────────┴───────────┘');

  // Explain numbers
  console.log('\n── NUMBER RECONCILIATION ──');
  console.log(`   400 students SEEDED across 3 semesters`);
  console.log(`   150 students in Semester 3 (distributed across 4 departments)`);
  console.log(`   6 subjects in Semester 3, each belonging to ONE department`);
  console.log(`   Each subject exam seats ONLY students of that subject's department`);
  console.log(`   "Seated" is the SUM of per-exam seat allocations (one student may be seated in multiple exams)`);
  console.log(`   Total seat allocations: ${totalSeatAllocations} = sum of all per-exam seatings`);
  console.log(`   Unique students in Semester 3: 150 (each sits for exams of their department's subjects)`);
  console.log(`   Exams: 6 (one per subject, NOT per student)`);

  // Constraints
  console.log('\n── Constraint Checks ──');
  
  // a: no date collision
  const dates = sem3Exams.map(e => e.examDate?.toISOString?.().slice(0,10) || String(e.examDate));
  const uniqueDates = new Set(dates);
  console.log(`   [${uniqueDates.size === sem3Exams.length ? 'PASS' : 'FAIL'}] (a) Date collision: ${uniqueDates.size}/${sem3Exams.length} unique dates`);

  // b: hall capacity
  let bPass = true;
  for (const hall of createdHalls) {
    const usable = Math.floor(hall.capacity * 0.7);
    for (const exId of sem3Ids) {
      const cnt = allocations.filter(a => 
        a.hallId?.toString() === hall._id.toString() && 
        a.examId?.toString() === exId.toString()
      ).length;
      if (cnt > usable) { bPass = false; break; }
    }
  }
  console.log(`   [${bPass ? 'PASS' : 'FAIL'}] (b) Hall capacity: all within 70% fill limit`);

  // c: unique seating
  let cPass = true;
  for (const exId of sem3Ids) {
    const sids = allocations.filter(a => a.examId?.toString() === exId.toString()).map(a => a.studentId?.toString());
    if (new Set(sids).size !== sids.length) { cPass = false; break; }
  }
  console.log(`   [${cPass ? 'PASS' : 'FAIL'}] (c) Unique seating: no duplicate seats`);

  // d: no HODs assigned
  const hodDuties = duties.filter(d => d.facultyId?.designation === 'HOD');
  console.log(`   [${hodDuties.length === 0 ? 'PASS' : 'FAIL'}] (d) Invigilator exclusion: ${hodDuties.length} HODs assigned`);

  // e: no double booking
  let ePass = true;
  const slotMap = {};
  for (const d of duties) {
    const key = `${d.facultyId?._id}_${d.examDate}_${d.startTime}`;
    if (slotMap[key]) { ePass = false; break; }
    slotMap[key] = true;
  }
  console.log(`   [${ePass ? 'PASS' : 'FAIL'}] (e) No double booking: zero overlapping duties`);

  // f: full seating
  console.log(`   [${totalUnseated === 0 ? 'PASS' : 'FAIL'}] (f) Full seating: ${totalUnseated} unseated students`);

  // ═══════════════════════════════════════════════════════════
  // FINAL TABLE
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   FINAL BENCHMARK TABLE');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`   Subjects per Semester 3:   6`);
  console.log(`   Subjects per Semester 5:   6`);
  console.log(`   Subjects per Semester 7:   6`);
  console.log(`   Exams scheduled (Sem 3):   ${sem3Exams.length}`);
  console.log(`   Students per exam (avg):   ${Math.round(totalEligible / sem3Exams.length)}`);
  console.log(`   Total seat allocations:    ${totalSeatAllocations}`);
  console.log(`   Unique halls used:         ${new Set(allocations.map(a => a.hallId?.toString())).size}`);
  console.log(`   Unseated students:         ${totalUnseated}`);
  console.log('');
  console.log('┌──────┬──────────────┬────────┐');
  console.log('│ Run  │ Duration(ms) │ Status │');
  console.log('├──────┼──────────────┼────────┤');
  for (const r of runs) {
    console.log(`│  ${r.run}   │ ${String(r.duration).padStart(12)} │  ${r.status}  │`);
  }
  console.log('├──────┼──────────────┼────────┤');
  console.log(`│ AVG  │ ${String(avgMs).padStart(12)} │  200   │`);
  console.log('└──────┴──────────────┴────────┘');

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   BENCHMARK COMPLETE');
  console.log('══════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Benchmark error:', err.response?.data || err);
  process.exit(1);
});
