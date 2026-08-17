# 🎓 Agentic AI-Based Examination Automation and Evaluation System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)

A full-stack intelligent examination management platform that automates the complete exam lifecycle — from question paper submission and timetable scheduling to AI-powered answer script evaluation and result publishing.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [User Roles & Access](#-user-roles--access)
- [API Overview](#-api-overview)
- [Test Credentials](#-test-credentials)
- [Contributors](#-contributors)

---

## 🌟 Overview

This system is a **college major project** that reimagines how educational institutions manage examinations. It replaces manual, paper-heavy processes with a unified digital platform featuring:

- **Role-Based Access Control** for 6 distinct user types
- **AI Microservice** for automated answer script evaluation
- **Real-time Email Notifications** via SMTP
- **PDF Timetable Generation** and hall allocation
- **Question Paper Workflow** with multi-level approvals
- **Dynamic Result Computation** with configurable grading schemes

---

## ✅ Features

### 👤 Admin Module
- Manage Students, Faculty, ExamCell staff, HOD, Principal accounts
- Bulk import via CSV/Excel
- Department and Subject management
- Hall (venue) management
- Grading scheme configuration
- Institution settings (name, logo, academic year)

### 🏢 Exam Cell Module
- Exam scheduling and management
- Timetable creation with **PDF download**
- Hall allocation for students
- Invigilator assignment
- Question paper review and approval
- Answer script upload and AI evaluation trigger
- Result computation and publishing

### 👨‍🏫 Faculty Module
- Submit question papers for assigned subjects
- Track submission status (Pending → HOD Approved → ExamCell Approved)
- View submission history

### 🏫 HOD Module
- Review and approve/reject faculty question paper submissions
- Department-level analytics dashboard
- View faculty and student performance

### 🎓 Principal Module
- Institution-wide oversight dashboard
- View cross-department reports

### 👩‍🎓 Student Module
- View exam timetable
- Download hall ticket / admit card
- View published results
- Profile and password management

### 🤖 AI Service
- FastAPI microservice for answer script evaluation
- Agentic AI evaluation pipeline
- Automated scoring and feedback generation

### 🔔 Notification System
- Real-time in-app notification bell
- Email notifications via Gmail SMTP
- Event-based triggers (submission, approval, result publish)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router DOM 7, TanStack React Query, Axios |
| **Styling** | Tailwind CSS 4 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JWT (8-hour sessions), bcrypt |
| **AI Service** | Python, FastAPI, LangChain / custom agents |
| **Email** | Nodemailer + Gmail SMTP |
| **PDF Generation** | PDFKit |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Client                        │
│          (Vite + React Router + React Query)            │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP / REST (port 5173 → 5000)
┌─────────────────────────▼───────────────────────────────┐
│                   Express.js Server                      │
│   Controllers │ Routes │ Middleware │ Services           │
│          JWT Auth │ RBAC │ Nodemailer                   │
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
┌──────────▼──────────┐    ┌───────────▼──────────────────┐
│      MongoDB        │    │     Python AI Service         │
│   (Mongoose ODM)    │    │   FastAPI (port 8000)         │
│   20 Collections    │    │   Agentic Evaluation Pipeline │
└─────────────────────┘    └──────────────────────────────┘
```

---

## 📂 Project Structure

```
Agentic-AI-Based-Examination-Automation-and-evaluation-System/
│
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── BulkImportModal.jsx
│   │   │   └── NotificationBell.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── InstitutionContext.jsx
│   │   ├── layouts/                 # Role-specific layouts
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── ExamCellLayout.jsx
│   │   │   ├── FacultyLayout.jsx
│   │   │   ├── HodLayout.jsx
│   │   │   ├── PrincipalLayout.jsx
│   │   │   └── StudentLayout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── Students.jsx
│   │   │   │   ├── Faculty.jsx
│   │   │   │   ├── Departments.jsx
│   │   │   │   ├── Subjects.jsx
│   │   │   │   ├── Halls.jsx
│   │   │   │   ├── Exams.jsx
│   │   │   │   ├── GradingScheme.jsx
│   │   │   │   └── InstitutionSettings.jsx
│   │   │   ├── examcell/
│   │   │   │   ├── ExamCellDashboard.jsx
│   │   │   │   ├── Exams.jsx
│   │   │   │   ├── Timetable.jsx
│   │   │   │   ├── HallAllocations.jsx
│   │   │   │   ├── InvigilatorAssignments.jsx
│   │   │   │   ├── QuestionPapers.jsx
│   │   │   │   ├── AnswerScripts.jsx
│   │   │   │   ├── ComputeResults.jsx
│   │   │   │   ├── ResultsView.jsx
│   │   │   │   └── PublishResults.jsx
│   │   │   ├── faculty/
│   │   │   │   ├── SubmitQuestionPaper.jsx
│   │   │   │   └── QuestionPaperSubmissions.jsx
│   │   │   ├── hod/
│   │   │   │   └── HodDashboard.jsx
│   │   │   ├── principal/
│   │   │   └── student/
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
│
├── server/                          # Node.js + Express Backend
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── examcellController.js
│   │   ├── hodController.js
│   │   ├── institutionController.js
│   │   ├── qpSubmissionController.js
│   │   ├── resultController.js
│   │   └── timetableController.js
│   ├── models/                      # 20 Mongoose schemas
│   │   ├── User.js, Student.js, Faculty.js
│   │   ├── Department.js, Subject.js, Exam.js
│   │   ├── Hall.js, HallAllocation.js
│   │   ├── InvigilatorAssignment.js
│   │   ├── QuestionPaper.js, QuestionPaperSubmission.js
│   │   ├── AnswerScript.js, Result.js
│   │   ├── GradingScheme.js, Notification.js
│   │   └── InstitutionConfig.js ...
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   │   └── notificationService.js
│   ├── templates/                   # Email HTML templates
│   ├── uploads/                     # Answer script PDFs (gitignored)
│   ├── seed.js
│   ├── index.js
│   ├── .env.example                 # ← copy to .env and fill in values
│   └── package.json
│
├── ai-service/                      # Python FastAPI AI Service
│   ├── agents/
│   ├── main.py
│   ├── requirements.txt
│   └── .gitignore
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or Atlas)
- **Python** 3.10+ (for AI service)

---

### 1. Clone the Repository

```bash
git clone https://github.com/sumangalachikalgudd24/Agentic-AI-Based-Examination-Automation-and-evaluation-System.git
cd Agentic-AI-Based-Examination-Automation-and-evaluation-System
```

---

### 2. Setup the Server (Backend)

```bash
cd server
npm install
cp .env.example .env      # then edit .env with your values
node seed.js              # seeds DB with test users
npm run dev               # runs on http://localhost:5000
```

---

### 3. Setup the Client (Frontend)

```bash
cd client
npm install
cp .env.example .env      # default values work for local dev
npm run dev               # runs on http://localhost:5173
```

---

### 4. Setup the AI Service *(optional)*

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

### 5. Open the App

Navigate to **http://localhost:5173**

---

## 🔐 Environment Variables

### `server/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/examdb` |
| `JWT_SECRET` | Secret key for JWTs | `your_long_random_secret` |
| `PORT` | Server port | `5000` |
| `AI_SERVICE_URL` | Python AI service URL | `http://localhost:8000` |
| `SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Gmail address | `you@gmail.com` |
| `SMTP_PASS` | Gmail **App Password** | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Email display name | `Exam System <you@gmail.com>` |

> ⚠️ **Never commit your `.env` file.** It is in `.gitignore`. Use `.env.example` as a reference template.

> 💡 **Gmail App Password**: Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords) to generate one. Do **not** use your real Gmail password.

### `client/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |

---

## 👥 User Roles & Access

| Role | Capabilities |
|------|-------------|
| **Admin** | Full system control — users, departments, subjects, halls, grading, institution settings |
| **Exam Cell** | Exams, timetable, hall allocation, invigilators, QP approval, AI evaluation, results |
| **HOD** | Review & approve faculty QP submissions, department analytics |
| **Faculty** | Submit question papers, track submission status |
| **Student** | View timetable, hall ticket, published results, profile |
| **Principal** | Institution-wide read-only oversight |

---

## 🧩 API Overview

All routes are prefixed with `/api/v1`

| Endpoint Prefix | Description |
|----------------|-------------|
| `POST /auth/login` | Login and receive JWT |
| `GET /auth/me` | Get current user info |
| `/admin/*` | Student, faculty, dept, subject, hall CRUD |
| `/examcell/*` | Exams, timetable, allocations, answer scripts, results |
| `/hod/*` | HOD dashboard, QP approvals |
| `/qp-submissions/*` | Faculty QP submission workflow |
| `/institution/*` | Institution config (name, logo, academic year) |
| `/notifications/*` | Read/unread notification management |

---

## 🧪 Test Credentials

After running `node seed.js`:

| Role | Username | Password |
|------|----------|----------|
| Admin | `ADMIN1` | `Admin@123` |
| Exam Cell | `EXAMCELL1` | `ExamCell@123` |
| HOD | `HOD1` | `HOD@123` |
| Faculty | `FACULTY1` | `Faculty@123` |
| Student | `STUDENT1` | `Student@123` |
| Principal | `PRINCIPAL1` | `Principal@123` |

---

## 🤖 AI Evaluation Workflow

1. Exam Cell uploads answer script PDFs
2. Backend sends them to the **Python AI Service** (`/evaluate`)
3. AI agents parse, score, and generate feedback
4. Scores are stored in the `Result` collection
5. Exam Cell reviews AI scores and publishes results to students

---

## 👥 Contributors

| Name | Role |
|------|------|
| **Sumangala Chikalgudd** | Full-stack development, AI integration, System Architecture |

---

## 📄 License

This project is developed as a **college major project**. All rights reserved © 2026.

---

## 🙏 Acknowledgments

- Mentors and faculty for guidance
- The open-source community — React, Node.js, MongoDB, FastAPI teams
- Google Gemini AI for development assistance

---

<div align="center">
<sub>Built with ❤️ as an Agentic AI Major Project — 2026</sub>
</div>

## 📖 Detailed Documentation

See **[PHASE1_SETUP.md](./PHASE1_SETUP.md)** for:
- Complete setup instructions
- Testing guide
- File structure
- API documentation
- Troubleshooting

## 🎯 Project Phases

### ✅ Phase 1: Authentication + RBAC + Admin Module (COMPLETE)
- User authentication with JWT
- Role-based access control
- Admin CRUD for Students, Faculty, Subjects, Departments
- Protected routes and role-specific dashboards

### 🔄 Phase 2: Exam Cell Module (Planned)
- Exam scheduling
- Question bank management
- Paper template creation
- Venue and invigilator assignment

### 🔄 Phase 3: Faculty Module (Planned)
- Question paper submission
- Evaluation dashboard
- Grade entry and submission
- Student performance analytics

### 🔄 Phase 4: Student Module (Planned)
- Exam registration
- Admit card download
- Online exam interface
- Result viewing

### 🔄 Phase 5: AI Integration (Planned)
- Automated question generation
- Answer evaluation using NLP
- Plagiarism detection
- Proctoring with computer vision

### 🔄 Phase 6: HOD & Principal Dashboards (Planned)
- Department-wide analytics
- Approval workflows
- Performance reports
- System oversight

## 🔐 User Roles

### 1. Admin
- Manage all users (Students, Faculty, ExamCell, HOD, Principal)
- Manage departments and subjects
- System configuration
- View all data and reports

### 2. Exam Cell
- Schedule exams
- Assign invigilators
- Manage exam venues
- Approve question papers

### 3. Faculty
- Submit question papers
- Conduct exams
- Evaluate answer sheets
- Submit grades

### 4. Student
- Register for exams
- Take online/offline exams
- View results
- Download certificates

### 5. Head of Department (HOD)
- Approve departmental exams
- View department analytics
- Manage faculty assignments

### 6. Principal
- System-wide oversight
- Approve critical decisions
- View institutional reports

## 📂 Project Structure

```
exam-automation-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── layouts/        # Layout components
│   │   ├── lib/            # Utilities (API client, etc.)
│   │   ├── pages/          # Page components
│   │   └── App.jsx         # Main app with routing
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Custom middleware (auth, etc.)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routes
│   ├── index.js            # Server entry point
│   ├── seed.js             # Database seeding
│   └── package.json
├── ai-service/             # Python AI service (future)
├── PHASE1_SETUP.md         # Phase 1 detailed guide
└── README.md               # This file
```

## 🧪 Testing

### Manual Testing
1. Login as each role using test credentials
2. Verify role-based access restrictions
3. Test CRUD operations in admin panel
4. Check form validations
5. Test filters and search functionality

### Automated Testing (Future)
- Unit tests with Jest/Vitest
- Integration tests with Supertest
- E2E tests with Playwright

## 🐛 Known Issues

None currently - Phase 1 is stable and production-ready for presentation!

## 📝 Future Enhancements

- Password reset functionality
- Email notifications
- File upload for bulk student/faculty import
- Advanced search and filtering
- Export data to Excel/PDF
- Real-time notifications with WebSockets
- Mobile-responsive improvements
- Dark mode theme

## 👥 Contributors

- **Your Name** - Full-stack development, Architecture, AI integration

## 📄 License

This project is created as a college major project. All rights reserved.

## 🙏 Acknowledgments

- College faculty for guidance
- Open-source community for amazing tools
- React, Node.js, and MongoDB teams

---

**Note**: This is an academic project. For production deployment, additional security measures, performance optimizations, and testing should be implemented.

**Last Updated**: Phase 1 Completion - June 30, 2026
