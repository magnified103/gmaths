import React from 'react';
import PlaceholderPage from './PlaceholderPage';

/**
 * Practice page - Currently a placeholder
 */
const PracticePage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Luyện tập"
      description="Khu vực luyện tập với ngân hàng câu hỏi và bài tập thực hành đang được phát triển."
      expectedDate="Q2 2025"
      backLink={{ to: '/', text: 'Về trang chủ' }}
    />
  );
};

export default PracticePage; 