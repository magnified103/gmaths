import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer component with Vietnamese content and GMATHS branding
 * Provides footer links and company information
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">GM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GMATHS</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Nền tảng học và kiểm tra trực tuyến hàng đầu cho Toán học và các môn STEAM.
              Cung cấp trải nghiệm học tập hiện đại và hiệu quả.
            </p>
            <p className="text-gray-500 text-xs">
              © 2025 GMATHS Education. Tất cả quyền được bảo lưu.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Hỗ trợ
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Hướng dẫn sử dụng
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">
                  Hỗ trợ kỹ thuật
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@gmaths.edu.vn" 
                  className="text-gray-600 hover:text-primary-600 text-sm transition-colors"
                >
                  support@gmaths.edu.vn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 