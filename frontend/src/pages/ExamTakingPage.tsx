// React import removed - using JSX without explicit React reference
import { ExamInterface } from '../components/exam/ExamInterface';

/**
 * Exam taking page that wraps the ExamInterface component
 * Provides the main entry point for students to take exams
 */
export default function ExamTakingPage() {
  return <ExamInterface />;
} 