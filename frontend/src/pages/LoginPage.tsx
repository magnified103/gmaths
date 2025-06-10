import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

/**
 * Login page with authentication layout and login form
 */
const LoginPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Đăng nhập"
      subtitle="Chào mừng trở lại với GMATHS"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage; 