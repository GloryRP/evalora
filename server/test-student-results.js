const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const AnswerScript = require('./models/AnswerScript');
const Student = require('./models/Student');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
    console.log('Connected to MongoDB');

    const student = await Student.findOne({ usn: '4PM23CD015' });
    if (!student) {
      console.log('Student 4PM23CD015 not found!');
      await mongoose.disconnect();
      return;
    }
    console.log(`Found Student: ${student.name} (_id: ${student._id})`);

    const scripts = await AnswerScript.find({
      studentId: student._id,
      status: 'published',
    }).populate({
      path: 'examId',
      populate: { path: 'subjectId' }
    });

    console.log(`Scripts query count: ${scripts.length}`);
    scripts.forEach(s => {
      console.log(`Script ID: ${s._id}, Status: ${s.status}, Subject: ${s.examId?.subjectId?.subjectName}, Marks: ${s.marksObtained}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
