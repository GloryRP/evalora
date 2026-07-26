const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const QuestionPaper = require('./server/models/QuestionPaper');
const Exam = require('./server/models/Exam');
const Subject = require('./server/models/Subject');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-automation');
    console.log('Connected to MongoDB');

    const papers = await QuestionPaper.find()
      .populate('subjectId')
      .populate({
        path: 'examId',
        populate: { path: 'subjectId' }
      });

    console.log(`Total question papers in database: ${papers.length}`);
    papers.forEach(p => {
      console.log(`\nPaper ID: ${p._id}`);
      console.log(`Status: ${p.status}`);
      console.log(`Subject: ${p.subjectId?.subjectName} (${p.subjectId?.subjectCode})`);
      console.log(`Exam ID: ${p.examId?._id}`);
      console.log(`Exam Type: ${p.examId?.examType}`);
      console.log(`File Name: ${p.fileName || 'None'}`);
      console.log(`Slots count: ${p.slots?.length || 0}`);
      console.log(`Questions count: ${p.questions?.length || 0}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspect();
