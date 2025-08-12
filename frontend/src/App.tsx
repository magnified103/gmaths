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
// Placeholder pages and redirects
import DashboardRedirect from './pages/DashboardRedirect';
import ExamsRedirect from './pages/ExamsRedirect';
import ResultsRedirect from './pages/ResultsRedirect';
import PracticePage from './pages/PracticePage';
import AboutPage from './pages/AboutPage';
import HelpPage from './pages/HelpPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import FaqPage from './pages/FaqPage';
import GuidesPage from './pages/GuidesPage';
import SupportPage from './pages/SupportPage';
import TermsPage from './pages/TermsPage';
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

            {/* Smart Redirects */}
            <Route 
              path="/dashboard" 
              element={<DashboardRedirect />} 
            />
            <Route 
              path="/exams" 
              element={<ExamsRedirect />} 
            />
            <Route 
              path="/results" 
              element={<ResultsRedirect />} 
            />

            {/* Public/Information Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/terms" element={<TermsPage />} />
            
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
                <ProtectedRoute requiredRole="staff">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <AdminPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Question Management Routes */}
            <Route 
              path="/admin/questions" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <QuestionsPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Exam Management Routes - Fully Implemented */}
            <Route 
              path="/admin/exams" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <ExamListPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/exams/create" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <ExamBuilderPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/exams/:id/edit" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <ExamEditPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Results Management Routes - Complete Implementation */}
            <Route 
              path="/admin/results" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <AdminResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results/exams/:examId" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <ExamResultsManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results/students/:studentId" 
              element={
                <ProtectedRoute requiredRole="staff">
                  <StudentResultsManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/results/exams/:examId/students/:studentId/attempts/:attemptNumber" 
              element={
                <ProtectedRoute requiredRole="staff">
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
