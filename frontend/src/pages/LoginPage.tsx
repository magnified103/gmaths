import React from 'react';
import AuthLayout from '../components/AuthLayout';
import LoginForm from '../components/LoginForm';

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