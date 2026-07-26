const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const AnswerScript = require('./models/AnswerScript');
const Student = require('./models/Student');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
    console.log('Connected to MongoDB');

    const scripts = await AnswerScript.find().populate('studentId');
    console.log(`Total scripts in DB: ${scripts.length}`);
    for (const s of scripts) {
      console.log(`\nScript ID: ${s._id}`);
      console.log(`Student USN: ${s.studentId?.usn} (Name: ${s.studentId?.name})`);
      console.log(`Status: ${s.status}`);
      console.log(`Marks: ${s.marksObtained}`);
      console.log(`Exam ID: ${s.examId}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspect();
