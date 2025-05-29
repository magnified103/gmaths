import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminPage from './pages/AdminPage';
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
 * Updated with extensible admin routes structure
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
            
            {/* Future Admin Routes - Ready for implementation */}
            <Route 
              path="/admin/questions" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <FullScreenLoader 
                    variant="page"
                    message="Ngân hàng câu hỏi - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/exams" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <FullScreenLoader 
                    variant="page"
                    message="Quản lý bài kiểm tra - Tính năng đang được phát triển"
                    showSpinner={false}
                  />
                </ProtectedRoute>
              } 
            />
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
