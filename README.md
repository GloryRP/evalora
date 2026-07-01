# Agentic AI-Based Examination Automation and Evaluation System

A comprehensive college major project implementing an intelligent examination management system with AI-powered features.

## 🎓 Project Overview

This system automates the complete examination lifecycle from question paper generation to automated evaluation, with built-in proctoring and analytics. The system supports multiple user roles with specific access controls and workflows.

## 📊 Current Status: Phase 1 Complete ✅

**Phase 1: Authentication + RBAC + Admin Module** is fully functional and ready for testing.

### What's Working Now:
- ✅ Complete authentication system (JWT-based, 8-hour sessions)
- ✅ 6 user roles with role-based access control
- ✅ Admin dashboard with full CRUD for Students, Faculty, Subjects, Departments
- ✅ Protected routes with automatic role-based redirects
- ✅ Professional UI with Tailwind CSS
- ✅ Real-time data updates with React Query

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express (RESTful API)
- MongoDB + Mongoose (Database)
- JWT (Authentication)
- bcrypt (Password hashing)

**Frontend:**
- React 19 + Vite
- Tailwind CSS 4
- React Router DOM 7
- TanStack React Query
- Axios

**AI Service (Future):**
- Python FastAPI
- OpenAI/LLaMA for question generation
- Computer vision for proctoring

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB
- npm or yarn

### Installation

1. **Clone and navigate to project**
```bash
cd exam-automation-system
```

2. **Setup Backend**
```bash
cd server
npm install
npm run seed      # Creates test users for all 6 roles
npm run dev       # Starts server on port 5000
```

3. **Setup Frontend** (in a new terminal)
```bash
cd client
npm install
npm run dev       # Starts frontend on port 5173
```

4. **Open browser**
Navigate to `http://localhost:5173`

### Test Credentials

| Role      | Username    | Password        |
|-----------|-------------|-----------------|
| Admin     | ADMIN1      | Admin@123       |
| ExamCell  | EXAMCELL1   | ExamCell@123    |
| Faculty   | FACULTY1    | Faculty@123     |
| Student   | STUDENT1    | Student@123     |
| HOD       | HOD1        | HOD@123         |
| Principal | PRINCIPAL1  | Principal@123   |

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
