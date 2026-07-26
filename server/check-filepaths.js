const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const AnswerScript = require('./models/AnswerScript');

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/examdb');
    console.log('Connected to MongoDB');

    const scripts = await AnswerScript.find();
    console.log(`Total scripts: ${scripts.length}`);
    scripts.forEach(s => {
      console.log(`Script ID: ${s._id}`);
      console.log(`File Name: ${s.fileName}`);
      console.log(`File Path: ${s.filePath}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspect();
