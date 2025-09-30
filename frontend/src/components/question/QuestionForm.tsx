import React, { useState, useEffect } from 'react';
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
import { SimpleLatexInput } from './SimpleLatexInput';
import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';

interface QuestionFormProps {
  question?: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Validation schema for question creation - supports all question types
const questionSchema = z.object({
  type: z.enum(['multiple-choice', 'multiple-select', 'true-false', 'fill-blank', 'short-answer', 'essay'] as const, {
    message: 'Vui lòng chọn loại câu hỏi'
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
    message: 'Vui lòng chọn độ khó'
  }),
  // Optional image URL
  imageUrl: z
    .string()
    .url('URL hình ảnh không hợp lệ')
    .optional()
    .or(z.literal('')),
  // Multiple choice/select options
  options: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
  // True/False specific fields
  correctAnswer: z.string().transform(x => x === 'true').pipe(z.boolean()).optional(),
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
  // Short answer specific fields
  acceptableAnswers: z
    .array(z.string().min(1, 'Đáp án không được để trống'))
    .optional(),
  // Essay specific fields
  maxWords: z.number().min(1).optional(),
  minWords: z.number().min(1).optional(),
  rubric: z.string().optional(),
}).superRefine((data, ctx) => {
  // Type-specific validation with specific error messages
  switch (data.type) {
    case 'multiple-choice':
    case 'multiple-select': { // Added opening brace
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cần ít nhất 2 lựa chọn',
          path: ['options'],
        });
        return;
      }
      
      // Check for empty options
      data.options.forEach((option, index) => {
        if (!option.text || option.text.trim() === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nội dung lựa chọn không được để trống',
            path: ['options', index, 'text'],
          });
        } else if (getTextContent(option.text).length > 200) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Nội dung lựa chọn không được quá 200 ký tự',
            path: ['options', index, 'text'],
          });
        }
      });
      
      const correctCount = data.options.filter(opt => opt.isCorrect).length;
      if (data.type === 'multiple-choice' && correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Chỉ được chọn 1 đáp án đúng',
          path: ['options'],
        });
      } else if (data.type === 'multiple-select' && correctCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cần ít nhất 1 đáp án đúng',
          path: ['options'],
        });
      }
      break;
    } // Added closing brace
      
    case 'true-false':
      if (data.correctAnswer === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vui lòng chọn đáp án đúng',
          path: ['correctAnswer'],
        });
      }
      break;
      
    case 'fill-blank':
      if (!data.blanks || data.blanks.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cần ít nhất 1 chỗ trống',
          path: ['blanks'],
        });
      }
      break;
      
    case 'short-answer':
      if (!data.acceptableAnswers || data.acceptableAnswers.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cần ít nhất 1 đáp án được chấp nhận',
          path: ['acceptableAnswers'],
        });
      } else if (!data.acceptableAnswers.some(answer => answer.trim().length > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Ít nhất một đáp án phải có nội dung',
          path: ['acceptableAnswers'],
        });
      }
      break;
      
    case 'essay':
      // Essay questions don't require specific fields
      break;
      
    default:
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Loại câu hỏi không hợp lệ',
        path: ['type'],
      });
  }
});

type QuestionFormDataInput = z.input<typeof questionSchema>;
type QuestionFormDataOutput = z.output<typeof questionSchema>;

/**
 * Short Answer Fields Component
 */
interface ShortAnswerFieldsProps {
  register: UseFormRegister<QuestionFormDataInput>;
  setValue: UseFormSetValue<QuestionFormDataInput>;
  watch: UseFormWatch<QuestionFormDataInput>;
  errors: FieldErrors<QuestionFormDataInput>;
}

const ShortAnswerFields: React.FC<ShortAnswerFieldsProps> = ({
  register,
  setValue,
  watch,
  errors
}) => {
  const [answers, setAnswers] = useState<string[]>(['']);
  
  const addAnswer = () => {
    const newAnswers = [...answers, ''];
    setAnswers(newAnswers);
    setValue('acceptableAnswers', newAnswers);
  };

  const removeAnswer = (index: number) => {
    if (answers.length > 1) {
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
      setValue('acceptableAnswers', newAnswers);
    }
  };

  const updateAnswer = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    setValue('acceptableAnswers', newAnswers);
    console.log('Updated acceptableAnswers:', newAnswers);
  };

  // Watch for external changes
  const watchedAnswers = watch('acceptableAnswers');
  useEffect(() => {
    if (watchedAnswers && Array.isArray(watchedAnswers)) {
      setAnswers(watchedAnswers);
    }
  }, [watchedAnswers]);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Đáp án chấp nhận được *
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Nhập các đáp án được chấp nhận (văn bản thuần, không hỗ trợ LaTeX)
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={addAnswer}
            disabled={answers.length >= 10}
          >
            Thêm đáp án
          </Button>
        </div>

        <div className="space-y-3">
          {answers.map((answer, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center min-w-[30px]">
                <span className="text-sm font-medium text-gray-700">
                  {index + 1}.
                </span>
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => updateAnswer(index, e.target.value)}
                  placeholder="Nhập đáp án được chấp nhận..."
                  className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<TrashIcon className="h-4 w-4" />}
                onClick={() => removeAnswer(index)}
                disabled={answers.length <= 1}
                className="text-red-600 hover:text-red-700"
              >
              </Button>
            </div>
          ))}
        </div>

        {errors.acceptableAnswers && (
          <p className="mt-2 text-sm text-red-600">{errors.acceptableAnswers.message}</p>
        )}
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('caseSensitive')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">
            Phân biệt chữ hoa/thường
          </span>
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Nếu được chọn, "Apple" và "apple" sẽ được coi là khác nhau
        </p>
      </div>
    </div>
  );
};

/**
 * Fill Blank Fields Component
 */
interface FillBlankFieldsProps {
  control: any; // Use any for now to avoid deep type issues with useFieldArray
  register: UseFormRegister<QuestionFormDataInput>;
  setValue: UseFormSetValue<QuestionFormDataInput>;
  watch: UseFormWatch<QuestionFormDataInput>;
  errors: FieldErrors<QuestionFormDataInput>;
}

const FillBlankFields: React.FC<FillBlankFieldsProps> = ({
  control,
  register,
  setValue,
  watch,
  errors,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'blanks',
  });

  const watchedBlanks = watch('blanks');

  const addBlank = () => {
    append({ position: fields.length, acceptedAnswers: [''], caseSensitive: false, placeholder: '' });
  };

  const removeBlank = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const addAcceptedAnswer = (blankIndex: number) => {
    const currentAnswers = watchedBlanks?.[blankIndex]?.acceptedAnswers || [];
    const newAnswers = [...currentAnswers, ''];
    setValue(`blanks.${blankIndex}.acceptedAnswers`, newAnswers);
  };

  const removeAcceptedAnswer = (blankIndex: number, answerIndex: number) => {
    const currentAnswers = watchedBlanks?.[blankIndex]?.acceptedAnswers || [];
    if (currentAnswers.length > 1) {
      const newAnswers = currentAnswers.filter((_, i) => i !== answerIndex);
      setValue(`blanks.${blankIndex}.acceptedAnswers`, newAnswers);
    }
  };

  const updateAcceptedAnswer = (blankIndex: number, answerIndex: number, value: string) => {
    const newAnswers = [...(watchedBlanks?.[blankIndex]?.acceptedAnswers || [])];
    newAnswers[answerIndex] = value;
    setValue(`blanks.${blankIndex}.acceptedAnswers`, newAnswers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Cấu hình chỗ trống *
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Xác định các chỗ trống và các đáp án được chấp nhận cho mỗi chỗ trống.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={addBlank}
          disabled={fields.length >= 5}
        >
          Thêm chỗ trống
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, blankIndex) => (
          <div key={field.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-800">Chỗ trống {blankIndex + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<TrashIcon className="h-4 w-4" />}
                onClick={() => removeBlank(blankIndex)}
                disabled={fields.length <= 1}
                className="text-red-600 hover:text-red-700"
              >
              </Button>
            </div>

            {/* Placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Văn bản gợi ý (tùy chọn)
              </label>
              <input
                type="text"
                {...register(`blanks.${blankIndex}.placeholder`)}
                placeholder="VD: Nhập số nguyên..."
                className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Văn bản này sẽ hiển thị trong chỗ trống trước khi học sinh nhập câu trả lời.
              </p>
            </div>

            {/* Accepted Answers for this blank */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Đáp án chấp nhận được *
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => addAcceptedAnswer(blankIndex)}
                  disabled={(watchedBlanks?.[blankIndex]?.acceptedAnswers?.length || 0) >= 5}
                >
                  Thêm đáp án
                </Button>
              </div>
              <div className="space-y-2">
                {(watchedBlanks?.[blankIndex]?.acceptedAnswers || []).map((answer, answerIndex) => (
                  <div key={answerIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => updateAcceptedAnswer(blankIndex, answerIndex, e.target.value)}
                      placeholder="Nhập đáp án được chấp nhận..."
                      className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<TrashIcon className="h-4 w-4" />}
                      onClick={() => removeAcceptedAnswer(blankIndex, answerIndex)}
                      disabled={(watchedBlanks?.[blankIndex]?.acceptedAnswers?.length || 0) <= 1}
                      className="text-red-600 hover:text-red-700"
                    >
                    </Button>
                  </div>
                ))}
              </div>
              {errors.blanks?.[blankIndex]?.acceptedAnswers && (
                <p className="mt-2 text-sm text-red-600">{errors.blanks?.[blankIndex]?.acceptedAnswers?.message}</p>
              )}
            </div>

            {/* Case Sensitive for this blank */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register(`blanks.${blankIndex}.caseSensitive`)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Phân biệt chữ hoa/thường cho chỗ trống này
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {errors.blanks && typeof errors.blanks.message === 'string' && (
        <p className="mt-2 text-sm text-red-600">{errors.blanks.message}</p>
      )}
    </div>
  );
};

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
  const getInitialFormValues = (): Partial<QuestionFormDataInput> => {
    if (!question) {
      return {
        content: '',
        explanation: '',
        points: 1,
        category: '',
        difficulty: 'medium',
        type: 'multiple-choice',
        imageUrl: '',
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
      imageUrl: question.imageUrl || '',
    };

    // Extract type-specific data from the typeData field (backend stores data here)
    const typeData = (question as any).typeData || {};

    // Type-specific values
    switch (question.type) {
      case 'multiple-choice':
      case 'multiple-select': {
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
      }

      case 'true-false':
        return {
          ...baseValues,
          correctAnswer: (typeData.correctAnswer === true ? 'true' : 'false'),
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

      case 'short-answer':
        return {
          ...baseValues,
          acceptableAnswers: typeData.acceptableAnswers || [''],
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
  } = useForm<z.input<typeof questionSchema>, any, z.output<typeof questionSchema>>({
    resolver: zodResolver<z.input<typeof questionSchema>, any, z.output<typeof questionSchema>>(questionSchema),
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
   * Update question type when form type changes and clear irrelevant fields
   */
  useEffect(() => {
    if (watchedType) {
      // Clear irrelevant fields when question type changes
      switch (watchedType) {
        case 'multiple-choice':
        case 'multiple-select':
          // Clear non-option fields
          setValue('acceptableAnswers', undefined);
          setValue('correctAnswer', undefined);
          setValue('blanks', undefined);
          setValue('maxWords', undefined);
          setValue('minWords', undefined);
          setValue('rubric', undefined);
          setValue('showRandomOrder', undefined);
          setValue('caseSensitive', undefined);
          
          // Ensure we have default options
          if (!watchedOptions || watchedOptions.length === 0) {
            replace([
              { text: '', isCorrect: false },
              { text: '', isCorrect: false },
              { text: '', isCorrect: true },
              { text: '', isCorrect: false },
            ]);
          }
          break;
          
        case 'true-false':
          // Clear all other fields
          setValue('options', undefined);
          setValue('acceptableAnswers', undefined);
          setValue('blanks', undefined);
          setValue('maxWords', undefined);
          setValue('minWords', undefined);
          setValue('rubric', undefined);
          setValue('caseSensitive', undefined);
          replace([]); // Clear options array
          break;
          
        case 'fill-blank': { // Added opening brace
          // Clear all other fields
          setValue('options', undefined);
          setValue('acceptableAnswers', undefined);
          setValue('correctAnswer', undefined);
          setValue('maxWords', undefined);
          setValue('minWords', undefined);
          setValue('rubric', undefined);
          setValue('showRandomOrder', undefined);
          setValue('caseSensitive', undefined); // Also clear caseSensitive from root if it was set by short-answer

          // Set default blanks if not already set
          const currentBlanks = watch('blanks');
          if (!currentBlanks || currentBlanks.length === 0) {
            setValue('blanks', [{ position: 0, acceptedAnswers: [''], caseSensitive: false, placeholder: '' }]);
          }
          break;
        } // Added closing brace
          
        case 'short-answer': {
          // Clear all other fields
          setValue('options', undefined);
          setValue('correctAnswer', undefined);
          setValue('blanks', undefined);
          setValue('maxWords', undefined);
          setValue('minWords', undefined);
          setValue('rubric', undefined);
          setValue('showRandomOrder', undefined);
          replace([]); // Clear options array
          
          // Set default acceptable answers if not already set
          const currentAnswers = watch('acceptableAnswers');
          if (!currentAnswers || currentAnswers.length === 0) {
            setValue('acceptableAnswers', ['']);
          }
          break;
        }          

        case 'essay':
          // Clear all other fields
          setValue('options', undefined);
          setValue('acceptableAnswers', undefined);
          setValue('correctAnswer', undefined);
          setValue('blanks', undefined);
          setValue('showRandomOrder', undefined);
          setValue('caseSensitive', undefined);
          replace([]); // Clear options array
          break;
      }
    }
  }, [watchedType, setValue, replace, watch]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: QuestionFormDataOutput) => {
    console.log('Form submit triggered with data:', data);
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
        imageUrl: data.imageUrl || undefined,
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

        case 'short-answer':
          console.log('Processing short-answer data:', data.acceptableAnswers);
          questionData = {
            ...baseQuestionData,
            acceptableAnswers: data.acceptableAnswers?.filter(answer => answer.trim().length > 0) || [],
            caseSensitive: data.caseSensitive ?? false,
          };
          console.log('Short-answer questionData:', questionData);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
      subtitle="Tạo câu hỏi toán học với editor LaTeX"
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log('Form validation errors:', errors);
      })} className="px-4 pb-4 sm:px-6">
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

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL hình ảnh (tùy chọn)
            </label>
            <input
              type="url"
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
              className={`block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.imageUrl ? 'border-red-300' : ''
              }`}
            />
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl.message}</p>
            )}
            {watch('imageUrl') && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 mb-2">Xem trước hình ảnh:</p>
                <img 
                  src={watch('imageUrl')} 
                  alt="Preview" 
                  className="max-w-xs max-h-32 object-contain border border-gray-200 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Nhập URL trực tiếp đến hình ảnh. Hình ảnh sẽ hiển thị trong câu hỏi.
            </p>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại câu hỏi *
            </label>
            <select
              {...register('type')}
              className={`block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.type ? 'border-red-300' : ''
              }`}
            >
              <option value="multiple-choice">Trắc nghiệm (1 đáp án)</option>
              <option value="multiple-select">Trắc nghiệm (nhiều đáp án)</option>
              <option value="true-false">Đúng/Sai</option>
              <option value="fill-blank">Điền khuyết</option>
              <option value="short-answer">Câu trả lời ngắn</option>
              <option value="essay">Tự luận</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
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

          {/* Type-specific fields */}
          {watchedType === 'multiple-choice' || watchedType === 'multiple-select' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Lựa chọn đáp án *
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ LaTeX cho công thức toán học (VD: $x^2 + 1$, $\frac{1}{2}$)
                  </p>
                </div>
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
                  <div key={field.id} className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
                    {/* Correct Answer Radio/Checkbox */}
                    <div className="flex items-center pt-2">
                      {watchedType === 'multiple-choice' ? (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={watchedOptions?.[index]?.isCorrect || false}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={watchedOptions?.[index]?.isCorrect || false}
                          onChange={(e) => setValue(`options.${index}.isCorrect`, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      )}
                    </div>

                    {/* Option Label */}
                    <div className="flex items-center pt-2 min-w-[30px]">
                      <span className="text-sm font-medium text-gray-700">
                        {getOptionLabel(index)}.
                      </span>
                    </div>

                    {/* Option Text with LaTeX Support */}
                    <div className="flex-1">
                      <SimpleLatexInput
                        value={watchedOptions?.[index]?.text || ''}
                        onChange={(value) => {
                          setValue(`options.${index}.text`, value);
                        }}
                        placeholder={`Lựa chọn ${getOptionLabel(index)} - Nhập văn bản hoặc LaTeX`}
                        error={errors.options?.[index]?.text?.message}
                        className="w-full"
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<TrashIcon className="h-4 w-4" />}
                      onClick={() => handleRemoveOption(index)}
                      disabled={fields.length <= 2}
                      className="text-red-600 hover:text-red-700 mt-1"
                    >
                    </Button>
                  </div>
                ))}
              </div>

              {errors.options && typeof errors.options.message === 'string' && (
                <p className="mt-2 text-sm text-red-600">{errors.options.message}</p>
              )}
            </div>
          ) : watchedType === 'short-answer' ? (
            <ShortAnswerFields register={register} setValue={setValue} watch={watch} errors={errors} />
          ) : watchedType === 'fill-blank' ? (
            <FillBlankFields control={control} register={register} setValue={setValue} watch={watch} errors={errors} />
          ) : watchedType === 'true-false' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đáp án đúng *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...register('correctAnswer')}
                      value="true"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Đúng</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      {...register('correctAnswer')}
                      value="false"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Sai</span>
                  </label>
                </div>
              </div>
            </div>
          ) : watchedType === 'essay' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số từ tối thiểu
                  </label>
                  <input
                    type="number"
                    {...register('minWords', { valueAsNumber: true })}
                    min="1"
                    className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="VD: 50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số từ tối đa
                  </label>
                  <input
                    type="number"
                    {...register('maxWords', { valueAsNumber: true })}
                    min="1"
                    className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="VD: 500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rubric chấm điểm (tùy chọn)
                </label>
                <textarea
                  {...register('rubric')}
                  rows={3}
                  className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Nhập hướng dẫn chấm điểm..."
                />
              </div>
            </div>
          ) : null}

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

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText={isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
          >
            {isEditing ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
