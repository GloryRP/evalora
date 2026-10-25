const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const axios = require('axios');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });

const Result = require('../../../server/models/Result');
const Notification = require('../../../server/models/Notification');
const recordsFile = path.join(__dirname, '../created_records.json');

function trackRecord(type, id) {
  const data = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  if (!data[type]) data[type] = [];
  if (!data[type].includes(id.toString())) {
    data[type].push(id.toString());
    fs.writeFileSync(recordsFile, JSON.stringify(data, null, 2));
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  // 1. Authenticate as EXAMCELL1
  console.log('Logging in as EXAMCELL1...');
  const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
    username: 'EXAMCELL1',
    password: 'ExamCell@123'
  });
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log('EXAMCELL1 logged in successfully.');

  const resultsSummary = {
    phase: 'Phase 2: Compute and Publish',
    timestamp: new Date().toISOString(),
    tests: []
  };

  // ---------------- STEP 1: Compute Semester 4 ----------------
  console.log('\n--- STEP 1: Computing Semester 4 ---');
  const sem4ComputeRes = await axios.post(
    'http://localhost:5000/api/v1/results/compute',
    {
      semester: 4,
      academicYear: '2099-2100',
      department: 'Test Engineering'
    },
    { headers: authHeaders }
  );

  console.log('Sem 4 compute status:', sem4ComputeRes.status, sem4ComputeRes.data.message);
  const sem4Results = sem4ComputeRes.data.data;
  console.log(`Computed ${sem4Results.length} records for Semester 4.`);

  // Track Semester 4 Result documents
  for (const r of sem4Results) {
    trackRecord('results', r._id);
    console.log(`  USN: ${r.usn} | SGPA: ${r.sgpa} | CGPA: ${r.cgpa} | Result: ${r.overallResult}`);
  }

  // ---------------- STEP 2: Publish Semester 4 ----------------
  console.log('\n--- STEP 2: Publishing Semester 4 ---');
  const sem4PublishRes = await axios.post(
    'http://localhost:5000/api/v1/results/publish',
    {
      semester: 4,
      academicYear: '2099-2100',
      department: 'Test Engineering'
    },
    { headers: authHeaders }
  );

  console.log('Sem 4 publish status:', sem4PublishRes.status, sem4PublishRes.data.message);
  resultsSummary.tests.push({
    test: 'COMPUTE_PUBLISH_SEM4',
    status: sem4PublishRes.data.success ? 'PASS' : 'FAIL',
    count: sem4Results.length,
    message: sem4PublishRes.data.message
  });

  // ---------------- STEP 3: Compute Semester 5 ----------------
  console.log('\n--- STEP 3: Computing Semester 5 ---');
  const sem5ComputeRes = await axios.post(
    'http://localhost:5000/api/v1/results/compute',
    {
      semester: 5,
      academicYear: '2099-2100',
      department: 'Test Engineering'
    },
    { headers: authHeaders }
  );

  console.log('Sem 5 compute status:', sem5ComputeRes.status, sem5ComputeRes.data.message);
  const sem5Results = sem5ComputeRes.data.data;
  console.log(`Computed ${sem5Results.length} records for Semester 5:`);

  // Track Semester 5 Result documents
  for (const r of sem5Results) {
    trackRecord('results', r._id);
    console.log(`  USN: ${r.usn} | SGPA: ${r.sgpa} | CGPA: ${r.cgpa} | Overall: ${r.overallResult}`);
    for (const sub of r.subjectResults) {
      console.log(`    - ${sub.subjectCode}: Marks=${sub.marksObtained}/100 Grade=${sub.grade} GP=${sub.gradePoint} Result=${sub.result}`);
    }
  }

  // Compare against expected_results.json
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, '../expected_results.json'), 'utf8'));
  const comparison = {};

  for (const r of sem5Results) {
    const exp = expected.semester5[r.usn];
    comparison[r.usn] = {
      usn: r.usn,
      actualSGPA: r.sgpa,
      expectedSGPA: exp ? exp.sgpa : null,
      sgpaMatch: exp ? (r.sgpa === exp.sgpa) : false,
      actualCGPA: r.cgpa,
      expectedCGPA: exp ? exp.cgpa : null,
      cgpaMatch: exp ? (r.cgpa === exp.cgpa) : false,
      actualOverall: r.overallResult,
      expectedOverall: exp ? exp.overallResult : null,
      overallMatch: exp ? (r.overallResult === exp.overallResult) : false,
      subjects: r.subjectResults.map(s => {
        const expSub = exp?.subjectResults.find(es => es.subjectCode === s.subjectCode);
        return {
          code: s.subjectCode,
          actualMarks: s.marksObtained,
          expectedMarks: expSub ? expSub.marksObtained : null,
          marksMatch: expSub ? (s.marksObtained === expSub.marksObtained) : false,
          actualGrade: s.grade,
          expectedGrade: expSub ? expSub.grade : null,
          gradeMatch: expSub ? (s.grade === expSub.grade) : false,
          actualResult: s.result,
          expectedResult: expSub ? expSub.result : null,
          resultMatch: expSub ? (s.result === expSub.result) : false
        };
      })
    };
  }

  fs.writeFileSync(path.join(__dirname, '../comparison_sem5.json'), JSON.stringify(comparison, null, 2));
  console.log('Saved comparison_sem5.json');

  // ---------------- STEP 4: Pre-Publish Isolation Check ----------------
  console.log('\n--- STEP 4: Pre-Publish Student Isolation Check ---');
  // Log in as student 4PM23TST001
  const student1Login = await axios.post('http://localhost:5000/api/v1/auth/login', {
    username: '4PM23TST001',
    password: 'Student@123'
  });
  const stToken = student1Login.data.token;
  const stHeaders = { Authorization: `Bearer ${stToken}` };

  const stPrePublishRes = await axios.get('http://localhost:5000/api/v1/results/my-results', { headers: stHeaders });
  console.log('Student 001 visible published semesters before publishing Sem 5:', stPrePublishRes.data.data.map(r => r.semester));
  const sem5VisibleBeforePublish = stPrePublishRes.data.data.some(r => r.semester === 5);
  console.log('Is Semester 5 visible before publication?', sem5VisibleBeforePublish);

  // ---------------- STEP 5: Publish Semester 5 ----------------
  console.log('\n--- STEP 5: Publishing Semester 5 ---');
  const sem5PublishRes = await axios.post(
    'http://localhost:5000/api/v1/results/publish',
    {
      semester: 5,
      academicYear: '2099-2100',
      department: 'Test Engineering'
    },
    { headers: authHeaders }
  );

  console.log('Sem 5 publish status:', sem5PublishRes.status, sem5PublishRes.data.message);

  // Track any new notifications created
  const notifs = await Notification.find({ createdAt: { $gte: new Date(Date.now() - 60000) } });
  for (const n of notifs) {
    trackRecord('notifications', n._id);
  }
  console.log(`Tracked ${notifs.length} new notifications.`);

  await mongoose.disconnect();
  console.log('\nPhase 2 completed successfully!');
}

run().catch(err => {
  console.error('Phase 2 error:', err.response ? err.response.data : err);
  process.exit(1);
});
