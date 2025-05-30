import React, { useEffect, useRef, useState } from 'react';

interface MathEditorProps {
  /** Giá trị LaTeX hiện tại */
  value?: string;
  /** Callback khi giá trị thay đổi */
  onChange?: (latex: string) => void;
  /** Placeholder text hiển thị trong editor */
  placeholder?: string;
  /** Có disabled không */
  disabled?: boolean;
  /** CSS class names bổ sung */
  className?: string;
  /** ID cho accessibility */
  id?: string;
  /** Label cho accessibility */
  label?: string;
  /** Có hiển thị preview KaTeX không */
  showPreview?: boolean;
  /** Thông báo lỗi nếu có */
  error?: string;
}

/**
 * Component editor toán học sử dụng MathLive cho phép nhập công thức LaTeX
 * với giao diện tiếng Việt và tích hợp preview.
 */
export const MathEditor: React.FC<MathEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập công thức toán học...',
  disabled = false,
  className = '',
  id,
  label,
  showPreview = true,
  error
}) => {
  const mathfieldRef = useRef<HTMLElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Import MathLive dynamically to ensure it loads properly
    const initializeMathfield = async () => {
      try {
        // Ensure MathLive is loaded
        await import('mathlive');
        
        if (mathfieldRef.current) {
          return;
        }

        // Create mathfield element using web component
        const mathfield = document.createElement('math-field') as any;
        
        // Configure mathfield using attributes
        mathfield.setAttribute('virtual-keyboard-mode', 'manual');
        
        // Set initial value
        if (value) {
          mathfield.value = value;
        }

        // Handle input changes
        mathfield.addEventListener('input', () => {
          const latex = mathfield.value;
          onChange?.(latex);
        });

        // Set disabled state
        if (disabled) {
          mathfield.setAttribute('disabled', '');
        }

        // Store reference
        mathfieldRef.current = mathfield;
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize MathLive:', error);
      }
    };

    initializeMathfield();

    return () => {
      if (mathfieldRef.current) {
        mathfieldRef.current.remove();
        mathfieldRef.current = null;
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (mathfieldRef.current && (mathfieldRef.current as any).value !== value) {
      (mathfieldRef.current as any).value = value;
    }
  }, [value]);

  // Update disabled state when prop changes
  useEffect(() => {
    if (mathfieldRef.current) {
      if (disabled) {
        mathfieldRef.current.setAttribute('disabled', '');
      } else {
        mathfieldRef.current.removeAttribute('disabled');
      }
    }
  }, [disabled]);

  /**
   * Chèn mathfield element vào DOM container
   */
  const mathfieldContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (mathfieldRef.current && mathfieldContainerRef.current && isLoaded) {
      // Clear container and append mathfield
      mathfieldContainerRef.current.innerHTML = '';
      mathfieldContainerRef.current.appendChild(mathfieldRef.current);
    }
  }, [isLoaded]);

  return (
    <div className={`math-editor ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="space-y-3">
        {/* MathLive Editor Container */}
        <div 
          className={`border rounded-md p-3 min-h-[60px] ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50' : 'bg-white'}`}
        >
          <div 
            ref={mathfieldContainerRef}
            className="mathfield-container"
            style={{ fontSize: '16px' }}
          />
          {!isLoaded && (
            <div className="text-gray-500 text-sm">
              Đang tải editor toán học...
            </div>
          )}
        </div>

        {/* LaTeX Preview */}
        {showPreview && value && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <div className="text-xs text-gray-600 mb-1">Preview LaTeX:</div>
            <div className="font-mono text-sm text-gray-800 break-all">
              {value}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Toolbar with common symbols */}
        {!disabled && (
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border">
            <div className="text-xs text-gray-600 mr-2">Ký hiệu thường dùng:</div>
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  (mathfieldRef.current as any).insert('\\frac{}{}');
                  (mathfieldRef.current as any).focus();
                }
              }}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Phân số"
            >
              a/b
            </button>
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  (mathfieldRef.current as any).insert('^{}');
                  (mathfieldRef.current as any).focus();
                }
              }}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Lũy thừa"
            >
              x²
            </button>
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  (mathfieldRef.current as any).insert('\\sqrt{}');
                  (mathfieldRef.current as any).focus();
                }
              }}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Căn bậc hai"
            >
              √
            </button>
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  (mathfieldRef.current as any).insert('\\sum_{i=1}^{n}');
                  (mathfieldRef.current as any).focus();
                }
              }}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Tổng"
            >
              Σ
            </button>
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  (mathfieldRef.current as any).insert('\\int_{a}^{b}');
                  (mathfieldRef.current as any).focus();
                }
              }}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Tích phân"
            >
              ∫
            </button>
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  (mathfieldRef.current as any).insert('\\lim_{x \\to \\infty}');
                  (mathfieldRef.current as any).focus();
                }
              }}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Giới hạn"
            >
              lim
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathEditor; 