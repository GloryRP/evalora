# System Architecture - Visual Guide

## 🏗️ Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  ExamCell Admin  │  │  Exam Management │  │  Timetable View  │           │
│  │   Dashboard      │  │  (CRUD Exams)    │  │  (PDF Download)  │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Run Agents UI   │  │  Hall Allocations│  │  Faculty/Student │           │
│  │  (Constraints)   │  │  View            │  │  Assignment View │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                               │
│                         React Frontend (Port 5173)                            │
│                                                                               │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTP/REST/JSON
                               │ JWT Authentication
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                      EXPRESS.JS BACKEND (Port 5000)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    API LAYER (25+ Endpoints)                       │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │    │
│  │  │  Exam Routes    │  │  Hall Routes    │  │  Agent Routes   │   │    │
│  │  │  (CRUD Ops)     │  │  (CRUD Ops)     │  │  (Pipeline)     │   │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │    │
│  │  │ Timetable Routes│  │ Institution     │  │ Data View Routes│   │    │
│  │  │ (PDF Gen)       │  │ Config Routes   │  │ (GET queries)   │   │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                   BUSINESS LOGIC LAYER                             │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐             │    │
│  │  │ ID Resolution Engine │    │ PDF Generator        │             │    │
│  │  │                      │    │ (Puppeteer)          │             │    │
│  │  │ • Convert ObjectIds  │    │ • Template Rendering │             │    │
│  │  │ • Map subjectCode →  │    │ • Placeholder Replace│             │    │
│  │  │   Subject ObjectId   │    │ • HTML → PDF         │             │    │
│  │  │ • Resolve hall names │    │ • Styling            │             │    │
│  │  │ • Map student USNs   │    │ • Page Breaks        │             │    │
│  │  │ • Map faculty IDs    │    │ • Custom Branding    │             │    │
│  │  └──────────────────────┘    └──────────────────────┘             │    │
│  │                                                                     │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐             │    │
│  │  │ Validation Layer     │    │ Error Handling       │             │    │
│  │  │                      │    │                      │             │    │
│  │  │ • Input validation   │    │ • Try-catch blocks   │             │    │
│  │  │ • Schema validation  │    │ • Error logging      │             │    │
│  │  │ • Auth checks        │    │ • Meaningful messages│             │    │
│  │  └──────────────────────┘    └──────────────────────┘             │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              CONTROLLER LAYER (3 Controllers)                      │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐             │    │
│  │  │ Exam Cell Controller │    │ Institution          │             │    │
│  │  │                      │    │ Controller           │             │    │
│  │  │ • CRUD operations    │    │                      │             │    │
│  │  │ • Pipeline orchestr. │    │ • Get/Update config  │             │    │
│  │  │ • ID resolution      │    │ • Config management  │             │    │
│  │  │ • DB operations      │    │ • Schema validation  │             │    │
│  │  └──────────────────────┘    └──────────────────────┘             │    │
│  │  ┌──────────────────────┐                                         │    │
│  │  │ Timetable Controller │                                         │    │
│  │  │                      │                                         │    │
│  │  │ • PDF generation     │                                         │    │
│  │  │ • Template loading   │                                         │    │
│  │  │ • Data formatting    │                                         │    │
│  │  │ • Puppeteer usage    │                                         │    │
│  │  └──────────────────────┘                                         │    │
│  │                                                                     │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ HTTP/REST/JSON
                               │
          ┌────────────────────┴────────────────────┐
          │                                          │
┌─────────▼──────────────┐            ┌─────────────▼──────────┐
│   MONGODB DATABASE     │            │  PYTHON AI SERVICE     │
│   (Port 27017)         │            │  (Port 8000)           │
├────────────────────────┤            ├────────────────────────┤
│                        │            │                        │
│ Collections:           │            │ Agents:                │
│ ✓ Users               │            │ • Orchestrator         │
│ ✓ Students            │            │ • Scheduling Agent     │
│ ✓ Faculty             │            │ • Hall Allocation      │
│ ✓ Departments         │            │ • Invigilator Agent    │
│ ✓ Subjects            │            │                        │
│ ✓ Halls               │            │ Features:              │
│ ✓ Exams (NEW)         │            │ • Constraint solving   │
│ ✓ HallAllocations     │            │ • Random sampling      │
│ ✓ InvigilatorAssignm. │            │ • Workload balancing   │
│ ✓ AgentRuns           │            │ • Error handling       │
│ ✓ InstitutionConfig   │            │                        │
│                        │            │ FastAPI Endpoints:     │
│ Indexes:              │            │ • /health              │
│ • username (unique)   │            │ • /schedule            │
│ • subjectCode (unique)│            │ • /allocate-halls      │
│ • hallName            │            │ • /assign-invigilators │
│ • examDate            │            │ • /run-pipeline        │
│ • usn (unique)        │            │                        │
│ • employeeId (unique) │            │                        │
│                        │            │                        │
└────────────────────────┘            └────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### Pipeline Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: ExamCell User Triggers Pipeline                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Frontend (RunAgents.jsx)                                               │
│  ├─ Select subjects (e.g., CS601, CS602)                              │
│  ├─ Set constraints                                                     │
│  └─ Click "Run Full Pipeline"                                          │
│      │                                                                   │
│      ▼                                                                   │
│  HTTP POST /api/v1/examcell/agents/run-pipeline                       │
│      │                                                                   │
│      ▼                                                                   │
│  Node.js Backend (examcellController.js)                               │
│  ├─ Validate input                                                     │
│  ├─ Convert ObjectIds to strings for Python                           │
│  │  ├─ Fetch subjects: find by _id                                    │
│  │  ├─ Fetch students: find all                                       │
│  │  ├─ Fetch faculty: find all                                        │
│  │  └─ Fetch halls: find all                                          │
│  │      └─ Convert _id fields to strings: obj._id.toString()         │
│  └─ Create AgentRun log (status: running)                             │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Send Data to Python AI Service                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Node.js → Python                                                       │
│  HTTP POST http://localhost:8000/agents/run-pipeline                   │
│  {                                                                       │
│    "subjects": [                                                        │
│      {                                                                  │
│        "_id": "6a45371c3a84444022ae86e5",  ← Now a string!           │
│        "subjectCode": "CS601",                                         │
│        "subjectName": "Machine Learning",                              │
│        "semester": 6,                                                   │
│        ...                                                              │
│      },                                                                 │
│      ...                                                                │
│    ],                                                                   │
│    "students": [...],                                                  │
│    "faculty": [...],                                                   │
│    "halls": [...],                                                     │
│    "constraints": {                                                     │
│      "minGapBetweenExams": 1,                                          │
│      "maxExamsPerDay": 3,                                              │
│      "fillPercentage": 70                                              │
│    }                                                                     │
│  }                                                                       │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Python AI Processes                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Orchestrator.run_pipeline()                                            │
│  │                                                                       │
│  ├─ Agent 1: Scheduling                                               │
│  │  ├─ Input: subjects, constraints                                    │
│  │  ├─ Process: Create exam schedule with constraint satisfaction     │
│  │  └─ Output: scheduled_exams [                                      │
│  │     {                                                               │
│  │       "subjectId": "6a45371c3a84...",  ← PROBLEM: this is still   │
│  │       "subjectCode": "CS601",           subject code!              │
│  │       "examDate": "2026-07-09T...",                                │
│  │       ...                                                           │
│  │     }                                                               │
│  │  ]                                                                  │
│  │                                                                     │
│  ├─ Agent 2: Hall Allocation                                         │
│  │  ├─ Input: scheduled_exams, students, halls, constraints         │
│  │  ├─ Process: Assign students with 70% fill                       │
│  │  └─ Output: hall_allocations [                                   │
│  │     {                                                              │
│  │       "examId": "CS601",      ← Returns subject code              │
│  │       "hallId": "Hall A",     ← Returns hall name                 │
│  │       "studentId": "STUDENT1",  ← Returns USN                     │
│  │       "seatNumber": 1                                              │
│  │     }                                                              │
│  │  ]                                                                 │
│  │                                                                     │
│  └─ Agent 3: Invigilator Assignment                                  │
│     ├─ Input: scheduled_exams, faculty, constraints                 │
│     ├─ Process: Assign faculty to exam halls                        │
│     └─ Output: invigilator_assignments [                            │
│        {                                                              │
│          "examId": "CS602",      ← Returns subject code              │
│          "hallId": "default_hall", ← Returns placeholder             │
│          "facultyId": "FAC002",    ← Returns employee ID            │
│          "role": "chief"                                             │
│        }                                                              │
│     ]                                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: ID Resolution in Node.js Backend                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  examcellController.js - runFullPipeline()                              │
│  │                                                                       │
│  ├─ Build Mapping: subjectCode → examId                                │
│  │  for (const exam of result.scheduled_exams) {                      │
│  │    const subject = await Subject.findOne({ subjectCode: ... })    │
│  │    subjectCodeToExamId["CS601"] = newExamDoc._id                  │
│  │    subjectCodeToExamId["CS602"] = newExamDoc._id                  │
│  │  }                                                                   │
│  │                                                                       │
│  ├─ Process Allocations:                                               │
│  │  for (const allocation of result.hall_allocations) {              │
│  │    // Resolve examId using mapping                                 │
│  │    examId = subjectCodeToExamId[allocation.examId]  ✓ Found!      │
│  │                                                                      │
│  │    // Resolve hallId from hall name                                │
│  │    const hall = await Hall.findOne({ hallName: "Hall A" })       │
│  │    hallId = hall._id  ✓ Got ObjectId!                             │
│  │                                                                      │
│  │    // Resolve studentId from USN                                   │
│  │    const student = await Student.findOne({ usn: "STUDENT1" })    │
│  │    studentId = student._id  ✓ Got ObjectId!                       │
│  │                                                                      │
│  │    // NOW we can create with proper ObjectIds                     │
│  │    await HallAllocation.create({                                   │
│  │      examId: ObjectId(...),                                        │
│  │      hallId: ObjectId(...),                                        │
│  │      studentId: ObjectId(...)  ← All valid!                       │
│  │    })  ✓ SUCCESS!                                                  │
│  │  }                                                                   │
│  │                                                                       │
│  └─ Repeat for Invigilator Assignments                                │
│     (same resolution pattern)                                          │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Save to MongoDB                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  examcellController.js - Save Phase                                     │
│  │                                                                       │
│  ├─ Create Exams                                                       │
│  │  └─ Exam.create({ subjectId: ObjectId, examDate, ... })           │
│  │     ✓ 2 exams created                                              │
│  │                                                                      │
│  ├─ Create Hall Allocations                                            │
│  │  └─ HallAllocation.create({ examId: ObjectId, hallId, ... })      │
│  │     ✓ 8 allocations created (students per exam)                    │
│  │                                                                      │
│  ├─ Create Invigilator Assignments                                     │
│  │  └─ InvigilatorAssignment.create({ examId: ObjectId, ... })       │
│  │     ✓ 3-4 assignments created (faculty per exam)                   │
│  │                                                                      │
│  ├─ Update AgentRun Log                                                │
│  │  └─ agentRun.status = "completed"                                  │
│  │     agentRun.outputData = result                                    │
│  │                                                                      │
│  └─ Return Success Response                                            │
│     {                                                                   │
│       "success": true,                                                 │
│       "data": {                                                        │
│         "examsCreated": 2,                                             │
│         "allocationsCreated": 8,                                       │
│         "assignmentsCreated": 3                                        │
│       }                                                                 │
│     }                                                                   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
   Frontend shows success!
   "✓ Pipeline completed successfully"
   "Exams: 2, Allocations: 8, Assignments: 3"
```

---

## 📊 Database Relationships

```
User (1) ──┬──► Student (1..*)
           ├──► Faculty (1..*)
           └──► Exam (managed by ExamCell)

Subject (1) ──►(N) Exam

Hall (1) ──►(N) HallAllocation
        └──►(N) InvigilatorAssignment

Exam (1) ──┬──►(N) HallAllocation
          ├──►(N) InvigilatorAssignment
          └──► Subject

Student (1) ──►(N) HallAllocation
Faculty (1) ──►(N) InvigilatorAssignment

Department (1) ──►(N) Subject
              └──►(N) Faculty

Institution (1) ──► Config (branding, timetable settings)
```

---

## 🔐 Authentication & Authorization

```
┌─────────────────────────────────────┐
│ JWT Token Generation                │
├─────────────────────────────────────┤
│ User logs in                         │
│ ├─ Verify credentials                │
│ ├─ Generate JWT with:                │
│ │  ├─ userId                          │
│ │  ├─ username                        │
│ │  ├─ role (admin/examcell/...)      │
│ │  └─ exp (expiration)                │
│ └─ Return token to client            │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│ Per-Request Authorization           │
├─────────────────────────────────────┤
│ Client sends Authorization header:  │
│ "Bearer <JWT_TOKEN>"                │
│        │                             │
│        ▼                             │
│ authenticateToken middleware        │
│ ├─ Extract token                     │
│ ├─ Verify signature                  │
│ ├─ Check expiration                  │
│ └─ Attach user to req.user           │
│        │                             │
│        ▼                             │
│ authorizeRole(['admin', 'examcell']) │
│ ├─ Check req.user.role               │
│ ├─ Match against allowed roles       │
│ └─ Allow/Deny access                 │
│                                      │
│ Protected endpoints:                 │
│ • POST /agents/run-pipeline          │
│ • PUT /institution/config            │
│ • GET /timetable/pdf                 │
│                                      │
│ Public endpoints:                    │
│ • GET /institution/config            │
│ • GET /health endpoints              │
└─────────────────────────────────────┘
```

---

## 🎨 Frontend Component Tree

```
App.jsx
├─ Router
│  ├─ /login → Login.jsx
│  ├─ /admin → AdminLayout.jsx
│  │   ├─ AdminDashboard
│  │   ├─ Departments
│  │   ├─ Faculty
│  │   ├─ Students
│  │   └─ Subjects
│  │
│  └─ /examcell → ExamCellLayout.jsx
│      ├─ Sidebar (navy + gold)
│      ├─ ExamCellDashboard
│      ├─ Exams
│      │  ├─ List (table)
│      │  ├─ Create (form)
│      │  └─ Edit (modal)
│      ├─ Halls
│      ├─ RunAgents
│      │  ├─ Subject selector
│      │  ├─ Constraint inputs
│      │  └─ Execute button
│      ├─ Timetable
│      │  ├─ Exam list
│      │  ├─ Filter/sort
│      │  └─ Download PDF button
│      ├─ HallAllocations
│      ├─ InvigilatorAssignments
│      └─ AgentLogs
│
└─ ProtectedRoute
   └─ Role-based rendering
```

---

## ⚡ Performance Optimization

```
┌─────────────────────────────────────────┐
│ Database Optimization                   │
├─────────────────────────────────────────┤
│ Indexes created for:                    │
│ • username (unique)                     │
│ • subjectCode (unique)                  │
│ • hallName                              │
│ • examDate                              │
│ • usn (unique)                          │
│ • employeeId (unique)                   │
│                                         │
│ Query Optimization:                     │
│ • Use .lean() for read-only queries    │
│ • Use .select() to limit fields        │
│ • Batch operations where possible       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ API Response Optimization                │
├─────────────────────────────────────────┤
│ • Pagination for large result sets       │
│ • Field selection                        │
│ • Response compression (gzip)            │
│ • Cache headers                          │
│ • Connection pooling                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Frontend Optimization                    │
├─────────────────────────────────────────┤
│ • Code splitting                         │
│ • Lazy loading of pages                  │
│ • CSS variables for themeing             │
│ • Minimal rerenders                      │
│ • Efficient form handling                │
└─────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           CDN / Static Files                        │   │
│  │  (React build optimized with tree-shaking)         │   │
│  └─────────────────────────────────────────────────────┘   │
│                    │                                         │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Nginx / Reverse Proxy                            │   │
│  │  (Load balancing, SSL termination)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│        │                                │                   │
│        ▼                                ▼                   │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Node.js Server  │        │  Node.js Server  │   (x2+)  │
│  │  (PM2 managed)   │        │  (PM2 managed)   │          │
│  │  Port 5000       │        │  Port 5001       │          │
│  └──────────────────┘        └──────────────────┘          │
│        │                                │                   │
│        └────────────────┬───────────────┘                  │
│                         │                                   │
│                         ▼                                   │
│              ┌──────────────────────┐                       │
│              │   MongoDB Cluster    │                       │
│              │  (Replication Set)   │                       │
│              │  (Backup/Recovery)   │                       │
│              └──────────────────────┘                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │      Python AI Service (Standalone)                 │   │
│  │  (Gunicorn/Docker container)                        │   │
│  │  Port 8000                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Monitoring & Logging                             │   │
│  │  • PM2 Dashboard                                    │   │
│  │  • MongoDB monitoring                               │   │
│  │  • Application metrics                              │   │
│  │  • Error tracking                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:
✅ Scalability (multiple Node.js instances)
✅ Reliability (database replication)
✅ Performance (caching, optimization)
✅ Security (SSL, authentication)
✅ Maintainability (clear separation of concerns)
