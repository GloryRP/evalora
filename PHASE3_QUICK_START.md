# Phase 3 - QUICK START GUIDE

## ⚡ 5-MINUTE SETUP

### 1️⃣ Configure Email (1 minute)

Edit `server/.env` and add these 3 lines:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_char_gmail_app_password
SMTP_FROM=Exam System <your_gmail@gmail.com>
```

**Getting Gmail App Password:**
1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication (if needed)
3. Find "App passwords"
4. Select Mail + Windows Computer
5. Copy the 16-character password
6. Paste into SMTP_PASS above

### 2️⃣ Seed Database (1 minute)

```bash
cd server
node seed.js
```

Creates test users with emails + config.

### 3️⃣ Start Backend (Terminal 1)

```bash
cd server
npm run dev
```

Wait for: `✓ Server running on port 5000`

### 4️⃣ Start Frontend (Terminal 2)

```bash
cd client
npm run dev
```

Wait for: `Local: http://localhost:5173`

### 5️⃣ Test the System (2 minutes)

1. Go to: http://localhost:5173
2. Login: `EXAMCELL1` / `ExamCell@123`
3. Navigate: ExamCell → Run Agents
4. Select a subject and click "Run Pipeline"
5. Wait ~7 seconds
6. Check:
   - Notification bell (top-right) shows badge
   - Your email inbox for emails from "Exam System"
   - Student portal: Login as `STUDENT1` / `Student@123` → Hall Ticket
   - Faculty portal: Login as `FACULTY1` / `Faculty@123` → My Duties

---

## 📋 TEST CHECKLIST

After running pipeline, you should see:

- [ ] Notification bell in layout sidebar (top-right)
- [ ] Red badge on bell with unread count
- [ ] Click bell shows dropdown with notifications
- [ ] Email in Gmail inbox with hall ticket
- [ ] Email in Gmail inbox with duty assignment
- [ ] Email in Gmail inbox with timetable published
- [ ] Students can view hall tickets in Student → Hall Ticket
- [ ] Faculty can view duties in Faculty → My Duties
- [ ] Admin can edit settings in Admin → Institution Settings
- [ ] Institution name changes appear in Login footer

---

## 🔑 LOGIN CREDENTIALS

```
ADMIN1       / Admin@123        (Can access Institution Settings)
EXAMCELL1    / ExamCell@123     (Can run pipeline)
FACULTY1     / Faculty@123      (Can view duties)
STUDENT1     / Student@123      (Can view hall ticket)
HOD1         / HOD@123          (Receives timetable notifications)
PRINCIPAL1   / Principal@123    (Placeholder dashboard)
```

---

## 📊 WHAT HAPPENS WHEN YOU RUN THE PIPELINE

```
ExamCell → Run Pipeline (click button)
    ↓
AI Service (Python) processes:
  - Creates exams
  - Assigns students to halls
  - Assigns invigilators
    ↓
Backend (Node.js) automatically:
  - Saves all data to MongoDB
  - Sends 3 types of emails:
    • Hall ticket emails to all students
    • Duty emails to all faculty
    • Timetable email to HOD
  - Saves notifications in database
    ↓
Frontend (React):
  - Notification bell shows unread count
  - Polls every 30 seconds for new notifications
  - Users can see details in bell dropdown
    ↓
Users receive:
  - Professional HTML emails with institution branding
  - In-app notifications in portal
```

---

## 🚨 TROUBLESHOOTING

### Emails Not Sending?
1. Check SMTP credentials in `.env` are correct
2. Verify Gmail app password (16 chars, with spaces okay)
3. Check Gmail security settings allow less secure apps
4. Restart backend: `npm run dev`

### Notification Bell Not Appearing?
1. Clear browser cache: Ctrl+F5
2. Verify user is logged in (requires JWT token)
3. Check browser console for errors: F12
4. Try logging out and back in

### Can't See Hall Ticket?
1. Make sure pipeline was run successfully
2. Check you're logged in as student
3. Verify student has exams assigned (check MongoDB)
4. Try browser F5 refresh

### Institution Name Not Changing?
1. Verify logged in as admin
2. Go to Admin → Institution Settings
3. Change name and click "Save Settings"
4. Refresh browser
5. Logout and login again
6. Check login page footer for new name

---

## 📁 FILE STRUCTURE

```
exam-automation-system/
├── server/
│   ├── models/
│   │   ├── Notification.js              ✨ NEW
│   │   └── User.js                      📝 MODIFIED
│   ├── routes/
│   │   ├── notifications.js             ✨ NEW
│   │   ├── student.js                   ✨ NEW
│   │   ├── faculty.js                   ✨ NEW
│   │   └── index.js                     📝 MODIFIED
│   └── services/
│       └── notificationService.js       ✨ NEW
│
├── client/
│   └── src/
│       ├── contexts/
│       │   └── InstitutionContext.jsx   ✨ NEW
│       ├── components/
│       │   └── NotificationBell.jsx     ✨ NEW
│       ├── layouts/
│       │   ├── StudentLayout.jsx        ✨ NEW
│       │   ├── FacultyLayout.jsx        ✨ NEW
│       │   ├── AdminLayout.jsx          📝 MODIFIED
│       │   └── ExamCellLayout.jsx       📝 MODIFIED
│       └── pages/
│           ├── Login.jsx                📝 MODIFIED
│           ├── App.jsx                  📝 MODIFIED
│           ├── admin/
│           │   └── InstitutionSettings.jsx ✨ NEW
│           ├── student/
│           │   ├── StudentDashboard.jsx ✨ NEW
│           │   ├── HallTicket.jsx       ✨ NEW
│           │   └── StudentTimetable.jsx ✨ NEW
│           └── faculty/
│               ├── FacultyDashboard.jsx ✨ NEW
│               └── MyDuties.jsx         ✨ NEW

✨ NEW = Created
📝 MODIFIED = Updated
```

---

## 🎯 ONE-LINE OVERVIEW

**Before:**
System was for PES Institute only, no email notifications, only ExamCell/Admin portals.

**After:**
System works for ANY college, sends professional emails to students/faculty/HOD, has dedicated Student/Faculty portals, admin can configure institution details, auto-triggers notifications after pipeline.

---

## 🔗 USEFUL COMMANDS

```bash
# Start everything
cd server && npm run dev              # Terminal 1 - Backend
cd client && npm run dev              # Terminal 2 - Frontend

# Seed test data
cd server && node seed.js

# Check MongoDB
# Use MongoDB Compass or mongosh
# Database: examdb

# View logs
# Backend: Check Terminal 1 for errors
# Frontend: F12 → Console tab in browser

# Verify build
cd client && npm run build

# Clear cache if issues
# Browser: Ctrl+F5
# Node: rm -r node_modules && npm install
```

---

## ✅ SUCCESS CRITERIA

You'll know it's working when:

1. ✅ Can login as any role
2. ✅ ExamCell can run pipeline
3. ✅ Notification bell appears in sidebar
4. ✅ Emails received in Gmail
5. ✅ Students can see hall tickets
6. ✅ Faculty can see duties
7. ✅ Admin can update settings
8. ✅ Institution name appears dynamically everywhere
9. ✅ No errors in browser console
10. ✅ No errors in server terminal

---

## 📞 SUPPORT

If something doesn't work:

1. **Check email credentials** - Most common issue
2. **Check MongoDB connection** - `MONGO_URI` in .env
3. **Check ports** - Backend 5000, Frontend 5173
4. **Clear cache** - Ctrl+F5 in browser
5. **Check logs** - Server terminal + F12 console
6. **Verify seed** - Run `node seed.js` again
7. **Restart everything** - Kill terminals, start over

---

## 🎉 YOU'RE DONE!

Phase 3 is complete. Your system:
- Works with ANY college/university
- Sends professional emails
- Has student & faculty portals
- Includes admin settings
- Auto-triggers notifications
- Is ready for production

**Next: Run the quick start above and test!** 🚀

---

## 📚 DETAILED DOCS

For more information, see:
- `PHASE3_COMPLETE.md` - Full documentation
- `PHASE3_CHECKLIST.md` - Verification steps
- `PHASE3_FINAL_SUMMARY.md` - Complete summary
- `TIMETABLE_PDF_DOWNLOAD.md` - PDF generation guide
