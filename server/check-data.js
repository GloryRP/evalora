/**
 * Data Check Script
 * Checks if all required data exists before running pipeline
 * Run with: node check-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Hall = require('./models/Hall');
const Subject = require('./models/Subject');
const Exam = require('./models/Exam');

const checkData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check Students
    const studentCount = await Student.countDocuments();
    console.log(`📚 Students: ${studentCount}`);
    if (studentCount === 0) {
      console.log('   ❌ No students found! Run: node seed.js');
    } else {
      const sampleStudent = await Student.findOne().lean();
      console.log(`   Sample: ${sampleStudent.usn} - ${sampleStudent.name} (Sem ${sampleStudent.semester})`);
    }

    // Check Faculty
    const facultyCount = await Faculty.countDocuments();
    console.log(`\n👨‍🏫 Faculty: ${facultyCount}`);
    if (facultyCount === 0) {
      console.log('   ❌ No faculty found! Run: node seed.js');
    } else {
      const sampleFaculty = await Faculty.findOne().lean();
      console.log(`   Sample: ${sampleFaculty.employeeId} - ${sampleFaculty.name}`);
    }

    // Check Halls
    const hallCount = await Hall.countDocuments();
    console.log(`\n🏛️  Halls: ${hallCount}`);
    if (hallCount === 0) {
      console.log('   ❌ No halls found! Run: node seed.js');
    } else {
      const sampleHall = await Hall.findOne().lean();
      console.log(`   Sample: ${sampleHall.hallName} (Capacity: ${sampleHall.capacity})`);
    }

    // Check Subjects
    const subjectCount = await Subject.countDocuments();
    console.log(`\n📖 Subjects: ${subjectCount}`);
    if (subjectCount === 0) {
      console.log('   ❌ No subjects found! Run: node seed.js');
    } else {
      const sampleSubject = await Subject.findOne().lean();
      console.log(`   Sample: ${sampleSubject.subjectCode} - ${sampleSubject.subjectName}`);
    }

    // Check Exams
    const examCount = await Exam.countDocuments();
    console.log(`\n📝 Exams: ${examCount}`);
    if (examCount === 0) {
      console.log('   ⚠️  No exams found! Create exams via UI before running pipeline.');
    } else {
      const exams = await Exam.find().populate('subjectId').limit(3).lean();
      exams.forEach(exam => {
        console.log(`   - ${exam.subjectId?.subjectName || 'Unknown'} on ${new Date(exam.examDate).toLocaleDateString()} at ${exam.startTime}`);
      });
    }

    console.log('\n========================================');
    if (studentCount > 0 && facultyCount > 0 && hallCount > 0 && subjectCount > 0) {
      console.log('✅ All required data exists!');
      if (examCount === 0) {
        console.log('\n⚠️  Next step: Create exams via UI');
        console.log('   1. Login as EXAMCELL1');
        console.log('   2. Go to "Exams" page');
        console.log('   3. Click "Add Exam"');
        console.log('   4. Create at least 2 exams');
        console.log('   5. Then run the pipeline');
      } else {
        console.log('✅ You can now run the pipeline!');
      }
    } else {
      console.log('❌ Missing required data!');
      console.log('\n🔧 Fix: Run the seed script');
      console.log('   cd server');
      console.log('   node seed.js');
    }
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkData();
