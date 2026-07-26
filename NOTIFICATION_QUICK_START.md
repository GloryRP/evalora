# Notification System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This is the **fastest way** to test if the notification system works. Follow these steps in order.

---

## Step 1: Test Email Connection (1 minute)

Open terminal in `server` folder and run:

```bash
cd server
node test-email.js
```

**Expected Output**:
```
=== TESTING EMAIL CONNECTION ===

Step 1: Checking environment variables...
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: sumangalachikalgudd24@gmail.com
SMTP_PASS: ✓ SET (hidden)
SMTP_FROM: Exam System <sumangalachikalgudd24@gmail.com>
✓ Environment variables configured

Step 2: Creating SMTP transporter...
✓ Transporter created

Step 3: Verifying SMTP connection...
✓ SMTP connection verified successfully

Step 4: Sending test email...
✓ Test email sent successfully!
Message ID: ...

📧 Check your inbox: sumangalachikalgudd24@gmail.com

=== EMAIL TEST COMPLETE ===

✅ Your notification system is ready to use!
```

**✅ If you see this**: Email is working, proceed to Step 2

**❌ If you see errors**: Check these:
- Gmail App Password correct in `.env`?
- Internet connection working?
- Gmail account not locked?

---

## Step 2: Seed Test Data (1 minute)

```bash
node seed.js
```

**Expected Output**:
```
✓ Connected to MongoDB
✓ Cleared existing test data
✓ Created admin: ADMIN1 (admin1@admin.test)
✓ Created examcell: EXAMCELL1 (examcell1@examcell.test)
✓ Created student: STUDENT1 (student1@student.test)
✓ Created faculty: FACULTY1 (faculty1@faculty.test)
...
✓ Database seeded successfully!
```

---

## Step 3: Start All Services (1 minute)

Open **4 separate terminal windows**:

### Terminal 1: AI Service
```bash
cd ai-service
python main.py
```
Wait for: `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2: Backend
```bash
cd server
npm run dev
```
Wait for: `✓ Server running on port 5000`

### Terminal 3: Frontend
```bash
cd client
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### Terminal 4: Keep for monitoring
Leave this open to watch backend logs

---

## Step 4: Run Pipeline (2 minutes)

### 4.1 Login to Exam Cell
1. Open browser: `http://localhost:5173`
2. Login with:
   - **Username**: `EXAMCELL1`
   - **Password**: `ExamCell@123`

### 4.2 Create Exams
1. Click **"Exams"** in sidebar
2. Click **"Add Exam"** button
3. Create 2 exams:

**Exam 1:**
- Subject: Database Management Systems (CS501)
- Date: Tomorrow
- Start Time: 10:00 AM
- End Time: 12:00 PM
- Semester: 5
- Type: Regular

**Exam 2:**
- Subject: Operating Systems (CS502)
- Date: Tomorrow
- Start Time: 02:00 PM
- End Time: 04:00 PM
- Semester: 5
- Type: Regular

### 4.3 Run Pipeline
1. Click **"Run Agents"** in sidebar
2. Select Semester: **5**
3. Click **"Run Full Pipeline"**
4. Wait 7-12 seconds

### 4.4 Check Backend Console (Terminal 4)

**Watch for these logs**:
```
=== STARTING FULL PIPELINE ===

Step 1/3: AI Scheduling Agent...
✓ Scheduling complete

Step 2/3: Hall Allocation Agent...
✓ Hall allocation complete

Step 3/3: Invigilator Assignment Agent...
✓ Invigilator assignment complete

=== TRIGGERING POST-PIPELINE NOTIFICATIONS ===

Sending hall tickets to 6 students...
Sending hall ticket to STUDENT1...

=== SENDING NOTIFICATION ===
Type: hall_ticket
Recipient: Jane Smith (student)
Email: student1@student.test
✓ In-app notification saved (ID: ...)
⚠️  Invalid or missing email address: student1@student.test
=== NOTIFICATION COMPLETE ===

Sending duty notifications to 3 faculty...
Sending duty to Dr. John Doe...

=== SENDING NOTIFICATION ===
Type: invigilation_duty
Recipient: Dr. John Doe (faculty)
Email: faculty1@faculty.test
✓ In-app notification saved (ID: ...)
⚠️  Invalid or missing email address: faculty1@faculty.test
=== NOTIFICATION COMPLETE ===

=== NOTIFICATIONS COMPLETE ===
```

**Note**: You'll see "Invalid or missing email address" because `.test` is not a real email domain. That's OK! The in-app notifications are still saved.

---

## Step 5: Check Notifications (1 minute)

### 5.1 Check Student Notification
1. Logout from EXAMCELL1 (top right corner)
2. Login as **STUDENT1** / `Student@123`
3. Look at top right corner → **🔔 Bell icon**
4. Should show **red badge with "1"**
5. Click bell → dropdown opens
6. Should see:
   - Title: "Hall Ticket - Semester 5"
   - Message: "Your hall ticket for 2 exam(s) is ready"
   - Golden left border (unread)
   - Yellow background

**✅ If you see this**: Student notifications working!

### 5.2 Check Faculty Notification
1. Logout from STUDENT1
2. Login as **FACULTY1** / `Faculty@123`
3. Click bell icon (top right)
4. Should see:
   - Title: "Invigilation Duty Assigned"
   - Message: "You have been assigned X invigilation duty(ies)"
   - Golden left border

**✅ If you see this**: Faculty notifications working!

### 5.3 Test Mark as Read
1. Click on the notification
2. Border should change to transparent
3. Background should change to white
4. Badge count should decrease

**✅ If this works**: UI features working!

---

## 🎉 Success!

If all 5 steps worked, your notification system is **fully operational**!

---

## 📧 Optional: Test Real Email Delivery

If you want to receive actual emails (not just in-app notifications):

### Update Email Addresses
1. Login as **ADMIN1** / `Admin@123`
2. Navigate to **"Students"**
3. Edit **STUDENT1**:
   - Change email from `student1@student.test`
   - To: `your-real-email@gmail.com`
   - Click **Save**

4. Navigate to **"Faculty"**
5. Edit **FACULTY1**:
   - Change email to your real Gmail
   - Click **Save**

### Run Pipeline Again
1. Login as **EXAMCELL1**
2. Go to **"Run Agents"**
3. Run pipeline for Semester 5 again
4. Check your Gmail inbox
5. You should receive:
   - **As student**: Hall ticket email with exam schedule table
   - **As faculty**: Invigilation duty email with duties table

**✅ If emails arrive**: Full system working perfectly!

---

## 🐛 Troubleshooting

### Problem: No bell badge showing
**Fix**: 
1. Open browser console (F12)
2. Check for errors
3. Try hard refresh (Ctrl+Shift+R)
4. Check if user is logged in

### Problem: "Invalid email address" in console
**Expected**: `.test` domain is fake, emails won't send
**Fix**: Update to real Gmail address (see Optional section above)

### Problem: Email test script fails
**Fix**:
1. Check `.env` file has correct `SMTP_PASS`
2. Generate new Gmail App Password:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Generate App Password (select "Mail" + "Windows")
   - Copy 16-character password
   - Update `SMTP_PASS` in `.env`

### Problem: Pipeline fails
**Fix**:
1. Check AI service is running (Terminal 1)
2. Check backend is running (Terminal 2)
3. Check MongoDB connection
4. Check browser console for errors

---

## 📚 More Information

- **Full Testing Guide**: `NOTIFICATION_SYSTEM_TEST.md` (10 detailed test scenarios)
- **Verification Summary**: `NOTIFICATION_VERIFICATION_SUMMARY.md` (complete system check)
- **Original Documentation**: `NOTIFICATION_SYSTEM_COMPLETE.md` (implementation details)

---

## 🎯 Next Steps

After testing notifications:
1. ✅ Mark notification system as working
2. Move to next feature: **Timetable PDF Generation**
3. Documentation: `TIMETABLE_PDF_IMPLEMENTATION.md`

---

**That's it! You're done in 5 minutes.** 🚀
