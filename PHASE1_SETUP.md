# Phase 1: Authentication + RBAC + Admin Module - Setup Guide

## 📋 What Was Built

This phase implements a complete authentication and authorization system with a fully functional admin panel for managing students, faculty, subjects, and departments.

### Backend (Node.js + Express + MongoDB)
- **Authentication System**: JWT-based login with 8-hour token expiry
- **6 User Roles**: Admin, ExamCell, Faculty, Student, HOD, Principal
- **Role-Based Access Control (RBAC)**: Middleware for protecting routes
- **5 Mongoose Models**: User, Student, Faculty, Subject, Department
- **Complete CRUD APIs** for all entities with validation
- **Seed Script**: Pre-populated test data for all 6 roles

### Frontend (React + Vite + Tailwind CSS)
- **Login Page**: Single login form for all roles (USN/Employee ID based)
- **Protected Routes**: Role-based route guards
- **Admin Dashboard**: Complete CRUD interface for:
  - Students Management
  - Faculty Management
  - Subjects Management
  - Departments Management
- **Placeholder Dashboards**: For ExamCell, Faculty, Student, HOD, Principal (Phase 2+)
- **Auth Context**: Memory-based token management with sessionStorage persistence
- **React Query Integration**: Optimistic updates and cache management

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas connection string)
- npm or yarn

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2: Configure Environment Variables
The `server/.env` file should already exist with these variables (update if needed):
```env
MONGO_URI=mongodb://localhost:27017/exam-system
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

### Step 3: Seed the Database
This creates test users for all 6 roles:
```bash
cd server
npm run seed
```

Expected output:
```
✓ Connected to MongoDB
✓ Cleared existing test data
✓ Created admin: ADMIN1
✓ Created examcell: EXAMCELL1
✓ Created faculty: FACULTY1
✓ Created student: STUDENT1
✓ Created hod: HOD1
✓ Created principal: PRINCIPAL1
✓ Created department: Computer Science and Engineering (CSE)
✓ Created subject: CS101 - Introduction to Programming
✓ Created student profile for STUDENT1
✓ Created faculty profile for FACULTY1

Test Credentials:
─────────────────────────────────────
ADMIN        → Username: ADMIN1       Password: Admin@123
EXAMCELL     → Username: EXAMCELL1    Password: ExamCell@123
FACULTY      → Username: FACULTY1     Password: Faculty@123
STUDENT      → Username: STUDENT1     Password: Student@123
HOD          → Username: HOD1         Password: HOD@123
PRINCIPAL    → Username: PRINCIPAL1   Password: Principal@123
```

### Step 4: Start Backend Server
```bash
cd server
npm run dev
```

Server will start on `http://localhost:5000`

### Step 5: Install Frontend Dependencies
```bash
cd client
npm install
```

### Step 6: Start Frontend Development Server
```bash
cd client
npm run dev
```

Frontend will start on `http://localhost:5173` (or another port if 5173 is busy)

---

## 🧪 Testing Instructions

### 1. Test Admin Login & CRUD Operations

1. **Open browser**: Navigate to `http://localhost:5173`
2. **Login as Admin**:
   - Username: `ADMIN1`
   - Password: `Admin@123`
3. **You should be redirected to**: `/admin/dashboard`

#### Test Students Management
1. Click "Students" in the sidebar
2. **Create a new student**:
   - Click "+ Add Student"
   - Fill in the form:
     - USN: `1PE21CS002`
     - Name: `Test Student`
     - Department: `Computer Science`
     - Semester: `5`
     - Email: `test@example.com`
     - Phone: `9876543210`
     - Password: `Pass@123`
   - Click "Create"
3. **Filter students**: Use the department and semester filters
4. **Edit a student**: Click "Edit" on any row, modify details, click "Update"
5. **Delete a student**: Click "Delete" on any row, confirm the action

#### Test Faculty Management
1. Click "Faculty" in the sidebar
2. **Create a new faculty**:
   - Click "+ Add Faculty"
   - Fill in the form:
     - Employee ID: `EMP1002`
     - Name: `Test Professor`
     - Department: `Computer Science`
     - Designation: `Assistant Professor`
     - Email: `prof@example.com`
     - Phone: `9876543211`
     - Password: `Prof@123`
   - Click "Create"
3. **Edit/Delete**: Same as students

#### Test Subjects Management
1. Click "Subjects" in the sidebar
2. **Create a new subject**:
   - Subject Code: `CS201`
   - Subject Name: `Data Structures`
   - Department: `Computer Science`
   - Semester: `3`
   - Credits: `4`
3. **Edit/Delete**: Same as above

#### Test Departments Management
1. Click "Departments" in the sidebar
2. **Create a new department**:
   - Department Code: `ECE`
   - Department Name: `Electronics and Communication Engineering`
   - HOD: (leave blank for now)
3. **Edit/Delete**: Same as above

### 2. Test Other Roles

#### ExamCell Role
1. Logout from admin
2. Login with:
   - Username: `EXAMCELL1`
   - Password: `ExamCell@123`
3. You should see a placeholder dashboard saying "Welcome, Exam Cell Officer!"

#### Faculty Role
1. Logout and login with:
   - Username: `FACULTY1`
   - Password: `Faculty@123`
3. You should see a placeholder dashboard

#### Student Role
1. Logout and login with:
   - Username: `STUDENT1`
   - Password: `Student@123`
3. You should see a placeholder dashboard

#### HOD Role
1. Logout and login with:
   - Username: `HOD1`
   - Password: `HOD@123`

#### Principal Role
1. Logout and login with:
   - Username: `PRINCIPAL1`
   - Password: `Principal@123`

### 3. Test RBAC (Role-Based Access Control)

1. Login as **STUDENT1**
2. Try to manually navigate to: `http://localhost:5173/admin/students`
3. **Expected**: You should see "Access Denied" message
4. Same for other non-admin roles trying to access admin routes

### 4. Test Invalid Credentials

1. Try to login with:
   - Username: `invalid`
   - Password: `wrong`
2. **Expected**: Error message "Invalid username or password."

### 5. Test Token Expiry

The JWT token expires after 8 hours. To test:
1. Login successfully
2. Wait 8 hours (or manually tamper with the token in browser DevTools → Application → Session Storage)
3. Try to access any protected route or make an API call
4. **Expected**: You should be logged out or see an "Invalid token" error

---

## 📁 Files Created/Modified

### Backend Files Created
```
server/
├── models/
│   ├── User.js                    # User authentication model
│   ├── Student.js                 # Student profile model
│   ├── Faculty.js                 # Faculty profile model
│   ├── Subject.js                 # Subject/Course model
│   └── Department.js              # Department model
├── controllers/
│   ├── authController.js          # Login, logout, getMe
│   └── adminController.js         # All CRUD operations
├── routes/
│   ├── auth.js                    # Auth routes
│   └── admin.js                   # Admin CRUD routes
├── middleware/
│   └── auth.js                    # verifyToken, authorize middlewares
└── seed.js                        # Database seeding script
```

### Backend Files Modified
```
server/
├── index.js                       # Added route imports and error handling
└── package.json                   # Added dev, start, seed scripts
```

### Frontend Files Created
```
client/
├── src/
│   ├── lib/
│   │   └── api.js                 # Axios instance with interceptors
│   ├── contexts/
│   │   └── AuthContext.jsx        # Authentication state management
│   ├── components/
│   │   └── ProtectedRoute.jsx     # Route guard component
│   ├── layouts/
│   │   └── AdminLayout.jsx        # Admin sidebar layout
│   ├── pages/
│   │   ├── Login.jsx              # Login page
│   │   ├── PlaceholderDashboard.jsx  # Placeholder for non-admin roles
│   │   └── admin/
│   │       ├── AdminDashboard.jsx # Admin landing page
│   │       ├── Students.jsx       # Students CRUD
│   │       ├── Faculty.jsx        # Faculty CRUD
│   │       ├── Subjects.jsx       # Subjects CRUD
│   │       └── Departments.jsx    # Departments CRUD
├── .env                           # Environment variables
└── .env.example                   # Example env file
```

### Frontend Files Modified
```
client/
├── src/
│   ├── App.jsx                    # Complete routing setup
│   └── index.css                  # Clean Tailwind CSS setup
```

---

## 🔑 Test Credentials Summary

| Role      | Username    | Password        |
|-----------|-------------|-----------------|
| Admin     | ADMIN1      | Admin@123       |
| ExamCell  | EXAMCELL1   | ExamCell@123    |
| Faculty   | FACULTY1    | Faculty@123     |
| Student   | STUDENT1    | Student@123     |
| HOD       | HOD1        | HOD@123         |
| Principal | PRINCIPAL1  | Principal@123   |

---

## 🛠️ Tech Stack

### Backend
- **Node.js + Express**: RESTful API
- **MongoDB + Mongoose**: Database with schemas
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token generation/verification
- **express-validator**: Input validation
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

### Frontend
- **React 19**: UI library
- **Vite**: Build tool
- **Tailwind CSS 4**: Styling
- **React Router DOM 7**: Client-side routing
- **@tanstack/react-query**: Server state management
- **axios**: HTTP client

---

## 🎯 Key Features Implemented

### Authentication
✅ JWT-based authentication with 8-hour expiry  
✅ USN-based login for students  
✅ Employee ID-based login for staff  
✅ Password hashing with bcrypt  
✅ Session persistence across page refresh (sessionStorage)

### Authorization (RBAC)
✅ `verifyToken` middleware for authentication  
✅ `authorize(...roles)` middleware for role-based access  
✅ Protected routes on frontend  
✅ 403 Forbidden for unauthorized access

### Admin Module
✅ Complete Students CRUD with filters (department, semester)  
✅ Complete Faculty CRUD with designation options  
✅ Complete Subjects CRUD with semester/credit constraints  
✅ Complete Departments CRUD with HOD assignment  
✅ Modal forms for create/edit  
✅ Delete confirmations  
✅ Real-time cache updates with React Query  
✅ Responsive design with Tailwind CSS

### Data Validation
✅ Server-side validation with express-validator  
✅ Client-side HTML5 validation  
✅ Unique constraint enforcement  
✅ Proper error messages for duplicate entries

---

## 🐛 Troubleshooting

### Backend won't start
- **Check MongoDB connection**: Make sure MongoDB is running
- **Check PORT**: Ensure port 5000 is not in use
- **Check .env file**: Verify MONGO_URI and JWT_SECRET are set

### Frontend won't connect to backend
- **Check CORS**: Backend has CORS enabled, but if issues persist, check `server/index.js`
- **Check .env**: Verify `VITE_API_URL` points to `http://localhost:5000/api/v1`
- **Check network tab**: Open browser DevTools → Network to see API responses

### Login fails
- **Check credentials**: Usernames are case-insensitive (stored as uppercase)
- **Check MongoDB**: Run `npm run seed` again to reset test users
- **Check JWT_SECRET**: Must be the same in .env

### Role-based redirect not working
- **Check token**: Open DevTools → Application → Session Storage → verify token exists
- **Check user role**: Console log `user` in AuthContext to verify role

---

## 📝 Notes for Your Project Presentation

1. **Authentication Flow**: Explain how JWT tokens are generated on login and attached to every API request via axios interceptors.

2. **RBAC Implementation**: Show how `verifyToken` checks the token and `authorize(...roles)` restricts access based on roles.

3. **Data Models**: Walk through the 5 Mongoose schemas and their relationships (e.g., Student.usn references User.username).

4. **Frontend State Management**: Explain how React Query handles server state (caching, automatic refetching, optimistic updates).

5. **Security Considerations**:
   - Passwords are hashed with bcrypt (never stored in plain text)
   - JWTs expire after 8 hours
   - Tokens stored in sessionStorage (cleared on tab close)
   - Input validation on both client and server

6. **Future Phases**: Mention that ExamCell, Faculty, Student, HOD, and Principal dashboards are placeholders for Phase 2+ features.

---

## 🎉 Success Checklist

Before presenting, ensure:
- [x] Backend server starts without errors
- [x] Frontend connects to backend successfully
- [x] Can login as all 6 roles
- [x] Admin can create/read/update/delete students, faculty, subjects, departments
- [x] Non-admin roles cannot access admin routes
- [x] Invalid credentials show error
- [x] Filters work on Students and Subjects pages
- [x] Modal forms validate input correctly

---

**Built with ❤️ for your major project. Good luck! 🚀**
