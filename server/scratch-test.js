const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const AnswerScript = require('./models/AnswerScript');
const Subject = require('./models/Subject');
const Result = require('./models/Result');
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
    console.log('✓ Connected to Mongo');

    const hod = await User.findOne({ role: 'hod' });
    if (!hod) {
      console.log('No HOD found in DB!');
      await mongoose.disconnect();
      return;
    }
    console.log(`HOD: ${hod.name}, Dept: ${hod.department}`);

    // Get subjects in this department
    const subjects = await Subject.find({ department: { $regex: new RegExp('^' + hod.department.trim() + '$', 'i') } });
    console.log(`Subjects: ${subjects.length}`);

    const subjectIds = subjects.map(s => s._id);
    const scripts = await AnswerScript.find({ subjectId: { $in: subjectIds } });
    console.log(`Scripts: ${scripts.length}`);

    const results = await Result.find({ department: { $regex: new RegExp('^' + hod.department.trim() + '$', 'i') } });
    console.log(`Results (SEE): ${results.length}`);

    await mongoose.disconnect();
    console.log('✓ Disconnected');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
