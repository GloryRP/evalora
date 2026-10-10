# Comprehensive QA & Audit Report: Evalora System

**Project Name**: Evalora – Agentic AI-Based Examination Automation and Evaluation System  
**Audit Conducted**: October 2026  
**Auditor**: Independent QA & Audit Engineer  
**Audit Location**: `/audit`  
**System Target**: Frontend (`http://localhost:5173`), Backend API (`http://localhost:5000/api/v1`), AI Service (`http://localhost:8000`)  

---

## 1. Executive Summary

Evalora is a functioning, comprehensive examination automation system comprising a React 19 frontend, an Express/Node.js REST API with 139 routes, and a Python FastAPI microservice powered by scikit-learn. Core workflows—including multi-role JWT authentication, master data management, orchestrated exam scheduling and hall allocation, ground-truth GPA calculation, result publication, and slow-learner ML classification (91.00% accuracy, 94.97% F1)—execute end-to-end with high responsiveness (average pipeline duration ~23ms). However, the audit revealed key architectural discrepancies and input-validation security gaps: the Evaluation Agent is implemented as a simple 45-line MongoDB query rather than an AI agent; claimed libraries (Socket.io, Upstash Redis, react-pdf) are entirely absent and substituted with HTTP polling and native browser frames; NoSQL object payloads on login trigger unhandled 500 crashes; and faculty marks submission lacks boundary checks against negative marks or maximum ceilings.

### Audit Test Verdict Breakdown

| Total Checks Executed | PASS | FAIL | PARTIAL | NOT IMPLEMENTED | NOT TESTABLE |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **73** | **58** (79.5%) | **6** (8.2%) | **7** (9.6%) | **2** (2.7%) | **0** (0.0%) |

---

## 2. Steps 1 to 11 Functional & Security Verification Table

| Step | Feature Tested | Status | Evidence (File, Line, Command, Output) | Auditor Notes & Analysis |
|---|---|:---:|---|---|
| **Step 1** | Multi-Role Authentication | **PASS** | `POST /api/v1/auth/login`<br>Status: `200 OK` for all 6 roles (`ADMIN1`, `EXAMCELL1`, `FACULTY1`, `STUDENT1`, `HOD_CSE`, `PRINCIPAL1`) | Tokens issued for all roles with valid payloads. |
| **Step 1** | JWT Expiration & Structure | **PASS** | `audit_security_rbac.js`<br>Decoded payload: `exp - iat = 28800s` (exactly 8.0 hours) | Verified against `server/controllers/authController.js:L53`. |
| **Step 1** | Password Encryption in DB | **PASS** | `mongo query`<br>Prefix: `$2b$10$` on all user records | Strict 10-round bcrypt verified; plaintext passwords are never stored. |
| **Step 1** | Auth Failure Protections | **PASS** | `POST /auth/login` (bad pass) -> `401`<br>Missing header -> `401`<br>Tampered JWT -> `401` | Core authentication middleware blocks unauthorized access. |
| **Step 1** | Role-Based Access Control (RBAC) | **PASS** | `role-route-matrix.md`<br>Cross-role access attempts returned `403 Forbidden` across all 6 roles | Strictly enforces role separation; direct API calls cannot bypass UI redirects. |
| **Step 2** | Master Data CRUD | **PASS** | `audit_e2e_api.js`<br>`POST/PUT/DELETE /admin/halls`: Status `201`/`200`/`200` | Full administrative CRUD verified for Halls, Students, Faculty, Subjects. |
| **Step 2** | Bulk CSV Import Validation | **PARTIAL** | `POST /admin/students/bulk`<br>Status `400` on malformed payload | Bulk import functions for clean data, but lacks fine-grained row-level partial recovery. |
| **Step 2** | Institution Config Propagation | **PASS** | `GET /api/v1/institution/config`<br>Returned `PES Institute Of Technology and Management` | Publicly consumable; updates propagate to headers and hall tickets. |
| **Step 2** | Dynamic Grading Scheme | **PASS** | `gpa_agent.py:L72-78`<br>Consumed dynamically via `gradingScheme` payload array | No hardcoded grade boundaries in Python; uses DB-defined scheme. |
| **Step 3** | QP Marking Pattern Sum Check | **FAIL** | `POST /examcell/qp-templates`<br>Input: `maxMarks: 50`, questions sum to `60`<br>Actual Result: `200 OK` (Accepted) | `server/routes/examcell.js:L198-219` saves template without validating mark totals. |
| **Step 3** | QP Auto-Assign & Notifications | **PASS** | `server/routes/qpSubmission.js:L25-80`<br>Creates `QuestionPaperSubmission` records | Correctly associates faculty teaching semester subjects. |
| **Step 3** | QP Selection & Final Lock | **PASS** | `POST /qp-submissions/select`<br>Status: `200 OK`, `isLocked: true` | Prevents subsequent modifications once selected by Exam Cell. |
| **Step 4** | Orchestrated Pipeline Latency | **PASS** | `audit_pipeline_performance.js`<br>5 runs: `21ms`, `24ms`, `24ms`, `24ms`, `23ms` (Avg: `23.2ms`) | Tested on Semester 5 (12 subjects, 13 students, 10 faculty, 6 halls). |
| **Step 4** | Constraint: Hall Capacity | **PASS** | `hall_allocations` query<br>0 halls exceeded designated capacity | 2 students per bench distributed evenly across rooms. |
| **Step 4** | Constraint: Unique Student Seating | **PASS** | `hall_allocations` query<br>0 duplicate seats detected | Each student receives exactly one seat per exam session. |
| **Step 4** | Constraint: Invigilator Exclusion | **PASS** | `invigilator_assignments` query<br>0 HODs assigned; 0 same-dept faculty assigned | `invigilator_agent.py:L80` & `L164` successfully filter prohibited faculty. |
| **Step 4** | Constraint: Date Collision Spacing | **FAIL** | `scheduling_agent.py:L155-157`<br>`next_date = curr_date, next_session = 'afternoon'` | Two exams of the same semester can be scheduled on the same date (morning + afternoon). |
| **Step 4** | Edge Case: Missing Start Date | **FAIL** | `POST /examcell/agents/run-pipeline`<br>Missing `startDate` returned `200 OK` | `scheduling_agent.py:L57` silently falls back to `datetime.now().date()` instead of `400`. |
| **Step 5** | In-App Notifications | **PASS** | `notifications` collection in MongoDB<br>Status: Records created with `isRead: false` | Notifications created on pipeline run, duty assignments, and result publishing. |
| **Step 5** | Real-Time Delivery Architecture | **PARTIAL** | `client/src/components/NotificationBell.jsx:L112`<br>`setInterval(fetchUnreadCount, 30000)` | Uses 30-second HTTP polling. Socket.io is NOT implemented. |
| **Step 5** | Nodemailer Email Dispatch | **PASS** | `server/services/notificationService.js:L140`<br>Graceful try/catch fallback | In-app notifications persist even when external SMTP fails or credentials are unset. |
| **Step 6** | Answer Script Upload & Storage | **PASS** | `server/services/cloudinaryService.js:L23`<br>`server/uploads/answer-scripts/` | Implements automatic fallback to local disk when Cloudinary credentials are absent. |
| **Step 6** | Authenticated File Streaming Proxy | **PASS** | `GET /api/v1/file-proxy?token=<jwt>`<br>Invalid token: `401 Unauthorized` | Prevents public URL scraping of PDF booklets; verifies JWT before piping. |
| **Step 7** | Faculty Marks Submission | **PASS** | `PUT /faculty/evaluations/:id`<br>Status: `200 OK`, `script.status = 'evaluated'` | Evaluator ID verified against logged-in faculty (`faculty.js:L186`). |
| **Step 7** | Server-Side Total Recalculation | **PASS** | `server/routes/faculty.js:L168`<br>`totalMarks = savedQuestionMarks.reduce(...)` | Overrides client-provided `marksObtained` with calculated sum of question items. |
| **Step 7** | Negative Marks Attack | **FAIL** | `PUT /faculty/evaluations/:id`<br>Payload: `marksObtained: -15`<br>Accepted (`200 OK`) | No lower-bound validation (`qm.marksObtained >= 0`) in route handler. |
| **Step 7** | Excessive Marks Attack | **FAIL** | `PUT /faculty/evaluations/:id`<br>Payload: `marksObtained: 9999`<br>Accepted (`200 OK`) | No upper-bound validation against per-question maximums. |
| **Step 8** | Evaluation Agent Architecture | **PARTIAL** | `server/controllers/examcellController.js:L2076`<br>`exports.runEvaluationAgent` | Implemented in Node.js as a MongoDB query; NOT an AI/Python agent. |
| **Step 9** | GPA Agent Precision | **PASS** | `audit_ml_evaluation.py`<br>5/5 test cases matched hand calculations to 2 decimal places | Correctly computes $\frac{\sum(\text{GradePoints} \times \text{Credits})}{\sum \text{Credits}}$. |
| **Step 10** | Student Result Publication Isolation | **PASS** | `GET /api/v1/student/results?usn=OTHER`<br>Returned only the logged-in student's data | Results scoped strictly to JWT authenticated student USN. |
| **Step 11** | Slow-Learner ML Classification | **PASS** | `audit_ml_evaluation.py`<br>Accuracy: `91.00%`, Precision: `93.41%`, F1: `94.97%` | Logistic Regression model trained and evaluated on 6 student performance features. |
| **Step 11** | HOD Department Scope Isolation | **PASS** | `GET /hod/insights?department=Other`<br>Returned only CSE department data | Department is derived from `req.user.department`, ignoring query parameter tampering. |

---

## 3. "What Works" vs. "What is Broken"

### What Works
1. **Core Authentication & Session Management**:
   - Clean 6-role JWT issuing with strictly enforced 8-hour lifespans.
   - 10-round bcrypt password hashing across all user types.
   - Comprehensive RBAC blocking cross-role route access with `403 Forbidden`.
   - Functional Profile page with a universal back-button returning users to their designated role dashboard.
2. **Master Data & Configuration Management**:
   - Robust CRUD operations for Halls, Students, Faculty, Subjects, and Departments.
   - Dynamic institution settings propagation to timetable headers, reports, and emails.
3. **AI Scheduling & Allocation Pipeline**:
   - Rapid orchestration execution (~23ms per pipeline run).
   - Absolute enforcement of hall capacity constraints and anti-malpractice 2-per-bench seating alternation.
   - Zero duplicate seat assignments per student.
   - Exclusion of HODs and same-department faculty from invigilation pools.
   - Clean replacement of previous exam series upon re-running the pipeline (idempotent scheduling).
4. **Academic Evaluation & Mathematics**:
   - 100% mathematical accuracy on SGPA and credit weighting across standard, failed, and boundary scenarios.
   - Scikit-learn Logistic Regression slow-learner classifier performing at 91.00% accuracy and 94.97% F1 score.
   - Student result isolation preventing students from viewing peers' scorecards.
5. **Storage & Resiliency**:
   - Storage service transparently falling back to local disk when Cloudinary credentials are unset.
   - Notification service creating in-app database alerts regardless of whether Gmail SMTP is reachable.
   - Secured `/api/v1/file-proxy` route requiring valid JWT tokens to stream answer booklet PDFs.

---

### What is Broken

#### Critical Severity
1. **NoSQL Object Injection Crash on Authentication Endpoint**
   - **Severity**: Critical
   - **Reproduction**: Send `POST /api/v1/auth/login` with body `{"username": "ADMIN1", "password": {"$gt": ""}}`.
   - **Actual Result**: `500 Internal Server Error` (Unhandled crash).
   - **Root Cause**: `server/controllers/authController.js:L38` passes `req.body.password` directly to `bcrypt.compare(password, user.passwordHash)`. When `password` is a MongoDB operator object, bcrypt throws an uncaught `TypeError: Illegal arguments: object, string`.
   - **Impact**: Denial of Service (DoS) and potential unhandled process crash.

#### High Severity
2. **Missing Input Validation on Faculty Marks Submission**
   - **Severity**: High
   - **Reproduction**: Send `PUT /api/v1/faculty/evaluations/:scriptId` with `marksObtained: -15` or `marksObtained: 9999`.
   - **Actual Result**: `200 OK` (Negative marks and marks exceeding maximums are saved to DB).
   - **Root Cause**: `server/routes/faculty.js:L166` converts marks using `parseFloat(qm.marksObtained) || 0` without validating `qm.marksObtained >= 0` or checking against question maximums.
   - **Impact**: Database corruption with illegal scores distorting GPA and class statistics.

3. **No Validation of Total Marks in QP Marking Patterns**
   - **Severity**: High
   - **Reproduction**: Send `POST /api/v1/examcell/qp-templates` with `maxMarks: 50` and question items summing to `60`.
   - **Actual Result**: `200 OK` (Accepted and saved).
   - **Root Cause**: `server/routes/examcell.js:L198-219` saves the template directly without asserting that $\sum \text{question.maxMarks} == \text{template.maxMarks}$.
   - **Impact**: Question papers generated with invalid total marks, breaking downstream evaluation.

4. **Same-Semester Multi-Exam Date Collision in Scheduling Agent**
   - **Severity**: High
   - **Reproduction**: Schedule multiple subjects for the same semester.
   - **Actual Result**: Subject 1 is assigned to Morning (`09:00`) and Subject 2 is assigned to Afternoon (`13:30`) on the exact same calendar date.
   - **Root Cause**: `ai-service/agents/scheduling_agent.py:L155-157` explicitly sets `next_date = curr_date` and `next_session = "afternoon"`. The constraint variable `minGapBetweenExams` is parsed at line 41 but never referenced anywhere in the scheduling loop.
   - **Impact**: Students are forced to write two comprehensive examinations on the same day.

#### Medium Severity
5. **Permissive CORS Header on Express Backend**
   - **Severity**: Medium
   - **Reproduction**: Send preflight `OPTIONS` request to `http://localhost:5000/api/v1/institution/config` with `Origin: http://evil.com`.
   - **Actual Result**: Server returns `Access-Control-Allow-Origin: *`.
   - **Root Cause**: `server/index.js:L25` uses `app.use(cors())` with default configuration rather than restricting origins to `http://localhost:5173`.
   - **Impact**: Any external website in a student's browser can query public backend endpoints.

6. **Missing Rejection on Omitted Start Date in Pipeline**
   - **Severity**: Medium
   - **Reproduction**: Call `POST /examcell/agents/run-pipeline` omitting `startDate`.
   - **Actual Result**: Returns `200 OK`.
   - **Root Cause**: `ai-service/agents/scheduling_agent.py:L57` catches the date error and silently falls back to `base_date = datetime.now().date()` instead of raising a 400 validation error.
   - **Impact**: Exams are scheduled starting today rather than the exam cell's intended commencement window.

7. **Lack of Submission Locking on Faculty Evaluations**
   - **Severity**: Medium
   - **Reproduction**: Send `PUT /faculty/evaluations/:scriptId` repeatedly on a script with status `'evaluated'`.
   - **Actual Result**: Overwrites existing marks without administrative override.
   - **Root Cause**: `server/routes/faculty.js:L186-203` does not check if `script.status === 'evaluated'`.
   - **Impact**: Evaluated booklets can be altered post-submission without an audit trail.

---

### Not Implemented or Not Testable

1. **AI-Driven Evaluation Agent in Python**:
   - **Status**: **NOT IMPLEMENTED**
   - **Finding**: The project report claims an autonomous AI evaluation agent in Python. In reality, `POST /api/v1/examcell/agents/run-evaluation` routes to `server/controllers/examcellController.js:L2076`, which executes a basic Mongoose count query, calculates average marks, and hardcodes `marksObtained >= 40` as passing. There is no ML or Python evaluation agent.
2. **Socket.io Real-Time WebSocket Infrastructure**:
   - **Status**: **NOT IMPLEMENTED**
   - **Finding**: Socket.io is not in `package.json` and does not exist in any backend route. Real-time updates are performed via standard React client polling every 30 seconds (`setInterval` in `NotificationBell.jsx:L112`).
3. **Upstash Redis Cache Layer**:
   - **Status**: **NOT IMPLEMENTED**
   - **Finding**: Redis is completely absent from the codebase. Analytics caching is performed directly via MongoDB (`server/models/AnalyticsCache.js`).
4. **react-pdf Client Rendering**:
   - **Status**: **NOT IMPLEMENTED**
   - **Finding**: `react-pdf` is not installed in `client/package.json`. PDF scripts are rendered via native browser `<iframe>` elements proxied through `/api/v1/file-proxy`.
5. **70% Hall Fill Threshold**:
   - **Status**: **NOT IMPLEMENTED**
   - **Finding**: `ai-service/agents/hall_allocation_agent.py:L88` allocates 2 students per bench up to `hall_capacity // 2`, filling halls up to 100% capacity rather than capping at 70%.

---

## 4. Ranked Security Findings

```
┌──────────┬─────────────────────────────────────────────────┬──────────┬─────────────────────────────┐
│ Rank     │ Vulnerability / Issue                           │ Severity │ File Reference              │
├──────────┼─────────────────────────────────────────────────┼──────────┼─────────────────────────────┤
│ SEC-01   │ NoSQL Object Injection DoS Crash on Login       │ CRITICAL │ server/controllers/auth.js  │
│ SEC-02   │ Unbounded/Negative Marks Injection on Marks Form│ HIGH     │ server/routes/faculty.js    │
│ SEC-03   │ Unvalidated QP Pattern Total Marks              │ HIGH     │ server/routes/examcell.js   │
│ SEC-04   │ Permissive Wildcard CORS Configuration (*)      │ MEDIUM   │ server/index.js:L25         │
│ SEC-05   │ Missing State Lock on Submitted Evaluations     │ MEDIUM   │ server/routes/faculty.js    │
│ SEC-06   │ Public Exposure of Institution Metadata         │ LOW      │ server/routes/institution.js│
└──────────┴─────────────────────────────────────────────────┴──────────┴─────────────────────────────┘
```

---

## 5. Report Claims vs. Reality Matrix

| Architectural Claim in Project Report | Actual Codebase Implementation | Discrepancy Status | Evidence |
|---|---|:---:|---|
| **8-Hour JWT Lifespan** | Configured for 8 hours (`28800s`) | **MATCH** | `authController.js:L53` (`expiresIn: '8h'`) |
| **Bcrypt 10 Salt Rounds** | Uses 10 salt rounds | **MATCH** | All user `passwordHash` start with `$2b$10$` |
| **60+ API Routes** | 139 distinct API endpoints discovered | **MATCH (EXCEEDS)** | See `/audit/route-inventory.md` |
| **Versioned /api/v1 Prefix** | All endpoints prefixed with `/api/v1` | **MATCH** | `server/index.js:L35-50` |
| **Excluded HOD / Same-Dept Faculty** | Explicitly filtered from invigilation | **MATCH** | `invigilator_agent.py:L80, L164` |
| **70% Hall Fill with Alternate Seats** | Uses 2 per bench up to 100% capacity | **CONTRADICTED** | `hall_allocation_agent.py:L88` |
| **Socket.io Real-Time Alerts** | HTTP polling every 30 seconds | **CONTRADICTED** | `NotificationBell.jsx:L112`, 0 Socket files |
| **Upstash Redis Caching** | MongoDB `AnalyticsCache` collection | **CONTRADICTED** | 0 Redis dependencies, Mongoose cache model |
| **react-pdf Document Viewer** | Native browser `<iframe>` stream | **CONTRADICTED** | `package.json` lacks `react-pdf`, uses `fileProxy.js` |
| **6 Autonomous Python AI Agents** | 5 Python agents + 1 Node.js Mongo query | **PARTIAL** | Evaluation agent resides in Node.js controller |
| **React 18 Frontend** | Running modern React 19.2 | **DIVERGENCE** | `client/package.json` (`"react": "^19.2.7"`) |

---

## 6. Recommended Fix Order (Top 10)

> [!IMPORTANT]
> The following recommendations are presented in order of priority. In accordance with the Auditor role, **no source files have been modified or patched**.

1. **Fix NoSQL Object Injection on Auth Controller** (`server/controllers/authController.js`):  
   Enforce strict type checking ensuring `typeof req.body.username === 'string'` and `typeof req.body.password === 'string'` prior to invoking `User.findOne` and `bcrypt.compare`.
2. **Add Boundary Validation for Faculty Marks Submission** (`server/routes/faculty.js`):  
   Add express-validator assertions verifying `qm.marksObtained >= 0` and `qm.marksObtained <= qm.maxMarks`.
3. **Enforce Marking Pattern Sum Integrity** (`server/routes/examcell.js`):  
   Add a pre-save check asserting that `questions.reduce((sum, q) => sum + q.maxMarks, 0) === maxMarks` before persisting templates.
4. **Implement Exam Date Gap in Scheduling Agent** (`ai-service/agents/scheduling_agent.py`):  
   Update the semester pointer to advance `curr_date += timedelta(days=min_gap)` rather than placing multiple exams of the same semester on the same date.
5. **Tighten Express CORS Configuration** (`server/index.js`):  
   Replace `app.use(cors())` with `app.use(cors({ origin: ['http://localhost:5173'], credentials: true }))`.
6. **Implement Evaluation State Lock** (`server/routes/faculty.js`):  
   Reject marks updates if `script.status === 'evaluated'`, requiring an explicit administrative unlock from the Exam Cell.
7. **Reject Missing Start Dates in Pipeline** (`server/controllers/examcellController.js`):  
   Enforce `startDate` validation at the Express controller level with a `400 Bad Request` prior to dispatching requests to the AI microservice.
8. **Add Built-in Fallback Grading Scheme in GPA Agent** (`ai-service/agents/gpa_agent.py`):  
   Provide a standard VTU 10-point scale fallback inside Python if the request payload omits `gradingScheme`.
9. **Align Evaluation Agent into Python Service** (`ai-service/agents/`):  
   Migrate `runEvaluationAgent` logic from the Node.js controller into an autonomous Python service agent to match architectural documentation.
10. **Implement 70% Hall Fill Constraint** (`ai-service/agents/hall_allocation_agent.py`):  
    Cap the bench allocation count at `math.floor((hall_capacity * 0.70) / 2)` to align with institutional anti-malpractice specifications.

---

## 7. Audit Artifact Reference

All supporting scripts, raw execution logs, structured matrices, and visual evidence have been preserved in `/audit`:
- **API Inventory**: [`/audit/route-inventory.md`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/route-inventory.md)
- **RBAC Matrix**: [`/audit/role-route-matrix.md`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/role-route-matrix.md)
- **Master Test Cases**: [`/audit/test-case-table.md`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/test-case-table.md)
- **Pipeline Performance**: [`/audit/performance-results.md`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/performance-results.md)
- **ML & GPA Verification**: [`/audit/ml-evaluation.md`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/ml-evaluation.md)
- **UI Screenshots**: [`/audit/screenshots/`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/screenshots)
- **Audit Test Scripts**: [`/audit/scripts/`](file:///c:/Users/jaggu/Desktop/exam-automation-system1/audit/scripts)
