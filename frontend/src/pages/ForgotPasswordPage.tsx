import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import PasswordResetForm from '../components/auth/PasswordResetForm';

/**
 * Forgot password page with authentication layout and password reset form
 */
const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Quên mật khẩu"
      subtitle="Đặt lại mật khẩu cho tài khoản GMATHS"
    >
      <PasswordResetForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage; 