# Dynamic Academic Year System - Testing Checklist

## Pre-Testing Setup

### 1. Database Reset (Optional)
```bash
# Run seed script to initialize academic years
cd server
node seed.js
```

### 2. Start Services
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## Test Suite 1: Admin UI - Academic Year Management

### Test 1.1: View Academic Year Management Section
- [ ] Login as Admin (ADMIN1 / Admin@123)
- [ ] Navigate to Admin → Institution Settings
- [ ] Scroll to bottom of page
- [ ] **VERIFY**: "Academic Year Management" section visible
- [ ] **VERIFY**: Current academic year shows "2025-26"
- [ ] **VERIFY**: Current semester shows "Semester 5"

### Test 1.2: View Academic Years History Table
- [ ] In Academic Year Management section
- [ ] **VERIFY**: Table shows at least 2 years (2024-25, 2025-26)
- [ ] **VERIFY**: 2025-26 has "Current" badge (green)
- [ ] **VERIFY**: 2024-25 has no badge or "—"
- [ ] **VERIFY**: Start and end dates are visible

### Test 1.3: Update Current Academic Year
- [ ] In "Update Current Academic Year & Semester" form
- [ ] Change year to "2026-27"
- [ ] Change semester to "6"
- [ ] Click "Update Academic Year" button
- [ ] **VERIFY**: Success toast appears
- [ ] **VERIFY**: Current settings box updates to "2026-27" and "Semester 6"
- [ ] **VERIFY**: Button shows loading state during update

### Test 1.4: Add New Academic Year
- [ ] Click "Add New Year" button
- [ ] **VERIFY**: Form appears with 3 fields
- [ ] Enter Year: "2026-27"
- [ ] Select Start Date: "2026-06-01"
- [ ] Select End Date: "2027-05-31"
- [ ] Click "Add Year" button
- [ ] **VERIFY**: Success toast appears
- [ ] **VERIFY**: Form closes
- [ ] **VERIFY**: New year appears in history table
- [ ] Click "Cancel" on add form
- [ ] **VERIFY**: Form closes without adding

### Test 1.5: Validation
- [ ] Click "Add New Year"
- [ ] Leave fields empty
- [ ] Click "Add Year"
- [ ] **VERIFY**: Error toast about required fields
- [ ] Enter duplicate year (e.g., "2025-26")
- [ ] Click "Add Year"
- [ ] **VERIFY**: Error toast about duplicate year

---

## Test Suite 2: System-Wide Academic Year Updates

### Test 2.1: Exam Cell - Compute Results
- [ ] Update academic year to "2026-27" from Admin settings
- [ ] Navigate to Exam Cell → Compute Results
- [ ] **VERIFY**: Academic Year field shows "2026-27"
- [ ] **VERIFY**: Semester dropdown defaults to "6"
- [ ] **VERIFY**: No hardcoded "2025-26" visible

### Test 2.2: Exam Cell - Publish Results
- [ ] Navigate to Exam Cell → Publish Results
- [ ] **VERIFY**: Academic Year filter shows "2026-27"
- [ ] **VERIFY**: Semester dropdown defaults to "6"
- [ ] **VERIFY**: Page loads without errors

### Test 2.3: Exam Cell - Results View
- [ ] Navigate to Exam Cell → Results View
- [ ] **VERIFY**: Academic Year filter shows "2026-27"
- [ ] **VERIFY**: Semester dropdown defaults to "6"
- [ ] **VERIFY**: Filters work correctly

### Test 2.4: Exam Cell - Question Papers
- [ ] Navigate to Exam Cell → Question Papers
- [ ] Go to "Manage Assignments" tab
- [ ] **VERIFY**: Academic Year field shows "2026-27"
- [ ] **VERIFY**: Placeholder text shows dynamic year
- [ ] Go to "Review & Select" tab
- [ ] **VERIFY**: Academic Year filter shows "2026-27"

### Test 2.5: Exam Cell - Timetable
- [ ] Navigate to Exam Cell → Timetable
- [ ] **VERIFY**: Header shows "Academic Year: 2026-27"
- [ ] **VERIFY**: Print preview shows correct year

### Test 2.6: Exam Cell - Hall Allocations
- [ ] Navigate to Exam Cell → Hall Allocations
- [ ] **VERIFY**: Header shows "Academic Year: 2026-27"
- [ ] **VERIFY**: Print preview shows correct year

### Test 2.7: Exam Cell - Answer Scripts
- [ ] Navigate to Exam Cell → Answer Scripts
- [ ] Go to "Publish Results" tab
- [ ] **VERIFY**: Academic Year field shows "2026-27" (readonly)

### Test 2.8: Admin - Grading Scheme
- [ ] Navigate to Admin → Grading Scheme
- [ ] Click "Create New Scheme"
- [ ] **VERIFY**: Academic Year field defaults to "2026-27"
- [ ] **VERIFY**: Placeholder shows dynamic year

---

## Test Suite 3: Real-Time Updates

### Test 3.1: Live Update Test
- [ ] Open browser window 1: Admin → Institution Settings
- [ ] Open browser window 2: Exam Cell → Compute Results
- [ ] In window 1: Change academic year to "2027-28"
- [ ] In window 2: Refresh page
- [ ] **VERIFY**: Academic year updates to "2027-28"

### Test 3.2: Context Refresh Test
- [ ] Login as Admin
- [ ] Navigate to Exam Cell → Compute Results
- [ ] Note the academic year shown
- [ ] Open new tab → Admin → Institution Settings
- [ ] Change academic year to "2025-26"
- [ ] Return to Compute Results tab
- [ ] Refresh page
- [ ] **VERIFY**: Academic year shows "2025-26"

---

## Test Suite 4: Backward Compatibility

### Test 4.1: Legacy Field Test
- [ ] Check database InstitutionConfig document
- [ ] **VERIFY**: `academicYear` field exists
- [ ] **VERIFY**: `currentAcademicYear` field exists
- [ ] **VERIFY**: Both fields have same value
- [ ] Update via Admin UI
- [ ] **VERIFY**: Both fields update together

### Test 4.2: Old Code Paths
- [ ] Check any custom queries using `academicYear`
- [ ] **VERIFY**: Queries still work
- [ ] **VERIFY**: No null/undefined errors

---

## Test Suite 5: API Endpoints

### Test 5.1: GET /api/v1/institution/current
```bash
curl http://localhost:5000/api/v1/institution/current
```
- [ ] **VERIFY**: Returns JSON with currentAcademicYear
- [ ] **VERIFY**: Returns currentSemester (number 1-8)
- [ ] **VERIFY**: Returns institutionName
- [ ] **VERIFY**: Returns shortName
- [ ] **VERIFY**: No authentication required

### Test 5.2: GET /api/v1/institution/academic-years
```bash
curl http://localhost:5000/api/v1/institution/academic-years
```
- [ ] **VERIFY**: Returns array of academic years
- [ ] **VERIFY**: Each year has year, startDate, endDate, isCurrent
- [ ] **VERIFY**: Returns currentAcademicYear
- [ ] **VERIFY**: Returns currentSemester
- [ ] **VERIFY**: No authentication required

### Test 5.3: POST /api/v1/institution/academic-years (Admin Only)
```bash
# Get admin token first
TOKEN="<admin-jwt-token>"
curl -X POST http://localhost:5000/api/v1/institution/academic-years \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2027-28","startDate":"2027-06-01","endDate":"2028-05-31","isCurrent":false}'
```
- [ ] **VERIFY**: 200 status with success
- [ ] **VERIFY**: Year added to database
- [ ] Without token: **VERIFY**: 401 Unauthorized
- [ ] With student token: **VERIFY**: 403 Forbidden

### Test 5.4: PUT /api/v1/institution/academic-years/current (Admin Only)
```bash
TOKEN="<admin-jwt-token>"
curl -X PUT http://localhost:5000/api/v1/institution/academic-years/current \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2026-27","currentSemester":6}'
```
- [ ] **VERIFY**: 200 status with success
- [ ] **VERIFY**: Current year updates in database
- [ ] **VERIFY**: isCurrent flags update correctly
- [ ] Without token: **VERIFY**: 401 Unauthorized

---

## Test Suite 6: Edge Cases

### Test 6.1: Empty Academic Years Array
- [ ] Clear academicYears array in database
- [ ] Refresh any page
- [ ] **VERIFY**: App doesn't crash
- [ ] **VERIFY**: Falls back to default "2025-26"

### Test 6.2: Missing currentAcademicYear
- [ ] Remove currentAcademicYear from database
- [ ] Refresh page
- [ ] **VERIFY**: Falls back to "2025-26"
- [ ] **VERIFY**: No console errors

### Test 6.3: Invalid Semester Value
- [ ] Try to set semester to 0
- [ ] **VERIFY**: Validation error
- [ ] Try to set semester to 9
- [ ] **VERIFY**: Validation error

### Test 6.4: Malformed Year Format
- [ ] Try to add year "2025"
- [ ] **VERIFY**: Works (no strict validation on format)
- [ ] **VERIFY**: Displays correctly

---

## Test Suite 7: Performance

### Test 7.1: Page Load Time
- [ ] Clear browser cache
- [ ] Open Network tab
- [ ] Navigate to any page
- [ ] **VERIFY**: /institution/current loads < 100ms
- [ ] **VERIFY**: Page renders without delay
- [ ] **VERIFY**: No blocking API calls

### Test 7.2: Context Update Performance
- [ ] Update academic year from Admin UI
- [ ] Switch between 10 different pages
- [ ] **VERIFY**: Each page loads smoothly
- [ ] **VERIFY**: No flickering or re-renders

---

## Test Suite 8: Security

### Test 8.1: Unauthorized Access
- [ ] Logout from admin
- [ ] Try POST to /api/v1/institution/academic-years
- [ ] **VERIFY**: 401 Unauthorized
- [ ] Try PUT to /api/v1/institution/academic-years/current
- [ ] **VERIFY**: 401 Unauthorized

### Test 8.2: Role-Based Access
- [ ] Login as Student (STUDENT1 / Student@123)
- [ ] Try to access Admin → Institution Settings
- [ ] **VERIFY**: Access denied or redirected
- [ ] Student can view pages with academic year
- [ ] **VERIFY**: Student cannot modify academic year

### Test 8.3: SQL Injection Prevention
- [ ] Try year value: `'; DROP TABLE users; --`
- [ ] **VERIFY**: Stored as string, no SQL execution
- [ ] **VERIFY**: App continues to work

---

## Test Suite 9: UI/UX

### Test 9.1: Visual Consistency
- [ ] Check all pages with academic year
- [ ] **VERIFY**: Navy color scheme used
- [ ] **VERIFY**: Consistent font sizes
- [ ] **VERIFY**: Proper spacing and alignment

### Test 9.2: Loading States
- [ ] Update academic year
- [ ] **VERIFY**: Button shows loading spinner
- [ ] **VERIFY**: Button disabled during update
- [ ] **VERIFY**: Button text changes to "Updating..."

### Test 9.3: Error Handling
- [ ] Disconnect internet
- [ ] Try to update academic year
- [ ] **VERIFY**: Error toast appears
- [ ] **VERIFY**: Button re-enables
- [ ] **VERIFY**: No crash or blank screen

### Test 9.4: Responsive Design
- [ ] Resize browser to mobile width
- [ ] **VERIFY**: Academic Year Management section readable
- [ ] **VERIFY**: Form inputs stack vertically
- [ ] **VERIFY**: Table scrolls horizontally if needed

---

## Test Suite 10: Revert Test

### Test 10.1: Revert to Demo Defaults
- [ ] Login as Admin
- [ ] Navigate to Institution Settings
- [ ] Set academic year to "2025-26"
- [ ] Set semester to "5"
- [ ] Click "Update Academic Year"
- [ ] **VERIFY**: All pages show "2025-26"
- [ ] **VERIFY**: All pages show "Semester 5"
- [ ] **VERIFY**: System ready for demo

---

## Post-Testing Verification

### Database Check
```javascript
// MongoDB shell
db.institutionconfigs.findOne()
```
- [ ] **VERIFY**: currentAcademicYear field exists
- [ ] **VERIFY**: currentSemester field exists
- [ ] **VERIFY**: academicYears array has entries
- [ ] **VERIFY**: One year has isCurrent: true

### Code Review
- [ ] Search codebase for "2025-26"
- [ ] **VERIFY**: Only in default values and comments
- [ ] **VERIFY**: No hardcoded values in render logic
- [ ] Search for "2024-25"
- [ ] **VERIFY**: Only in seed data and defaults

### Build Verification
```bash
cd client
npm run build
```
- [ ] **VERIFY**: Build completes with 0 errors
- [ ] **VERIFY**: No warnings about hardcoded values
- [ ] **VERIFY**: Bundle size reasonable

---

## Known Issues / Limitations

### Expected Behavior
1. **Page Refresh Required**: Changes don't propagate to already-open tabs without refresh
2. **No Real-Time Sync**: WebSocket not implemented for live updates
3. **Manual Revert**: No "Revert to Previous" button

### Not Bugs
1. Historic data keeps old academic year (by design)
2. Reports generated with old year stay that way (by design)
3. Academic year can be any string format (intentional flexibility)

---

## Success Criteria

✅ **All tests pass**
✅ **No hardcoded "2025-26" in active code**
✅ **Admin can change year from UI**
✅ **All pages update correctly**
✅ **Build completes with 0 errors**
✅ **No regression in existing features**
✅ **API endpoints secured properly**
✅ **Performance acceptable (<100ms API)**

---

## Test Results Log

| Test Suite | Date | Tester | Status | Notes |
|------------|------|--------|--------|-------|
| Suite 1: Admin UI | | | ⏳ | |
| Suite 2: System-Wide | | | ⏳ | |
| Suite 3: Real-Time | | | ⏳ | |
| Suite 4: Backward Compat | | | ⏳ | |
| Suite 5: API Endpoints | | | ⏳ | |
| Suite 6: Edge Cases | | | ⏳ | |
| Suite 7: Performance | | | ⏳ | |
| Suite 8: Security | | | ⏳ | |
| Suite 9: UI/UX | | | ⏳ | |
| Suite 10: Revert | | | ⏳ | |

---

**Testing Status**: Ready to Begin ✅
**Documentation**: Complete ✅
**Implementation**: Complete ✅

