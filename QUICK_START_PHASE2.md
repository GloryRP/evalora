# Phase 2 Quick Start Guide

## What's New in Phase 2?

✅ **AI-Powered Exam Automation** - Automatically schedule exams with constraints  
✅ **Hall Allocation** - Intelligently allocate students to seats with anti-malpractice spacing  
✅ **Invigilator Assignment** - Distribute faculty across exam halls  
✅ **Professional Timetables** - Download beautiful, customized PDF timetables  
✅ **Dynamic Configuration** - Works for ANY university/college  

---

## 🚀 Getting Started (5 Minutes)

### 1. Install Puppeteer (for PDF generation)
```bash
cd server
npm install puppeteer
```

### 2. Re-seed Database (updates institution config)
```bash
cd server
node seed.js
```

### 3. Start All Services
Open 3 terminals and run:

**Terminal 1 - Python AI Service:**
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```
Wait for: `Application startup complete.`

**Terminal 2 - Node.js Backend:**
```bash
cd server
npm run dev
```
Wait for: `✓ Server running on port 5000`

**Terminal 3 - React Frontend:**
```bash
cd client
npm run dev
```
Wait for: `Local: http://localhost:5173`

### 4. Open Browser
```
http://localhost:5173
```

---

## 📝 Try the Full Pipeline

### Step 1: Login as ExamCell
- Username: `EXAMCELL1`
- Password: `ExamCell@123`

### Step 2: Go to "Run Agents"
Click sidebar → "Run Agents"

### Step 3: Configure & Run
1. **Select Subjects:**
   - Check "CS601" and "CS602" (or any 2 subjects)

2. **Set Constraints (Optional):**
   - Min Gap: 1 day
   - Max Exams/Day: 3
   - Fill %: 70

3. **Click "Run Full Pipeline"**

### Step 4: Watch It Work!
Terminal 2 (Node.js) will show:
```
✓ Created exam for CS601 → Exam ID: 6a46a0eb9e1b23ef194adcde
✓ Created exam for CS602 → Exam ID: 6a46a0eb9e1b23ef194adcdf
✓ Created 8 hall allocations
✓ Created 3 invigilator assignments
✅ Pipeline completed successfully!
```

### Step 5: Download Timetable PDF
1. Go to "Timetable" page
2. Select semester (6)
3. Click "📄 Download Timetable PDF"
4. Save the PDF - it's professional and ready to print!

---

## 📦 What Was Built

### Models (Database)
```
Exam               - Scheduled exams with times
Hall               - Exam halls with capacity
HallAllocation     - Student-to-hall assignments
InvigilatorAssignment - Faculty assignments
AgentRun           - AI execution logs
InstitutionConfig  - Branding & settings (NEW)
```

### AI Agents (Python)
```
SchedulingAgent         - Create exam schedule
HallAllocationAgent     - Assign students to seats
InvigilatorAgent        - Assign faculty to halls
Orchestrator            - Run all 3 in sequence
```

### API Endpoints (25+)
```
Exam Management:       GET/POST/PUT/DELETE /exams
Hall Management:       GET/POST /halls
AI Pipeline:           POST /agents/run-pipeline
Timetables:            GET /timetable/pdf
Config:                GET/PUT /institution/config
```

### Frontend Pages (8+)
```
ExamCellDashboard      - Overview
Exams                  - Exam CRUD
Halls                  - Hall CRUD
RunAgents              - Trigger AI pipeline
Timetable              - View & download PDF
HallAllocations        - View seating
InvigilatorAssignments - View faculty
AgentLogs              - View execution history
```

---

## ⚙️ Configure for Your Institution

### Update Institution Branding
```bash
curl -X PUT http://localhost:5000/api/v1/institution/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "institutionName": "Your University Name",
    "abbreviation": "YUN",
    "address": {
      "street": "123 University Road",
      "city": "Your City",
      "state": "Your State",
      "country": "India"
    },
    "phone": "+91-XXXXXXXXXX",
    "email": "exam@youruniversity.edu",
    "website": "www.youruniversity.edu",
    "branding": {
      "primaryColor": "#1E3A5F",
      "secondaryColor": "#C9A227"
    }
  }'
```

Or use the Admin Panel (when implemented).

---

## 🔍 Debug Commands

### Check Python Service Health
```bash
curl http://localhost:8000/agents/health
```

### Check Node Backend Health
```bash
curl http://localhost:5000
```

### View Institution Config
```bash
curl http://localhost:5000/api/v1/institution/config
```

### Preview Timetable (JSON)
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/v1/timetable/preview?semester=6&examType=regular"
```

---

## 📊 Example Data in Database

After running the pipeline with CS601 & CS602:

**Exams Created:** 2
- CS601 (Computer Science, Sem 6) - 2026-07-09
- CS602 (Computer Science, Sem 6) - 2026-07-10

**Students Allocated:** 8
- TEST005, TEST006, TEST010 to CS601
- 4PM23CD055, TEST005, TEST006, TEST010 to CS602

**Faculty Assigned:** 3
- FAC002 to CS601 (chief)
- FAC004 to CS601 (invigilator)
- FAC005 to CS602 (invigilator)

**Halls Used:** Hall A (100 capacity, 70% fill = 70 seats used per exam)

---

## 🎯 Key Constraints in AI Pipeline

### Scheduling Agent
- Minimum gap between exams: 1 day
- Maximum exams per day: 3
- Groups by semester to avoid conflicts

### Hall Allocation Agent
- 70% capacity fill (anti-malpractice spacing)
- Balances students across halls
- Assigns seat numbers

### Invigilator Agent
- Distributes faculty across exams
- Assigns chief invigilator + invigilators
- Random assignment for variety

---

## 🚨 Common Issues & Fixes

### "Cast to ObjectId failed for value 'CS601'"
✓ **FIXED** - The system now properly resolves subject codes to ObjectIds

### Puppeteer "No usable sandbox" error
**Fix:** The system handles this automatically in headless mode

### "No scheduled exams found"
**Fix:** Run the pipeline first from "Run Agents" page

### PDF generation slow
**Normal** - First PDF takes 10-15s (Puppeteer startup). Subsequent ones are faster.

---

## 📚 Architecture Overview

```
┌─────────────────────────────────────────────┐
│           REACT FRONTEND (5173)             │
│    [ExamCell Dashboard + Timetable PDF]     │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│      NODE.JS BACKEND (5000)                 │
│  [ID Resolution + PDF Generation + DB]      │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│       PYTHON AI SERVICE (8000)              │
│  [Scheduling + Hall Allocation + Invigilation]
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         MONGODB DATABASE                    │
│  [Exams, Halls, Students, Faculty, etc.]    │
└─────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

✅ See "✓ Created exam for..." in Node.js terminal  
✅ See "✓ Created allocation successfully" in Node.js terminal  
✅ See "✓ Created assignment successfully" in Node.js terminal  
✅ Download PDF from frontend with your institution name  
✅ PDF has professional layout and custom colors  

---

## 📖 Full Documentation

See these files for detailed information:
- `PHASE2_COMPLETE.md` - Complete feature list
- `TIMETABLE_PDF_IMPLEMENTATION.md` - PDF generator details
- `PHASE2_IMPLEMENTATION_SUMMARY.md` - Development notes

---

## 🎉 You're Ready!

The exam automation system is ready to use. Start with the "Run Agents" page and watch the magic happen! 

**Questions?** Check the terminal logs for detailed execution traces.
