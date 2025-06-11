import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPage from './pages/AdminPage';
import QuestionsPage from './pages/QuestionsPage';
import StudentDashboard from './pages/StudentDashboard';
import { ExamBuilderPage } from './pages/ExamBuilderPage';
import ExamListPage from './pages/ExamListPage';
import ExamEditPage from './pages/ExamEditPage';
import ExamTakingPage from './pages/ExamTakingPage';
import StudentExamListPage from './pages/StudentExamListPage';
import StudentResultsPage from './pages/StudentResultsPage';
import ExamResultPage from './pages/ExamResultPage';
import ExamAttemptsPage from './pages/ExamAttemptsPage';
import AdminResultsPage from './pages/AdminResultsPage';
import ExamResultsManagementPage from './pages/ExamResultsManagementPage';
import StudentResultsManagementPage from './pages/StudentResultsManagementPage';
import StudentExamAttemptResultPage from './pages/StudentExamAttemptResultPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthGuard from './components/auth/AuthGuard';
import './index.css';

// Create a client instance for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Main application component with React Router setup and TanStack Query provider
 * Provides routing structure and state management for the GMATHS platform
 * Updated with complete exam management routes and student dashboard
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/login" 
              element={
                <AuthGuard>
                  <LoginPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/register" 
              element={
                <AuthGuard>
                  <RegisterPage />
                </AuthGuard>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <AuthGuard>
                  <ForgotPasswordPage />
                </AuthGuard>
              } 
            />
            
            {/* Student Routes - Organized with Dashboard */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams" 
              element={
                <ProtectedRoute>
                  <StudentExamListPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Student Results Routes - Complete Implementation */}
            <Route 
              path="/student/results" 
              element={
                <ProtectedRoute>
                  <StudentResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams/:examId/attempts" 
              element={
                <ProtectedRoute>
                  <ExamAttemptsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams/:examId/attempts/:attemptNumber/result" 
              element={
                <ProtectedRoute>
                  <ExamResultPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams/:examId/result" 
              element={
                <ProtectedRoute>
                  <ExamResultPage />
                </ProtectedRoute>
              } 
            />
            

            
            {/* Exam Taking Route - Accessible by all authenticated users */}
            <Route 
              path="/exams/:examId/take" 
              element={
                <ProtectedRoute>
                  <ExamTakingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes - Protected and Extensible */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Question Management Routes */}
            <Route 
              path="/admin/questions" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <QuestionsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Exam Management Routes - Fully Implemented */}
            <Route 
              path="/admin/exams" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ExamListPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/exams/create" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ExamBuilderPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/exams/:id/edit" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ExamEditPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Results Management Routes - Complete Implementation */}
            <Route 
              path="/admin/results" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results/exams/:examId" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ExamResultsManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results/students/:studentId" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <StudentResultsManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results/exams/:examId/students/:studentId/attempts/:attemptNumber" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <StudentExamAttemptResultPage />
                </ProtectedRoute>
              } 
            />
            

          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
