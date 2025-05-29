import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../api/auth';

/**
 * Homepage component displaying welcome message in Vietnamese
 * Now with authentication status and role-based navigation
 */
const HomePage: React.FC = () => {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Authentication Status */}
        {isAuthenticated && (
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Xin chào, {user?.username}!
                  </h2>
                  <p className="text-sm text-gray-600">
                    Vai trò: {user && isAdmin(user.role) ? 'Quản trị viên' : 'Học sinh'}
                  </p>
                </div>
                <div className="flex space-x-4">
                  {user && isAdmin(user.role) && (
                    <Link
                      to="/admin"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Khu vực quản trị
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                    className="btn-secondary"
                  >
                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Chào mừng đến với{' '}
            <span className="text-primary-600">GMATHS</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Nền tảng học và kiểm tra trực tuyến hàng đầu cho Toán học và các môn STEAM. 
            Trải nghiệm học tập hiện đại, tương tác và hiệu quả.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                      <span className="text-primary-600 font-bold">📚</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Bài kiểm tra trực tuyến
                    </h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Hệ thống kiểm tra với timer đồng bộ, hỗ trợ LaTeX và giao diện tiếng Việt thân thiện.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                      <span className="text-primary-600 font-bold">⚡</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Chấm điểm tự động
                    </h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Kết quả ngay lập tức với bảng xếp hạng và phân tích hiệu suất chi tiết.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-md flex items-center justify-center">
                      <span className="text-primary-600 font-bold">🔒</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Bảo mật cao
                    </h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Hệ thống chống gian lận tiên tiến và quản lý phiên đăng nhập an toàn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-primary-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-gray-600 mb-6">
              Tham gia cùng hàng nghìn học sinh đang sử dụng GMATHS để nâng cao kết quả học tập.
            </p>
            <div className="space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn-primary">
                    Đăng ký miễn phí
                  </Link>
                  <Link to="/login" className="btn-secondary">
                    Đăng nhập
                  </Link>
                </>
              ) : (
                <div className="text-gray-600">
                  Bạn đã đăng nhập thành công! 
                  {user && isAdmin(user.role) && (
                    <>
                      {' '}
                      <Link to="/admin" className="text-blue-600 hover:text-blue-800">
                        Truy cập khu vực quản trị
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage; 