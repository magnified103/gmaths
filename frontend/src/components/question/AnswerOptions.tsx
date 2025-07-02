// React import removed - using JSX without explicit React reference
import { 
  PlusIcon, 
  TrashIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '../ui/Button';
import { SimpleLatexInput } from './SimpleLatexInput';

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface AnswerOptionsProps {
  options: AnswerOption[];
  onOptionsChange: (options: AnswerOption[]) => void;
  onCorrectChange: (optionId: string) => void;
  maxOptions?: number;
  minOptions?: number;
  allowMultipleCorrect?: boolean;
  errors?: Record<string, string>;
  disabled?: boolean;
}

interface SortableOptionProps {
  option: AnswerOption;
  index: number;
  isCorrect: boolean;
  onTextChange: (text: string) => void;
  onCorrectChange: () => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
  error?: string;
}

/**
 * Sortable answer option item component with LaTeX support
 */
function SortableOption({
  option,
  index,
  isCorrect,
  onTextChange,
  onCorrectChange,
  onRemove,
  canRemove,
  disabled = false,
  error,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start space-x-3 p-3 bg-white border rounded-lg ${
        isDragging ? 'shadow-lg' : 'shadow-sm'
      } ${error ? 'border-red-300' : 'border-gray-200'}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center pt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <Bars3Icon className="h-5 w-5" />
      </div>

      {/* Correct Answer Radio/Checkbox */}
      <div className="flex items-center pt-2">
        <input
          type="radio"
          name="correctAnswer"
          checked={isCorrect}
          onChange={onCorrectChange}
          disabled={disabled}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
      </div>

      {/* Option Label */}
      <div className="flex items-center pt-2 min-w-[24px]">
        <span className="text-sm font-medium text-gray-700">
          {String.fromCharCode(65 + index)}.
        </span>
      </div>

      {/* LaTeX-enabled Option Text Input */}
      <div className="flex-1">
        <SimpleLatexInput
          value={option.text}
          onChange={onTextChange}
          placeholder={`Lựa chọn ${String.fromCharCode(65 + index)} - Hỗ trợ LaTeX (VD: $x^2 + 1$)`}
          disabled={disabled}
          error={error}
          className="answer-option-editor"
        />
      </div>

      {/* Remove Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<TrashIcon className="h-4 w-4" />}
        onClick={onRemove}
        disabled={!canRemove || disabled}
        className="text-red-600 hover:text-red-700 disabled:text-gray-400"
        title="Xóa lựa chọn"
      />
    </div>
  );
}

/**
 * Answer options component for managing multiple choice answers
 * Now supports LaTeX input for mathematical expressions
 */
export default function AnswerOptions({
  options,
  onOptionsChange,
  onCorrectChange,
  maxOptions = 6,
  minOptions = 2,
  allowMultipleCorrect = false,
  errors = {},
  disabled = false,
}: AnswerOptionsProps) {
  /**
   * Thêm lựa chọn mới
   */
  const handleAddOption = () => {
    if (options.length >= maxOptions) return;

    const newOption: AnswerOption = {
      id: `option-${Date.now()}`,
      text: '',
      isCorrect: false,
    };

    onOptionsChange([...options, newOption]);
  };

  /**
   * Xóa lựa chọn
   */
  const handleRemoveOption = (optionId: string) => {
    if (options.length <= minOptions) return;

    const filteredOptions = options.filter((opt) => opt.id !== optionId);
    onOptionsChange(filteredOptions);
  };

  /**
   * Cập nhật text của lựa chọn
   */
  const handleTextChange = (optionId: string, text: string) => {
    const updatedOptions = options.map((opt) =>
      opt.id === optionId ? { ...opt, text } : opt
    );
    onOptionsChange(updatedOptions);
  };

  /**
   * Xử lý thay đổi đáp án đúng
   */
  const handleCorrectChange = (optionId: string) => {
    if (allowMultipleCorrect) {
      // Toggle cho phép nhiều đáp án đúng
      const updatedOptions = options.map((opt) =>
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      );
      onOptionsChange(updatedOptions);
    } else {
      // Chỉ cho phép 1 đáp án đúng
      const updatedOptions = options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === optionId,
      }));
      onOptionsChange(updatedOptions);
      onCorrectChange(optionId);
    }
  };

  /**
   * Kiểm tra có thể xóa lựa chọn không
   */
  const canRemoveOption = (_optionId: string) => {
    return options.length > minOptions && !disabled;
  };

  /**
   * Đếm số đáp án đúng
   */
  const correctCount = options.filter((opt) => opt.isCorrect).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Lựa chọn đáp án *
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {allowMultipleCorrect 
              ? `Có thể chọn nhiều đáp án đúng. Hiện tại: ${correctCount} đáp án đúng`
              : `Phải có đúng 1 đáp án đúng. Hiện tại: ${correctCount} đáp án đúng`
            }
          </p>
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={handleAddOption}
          disabled={options.length >= maxOptions || disabled}
        >
          Thêm lựa chọn ({options.length}/{maxOptions})
        </Button>
      </div>

      {/* Validation Errors */}
      {errors.general && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-800">{errors.general}</p>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <SortableOption
            key={option.id}
            option={option}
            index={index}
            isCorrect={option.isCorrect}
            onTextChange={(text) => handleTextChange(option.id, text)}
            onCorrectChange={() => handleCorrectChange(option.id)}
            onRemove={() => handleRemoveOption(option.id)}
            canRemove={canRemoveOption(option.id)}
            disabled={disabled}
            error={errors[option.id]}
          />
        ))}
      </div>


    </div>
  );
} 