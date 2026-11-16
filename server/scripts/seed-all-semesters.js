/**
 * Seed Subjects & Students for All Semesters (1 to 8)
 * Safely upserts subjects and students without wiping other data.
 * 
 * Usage: node server/scripts/seed-all-semesters.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/examdb';

const Subject = require('../models/Subject');
const Student = require('../models/Student');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const allSubjects = [
  // Semester 1
  { subjectCode: 'MA101', subjectName: 'Engineering Mathematics I', department: 'Computer Science and Engineering', semester: 1, credits: 4, subjectType: 'theory' },
  { subjectCode: 'PH101', subjectName: 'Engineering Physics', department: 'Electronics and Communication Engineering', semester: 1, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS101', subjectName: 'Introduction to Programming', department: 'Computer Science and Engineering', semester: 1, credits: 4, subjectType: 'theory' },
  { subjectCode: 'ME101', subjectName: 'Elements of Mechanical Engineering', department: 'Mechanical Engineering', semester: 1, credits: 3, subjectType: 'theory' },

  // Semester 2
  { subjectCode: 'MA201', subjectName: 'Engineering Mathematics II', department: 'Computer Science and Engineering', semester: 2, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CY201', subjectName: 'Engineering Chemistry', department: 'Mechanical Engineering', semester: 2, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC201', subjectName: 'Basic Electronics', department: 'Electronics and Communication Engineering', semester: 2, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS201', subjectName: 'Data Structures with C', department: 'Computer Science and Engineering', semester: 2, credits: 4, subjectType: 'theory' },

  // Semester 3
  { subjectCode: 'CS301', subjectName: 'Data Structures and Algorithms', department: 'Computer Science and Engineering', semester: 3, credits: 4, subjectType: 'theory' },
  { subjectCode: 'IS301', subjectName: 'Object Oriented Programming with Java', department: 'Information Science and Engineering', semester: 3, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC301', subjectName: 'Digital Electronic Circuits', department: 'Electronics and Communication Engineering', semester: 3, credits: 4, subjectType: 'theory' },
  { subjectCode: 'ME301', subjectName: 'Basic Thermodynamics', department: 'Mechanical Engineering', semester: 3, credits: 4, subjectType: 'theory' },

  // Semester 4
  { subjectCode: 'CS401', subjectName: 'Design and Analysis of Algorithms', department: 'Computer Science and Engineering', semester: 4, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS402', subjectName: 'Computer Organization & Architecture', department: 'Computer Science and Engineering', semester: 4, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC401', subjectName: 'Signals and Systems', department: 'Electronics and Communication Engineering', semester: 4, credits: 4, subjectType: 'theory' },
  { subjectCode: 'ME401', subjectName: 'Fluid Mechanics', department: 'Mechanical Engineering', semester: 4, credits: 4, subjectType: 'theory' },

  // Semester 5
  { subjectCode: 'CS501', subjectName: 'Database Management Systems', department: 'Computer Science and Engineering', semester: 5, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS502', subjectName: 'Operating Systems', department: 'Computer Science and Engineering', semester: 5, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS503', subjectName: 'Computer Networks', department: 'Computer Science and Engineering', semester: 5, credits: 3, subjectType: 'theory' },
  { subjectCode: 'CS504', subjectName: 'Software Engineering', department: 'Computer Science and Engineering', semester: 5, credits: 3, subjectType: 'theory' },
  { subjectCode: 'ME501', subjectName: 'Applied Thermodynamics', department: 'Mechanical Engineering', semester: 5, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC501', subjectName: 'Digital Signal Processing', department: 'Electronics and Communication Engineering', semester: 5, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC502', subjectName: 'Microcontrollers', department: 'Electronics and Communication Engineering', semester: 5, credits: 3, subjectType: 'theory' },

  // Semester 6
  { subjectCode: 'CS601', subjectName: 'Machine Learning', department: 'Computer Science and Engineering', semester: 6, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS602', subjectName: 'Web Technologies', department: 'Information Science and Engineering', semester: 6, credits: 3, subjectType: 'theory' },
  { subjectCode: 'CS603', subjectName: 'Compiler Design', department: 'Computer Science and Engineering', semester: 6, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC601', subjectName: 'VLSI Design', department: 'Electronics and Communication Engineering', semester: 6, credits: 4, subjectType: 'theory' },
  { subjectCode: 'ME601', subjectName: 'Heat Transfer', department: 'Mechanical Engineering', semester: 6, credits: 4, subjectType: 'theory' },

  // Semester 7
  { subjectCode: 'CS701', subjectName: 'Artificial Intelligence', department: 'Computer Science and Engineering', semester: 7, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS702', subjectName: 'Cloud Computing', department: 'Computer Science and Engineering', semester: 7, credits: 3, subjectType: 'theory' },
  { subjectCode: 'CS703', subjectName: 'Big Data Analytics', department: 'Computer Science and Engineering', semester: 7, credits: 4, subjectType: 'theory' },
  { subjectCode: 'EC701', subjectName: 'Embedded Systems', department: 'Electronics and Communication Engineering', semester: 7, credits: 4, subjectType: 'theory' },
  { subjectCode: 'ME701', subjectName: 'Robotics and Automation', department: 'Mechanical Engineering', semester: 7, credits: 3, subjectType: 'theory' },

  // Semester 8
  { subjectCode: 'CS801', subjectName: 'Deep Learning', department: 'Computer Science and Engineering', semester: 8, credits: 4, subjectType: 'theory' },
  { subjectCode: 'CS802', subjectName: 'Internet of Things', department: 'Information Science and Engineering', semester: 8, credits: 3, subjectType: 'theory' },
  { subjectCode: 'CS803', subjectName: 'Blockchain Technology', department: 'Computer Science and Engineering', semester: 8, credits: 3, subjectType: 'theory' },
  { subjectCode: 'EC801', subjectName: 'Wireless Communication Networks', department: 'Electronics and Communication Engineering', semester: 8, credits: 4, subjectType: 'theory' },
  { subjectCode: 'ME801', subjectName: 'Industrial Engineering & Management', department: 'Mechanical Engineering', semester: 8, credits: 3, subjectType: 'theory' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  console.log('\nUpserting subjects across all 8 semesters...');
  let addedSubjects = 0;
  for (const sub of allSubjects) {
    const res = await Subject.findOneAndUpdate(
      { subjectCode: sub.subjectCode },
      { $setOnInsert: sub },
      { upsert: true, new: false }
    );
    if (!res) {
      addedSubjects++;
      console.log(` + Added: [Sem ${sub.semester}] ${sub.subjectCode} - ${sub.subjectName}`);
    }
  }
  console.log(`Subjects check complete. Added ${addedSubjects} new subjects.`);

  console.log('\nEnsuring sample students exist for all semesters (1 to 8)...');
  const defaultPasswordHash = await bcrypt.hash('Student@123', 10);
  const departments = [
    'Computer Science and Engineering',
    'Information Science and Engineering',
    'Electronics and Communication Engineering',
    'Mechanical Engineering'
  ];

  let addedStudents = 0;
  for (let sem = 1; sem <= 8; sem++) {
    for (let i = 1; i <= 5; i++) {
      const usn = `4PM24SEM${sem}S${String(i).padStart(2, '0')}`;
      const dept = departments[(i - 1) % departments.length];
      const existing = await Student.findOne({ usn });
      if (!existing) {
        await Student.create({
          usn,
          name: `Student Sem${sem} #${i}`,
          department: dept,
          semester: sem,
          email: `${usn.toLowerCase()}@pesitm.edu`,
          phone: `99111${sem}${String(i).padStart(3, '0')}`,
          batch: '2024-2028',
        });
        await User.findOneAndUpdate(
          { username: usn },
          {
            $setOnInsert: {
              username: usn,
              passwordHash: defaultPasswordHash,
              role: 'student',
              name: `Student Sem${sem} #${i}`,
              department: dept,
              email: `${usn.toLowerCase()}@pesitm.edu`,
              isActive: true,
            }
          },
          { upsert: true }
        );
        addedStudents++;
      }
    }
  }
  console.log(`Students check complete. Added ${addedStudents} new students across all semesters.`);

  console.log('\nAll done! You now have subjects and students across semesters 1 to 8.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error seeding:', err);
  process.exit(1);
});

