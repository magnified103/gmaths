/**
 * Leaderboard component for displaying exam rankings
 * Shows student performance rankings with detailed statistics
 */

import React, { useState } from 'react';
import { useExamLeaderboard } from '../hooks/useGrading';
import { 
  TrophyIcon, 
  UserIcon, 
  ClockIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { 
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

/**
 * Individual leaderboard entry interface
 */
interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number; // in seconds
  submittedAt: string;
  correctAnswers: number;
  totalQuestions: number;
  isCurrentUser?: boolean;
}

/**
 * Leaderboard statistics interface
 */
interface LeaderboardStats {
  totalStudents: number;
  averageScore: number;
  averagePercentage: number;
  averageTime: number;
  highestScore: number;
  lowestScore: number;
  passRate: number; // percentage of students who passed
}

/**
 * Props for Leaderboard component
 */
interface LeaderboardProps {
  examId: string;
  examTitle: string;
  entries: LeaderboardEntry[];
  stats: LeaderboardStats;
  currentUserId?: string;
  showDetailedStats?: boolean;
  onViewResult?: (studentId: string) => void;
}

/**
 * Sort options for leaderboard
 */
type SortOption = 'rank' | 'score' | 'percentage' | 'time' | 'name';
type SortOrder = 'asc' | 'desc';

/**
 * Leaderboard component for exam rankings
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({
  examId,
  examTitle,
  entries,
  stats,
  currentUserId,
  showDetailedStats = true,
  onViewResult,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showOnlyPassed, setShowOnlyPassed] = useState(false);

  /**
   * Format time duration
   */
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  /**
   * Get rank display with medal icons
   */
  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center">
          <TrophyIconSolid className="w-6 h-6 text-yellow-500 mr-1" />
          <span className="font-bold text-yellow-600">1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center">
          <TrophyIconSolid className="w-6 h-6 text-gray-400 mr-1" />
          <span className="font-bold text-gray-600">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center">
          <TrophyIconSolid className="w-6 h-6 text-amber-600 mr-1" />
          <span className="font-bold text-amber-700">3</span>
        </div>
      );
    }
    return <span className="font-semibold text-gray-700">{rank}</span>;
  };

  /**
   * Get performance color based on percentage
   */
  const getPerformanceColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  /**
   * Sort entries based on current sort criteria
   */
  const sortedEntries = React.useMemo(() => {
    let filtered = showOnlyPassed ? entries.filter(entry => entry.percentage >= 60) : entries;
    
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'score':
          comparison = b.score - a.score; // Higher score first
          break;
        case 'percentage':
          comparison = b.percentage - a.percentage; // Higher percentage first
          break;
        case 'time':
          comparison = a.timeSpent - b.timeSpent; // Faster time first
          break;
        case 'name':
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        default:
          comparison = a.rank - b.rank;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [entries, sortBy, sortOrder, showOnlyPassed]);

  /**
   * Handle sort change
   */
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder(option === 'rank' || option === 'time' ? 'asc' : 'desc');
    }
  };

  /**
   * Get sort icon
   */
  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return null;
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 ml-1" />
    );
  };

  /**
   * Find current user's entry
   */
  const currentUserEntry = currentUserId 
    ? entries.find(entry => entry.studentId === currentUserId)
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <TrophyIcon className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bảng xếp hạng
          </h1>
          <h2 className="text-xl text-gray-600 mb-4">
            {examTitle}
          </h2>
          <div className="text-sm text-gray-500">
            {stats.totalStudents} học sinh đã tham gia
          </div>
        </div>
      </div>

      {/* Current User Highlight */}
      {currentUserEntry && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <StarIconSolid className="w-5 h-5 mr-2" />
            Kết quả của bạn
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Xếp hạng:</span>
              <span className="font-semibold ml-2">#{currentUserEntry.rank}</span>
            </div>
            <div>
              <span className="text-blue-600">Điểm số:</span>
              <span className="font-semibold ml-2">
                {currentUserEntry.score}/{currentUserEntry.totalPoints}
              </span>
            </div>
            <div>
              <span className="text-blue-600">Phần trăm:</span>
              <span className="font-semibold ml-2">
                {currentUserEntry.percentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-blue-600">Thời gian:</span>
              <span className="font-semibold ml-2">
                {formatTime(currentUserEntry.timeSpent)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {showDetailedStats && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2" />
            Thống kê tổng quan
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.averagePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Điểm trung bình</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.highestScore}
              </div>
              <div className="text-sm text-gray-600">Điểm cao nhất</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(stats.averageTime)}
              </div>
              <div className="text-sm text-gray-600">Thời gian trung bình</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.passRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Tỷ lệ đạt</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOnlyPassed}
                onChange={(e) => setShowOnlyPassed(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Chỉ hiển thị học sinh đạt</span>
            </label>
          </div>
          
          <div className="text-sm text-gray-600">
            Hiển thị {sortedEntries.length} / {entries.length} học sinh
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center">
                    Hạng {getSortIcon('rank')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Học sinh {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center">
                    Điểm {getSortIcon('score')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('percentage')}
                >
                  <div className="flex items-center">
                    Phần trăm {getSortIcon('percentage')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('time')}
                >
                  <div className="flex items-center">
                    Thời gian {getSortIcon('time')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Câu đúng
                </th>
                {onViewResult && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEntries.map((entry) => (
                <tr 
                  key={entry.studentId}
                  className={`hover:bg-gray-50 ${
                    entry.isCurrentUser || entry.studentId === currentUserId 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRankDisplay(entry.rank)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {entry.studentName}
                        {(entry.isCurrentUser || entry.studentId === currentUserId) && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Bạn
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold">
                      {entry.score}/{entry.totalPoints}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-semibold ${getPerformanceColor(entry.percentage)}`}>
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {formatTime(entry.timeSpent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {entry.correctAnswers}/{entry.totalQuestions}
                  </td>
                  {onViewResult && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewResult(entry.studentId)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedEntries.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có dữ liệu
          </h3>
          <p className="text-gray-600">
            {showOnlyPassed 
              ? 'Không có học sinh nào đạt yêu cầu với bộ lọc hiện tại.'
              : 'Chưa có học sinh nào hoàn thành bài thi này.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced Leaderboard component that loads data from API
 */
interface LeaderboardContainerProps {
  examId: string;
  examTitle: string;
  currentUserId?: string;
  showDetailedStats?: boolean;
  onViewResult?: (studentId: string) => void;
  limit?: number;
}

export const LeaderboardContainer: React.FC<LeaderboardContainerProps> = ({
  examId,
  examTitle,
  currentUserId,
  showDetailedStats = true,
  onViewResult,
  limit = 50,
}) => {
  const { data, isLoading, error } = useExamLeaderboard(examId, limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bảng xếp hạng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải bảng xếp hạng</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải bảng xếp hạng'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.entries || data.entries.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chưa có dữ liệu xếp hạng</h2>
          <p className="text-gray-600">
            Chưa có học sinh nào hoàn thành bài thi <strong>{examTitle}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stats from entries
  const entries = data.entries;
  const stats = {
    totalStudents: entries.length,
    averageScore: entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length,
    averagePercentage: entries.reduce((sum, entry) => sum + entry.percentage, 0) / entries.length,
    averageTime: entries.reduce((sum, entry) => sum + entry.timeSpent, 0) / entries.length,
    highestScore: Math.max(...entries.map(entry => entry.score)),
    lowestScore: Math.min(...entries.map(entry => entry.score)),
    passRate: (entries.filter(entry => entry.percentage >= 60).length / entries.length) * 100,
  };

  return (
    <Leaderboard
      examId={examId}
      examTitle={examTitle}
      entries={entries}
      stats={stats}
      currentUserId={currentUserId}
      showDetailedStats={showDetailedStats}
      onViewResult={onViewResult}
    />
  );
}; 