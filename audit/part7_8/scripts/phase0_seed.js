const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });

const User = require('../../../server/models/User');
const Student = require('../../../server/models/Student');
const Subject = require('../../../server/models/Subject');
const Exam = require('../../../server/models/Exam');
const AnswerScript = require('../../../server/models/AnswerScript');
const Result = require('../../../server/models/Result');
const Notification = require('../../../server/models/Notification');

const recordsFile = path.join(__dirname, '../created_records.json');

function trackRecord(type, id) {
  const data = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  if (!data[type]) data[type] = [];
  data[type].push(id.toString());
  fs.writeFileSync(recordsFile, JSON.stringify(data, null, 2));
}

async function runSeed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to database:', mongoose.connection.name);

  // 1. Safety purge of any preexisting TST records
  console.log('Checking for preexisting TST records...');
  const preStudents = await Student.find({ usn: /^4PM23TST/ });
  for (const st of preStudents) {
    await Student.findByIdAndDelete(st._id);
    await User.findOneAndDelete({ username: st.usn });
  }
  const preSubjects = await Subject.find({ subjectCode: /^TST/ });
  for (const sub of preSubjects) {
    await Exam.deleteMany({ subjectId: sub._id });
    await Subject.findByIdAndDelete(sub._id);
  }
  await AnswerScript.deleteMany({ academicYear: '2099-2100' });
  await Result.deleteMany({ academicYear: '2099-2100' });
  console.log('Pre-check purge complete.');

  // Password hash for students
  const passwordHash = await bcrypt.hash('Student@123', 10);
  const department = 'Test Engineering';

  // 2. Create 5 Students
  const studentData = [
    { usn: '4PM23TST001', name: 'Test Student 001', email: 'chikalguddjyoti+t1@gmail.com', sem: 5 },
    { usn: '4PM23TST002', name: 'Test Student 002', email: 'chikalguddjyoti+t2@gmail.com', sem: 5 },
    { usn: '4PM23TST003', name: 'Test Student 003', email: 'chikalguddjyoti+t3@gmail.com', sem: 5 },
    { usn: '4PM23TST004', name: 'Test Student 004', email: 'chikalguddjyoti+t4@gmail.com', sem: 5 },
    { usn: '4PM23TST005', name: 'Test Student 005', email: 'chikalguddjyoti+t5@gmail.com', sem: 5 }
  ];

  const studentDocs = {};

  for (const s of studentData) {
    const user = await User.create({
      username: s.usn,
      passwordHash,
      role: 'student',
      name: s.name,
      department,
      email: s.email,
      phone: '9999999999',
      isActive: true,
      isFirstLogin: false
    });
    trackRecord('users', user._id);

    const student = await Student.create({
      usn: s.usn,
      name: s.name,
      department,
      semester: s.sem,
      email: s.email,
      phone: '9999999999',
      batch: '2023-2027'
    });
    trackRecord('students', student._id);
    studentDocs[s.usn] = student;
    console.log(`Created student ${s.usn} (${user._id})`);
  }

  // 3. Create Subjects
  // Semester 4: TST401 (4 credits)
  const tst401 = await Subject.create({
    subjectCode: 'TST401',
    subjectName: 'Engineering Mathematics IV',
    department,
    semester: 4,
    credits: 4,
    subjectType: 'theory'
  });
  trackRecord('subjects', tst401._id);

  // Semester 5: TST501 (4 credits), TST502 (3 credits), TST503 (2 credits)
  const tst501 = await Subject.create({
    subjectCode: 'TST501',
    subjectName: 'Software Engineering',
    department,
    semester: 5,
    credits: 4,
    subjectType: 'theory'
  });
  trackRecord('subjects', tst501._id);

  const tst502 = await Subject.create({
    subjectCode: 'TST502',
    subjectName: 'Computer Networks',
    department,
    semester: 5,
    credits: 3,
    subjectType: 'theory'
  });
  trackRecord('subjects', tst502._id);

  const tst503 = await Subject.create({
    subjectCode: 'TST503',
    subjectName: 'Database Management Systems',
    department,
    semester: 5,
    credits: 2,
    subjectType: 'theory'
  });
  trackRecord('subjects', tst503._id);

  console.log('Created subjects: TST401, TST501, TST502, TST503');

  // 4. Create Exams for each subject: internal1, internal2, external
  const examMap = {};
  const allSubjects = [
    { doc: tst401, sem: 4 },
    { doc: tst501, sem: 5 },
    { doc: tst502, sem: 5 },
    { doc: tst503, sem: 5 }
  ];

  for (const { doc, sem } of allSubjects) {
    examMap[doc.subjectCode] = {};
    for (const examType of ['internal1', 'internal2', 'external']) {
      const exam = await Exam.create({
        subjectId: doc._id,
        examDate: new Date('2099-11-15T09:30:00Z'),
        startTime: '09:30',
        endTime: examType === 'external' ? '12:30' : '11:00',
        semester: sem,
        examType,
        componentType: 'theory',
        status: 'completed'
      });
      // Track exam IDs
      trackRecord('exams', exam._id);
      examMap[doc.subjectCode][examType] = exam;
    }
  }

  // Save exam map for subsequent scripts
  fs.writeFileSync(path.join(__dirname, '../exam_map.json'), JSON.stringify(examMap, null, 2));
  console.log('Created all Exams and saved exam_map.json');

  await mongoose.disconnect();
  console.log('Phase 0 seed completed successfully!');
}

runSeed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
