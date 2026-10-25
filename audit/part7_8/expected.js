const fs = require('fs');
const path = require('path');

// Load active grading scheme dumped from MongoDB
const schemePath = path.join(__dirname, 'active_scheme.json');
const activeScheme = JSON.parse(fs.readFileSync(schemePath, 'utf8'));

const passMarkPercentage = activeScheme.passMarkPercentage || 40;
const gradeTable = activeScheme.gradeTable;

function getGradeInfo(percentage) {
  for (const row of gradeTable) {
    if (percentage >= row.minPercentage && percentage <= row.maxPercentage) {
      return { grade: row.grade, gradePoint: row.gradePoint, description: row.description };
    }
  }
  return { grade: 'F', gradePoint: 0, description: 'Fail' };
}

function computeSubject(subCode, subName, credits, int1, int2, ext) {
  // If int2 is undefined/null, Node initializes to 0
  const i1 = int1 !== undefined && int1 !== null ? int1 : 0;
  const i2 = int2 !== undefined && int2 !== null ? int2 : 0;
  const e = ext !== undefined && ext !== null ? ext : 0;

  const cie = (i1 + i2) / 2;
  const see = e / 2;
  const finalMarks = Math.round((cie + see) * 100) / 100;
  const percentage = Math.round((finalMarks / 100) * 10000) / 100; // maxMarks = 100

  const gradeInfo = getGradeInfo(percentage);
  const isPassed = percentage >= passMarkPercentage && gradeInfo.grade !== 'F';

  // Check rules the code does NOT apply:
  const separateSeeMinimum = e >= 35; // VTU standard: min 35/100 or 18/50 in SEE
  const ruleOmissions = [];
  if (e < 35 && isPassed) {
    ruleOmissions.push('VTU SEE separate minimum (min 35/100 or 18/50) NOT applied by system');
  }

  return {
    subjectCode: subCode,
    subjectName: subName,
    credits,
    internal1: int1,
    internal2: int2,
    external: ext,
    cie,
    see,
    marksObtained: finalMarks,
    maxMarks: 100,
    percentage,
    grade: gradeInfo.grade,
    gradePoint: gradeInfo.gradePoint,
    gradePointsEarned: gradeInfo.gradePoint * credits,
    isPassed,
    result: isPassed ? 'PASS' : 'FAIL',
    ruleOmissions
  };
}

function computeStudentSemester(usn, name, semester, subjectsInput, previousPublishedResults = []) {
  const subjectResults = [];
  let totalCredits = 0;
  let totalGradePoints = 0;
  let hasFailed = false;

  for (const s of subjectsInput) {
    const res = computeSubject(s.subjectCode, s.subjectName, s.credits, s.int1, s.int2, s.ext);
    subjectResults.push(res);
    totalCredits += s.credits;
    totalGradePoints += res.gradePointsEarned;
    if (!res.isPassed) {
      hasFailed = true;
    }
  }

  const sgpa = totalCredits > 0 ? Math.round((totalGradePoints / totalCredits) * 100) / 100 : 0;
  const overallResult = (subjectResults.length > 0 && !hasFailed) ? 'PASS' : 'FAIL';

  // Compute CGPA
  let cumPoints = totalGradePoints;
  let cumCredits = totalCredits;
  for (const prev of previousPublishedResults) {
    cumPoints += prev.totalGradePoints || 0;
    cumCredits += prev.totalCredits || 0;
  }
  const cgpa = cumCredits > 0 ? Math.round((cumPoints / cumCredits) * 100) / 100 : 0;

  return {
    usn,
    name,
    semester,
    subjectResults,
    totalCredits,
    totalGradePoints,
    sgpa,
    cgpa,
    overallResult
  };
}

// Expected calculations for Semester 4:
const sem4_001 = computeStudentSemester('4PM23TST001', 'Test Student 001', 4, [
  { subjectCode: 'TST401', subjectName: 'Engineering Mathematics IV', credits: 4, int1: 40, int2: 40, ext: 80 }
]);

const sem4_002 = computeStudentSemester('4PM23TST002', 'Test Student 002', 4, [
  { subjectCode: 'TST401', subjectName: 'Engineering Mathematics IV', credits: 4, int1: 30, int2: 30, ext: 60 }
]);

// Expected calculations for Semester 5:
// Student 001
const sem5_001 = computeStudentSemester('4PM23TST001', 'Test Student 001', 5, [
  { subjectCode: 'TST501', subjectName: 'Software Engineering', credits: 4, int1: 46, int2: 44, ext: 92 },
  { subjectCode: 'TST502', subjectName: 'Computer Networks', credits: 3, int1: 45, int2: 47, ext: 90 },
  { subjectCode: 'TST503', subjectName: 'Database Management Systems', credits: 2, int1: 48, int2: 46, ext: 94 }
], [sem4_001]);

// Student 002
const sem5_002 = computeStudentSemester('4PM23TST002', 'Test Student 002', 5, [
  { subjectCode: 'TST501', subjectName: 'Software Engineering', credits: 4, int1: 31, int2: 29, ext: 60 },
  { subjectCode: 'TST502', subjectName: 'Computer Networks', credits: 3, int1: 28, int2: 30, ext: 58 },
  { subjectCode: 'TST503', subjectName: 'Database Management Systems', credits: 2, int1: 35, int2: 33, ext: 70 }
], [sem4_002]);

// Student 003:
// S1 exactly at pass mark: (20, 20, 40) -> CIE=20, SEE=20, Final=40 -> 40% -> Grade P (4 GP), PASS
// S2 exactly 1 mark below pass mark: (20, 20, 38) -> CIE=20, SEE=19, Final=39 -> 39% -> Grade F (0 GP), FAIL
// S3 comfortable: (35, 35, 70) -> CIE=35, SEE=35, Final=70 -> 70% -> Grade A (8 GP), PASS
const sem5_003 = computeStudentSemester('4PM23TST003', 'Test Student 003', 5, [
  { subjectCode: 'TST501', subjectName: 'Software Engineering', credits: 4, int1: 20, int2: 20, ext: 40 },
  { subjectCode: 'TST502', subjectName: 'Computer Networks', credits: 3, int1: 20, int2: 20, ext: 38 },
  { subjectCode: 'TST503', subjectName: 'Database Management Systems', credits: 2, int1: 35, int2: 35, ext: 70 }
]);

// Student 004:
// S1 all zeros (0, 0, 0) -> CIE=0, SEE=0, Final=0 -> F, FAIL
// S2 normal (30, 30, 60) -> CIE=30, SEE=30, Final=60 -> B+ (7 GP), PASS
// S3 no scripts at all -> S3 omitted from subjects
const sem5_004 = computeStudentSemester('4PM23TST004', 'Test Student 004', 5, [
  { subjectCode: 'TST501', subjectName: 'Software Engineering', credits: 4, int1: 0, int2: 0, ext: 0 },
  { subjectCode: 'TST502', subjectName: 'Computer Networks', credits: 3, int1: 30, int2: 30, ext: 60 }
]);

// Student 005:
// No scripts at all -> empty subjects array
const sem5_005 = computeStudentSemester('4PM23TST005', 'Test Student 005', 5, []);

// Special Test b: Student with Internal 1 and External marks, but no Internal 2
// For example: int1 = 30, int2 = null/missing, ext = 60
// Expected in system: int2 defaults to 0 -> CIE = (30+0)/2 = 15, SEE = 30, Final = 45 -> Grade P (4 GP), PASS
const testB_missingInt2 = computeSubject('TST501', 'Software Engineering', 4, 30, null, 60);

const expectedData = {
  activeScheme: {
    schemeName: activeScheme.schemeName,
    passMarkPercentage: activeScheme.passMarkPercentage
  },
  semester4: {
    '4PM23TST001': sem4_001,
    '4PM23TST002': sem4_002
  },
  semester5: {
    '4PM23TST001': sem5_001,
    '4PM23TST002': sem5_002,
    '4PM23TST003': sem5_003,
    '4PM23TST004': sem5_004,
    '4PM23TST005': sem5_005
  },
  specialCaseMissingInternal2: testB_missingInt2,
  systemRuleOmissionsReport: [
    {
      rule: 'VTU Separate SEE Minimum',
      description: 'VTU regulations mandate minimum 35% in SEE (Semester End Exam) independently of CIE to pass the subject. The system code checks only composite finalScore >= passMarkPercentage.',
      sourceLocation: 'server/controllers/resultController.js lines 298-314 and ai-service/agents/gpa_agent.py lines 84-86'
    },
    {
      rule: 'Missing Internal Evaluation Handling',
      description: 'If a student is missing Internal 2, the system initializes internal2 = 0 without error or warning, cutting the student CIE by 50% rather than flagging an incomplete record.',
      sourceLocation: 'server/controllers/resultController.js line 274'
    }
  ]
};

fs.writeFileSync(path.join(__dirname, 'expected_results.json'), JSON.stringify(expectedData, null, 2));
console.log('Successfully generated expected_results.json');
console.log('Sem 4 Student 001 SGPA:', sem4_001.sgpa, 'CGPA:', sem4_001.cgpa);
console.log('Sem 4 Student 002 SGPA:', sem4_002.sgpa, 'CGPA:', sem4_002.cgpa);
console.log('Sem 5 Student 001 SGPA:', sem5_001.sgpa, 'CGPA:', sem5_001.cgpa, 'Overall:', sem5_001.overallResult);
console.log('Sem 5 Student 002 SGPA:', sem5_002.sgpa, 'CGPA:', sem5_002.cgpa, 'Overall:', sem5_002.overallResult);
console.log('Sem 5 Student 003 SGPA:', sem5_003.sgpa, 'CGPA:', sem5_003.cgpa, 'Overall:', sem5_003.overallResult);
console.log('Sem 5 Student 004 SGPA:', sem5_004.sgpa, 'CGPA:', sem5_004.cgpa, 'Overall:', sem5_004.overallResult);
console.log('Sem 5 Student 005 SGPA:', sem5_005.sgpa, 'CGPA:', sem5_005.cgpa, 'Overall:', sem5_005.overallResult);
console.log('Special Test B (Missing Int 2): Final Marks:', testB_missingInt2.marksObtained, 'Grade:', testB_missingInt2.grade);
