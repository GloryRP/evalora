/**
 * Database Seeding Script
 * Creates one test user for each of the 6 roles for testing purposes
 * Run with: node seed.js
 * 
 * Test Credentials:
 * - Admin: admin1 / Admin@123
 * - ExamCell: examcell1 / ExamCell@123
 * - Faculty: faculty1 / Faculty@123
 * - Student: student1 / Student@123
 * - HOD: hod1 / HOD@123
 * - Principal: principal1 / Principal@123
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Department = require('./models/Department');
const Subject = require('./models/Subject');
const Hall = require('./models/Hall');
const InstitutionConfig = require('./models/InstitutionConfig');

// Test users to seed
const testUsers = [
  {
    username: 'ADMIN1',
    password: 'Admin@123',
    role: 'admin',
    name: 'Admin User',
    department: 'Administration',
    email: 'admin1@evalora.ac.in',
  },
  {
    username: 'EXAMCELL1',
    password: 'ExamCell@123',
    role: 'examcell',
    name: 'Exam Cell Officer',
    department: 'Examination Cell',
    email: 'examcell1@evalora.ac.in',
  },
  {
    username: 'FACULTY1',
    password: 'Faculty@123',
    role: 'faculty',
    name: 'Dr. John Doe',
    department: 'Computer Science',
    email: 'gloryrp58@gmail.com',
  },
  {
    username: 'STUDENT1',
    password: 'Student@123',
    role: 'student',
    name: 'Jane Smith',
    department: 'Computer Science',
    email: 'gloryrp0605@gmail.com',
  },
  {
    username: 'HOD1',
    password: 'HOD@123',
    role: 'hod',
    name: 'Prof. Alice Johnson',
    department: 'Computer Science',
    email: 'hod1@evalora.ac.in',
  },
  {
    username: 'PRINCIPAL1',
    password: 'Principal@123',
    role: 'principal',
    name: 'Dr. Robert Brown',
    department: 'Administration',
    email: 'principal1@evalora.ac.in',
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\nClearing existing test data...');
    await User.deleteMany({
      $or: [
        { username: { $in: testUsers.map(u => u.username) } },
        { username: { $regex: /^TEST/ } },
        { username: { $regex: /^FAC/ } }
      ]
    });
    await Student.deleteMany({ $or: [{ usn: { $regex: /^TEST/ } }, { usn: 'STUDENT1' }] });
    await Faculty.deleteMany({ $or: [{ employeeId: { $regex: /^FAC/ } }, { employeeId: 'FACULTY1' }] });
    await Hall.deleteMany({ hallName: { $regex: /^(Hall|Lab)/ } });
    console.log('✓ Cleared existing test data');

    // Create test users
    console.log('\nCreating test users...');
    for (const userData of testUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      await User.create({
        username: userData.username,
        passwordHash,
        role: userData.role,
        name: userData.name,
        department: userData.department,
        email: userData.email, // Add email to User model
        isActive: true,
      });

      console.log(`✓ Created ${userData.role}: ${userData.username} (${userData.email})`);
    }

    // Create departments
    console.log('\nCreating departments...');
    const departments = [
      { departmentName: 'Computer Science and Engineering', departmentCode: 'CSE' },
      { departmentName: 'Computer Science (Data Science)', departmentCode: 'CSDS' },
      { departmentName: 'Electronics and Communication', departmentCode: 'ECE' },
      { departmentName: 'Mechanical Engineering', departmentCode: 'ME' },
    ];
    for (const dept of departments) {
      const existing = await Department.findOne({ departmentCode: dept.departmentCode });
      if (!existing) {
        await Department.create({ ...dept, hodId: null });
        console.log(`✓ Created department: ${dept.departmentName} (${dept.departmentCode})`);
      } else {
        console.log(`✓ Department ${dept.departmentCode} already exists`);
      }
    }

    // Create a test subject
    console.log('\nCreating test subject...');
    const existingSubject = await Subject.findOne({ subjectCode: 'CS101' });
    if (!existingSubject) {
      await Subject.create({
        subjectCode: 'CS101',
        subjectName: 'Introduction to Programming',
        department: 'Computer Science',
        semester: 1,
        credits: 4,
      });
      console.log('✓ Created subject: CS101 - Introduction to Programming');
    } else {
      console.log('✓ Subject CS101 already exists');
    }

    // Create extended profile for the test student
    console.log('\nCreating test student profile...');
    const existingStudent = await Student.findOne({ usn: 'STUDENT1' });
    if (!existingStudent) {
      await Student.create({
        usn: 'STUDENT1',
        name: 'Jane Smith',
        department: 'Computer Science',
        semester: 5,
        email: 'gloryrp0605@gmail.com',
        phone: '9876543210',
      });
      console.log('✓ Created student profile for STUDENT1');
    } else {
      existingStudent.email = 'gloryrp0605@gmail.com';
      await existingStudent.save();
      console.log('✓ Student profile already exists, updated email');
    }

    // Create additional subjects for exams (Semester 5-6)
    console.log('\nCreating additional subjects for exam automation...');
    const additionalSubjects = [
      { subjectCode: 'CS501', subjectName: 'Database Management Systems', department: 'Computer Science', semester: 5, credits: 4 },
      { subjectCode: 'CS502', subjectName: 'Operating Systems', department: 'Computer Science', semester: 5, credits: 4 },
      { subjectCode: 'CS503', subjectName: 'Computer Networks', department: 'Computer Science', semester: 5, credits: 3 },
      { subjectCode: 'CS504', subjectName: 'Software Engineering', department: 'Computer Science', semester: 5, credits: 3 },
      { subjectCode: 'CS601', subjectName: 'Machine Learning', department: 'Computer Science', semester: 6, credits: 4 },
      { subjectCode: 'CS602', subjectName: 'Web Technologies', department: 'Computer Science', semester: 6, credits: 3 },
      { subjectCode: 'EC501', subjectName: 'Digital Signal Processing', department: 'Electronics', semester: 5, credits: 4 },
      { subjectCode: 'EC502', subjectName: 'Microcontrollers', department: 'Electronics', semester: 5, credits: 3 },
    ];

    for (const sub of additionalSubjects) {
      const existing = await Subject.findOne({ subjectCode: sub.subjectCode });
      if (!existing) {
        await Subject.create(sub);
        console.log(`✓ Created subject: ${sub.subjectCode} - ${sub.subjectName}`);
      }
    }

    // Create extended profile for the test faculty
    console.log('\nCreating test faculty profile...');
    const allCsSubjects = await Subject.find({ department: 'Computer Science' });
    const existingFaculty = await Faculty.findOne({ employeeId: 'FACULTY1' });
    if (!existingFaculty) {
      await Faculty.create({
        employeeId: 'FACULTY1',
        name: 'Dr. John Doe',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        subjectsAssigned: allCsSubjects.map(s => s._id),
        email: 'gloryrp58@gmail.com',
        phone: '9876543211',
      });
      console.log('✓ Created faculty profile for FACULTY1');
    } else {
      existingFaculty.subjectsAssigned = allCsSubjects.map(s => s._id);
      existingFaculty.email = 'gloryrp58@gmail.com';
      await existingFaculty.save();
      console.log('✓ Updated faculty profile for FACULTY1 with assigned subjects');
    }

    // Create exam halls
    console.log('\nCreating exam halls...');
    const halls = [
      { hallName: 'Hall A', capacity: 100, building: 'Main Block', floor: 'Ground Floor', facilities: ['AC', 'Projector', 'CCTV'] },
      { hallName: 'Hall B', capacity: 80, building: 'Main Block', floor: 'First Floor', facilities: ['AC', 'CCTV'] },
      { hallName: 'Hall C', capacity: 60, building: 'IT Block', floor: 'Second Floor', facilities: ['AC', 'Whiteboard'] },
      { hallName: 'Lab 1', capacity: 40, building: 'IT Block', floor: 'Ground Floor', facilities: ['Computers', 'AC', 'CCTV'] },
    ];

    for (const hall of halls) {
      const existing = await Hall.findOne({ hallName: hall.hallName });
      if (!existing) {
        await Hall.create(hall);
        console.log(`✓ Created hall: ${hall.hallName} (Capacity: ${hall.capacity})`);
      }
    }

    // Create additional students (10 test students)
    console.log('\nCreating additional test students...');
    const students = [
      { usn: 'TEST001', name: 'Alice Kumar', department: 'Computer Science', semester: 5, email: 'gloryrp0605@gmail.com', phone: '9876543220' },
      { usn: 'TEST002', name: 'Bob Sharma', department: 'Computer Science', semester: 5, email: 'test002@student.test', phone: '9876543221' },
      { usn: 'TEST003', name: 'Charlie Patel', department: 'Computer Science', semester: 5, email: 'test003@student.test', phone: '9876543222' },
      { usn: 'TEST004', name: 'Diana Singh', department: 'Computer Science', semester: 5, email: 'test004@student.test', phone: '9876543223' },
      { usn: 'TEST005', name: 'Eve Reddy', department: 'Computer Science', semester: 6, email: 'test005@student.test', phone: '9876543224' },
      { usn: 'TEST006', name: 'Frank Gupta', department: 'Computer Science', semester: 6, email: 'test006@student.test', phone: '9876543225' },
      { usn: 'TEST007', name: 'Grace Iyer', department: 'Electronics', semester: 5, email: 'test007@student.test', phone: '9876543226' },
      { usn: 'TEST008', name: 'Henry Rao', department: 'Electronics', semester: 5, email: 'test008@student.test', phone: '9876543227' },
      { usn: 'TEST009', name: 'Ivy Menon', department: 'Computer Science', semester: 5, email: 'test009@student.test', phone: '9876543228' },
      { usn: 'TEST010', name: 'Jack Nair', department: 'Computer Science', semester: 6, email: 'test010@student.test', phone: '9876543229' },
    ];

    for (const student of students) {
      const existing = await Student.findOne({ usn: student.usn });
      if (!existing) {
        await Student.create(student);
        
        // Also create User account for each test student
        const passwordHash = await bcrypt.hash('Test@123', 10);
        await User.create({
          username: student.usn,
          passwordHash,
          role: 'student',
          name: student.name,
          department: student.department,
          email: student.email,
          isActive: true,
        });
        
        console.log(`✓ Created student: ${student.usn} - ${student.name} (${student.email})`);
      }
    }

    // Create additional faculty (5 from different departments)
    console.log('\nCreating additional test faculty...');
    const facultyMembers = [
      { employeeId: 'FAC001', name: 'Dr. Sarah Johnson', department: 'Computer Science', designation: 'Professor', email: 'fac001@faculty.test', phone: '9876543230' },
      { employeeId: 'FAC002', name: 'Prof. Michael Brown', department: 'Electronics', designation: 'Associate Professor', email: 'fac002@faculty.test', phone: '9876543231' },
      { employeeId: 'FAC003', name: 'Dr. Priya Verma', department: 'Computer Science', designation: 'Assistant Professor', email: 'fac003@faculty.test', phone: '9876543232' },
      { employeeId: 'FAC004', name: 'Prof. Rajesh Kumar', department: 'Mechanical', designation: 'Professor', email: 'fac004@faculty.test', phone: '9876543233' },
      { employeeId: 'FAC005', name: 'Dr. Anjali Desai', department: 'Electronics', designation: 'Assistant Professor', email: 'fac005@faculty.test', phone: '9876543234' },
    ];

    for (const faculty of facultyMembers) {
      const existing = await Faculty.findOne({ employeeId: faculty.employeeId });
      if (!existing) {
        await Faculty.create(faculty);
        
        // Also create User account for each test faculty
        const passwordHash = await bcrypt.hash('Faculty@123', 10);
        await User.create({
          username: faculty.employeeId,
          passwordHash,
          role: 'faculty',
          name: faculty.name,
          department: faculty.department,
          email: faculty.email,
          isActive: true,
        });
        
        console.log(`✓ Created faculty: ${faculty.employeeId} - ${faculty.name} (${faculty.email})`);
      }
    }

    // Initialize institution configuration
    console.log('\nInitializing institution configuration...');
    const existingConfig = await InstitutionConfig.findOne();
    if (!existingConfig) {
      await InstitutionConfig.create({
        institutionName: 'PES Institute of Technology & Management',
        abbreviation: 'PES',
        address: {
          street: '206, Sagar Road',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          postalCode: '560027',
        },
        phone: '+91-080-40506906',
        email: 'exam@pes.edu',
        website: 'www.pes.edu',
        academicYear: '2025-26',
        currentAcademicYear: '2025-26',
        currentSemester: 5,
        academicYears: [
          {
            year: '2024-25',
            startDate: new Date('2024-06-01'),
            endDate: new Date('2025-05-31'),
            isCurrent: false,
            semesters: [],
          },
          {
            year: '2025-26',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2026-05-31'),
            isCurrent: true,
            semesters: [],
          },
        ],
      });
      console.log('✓ Created institution configuration with academic years');
    } else {
      // Update existing config with academic years if not present
      if (!existingConfig.currentAcademicYear) {
        existingConfig.currentAcademicYear = '2025-26';
        existingConfig.currentSemester = 5;
        existingConfig.academicYears = [
          {
            year: '2024-25',
            startDate: new Date('2024-06-01'),
            endDate: new Date('2025-05-31'),
            isCurrent: false,
            semesters: [],
          },
          {
            year: '2025-26',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2026-05-31'),
            isCurrent: true,
            semesters: [],
          },
        ];
        await existingConfig.save();
        console.log('✓ Updated institution configuration with academic years');
      } else {
        console.log('✓ Institution configuration already exists with academic years');
      }
    }

    // Initialize default grading scheme
    console.log('\nInitializing active VTU grading scheme...');
    const GradingScheme = require('./models/GradingScheme');
    const existingScheme = await GradingScheme.findOne({ isActive: true });
    if (!existingScheme) {
      await GradingScheme.create({
        schemeName: 'VTU 2015 Scheme',
        isActive: true,
        passMarkPercentage: 40,
        gradeTable: [
          { minPercentage: 90, maxPercentage: 100, grade: 'O', gradePoint: 10, description: 'Outstanding' },
          { minPercentage: 80, maxPercentage: 89.99, grade: 'A+', gradePoint: 9, description: 'Excellent' },
          { minPercentage: 70, maxPercentage: 79.99, grade: 'A', gradePoint: 8, description: 'Very Good' },
          { minPercentage: 60, maxPercentage: 69.99, grade: 'B+', gradePoint: 7, description: 'Good' },
          { minPercentage: 55, maxPercentage: 59.99, grade: 'B', gradePoint: 6, description: 'Above Average' },
          { minPercentage: 50, maxPercentage: 54.99, grade: 'C', gradePoint: 5, description: 'Average' },
          { minPercentage: 40, maxPercentage: 49.99, grade: 'P', gradePoint: 4, description: 'Pass' },
          { minPercentage: 0, maxPercentage: 39.99, grade: 'F', gradePoint: 0, description: 'Fail' }
        ]
      });
      console.log('✓ Created active default VTU 2015 Scheme');
    } else {
      console.log('✓ Active grading scheme already exists');
    }

    console.log('\n========================================');
    console.log('✓ Database seeded successfully!');
    
    // Assign subjects to faculty for question paper testing
    console.log('\nAssigning subjects to faculty...');
    const cs501 = await Subject.findOne({ subjectCode: 'CS501' });
    const cs502 = await Subject.findOne({ subjectCode: 'CS502' });
    const cs503 = await Subject.findOne({ subjectCode: 'CS503' });
    
    if (cs501 && cs502 && cs503) {
      // Assign subjects to FACULTY1
      await Faculty.findOneAndUpdate(
        { employeeId: 'FACULTY1' },
        { $addToSet: { subjectsAssigned: { $each: [cs501._id, cs502._id] } } },
        { upsert: false }
      );
      console.log('✓ Assigned CS501, CS502 to FACULTY1');
      
      // Assign subjects to FAC001
      await Faculty.findOneAndUpdate(
        { employeeId: 'FAC001' },
        { $addToSet: { subjectsAssigned: { $each: [cs501._id, cs503._id] } } },
        { upsert: false }
      );
      console.log('✓ Assigned CS501, CS503 to FAC001');
      
      // Assign subjects to FAC003
      await Faculty.findOneAndUpdate(
        { employeeId: 'FAC003' },
        { $addToSet: { subjectsAssigned: { $each: [cs502._id, cs503._id] } } },
        { upsert: false }
      );
      console.log('✓ Assigned CS502, CS503 to FAC003');
    }

    // Create department-specific HOD users
    console.log('\nCreating department-specific HODs...');
    
    // HOD for Computer Science
    const hodCSEUser = await User.findOneAndUpdate(
      { username: 'HOD_CSE' },
      {
        username: 'HOD_CSE',
        passwordHash: await bcrypt.hash('Hod@123', 10),
        role: 'hod',
        name: 'Dr. Rajesh Verma',
        department: 'Computer Science and Engineering',
        email: 'hod.cse@pesitm.ac.in',
        isActive: true,
        isFirstLogin: false
      },
      { upsert: true, new: true }
    );
    console.log('✓ Created HOD_CSE for Computer Science');

    // HOD for Data Science
    const hodDSUser = await User.findOneAndUpdate(
      { username: 'HOD_DS' },
      {
        username: 'HOD_DS',
        passwordHash: await bcrypt.hash('Hod@123', 10),
        role: 'hod',
        name: 'Dr. Sunitha B S',
        department: 'Computer Science (Data Science)',
        email: 'hod.ds@pesitm.ac.in',
        isActive: true,
        isFirstLogin: false
      },
      { upsert: true, new: true }
    );
    console.log('✓ Created HOD_DS for Data Science');

    // HOD for Electronics
    const hodECEUser = await User.findOneAndUpdate(
      { username: 'HOD_ECE' },
      {
        username: 'HOD_ECE',
        passwordHash: await bcrypt.hash('Hod@123', 10),
        role: 'hod',
        name: 'Dr. Pradeep Kumar',
        department: 'Electronics and Communication',
        email: 'hod.ece@pesitm.ac.in',
        isActive: true,
        isFirstLogin: false
      },
      { upsert: true, new: true }
    );
    console.log('✓ Created HOD_ECE for Electronics');

    // Update existing HOD1
    await User.findOneAndUpdate(
      { username: 'HOD1' },
      { 
        department: 'Computer Science and Engineering',
        name: 'HOD - Computer Science',
        isFirstLogin: false 
      }
    );
    console.log('✓ Updated HOD1 with department');

    // Link HODs to departments
    console.log('\nLinking HODs to departments...');
    
    // CSE department
    const cseDept = await Department.findOne({ 
      $or: [
        { departmentCode: 'CSE' },
        { departmentName: 'Computer Science and Engineering' }
      ]
    });
    if (cseDept && hodCSEUser) {
      await Department.findByIdAndUpdate(cseDept._id, {
        hodUserId: hodCSEUser._id,
        hodName: hodCSEUser.name
      });
      console.log('✓ HOD_CSE linked to CSE dept');
    }

    // CSDS department
    const csdsDept = await Department.findOne({ 
      $or: [
        { departmentCode: 'CSDS' },
        { departmentName: { $regex: 'Data Science', $options: 'i' }}
      ]
    });
    if (csdsDept && hodDSUser) {
      await Department.findByIdAndUpdate(csdsDept._id, {
        hodUserId: hodDSUser._id,
        hodName: hodDSUser.name
      });
      console.log('✓ HOD_DS linked to CSDS dept');
    }

    // ECE department
    const eceDept = await Department.findOne({ 
      $or: [
        { departmentCode: 'ECE' },
        { departmentName: { $regex: 'Electronics', $options: 'i' }}
      ]
    });
    if (eceDept && hodECEUser) {
      await Department.findByIdAndUpdate(eceDept._id, {
        hodUserId: hodECEUser._id,
        hodName: hodECEUser.name
      });
      console.log('✓ HOD_ECE linked to ECE dept');
    }
    
    console.log('========================================');
    console.log('========================================');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────');
    testUsers.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(12)} → Username: ${user.username.padEnd(12)} Password: ${user.password}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HOD CREDENTIALS:');
    console.log('HOD1    / HOD@123 → Computer Science');
    console.log('HOD_CSE / Hod@123 → Computer Science');
    console.log('HOD_DS  / Hod@123 → Data Science');
    console.log('HOD_ECE / Hod@123 → Electronics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
