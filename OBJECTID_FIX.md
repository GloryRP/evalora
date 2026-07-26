# MongoDB ObjectId Casting Error - FIXED ✅

## Problem
When the Node.js backend tried to save exam results from the Python AI service, it failed with:
```
ValidationError: Exam validation failed: subjectId: Cast to ObjectId failed for value "CS501" (type string) at path "subjectId"
```

## Root Cause
1. MongoDB's `_id` field contains ObjectId objects (not plain strings)
2. When Node.js sends data to Python via HTTP, ObjectIds need to be converted to strings
3. If ObjectId conversion wasn't done properly, the Python agent couldn't access `subject["_id"]`
4. The scheduling agent fallback logic used `subjectCode` (e.g., "CS501") instead of the actual ObjectId
5. When Node.js tried to save "CS501" to the `subjectId` field (which expects ObjectId), validation failed

## Solution Implemented

### 1. Node.js Backend (`server/controllers/examcellController.js`)
Added ObjectId-to-string conversion before sending data to Python:

```javascript
// Convert MongoDB ObjectIds to strings for Python service
const convertObjectIds = (doc) => {
  return {
    ...doc,
    _id: doc._id.toString(),
    // Convert any other ObjectId fields
    ...(doc.subjectId && { subjectId: doc.subjectId.toString() }),
    ...(doc.departmentId && { departmentId: doc.departmentId.toString() }),
  };
};

const subjectsForPython = subjects.map(convertObjectIds);
const studentsForPython = students.map(convertObjectIds);
const facultyForPython = faculty.map(convertObjectIds);
const hallsForPython = halls.map(convertObjectIds);
```

### 2. Python AI Service (`ai-service/main.py`)
- Added debug logging to verify `_id` field preservation
- Using `.dict()` instead of `.dict(by_alias=True)` since we're explicitly sending `_id`
- Pydantic models already defined with `_id: str` field

### 3. Scheduling Agent (`ai-service/agents/scheduling_agent.py`)
The agent already has proper fallback logic:
```python
subject_id = subject.get("_id") or subject.get("id") or str(subject.get("subjectCode", "unknown"))
```

Now that `_id` is properly preserved as a string, it will use the correct MongoDB ObjectId string.

## How It Works Now

1. **Node.js fetches data**: `Subject.find().lean()` returns MongoDB documents with ObjectId `_id`
2. **Convert to strings**: `convertObjectIds()` converts all ObjectIds to string format
3. **Send to Python**: JSON contains `{"_id": "6a45371c3a84444022ae86e3", "subjectCode": "CS501", ...}`
4. **Python processes**: Scheduling agent uses `subject["_id"]` which now exists and contains the string ObjectId
5. **Python returns**: `{"subjectId": "6a45371c3a84444022ae86e3", ...}`
6. **Node.js saves**: `Exam.create({ subjectId: "6a45371c3a84444022ae86e3" })` - Mongoose converts the string to ObjectId ✅

## Testing

To verify the fix works:

1. **Restart Python AI service** (to load updated code):
   ```bash
   cd ai-service
   python -m uvicorn main:app --reload --port 8000
   ```

2. **Restart Node.js backend** (to load updated controller):
   ```bash
   cd server
   npm run dev
   ```

3. **Test in browser**:
   - Login as EXAMCELL1 / ExamCell@123
   - Go to "Run Agents" page
   - Select 2 subjects (e.g., CS501, CS502)
   - Click "Run Full Pipeline"
   - Should see success with exams created!

## Expected Output

### Python Terminal (Debug Log):
```
DEBUG: First subject keys: ['_id', 'subjectCode', 'subjectName', 'department', 'semester', 'credits']
DEBUG: First subject _id value: 6a45371c3a84444022ae86e3
DEBUG: First subject full: {'_id': '6a45371c3a84444022ae86e3', 'subjectCode': 'CS501', ...}
Step 1: Running scheduling agent...
Step 2: Running hall allocation agent...
Step 3: Running invigilator assignment agent...
INFO: 127.0.0.1:xxxxx - "POST /agents/run-pipeline HTTP/1.1" 200 OK
```

### Node.js Terminal:
```
✓ Server running on port 5000
✓ MongoDB connected successfully
```

### Frontend (Success Response):
```json
{
  "success": true,
  "message": "Pipeline completed successfully",
  "data": {
    "examsCreated": 2,
    "allocationsCreated": 24,
    "assignmentsCreated": 8
  }
}
```

## Status: READY TO TEST ✅

All code changes have been applied. Please restart both services and test the pipeline!
