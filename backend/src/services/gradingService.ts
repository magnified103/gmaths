/**
 * Comprehensive grading service for auto-scoring and analytics
 * Handles all question types with sophisticated scoring algorithms
 */

import { PrismaClient } from '@prisma/client';
import { ExamAnswer, ExamSubmission } from '../types/exam';

const prisma = new PrismaClient();

/**
 * Question scoring result interface
 */
interface QuestionScore {
  questionId: string;
  earnedPoints: number;
  totalPoints: number;
  isCorrect: boolean;
  partialCredit: number; // 0-1 ratio
  feedback?: string;
  timeSpent?: number;
}

/**
 * Complete grading result interface
 */
interface GradingResult {
  totalScore: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  questionScores: QuestionScore[];
  gradingMethod: 'automatic' | 'manual' | 'mixed';
  gradedAt: Date;
  statistics: {
    averageTimePerQuestion: number;
    difficultyDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
  };
}

/**
 * Grading configuration interface
 */
interface GradingConfig {
  passingPercentage: number;
  allowPartialCredit: boolean;
  penalizeIncorrectAnswers: boolean;
  timeBonus: boolean;
  roundingMethod: 'floor' | 'ceil' | 'round';
  customWeights?: Record<string, number>;
}

/**
 * Performance analytics interface
 */
interface PerformanceAnalytics {
  examId: string;
  questionAnalytics: Array<{
    questionId: string;
    averageScore: number;
    correctAnswerRate: number;
    averageTimeSpent: number;
    difficultyRating: number;
    commonErrors: Array<{
      errorType: string;
      frequency: number;
      description: string;
    }>;
  }>;
  overallStats: {
    averageScore: number;
    averagePercentage: number;
    passRate: number;
    averageCompletionTime: number;
    scoreDistribution: Record<string, number>;
  };
}

/**
 * Advanced grading service with comprehensive scoring algorithms
 */
export class GradingService {
  private defaultConfig: GradingConfig = {
    passingPercentage: 60,
    allowPartialCredit: true,
    penalizeIncorrectAnswers: false,
    timeBonus: false,
    roundingMethod: 'round'
  };

  /**
   * Grade a complete exam submission
   * @param submission - Exam submission data
   * @param examId - Exam ID
   * @param config - Optional grading configuration
   * @returns Complete grading result
   */
  async gradeExamSubmission(
    submission: ExamSubmission,
    examId: string,
    config: Partial<GradingConfig> = {}
  ): Promise<GradingResult> {
    const gradingConfig = { ...this.defaultConfig, ...config };

    // Get exam with questions and their correct answers
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        isDeleted: false,
        status: 'PUBLISHED'
      },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                type: true,
                content: true,
                points: true,
                difficulty: true,
                typeData: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    const questionScores: QuestionScore[] = [];
    let totalScore = 0;
    let totalPoints = 0;

    // Grade each question
    for (const examQuestion of exam.questions) {
      const question = examQuestion.question;
      const questionPoints = examQuestion.points || question.points;
      totalPoints += questionPoints;

      // Find student's answer
      const studentAnswer = submission.answers.find(a => a.questionId === question.id);
      
      const score = await this.gradeQuestion(
        question,
        studentAnswer,
        questionPoints,
        gradingConfig
      );

      questionScores.push(score);
      totalScore += score.earnedPoints;
    }

    // Apply custom weights if specified
    if (gradingConfig.customWeights) {
      totalScore = this.applyCustomWeights(questionScores, gradingConfig.customWeights);
    }

    // Apply rounding
    totalScore = this.applyRounding(totalScore, gradingConfig.roundingMethod);
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= gradingConfig.passingPercentage;

    // Calculate statistics
    const statistics = this.calculateStatistics(questionScores, submission);

    return {
      totalScore,
      totalPoints,
      percentage: this.applyRounding(percentage, gradingConfig.roundingMethod),
      passed,
      questionScores,
      gradingMethod: 'automatic',
      gradedAt: new Date(),
      statistics
    };
  }

  /**
   * Grade an individual question
   * @param question - Question data
   * @param studentAnswer - Student's answer
   * @param points - Points for this question
   * @param config - Grading configuration
   * @returns Question score result
   */
  private async gradeQuestion(
    question: any,
    studentAnswer: ExamAnswer | undefined,
    points: number,
    config: GradingConfig
  ): Promise<QuestionScore> {
    const typeData = question.typeData as any;
    
    if (!studentAnswer) {
      return {
        questionId: question.id,
        earnedPoints: 0,
        totalPoints: points,
        isCorrect: false,
        partialCredit: 0,
        timeSpent: 0
      };
    }

    let earnedPoints = 0;
    let partialCredit = 0;
    let feedback = '';

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        const mcqResult = this.gradeMultipleChoice(studentAnswer.answer, typeData, points);
        earnedPoints = mcqResult.points;
        partialCredit = mcqResult.partialCredit;
        feedback = mcqResult.feedback;
        break;

      case 'MULTIPLE_SELECT':
        const msqResult = this.gradeMultipleSelect(studentAnswer.answer, typeData, points, config);
        earnedPoints = msqResult.points;
        partialCredit = msqResult.partialCredit;
        feedback = msqResult.feedback;
        break;

      case 'TRUE_FALSE':
        const tfResult = this.gradeTrueFalse(studentAnswer.answer, typeData, points);
        earnedPoints = tfResult.points;
        partialCredit = tfResult.partialCredit;
        feedback = tfResult.feedback;
        break;

      case 'FILL_BLANK':
        const fbResult = this.gradeFillBlank(studentAnswer.answer, typeData, points, config);
        earnedPoints = fbResult.points;
        partialCredit = fbResult.partialCredit;
        feedback = fbResult.feedback;
        break;

      case 'ESSAY':
        // Essays need manual grading
        earnedPoints = 0;
        partialCredit = 0;
        feedback = 'Requires manual grading';
        break;

      default:
        earnedPoints = 0;
        partialCredit = 0;
        feedback = 'Unknown question type';
    }

    return {
      questionId: question.id,
      earnedPoints: this.applyRounding(earnedPoints, config.roundingMethod),
      totalPoints: points,
      isCorrect: partialCredit === 1,
      partialCredit,
      feedback,
      timeSpent: studentAnswer.timeSpent || 0
    };
  }

  /**
   * Grade multiple choice question with detailed feedback
   */
  private gradeMultipleChoice(
    studentAnswer: any,
    typeData: any,
    points: number
  ): { points: number; partialCredit: number; feedback: string } {
    if (!typeData.options || !studentAnswer) {
      return { points: 0, partialCredit: 0, feedback: 'No answer provided' };
    }

    const correctOption = typeData.options.find((option: any) => option.isCorrect);
    if (!correctOption) {
      return { points: 0, partialCredit: 0, feedback: 'No correct option found' };
    }

    const selectedOption = typeData.options.find((option: any) => option.id === studentAnswer);
    const isCorrect = studentAnswer === correctOption.id;

    let feedback = '';
    if (isCorrect) {
      feedback = 'Correct answer';
      if (correctOption.explanation) {
        feedback += `: ${correctOption.explanation}`;
      }
    } else {
      feedback = `Incorrect. The correct answer is: ${correctOption.text}`;
      if (selectedOption?.explanation) {
        feedback += `. ${selectedOption.explanation}`;
      }
    }

    return {
      points: isCorrect ? points : 0,
      partialCredit: isCorrect ? 1 : 0,
      feedback
    };
  }

  /**
   * Grade multiple select question with partial credit
   */
  private gradeMultipleSelect(
    studentAnswer: any,
    typeData: any,
    points: number,
    config: GradingConfig
  ): { points: number; partialCredit: number; feedback: string } {
    if (!typeData.options || !Array.isArray(studentAnswer)) {
      return { points: 0, partialCredit: 0, feedback: 'Invalid answer format' };
    }

    const correctOptions = typeData.options
      .filter((option: any) => option.isCorrect)
      .map((option: any) => option.id);

    if (correctOptions.length === 0) {
      return { points: 0, partialCredit: 0, feedback: 'No correct options found' };
    }

    const studentSelections = studentAnswer || [];
    const correctSelections = studentSelections.filter((id: string) => correctOptions.includes(id));
    const incorrectSelections = studentSelections.filter((id: string) => !correctOptions.includes(id));
    const missedSelections = correctOptions.filter((id: string) => !studentSelections.includes(id));

    let partialCredit = 0;
    let feedback = '';

    if (config.allowPartialCredit) {
      // Advanced partial credit calculation
      const totalCorrect = correctOptions.length;
      
      if (config.penalizeIncorrectAnswers) {
        // Deduct points for incorrect selections
        partialCredit = Math.max(0, (correctSelections.length - incorrectSelections.length) / totalCorrect);
      } else {
        // Only reward correct selections
        partialCredit = correctSelections.length / totalCorrect;
      }
    } else {
      // All or nothing grading
      partialCredit = (correctSelections.length === correctOptions.length && incorrectSelections.length === 0) ? 1 : 0;
    }

    // Generate detailed feedback
    if (partialCredit === 1) {
      feedback = 'All correct options selected';
    } else {
      const feedbackParts = [];
      if (correctSelections.length > 0) {
        feedbackParts.push(`Correctly selected: ${correctSelections.length}/${correctOptions.length} options`);
      }
      if (incorrectSelections.length > 0) {
        feedbackParts.push(`Incorrectly selected: ${incorrectSelections.length} options`);
      }
      if (missedSelections.length > 0) {
        feedbackParts.push(`Missed: ${missedSelections.length} correct options`);
      }
      feedback = feedbackParts.join('. ');
    }

    return {
      points: partialCredit * points,
      partialCredit,
      feedback
    };
  }

  /**
   * Grade true/false question
   */
  private gradeTrueFalse(
    studentAnswer: any,
    typeData: any,
    points: number
  ): { points: number; partialCredit: number; feedback: string } {
    if (typeof studentAnswer !== 'boolean' || typeof typeData.correctAnswer !== 'boolean') {
      return { points: 0, partialCredit: 0, feedback: 'Invalid answer format' };
    }

    const isCorrect = studentAnswer === typeData.correctAnswer;
    const feedback = isCorrect 
      ? 'Correct answer' 
      : `Incorrect. The correct answer is: ${typeData.correctAnswer ? 'True' : 'False'}`;

    return {
      points: isCorrect ? points : 0,
      partialCredit: isCorrect ? 1 : 0,
      feedback
    };
  }

  /**
   * Grade fill-in-the-blank question with fuzzy matching
   */
  private gradeFillBlank(
    studentAnswer: any,
    typeData: any,
    points: number,
    config: GradingConfig
  ): { points: number; partialCredit: number; feedback: string } {
    if (!typeData.blanks || !studentAnswer) {
      return { points: 0, partialCredit: 0, feedback: 'No answer provided' };
    }

    let correctBlanks = 0;
    const totalBlanks = typeData.blanks.length;
    const blankResults: string[] = [];

    for (const blank of typeData.blanks) {
      const studentBlankAnswer = studentAnswer[blank.id];
      if (!studentBlankAnswer) {
        blankResults.push(`Blank ${blank.position + 1}: No answer`);
        continue;
      }

      const acceptedAnswers = blank.acceptedAnswers || [];
      const caseSensitive = blank.caseSensitive || false;
      
      // Check for exact matches
      const exactMatch = acceptedAnswers.some((accepted: string) => {
        const studentValue = caseSensitive ? studentBlankAnswer : studentBlankAnswer.toLowerCase();
        const acceptedValue = caseSensitive ? accepted : accepted.toLowerCase();
        return studentValue.trim() === acceptedValue.trim();
      });

      if (exactMatch) {
        correctBlanks++;
        blankResults.push(`Blank ${blank.position + 1}: Correct`);
      } else {
        // Check for fuzzy matches (if enabled)
        const fuzzyMatch = this.checkFuzzyMatch(studentBlankAnswer, acceptedAnswers, caseSensitive);
        if (fuzzyMatch.isMatch && config.allowPartialCredit) {
          correctBlanks += fuzzyMatch.similarity;
          blankResults.push(`Blank ${blank.position + 1}: Partial credit (${Math.round(fuzzyMatch.similarity * 100)}%)`);
        } else {
          blankResults.push(`Blank ${blank.position + 1}: Incorrect`);
        }
      }
    }

    const partialCredit = totalBlanks > 0 ? correctBlanks / totalBlanks : 0;
    const feedback = blankResults.join('. ');

    return {
      points: partialCredit * points,
      partialCredit,
      feedback
    };
  }

  /**
   * Check for fuzzy string matching
   */
  private checkFuzzyMatch(
    studentAnswer: string,
    acceptedAnswers: string[],
    caseSensitive: boolean
  ): { isMatch: boolean; similarity: number } {
    let maxSimilarity = 0;

    for (const accepted of acceptedAnswers) {
      const similarity = this.calculateStringSimilarity(
        caseSensitive ? studentAnswer : studentAnswer.toLowerCase(),
        caseSensitive ? accepted : accepted.toLowerCase()
      );
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    // Consider it a fuzzy match if similarity is above 80%
    return {
      isMatch: maxSimilarity >= 0.8,
      similarity: maxSimilarity >= 0.8 ? maxSimilarity : 0
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(len1, len2);
    return maxLength === 0 ? 1 : (maxLength - matrix[len1][len2]) / maxLength;
  }

  /**
   * Apply custom weights to question scores
   */
  private applyCustomWeights(questionScores: QuestionScore[], weights: Record<string, number>): number {
    let weightedScore = 0;

    for (const score of questionScores) {
      const weight = weights[score.questionId] || 1;
      weightedScore += score.earnedPoints * weight;
    }

    return weightedScore;
  }

  /**
   * Apply rounding method to scores
   */
  private applyRounding(value: number, method: 'floor' | 'ceil' | 'round'): number {
    switch (method) {
      case 'floor':
        return Math.floor(value * 100) / 100;
      case 'ceil':
        return Math.ceil(value * 100) / 100;
      case 'round':
      default:
        return Math.round(value * 100) / 100;
    }
  }

  /**
   * Calculate submission statistics
   */
  private calculateStatistics(questionScores: QuestionScore[], submission: ExamSubmission) {
    const averageTimePerQuestion = questionScores.length > 0 
      ? questionScores.reduce((sum, score) => sum + (score.timeSpent || 0), 0) / questionScores.length
      : 0;

    // Note: difficulty and type distribution would require question data
    return {
      averageTimePerQuestion,
      difficultyDistribution: {},
      typeDistribution: {}
    };
  }

  /**
   * Generate performance analytics for an exam
   */
  async generatePerformanceAnalytics(examId: string): Promise<PerformanceAnalytics> {
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        gradedAt: { not: null }
      },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                question: {
                  select: {
                    id: true,
                    type: true,
                    difficulty: true,
                    points: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (submissions.length === 0) {
      throw new Error('No graded submissions found for this exam');
    }

    // Calculate overall statistics
    const totalSubmissions = submissions.length;
    const averageScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0) / totalSubmissions;
    const averagePercentage = submissions.reduce((sum, sub) => sum + (sub.percentage || 0), 0) / totalSubmissions;
    const passedSubmissions = submissions.filter(sub => sub.passed).length;
    const passRate = (passedSubmissions / totalSubmissions) * 100;
    const averageCompletionTime = submissions.reduce((sum, sub) => sum + sub.timeSpent, 0) / totalSubmissions;

    // Calculate score distribution
    const scoreRanges = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    submissions.forEach(sub => {
      const percentage = sub.percentage || 0;
      if (percentage <= 20) scoreRanges['0-20']++;
      else if (percentage <= 40) scoreRanges['21-40']++;
      else if (percentage <= 60) scoreRanges['41-60']++;
      else if (percentage <= 80) scoreRanges['61-80']++;
      else scoreRanges['81-100']++;
    });

    return {
      examId,
      questionAnalytics: [], // TODO: Implement detailed question analytics
      overallStats: {
        averageScore,
        averagePercentage,
        passRate,
        averageCompletionTime,
        scoreDistribution: scoreRanges
      }
    };
  }

  /**
   * Get leaderboard data for an exam
   */
  async getExamLeaderboard(examId: string, limit: number = 50) {
    const submissions = await prisma.examSubmission.findMany({
      where: {
        examId: examId,
        gradedAt: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: [
        { percentage: 'desc' },
        { timeSpent: 'asc' },
        { submittedAt: 'asc' }
      ],
      take: limit
    });

    return submissions.map((submission, index) => ({
      rank: index + 1,
      studentId: submission.userId,
      studentName: submission.user.username,
      score: submission.score || 0,
      totalPoints: submission.totalPoints || 0,
      percentage: submission.percentage || 0,
      timeSpent: submission.timeSpent,
      submittedAt: submission.submittedAt.toISOString(),
      correctAnswers: 0, // TODO: Calculate from answers
      totalQuestions: 0   // TODO: Calculate from exam
    }));
  }
}

export default GradingService; 