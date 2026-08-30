/**
 * MIGRATION SCRIPT — normalize department strings across all collections.
 *
 * ⚠️  DO NOT RUN THIS AUTOMATICALLY.
 * ⚠️  BACK UP YOUR DATABASE FIRST before running.
 * ⚠️  Run seed-department-aliases.js FIRST so aliases are populated.
 *
 * Run: node server/scripts/normalize-departments.js
 *
 * What it does:
 *   - Reads every Student, Faculty, Subject, and User document
 *     that has a non-empty `department` field
 *   - Calls resolveDepartment() to find the canonical departmentName
 *   - If the stored value already IS the canonical name → skips (no write)
 *   - If a canonical name is found and differs → updates the field
 *   - If no canonical name can be found → prints an UNRESOLVED warning (no write)
 *
 * System-role values ("Administration", "Examination Cell") will be reported
 * as UNRESOLVED — that is intentional and correct; do not map them.
 *
 * Dry-run mode (prints changes without writing):
 *   DRY_RUN=1 node server/scripts/normalize-departments.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const resolveDepartment = require('../utils/resolveDepartment');

const DRY_RUN = process.env.DRY_RUN === '1';

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — no changes will be written.\n');
  }

  const Student = require('../models/Student');
  const Faculty = require('../models/Faculty');
  const Subject = require('../models/Subject');
  const User    = require('../models/User');

  // System-role department strings that are intentionally NOT academic departments.
  // These will be left as-is and NOT reported as errors.
  const SYSTEM_DEPT_STRINGS = new Set(['Administration', 'Examination Cell']);

  const collections = [
    { model: Student, name: 'Student',  field: 'department' },
    { model: Faculty, name: 'Faculty',  field: 'department' },
    { model: Subject, name: 'Subject',  field: 'department' },
    { model: User,    name: 'User',     field: 'department' },
  ];

  const allUnresolved = [];

  for (const { model, name, field } of collections) {
    const docs = await model.find({ [field]: { $exists: true, $ne: '' } }).lean();

    let unchanged = 0;
    let fixed = 0;
    const unresolved = [];

    for (const doc of docs) {
      const current = doc[field];

      // Skip intentional system-role strings
      if (SYSTEM_DEPT_STRINGS.has(current)) {
        unchanged++;
        continue;
      }

      const resolved = await resolveDepartment(current);

      if (!resolved) {
        unresolved.push({ id: doc._id, currentValue: current });
        continue;
      }

      if (current === resolved.departmentName) {
        // Already canonical — nothing to do
        unchanged++;
        continue;
      }

      // Needs update
      console.log(`  [${name}] ${doc._id}: "${current}" → "${resolved.departmentName}"`);
      if (!DRY_RUN) {
        await model.findByIdAndUpdate(doc._id, { [field]: resolved.departmentName });
      }
      fixed++;
    }

    console.log(`\n${name}: ${fixed} normalized, ${unchanged} already correct/skipped`);
    if (unresolved.length > 0) {
      console.log(`${name}: ${unresolved.length} UNRESOLVED (no Department match found):`);
      unresolved.forEach(u =>
        console.log(`  - ${u.id}: "${u.currentValue}"`)
      );
      allUnresolved.push(...unresolved.map(u => ({ collection: name, ...u })));
    }
  }

  console.log('\n══════════════════════════════════════════');
  if (DRY_RUN) {
    console.log('DRY RUN complete — no data was modified.');
  } else {
    console.log('Migration complete.');
  }

  if (allUnresolved.length > 0) {
    console.log(`\n⚠️  ${allUnresolved.length} UNRESOLVED records need manual review:`);
    allUnresolved.forEach(u =>
      console.log(`  ${u.collection} ${u.id}: "${u.currentValue}"`)
    );
    console.log('\nAdd the missing alias to the correct Department document,');
    console.log('then re-run this script to resolve them.');
  } else {
    console.log('✓ All records resolved — no unresolved entries.');
  }

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
