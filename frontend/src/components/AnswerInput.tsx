import React, { useState, useCallback } from 'react';
import { RichTextDisplay } from './RichTextDisplay';
import { MathEditor } from './MathEditor';
import type { Question } from '../types/questions';

interface AnswerInputProps {
  question: Question;
  value?: any;
  onChange: (answer: any) => void;
  disabled?: boolean;
}

/**
 * Dynamic answer input component that renders different input types
 * based on the question type with Vietnamese UI
 */
export const AnswerInput: React.FC<AnswerInputProps> = ({
  question,
  value,
  onChange,
  disabled = false,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    value && Array.isArray(value) ? value : value ? [value] : []
  );

  const handleOptionChange = useCallback((optionId: string, isMultiple = false) => {
    if (isMultiple) {
      // Multiple select handling
      const newSelected = selectedOptions.includes(optionId)
        ? selectedOptions.filter(id => id !== optionId)
        : [...selectedOptions, optionId];
      
      setSelectedOptions(newSelected);
      onChange(newSelected);
    } else {
      // Single select handling
      setSelectedOptions([optionId]);
      onChange(optionId);
    }
  }, [selectedOptions, onChange]);

  const handleTextChange = useCallback((text: string) => {
    onChange(text);
  }, [onChange]);

  const renderQuestionContent = () => {
    return (
      <div className="mb-6">
        <RichTextDisplay 
          content={question.content} 
          className="text-lg leading-relaxed"
        />
        {question.explanation && (
          <div className="mt-2 text-sm text-gray-600">
            <RichTextDisplay content={question.explanation} />
          </div>
        )}
      </div>
    );
  };

  const renderMultipleChoice = () => {
    if (question.type !== 'multiple-choice') return null;

    return (
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
          const isSelected = selectedOptions.includes(option.id);
          
          return (
            <label
              key={option.id}
              className={`
                block p-4 border rounded-lg cursor-pointer transition-colors
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => handleOptionChange(option.id)}
                  disabled={disabled}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">
                      {optionLabel}.
                    </span>
                    <RichTextDisplay content={option.text} />
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    );
  };

  const renderMultipleSelect = () => {
    if (question.type !== 'multiple-select') return null;

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Chọn tất cả các đáp án đúng:
        </p>
        {question.options.map((option, index) => {
          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D...
          const isSelected = selectedOptions.includes(option.id);
          
          return (
            <label
              key={option.id}
              className={`
                block p-4 border rounded-lg cursor-pointer transition-colors
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => handleOptionChange(option.id, true)}
                  disabled={disabled}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 mr-2">
                      {optionLabel}.
                    </span>
                    <RichTextDisplay content={option.text} />
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = () => {
    if (question.type !== 'true-false') return null;

    const trueSelected = value === true || value === 'true';
    const falseSelected = value === false || value === 'false';

    return (
      <div className="space-y-3">
        <label
          className={`
            block p-4 border rounded-lg cursor-pointer transition-colors
            ${trueSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              name={`question-${question.id}`}
              value="true"
              checked={trueSelected}
              onChange={() => onChange(true)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-lg font-medium text-gray-900">
              Đúng
            </span>
          </div>
        </label>

        <label
          className={`
            block p-4 border rounded-lg cursor-pointer transition-colors
            ${falseSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              name={`question-${question.id}`}
              value="false"
              checked={falseSelected}
              onChange={() => onChange(false)}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-lg font-medium text-gray-900">
              Sai
            </span>
          </div>
        </label>
      </div>
    );
  };

  const renderFillBlank = () => {
    if (question.type !== 'fill-blank') return null;

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Điền vào chỗ trống:
        </p>
        <div className="space-y-3">
          {question.blanks.map((blank, index) => (
            <div key={blank.id} className="flex items-center space-x-3">
              <label className="font-medium text-gray-700 min-w-0">
                Chỗ trống {index + 1}:
              </label>
              <input
                type="text"
                value={value?.[blank.id] || ''}
                onChange={(e) => {
                  const newValue = { ...value, [blank.id]: e.target.value };
                  onChange(newValue);
                }}
                disabled={disabled}
                placeholder={blank.placeholder || 'Nhập đáp án...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          {question.caseSensitive 
            ? 'Phân biệt chữ hoa/thường' 
            : 'Không phân biệt chữ hoa/thường'
          }
        </p>
      </div>
    );
  };

  const renderEssay = () => {
    if (question.type !== 'essay') return null;

    const wordCount = value ? value.split(/\s+/).filter((word: string) => word.length > 0).length : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Câu trả lời tự luận:
          </label>
          <div className="text-sm text-gray-500">
            {wordCount} từ
            {question.maxWords && ` / ${question.maxWords} từ tối đa`}
            {question.minWords && ` (tối thiểu ${question.minWords} từ)`}
          </div>
        </div>
        
        <MathEditor
          value={value || ''}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="Nhập câu trả lời của bạn..."
          className="min-h-32"
          autoWrapVietnamese={true}
        />
        
        {question.rubric && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Tiêu chí chấm điểm:
            </h4>
            <RichTextDisplay 
              content={question.rubric} 
              className="text-sm text-blue-800"
            />
          </div>
        )}
        
        {/* Word count validation */}
        {question.minWords && wordCount < question.minWords && (
          <p className="text-sm text-amber-600">
            Cần ít nhất {question.minWords} từ
          </p>
        )}
        {question.maxWords && wordCount > question.maxWords && (
          <p className="text-sm text-red-600">
            Vượt quá giới hạn {question.maxWords} từ
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Question Content */}
      {renderQuestionContent()}

      {/* Answer Input based on type */}
      <div className="border-t border-gray-200 pt-6">
        {question.type === 'multiple-choice' && renderMultipleChoice()}
        {question.type === 'multiple-select' && renderMultipleSelect()}
        {question.type === 'true-false' && renderTrueFalse()}
        {question.type === 'fill-blank' && renderFillBlank()}
        {question.type === 'essay' && renderEssay()}
      </div>
    </div>
  );
}; 