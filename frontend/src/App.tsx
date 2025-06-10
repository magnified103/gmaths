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
import ProtectedRoute from './components/ProtectedRoute';
import AuthGuard from './components/AuthGuard';
import FullScreenLoader from './components/ui/FullScreenLoader';
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
            
            {/* Student Feature Routes - Placeholders for future implementation */}
            <Route 
              path="/student/results" 
              element={
                <ProtectedRoute>
                  <FullScreenLoader 
                    variant="page"
                    message="Kết quả thi - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/announcements" 
              element={
                <ProtectedRoute>
                  <FullScreenLoader 
                    variant="page"
                    message="Thông báo - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
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
            
            {/* Future Admin Routes - Ready for implementation */}
            <Route 
              path="/admin/posts" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <FullScreenLoader 
                    variant="page"
                    message="Bài viết & Thông báo - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <FullScreenLoader 
                    variant="page"
                    message="Thống kê & Báo cáo - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <FullScreenLoader 
                    variant="page"
                    message="Cài đặt hệ thống - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
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
