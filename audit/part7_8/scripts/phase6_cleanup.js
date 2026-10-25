const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });

const User = require('../../../server/models/User');
const Student = require('../../../server/models/Student');
const Subject = require('../../../server/models/Subject');
const Exam = require('../../../server/models/Exam');
const AnswerScript = require('../../../server/models/AnswerScript');
const Result = require('../../../server/models/Result');
const Notification = require('../../../server/models/Notification');
const Faculty = require('../../../server/models/Faculty');

const recordsFile = path.join(__dirname, '../created_records.json');
const beforeFile = path.join(__dirname, '../counts_before.json');
const afterFile = path.join(__dirname, '../counts_after.json');

async function runCleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for cleanup:', mongoose.connection.name);

  const tracked = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  const deletedLog = {
    timestamp: new Date().toISOString(),
    deleted: {}
  };

  // 1. Delete AnswerScripts
  if (tracked.scripts && tracked.scripts.length > 0) {
    const res = await AnswerScript.deleteMany({ _id: { $in: tracked.scripts } });
    deletedLog.deleted.scripts = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} AnswerScripts.`);
  }

  // 2. Delete Results
  if (tracked.results && tracked.results.length > 0) {
    const res = await Result.deleteMany({ _id: { $in: tracked.results } });
    deletedLog.deleted.results = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} Results.`);
  }

  // 3. Delete Notifications
  if (tracked.notifications && tracked.notifications.length > 0) {
    const res = await Notification.deleteMany({ _id: { $in: tracked.notifications } });
    deletedLog.deleted.notifications = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} Notifications.`);
  }

  // 4. Delete Exams
  if (tracked.exams && tracked.exams.length > 0) {
    const res = await Exam.deleteMany({ _id: { $in: tracked.exams } });
    deletedLog.deleted.exams = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} Exams.`);
  }

  // 5. Delete Subjects
  if (tracked.subjects && tracked.subjects.length > 0) {
    const res = await Subject.deleteMany({ _id: { $in: tracked.subjects } });
    deletedLog.deleted.subjects = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} Subjects.`);
  }

  // 6. Delete Students
  if (tracked.students && tracked.students.length > 0) {
    const res = await Student.deleteMany({ _id: { $in: tracked.students } });
    deletedLog.deleted.students = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} Students.`);
  }

  // 7. Delete Users
  if (tracked.users && tracked.users.length > 0) {
    const res = await User.deleteMany({ _id: { $in: tracked.users } });
    deletedLog.deleted.users = res.deletedCount;
    console.log(`Deleted ${res.deletedCount} Users.`);
  }

  fs.writeFileSync(path.join(__dirname, '../deleted_records_log.json'), JSON.stringify(deletedLog, null, 2));

  // Count after cleanup
  const countsAfter = {
    database: mongoose.connection.name,
    timestamp: new Date().toISOString(),
    counts: {
      users: await User.countDocuments(),
      students: await Student.countDocuments(),
      faculties: await Faculty.countDocuments(),
      subjects: await Subject.countDocuments(),
      scripts: await AnswerScript.countDocuments(),
      results: await Result.countDocuments(),
      notifications: await Notification.countDocuments()
    }
  };

  fs.writeFileSync(afterFile, JSON.stringify(countsAfter, null, 2));
  console.log('Saved counts_after.json');

  // Compare with counts_before.json
  const countsBefore = JSON.parse(fs.readFileSync(beforeFile, 'utf8')).counts;
  console.log('\n--- VERIFICATION: counts_before vs counts_after ---');
  let allEqual = true;
  const discrepancies = {};

  for (const key of Object.keys(countsBefore)) {
    const b = countsBefore[key];
    const a = countsAfter.counts[key];
    const match = (b === a);
    if (!match) {
      allEqual = false;
      discrepancies[key] = { before: b, after: a };
    }
    console.log(`  ${key}: Before=${b} | After=${a} | Match=${match}`);
  }

  if (allEqual) {
    console.log('\nSUCCESS: All collection counts after cleanup match counts_before EXACTLY!');
  } else {
    console.warn('\nDISCREPANCY DETECTED in collections:', JSON.stringify(discrepancies, null, 2));
  }

  await mongoose.disconnect();
}

runCleanup().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
