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
  /** Tự động wrap Vietnamese text trong \text{} */
  autoWrapVietnamese?: boolean;
}

/**
 * Vietnamese text detection utilities
 * Based on Unicode ranges for Vietnamese diacritics and specific characters
 */
class VietnameseTextProcessor {
  // Vietnamese Unicode ranges and specific characters
  private static readonly VIETNAMESE_CHARS = new Set([
    // Base vowels with diacritics
    'à', 'á', 'ả', 'ã', 'ạ', 'ằ', 'ắ', 'ẳ', 'ẵ', 'ặ', 'ầ', 'ấ', 'ẩ', 'ẫ', 'ậ',
    'è', 'é', 'ẻ', 'ẽ', 'ẹ', 'ề', 'ế', 'ể', 'ễ', 'ệ',
    'ì', 'í', 'ỉ', 'ĩ', 'ị',
    'ò', 'ó', 'ỏ', 'õ', 'ọ', 'ồ', 'ố', 'ổ', 'ỗ', 'ộ', 'ờ', 'ớ', 'ở', 'ỡ', 'ợ',
    'ù', 'ú', 'ủ', 'ũ', 'ụ', 'ừ', 'ứ', 'ử', 'ữ', 'ự',
    'ỳ', 'ý', 'ỷ', 'ỹ', 'ỵ',
    // Uppercase variants
    'À', 'Á', 'Ả', 'Ã', 'Ạ', 'Ằ', 'Ắ', 'Ẳ', 'Ẵ', 'Ặ', 'Ầ', 'Ấ', 'Ẩ', 'Ẫ', 'Ậ',
    'È', 'É', 'Ẻ', 'Ẽ', 'Ẹ', 'Ề', 'Ế', 'Ể', 'Ễ', 'Ệ',
    'Ì', 'Í', 'Ỉ', 'Ĩ', 'Ị',
    'Ò', 'Ó', 'Ỏ', 'Õ', 'Ọ', 'Ồ', 'Ố', 'Ổ', 'Ỗ', 'Ộ', 'Ờ', 'Ớ', 'Ở', 'Ỡ', 'Ợ',
    'Ù', 'Ú', 'Ủ', 'Ũ', 'Ụ', 'Ừ', 'Ứ', 'Ử', 'Ữ', 'Ự',
    'Ỳ', 'Ý', 'Ỷ', 'Ỹ', 'Ỵ',
    // Vietnamese specific characters
    'ă', 'â', 'đ', 'ê', 'ô', 'ơ', 'ư',
    'Ă', 'Â', 'Đ', 'Ê', 'Ô', 'Ơ', 'Ư'
  ]);

  /**
   * Check if a character is Vietnamese
   */
  static isVietnameseChar(char: string): boolean {
    return this.VIETNAMESE_CHARS.has(char);
  }

  /**
   * Check if a string contains Vietnamese characters
   */
  static containsVietnamese(text: string): boolean {
    return Array.from(text).some(char => this.isVietnameseChar(char));
  }

  /**
   * Extract Vietnamese words from text
   * A Vietnamese word is a continuous sequence of letters containing at least one Vietnamese character
   */
  static extractVietnameseWords(text: string): Array<{ word: string; start: number; end: number }> {
    const words: Array<{ word: string; start: number; end: number }> = [];
    const regex = /[a-zA-ZÀ-ỹ\u1EA0-\u1EF9]+/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      if (this.containsVietnamese(word)) {
        words.push({
          word,
          start: match.index,
          end: match.index + word.length
        });
      }
    }

    return words;
  }

  /**
   * Automatically wrap Vietnamese text in \text{} commands
   * Preserves existing LaTeX commands and only wraps pure Vietnamese text
   */
  static autoWrapVietnameseText(latex: string): string {
    // Don't process if already contains \text{} commands
    if (latex.includes('\\text{')) {
      return latex;
    }

    // Find Vietnamese words that are not part of LaTeX commands
    const vietnameseWords = this.extractVietnameseWords(latex);
    
    if (vietnameseWords.length === 0) {
      return latex;
    }

    // Process from end to beginning to maintain indices
    let result = latex;
    for (let i = vietnameseWords.length - 1; i >= 0; i--) {
      const { word, start, end } = vietnameseWords[i];
      
      // Check if this word is not already part of a LaTeX command
      const beforeWord = result.substring(Math.max(0, start - 10), start);
      // const afterWord = result.substring(end, Math.min(result.length, end + 2));
      
      // Skip if word is part of a LaTeX command (preceded by \ or inside {})
      if (beforeWord.includes('\\') && !beforeWord.includes(' ') && !beforeWord.includes('{')) {
        continue;
      }
      
      // Skip if word is inside existing braces
      const beforeBraces = result.substring(0, start);
      const openBraces = (beforeBraces.match(/\{/g) || []).length;
      const closeBraces = (beforeBraces.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        continue;
      }

      // Wrap the Vietnamese word in \text{}
      result = result.substring(0, start) + `\\text{${word}}` + result.substring(end);
    }

    return result;
  }

  /**
   * Remove auto-wrapping from Vietnamese text
   * Useful for editing mode
   */
  static removeAutoWrap(latex: string): string {
    // Simple removal of \text{} around Vietnamese words
    return latex.replace(/\\text\{([^}]*)\}/g, (match, content) => {
      if (this.containsVietnamese(content)) {
        return content;
      }
      return match; // Keep non-Vietnamese \text{} commands
    });
  }
}

/**
 * Component editor toán học sử dụng MathLive cho phép nhập công thức LaTeX
 * với giao diện tiếng Việt, tích hợp preview và tự động wrap Vietnamese text.
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
  error,
  autoWrapVietnamese = true
}) => {
  const mathfieldRef = useRef<HTMLElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastProcessedValue, setLastProcessedValue] = useState('');

  useEffect(() => {
    // Import MathLive dynamically to ensure it loads properly
    const initializeMathfield = async () => {
      try {
        // Import MathLive with error handling
        // const mathLive = await import('mathlive');
        
        // Configure font loading to use local fonts from public directory
        // This avoids OTS parsing errors with node_modules fonts
        if (typeof window !== 'undefined') {
          // Set configuration to use local fonts from /fonts/ directory
          const config = {
            fontsDirectory: '/fonts/', // Use fonts from public/fonts/
            computeEngine: 'auto'
          };
          
          // Apply configuration if MathfieldElement is available
          if ((window as any).MathfieldElement && (window as any).MathfieldElement.configure) {
            try {
              (window as any).MathfieldElement.configure(config);
            } catch (configError) {
              console.warn('MathLive configuration warning:', configError);
            }
          }
        }
        
        if (mathfieldRef.current) {
          return;
        }

        // Create mathfield element using web component
        const mathfield = document.createElement('math-field') as any;
        
        // Configure mathfield using attributes for better compatibility
        mathfield.setAttribute('virtual-keyboard-mode', 'manual');
        mathfield.setAttribute('smart-mode', 'true');
        
        // Set placeholder if provided
        if (placeholder) {
          mathfield.setAttribute('placeholder', placeholder);
        }
        
        // Set initial value
        if (value) {
          mathfield.value = value;
        }

        // Handle input changes with Vietnamese auto-wrapping
        mathfield.addEventListener('input', () => {
          let latex = mathfield.value;
          
          // Apply Vietnamese auto-wrapping if enabled
          if (autoWrapVietnamese && latex !== lastProcessedValue) {
            const processedLatex = VietnameseTextProcessor.autoWrapVietnameseText(latex);
            if (processedLatex !== latex) {
              // Update the mathfield with wrapped text
              mathfield.value = processedLatex;
              latex = processedLatex;
            }
            setLastProcessedValue(latex);
          }
          
          onChange?.(latex);
        });

        // Set disabled state
        if (disabled) {
          mathfield.setAttribute('readonly', 'true');
        }

        // Store reference
        mathfieldRef.current = mathfield;
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize MathLive:', error);
        // Set loaded to true even on error to show the container
        setIsLoaded(true);
      }
    };

    initializeMathfield();

    return () => {
      if (mathfieldRef.current) {
        try {
          mathfieldRef.current.remove();
        } catch (e) {
          // Ignore errors during cleanup
        }
        mathfieldRef.current = null;
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (mathfieldRef.current && (mathfieldRef.current as any).value !== value) {
      try {
        (mathfieldRef.current as any).value = value;
        setLastProcessedValue(value);
      } catch (e) {
        console.warn('Failed to update MathLive value:', e);
      }
    }
  }, [value]);

  // Update disabled state when prop changes
  useEffect(() => {
    if (mathfieldRef.current) {
      if (disabled) {
        mathfieldRef.current.setAttribute('readonly', 'true');
      } else {
        mathfieldRef.current.removeAttribute('readonly');
      }
    }
  }, [disabled]);

  /**
   * Chèn mathfield element vào DOM container
   */
  const mathfieldContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (mathfieldRef.current && mathfieldContainerRef.current && isLoaded) {
      try {
        // Clear container and append mathfield
        mathfieldContainerRef.current.innerHTML = '';
        mathfieldContainerRef.current.appendChild(mathfieldRef.current);
      } catch (e) {
        console.warn('Failed to append MathLive to container:', e);
      }
    }
  }, [isLoaded]);

  /**
   * Insert text with Vietnamese auto-wrapping
   */
  const insertText = (text: string) => {
    if (mathfieldRef.current) {
      try {
        let processedText = text;
        if (autoWrapVietnamese && VietnameseTextProcessor.containsVietnamese(text)) {
          processedText = VietnameseTextProcessor.autoWrapVietnameseText(text);
        }
        (mathfieldRef.current as any).insert(processedText);
        (mathfieldRef.current as any).focus();
      } catch (e) {
        console.warn('Failed to insert text:', e);
      }
    }
  };

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

        {/* Vietnamese Auto-wrap Indicator */}
        {autoWrapVietnamese && value && VietnameseTextProcessor.containsVietnamese(value) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <div className="text-xs text-blue-700 flex items-center">
              <span className="mr-1">🇻🇳</span>
              Tiếng Việt được tự động đặt trong \text{'{}'} để hiển thị đúng định dạng
            </div>
          </div>
        )}

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

        {/* Toolbar with common symbols and Vietnamese text button */}
        {!disabled && (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 rounded-md border">
            <div className="text-xs text-gray-600 mr-2">Ký hiệu thường dùng:</div>
            
            {/* Vietnamese Text Button */}
            <button
              type="button"
              onClick={() => insertText('\\text{văn bản tiếng Việt}')}
              className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-100"
              title="Chèn văn bản tiếng Việt"
            >
              🇻🇳 Tiếng Việt
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (mathfieldRef.current) {
                  try {
                    (mathfieldRef.current as any).insert('\\frac{}{}');
                    (mathfieldRef.current as any).focus();
                  } catch (e) {
                    console.warn('Failed to insert fraction:', e);
                  }
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
                  try {
                    (mathfieldRef.current as any).insert('^{}');
                    (mathfieldRef.current as any).focus();
                  } catch (e) {
                    console.warn('Failed to insert power:', e);
                  }
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
                  try {
                    (mathfieldRef.current as any).insert('\\sqrt{}');
                    (mathfieldRef.current as any).focus();
                  } catch (e) {
                    console.warn('Failed to insert sqrt:', e);
                  }
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
                  try {
                    (mathfieldRef.current as any).insert('\\sum_{i=1}^{n}');
                    (mathfieldRef.current as any).focus();
                  } catch (e) {
                    console.warn('Failed to insert sum:', e);
                  }
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
                  try {
                    (mathfieldRef.current as any).insert('\\int_{a}^{b}');
                    (mathfieldRef.current as any).focus();
                  } catch (e) {
                    console.warn('Failed to insert integral:', e);
                  }
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
                  try {
                    (mathfieldRef.current as any).insert('\\lim_{x \\to \\infty}');
                    (mathfieldRef.current as any).focus();
                  } catch (e) {
                    console.warn('Failed to insert limit:', e);
                  }
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