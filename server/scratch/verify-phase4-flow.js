require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Load schemas relatively
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const AnswerScript = require('../models/AnswerScript');
const Result = require('../models/Result');
const GradingScheme = require('../models/GradingScheme');

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.\n');

    // 1. Locate/Create evaluated script for STUDENT1
    console.log('1. Auditing test records...');
    const student = await Student.findOne({ usn: 'STUDENT1' });
    if (!student) throw new Error('STUDENT1 not found');
    console.log(`- Student: ${student.name} (${student.usn}) | Semester ${student.semester}`);

    const exam = await Exam.findOne({ semester: student.semester }) || await Exam.findOne();
    if (!exam) throw new Error('No exam found to link result');
    console.log(`- Exam linked: ID ${exam._id} | Semester ${exam.semester}`);

    // Update student semester to match exam semester for consistency
    student.semester = exam.semester;
    await student.save();

    // Ensure we have an evaluated script
    let script = await AnswerScript.findOne({ studentId: student._id, examId: exam._id });
    if (!script) {
      script = await AnswerScript.create({
        studentId: student._id,
        examId: exam._id,
        subjectId: exam.subjectId,
        status: 'evaluated',
        fileName: 'Mock_Scanned.pdf',
        maxMarks: 100,
        marksObtained: 85, // VTU Grade: A+ (9 points)
      });
    } else {
      script.status = 'evaluated';
      script.marksObtained = 85;
      script.maxMarks = 100;
      await script.save();
    }
    console.log(`- Evaluated script: USN ${student.usn} | Marks: ${script.marksObtained}/${script.maxMarks} | Status: ${script.status}`);

    // Clear any previous computed result
    await Result.deleteMany({ studentId: student._id, semester: exam.semester });

    // 2. Perform Results Computation via API
    console.log('\n2. Triggering results computation POST /results/compute...');
    const serverUrl = 'http://localhost:5000/api/v1';
    
    // Login as ExamCell user to get token
    const loginRes = await axios.post(`${serverUrl}/auth/login`, {
      username: 'EXAMCELL1',
      password: 'ExamCell@123'
    });
    const token = loginRes.data.token;
    console.log(`✓ Logged in as EXAMCELL1. Token acquired.`);

    const computeRes = await axios.post(
      `${serverUrl}/results/compute`,
      {
        semester: exam.semester,
        academicYear: '2025-26'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('✓ POST /results/compute returned status 200.');
    console.log('Summary of computation:');
    console.log(JSON.stringify(computeRes.data.summary, null, 2));

    // Verify Result document was created in DB
    const dbResult = await Result.findOne({ studentId: student._id, semester: exam.semester });
    if (!dbResult) throw new Error('Result document was not created in MongoDB!');
    console.log(`✓ Result document found in MongoDB:`);
    console.log(`  - SGPA: ${dbResult.sgpa}`);
    console.log(`  - CGPA: ${dbResult.cgpa}`);
    console.log(`  - Overall: ${dbResult.overallResult}`);
    console.log(`  - Published: ${dbResult.isPublished}`);

    if (dbResult.sgpa !== 8.0) {
      throw new Error(`SGPA value mismatch. Expected 8.0, got ${dbResult.sgpa}`);
    }

    // 3. Publish results via API
    console.log('\n3. Triggering results publication POST /results/publish...');
    const publishRes = await axios.post(
      `${serverUrl}/results/publish`,
      {
        semester: exam.semester,
        academicYear: '2025-26'
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log(`✓ POST /results/publish returned success: ${publishRes.data.success}`);
    console.log(`  - Count Published: ${publishRes.data.count}`);

    // Verify Result isPublished flag
    const publishedResult = await Result.findOne({ studentId: student._id, semester: exam.semester });
    if (!publishedResult.isPublished) throw new Error('Result was not updated to isPublished = true');
    console.log(`✓ Result marked published: ${publishedResult.isPublished}`);

    // 4. Test Student Retrieval
    console.log('\n4. Logging in as student (STUDENT1) to retrieve results...');
    const studentLoginRes = await axios.post(`${serverUrl}/auth/login`, {
      username: 'STUDENT1',
      password: 'Student@123'
    });
    const studentToken = studentLoginRes.data.token;

    const studentResultsRes = await axios.get(
      `${serverUrl}/results/my-results`,
      {
        headers: { Authorization: `Bearer ${studentToken}` }
      }
    );

    console.log(`✓ GET /results/my-results returned ${studentResultsRes.data.count} result records.`);
    const resultObj = studentResultsRes.data.data[0];
    console.log(`  - Received Sem ${resultObj.semester} SGPA: ${resultObj.sgpa}`);

    console.log('\n======================================================');
    console.log('✅ PHASE 4 RESULTS COMPUTATION & PUBLISHING SUCCEEDED!');
    console.log('======================================================');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
