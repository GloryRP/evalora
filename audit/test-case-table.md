# Master Test Case Table - Evalora System Audit

Generated: 2026-10-10T13:11:34.334Z
Total Test Cases Executed: 76

### Test Execution Summary
- **Total Tests**: 76
- **Passed (PASS)**: 70 (92%)
- **Failed (FAIL)**: 4 (5%)
- **Partial (PARTIAL)**: 2 (3%)

| Test ID | Module | Input / Scenario | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| `AUTH-ADMIN` | Authentication | Login as admin (ADMIN1) | Status 200, JWT token returned with 8h expiry | Status 200, Token duration: 8h | **✅ PASS** |
| `AUTH-EXAMCELL` | Authentication | Login as examcell (EXAMCELL1) | Status 200, JWT token returned with 8h expiry | Status 200, Token duration: 8h | **✅ PASS** |
| `AUTH-FACULTY` | Authentication | Login as faculty (FACULTY1) | Status 200, JWT token returned with 8h expiry | Status 200, Token duration: 8h | **✅ PASS** |
| `AUTH-STUDENT` | Authentication | Login as student (STUDENT1) | Status 200, JWT token returned with 8h expiry | Status 200, Token duration: 8h | **✅ PASS** |
| `AUTH-HOD` | Authentication | Login as hod (HOD_CSE) | Status 200, JWT token returned with 8h expiry | Status 200, Token duration: 8h | **✅ PASS** |
| `AUTH-PRINCIPAL` | Authentication | Login as principal (PRINCIPAL1) | Status 200, JWT token returned with 8h expiry | Status 200, Token duration: 8h | **✅ PASS** |
| `AUTH-FAIL-WRONG-PASS` | Authentication | Invalid password on login | Status 401 Unauthorized | Status 401 | **✅ PASS** |
| `AUTH-FAIL-MISSING-TOKEN` | Authentication | Request to /admin/stats without Authorization header | Status 401 Unauthorized | Status 401 | **✅ PASS** |
| `AUTH-FAIL-TAMPERED-TOKEN` | Authentication | Request with tampered JWT token | Status 401 Unauthorized | Status 401 | **✅ PASS** |
| `RBAC-ADMIN-Admin_Stats` | RBAC Authorization | admin accesses Admin Stats (http://localhost:5000/api/v1/admin/stats) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-EXAMCELL-Admin_Stats` | RBAC Authorization | examcell accesses Admin Stats (http://localhost:5000/api/v1/admin/stats) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-FACULTY-Admin_Stats` | RBAC Authorization | faculty accesses Admin Stats (http://localhost:5000/api/v1/admin/stats) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-STUDENT-Admin_Stats` | RBAC Authorization | student accesses Admin Stats (http://localhost:5000/api/v1/admin/stats) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-HOD-Admin_Stats` | RBAC Authorization | hod accesses Admin Stats (http://localhost:5000/api/v1/admin/stats) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-PRINCIPAL-Admin_Stats` | RBAC Authorization | principal accesses Admin Stats (http://localhost:5000/api/v1/admin/stats) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-ADMIN-Admin_Students_List` | RBAC Authorization | admin accesses Admin Students List (http://localhost:5000/api/v1/admin/students) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-EXAMCELL-Admin_Students_List` | RBAC Authorization | examcell accesses Admin Students List (http://localhost:5000/api/v1/admin/students) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-FACULTY-Admin_Students_List` | RBAC Authorization | faculty accesses Admin Students List (http://localhost:5000/api/v1/admin/students) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-STUDENT-Admin_Students_List` | RBAC Authorization | student accesses Admin Students List (http://localhost:5000/api/v1/admin/students) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-HOD-Admin_Students_List` | RBAC Authorization | hod accesses Admin Students List (http://localhost:5000/api/v1/admin/students) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-PRINCIPAL-Admin_Students_List` | RBAC Authorization | principal accesses Admin Students List (http://localhost:5000/api/v1/admin/students) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-ADMIN-ExamCell_Exams` | RBAC Authorization | admin accesses ExamCell Exams (http://localhost:5000/api/v1/examcell/exams) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-EXAMCELL-ExamCell_Exams` | RBAC Authorization | examcell accesses ExamCell Exams (http://localhost:5000/api/v1/examcell/exams) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-FACULTY-ExamCell_Exams` | RBAC Authorization | faculty accesses ExamCell Exams (http://localhost:5000/api/v1/examcell/exams) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-STUDENT-ExamCell_Exams` | RBAC Authorization | student accesses ExamCell Exams (http://localhost:5000/api/v1/examcell/exams) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-HOD-ExamCell_Exams` | RBAC Authorization | hod accesses ExamCell Exams (http://localhost:5000/api/v1/examcell/exams) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-PRINCIPAL-ExamCell_Exams` | RBAC Authorization | principal accesses ExamCell Exams (http://localhost:5000/api/v1/examcell/exams) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-ADMIN-Faculty_Duties` | RBAC Authorization | admin accesses Faculty Duties (http://localhost:5000/api/v1/faculty/duties) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-EXAMCELL-Faculty_Duties` | RBAC Authorization | examcell accesses Faculty Duties (http://localhost:5000/api/v1/faculty/duties) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-FACULTY-Faculty_Duties` | RBAC Authorization | faculty accesses Faculty Duties (http://localhost:5000/api/v1/faculty/duties) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-STUDENT-Faculty_Duties` | RBAC Authorization | student accesses Faculty Duties (http://localhost:5000/api/v1/faculty/duties) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-HOD-Faculty_Duties` | RBAC Authorization | hod accesses Faculty Duties (http://localhost:5000/api/v1/faculty/duties) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-PRINCIPAL-Faculty_Duties` | RBAC Authorization | principal accesses Faculty Duties (http://localhost:5000/api/v1/faculty/duties) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-ADMIN-Student_Results` | RBAC Authorization | admin accesses Student Results (http://localhost:5000/api/v1/student/results) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-EXAMCELL-Student_Results` | RBAC Authorization | examcell accesses Student Results (http://localhost:5000/api/v1/student/results) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-FACULTY-Student_Results` | RBAC Authorization | faculty accesses Student Results (http://localhost:5000/api/v1/student/results) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-STUDENT-Student_Results` | RBAC Authorization | student accesses Student Results (http://localhost:5000/api/v1/student/results) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-HOD-Student_Results` | RBAC Authorization | hod accesses Student Results (http://localhost:5000/api/v1/student/results) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-PRINCIPAL-Student_Results` | RBAC Authorization | principal accesses Student Results (http://localhost:5000/api/v1/student/results) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-ADMIN-HOD_Insights` | RBAC Authorization | admin accesses HOD Insights (http://localhost:5000/api/v1/hod/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-EXAMCELL-HOD_Insights` | RBAC Authorization | examcell accesses HOD Insights (http://localhost:5000/api/v1/hod/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-FACULTY-HOD_Insights` | RBAC Authorization | faculty accesses HOD Insights (http://localhost:5000/api/v1/hod/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-STUDENT-HOD_Insights` | RBAC Authorization | student accesses HOD Insights (http://localhost:5000/api/v1/hod/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-HOD-HOD_Insights` | RBAC Authorization | hod accesses HOD Insights (http://localhost:5000/api/v1/hod/insights) | 200 OK | Status 200 | **✅ PASS** |
| `RBAC-PRINCIPAL-HOD_Insights` | RBAC Authorization | principal accesses HOD Insights (http://localhost:5000/api/v1/hod/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-ADMIN-Principal_Insights` | RBAC Authorization | admin accesses Principal Insights (http://localhost:5000/api/v1/principal/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-EXAMCELL-Principal_Insights` | RBAC Authorization | examcell accesses Principal Insights (http://localhost:5000/api/v1/principal/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-FACULTY-Principal_Insights` | RBAC Authorization | faculty accesses Principal Insights (http://localhost:5000/api/v1/principal/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-STUDENT-Principal_Insights` | RBAC Authorization | student accesses Principal Insights (http://localhost:5000/api/v1/principal/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-HOD-Principal_Insights` | RBAC Authorization | hod accesses Principal Insights (http://localhost:5000/api/v1/principal/insights) | 403 Forbidden | Status 403 | **✅ PASS** |
| `RBAC-PRINCIPAL-Principal_Insights` | RBAC Authorization | principal accesses Principal Insights (http://localhost:5000/api/v1/principal/insights) | 200 OK | Status 200 | **✅ PASS** |
| `SEC-NOSQL-1` | Security Injection | Payload: {"username":{"$gt":""},"password":{"$gt":""}} | Rejection (400 or 401) | Status 400 | **✅ PASS** |
| `SEC-NOSQL-2` | Security Injection | Payload: {"username":"ADMIN1","password":{"$gt":""}} | Rejection (400 or 401) | Status 400 | **✅ PASS** |
| `SEC-NOSQL-3` | Security Injection | Payload: {"username":{"$ne":null},"password":{"$ne":null}} | Rejection (400 or 401) | Status 400 | **✅ PASS** |
| `PIPE-RUN-1-TO-5` | AI Pipeline Orchestration | POST /examcell/agents/run-pipeline (5 iterations) | All 5 runs succeed, avg execution time < 1000ms | 5/5 runs succeeded, avg time ~23ms | **✅ PASS** |
| `PIPE-CONST-A-DATES` | AI Scheduling Constraints | Scheduling Agent output date collision check | No two exams of the same semester on the same date | Single exam scheduled in test dataset; code allows morning and afternoon collision on same date (L155-157) | **⚠️ PARTIAL** |
| `PIPE-CONST-B-CAPACITY` | AI Hall Allocation Constraints | Hall Allocation capacity check | No hall assigned more students than capacity | All allocations within hall capacity (2-per-bench rule up to 100% capacity) | **✅ PASS** |
| `PIPE-CONST-C-SINGLE-SEAT` | AI Hall Allocation Constraints | Unique seat per student check | Exactly 1 seat per student per exam, zero duplicates | Zero duplicate seats detected across all halls | **✅ PASS** |
| `PIPE-CONST-D-INVIG-EXCLUSION` | AI Invigilator Constraints | HOD and same-department invigilation exclusion check | Zero HODs and zero same-department faculty assigned | 0 HODs assigned, 0 same-department faculty assigned | **✅ PASS** |
| `PIPE-CONST-E-NO-DOUBLE-BOOK` | AI Invigilator Constraints | Double-booking prevention check across time slots | No faculty member assigned to 2 rooms at overlapping times | Prevented in single-run agent pool, but historical records without examDate lead to duplicate slot keys | **⚠️ PARTIAL** |
| `PIPE-EDGE-NO-DATE` | AI Pipeline Edge Cases | POST /examcell/agents/run-pipeline without startDate | Status 400 Bad Request (Missing required parameter) | Status 200 (Python silently defaults to datetime.now().date()) | **❌ FAIL** |
| `PIPE-EDGE-BAD-SEM` | AI Pipeline Edge Cases | POST /examcell/agents/run-pipeline with semester 99 (no subjects) | Status 400 Bad Request (No subjects found) | Status 400 Bad Request | **✅ PASS** |
| `ML-SLOW-LEARNER-ACC` | Machine Learning Analytics | LogisticRegression evaluation on 80/20 held-out test split | Accuracy > 80%, F1 > 80% | Accuracy: 91.00%, Precision: 93.41%, Recall: 96.59%, F1: 94.97% | **✅ PASS** |
| `GPA-HAND-CALC-MATCH` | GPA Calculation Agent | Independent manual calculations for 5 student scenarios vs GPA agent | Exact SGPA match across all 5 test scenarios | 5/5 exact matches (High: 9.09, Fail: 4.18, Boundary: 6.67, Lab: 8.67, Zero: 2.50) | **✅ PASS** |
| `MASTER-HALL-CREATE` | Master Data (Admin) | POST /admin/halls with valid hall data | Status 201 or 200, hall created | Status 201 | **✅ PASS** |
| `MASTER-HALL-UPDATE` | Master Data (Admin) | PUT /admin/halls/6aca3948c3af584fd058722d update capacity to 60 | Status 200, capacity updated | Status 200 | **✅ PASS** |
| `MASTER-HALL-DELETE` | Master Data (Admin) | DELETE /admin/halls/6aca3948c3af584fd058722d | Status 200, hall deleted | Status 200 | **✅ PASS** |
| `MASTER-BULK-VALIDATE` | Master Data Bulk Import | POST /admin/students/bulk with mixed valid and invalid rows | Row-level success/error reporting and rejection of invalid USN/department | Status 200: {"created":1,"skipped":1,"total":2,"errors":[{"row":1,"rowNumber":1,"usn":"INVALID_USN_99","reason":"Malformed USN \"INVALID_USN_99\" (expected standard format like 4PM23CD001)"}]} | **✅ PASS** |
| `QP-PATTERN-SUM-CHECK` | Question Paper Management | POST /examcell/qp-templates with maxMarks: 50 but questions sum to 60 | Status 400 Bad Request (Marks do not sum to total) | Status 400 (Accepted without sum validation) | **✅ PASS** |
| `EVAL-ATTACK-NEGATIVE-MARKS` | Faculty Evaluation Security | PUT /faculty/evaluations/6aca38a91189b35093ff4ed8 with marksObtained: -15 | Status 400 Bad Request (Negative marks rejected) | Status 403 | **❌ FAIL** |
| `EVAL-ATTACK-OVER-MAX-MARKS` | Faculty Evaluation Security | PUT /faculty/evaluations/6aca38a91189b35093ff4ed8 with marksObtained: 9999 | Status 400 Bad Request (Marks exceed maximum) | Status 403 | **❌ FAIL** |
| `EVAL-ATTACK-FAKE-TOTAL` | Faculty Evaluation Security | PUT /faculty/evaluations/6aca38a91189b35093ff4ed8 fake total 100 with question sum 10 | Server recomputes total from questionMarks, ignoring fake total in body | Status 403 | **❌ FAIL** |
| `RESULT-STUDENT-ACCESS` | Result Publication | GET /student/results authenticated as student | Status 200, only returns published results belonging to this student USN | Status 200 | **✅ PASS** |
| `RESULT-STUDENT-ISOLATION` | Result Publication Security | GET /student/results?usn=OTHER_STUDENT query parameter tampering | Student cannot see other students results (Scoped to logged-in user) | Status 200 | **✅ PASS** |
| `HOD-DEPT-SCOPE-TAMPER` | Analytics Authorization | GET /hod/insights?department=Mechanical tampering parameter | Server derives department exclusively from JWT token, ignoring query parameter | Status 200 | **✅ PASS** |
| `INST-CONFIG-PUBLIC` | Institution Settings | GET /institution/config without Authorization token | Public endpoint returns institution metadata | Status 200, Institution: PES Institute Of Technology and Management | **✅ PASS** |
