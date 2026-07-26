# Quick Start Guide - Exam Automation System

## Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB (running and accessible)

## Initial Setup

### 1. Install Node.js Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Install Python Dependencies

```bash
cd ../ai-service
pip install -r requirements.txt
```

### 3. Seed the Database

```bash
cd ../server
npm run seed
```

You should see:
```
✓ MongoDB connected successfully
✓ Cleared existing test data
✓ Created admin: ADMIN1
✓ Created examcell: EXAMCELL1
✓ Created faculty: FACULTY1
✓ Created student: STUDENT1
✓ Created hod: HOD1
✓ Created principal: PRINCIPAL1
✓ Created department: Computer Science and Engineering (CSE)
✓ Created subject: CS101 - Introduction to Programming
✓ Created 8 additional subjects
✓ Created 4 exam halls
✓ Created 10 test students
✓ Created 5 test faculty
✓ Database seeded successfully!
```

## Running the System

Open **3 terminals** and run these commands:

### Terminal 1: Node.js Backend
```bash
cd server
npm run dev
```
Expected output:
```
✓ Server running on port 5000
✓ MongoDB connected successfully
```

### Terminal 2: Python AI Service
```bash
cd ai-service
uvicorn main:app --reload --port 8000
```
Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Terminal 3: React Frontend
```bash
cd client
npm run dev
```
Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Testing the System

### 1. Login as Exam Cell Officer
1. Open browser to `http://localhost:5173`
2. Login with:
   - **Username**: `EXAMCELL1`
   - **Password**: `ExamCell@123`

### 2. Set Up Halls (if needed)
1. Navigate to **Halls** from sidebar
2. Halls should already be seeded (Hall A, Hall B, Hall C, Lab 1)
3. Add more halls if needed using the "+ Add Hall" button

### 3. Run the AI Pipeline (Main Feature!)
1. Navigate to **Run Agents** from sidebar
2. **Step 1 - Select Subjects**:
   - Check subjects you want to schedule (e.g., CS501, CS502, CS503)
   - Click "Next"
3. **Step 2 - Configure**:
   - Set **Minimum Gap Between Exams**: 1 day (default)
   - Set **Maximum Exams Per Day**: 3 (default)
   - Set **Hall Fill Percentage**: 70% (anti-malpractice spacing)
   - Click "Next"
4. **Step 3 - Review & Run**:
   - Review your selections
   - Click "Run Pipeline" 🚀
5. **Step 4 - Results**:
   - See exams scheduled, halls allocated, invigilators assigned
   - View counts and success message

### 4. View Results
1. **Timetable**: See scheduled exams by date
2. **Hall Allocations**: See student seating arrangements
3. **Invigilator Assignments**: See faculty duties
4. **Agent Logs**: View execution history with JSON details

### 5. Manual Exam Management
- **Exams**: Create/edit/delete individual exams manually
- **Halls**: Manage exam halls
- **Dashboard**: Overview stats and recent activity

## API Endpoints

### Node.js Backend (Port 5000)
```
POST   /api/v1/auth/login                           - Login
GET    /api/v1/examcell/exams                       - List exams
POST   /api/v1/examcell/exams                       - Create exam
PUT    /api/v1/examcell/exams/:examId               - Update exam
DELETE /api/v1/examcell/exams/:examId               - Delete exam
GET    /api/v1/examcell/halls                       - List halls
POST   /api/v1/examcell/halls                       - Create hall
PUT    /api/v1/examcell/halls/:hallId               - Update hall
POST   /api/v1/examcell/agents/run-pipeline         - Run full AI pipeline
POST   /api/v1/examcell/agents/run-single           - Run single agent
GET    /api/v1/examcell/agents/runs                 - Get agent logs
GET    /api/v1/examcell/timetable                   - Get timetable
GET    /api/v1/examcell/hall-allocations            - Get hall allocations
GET    /api/v1/examcell/invigilator-assignments     - Get invigilator assignments
```

### Python AI Service (Port 8000)
```
GET    /                                - Health check
GET    /agents/health                   - Agent status
POST   /agents/schedule                 - Run scheduling agent
POST   /agents/allocate-halls           - Run hall allocation agent
POST   /agents/assign-invigilators      - Run invigilator agent
POST   /agents/run-pipeline             - Run complete pipeline
```

## Test Accounts

| Role      | Username   | Password      |
|-----------|------------|---------------|
| Admin     | ADMIN1     | Admin@123     |
| ExamCell  | EXAMCELL1  | ExamCell@123  |
| Faculty   | FACULTY1   | Faculty@123   |
| Student   | STUDENT1   | Student@123   |
| HOD       | HOD1       | HOD@123       |
| Principal | PRINCIPAL1 | Principal@123 |

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `server/.env` for correct `MONGO_URI`

### Python Service Not Starting
- Ensure Python 3.8+ is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is not in use

### Frontend Not Loading
- Check Node.js version: `node --version` (should be 16+)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### AI Pipeline Fails
1. Check Python service is running on port 8000
2. Check `server/.env` has `AI_SERVICE_URL=http://localhost:8000`
3. View error in Agent Logs page for detailed traceback

### 401 Unauthorized Error
- Token may have expired, logout and login again
- Check if user has correct role permissions

## Architecture Overview

```
┌─────────────────────┐
│   React Frontend    │  Port 5173
│  (Vite + React)     │
└──────────┬──────────┘
           │ HTTP Requests
           ↓
┌─────────────────────┐
│   Node.js Backend   │  Port 5000
│  (Express + JWT)    │
└──────┬──────────────┘
       │                 
       ├─→ MongoDB (Exams, Halls, Students, Faculty, AgentRuns)
       │
       └─→ Python AI Service (Port 8000)
           └─→ Agents: Scheduling, Hall Allocation, Invigilator
```

## Features Implemented

✅ User authentication with JWT
✅ Role-based access control (Admin, ExamCell, Faculty, Student, HOD, Principal)
✅ Admin module: Manage students, faculty, subjects, departments
✅ ExamCell module: Manage exams, halls, run AI automation
✅ AI-powered exam scheduling with constraints
✅ Smart hall allocation (70% fill for anti-malpractice)
✅ Intelligent invigilator assignment (no conflicts)
✅ Multi-step wizard UI for running AI pipeline
✅ Comprehensive logging and error tracking
✅ Real-time status updates
✅ Responsive design (mobile + desktop)

## Development Commands

```bash
# Backend development
cd server
npm run dev          # Start with nodemon (auto-restart)
npm run seed         # Seed database

# Frontend development
cd client
npm run dev          # Start Vite dev server
npm run build        # Production build

# Python AI service
cd ai-service
uvicorn main:app --reload --port 8000    # Development
uvicorn main:app --port 8000             # Production
```

## Environment Variables

### server/.env
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=mySecretKey12345ExamSystem
PORT=5000
AI_SERVICE_URL=http://localhost:8000
```

### client/.env
```
VITE_API_URL=http://localhost:5000/api/v1
```

## Support

For issues or questions:
1. Check the `PHASE2_IMPLEMENTATION_SUMMARY.md` for detailed component info
2. View Agent Logs in the UI for AI pipeline errors
3. Check browser console for frontend errors
4. Check terminal logs for backend/Python errors
