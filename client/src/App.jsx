/**
 * Main App Component
 * Sets up routing, authentication context, and React Query
 * Includes toast notifications
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import PlaceholderDashboard from './pages/PlaceholderDashboard';

// Admin
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Students from './pages/admin/Students';
import Faculty from './pages/admin/Faculty';
import Subjects from './pages/admin/Subjects';
import Departments from './pages/admin/Departments';

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
            </Route>

            {/* Placeholder Routes for Other Roles (Phase 2+) */}
            <Route
              path="/examcell/dashboard"
              element={
                <ProtectedRoute allowedRoles={['examcell']}>
                  <PlaceholderDashboard roleTitle="Exam Cell" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <PlaceholderDashboard roleTitle="Faculty" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <PlaceholderDashboard roleTitle="Student" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/dashboard"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <PlaceholderDashboard roleTitle="Head of Department" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/principal/dashboard"
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PlaceholderDashboard roleTitle="Principal" />
                </ProtectedRoute>
              }
            />

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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
