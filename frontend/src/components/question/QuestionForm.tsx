import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { RichTextEditor } from '../editor/RichTextEditor';
import { RichTextDisplay } from '../editor/RichTextDisplay';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
// FormField import removed - not used in current implementation
import type { Question, QuestionCreateForm, QuestionCategory, QuestionType } from '../../types/questions';
import { createQuestion, updateQuestion, fetchCategories } from '../../api/questions';
import { getTextContent, getOptionLabel } from '../../utils/questionUtils';

interface QuestionFormProps {
  question?: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Validation schema for question creation - supports all question types
const questionSchema = z.object({
  type: z.enum(['multiple-choice', 'multiple-select', 'true-false', 'fill-blank', 'essay'] as const, {
    errorMap: () => ({ message: 'Vui lòng chọn loại câu hỏi' }),
  }),
  content: z
    .string()
    .min(10, 'Nội dung câu hỏi phải có ít nhất 10 ký tự')
    .refine(
      (value) => getTextContent(value).length <= 1000,
      'Nội dung câu hỏi không được quá 1000 ký tự'
    ),
  explanation: z
    .string()
    .refine(
      (value) => !value || getTextContent(value).length <= 500,
      'Giải thích không được quá 500 ký tự'
    )
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
  // Multiple choice/select options
  options: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, 'Nội dung lựa chọn không được để trống')
          .refine(
            (value) => getTextContent(value).length <= 200,
            'Nội dung lựa chọn không được quá 200 ký tự'
          ),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
  // True/False specific fields
  correctAnswer: z.boolean().optional(),
  showRandomOrder: z.boolean().optional(),
  // Fill-in-blank specific fields
  blanks: z
    .array(
      z.object({
        position: z.number().min(0),
        acceptedAnswers: z.array(z.string().min(1)),
        caseSensitive: z.boolean(),
        placeholder: z.string().optional(),
      })
    )
    .optional(),
  caseSensitive: z.boolean().optional(),
  // Essay specific fields
  maxWords: z.number().min(1).optional(),
  minWords: z.number().min(1).optional(),
  rubric: z.string().optional(),
}).refine((data) => {
  // Type-specific validation
  switch (data.type) {
    case 'multiple-choice':
    case 'multiple-select':
      if (!data.options || data.options.length < 2) {
        return false;
      }
      const correctCount = data.options.filter(opt => opt.isCorrect).length;
      return data.type === 'multiple-choice' ? correctCount === 1 : correctCount >= 1;
    case 'true-false':
      return data.correctAnswer !== undefined;
    case 'fill-blank':
      return data.blanks && data.blanks.length > 0;
    case 'essay':
      return true; // Essay questions don't require specific fields
    default:
      return false;
  }
}, {
  message: "Vui lòng điền đầy đủ thông tin cho loại câu hỏi đã chọn",
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
  const [_questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const isEditing = !!question;

  /**
   * Get initial form values based on question type and existing data
   */
  const getInitialFormValues = (): Partial<QuestionFormData> => {
    if (!question) {
      return {
        content: '',
        explanation: '',
        points: 1,
        category: '',
        difficulty: 'medium',
        type: 'multiple-choice',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      };
    }

    // Base values - properly handle category
    const baseValues = {
      content: question.content || '',
      explanation: question.explanation || '',
      points: question.points || 1,
      category: typeof question.category === 'string' ? question.category : (question.category?.id || ''),
      difficulty: question.difficulty || 'medium' as const,
      type: question.type,
    };

    // Extract type-specific data from the typeData field (backend stores data here)
    const typeData = (question as any).typeData || {};

    // Type-specific values
    switch (question.type) {
      case 'multiple-choice':
      case 'multiple-select':
        const mcOptions = typeData.options?.map((opt: any) => ({
          text: opt.text || '',
          isCorrect: opt.isCorrect || false,
        })) || [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ];
        
        return {
          ...baseValues,
          options: mcOptions,
        };

      case 'true-false':
        return {
          ...baseValues,
          correctAnswer: typeData.correctAnswer ?? true,
          showRandomOrder: typeData.randomizeOrder ?? false,
        };

      case 'fill-blank':
        return {
          ...baseValues,
          blanks: typeData.blanks?.map((blank: any) => ({
            position: blank.position || 0,
            acceptedAnswers: blank.acceptedAnswers || [],
            caseSensitive: blank.caseSensitive || false,
            placeholder: blank.placeholder || '',
          })) || [],
          caseSensitive: typeData.caseSensitive || false,
        };

      case 'essay':
        return {
          ...baseValues,
          maxWords: typeData.maxWords,
          minWords: typeData.minWords,
          rubric: typeData.rubric || '',
        };

      default:
        return baseValues;
    }
  };

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
    defaultValues: getInitialFormValues(),
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'options',
  });

  const watchedOptions = watch('options');
  const watchedType = watch('type');

  /**
   * Load categories when component mounts
   */
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setSubmitError('Không thể tải danh sách chủ đề');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  /**
   * Reset form when modal opens/closes or question changes
   */
  useEffect(() => {
    if (isOpen) {
      const initialValues = getInitialFormValues();
      reset(initialValues);
      setQuestionContent(initialValues.content || '');
      setQuestionType(initialValues.type || 'multiple-choice');
      setSubmitError(null);
      
      // Properly update field array for options
      if (initialValues.options && Array.isArray(initialValues.options)) {
        replace(initialValues.options);
      }
    }
  }, [isOpen, question, reset, replace]);

  /**
   * Update question type when form type changes
   */
  useEffect(() => {
    if (watchedType) {
      setQuestionType(watchedType);
    }
  }, [watchedType]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: QuestionFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Convert form data to API format based on question type
      const baseQuestionData = {
        type: data.type,
        content: data.content,
        explanation: data.explanation,
        points: data.points,
        category: data.category,
        difficulty: data.difficulty,
      };

      let questionData: QuestionCreateForm;

      switch (data.type) {
        case 'multiple-choice':
        case 'multiple-select':
          questionData = {
            ...baseQuestionData,
            options: data.options?.map(opt => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })) || [],
          };
          break;

        case 'true-false':
          questionData = {
            ...baseQuestionData,
            correctAnswer: data.correctAnswer ?? true,
            showRandomOrder: data.showRandomOrder ?? false,
          };
          break;

        case 'fill-blank':
          questionData = {
            ...baseQuestionData,
            blanks: data.blanks?.map((blank, index) => ({
              position: blank.position ?? index,
              acceptedAnswers: blank.acceptedAnswers || [],
              caseSensitive: blank.caseSensitive || false,
              placeholder: blank.placeholder || '',
            })) || [],
            caseSensitive: data.caseSensitive || false,
          };
          break;

        case 'essay':
          questionData = {
            ...baseQuestionData,
            maxWords: data.maxWords,
            minWords: data.minWords,
            rubric: data.rubric || '',
          };
          break;

        default:
          throw new Error(`Unsupported question type: ${data.type}`);
      }

      if (isEditing && question) {
        // For update, we need to include the id
        await updateQuestion(question.id, { ...questionData, id: question.id });
      } else {
        await createQuestion(questionData);
      }
      
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
    if (watchedOptions) {
      watchedOptions.forEach((_option, index) => {
        setValue(`options.${index}.isCorrect`, index === selectedIndex);
      });
    }
  };

  /**
   * Handle content change from MathEditor
   */
  const handleContentChange = (latex: string) => {
    setQuestionContent(latex);
    setValue('content', latex);
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
          {/* Question Content with Rich Text Editor */}
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
            
            <RichTextEditor
              value={questionContent}
              onChange={handleContentChange}
              placeholder="Nhập nội dung câu hỏi..."
              error={errors.content?.message}
              label=""
              allowMath={true}
            />
            
            {/* Character counter */}
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>
                Sử dụng công cụ định dạng và nhấn nút máy tính để chèn công thức toán học
              </span>
              <span className={`font-mono ${
                getTextContent(questionContent).length > 1000 ? 'text-red-600' : 
                getTextContent(questionContent).length > 900 ? 'text-yellow-600' : 
                'text-gray-500'
              }`}>
                {getTextContent(questionContent).length}/1000 ký tự
              </span>
            </div>
            
            {/* Preview Mode */}
            {showPreview && questionContent && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="text-xs text-gray-600 mb-2">Xem trước nội dung:</div>
                <RichTextDisplay 
                  content={questionContent}
                  className="bg-white p-3 rounded border"
                />
              </div>
            )}
          </div>

          {/* Question Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chủ đề *
              </label>
              <select
                {...register('category')}
                className={`block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.category ? 'border-red-300' : ''
                }`}
                disabled={isLoadingCategories}
              >
                <option value="">Chọn chủ đề...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {isLoadingCategories && (
                <p className="mt-1 text-xs text-gray-500">Đang tải danh sách chủ đề...</p>
              )}
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Độ khó *
              </label>
              <select
                {...register('difficulty')}
                className={`block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  errors.difficulty ? 'border-red-300' : ''
                }`}
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
              {errors.difficulty && (
                <p className="mt-1 text-sm text-red-600">{errors.difficulty.message}</p>
              )}
            </div>

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
                className={`block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
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
                <div key={field.id} className="flex items-center space-x-3">
                  {/* Correct Answer Radio */}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={watchedOptions?.[index]?.isCorrect || false}
                      onChange={() => handleCorrectAnswerChange(index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                  </div>

                  {/* Option Text */}
                  <div className="flex-1">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm text-gray-500">
                        {getOptionLabel(index)}.
                      </span>
                      <input
                        type="text"
                        {...register(`options.${index}.text`)}
                        placeholder={`Lựa chọn ${getOptionLabel(index)}`}
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
              className={`block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.explanation ? 'border-red-300' : ''
              }`}
            />
            {errors.explanation && (
              <p className="mt-1 text-sm text-red-600">{errors.explanation.message}</p>
            )}
            <div className="mt-1 text-xs text-gray-500 flex justify-between">
              <span>
                Giải thích sẽ hiển thị cho học sinh sau khi hoàn thành bài kiểm tra
              </span>
              <span className={`font-mono ${
                getTextContent(watch('explanation') || '').length > 500 ? 'text-red-600' : 
                getTextContent(watch('explanation') || '').length > 450 ? 'text-yellow-600' : 
                'text-gray-500'
              }`}>
                {getTextContent(watch('explanation') || '').length}/500 ký tự
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
} 