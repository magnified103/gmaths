import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  expectedDate?: string;
  backLink?: {
    to: string;
    text: string;
  };
}

/**
 * Placeholder page component for features that will be implemented later
 * Provides consistent messaging and navigation for unimplemented routes
 * Follows the same layout pattern as other pages in the application
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  description = 'Chúng tôi đang phát triển tính năng này và sẽ sớm ra mắt trong thời gian tới.',
  expectedDate,
  backLink = { to: '/', text: 'Về trang chủ' }
}) => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white shadow-lg rounded-lg p-8">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
              </div>

              {/* Content */}
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                {title}
              </h1>
              
              <p className="text-gray-600 mb-4">
                {description}
              </p>

              {expectedDate && (
                <p className="text-sm text-primary-600 mb-6 font-medium">
                  Dự kiến: {expectedDate}
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link
                  to={backLink.to}
                  className="btn-primary w-full inline-block"
                >
                  {backLink.text}
                </Link>
                
                <button
                  onClick={() => window.history.back()}
                  className="btn-secondary w-full"
                >
                  Quay lại trang trước
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Có góp ý hoặc câu hỏi?{' '}
                  <Link 
                    to="/contact" 
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Liên hệ với chúng tôi
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlaceholderPage; 