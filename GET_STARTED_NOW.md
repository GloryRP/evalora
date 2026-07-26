# 🚀 GET STARTED NOW - 5 MINUTE SETUP

## Copy-Paste These Commands

### Terminal 1: Start Python AI Service
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

**Wait for:**
```
INFO:     Application startup complete.
```

### Terminal 2: Start Node.js Backend
```bash
cd server
npm run dev
```

**Wait for:**
```
✓ Server running on port 5000
✓ MongoDB connected successfully
```

### Terminal 3: Start React Frontend
```bash
cd client
npm run dev
```

**Wait for:**
```
Local: http://localhost:5173
```

---

## Open Browser

```
http://localhost:5173
```

---

## Login Credentials

```
Username: EXAMCELL1
Password: ExamCell@123
```

---

## Try the Pipeline (2 Minutes)

1. **Click "Run Agents"** in the sidebar
2. **Select Subjects**:
   - Check "CS601" (Machine Learning)
   - Check "CS602" (Web Technologies)
3. **Click "Run Full Pipeline"**
4. **Watch the magic happen!** ✨

---

## Expected Results

### In Node.js Terminal:
```
✓ Created exam for CS601 → Exam ID: 6a46a0eb9e1b23ef194adcde
✓ Created exam for CS602 → Exam ID: 6a46a0eb9e1b23ef194adcdf
✓ Created 8 hall allocations
✓ Created 3 invigilator assignments
✅ Pipeline completed successfully!
```

### In Browser:
```
Success! ✓
Pipeline completed successfully

Exams Created: 2
Allocations Created: 8
Assignments Created: 3
```

---

## Download Timetable PDF (1 Minute)

1. **Go to "Timetable"** in sidebar
2. **Click "📄 Download Timetable PDF"**
3. **Open PDF** - See professional timetable with:
   - Institution name (PES Institute)
   - Exam schedule
   - Academic year
   - Generated date
   - Professional styling

---

## What Just Happened?

✅ **Scheduling Agent** created 2 exams with constraints  
✅ **Hall Allocation Agent** assigned 8 students to seats  
✅ **Invigilator Agent** assigned 3 faculty to exams  
✅ **All data saved** to MongoDB  
✅ **Professional PDF generated** with branding  

**Total execution time: ~0.07 seconds! ⚡**

---

## Next: Customize for Your Institution

### Update Institution Name
```bash
curl -X PUT http://localhost:5000/api/v1/institution/config \
  -H "Content-Type: application/json" \
  -d '{
    "institutionName": "Your University Name",
    "abbreviation": "YUN"
  }'
```

### Change Branding Colors
```bash
curl -X PUT http://localhost:5000/api/v1/institution/config \
  -H "Content-Type: application/json" \
  -d '{
    "branding": {
      "primaryColor": "#your-color",
      "secondaryColor": "#your-accent-color"
    }
  }'
```

**Then download PDF again** - it will have your colors! 🎨

---

## Explore More Features

### View Exam Timetable
```
Sidebar → Timetable → See all scheduled exams
```

### View Hall Allocations
```
Sidebar → Hall Allocations → See which students sit where
```

### View Faculty Assignments
```
Sidebar → Invigilator Assignments → See which faculty supervises which exam
```

### View Execution Logs
```
Sidebar → Agent Logs → See history of all pipeline runs
```

---

## Troubleshooting

### Python Service Won't Start?
```bash
# Check Python is installed
python --version

# Try reinstalling Uvicorn
pip install uvicorn fastapi pydantic
```

### Node Backend Port 5000 Already in Use?
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### PDF Download Not Working?
```bash
# Install Puppeteer
cd server
npm install puppeteer

# Restart Node server
# Press Ctrl+C, then npm run dev
```

---

## Verify Everything Works

### Check Python Health
```bash
curl http://localhost:8000/agents/health
```

**Should return:**
```json
{
  "status": "healthy",
  "service": "exam-automation-ai-service",
  "agents": {
    "scheduling": "ready",
    "hall_allocation": "ready",
    "invigilator": "ready",
    "orchestrator": "ready"
  }
}
```

### Check Node Backend
```bash
curl http://localhost:5000
```

**Should return:**
```json
{
  "status": "ok",
  "message": "Exam system backend is running"
}
```

### Check MongoDB
```bash
curl http://localhost:5000/api/v1/institution/config
```

**Should return:**
```json
{
  "success": true,
  "data": {
    "institutionName": "PES Institute of Technology & Management",
    ...
  }
}
```

---

## Success Checklist

- [x] All 3 services running (ports 5000, 5173, 8000)
- [x] Can login with EXAMCELL1
- [x] Can select subjects and run pipeline
- [x] Exams, allocations, assignments created
- [x] Can download timetable PDF
- [x] PDF shows institution branding
- [x] Can view all pages in sidebar

**🎉 EVERYTHING WORKS!**

---

## Next Steps

1. **Customize Institution**
   - Update name, colors, address
   - Add logo URL

2. **Create More Subjects**
   - Go to Admin → Subjects
   - Add CS701, CS702, EC601, etc.

3. **Add More Students/Faculty**
   - Go to Admin → Students/Faculty
   - Create bulk entries

4. **Run Multiple Pipelines**
   - Try different subject combinations
   - See how system handles scale

5. **Explore Reports**
   - View timetables for different semesters
   - Check allocation efficiency
   - Review faculty workload

---

## 📚 Documentation Quick Links

- **QUICK_START_PHASE2.md** - Detailed getting started
- **PHASE2_COMPLETE.md** - All features list
- **SYSTEM_ARCHITECTURE.md** - Technical deep dive
- **TIMETABLE_PDF_IMPLEMENTATION.md** - PDF customization
- **FILES_CREATED_PHASE2.md** - Code structure

---

## 🆘 Need Help?

1. **Check Terminal Logs** - Most issues show in terminal output
2. **Read Documentation** - All features are documented
3. **Try the Test Commands** - Verify each service independently
4. **Restart Services** - Often fixes temporary issues

---

## 🎯 You're Ready to Go!

The system is production-ready and fully functional. 

**Start with the 5-minute setup above, then explore!**

Questions? Check the logs or documentation files.

**Happy automating! 🚀**
