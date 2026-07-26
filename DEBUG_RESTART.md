# CRITICAL: Services Must Be Restarted!

## The Error You're Seeing
```
Cast to ObjectId failed for value "CS503" (type string)
```

This means the OLD code is still running. The scheduling agent is using `subjectCode` as a fallback because it can't find `_id`.

## What Was Fixed
✅ Node.js controller now converts ObjectIds to strings before sending to Python
✅ Python service preserves the `_id` field 
✅ Debug logging added to both sides

## YOU MUST RESTART BOTH SERVICES NOW!

### Step 1: Stop Both Services
Press **Ctrl+C** in both terminals (Node.js and Python)

### Step 2: Restart Python AI Service
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

**Wait for**: `INFO: Application startup complete.`

### Step 3: Restart Node.js Backend  
```bash
cd server
npm run dev
```

**Wait for**: `✓ Server running on port 5000`

### Step 4: Test Again
1. Refresh the browser page (F5)
2. Go to "Run Agents"
3. Select 2 subjects
4. Click "Run Full Pipeline"

### Step 5: Check Debug Output

**Python Terminal Should Show:**
```
DEBUG: First subject keys: ['_id', 'subjectCode', 'subjectName', 'department', 'semester', 'credits']
DEBUG: First subject _id value: 6a45371c3a84444022ae86e3
DEBUG: First subject full: {'_id': '6a45371c3a84444022ae86e3', 'subjectCode': 'CS503', ...}
```

**Node.js Terminal Should Show:**
```
DEBUG Node.js: First subject being sent to Python: {
  "_id": "6a45371c3a84444022ae86e3",
  "subjectCode": "CS503",
  "subjectName": "...",
  ...
}
```

If you see these debug logs with proper `_id` values (NOT "CS503" in the subjectId field), then it's working!

## Why This Happens
- Node.js with `nodemon` should auto-restart when you save files
- Python with `--reload` should also auto-restart
- BUT sometimes they don't pick up changes, especially if files were changed while they weren't watching
- **Solution**: Manual restart to ensure fresh code is loaded

## After Restart
The error will change from:
❌ `Cast to ObjectId failed for value "CS503"`

To:
✅ `Pipeline completed successfully` with exams created!
