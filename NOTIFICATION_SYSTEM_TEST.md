# Notification System - Comprehensive Testing Guide

## Date: July 7, 2026
## Status: ✅ READY FOR TESTING

---

## System Overview

The notification system sends **role-specific notifications** to students and faculty after the exam pipeline completes:

- **Students**: Receive hall tickets with seat numbers, exam schedule, and hall details
- **Faculty**: Receive invigilation duty assignments with hall, date/time, and role (Chief/Invigilator)
- **Delivery**: Both in-app notifications + email (HTML formatted)

---

## Pre-Testing Checklist

### ✅ 1. All Dependencies Installed
```bash
cd server
npm install
# Verify nodemailer is listed in package.json dependencies
```

### ✅ 2. Environment Variables Configured
Check `server/.env` has SMTP settings:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sumangalachikalgudd24@gmail.com
SMTP_PASS=zzfqxkpfwpnfxaux
SMTP_FROM=Exam System <sumangalachikalgudd24@gmail.com>
```

### ✅ 3. Database Seeded with Test Data
```bash
cd server
node seed.js
```

Expected output:
```
✓ Connected to MongoDB
✓ Cleared existing test data
✓ Created admin: ADMIN1 (admin1@admin.test)
✓ Created examcell: EXAMCELL1 (examcell1@examcell.test)
✓ Created faculty: FACULTY1 (faculty1@faculty.test)
✓ Created student: STUDENT1 (student1@student.test)
...
✓ Created student: TEST001 - Alice Kumar (test001@student.test)
...
✓ Created faculty: FAC001 - Dr. Sarah Johnson (fac001@faculty.test)
...
✓ Database seeded successfully!
```

### ✅ 4. All Services Running

**Terminal 1 - MongoDB:**
```bash
# Ensure MongoDB is running (if local)
# Or verify cloud MongoDB connection
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
# Activate virtual environment (if using venv)
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

python main.py
```

Expected output:
```
Uvicorn running on http://0.0.0.0:8000
```

**Terminal 3 - Backend Server:**
```bash
cd server
npm run dev
```

Expected output:
```
✓ MongoDB connected successfully
✓ Server running on port 5000
```

**Terminal 4 - Frontend:**
```bash
cd client
npm run dev
```

Expected output:
```
VITE ready in XXXms
Local: http://localhost:5173/
```

---

## Test Scenarios

### Test 1: Basic Notification Flow (End-to-End)

**Objective**: Verify that notifications are sent after running the full pipeline.

**Steps**:
1. Open browser → `http://localhost:5173`
2. Login as **EXAMCELL1** / `ExamCell@123`
3. Navigate to **"Exams"** page
4. Create at least 2 exams for Semester 5:
   - Subject: Database Management Systems (CS501)
   - Date: Tomorrow
   - Time: 10:00 AM - 12:00 PM
   - Semester: 5
   - Type: Regular

5. Navigate to **"Run Agents"** page
6. Select Semester: **5**
7. Click **"Run Full Pipeline"**

**Expected Backend Console Output**:
```
=== STARTING FULL PIPELINE ===
Semester: 5

Step 1/3: AI Scheduling Agent...
✓ Scheduling complete (X exams scheduled)

Step 2/3: Hall Allocation Agent...
✓ Hall allocation complete (X students allocated)

Step 3/3: Invigilator Assignment Agent...
✓ Invigilator assignment complete (X assignments made)

=== TRIGGERING POST-PIPELINE NOTIFICATIONS ===
Exams: X, Allocations: X, Assignments: X

Sending hall tickets to X students...
Sending hall ticket to STUDENT1...

=== SENDING NOTIFICATION ===
Type: hall_ticket
Recipient: Jane Smith (student)
Email: student1@student.test
✓ In-app notification saved (ID: ...)
✓ Email sent to student1@student.test
=== NOTIFICATION COMPLETE ===

Sending hall ticket to TEST001...
✓ Email sent to test001@student.test
...

Sending duty notifications to X faculty...
Sending duty to Dr. John Doe...

=== SENDING NOTIFICATION ===
Type: invigilation_duty
Recipient: Dr. John Doe (faculty)
Email: faculty1@faculty.test
✓ In-app notification saved (ID: ...)
✓ Email sent to faculty1@faculty.test
=== NOTIFICATION COMPLETE ===

=== NOTIFICATIONS COMPLETE ===
```

**Expected Frontend Response**:
- Success message: "Pipeline completed successfully"
- Processing time: ~7-12 seconds

---

### Test 2: Student Hall Ticket Notification

**Objective**: Verify student receives hall ticket notification.

**Steps**:
1. After pipeline completes, logout from EXAMCELL1
2. Login as **STUDENT1** / `Student@123`
3. Check the **notification bell icon** (top right)

**Expected Result**:
- 🔔 Bell icon shows **red badge** with number "1"
- Click bell → dropdown opens
- Shows notification:
  - **Title**: "Hall Ticket - Semester 5"
  - **Message**: "Your hall ticket for X exam(s) is ready"
  - **Time**: "Just now"
  - Golden left border (unread)
  - Yellow background (#fffbf0)

**Click Notification**:
- Left border changes to transparent
- Background changes to white
- Badge count decreases by 1

**Check Email** (if using real Gmail):
1. Open email client
2. Check inbox for: `sumangalachikalgudd24@gmail.com`
3. Subject: **"Hall Ticket - PES Institute of Technology & Management - Semester 5"**
4. Open email → should show:
   - Institution header (navy blue)
   - Student details box (USN, Name, Department, Semester)
   - Exam schedule table with:
     - Subject Name & Code
     - Date & Day
     - Time
     - Hall Name & Building
     - **Seat Number** (highlighted in gold)
   - Important instructions
   - Professional footer

---

### Test 3: Faculty Invigilation Duty Notification

**Objective**: Verify faculty receives duty notification.

**Steps**:
1. Logout from STUDENT1
2. Login as **FACULTY1** / `Faculty@123`
3. Check the **notification bell icon**

**Expected Result**:
- 🔔 Bell icon shows **red badge** with number "1"
- Click bell → dropdown opens
- Shows notification:
  - **Title**: "Invigilation Duty Assigned"
  - **Message**: "You have been assigned X invigilation duty(ies)"
  - **Time**: "Just now"
  - Golden left border (unread)

**Check Email**:
- Subject: **"Invigilation Duty Assigned - PES Institute of Technology & Management"**
- Email content:
  - Institution header
  - Faculty details box (Name, Employee ID, Department)
  - Duties table with:
    - Date & Day
    - Time
    - Subject & Code
    - Semester & Department
    - Hall & Building
    - **Role** (Chief Invigilator or Invigilator - color coded)
  - Important instructions (report 30 min early)
  - Professional footer

---

### Test 4: Notification Bell Features

**Objective**: Test all notification bell UI features.

**Steps**:
1. Login as any user with notifications
2. Click bell icon → dropdown opens

**Test 4.1: Mark Single as Read**
- Click on an **unread notification** (golden border)
- Border should change to transparent
- Background changes to white
- Badge count decreases

**Test 4.2: Mark All as Read**
- Click **"Mark all read"** button (top right of dropdown)
- All notifications change to white background
- Badge count becomes 0 or disappears

**Test 4.3: Click Outside to Close**
- Click bell → dropdown opens
- Click anywhere outside dropdown
- Dropdown should close

**Test 4.4: Polling (Auto-refresh)**
- Keep dropdown closed
- Wait 30 seconds
- Badge count should update automatically (if new notifications arrive)

**Test 4.5: Empty State**
- Login as a user with NO notifications (e.g., ADMIN1)
- Click bell → dropdown opens
- Should show:
  - Bell icon (large, gray)
  - Message: "No notifications yet"

---

### Test 5: Semester Filtering

**Objective**: Verify students only receive notifications for their semester.

**Steps**:
1. Login as **EXAMCELL1**
2. Create exams for **Semester 6**
3. Run pipeline for **Semester 6**
4. Check backend console

**Expected Result**:
- Students with `semester: 5` (STUDENT1, TEST001-004, TEST009) → **NO notifications**
- Students with `semester: 6` (TEST005, TEST006, TEST010) → **Receive hall tickets**

**Verification**:
1. Login as **TEST005** (Semester 6 student)
   - Should have notification bell badge
2. Login as **STUDENT1** (Semester 5 student)
   - Should NOT have new notification for Semester 6 exams

---

### Test 6: Multiple Runs (Idempotency)

**Objective**: Verify multiple pipeline runs don't duplicate notifications.

**Steps**:
1. Login as **EXAMCELL1**
2. Run pipeline for Semester 5 → wait for completion
3. Check backend console → X notifications sent
4. Run pipeline AGAIN for Semester 5 → wait for completion
5. Check backend console → X notifications sent AGAIN

**Expected Behavior**:
- Each pipeline run sends NEW notifications
- Old allocations are cleared before new ones are created
- Users will receive duplicate notifications (by design)
- **Note**: This is expected behavior. If you want to prevent duplicates, we need to add duplicate detection logic.

**Verification**:
1. Login as **STUDENT1**
2. Bell badge shows "2" (or more)
3. Dropdown shows 2+ notifications (one per run)

---

### Test 7: Email Failure Handling

**Objective**: Verify system handles email failures gracefully.

**Steps**:
1. Stop backend server
2. Edit `server/.env` → change `SMTP_PASS` to incorrect value: `wrongpassword`
3. Start backend server
4. Login as **EXAMCELL1**
5. Run pipeline for Semester 5

**Expected Backend Console Output**:
```
=== SENDING NOTIFICATION ===
Type: hall_ticket
Recipient: Jane Smith (student)
Email: student1@student.test
✓ In-app notification saved (ID: ...)
⚠️  Email failed to student1@student.test: Invalid login: 535-5.7.8 Username and Password not accepted
=== NOTIFICATION COMPLETE ===
```

**Expected Result**:
- In-app notification is still saved (bell badge shows)
- Email is NOT sent (but system doesn't crash)
- Pipeline completes successfully
- Frontend shows success message

**Cleanup**:
1. Stop backend
2. Restore correct `SMTP_PASS` in `.env`
3. Restart backend

---

### Test 8: Missing Email Handling

**Objective**: Verify system handles missing email addresses.

**Steps**:
1. Login as **ADMIN1**
2. Navigate to **"Students"** page
3. Edit **TEST001** → remove email address → save
4. Logout → Login as **EXAMCELL1**
5. Run pipeline for Semester 5

**Expected Backend Console Output**:
```
Sending hall tickets to X students...
Sending hall ticket to STUDENT1...
✓ Email sent to student1@student.test
...
⚠️  Invalid or missing email address: undefined
```

**Expected Result**:
- Students with valid emails receive notifications
- Student with missing email:
  - In-app notification is still saved
  - Email is skipped with warning
  - Pipeline doesn't crash

**Cleanup**:
1. Edit TEST001 → add email back: `test001@student.test`

---

### Test 9: Notification Data Structure

**Objective**: Verify notification contains correct data.

**Steps**:
1. After pipeline completes, open MongoDB client (Compass/Shell)
2. Query `notifications` collection:
```javascript
db.notifications.find({ type: 'hall_ticket' }).limit(1).pretty()
```

**Expected Document Structure**:
```json
{
  "_id": "...",
  "recipientId": "...",  // User _id
  "recipientRole": "student",
  "type": "hall_ticket",
  "title": "Hall Ticket - Semester 5",
  "message": "Your hall ticket for 2 exam(s) is ready",
  "data": {
    "studentName": "Jane Smith",
    "usn": "STUDENT1",
    "department": "Computer Science",
    "semester": 5,
    "exams": [
      {
        "subjectName": "Database Management Systems",
        "subjectCode": "CS501",
        "examDate": "2026-07-08T00:00:00.000Z",
        "startTime": "10:00 AM",
        "endTime": "12:00 PM",
        "hallName": "Hall A",
        "building": "Main Block",
        "seatNumber": "A-001"
      }
    ]
  },
  "isRead": false,
  "emailSent": true,
  "emailSentAt": "2026-07-07T...",
  "createdAt": "2026-07-07T...",
  "updatedAt": "2026-07-07T..."
}
```

**Verify Faculty Notification**:
```javascript
db.notifications.find({ type: 'invigilation_duty' }).limit(1).pretty()
```

Expected `data` structure:
```json
{
  "facultyName": "Dr. John Doe",
  "employeeId": "FACULTY1",
  "department": "Computer Science",
  "duties": [
    {
      "examDate": "2026-07-08T00:00:00.000Z",
      "startTime": "10:00 AM",
      "endTime": "12:00 PM",
      "subjectName": "Database Management Systems",
      "subjectCode": "CS501",
      "hallName": "Hall A",
      "building": "Main Block",
      "semester": 5,
      "department": "Computer Science",
      "role": "chief"
    }
  ]
}
```

---

### Test 10: API Endpoints

**Objective**: Test notification REST API directly.

**Prerequisites**: Get JWT token by logging in.

**Test 10.1: Get Notifications**
```bash
curl -X GET http://localhost:5000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "count": 2,
  "data": {
    "notifications": [
      {
        "_id": "...",
        "type": "hall_ticket",
        "title": "Hall Ticket - Semester 5",
        "message": "Your hall ticket for 2 exam(s) is ready",
        "isRead": false,
        "createdAt": "..."
      }
    ]
  }
}
```

**Test 10.2: Get Unread Count**
```bash
curl -X GET http://localhost:5000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "unreadCount": 2
  }
}
```

**Test 10.3: Mark One as Read**
```bash
curl -X PATCH http://localhost:5000/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { ... }
}
```

**Test 10.4: Mark All as Read**
```bash
curl -X PATCH http://localhost:5000/api/v1/notifications/read-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "modifiedCount": 2
  }
}
```

---

## Known Issues & Limitations

### 1. Test Email Domain (.test TLD)
- **Issue**: Emails to `@student.test` and `@faculty.test` won't be delivered (fake TLD)
- **Solution**: Update user emails via Admin panel to real Gmail addresses for actual email delivery testing

### 2. Gmail App Password Required
- **Issue**: Regular Gmail password won't work
- **Solution**: Generate Gmail App Password:
  1. Go to Google Account → Security
  2. Enable 2-Step Verification
  3. Generate App Password (select "Mail" and "Windows Computer")
  4. Use 16-character password in `.env`

### 3. Rate Limiting
- **Issue**: Gmail may rate-limit bulk emails
- **Behavior**: 50+ emails in quick succession may trigger rate limits
- **Solution**: Add delay between emails or use dedicated SMTP service (SendGrid, AWS SES)

### 4. Notification Duplicates
- **Issue**: Running pipeline multiple times sends duplicate notifications
- **Current Behavior**: By design (each run is independent)
- **Future Enhancement**: Add duplicate detection based on exam + student

### 5. Email Template Images
- **Issue**: Email templates reference local images (not working in email)
- **Solution**: Upload logo to CDN and use full URL in email template

---

## Troubleshooting

### Problem: No notifications received
**Check**:
1. Backend console shows "=== TRIGGERING POST-PIPELINE NOTIFICATIONS ===" ?
2. Any errors in console after that line?
3. MongoDB has `notifications` collection with documents?
4. User has correct `recipientId` (matches User `_id`)?

### Problem: Email not sent
**Check**:
1. `.env` has correct SMTP credentials?
2. Backend console shows "✓ Email sent to ..." or "⚠️  Email failed..." ?
3. If failed, check error message for clues
4. Try test email with nodemailer test script

### Problem: Bell badge not showing
**Check**:
1. NotificationBell component is imported in layout?
2. Browser console has errors?
3. API call to `/notifications/unread-count` succeeds? (Check Network tab)
4. JWT token is valid?

### Problem: Dropdown not opening
**Check**:
1. Browser console errors?
2. Click event handler attached?
3. Try hard refresh (Ctrl+Shift+R)

### Problem: Backend crash after pipeline
**Check**:
1. Stack trace points to notification code?
2. User or Student/Faculty document missing?
3. Try adding more null checks in `triggerPostPipelineNotifications()`

---

## Performance Metrics

### Expected Times
- **Pipeline Duration**: 7-12 seconds (with notification trigger)
- **Email Sending**: ~500ms per email
- **50 Students + 10 Faculty**: ~30 seconds total (async, doesn't block)
- **Notification Save**: ~50ms per notification
- **Badge Update Poll**: 30 seconds (configurable in NotificationBell.jsx)

### Database Impact
- **Notifications Collection**: +1 document per recipient
- **Index Usage**: `recipientId_1_createdAt_-1`, `recipientId_1_isRead_1`
- **Average Document Size**: ~500 bytes (hall ticket), ~300 bytes (duty)

---

## Success Criteria

✅ **Test 1**: Pipeline triggers notifications → backend console shows email sent logs
✅ **Test 2**: Student login → bell badge shows → dropdown has hall ticket notification
✅ **Test 3**: Faculty login → bell badge shows → dropdown has duty notification
✅ **Test 4**: Mark as read → badge count updates → notification style changes
✅ **Test 5**: Semester 5 students get Semester 5 exams only (not Semester 6)
✅ **Test 6**: Email received (if using real Gmail) with proper HTML formatting
✅ **Test 7**: System handles email failures gracefully (no crash)
✅ **Test 8**: System handles missing emails gracefully (skip with warning)
✅ **Test 9**: MongoDB documents have correct structure and data
✅ **Test 10**: All API endpoints return expected responses

---

## Next Steps After Testing

1. **If all tests pass**:
   - Mark notification system as PRODUCTION READY ✅
   - Move to next feature: Timetable PDF Generation

2. **If tests fail**:
   - Document failures in this file
   - Fix issues one by one
   - Re-run tests until all pass

3. **Future Enhancements**:
   - Add duplicate notification detection
   - Add notification preferences (email on/off)
   - Add push notifications (browser/mobile)
   - Add notification history page
   - Add bulk notification API for admins
   - Add notification templates management UI
   - Add SMS notifications (Twilio integration)

---

## Test Results Log

### Date: _____________
### Tester: _____________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Basic Notification Flow | ⬜ Pass / ⬜ Fail | |
| 2 | Student Hall Ticket | ⬜ Pass / ⬜ Fail | |
| 3 | Faculty Duty | ⬜ Pass / ⬜ Fail | |
| 4 | Bell Features | ⬜ Pass / ⬜ Fail | |
| 5 | Semester Filtering | ⬜ Pass / ⬜ Fail | |
| 6 | Multiple Runs | ⬜ Pass / ⬜ Fail | |
| 7 | Email Failure | ⬜ Pass / ⬜ Fail | |
| 8 | Missing Email | ⬜ Pass / ⬜ Fail | |
| 9 | Data Structure | ⬜ Pass / ⬜ Fail | |
| 10 | API Endpoints | ⬜ Pass / ⬜ Fail | |

### Overall Result: ⬜ All Pass ⬜ Some Failed

### Issues Found:
1. 
2. 
3. 

---

**End of Testing Guide**
