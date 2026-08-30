/**
 * resolveDepartment(inputString)
 * ─────────────────────────────────────────────────────────────────────────────
 * Takes ANY department string (however it was typed / stored / imported) and
 * resolves it to the correct canonical Department document.
 *
 * Resolution order:
 *   1. Exact match on departmentName          (fastest, most common path)
 *   2. Exact match on departmentCode          (upper-cased)
 *   3. Exact match inside aliases array       (case-sensitive)
 *   4. Case-insensitive match inside aliases  (fallback)
 *
 * Returns: the matched Department Mongoose document, or null if nothing matches.
 *
 * NOTE: "Administration" and "Examination Cell" are intentionally NOT mapped —
 * those are system-role departments for admin/examcell users, not real academic
 * departments. They will return null and should be handled by callers.
 */
const Department = require('../models/Department');

async function resolveDepartment(inputString) {
  if (!inputString || typeof inputString !== 'string') return null;

  const trimmed = inputString.trim();
  if (!trimmed) return null;

  // 1. Exact match on departmentName
  let dept = await Department.findOne({ departmentName: trimmed });
  if (dept) return dept;

  // 2. Exact match on departmentCode (case-insensitive)
  dept = await Department.findOne({ departmentCode: trimmed.toUpperCase() });
  if (dept) return dept;

  // 3. Exact alias match (case-sensitive first for speed)
  dept = await Department.findOne({ aliases: trimmed });
  if (dept) return dept;

  // 4. Case-insensitive alias match as final fallback
  // Escape regex special chars to be safe
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  dept = await Department.findOne({
    aliases: { $regex: new RegExp(`^${escaped}$`, 'i') },
  });
  if (dept) return dept;

  return null;
}

module.exports = resolveDepartment;
