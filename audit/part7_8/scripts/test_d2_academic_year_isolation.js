/**
 * Test D-2: Academic Year Isolation Test
 * Verifies that computing and publishing results for one academic year
 * does NOT touch, compute, or publish scripts/results from another academic year
 * in the same semester.
 */
const mongoose = require('../../../server/node_modules/mongoose');
const axios = require('../../../server/node_modules/axios');
const Student = require('../../../server/models/Student');
const Subject = require('../../../server/models/Subject');
const Exam = require('../../../server/models/Exam');
const AnswerScript = require('../../../server/models/AnswerScript');
const Result = require('../../../server/models/Result');
const User = require('../../../server/models/User');

const SERVER_BASE = 'http://localhost:5000/api/v1';
const MONGO_URI = 'mongodb://localhost:27017/examdb';

const createdIds = {
  users: [],
  students: [],
  subjects: [],
  exams: [],
  scripts: [],
  results: []
};

async function run() {
  console.log('====================================================');
  console.log('   TEST D-2: ACADEMIC YEAR ISOLATION VERIFICATION');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);

  // Login as Exam Cell
  const ecLogin = await axios.post(`${SERVER_BASE}/auth/login`, {
    username: 'EXAMCELL1',
    password: 'ExamCell@123'
  });
  const ecToken = ecLogin.data.token || ecLogin.data.data?.token;
  const ecHeaders = { Authorization: `Bearer ${ecToken}` };

  const AY_1 = '2097-2098';
  const AY_2 = '2098-2099';
  const SEM = 8;

  console.log(`Setting up test data for Semester ${SEM} across AY 1 (${AY_1}) and AY 2 (${AY_2})...`);

  // Pre-cleanup in case of earlier aborted runs
  const oldStudents = await Student.find({ usn: { $in: ['4PM23TSTAY1', '4PM23TSTAY2'] } });
  if (oldStudents.length > 0) {
    const sIds = oldStudents.map(s => s._id);
    await Result.deleteMany({ studentId: { $in: sIds } });
    await AnswerScript.deleteMany({ studentId: { $in: sIds } });
    await Student.deleteMany({ _id: { $in: sIds } });
  }
  const oldSubj = await Subject.find({ subjectCode: 'TST_AY_SUB' });
  if (oldSubj.length > 0) {
    const subIds = oldSubj.map(s => s._id);
    await Exam.deleteMany({ subjectId: { $in: subIds } });
    await Subject.deleteMany({ _id: { $in: subIds } });
  }

  // 1. Create a test subject
  const subj = await Subject.create({
    subjectCode: 'TST_AY_SUB',
    subjectName: 'Academic Year Isolation Subject',
    department: 'Computer Science and Engineering',
    semester: SEM,
    credits: 4,
    subjectType: 'theory'
  });
  createdIds.subjects.push(subj._id);

  // 2. Create 2 test students
  const stu1 = await Student.create({
    usn: '4PM23TSTAY1',
    name: 'AY1 Student',
    department: 'Computer Science and Engineering',
    semester: SEM,
    email: 'tstay1@test.com'
  });
  createdIds.students.push(stu1._id);

  const stu2 = await Student.create({
    usn: '4PM23TSTAY2',
    name: 'AY2 Student',
    department: 'Computer Science and Engineering',
    semester: SEM,
    email: 'tstay2@test.com'
  });
  createdIds.students.push(stu2._id);

  // 3. Create Exams for AY_1 (internal1, internal2, external)
  const exam1_i1 = await Exam.create({
    subjectId: subj._id,
    examDate: new Date('2097-10-01'),
    startTime: '09:00',
    endTime: '10:30',
    semester: SEM,
    academicYear: AY_1,
    examType: 'internal1',
    status: 'completed'
  });
  createdIds.exams.push(exam1_i1._id);

  const exam1_i2 = await Exam.create({
    subjectId: subj._id,
    examDate: new Date('2097-11-01'),
    startTime: '09:00',
    endTime: '10:30',
    semester: SEM,
    academicYear: AY_1,
    examType: 'internal2',
    status: 'completed'
  });
  createdIds.exams.push(exam1_i2._id);

  const exam1_ext = await Exam.create({
    subjectId: subj._id,
    examDate: new Date('2097-12-01'),
    startTime: '09:00',
    endTime: '12:00',
    semester: SEM,
    academicYear: AY_1,
    examType: 'external',
    status: 'completed'
  });
  createdIds.exams.push(exam1_ext._id);

  // 4. Create Exams for AY_2 (internal1, internal2, external)
  const exam2_i1 = await Exam.create({
    subjectId: subj._id,
    examDate: new Date('2098-10-01'),
    startTime: '09:00',
    endTime: '10:30',
    semester: SEM,
    academicYear: AY_2,
    examType: 'internal1',
    status: 'completed'
  });
  createdIds.exams.push(exam2_i1._id);

  const exam2_i2 = await Exam.create({
    subjectId: subj._id,
    examDate: new Date('2098-11-01'),
    startTime: '09:00',
    endTime: '10:30',
    semester: SEM,
    academicYear: AY_2,
    examType: 'internal2',
    status: 'completed'
  });
  createdIds.exams.push(exam2_i2._id);

  const exam2_ext = await Exam.create({
    subjectId: subj._id,
    examDate: new Date('2098-12-01'),
    startTime: '09:00',
    endTime: '12:00',
    semester: SEM,
    academicYear: AY_2,
    examType: 'external',
    status: 'completed'
  });
  createdIds.exams.push(exam2_ext._id);

  // 5. Create scripts for Student 1 in AY_1 (40, 40, 80)
  const s1_i1 = await AnswerScript.create({
    studentId: stu1._id,
    examId: exam1_i1._id,
    subjectId: subj._id,
    status: 'evaluated',
    marksObtained: 40,
    maxMarks: 50
  });
  createdIds.scripts.push(s1_i1._id);

  const s1_i2 = await AnswerScript.create({
    studentId: stu1._id,
    examId: exam1_i2._id,
    subjectId: subj._id,
    status: 'evaluated',
    marksObtained: 40,
    maxMarks: 50
  });
  createdIds.scripts.push(s1_i2._id);

  const s1_ext = await AnswerScript.create({
    studentId: stu1._id,
    examId: exam1_ext._id,
    subjectId: subj._id,
    status: 'evaluated',
    marksObtained: 80,
    maxMarks: 100
  });
  createdIds.scripts.push(s1_ext._id);

  // 6. Create scripts for Student 2 in AY_2 (30, 30, 60)
  const s2_i1 = await AnswerScript.create({
    studentId: stu2._id,
    examId: exam2_i1._id,
    subjectId: subj._id,
    status: 'evaluated',
    marksObtained: 30,
    maxMarks: 50
  });
  createdIds.scripts.push(s2_i1._id);

  const s2_i2 = await AnswerScript.create({
    studentId: stu2._id,
    examId: exam2_i2._id,
    subjectId: subj._id,
    status: 'evaluated',
    marksObtained: 30,
    maxMarks: 50
  });
  createdIds.scripts.push(s2_i2._id);

  const s2_ext = await AnswerScript.create({
    studentId: stu2._id,
    examId: exam2_ext._id,
    subjectId: subj._id,
    status: 'evaluated',
    marksObtained: 60,
    maxMarks: 100
  });
  createdIds.scripts.push(s2_ext._id);

  console.log('Test data created. Now running compute test for AY 1...');

  // TEST STEP 1: Compute AY 1 only
  const compAY1 = await axios.post(`${SERVER_BASE}/results/compute`, {
    semester: SEM,
    academicYear: AY_1
  }, { headers: ecHeaders });

  console.log(`Compute AY 1 response status: ${compAY1.status}, data length: ${compAY1.data.data?.length}`);

  // Verify: Student 1 has result for AY 1, Student 2 has NO result
  const resStu1AY1 = await Result.findOne({ studentId: stu1._id, academicYear: AY_1 });
  const resStu2AY1 = await Result.findOne({ studentId: stu2._id, academicYear: AY_1 });
  const resStu2AY2 = await Result.findOne({ studentId: stu2._id, academicYear: AY_2 });

  if (resStu1AY1) createdIds.results.push(resStu1AY1._id);

  const test1Pass = (resStu1AY1 !== null) && (resStu2AY1 === null) && (resStu2AY2 === null);
  console.log(`[${test1Pass ? 'PASS' : 'FAIL'}] D2-COMPUTE-ISOLATION: Computing ${AY_1} computed only Student 1 (Student 2 touched: ${resStu2AY1 !== null || resStu2AY2 !== null})`);

  // TEST STEP 2: Publish AY 1 only
  const pubAY1 = await axios.post(`${SERVER_BASE}/results/publish`, {
    semester: SEM,
    academicYear: AY_1
  }, { headers: ecHeaders });

  const res1AfterPub = await Result.findById(resStu1AY1._id);
  const test2Pass = res1AfterPub.isPublished === true;
  console.log(`[${test2Pass ? 'PASS' : 'FAIL'}] D2-PUBLISH-RESULT-ISOLATION: AY 1 Result published = ${test2Pass}`);

  // TEST STEP 3: Publish AnswerScripts for AY 1
  const pubScriptAY1 = await axios.post(`${SERVER_BASE}/examcell/answer-scripts/publish`, {
    semester: SEM,
    academicYear: AY_1
  }, { headers: ecHeaders });

  const s1Fresh = await AnswerScript.findById(s1_ext._id);
  const s2Fresh = await AnswerScript.findById(s2_ext._id);

  const test3Pass = (s1Fresh.status === 'published') && (s2Fresh.status === 'evaluated');
  console.log(`[${test3Pass ? 'PASS' : 'FAIL'}] D2-PUBLISH-SCRIPT-ISOLATION: AY 1 scripts published (${s1Fresh.status}), AY 2 scripts untouched (${s2Fresh.status})`);

  // TEST STEP 4: Now compute AY 2
  const compAY2 = await axios.post(`${SERVER_BASE}/results/compute`, {
    semester: SEM,
    academicYear: AY_2
  }, { headers: ecHeaders });

  const resStu2AfterComp = await Result.findOne({ studentId: stu2._id, academicYear: AY_2 });
  if (resStu2AfterComp) createdIds.results.push(resStu2AfterComp._id);

  const resStu1AfterComp2 = await Result.findById(resStu1AY1._id);
  const test4Pass = (resStu2AfterComp !== null) && (resStu1AfterComp2.academicYear === AY_1) && (resStu1AfterComp2.isPublished === true);
  console.log(`[${test4Pass ? 'PASS' : 'FAIL'}] D2-CROSS-YEAR-INTEGRITY: Computing AY 2 produced result for Student 2 and left AY 1 Student 1 result intact`);

  // CLEANUP strictly by _id
  console.log('\nCleaning up created records strictly by _id...');
  await Result.deleteMany({ _id: { $in: createdIds.results } });
  await AnswerScript.deleteMany({ _id: { $in: createdIds.scripts } });
  await Exam.deleteMany({ _id: { $in: createdIds.exams } });
  await Student.deleteMany({ _id: { $in: createdIds.students } });
  await Subject.deleteMany({ _id: { $in: createdIds.subjects } });
  console.log('Cleanup completed.');

  const allPassed = test1Pass && test2Pass && test3Pass && test4Pass;
  console.log(`\n====================================================`);
  console.log(`   D-2 TEST SUMMARY: ${allPassed ? 'ALL 4 TESTS PASSED' : 'TESTS FAILED'}`);
  console.log(`====================================================`);

  await mongoose.disconnect();
  process.exit(allPassed ? 0 : 1);
}

run().catch(async (err) => {
  console.error('D-2 Test failed with exception:', err.response?.data || err);
  // Ensure cleanup on failure
  try {
    await Result.deleteMany({ _id: { $in: createdIds.results } });
    await AnswerScript.deleteMany({ _id: { $in: createdIds.scripts } });
    await Exam.deleteMany({ _id: { $in: createdIds.exams } });
    await Student.deleteMany({ _id: { $in: createdIds.students } });
    await Subject.deleteMany({ _id: { $in: createdIds.subjects } });
  } catch (e) {}
  await mongoose.disconnect();
  process.exit(1);
});
