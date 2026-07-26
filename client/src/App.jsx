/**
 * Main App Component
 * Sets up routing, authentication context, and React Query
 * Includes toast notifications
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { InstitutionProvider } from './contexts/InstitutionContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import PlaceholderDashboard from './pages/PlaceholderDashboard';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import HodLayout from './layouts/HodLayout';
import PrincipalLayout from './layouts/PrincipalLayout';
import Students from './pages/admin/Students';
import Faculty from './pages/admin/Faculty';
import Subjects from './pages/admin/Subjects';
import Departments from './pages/admin/Departments';
import InstitutionSettings from './pages/admin/InstitutionSettings';
import AdminExams from './pages/admin/Exams';

// ExamCell
import ExamCellLayout from './layouts/ExamCellLayout';
import ExamCellDashboard from './pages/examcell/ExamCellDashboard';
import Exams from './pages/examcell/Exams';
import Halls from './pages/examcell/Halls';
import RunAgents from './pages/examcell/RunAgents';
import Timetable from './pages/examcell/Timetable';
import HallAllocations from './pages/examcell/HallAllocations';
import InvigilatorAssignments from './pages/examcell/InvigilatorAssignments';
import AgentLogs from './pages/examcell/AgentLogs';
import AnswerScripts from './pages/examcell/AnswerScripts';
import QuestionPapers from './pages/examcell/QuestionPapers';

// Student
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import HallTicket from './pages/student/HallTicket';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentResults from './pages/student/StudentResults';

// Phase 4 Result Pages
import ComputeResults from './pages/examcell/ComputeResults';
import ResultsView from './pages/examcell/ResultsView';
import PublishResults from './pages/examcell/PublishResults';
import GradingScheme from './pages/admin/GradingScheme';

// Faculty
import FacultyLayout from './layouts/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MyDuties from './pages/faculty/MyDuties';
import Evaluations from './pages/faculty/Evaluations';
import FacultyQuestionPapers from './pages/faculty/FacultyQuestionPapers';
import HodDashboard from './pages/hod/HodDashboard';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InstitutionProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="departments" element={<Departments />} />
              <Route path="exams" element={<AdminExams />} />
              <Route path="institution" element={<InstitutionSettings />} />
              <Route path="grading-scheme" element={<GradingScheme />} />
            </Route>

            {/* ExamCell Routes */}
            <Route
              path="/examcell"
              element={
                <ProtectedRoute allowedRoles={['examcell']}>
                  <ExamCellLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<ExamCellDashboard />} />
              <Route path="exams" element={<Exams />} />
              <Route path="halls" element={<Halls />} />
              <Route path="run-agents" element={<RunAgents />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="hall-allocations" element={<HallAllocations />} />
              <Route path="invigilator-assignments" element={<InvigilatorAssignments />} />
              <Route path="agent-logs" element={<AgentLogs />} />
              <Route path="answer-scripts" element={<AnswerScripts />} />
              <Route path="question-papers" element={<QuestionPapers />} />
              <Route path="compute-results" element={<ComputeResults />} />
              <Route path="results" element={<ResultsView />} />
              <Route path="publish-results" element={<PublishResults />} />
            </Route>

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="timetable" element={<StudentTimetable />} />
              <Route path="hall-ticket" element={<HallTicket />} />
              <Route path="results" element={<StudentResults />} />
            </Route>

            {/* Faculty Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="duties" element={<MyDuties />} />
              <Route path="evaluations" element={<Evaluations />} />
              <Route path="question-papers" element={<FacultyQuestionPapers />} />
            </Route>

            {/* HOD Routes */}
            <Route
              path="/hod"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <HodLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<HodDashboard />} />
            </Route>

            {/* Principal Routes */}
            <Route
              path="/principal"
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PrincipalLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<PrincipalDashboard />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 - Redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '0.75rem',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        </InstitutionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
