const path = require('path');
module.paths.push(path.join(__dirname, '../../../server/node_modules'));
const fs = require('fs');

// We simulate what resultController.js does when internal2 is missing:
// Example: Student has internal1 = 40 (out of 50), external = 80 (out of 100), but internal2 is absent/not uploaded.
const internal1 = 40;
const internal2 = undefined; // Missing script
const external = 80;

// In resultController.js lines 273-275:
const subRecord = {
  internal1: 0,
  internal2: 0,
  external: 0
};

subRecord.internal1 = internal1;
if (internal2 !== undefined) {
  subRecord.internal2 = internal2;
}
subRecord.external = external;

// lines 299-304:
const cie = (subRecord.internal1 + subRecord.internal2) / 2;
const seeScaled = subRecord.external / 2;
const finalScore = cie + seeScaled;

const resultData = {
  test: 'Test B: Missing Internal 2 Script',
  inputs: {
    internal1: 40,
    internal2: 'MISSING / NOT SUBMITTED',
    external: 80
  },
  systemBehavior: {
    errorThrown: false,
    skipped: false,
    defaultedToZero: true,
    codeLocation: 'server/controllers/resultController.js:274',
    internal2ValueUsed: subRecord.internal2,
    cieCalculated: cie,
    expectedCIEIfOnlyInt1OrBestOf: 40,
    seeScaled: seeScaled,
    finalScore: finalScore,
    maxMarks: 100
  },
  auditFindings: {
    issue: 'Silent zero default for missing internal exam',
    description: 'When a student is missing Internal 2 (due to absence, medical exemption, or delayed faculty evaluation), the system does NOT throw an error, does NOT skip the subject, and does NOT flag the incomplete state. Instead, line 274 silently leaves internal2 as 0. This results in the student CIE being calculated as (40 + 0) / 2 = 20/50 instead of 40/50.',
    isMisleadingToStudent: true,
    studentImpact: 'The student sees a reduced final score of 60/100 instead of 80/100, without any notification that an entire internal assessment was recorded as zero. On the student result card, it appears as a legitimate B+ grade rather than an incomplete result requiring exam cell inquiry.'
  }
};

fs.writeFileSync(path.join(__dirname, '../test_b_result.json'), JSON.stringify(resultData, null, 2));
console.log('Test B completed:');
console.log(JSON.stringify(resultData, null, 2));
