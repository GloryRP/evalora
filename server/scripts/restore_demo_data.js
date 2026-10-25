/**
 * Restore Demo Data for Exam System
 * Restores a clean, realistic set of demo data to 'examdb':
 * - 6 Demo logins: ADMIN1, EXAMCELL1, FACULTY1, STUDENT1, HOD1, PRINCIPAL1
 * - 12 Faculty members (4 HODs + 8 professors) across departments
 * - 6 Subjects (Semester 3 & 5)
 * - 6 Examination Halls (capacities 40-60)
 * - 120 Students (~30 students per department across CSE, ISE, ECE, MECH)
 * - Institution config & VTU grading scheme
 *
 * Usage: node server/scripts/restore_demo_data.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/examdb';

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Hall = require('../models/Hall');
const InstitutionConfig = require('../models/InstitutionConfig');
const GradingScheme = require('../models/GradingScheme');
const Exam = require('../models/Exam');
const HallAllocation = require('../models/HallAllocation');
const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const AnswerScript = require('../models/AnswerScript');
const Result = require('../models/Result');

async function restore() {
  console.log('====================================================');
  console.log('   RESTORE DEMO DATA: examdb');
  console.log('====================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log(`✓ Connected to ${MONGO_URI}`);

  // 1. Wipe test / benchmark collections cleanly
  console.log('1. Clearing existing data in examdb...');
  await User.deleteMany({});
  await Student.deleteMany({});
  await Faculty.deleteMany({});
  await Subject.deleteMany({});
  await Hall.deleteMany({});
  await Exam.deleteMany({});
  await HallAllocation.deleteMany({});
  await InvigilatorAssignment.deleteMany({});
  await AnswerScript.deleteMany({});
  await Result.deleteMany({});
  await mongoose.connection.db.collection('agentruns').deleteMany({});
  console.log('   ✓ Collections cleared');

  // 2. Ensure Departments exist
  console.log('\n2. Setting up departments...');
  const departmentsData = [
    { departmentCode: 'CSE', departmentName: 'Computer Science and Engineering', name: 'Computer Science and Engineering' },
    { departmentCode: 'ISE', departmentName: 'Information Science and Engineering', name: 'Information Science and Engineering' },
    { departmentCode: 'ECE', departmentName: 'Electronics and Communication Engineering', name: 'Electronics and Communication Engineering' },
    { departmentCode: 'ME', departmentName: 'Mechanical Engineering', name: 'Mechanical Engineering' },
    { departmentCode: 'CV', departmentName: 'Civil', name: 'Civil' },
    { departmentCode: 'CSDS', departmentName: 'Computer Science (Data Science)', name: 'Computer Science (Data Science)' }
  ];
  for (const d of departmentsData) {
    await Department.findOneAndUpdate(
      { departmentCode: d.departmentCode },
      d,
      { upsert: true, new: true }
    );
  }
  console.log(`   ✓ ${departmentsData.length} departments ensured`);

  // 3. Password hashes
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const examcellHash = await bcrypt.hash('ExamCell@123', 10);
  const facultyHash = await bcrypt.hash('Faculty@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);
  const hodHash = await bcrypt.hash('HOD@123', 10);
  const principalHash = await bcrypt.hash('Principal@123', 10);

  // 4. Core Demo Logins
  console.log('\n3. Creating core demo logins...');
  const coreLogins = [
    { username: 'ADMIN1', passwordHash: adminHash, role: 'admin', name: 'System Administrator', email: 'admin1@evalora.ac.in', department: 'Administration' },
    { username: 'EXAMCELL1', passwordHash: examcellHash, role: 'examcell', name: 'Exam Cell Officer', email: 'examcell1@evalora.ac.in', department: 'Examination Cell' },
    { username: 'FACULTY1', passwordHash: facultyHash, role: 'faculty', name: 'Dr. John Doe', email: 'faculty1@evalora.ac.in', department: 'Computer Science and Engineering' },
    { username: 'STUDENT1', passwordHash: studentHash, role: 'student', name: 'Jane Smith', email: 'student1@evalora.ac.in', department: 'Computer Science and Engineering' },
    { username: 'HOD1', passwordHash: hodHash, role: 'hod', name: 'Dr. HOD CSE', email: 'hod1@evalora.ac.in', department: 'Computer Science and Engineering' },
    { username: 'PRINCIPAL1', passwordHash: principalHash, role: 'principal', name: 'Dr. Principal', email: 'principal1@evalora.ac.in', department: 'Administration' },
  ];
  for (const u of coreLogins) {
    await User.create({ ...u, isActive: true });
  }
  console.log(`   ✓ ${coreLogins.length} core logins created`);

  // 5. 6 Demo Subjects (3 in Sem 3, 3 in Sem 5)
  console.log('\n4. Creating 6 demo subjects...');
  const subjectsData = [
    { subjectCode: 'CS301', subjectName: 'Data Structures and Algorithms', department: 'Computer Science and Engineering', semester: 3, credits: 4, subjectType: 'theory' },
    { subjectCode: 'IS301', subjectName: 'Object Oriented Programming with Java', department: 'Information Science and Engineering', semester: 3, credits: 4, subjectType: 'theory' },
    { subjectCode: 'EC301', subjectName: 'Digital Electronic Circuits', department: 'Electronics and Communication Engineering', semester: 3, credits: 4, subjectType: 'theory' },
    { subjectCode: 'CS501', subjectName: 'Database Management Systems', department: 'Computer Science and Engineering', semester: 5, credits: 4, subjectType: 'theory' },
    { subjectCode: 'CS502', subjectName: 'Operating Systems', department: 'Computer Science and Engineering', semester: 5, credits: 4, subjectType: 'theory' },
    { subjectCode: 'ME501', subjectName: 'Applied Thermodynamics', department: 'Mechanical Engineering', semester: 5, credits: 4, subjectType: 'theory' },
  ];
  const createdSubjects = await Subject.insertMany(subjectsData);
  console.log(`   ✓ ${createdSubjects.length} subjects created`);

  // 6. 12 Faculty (4 HODs + 8 professors across 4 departments)
  console.log('\n5. Creating 12 faculty profiles & logins...');
  const deptList = [
    'Computer Science and Engineering',
    'Information Science and Engineering',
    'Electronics and Communication Engineering',
    'Mechanical Engineering'
  ];
  const facultyData = [];
  let facCounter = 1;

  // Add FACULTY1 profile first
  facultyData.push({
    employeeId: 'FACULTY1',
    name: 'Dr. John Doe',
    department: 'Computer Science and Engineering',
    designation: 'Assistant Professor',
    email: 'faculty1@evalora.ac.in',
    phone: '9876543211',
    subjectsAssigned: [createdSubjects[0]._id, createdSubjects[3]._id]
  });

  for (const dept of deptList) {
    // HOD
    const hodId = `HOD_${dept.split(' ')[0].toUpperCase()}`;
    facultyData.push({
      employeeId: hodId,
      name: `Dr. HOD (${dept.split(' ')[0]})`,
      department: dept,
      designation: 'HOD',
      email: `${hodId.toLowerCase()}@pesitm.edu`,
      phone: `98800${String(facCounter).padStart(5, '0')}`
    });
    // Create HOD login
    await User.create({
      username: hodId,
      passwordHash: hodHash,
      role: 'hod',
      name: `Dr. HOD (${dept.split(' ')[0]})`,
      department: dept,
      email: `${hodId.toLowerCase()}@pesitm.edu`,
      isActive: true
    });
    facCounter++;

    // 2 Professors per department
    for (let p = 1; p <= 2; p++) {
      const empId = `FAC_${dept.split(' ')[0].toUpperCase()}_${p}`;
      facultyData.push({
        employeeId: empId,
        name: `Prof. ${dept.split(' ')[0]} ${p}`,
        department: dept,
        designation: p === 1 ? 'Associate Professor' : 'Assistant Professor',
        email: `${empId.toLowerCase()}@pesitm.edu`,
        phone: `98800${String(facCounter).padStart(5, '0')}`
      });
      await User.create({
        username: empId,
        passwordHash: facultyHash,
        role: 'faculty',
        name: `Prof. ${dept.split(' ')[0]} ${p}`,
        department: dept,
        email: `${empId.toLowerCase()}@pesitm.edu`,
        isActive: true
      });
      facCounter++;
    }
  }

  // Insert faculty profiles (skip any already at 12)
  const finalFaculty = facultyData.slice(0, 12);
  await Faculty.insertMany(finalFaculty);
  console.log(`   ✓ ${finalFaculty.length} faculty profiles & logins created`);

  // 7. 6 Examination Halls (capacities 40-60)
  console.log('\n6. Creating 6 examination halls...');
  const hallsData = [
    { hallName: 'Hall A', building: 'Main Block', floor: 1, capacity: 60, facilities: ['CCTV', 'Projector'] },
    { hallName: 'Hall B', building: 'Main Block', floor: 1, capacity: 60, facilities: ['CCTV'] },
    { hallName: 'Hall C', building: 'Main Block', floor: 2, capacity: 50, facilities: ['CCTV'] },
    { hallName: 'Hall D', building: 'Tech Block', floor: 1, capacity: 50, facilities: ['CCTV'] },
    { hallName: 'Lab 1',  building: 'IT Block',   floor: 1, capacity: 40, facilities: ['CCTV', 'Computers'] },
    { hallName: 'Lab 2',  building: 'IT Block',   floor: 2, capacity: 40, facilities: ['CCTV', 'Computers'] },
  ];
  const createdHalls = await Hall.insertMany(hallsData);
  const totalCapacity = createdHalls.reduce((a, h) => a + h.capacity, 0);
  console.log(`   ✓ ${createdHalls.length} halls created (Total Raw Capacity: ${totalCapacity}, Usable @ 70%: ${Math.floor(totalCapacity * 0.7)})`);

  // 8. 120 Students (~30 students per department)
  console.log('\n7. Creating 120 students (~30 per department)...');
  const studentsData = [];
  const deptCodes = {
    'Computer Science and Engineering': 'CS',
    'Information Science and Engineering': 'IS',
    'Electronics and Communication Engineering': 'EC',
    'Mechanical Engineering': 'ME'
  };

  // Add STUDENT1 profile
  studentsData.push({
    usn: 'STUDENT1',
    name: 'Jane Smith',
    department: 'Computer Science and Engineering',
    semester: 3,
    email: 'student1@evalora.ac.in',
    phone: '9876543210',
    batch: '2023-2027'
  });

  let totalStudentCount = 1;
  for (const dept of deptList) {
    const code = deptCodes[dept];
    for (let i = 1; i <= 30; i++) {
      const usn = `4PM23${code}${String(i).padStart(3, '0')}`;
      studentsData.push({
        usn,
        name: `Student ${code} ${i}`,
        department: dept,
        semester: i <= 15 ? 3 : 5, // half in sem 3, half in sem 5
        email: `${usn.toLowerCase()}@pesitm.edu`,
        phone: `99000${String(totalStudentCount).padStart(5, '0')}`,
        batch: '2023-2027'
      });
      totalStudentCount++;
    }
  }

  // Insert students
  await Student.insertMany(studentsData);
  // Create user logins for all students
  const studentUsers = studentsData.filter(s => s.usn !== 'STUDENT1').map(s => ({
    username: s.usn,
    passwordHash: studentHash,
    role: 'student',
    name: s.name,
    department: s.department,
    email: s.email,
    isActive: true
  }));
  await User.insertMany(studentUsers);
  console.log(`   ✓ ${studentsData.length} students & logins created (CSE: 31, ISE: 30, ECE: 30, ME: 30)`);

  // 9. Institution Config & Grading Scheme
  console.log('\n8. Setting institution config & grading scheme...');
  await InstitutionConfig.findOneAndUpdate(
    {},
    {
      institutionName: 'PES Institute of Technology and Management',
      institutionCode: 'PESITM',
      address: 'NH 206, Sagar Road, Shivamogga, Karnataka 577204',
      academicYear: '2025-2026',
      currentSemester: 3,
      autonomousStatus: false,
      gradingScheme: 'VTU 2015 Scheme',
      emailDomain: 'pesitm.edu'
    },
    { upsert: true }
  );

  await GradingScheme.findOneAndUpdate(
    { schemeName: 'VTU 2015 Scheme' },
    {
      schemeName: 'VTU 2015 Scheme',
      isActive: true,
      passMarkPercentage: 40,
      gradeTable: [
        { grade: 'O',  gradePoint: 10, minPercentage: 90, maxPercentage: 100, description: 'Outstanding' },
        { grade: 'A+', gradePoint: 9,  minPercentage: 80, maxPercentage: 89,  description: 'Excellent' },
        { grade: 'A',  gradePoint: 8,  minPercentage: 70, maxPercentage: 79,  description: 'Very Good' },
        { grade: 'B+', gradePoint: 7,  minPercentage: 60, maxPercentage: 69,  description: 'Good' },
        { grade: 'B',  gradePoint: 6,  minPercentage: 55, maxPercentage: 59,  description: 'Above Average' },
        { grade: 'C',  gradePoint: 5,  minPercentage: 50, maxPercentage: 54,  description: 'Average' },
        { grade: 'P',  gradePoint: 4,  minPercentage: 40, maxPercentage: 49,  description: 'Pass' },
        { grade: 'F',  gradePoint: 0,  minPercentage: 0,  maxPercentage: 39,  description: 'Fail' }
      ]
    },
    { upsert: true }
  );
  console.log('   ✓ Config and VTU grading scheme ensured');

  console.log('\n====================================================');
  console.log('   DEMO DATA RESTORED SUCCESSFULLY');
  console.log('====================================================');
  console.log('Demo Credentials:');
  console.log('  Admin:     ADMIN1     / Admin@123');
  console.log('  Exam Cell: EXAMCELL1  / ExamCell@123');
  console.log('  Faculty:   FACULTY1   / Faculty@123');
  console.log('  Student:   STUDENT1   / Student@123');
  console.log('  HOD:       HOD1       / HOD@123');
  console.log('  Principal: PRINCIPAL1 / Principal@123');
  console.log('====================================================\n');

  await mongoose.disconnect();
}

restore().catch(err => {
  console.error('Restore error:', err);
  process.exit(1);
});
