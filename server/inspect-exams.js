const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Exam = require('./models/Exam');
const Subject = require('./models/Subject');
const Faculty = require('./models/Faculty');
const User = require('./models/User');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
    console.log('Connected to MongoDB');

    // 1. Get all departments in scheduled exams
    const exams = await Exam.find().populate('subjectId');
    console.log(`\n--- ALL SCHEDULED EXAMS: ${exams.length} ---`);
    exams.forEach(e => {
      console.log(`Exam ID: ${e._id}`);
      console.log(`Exam Type: ${e.examType}`);
      console.log(`Subject: ${e.subjectId?.subjectName} (${e.subjectId?.subjectCode})`);
      console.log(`Subject Department: ${e.subjectId?.department}`);
    });

    // 2. Get all faculties
    const faculties = await Faculty.find();
    console.log(`\n--- ALL FACULTY MEMBERS: ${faculties.length} ---`);
    faculties.forEach(f => {
      console.log(`Faculty: ${f.name}`);
      console.log(`Employee ID: ${f.employeeId}`);
      console.log(`Department: ${f.department}`);
    });

    // 3. Get all users
    const users = await User.find();
    console.log(`\n--- ALL USERS: ${users.length} ---`);
    users.forEach(u => {
      console.log(`User: ${u.username}, Role: ${u.role}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspect();
