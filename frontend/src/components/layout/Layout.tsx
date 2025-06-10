import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Main layout component providing consistent structure across all pages
 * Includes Vietnamese header and footer with responsive design
 */
const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className={`flex-1 ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 