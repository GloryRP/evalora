const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });

const Student = require('../../../server/models/Student');
const AnswerScript = require('../../../server/models/AnswerScript');
const Faculty = require('../../../server/models/Faculty');

const recordsFile = path.join(__dirname, '../created_records.json');
const examMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../exam_map.json'), 'utf8'));

function trackRecord(type, id) {
  const data = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  if (!data[type]) data[type] = [];
  data[type].push(id.toString());
  fs.writeFileSync(recordsFile, JSON.stringify(data, null, 2));
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const faculty = await Faculty.findOne({ employeeId: 'FACULTY1' });
  if (!faculty) throw new Error('FACULTY1 not found');

  const students = await Student.find({ usn: /^4PM23TST/ });
  const sMap = {};
  students.forEach(s => { sMap[s.usn] = s; });

  const scriptPlan = [
    // ---------------- Semester 4 (TST401) ----------------
    // Student 001: (40, 40, 80)
    { usn: '4PM23TST001', sub: 'TST401', type: 'internal1', marks: 40, max: 50 },
    { usn: '4PM23TST001', sub: 'TST401', type: 'internal2', marks: 40, max: 50 },
    { usn: '4PM23TST001', sub: 'TST401', type: 'external',  marks: 80, max: 100 },

    // Student 002: (30, 30, 60)
    { usn: '4PM23TST002', sub: 'TST401', type: 'internal1', marks: 30, max: 50 },
    { usn: '4PM23TST002', sub: 'TST401', type: 'internal2', marks: 30, max: 50 },
    { usn: '4PM23TST002', sub: 'TST401', type: 'external',  marks: 60, max: 100 },

    // ---------------- Semester 5 (TST501, TST502, TST503) ----------------
    // Student 001: S1 (46, 44, 92), S2 (45, 47, 90), S3 (48, 46, 94)
    { usn: '4PM23TST001', sub: 'TST501', type: 'internal1', marks: 46, max: 50 },
    { usn: '4PM23TST001', sub: 'TST501', type: 'internal2', marks: 44, max: 50 },
    { usn: '4PM23TST001', sub: 'TST501', type: 'external',  marks: 92, max: 100 },

    { usn: '4PM23TST001', sub: 'TST502', type: 'internal1', marks: 45, max: 50 },
    { usn: '4PM23TST001', sub: 'TST502', type: 'internal2', marks: 47, max: 50 },
    { usn: '4PM23TST001', sub: 'TST502', type: 'external',  marks: 90, max: 100 },

    { usn: '4PM23TST001', sub: 'TST503', type: 'internal1', marks: 48, max: 50 },
    { usn: '4PM23TST001', sub: 'TST503', type: 'internal2', marks: 46, max: 50 },
    { usn: '4PM23TST001', sub: 'TST503', type: 'external',  marks: 94, max: 100 },

    // Student 002: S1 (31, 29, 60), S2 (28, 30, 58), S3 (35, 33, 70)
    { usn: '4PM23TST002', sub: 'TST501', type: 'internal1', marks: 31, max: 50 },
    { usn: '4PM23TST002', sub: 'TST501', type: 'internal2', marks: 29, max: 50 },
    { usn: '4PM23TST002', sub: 'TST501', type: 'external',  marks: 60, max: 100 },

    { usn: '4PM23TST002', sub: 'TST502', type: 'internal1', marks: 28, max: 50 },
    { usn: '4PM23TST002', sub: 'TST502', type: 'internal2', marks: 30, max: 50 },
    { usn: '4PM23TST002', sub: 'TST502', type: 'external',  marks: 58, max: 100 },

    { usn: '4PM23TST002', sub: 'TST503', type: 'internal1', marks: 35, max: 50 },
    { usn: '4PM23TST002', sub: 'TST503', type: 'internal2', marks: 33, max: 50 },
    { usn: '4PM23TST002', sub: 'TST503', type: 'external',  marks: 70, max: 100 },

    // Student 003: S1 pass mark (20, 20, 40), S2 1 mark below pass (20, 20, 38), S3 comfortable (35, 35, 70)
    { usn: '4PM23TST003', sub: 'TST501', type: 'internal1', marks: 20, max: 50 },
    { usn: '4PM23TST003', sub: 'TST501', type: 'internal2', marks: 20, max: 50 },
    { usn: '4PM23TST003', sub: 'TST501', type: 'external',  marks: 40, max: 100 },

    { usn: '4PM23TST003', sub: 'TST502', type: 'internal1', marks: 20, max: 50 },
    { usn: '4PM23TST003', sub: 'TST502', type: 'internal2', marks: 20, max: 50 },
    { usn: '4PM23TST003', sub: 'TST502', type: 'external',  marks: 38, max: 100 },

    { usn: '4PM23TST003', sub: 'TST503', type: 'internal1', marks: 35, max: 50 },
    { usn: '4PM23TST003', sub: 'TST503', type: 'internal2', marks: 35, max: 50 },
    { usn: '4PM23TST003', sub: 'TST503', type: 'external',  marks: 70, max: 100 },

    // Student 004: S1 all zeros (0, 0, 0), S2 normal (30, 30, 60), S3 no scripts
    { usn: '4PM23TST004', sub: 'TST501', type: 'internal1', marks: 0, max: 50 },
    { usn: '4PM23TST004', sub: 'TST501', type: 'internal2', marks: 0, max: 50 },
    { usn: '4PM23TST004', sub: 'TST501', type: 'external',  marks: 0, max: 100 },

    { usn: '4PM23TST004', sub: 'TST502', type: 'internal1', marks: 30, max: 50 },
    { usn: '4PM23TST004', sub: 'TST502', type: 'internal2', marks: 30, max: 50 },
    { usn: '4PM23TST004', sub: 'TST502', type: 'external',  marks: 60, max: 100 }

    // Student 005: no scripts
  ];

  console.log(`Seeding ${scriptPlan.length} answer scripts...`);
  let createdCount = 0;

  for (const item of scriptPlan) {
    const st = sMap[item.usn];
    if (!st) throw new Error(`Student ${item.usn} not found`);

    const ex = examMap[item.sub]?.[item.type];
    if (!ex) throw new Error(`Exam for ${item.sub} ${item.type} not found`);

    const script = await AnswerScript.create({
      studentId: st._id,
      examId: ex._id,
      subjectId: ex.subjectId,
      evaluatorId: faculty._id,
      status: 'evaluated',
      marksObtained: item.marks,
      maxMarks: item.max,
      evaluatedAt: new Date(),
      isLocked: false,
      isResultStale: false
    });

    trackRecord('scripts', script._id);
    createdCount++;
  }

  console.log(`Successfully created and tracked ${createdCount} evaluated AnswerScripts.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error seeding scripts:', err);
  process.exit(1);
});
