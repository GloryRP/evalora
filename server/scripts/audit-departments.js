/**
 * AUDIT SCRIPT — READ ONLY, no writes
 * Reports every distinct department string across all collections.
 * Run: node server/scripts/audit-departments.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

async function audit() {
  await mongoose.connect(process.env.MONGO_URI);

  const Student    = require('../models/Student');
  const Faculty    = require('../models/Faculty');
  const Subject    = require('../models/Subject');
  const Department = require('../models/Department');
  const User       = require('../models/User');

  console.log('\n=== DEPARTMENT COLLECTION (source of truth) ===');
  const depts = await Department.find({}).lean();
  if (depts.length === 0) {
    console.log('  (empty — no departments seeded yet)');
  } else {
    depts.forEach(d =>
      console.log(`  _id: ${d._id} | code: ${d.departmentCode} | name: "${d.departmentName}" | aliases: ${JSON.stringify(d.aliases || [])}`)
    );
  }

  console.log('\n=== DISTINCT department VALUES IN Student ===');
  const studentDepts = await Student.distinct('department');
  if (studentDepts.length === 0) console.log('  (none)');
  studentDepts.sort().forEach(d => console.log(`  "${d}"`));

  console.log('\n=== DISTINCT department VALUES IN Faculty ===');
  const facultyDepts = await Faculty.distinct('department');
  if (facultyDepts.length === 0) console.log('  (none)');
  facultyDepts.sort().forEach(d => console.log(`  "${d}"`));

  console.log('\n=== DISTINCT department VALUES IN Subject ===');
  const subjectDepts = await Subject.distinct('department');
  if (subjectDepts.length === 0) console.log('  (none)');
  subjectDepts.sort().forEach(d => console.log(`  "${d}"`));

  console.log('\n=== DISTINCT department VALUES IN User ===');
  const userDepts = await User.distinct('department');
  if (userDepts.length === 0) console.log('  (none)');
  userDepts.sort().forEach(d => console.log(`  "${d}"`));

  const allValues = new Set([
    ...studentDepts,
    ...facultyDepts,
    ...subjectDepts,
    ...userDepts,
  ]);

  console.log('\n=== CROSS-COLLECTION MISMATCH REPORT ===');
  const deptNames  = depts.map(d => d.departmentName);
  const deptCodes  = depts.map(d => d.departmentCode);
  const deptAliases = depts.flatMap(d => d.aliases || []);

  let unmatchedCount = 0;
  for (const val of [...allValues].sort()) {
    const exactMatch = deptNames.includes(val);
    const codeMatch  = deptCodes.includes(val.toUpperCase());
    const aliasMatch = deptAliases.includes(val);
    const status = exactMatch ? 'OK  exact name match'
                 : codeMatch  ? 'OK  code match'
                 : aliasMatch ? 'OK  alias match'
                 : 'MISSING — no match in Department collection';
    if (!exactMatch) unmatchedCount++;
    console.log(`  "${val}" => ${status}`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`  Department collection entries : ${depts.length}`);
  console.log(`  Total distinct strings in data: ${allValues.size}`);
  console.log(`  Not matching canonical name   : ${unmatchedCount}`);

  await mongoose.disconnect();
}

audit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
