const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const AnswerScript = require('./models/AnswerScript');
const QuestionPaper = require('./models/QuestionPaper');
const Exam = require('./models/Exam');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
    console.log('Connected to MongoDB');

    const scripts = await AnswerScript.find().populate('examId');
    console.log(`Total scripts: ${scripts.length}`);
    for (const s of scripts) {
      console.log(`\nScript ID: ${s._id}`);
      console.log(`Student USN: ${s.studentId}`); // we didn't populate student here, that's fine
      console.log(`Exam ID: ${s.examId?._id}`);
      console.log(`Exam Type: ${s.examId?.examType}`);
      
      const qp = await QuestionPaper.findOne({ examId: s.examId?._id });
      console.log(`Question Paper Found: ${qp ? 'YES' : 'NO'}`);
      if (qp) {
        console.log(`QP Status: ${qp.status}`);
        console.log(`QP Slots Count: ${qp.slots?.length || 0}`);
        console.log(`QP Questions Count: ${qp.questions?.length || 0}`);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspect();
