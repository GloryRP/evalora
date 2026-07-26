# Command Reference - Exam Automation System

## Initial Setup (Run Once)

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Install Python dependencies
cd ../ai-service
pip install -r requirements.txt

# Seed the database with test data
cd ../server
npm run seed
```

## Daily Development (3 Terminals)

### Terminal 1 - Node.js Backend
```bash
cd server
npm run dev
```
✅ Backend runs on `http://localhost:5000`

### Terminal 2 - Python AI Service
```bash
cd ai-service
uvicorn main:app --reload --port 8000
```
✅ AI Service runs on `http://localhost:8000`

### Terminal 3 - React Frontend
```bash
cd client
npm run dev
```
✅ Frontend runs on `http://localhost:5173`

## Quick Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **Python AI**: http://localhost:8000
- **AI Docs**: http://localhost:8000/docs (FastAPI auto-generated)

## Database Management

```bash
# Seed database with test data
cd server
npm run seed

# Connect to MongoDB shell (if installed locally)
mongosh "mongodb+srv://..."

# View collections
show collections
db.users.find()
db.exams.find()
db.halls.find()
```

## Testing Login

### Exam Cell User
- Username: `EXAMCELL1`
- Password: `ExamCell@123`
- Role: Exam Cell Officer

### Admin User
- Username: `ADMIN1`
- Password: `Admin@123`
- Role: Administrator

### Other Roles
- Faculty: `FACULTY1` / `Faculty@123`
- Student: `STUDENT1` / `Student@123`
- HOD: `HOD1` / `HOD@123`
- Principal: `PRINCIPAL1` / `Principal@123`

## API Testing (PowerShell)

### Login
```powershell
$body = @{
    username = "EXAMCELL1"
    password = "ExamCell@123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$token = $response.token
Write-Host "Token: $token"
```

### Get Exams (with authentication)
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

$exams = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/examcell/exams" `
    -Method Get `
    -Headers $headers

$exams.data
```

### Run AI Pipeline
```powershell
$body = @{
    subjectIds = @("subject_id_1", "subject_id_2")
    constraints = @{
        minGapBetweenExams = 1
        maxExamsPerDay = 3
        fillPercentage = 70
    }
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/examcell/agents/run-pipeline" `
    -Method Post `
    -Body $body `
    -Headers $headers `
    -ContentType "application/json"

$result
```

## Python AI Service Testing

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/agents/health"
```

### Test Scheduling Agent
```powershell
$body = @{
    subjects = @(
        @{
            _id = "test1"
            subjectCode = "CS501"
            subjectName = "Database Systems"
            semester = 5
            department = "Computer Science"
        }
    )
    constraints = @{
        minGapBetweenExams = 1
        maxExamsPerDay = 3
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:8000/agents/schedule" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

## Troubleshooting Commands

### Check if ports are in use
```powershell
# Check port 5000 (Node.js backend)
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# Check port 8000 (Python AI)
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# Check port 5173 (Frontend)
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
```

### Kill processes on ports
```powershell
# Find process on port 5000
$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# Find process on port 8000
$process = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }

# Find process on port 5173
$process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($process) { Stop-Process -Id $process.OwningProcess -Force }
```

### Clear npm cache
```bash
cd client
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Reinstall Python dependencies
```bash
cd ai-service
pip uninstall -y -r requirements.txt
pip install -r requirements.txt
```

### View logs
```bash
# Backend logs (if running as service)
cd server
npm run dev 2>&1 | tee backend.log

# Python logs
cd ai-service
uvicorn main:app --reload --port 8000 2>&1 | tee ai-service.log

# Frontend logs
cd client
npm run dev 2>&1 | tee frontend.log
```

## Git Commands

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "Completed Phase 2: Exam Cell Module with AI Agents"

# Push
git push origin main

# Create new branch
git checkout -b feature/exam-cell-enhancements
```

## Production Build

### Frontend
```bash
cd client
npm run build
# Output in client/dist/
```

### Backend (no build needed, runs directly)
```bash
cd server
npm start
```

### Python (production mode)
```bash
cd ai-service
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

### Backend (.env file location)
```
server/.env
```

### Frontend (.env file location)
```
client/.env
```

### Python (optional .env)
```
ai-service/.env
```

## Useful Development Commands

```bash
# Watch backend logs
cd server
npm run dev

# Watch frontend with network access
cd client
npm run dev -- --host

# Run Python with debug mode
cd ai-service
uvicorn main:app --reload --port 8000 --log-level debug

# Check MongoDB connection
cd server
node -e "require('dotenv').config(); console.log(process.env.MONGO_URI)"

# Test API endpoint quickly
curl http://localhost:5000/
curl http://localhost:8000/
curl http://localhost:5173/
```

## Package Management

```bash
# Add new npm package (backend)
cd server
npm install package-name

# Add new npm package (frontend)
cd client
npm install package-name

# Add new Python package
cd ai-service
pip install package-name
pip freeze > requirements.txt
```

## Directory Navigation

```bash
# Quick navigation
cd server          # Node.js backend
cd client          # React frontend
cd ai-service      # Python AI service
cd server/models   # Database models
cd server/routes   # API routes
cd server/controllers  # Business logic
cd client/src/pages/examcell  # ExamCell pages
cd ai-service/agents   # AI agents
```
