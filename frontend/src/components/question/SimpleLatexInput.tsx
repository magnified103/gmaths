import React, { useState, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface SimpleLatexInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

/**
 * Simple LaTeX input component that follows the same approach as RichTextEditor
 * Uses KaTeX for preview rendering and simple styling
 */
export const SimpleLatexInput: React.FC<SimpleLatexInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập văn bản hoặc LaTeX (VD: $x^2 + 1$)...',
  disabled = false,
  className = '',
  error,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Show preview when there's content that contains LaTeX
  useEffect(() => {
    setShowPreview(value.includes('$') && value.length > 2);
  }, [value]);

  /**
   * Render LaTeX content using KaTeX similar to RichTextDisplay
   */
  const renderLatexPreview = (content: string): string => {
    if (!content) return '';

    let processedContent = content;

    // Process inline math ($...$)
    processedContent = processedContent.replace(/\$([^$]+)\$/g, (match, latex) => {
      try {
        const rendered = katex.renderToString(latex.trim(), {
          throwOnError: false,
          displayMode: false,
          output: 'html'
        });
        return `<span class="math-inline" style="display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 6px; margin: 0 2px;">${rendered}</span>`;
      } catch (error) {
        console.warn('KaTeX rendering failed:', error);
        return match; // Return original if rendering fails
      }
    });

    // Process display math ($$...$$)
    processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
      try {
        const rendered = katex.renderToString(latex.trim(), {
          throwOnError: false,
          displayMode: true,
          output: 'html'
        });
        return `<div class="math-display" style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; margin: 4px 0; text-align: center;">${rendered}</div>`;
      } catch (error) {
        console.warn('KaTeX rendering failed:', error);
        return match; // Return original if rendering fails
      }
    });

    return processedContent;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Input */}
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
        } ${disabled ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
      />

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* LaTeX Preview */}
      {showPreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-xs text-gray-600 mb-2">Preview:</div>
          <div 
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: renderLatexPreview(value) 
            }}
          />
        </div>
      )}

      {/* Quick Help */}
      {!disabled && (
        <div className="text-xs text-gray-500">
          Sử dụng $...$ cho công thức trong dòng hoặc $$...$$ cho công thức riêng dòng
        </div>
      )}
    </div>
  );
}; 