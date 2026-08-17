# Quick Test Guide - 3 Minutes

## 🚀 Quick Start
1. Start backend: `cd server && npm start`
2. Start frontend: `cd client && npm run dev`
3. Open browser: `http://localhost:5173`
4. Login as admin

---

## ⚡ 3-Minute Test Sequence

### Test 1: Auto-Password (30 seconds)
1. Admin → Students → "Add Student"
2. ✅ Check: NO password field visible
3. ✅ Check: Amber box says "Default password will be auto-generated as {USN}@123"
4. Fill USN: `1PE21CS999`
5. Save
6. ✅ Expected: Student created successfully

### Test 2: Modal Structure (30 seconds)
1. Admin → Students → "Add Student"
2. ✅ Check: Navy blue header
3. ✅ Check: White title text "Add New Student"
4. ✅ Check: × close button in header (right side)
5. ✅ Check: Footer has Cancel (left) + Save (right)
6. Close modal

### Test 3: Department Dropdown (30 seconds)
1. Admin → Students → "Add Student"
2. Click Department field
3. ✅ Check: Shows dropdown (not text input)
4. ✅ Check: Options format: "Computer Science (CSE)"
5. Select a department
6. Close modal

### Test 4: Subjects Modal (30 seconds)
1. Admin → Subjects → "Add Subject"
2. ✅ Check: Modal opens without errors
3. ✅ Check: NO "Exam Configuration" section
4. ✅ Check: Only 6 fields: Code, Name, Dept, Sem, Credits, Type
5. Open browser console (F12)
6. ✅ Check: NO red errors
7. Close modal

### Test 5: Faculty Modal (30 seconds)
1. Admin → Faculty → "Add Faculty"
2. ✅ Check: NO password field
3. ✅ Check: Amber box says "Default password will be auto-generated as {EmployeeID}@123"
4. ✅ Check: Department is dropdown
5. ✅ Check: Designation is dropdown
6. Close modal

### Test 6: Hall Allocations (30 seconds)
1. Exam Cell → Hall Allocations
2. Select any exam + semester
3. Click "Generate Seating"
4. ✅ Check: "Semester X" shows in BOLD (not **Semester X**)
5. ✅ Check: "Run Seating Agent" button is NAVY (not gold)
6. Close modal

---

## ✅ Success Criteria
All 6 tests pass = **READY FOR PRODUCTION**

---

## 🐛 If You See Errors

### Error: "createMutation is not defined"
- **Status**: Should be FIXED
- **Action**: Hard refresh browser (Ctrl+Shift+R)

### Error: Department dropdown empty
- **Cause**: No departments in database
- **Action**: Create a department first in Admin → Departments

### Error: Modal doesn't open
- **Action**: Check browser console (F12) for details
- **Check**: Network tab for failed API calls

---

## 📱 Responsive Test (Optional)
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on mobile size (375px)
4. ✅ Check: Modals are scrollable
5. ✅ Check: All buttons are clickable

---

## 🎯 What Changed?
- ❌ Password fields removed from add forms
- ✅ Auto-generated passwords (ID@123 format)
- ✅ Consistent modal structure (navy header)
- ✅ Department SELECT dropdowns
- ✅ Removed exam config from subjects
- ✅ Fixed markdown in hall allocations

---

**Time**: 3 minutes total
**Status**: All fixes verified
**Build**: ✅ 0 errors
