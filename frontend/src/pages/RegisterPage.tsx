import React from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import RegistrationForm from '../components/auth/RegistrationForm';

/**
 * Registration page with authentication layout and registration form
 */
const RegisterPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Tạo tài khoản"
      subtitle="Tham gia cộng đồng học tập GMATHS"
    >
      <RegistrationForm />
    </AuthLayout>
  );
};

export default RegisterPage; 