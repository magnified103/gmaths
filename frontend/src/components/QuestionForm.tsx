import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import MathEditor from './MathEditor';
import Modal from './ui/Modal';
import FormField from './ui/FormField';
import Alert from './ui/Alert';
import Button from './ui/Button';
import { ButtonSpinner } from './ui/LoadingSpinner';

interface QuestionFormProps {
  question?: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Question type definitions
interface Question {
  id: string;
  type: 'multiple-choice';
  content: string;
  explanation?: string;
  points: number;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
  createdAt: string;
  updatedAt: string;
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// Validation schema for question creation
const questionSchema = z.object({
  content: z
    .string()
    .min(10, 'Nội dung câu hỏi phải có ít nhất 10 ký tự')
    .max(1000, 'Nội dung câu hỏi không được quá 1000 ký tự'),
  explanation: z
    .string()
    .max(500, 'Giải thích không được quá 500 ký tự')
    .optional(),
  points: z
    .number()
    .min(1, 'Điểm số phải ít nhất là 1')
    .max(10, 'Điểm số không được quá 10'),
  category: z
    .string()
    .min(1, 'Vui lòng chọn chủ đề')
    .max(100, 'Tên chủ đề không được quá 100 ký tự'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Vui lòng chọn độ khó' }),
  }),
  options: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, 'Nội dung lựa chọn không được để trống')
          .max(200, 'Nội dung lựa chọn không được quá 200 ký tự'),
        isCorrect: z.boolean(),
      })
    )
    .min(2, 'Phải có ít nhất 2 lựa chọn')
    .max(6, 'Không được có quá 6 lựa chọn')
    .refine(
      (options) => options.filter((opt) => opt.isCorrect).length === 1,
      'Phải có đúng 1 đáp án đúng'
    ),
});

type QuestionFormData = z.infer<typeof questionSchema>;

/**
 * Question form component cho tạo và chỉnh sửa câu hỏi toán học
 */
export default function QuestionForm({ question, isOpen, onClose, onSuccess }: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [questionContent, setQuestionContent] = useState('');

  const isEditing = !!question;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      content: question?.content || '',
      explanation: question?.explanation || '',
      points: question?.points || 1,
      category: question?.category || '',
      difficulty: question?.difficulty || 'medium',
      options: question?.options || [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const watchedOptions = watch('options');

  /**
   * Reset form when modal opens/closes or question changes
   */
  React.useEffect(() => {
    if (isOpen) {
      reset({
        content: question?.content || '',
        explanation: question?.explanation || '',
        points: question?.points || 1,
        category: question?.category || '',
        difficulty: question?.difficulty || 'medium',
        options: question?.options || [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      });
      setQuestionContent(question?.content || '');
      setSubmitError(null);
    }
  }, [isOpen, question, reset]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      console.log('Question data:', data);
      
      onSuccess();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Add new option
   */
  const handleAddOption = () => {
    if (fields.length < 6) {
      append({ text: '', isCorrect: false });
    }
  };

  /**
   * Remove option
   */
  const handleRemoveOption = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  /**
   * Handle correct answer selection
   */
  const handleCorrectAnswerChange = (selectedIndex: number) => {
    watchedOptions.forEach((_option, index) => {
      setValue(`options.${index}.isCorrect`, index === selectedIndex);
    });
  };

  /**
   * Handle content change from MathEditor
   */
  const handleContentChange = (latex: string) => {
    setQuestionContent(latex);
    setValue('content', latex);
  };

  /**
   * Get difficulty display text
   */
  const getDifficultyText = (difficulty: string) => {
    const map = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó',
    };
    return map[difficulty as keyof typeof map] || difficulty;
  };

  const modalFooter = (
    <>
      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        loadingText={isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
        onClick={handleSubmit(onSubmit)}
      >
        {isEditing ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi'}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Hủy
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
      subtitle="Tạo câu hỏi toán học với editor LaTeX"
      size="2xl"
      footer={modalFooter}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-4 sm:px-6">
        {/* Submit Error */}
        {submitError && (
          <Alert 
            type="error" 
            message={submitError} 
            className="mb-4"
          />
        )}

        <div className="space-y-6">
          {/* Question Content with Math Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Nội dung câu hỏi *
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<EyeIcon className="h-4 w-4" />}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
              </Button>
            </div>
            
            <MathEditor
              value={questionContent}
              onChange={handleContentChange}
              placeholder="Nhập nội dung câu hỏi..."
              showPreview={showPreview}
              error={errors.content?.message}
              label=""
            />
            
            <p className="mt-1 text-xs text-gray-500">
              Sử dụng LaTeX để viết công thức toán học. Ví dụ: \frac{'{a}'}{'{b}'} cho phân số
            </p>
          </div>

          {/* Question Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <FormField
              id="category"
              label="Chủ đề"
              type="select"
              required
              error={errors.category?.message}
              options={[
                { value: '', label: 'Chọn chủ đề...' },
                { value: 'algebra', label: 'Đại số' },
                { value: 'geometry', label: 'Hình học' },
                { value: 'calculus', label: 'Giải tích' },
                { value: 'statistics', label: 'Thống kê' },
                { value: 'trigonometry', label: 'Lượng giác' },
              ]}
              register={register}
            />

            {/* Difficulty */}
            <FormField
              id="difficulty"
              label="Độ khó"
              type="select"
              required
              error={errors.difficulty?.message}
              options={[
                { value: 'easy', label: 'Dễ' },
                { value: 'medium', label: 'Trung bình' },
                { value: 'hard', label: 'Khó' },
              ]}
              register={register}
            />

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm số *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                {...register('points', { valueAsNumber: true })}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.points ? 'border-red-300' : ''
                }`}
              />
              {errors.points && (
                <p className="mt-1 text-sm text-red-600">{errors.points.message}</p>
              )}
            </div>
          </div>

          {/* Answer Options */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Lựa chọn đáp án *
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                onClick={handleAddOption}
                disabled={fields.length >= 6}
              >
                Thêm lựa chọn
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start space-x-3">
                  {/* Correct Answer Radio */}
                  <div className="flex items-center pt-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={watchedOptions[index]?.isCorrect || false}
                      onChange={() => handleCorrectAnswerChange(index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                  </div>

                  {/* Option Text */}
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-500">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        {...register(`options.${index}.text`)}
                        placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                        className={`block w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.options?.[index]?.text ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.options?.[index]?.text && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.options[index]?.text?.message}
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<TrashIcon className="h-4 w-4" />}
                    onClick={() => handleRemoveOption(index)}
                    disabled={fields.length <= 2}
                    className="text-red-600 hover:text-red-700"
                  >
                  </Button>
                </div>
              ))}
            </div>

            {errors.options && typeof errors.options.message === 'string' && (
              <p className="mt-2 text-sm text-red-600">{errors.options.message}</p>
            )}

            <p className="mt-2 text-xs text-gray-500">
              Chọn đáp án đúng bằng cách click vào nút radio bên trái
            </p>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giải thích (tùy chọn)
            </label>
            <textarea
              {...register('explanation')}
              rows={3}
              placeholder="Nhập giải thích cho đáp án..."
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.explanation ? 'border-red-300' : ''
              }`}
            />
            {errors.explanation && (
              <p className="mt-1 text-sm text-red-600">{errors.explanation.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Giải thích sẽ hiển thị cho học sinh sau khi hoàn thành bài kiểm tra
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
} 