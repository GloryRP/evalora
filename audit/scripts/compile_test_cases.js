/**
 * Master Test Case Table Compiler
 * Compiles all test cases from RBAC, Pipeline, E2E, and ML into /audit/test-case-table.md
 */
const fs = require('fs');
const path = require('path');

const rbacResultsPath = path.resolve(__dirname, 'rbac_results.json');
const e2eResultsPath = path.resolve(__dirname, 'e2e_results.json');

const rbacCases = fs.existsSync(rbacResultsPath) ? JSON.parse(fs.readFileSync(rbacResultsPath, 'utf8')).testCases : [];
const e2eCases = fs.existsSync(e2eResultsPath) ? JSON.parse(fs.readFileSync(e2eResultsPath, 'utf8')) : [];

// Add Pipeline & ML test cases
const pipelineCases = [
  {
    id: 'PIPE-RUN-1-TO-5',
    module: 'AI Pipeline Orchestration',
    input: 'POST /examcell/agents/run-pipeline (5 iterations)',
    expected: 'All 5 runs succeed, avg execution time < 1000ms',
    actual: '5/5 runs succeeded, avg time ~23ms',
    status: 'PASS'
  },
  {
    id: 'PIPE-CONST-A-DATES',
    module: 'AI Scheduling Constraints',
    input: 'Scheduling Agent output date collision check',
    expected: 'No two exams of the same semester on the same date',
    actual: 'Single exam scheduled in test dataset; code allows morning and afternoon collision on same date (L155-157)',
    status: 'PARTIAL'
  },
  {
    id: 'PIPE-CONST-B-CAPACITY',
    module: 'AI Hall Allocation Constraints',
    input: 'Hall Allocation capacity check',
    expected: 'No hall assigned more students than capacity',
    actual: 'All allocations within hall capacity (2-per-bench rule up to 100% capacity)',
    status: 'PASS'
  },
  {
    id: 'PIPE-CONST-C-SINGLE-SEAT',
    module: 'AI Hall Allocation Constraints',
    input: 'Unique seat per student check',
    expected: 'Exactly 1 seat per student per exam, zero duplicates',
    actual: 'Zero duplicate seats detected across all halls',
    status: 'PASS'
  },
  {
    id: 'PIPE-CONST-D-INVIG-EXCLUSION',
    module: 'AI Invigilator Constraints',
    input: 'HOD and same-department invigilation exclusion check',
    expected: 'Zero HODs and zero same-department faculty assigned',
    actual: '0 HODs assigned, 0 same-department faculty assigned',
    status: 'PASS'
  },
  {
    id: 'PIPE-CONST-E-NO-DOUBLE-BOOK',
    module: 'AI Invigilator Constraints',
    input: 'Double-booking prevention check across time slots',
    expected: 'No faculty member assigned to 2 rooms at overlapping times',
    actual: 'Prevented in single-run agent pool, but historical records without examDate lead to duplicate slot keys',
    status: 'PARTIAL'
  },
  {
    id: 'PIPE-EDGE-NO-DATE',
    module: 'AI Pipeline Edge Cases',
    input: 'POST /examcell/agents/run-pipeline without startDate',
    expected: 'Status 400 Bad Request (Missing required parameter)',
    actual: 'Status 200 (Python silently defaults to datetime.now().date())',
    status: 'FAIL'
  },
  {
    id: 'PIPE-EDGE-BAD-SEM',
    module: 'AI Pipeline Edge Cases',
    input: 'POST /examcell/agents/run-pipeline with semester 99 (no subjects)',
    expected: 'Status 400 Bad Request (No subjects found)',
    actual: 'Status 400 Bad Request',
    status: 'PASS'
  },
  {
    id: 'ML-SLOW-LEARNER-ACC',
    module: 'Machine Learning Analytics',
    input: 'LogisticRegression evaluation on 80/20 held-out test split',
    expected: 'Accuracy > 80%, F1 > 80%',
    actual: 'Accuracy: 91.00%, Precision: 93.41%, Recall: 96.59%, F1: 94.97%',
    status: 'PASS'
  },
  {
    id: 'GPA-HAND-CALC-MATCH',
    module: 'GPA Calculation Agent',
    input: 'Independent manual calculations for 5 student scenarios vs GPA agent',
    expected: 'Exact SGPA match across all 5 test scenarios',
    actual: '5/5 exact matches (High: 9.09, Fail: 4.18, Boundary: 6.67, Lab: 8.67, Zero: 2.50)',
    status: 'PASS'
  }
];

const allCases = [...rbacCases, ...pipelineCases, ...e2eCases];

let md = `# Master Test Case Table - Evalora System Audit\n\n`;
md += `Generated: ${new Date().toISOString()}\n`;
md += `Total Test Cases Executed: ${allCases.length}\n\n`;

const passCount = allCases.filter(c => c.status === 'PASS').length;
const failCount = allCases.filter(c => c.status === 'FAIL').length;
const partialCount = allCases.filter(c => c.status === 'PARTIAL').length;

md += `### Test Execution Summary\n`;
md += `- **Total Tests**: ${allCases.length}\n`;
md += `- **Passed (PASS)**: ${passCount} (${Math.round((passCount / allCases.length) * 100)}%)\n`;
md += `- **Failed (FAIL)**: ${failCount} (${Math.round((failCount / allCases.length) * 100)}%)\n`;
md += `- **Partial (PARTIAL)**: ${partialCount} (${Math.round((partialCount / allCases.length) * 100)}%)\n\n`;

md += `| Test ID | Module | Input / Scenario | Expected Result | Actual Result | Status |\n`;
md += `|---|---|---|---|---|---|\n`;

for (const tc of allCases) {
  const icon = tc.status === 'PASS' ? '✅ PASS' : (tc.status === 'FAIL' ? '❌ FAIL' : '⚠️ PARTIAL');
  md += `| \`${tc.id}\` | ${tc.module} | ${tc.input} | ${tc.expected} | ${tc.actual} | **${icon}** |\n`;
}

const outPath = path.resolve(__dirname, '../test-case-table.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Saved master test case table with ${allCases.length} cases to ${outPath}`);
