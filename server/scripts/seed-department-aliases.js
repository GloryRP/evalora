/**
 * SEED ALIASES — run once after audit, before the migration.
 * Adds the `aliases` array to each Department document based on
 * the distinct values found in the audit-departments.js output.
 *
 * Run: node server/scripts/seed-department-aliases.js
 *
 * This script is IDEMPOTENT — running it twice is safe.
 * It uses $addToSet so existing aliases are never duplicated.
 *
 * Audit findings that drove this mapping:
 *
 *  Department Collection (5 entries):
 *    CSE  → "Computer Science and Engineering"
 *    CSDS → "Computer Science (Data Science)"
 *    ECE  → "Electronics and Communication"
 *    ME   → "Mechanical Engineering"
 *    CV   → "Civil"
 *
 *  Distinct strings found across Student / Faculty / Subject / User:
 *    "CSDS"                            → maps to CSDS
 *    "Computer Science"                → maps to CSE  (best guess — review if wrong)
 *    "Computer Science and Data Science" → maps to CSDS
 *    "Data Science"                    → maps to CSDS
 *    "Electronics"                     → maps to ECE
 *    "Mechanical"                      → maps to ME
 *    "Computer Science (Data Science)" → canonical name (no alias needed)
 *    "Computer Science and Engineering"→ canonical name (no alias needed)
 *    "Electronics and Communication"   → canonical name (no alias needed)
 *
 *  System-role strings NOT mapped to any department:
 *    "Administration"   — admin/examcell system users, not a real academic dept
 *    "Examination Cell" — same
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ALIAS_MAP = [
  {
    code: 'CSE',
    aliases: [
      'Computer Science and Engineering',
      'Computer Science',        // seen in Student, Faculty, Subject
      'CSE',
    ],
  },
  {
    code: 'CSDS',
    aliases: [
      'Computer Science (Data Science)',
      'CSDS',
      'Computer Science and Data Science',  // seen in Subject
      'Computer Science Data Science',
      'CS (Data Science)',
      'Data Science',                       // seen in Subject
    ],
  },
  {
    code: 'ECE',
    aliases: [
      'Electronics and Communication',
      'ECE',
      'Electronics',                        // seen in Student, Faculty, Subject, User
      'Electronics & Communication',
    ],
  },
  {
    code: 'ME',
    aliases: [
      'Mechanical Engineering',
      'ME',
      'Mechanical',                         // seen in Faculty, User
    ],
  },
  {
    code: 'CV',
    aliases: [
      'Civil',
      'CV',
      'Civil Engineering',
    ],
  },
];

async function seedAliases() {
  await mongoose.connect(process.env.MONGO_URI);
  const Department = require('../models/Department');

  let updated = 0;
  let skipped = 0;

  for (const entry of ALIAS_MAP) {
    const dept = await Department.findOne({ departmentCode: entry.code });
    if (!dept) {
      console.log(`  SKIP — no Department found with code "${entry.code}"`);
      skipped++;
      continue;
    }

    // Use $addToSet to avoid duplicating existing values
    await Department.findByIdAndUpdate(dept._id, {
      $addToSet: { aliases: { $each: entry.aliases } },
    });

    // Re-fetch to show the final state
    const updated_doc = await Department.findById(dept._id);
    console.log(`  UPDATED ${entry.code} | aliases: ${JSON.stringify(updated_doc.aliases)}`);
    updated++;
  }

  console.log(`\nDone. ${updated} departments updated, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seedAliases().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
