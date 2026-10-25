# Fix Report: Incomplete-Marks Resolution & Results Integrity (Part 7 & Part 8)

**System**: Evalora (Agentic AI-Based Examination Automation and Evaluation System)  
**Date**: October 25, 2026  
**Auditor/Engineer**: Quality Assurance & Systems Team  
**Scope**: Minimal-change fix for the incomplete-marks problem in result computation, GPA agent evaluation, result publishing workflows, and student/exam cell result views. Zero git commands used. Grading scheme and grade boundaries preserved without change.

---

## 1. Executive Summary

In the baseline implementation of Evalora, missing assessments (e.g., absent Internal 2, unsubmitted External, or delayed faculty evaluations) were silently defaulted to `0` at [`server/controllers/resultController.js:274`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/server/controllers/resultController.js#L274). This caused severe distortions:
1. An absent Internal 2 halved the Continuous Internal Evaluation (CIE) score without any warning or indication, misleading students with an artificially deflated final grade (e.g., showing a legitimate B+ grade instead of flagging an incomplete assessment).
2. Students with missing assessments were published alongside completed students.
3. Incomplete subjects had their credits factored into the SGPA and CGPA denominators, depressing student GPAs.

### Summary of Fix
We implemented a surgical, minimal-change architecture fix across the computation pipeline:
1. **No Silent Zero Defaults**: In [`server/controllers/resultController.js`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/server/controllers/resultController.js), missing Internal 1, Internal 2, or External marks are recorded as `null`. Any subject with any missing assessment is flagged `isIncomplete: true` with a list of `missingAssessments`.
2. **GPA Agent Exclusions**: In [`ai-service/agents/gpa_agent.py`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/ai-service/agents/gpa_agent.py), incomplete subjects are marked `grade: "Incomplete"`, `result: "INCOMPLETE"`, and excluded from total credits and grade points. The student is assigned `overallResult: "INCOMPLETE"` and `isProvisional: true`.
3. **GPA & CGPA Denominator Integrity**: Incomplete subjects do not penalize the student's SGPA or cumulative CGPA across semesters.
4. **Publish All Gatekeeper**: Exam Cell cannot "Publish All Results" while incomplete evaluations exist. A clear error lists the affected students and subjects.
5. **Publish Complete Results Only**: Exam Cell has an explicit option to publish complete results only, holding back incomplete records.
6. **Result Incomplete UI**: Both Exam Cell preview and Student Results screens display "Result incomplete" for affected subjects and mark the SGPA as "(Provisional)".

All **8 automated verification tests PASSED** with 100% database cleanup and zero database contamination.

---

## 2. Before vs After Comparison

| Workflow Aspect | Before Fix | After Fix |
|---|---|---|
| **Missing Assessment Handling** | Defaulted to `0` (`internal2: 0`, `external: 0`). | Stored as `null`. Subject flagged `isIncomplete: true` with `missingAssessments`. |
| **Missing Subject / Exam** | Missing subject omitted or defaulted, resulting in incorrect partial credits. | Detects missing semester subjects; flags all 3 assessments as missing. |
| **Grade Display** | Displays lowered letter grade (e.g., B+, C, F). | Displays **`Incomplete`** badge and **"Result incomplete"** status. Never a lower grade. |
| **SGPA Computation** | Incomplete subjects counted as 0 marks; credits included in denominator, artificially slashing SGPA. | Incomplete subjects excluded from credits & points. SGPA computed only on completed courses and flagged **`(Provisional)`**. |
| **CGPA Across Semesters** | Deflated by incomplete credits in denominator (e.g., 8.15 instead of 9.64). | Cumulative credits exclude incomplete courses. True cumulative performance preserved (9.64 Provisional). |
| **Compute Response** | No incomplete tracking (`hasIncompleteResults` absent). | Returns `incompleteStudents` list with USN, name, subject code, and specific missing assessments. |
| **Publish All Action** | Allowed publishing incomplete results to students without warning. | **BLOCKED (HTTP 400)** with clear list of incomplete students and subjects. |
| **Publish Complete Only** | Not supported. | **Supported (`publishCompleteOnly: true`)**: Publishes complete students, withholds incomplete records. |
| **Student Portal View** | Confusing: student sees reduced grade with no explanation. | Clear: student sees "Result incomplete" and "SGPA: X.XX (Provisional — excludes incomplete subjects)". |

---

## 3. Mathematical Verification: CGPA with Incomplete Subject

### Scenario
- **Semester 4 (Published)**: 1 subject (`TST401`, 4 credits). Student scored (40, 40, 80) $\to$ Final 80/100, Grade A+ (Grade Point = 9).
  - Sem 4 Grade Points = $4 \times 9 = 36$
  - Sem 4 Credits = $4$
  - Sem 4 SGPA = $\frac{36}{4} = 9.00$
- **Semester 5**: 3 subjects:
  - `TST501` (4 credits): (45, 45, 90) $\to$ Final 90/100, Grade O (GP = 10) $\to 40$ points
  - `TST502` (3 credits): (45, 45, 90) $\to$ Final 90/100, Grade O (GP = 10) $\to 30$ points
  - `TST503` (2 credits): Incomplete (missing External evaluation)

### Calculation Comparison
$$\begin{aligned}
\text{Before Fix (Defective):} \quad & \text{TST503 External defaulted to } 0 \implies \text{Final} = 20 + 0 = 20 \implies \text{Grade F} (0 \text{ GP}) \\
& \text{Sem 5 SGPA} = \frac{40 + 30 + 0}{4 + 3 + 2} = \frac{70}{9} = 7.78 \quad (\text{Artificially lowered}) \\
& \text{CGPA} = \frac{36 + 70}{4 + 9} = \frac{106}{13} = \mathbf{8.15} \quad (\text{Severely penalizes student by } 1.49 \text{ GP})
\end{aligned}$$

$$\begin{aligned}
\text{After Fix (Correct):} \quad & \text{TST503 marked "Incomplete" and excluded from denominator} \\
& \text{Sem 5 Completed Credits} = 4 + 3 = 7 \\
& \text{Sem 5 Completed Points} = 40 + 30 = 70 \\
& \text{Sem 5 Provisional SGPA} = \frac{70}{7} = \mathbf{10.00 \text{ (Provisional)}} \\
& \text{Cumulative CGPA} = \frac{36 + 70}{4 + 7} = \frac{106}{11} = \mathbf{9.64 \text{ (Provisional)}}
\end{aligned}$$

---

## 4. Test Suite Execution & Verification Results

Automated test suite [`audit/part7_8/scripts/verify_fix_tests.js`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/part7_8/scripts/verify_fix_tests.js) was executed against the running system.

### Test Results Table

| Test ID | Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| `TEST-1-MISSING-INTERNAL-2` | Student `4PM23TST002` missing Internal 2 for `TST501` | `isIncomplete: true`, Grade: `Incomplete`, Result: `INCOMPLETE`, marks: `null`, excluded from credits (totalCredits: 5), Provisional SGPA: 9.00 | `isIncomplete: true`, Grade: `Incomplete`, Result: `INCOMPLETE`, marks: `null`, totalCredits: 5, SGPA: 9.00 | **PASS** |
| `TEST-2-MISSING-SUBJECT` | Student `4PM23TST003` enrolled in Sem 5 with 0 scripts for `TST503` | `TST503` marked `isIncomplete: true`, missing all 3 assessments, excluded from credits (totalCredits: 7), Provisional SGPA: 10.00 | `isIncomplete: true`, missing: `['Internal 1', 'Internal 2', 'External']`, totalCredits: 7, SGPA: 10.00 | **PASS** |
| `TEST-3-MISSING-EXTERNAL` | Student `4PM23TST004` missing External exam for `TST501` | `TST501` marked `isIncomplete: true`, missing External, excluded from credits, Provisional SGPA: 9.00 | `isIncomplete: true`, missing: `['External']`, totalCredits: 5, SGPA: 9.00 | **PASS** |
| `TEST-4-COMPLETE-STUDENT-UNCHANGED` | Student `4PM23TST001` with all assessments completed | All subjects complete, all Grade O, overall PASS, totalCredits: 9, SGPA: 10.00, CGPA: 9.69 (Unchanged results) | All subjects complete, Grade O, PASS, totalCredits: 9, SGPA: 10.00, CGPA: 9.69 | **PASS** |
| `TEST-5-CGPA-TWO-SEMESTERS-INCOMPLETE` | Student `4PM23TST005`: Sem 4 (4 cr, 36 pts) + Sem 5 (7 cr completed, 1 sub incomplete) | Incomplete sub excluded from denominator ($11$ credits, not $13$), Provisional CGPA = $106 / 11 = 9.64$ | Sem 5 credits: 7, total credits: 11, Sem 5 SGPA: 10.00, CGPA: 9.64, Provisional: true | **PASS** |
| `TEST-6-BLOCK-PUBLISH-ALL` | Attempting "Publish All Results" while cohort has incomplete evaluations | HTTP 400 Bad Request, `blockedByIncomplete: true`, message listing all students and incomplete subjects | HTTP 400, `blockedByIncomplete: true`, message: *"Cannot publish all results: 4 student(s) have incomplete subject evaluations: 4PM23TST002 (TST501); 4PM23TST003 (TST503); 4PM23TST004 (TST501); 4PM23TST005 (TST503)..."* | **PASS** |
| `TEST-7-PUBLISH-COMPLETE-ONLY` | Publish with option `publishCompleteOnly: true` | HTTP 200 OK, publishes Student 001 only (count: 1), withholds incomplete students (heldBackCount: 4) | HTTP 200, published: 1, heldBack: 4, Student 001 `isPublished: true`, Students 002-005 `isPublished: false` | **PASS** |
| `TEST-8-STUDENT-MY-RESULTS-VIEW` | Student 001 accesses `/api/v1/results/my-results` | HTTP 200, returns Sem 5 with SGPA 10.00, CGPA 9.69, overall PASS | HTTP 200, Sem 5 SGPA 10.00, CGPA 9.69, overall PASS | **PASS** |

### Database Integrity Verification
- **Baseline Document Counts**:
  - `users`: 151, `students`: 135, `faculties`: 8, `subjects`: 14, `scripts`: 0, `results`: 0, `notifications`: 287
- **Post-Test Cleanup Document Counts**:
  - `users`: 151, `students`: 135, `faculties`: 8, `subjects`: 14, `scripts`: 0, `results`: 0, `notifications`: 287
- **Database Status**: **100% CLEAN** (Zero orphaned records or contamination).

---

## 5. Files Changed

Every file modified for this fix is cataloged below:

### 1. [`server/models/Result.js`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/server/models/Result.js)
- **Changes**:
  - Added `'INCOMPLETE'` to `subjectResultSchema.result` enum.
  - Added `isIncomplete: { type: Boolean, default: false }` and `missingAssessments: [{ type: String }]` to `subjectResultSchema`.
  - Added `'INCOMPLETE'` and `'PROVISIONAL'` to `resultSchema.overallResult` enum.
  - Added `isProvisional: { type: Boolean, default: false }` and `hasIncompleteSubjects: { type: Boolean, default: false }` to `resultSchema`.

### 2. [`ai-service/agents/gpa_agent.py`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/ai-service/agents/gpa_agent.py)
- **Changes**:
  - Checked `sub.get("isIncomplete")` at the beginning of each subject evaluation.
  - Formatted incomplete subject results with `grade: "Incomplete"`, `result: "INCOMPLETE"`, and `None` for marks/percentage/gradePoint.
  - Bypassed adding incomplete subject credits and grade points into `total_credits` and `total_grade_points`.
  - Marked student with `student_has_incomplete = True`, `overall_result = "INCOMPLETE"`, `isProvisional = True`, and `hasIncompleteSubjects = True`.

### 3. [`server/controllers/resultController.js`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/server/controllers/resultController.js)
- **Changes**:
  - In `computeResults`: Stopped defaulting `internal1`, `internal2`, and `external` to `0`. Initialized as `null`.
  - Checked every subject for the semester against student submissions. If any assessment is missing, flags `isIncomplete: true` and logs missing assessments.
  - Returns `incompleteStudents` array and `hasIncompleteResults` boolean in API response.
  - In CGPA computation: excluded incomplete subjects from `totalGradePoints` and `totalCredits` so student CGPA is not diluted.
  - In `publishResults`:
    - Added gatekeeper check: blocks publication with HTTP 400 if any student has incomplete subjects, detailing the students and subjects.
    - Added `publishCompleteOnly` support: allows Exam Cell to publish only students with 100% completed evaluations.
  - In `publishSingleResult`: added guard against publishing an incomplete result unless explicitly requested with `forcePublish: true`.

### 4. [`client/src/pages/examcell/PublishResults.jsx`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/client/src/pages/examcell/PublishResults.jsx)
- **Changes**:
  - Added "Publish Complete Results Only" action button.
  - Updated `handlePublishAll` to inspect results and toast an informative blocking error if incomplete results are detected.
  - Added visual indicators in the preview table and modal: shows amber "Provisional" badge below SGPA and CGPA, and displays "Result incomplete" for missing subjects.

### 5. [`client/src/pages/examcell/ResultsView.jsx`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/client/src/pages/examcell/ResultsView.jsx)
- **Changes**:
  - Updated Results View table and breakdown modal to show "Result incomplete" badge for incomplete subjects.
  - Marks SGPA and CGPA as "Provisional" when incomplete subjects exist.

### 6. [`client/src/pages/student/StudentResults.jsx`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/client/src/pages/student/StudentResults.jsx)
- **Changes**:
  - Added styling and badge for `Incomplete` grades.
  - Displays "Result incomplete" in place of marks and status for incomplete subjects.
  - In the header and summary bar: displays `SGPA: X.XX (Provisional)` and explains `(Provisional — excludes incomplete subjects)` to ensure complete student clarity.

---

## 6. Open Item for HOD Decision: External-Minimum Rule

> [!IMPORTANT]
> **Open Item for Head of Department (HOD) Decision**:
> 
> Under Visvesvaraya Technological University (VTU) and autonomous academic regulations:
> - A candidate must secure a **minimum of 35% in the Semester End Examination (SEE)** (i.e., at least 35 out of 100, or 17.5 out of 50 scaled) to pass a subject, regardless of how high their Continuous Internal Evaluation (CIE) score is.
> - **Current System Implementation**: The system checks only the combined final percentage:
>   $$\text{Final Percentage} = \frac{\text{CIE} + \text{SEE}}{100} \ge 40\%$$
>   Under this formula, a student with $48/50$ in CIE and only $24/100$ ($12/50$) in SEE obtains a composite score of $48 + 12 = 60\%$ (Grade B+, PASS), which bypasses the VTU 35% external minimum requirement.
> 
> **Decision Required from HOD**:
> 1. Should Evalora enforce a hard cutoff of $\text{External} \ge 35$ marks for a passing grade, failing the subject with Grade F if the student falls below 35 in the SEE?
> 2. Or does the institution's autonomous scheme follow a pure composite score without a separate external minimum?
> 
> Per instructions, no code changes for this rule were made, preserving the existing grading scheme and boundaries pending the HOD's decision.
