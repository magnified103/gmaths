import React, { useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Calculator, Trash2
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathBlock {
  id: string;
  latex: string;
  position: number;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  allowMath?: boolean;
}

/**
 * RichTextEditor - User-friendly editor with Vietnamese support and optional math insertion
 * Separates regular text editing from mathematical expressions for better UX
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  disabled = false,
  className = '',
  label,
  error,
  allowMath = true
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mathBlocks, setMathBlocks] = useState<MathBlock[]>([]);
  const [showMathInput, setShowMathInput] = useState(false);
  const [currentMathLatex, setCurrentMathLatex] = useState('');
  const [editingMathId, setEditingMathId] = useState<string | null>(null);
  const [lastSelection, setLastSelection] = useState<Range | null>(null);

  /**
   * Save current cursor position
   */
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setLastSelection(selection.getRangeAt(0).cloneRange());
    }
  }, []);

  /**
   * Restore cursor position
   */
  const restoreSelection = useCallback(() => {
    if (lastSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(lastSelection);
      }
    }
  }, [lastSelection]);

  /**
   * Handle text formatting commands using modern DOM APIs
   */
  const execCommand = useCallback((command: string, value?: string) => {
    if (disabled || !editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Get range to validate selection exists
    selection.getRangeAt(0);
    
    // Save selection for restoration
    saveSelection();
    
    try {
      switch (command) {
        case 'bold':
          applyFormatting('strong');
          break;
        case 'italic':
          applyFormatting('em');
          break;
        case 'underline':
          applyFormatting('u');
          break;
        case 'insertUnorderedList':
          toggleList('ul');
          break;
        case 'insertOrderedList':
          toggleList('ol');
          break;
        case 'justifyLeft':
          applyAlignment('left');
          break;
        case 'justifyCenter':
          applyAlignment('center');
          break;
        case 'justifyRight':
          applyAlignment('right');
          break;
        default:
          // Fallback for any unhandled commands
          document.execCommand(command, false, value);
      }
    } catch (error) {
      console.warn('Formatting command failed:', command, error);
    }
    
    // Update content after formatting
    if (onChange) {
      setTimeout(() => {
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }, 0);
    }
  }, [disabled, onChange, saveSelection]);

  /**
   * Apply text formatting using modern DOM APIs
   */
  const applyFormatting = useCallback((tagName: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    if (range.collapsed) {
      // No text selected, just place cursor for future typing
      const element = document.createElement(tagName);
      element.appendChild(document.createTextNode('\u200B')); // Zero-width space
      range.insertNode(element);
      
      // Place cursor inside the element
      const newRange = document.createRange();
      newRange.setStart(element.firstChild!, 1);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Text is selected, wrap or unwrap it
      const commonAncestor = range.commonAncestorContainer;
      const parentElement = commonAncestor.nodeType === Node.TEXT_NODE 
        ? commonAncestor.parentElement 
        : commonAncestor as Element;

      // Check if we're already inside this formatting tag
      const existingFormat = parentElement?.closest(tagName);
      
      if (existingFormat && range.toString() === existingFormat.textContent) {
        // Remove formatting
        const parent = existingFormat.parentNode;
        if (parent) {
          parent.insertBefore(document.createTextNode(existingFormat.textContent || ''), existingFormat);
          parent.removeChild(existingFormat);
        }
      } else {
        // Apply formatting
        const selectedContent = range.extractContents();
        const formattedElement = document.createElement(tagName);
        formattedElement.appendChild(selectedContent);
        range.insertNode(formattedElement);
        
        // Restore selection around the formatted content
        const newRange = document.createRange();
        newRange.selectNodeContents(formattedElement);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  }, []);

  /**
   * Toggle list formatting - improved version
   */
  const toggleList = useCallback((listType: 'ul' | 'ol') => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    // If no selection, create range at cursor
    let range: Range;
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    let currentNode: Node | null = range.startContainer;
    
    // Find if we're inside a list
    while (currentNode && currentNode !== editorRef.current) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as Element;
        if (element.tagName === 'UL' || element.tagName === 'OL') {
          // We're in a list, remove it
          const listItems = Array.from(element.children);
          const parent = element.parentNode;
          if (parent) {
            listItems.forEach(li => {
              const p = document.createElement('p');
              p.innerHTML = li.innerHTML;
              parent.insertBefore(p, element);
            });
            parent.removeChild(element);
          }
          return;
        }
      }
      currentNode = currentNode.parentNode;
    }

    // Not in a list, create one
    const selectedContent = range.extractContents();
    const list = document.createElement(listType);
    const listItem = document.createElement('li');
    
    if (selectedContent.textContent?.trim()) {
      // Has selected content, use it
      listItem.appendChild(selectedContent);
    } else {
      // No selected content, create empty list item with cursor positioned inside
      listItem.appendChild(document.createTextNode(''));
    }
    
    list.appendChild(listItem);
    range.insertNode(list);
    
    // Place cursor in the list item
    const newRange = document.createRange();
    newRange.setStart(listItem, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    // Focus the editor to ensure cursor is visible
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  /**
   * Apply text alignment
   */
  const applyAlignment = useCallback((alignment: 'left' | 'center' | 'right') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    let currentBlock: Node | null = range.startContainer;
    
    // Find the current block element
    while (currentBlock && currentBlock !== editorRef.current) {
      if (currentBlock.nodeType === Node.ELEMENT_NODE) {
        const element = currentBlock as Element;
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(element.tagName)) {
          break;
        }
      }
      currentBlock = currentBlock.parentNode;
    }

    if (currentBlock && currentBlock !== editorRef.current) {
      const element = currentBlock as HTMLElement;
      element.style.textAlign = alignment;
    } else {
      // Wrap selection in a div with alignment
      const selectedContent = range.extractContents();
      const div = document.createElement('div');
      div.style.textAlign = alignment;
      div.appendChild(selectedContent);
      range.insertNode(div);
    }
  }, []);

  /**
   * Insert HTML at cursor position using modern approach
   */
  const insertHtmlAtCursor = useCallback((html: string) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return false;

    let range: Range;
    
    // Try to get existing selection first
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      
      // Ensure the range is within our editor
      const editorElement = editorRef.current;
      if (!editorElement.contains(range.commonAncestorContainer) && 
          range.commonAncestorContainer !== editorElement) {
        // Selection is outside editor, create new range at end
        range = document.createRange();
        range.selectNodeContents(editorElement);
        range.collapse(false);
      }
    } else {
      // No selection, create a range at the end of the editor
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }

    // Delete any selected content
    range.deleteContents();

    // Create a document fragment from the HTML
    const template = document.createElement('template');
    template.innerHTML = html;
    const fragment = template.content;

    // Insert the fragment
    range.insertNode(fragment);

    // Move cursor after the inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  }, []);

  /**
   * Insert math block at cursor position
   */
  const insertMathBlock = useCallback(() => {
    if (!currentMathLatex.trim()) return;

    const mathId = editingMathId || `math-${Date.now()}`;
    
    // Render the LaTeX using KaTeX for display in the editor
    let renderedMath: string;
    try {
      renderedMath = katex.renderToString(currentMathLatex, {
        throwOnError: false,
        displayMode: false, // Use inline mode for editor display
        output: 'html'
      });
    } catch (error) {
      console.warn('KaTeX rendering failed, using fallback:', error);
      renderedMath = currentMathLatex; // Fallback to raw LaTeX
    }
    
    const mathHtml = `<span class="math-block" data-math-id="${mathId}" data-latex="${encodeURIComponent(currentMathLatex)}" contenteditable="false" style="display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; margin: 0 2px; cursor: pointer;">${renderedMath}</span>&nbsp;`;

    if (editingMathId) {
      // Update existing math block
      if (editorRef.current) {
        const existingBlock = editorRef.current.querySelector(`[data-math-id="${editingMathId}"]`);
        if (existingBlock) {
          existingBlock.outerHTML = mathHtml;
        }
      }
      setMathBlocks(prev => prev.map(block => 
        block.id === editingMathId 
          ? { ...block, latex: currentMathLatex }
          : block
      ));
    } else {
      // Insert new math block
      if (editorRef.current) {
        editorRef.current.focus();
        
        // Try to restore the saved selection first
        if (lastSelection) {
          try {
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(lastSelection);
            }
          } catch (error) {
            console.warn('Could not restore selection:', error);
          }
        }
        
        // Call insertHtmlAtCursor which handles the actual insertion
        const inserted = insertHtmlAtCursor(mathHtml);
        
        if (inserted) {
          setMathBlocks(prev => [...prev, {
            id: mathId,
            latex: currentMathLatex,
            position: 0 // Position will be updated when needed
          }]);
        }
      }
    }

    // Reset math input
    setCurrentMathLatex('');
    setShowMathInput(false);
    setEditingMathId(null);
    
    // Trigger change event
    if (editorRef.current && onChange) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (editorRef.current && onChange) {
          onChange(editorRef.current.innerHTML);
        }
      }, 0);
    }
  }, [currentMathLatex, editingMathId, onChange, insertHtmlAtCursor, lastSelection]);

  /**
   * Handle math block editing
   */
  const editMathBlock = useCallback((mathId: string) => {
    const block = mathBlocks.find(b => b.id === mathId);
    if (block) {
      setCurrentMathLatex(block.latex);
      setEditingMathId(mathId);
      setShowMathInput(true);
    } else {
      // If block not found in state, try to get from DOM
      if (editorRef.current) {
        const mathElement = editorRef.current.querySelector(`[data-math-id="${mathId}"]`);
        if (mathElement) {
          const latex = decodeURIComponent(mathElement.getAttribute('data-latex') || '');
          setCurrentMathLatex(latex);
          setEditingMathId(mathId);
          setShowMathInput(true);
        }
      }
    }
  }, [mathBlocks]);

  /**
   * Delete math block
   */
  const deleteMathBlock = useCallback((mathId: string) => {
    if (editorRef.current) {
      const mathBlock = editorRef.current.querySelector(`[data-math-id="${mathId}"]`);
      if (mathBlock) {
        mathBlock.remove();
      }
    }
    
    setMathBlocks(prev => prev.filter(block => block.id !== mathId));
    
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  /**
   * Handle content changes
   */
  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  /**
   * Handle clicks on math blocks
   */
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const mathBlock = target.closest('.math-block') as HTMLElement;
    
    if (mathBlock && !disabled) {
      e.preventDefault();
      const mathId = mathBlock.getAttribute('data-math-id');
      if (mathId) {
        editMathBlock(mathId);
      }
    } else {
      // Save selection when clicking in editor
      setTimeout(saveSelection, 0);
    }
  }, [disabled, editMathBlock, saveSelection]);

  /**
   * Handle focus to save selection
   */
  const handleEditorFocus = useCallback(() => {
    setTimeout(saveSelection, 0);
  }, [saveSelection]);

  /**
   * Set initial content
   */
  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  /**
   * Enhanced math preview with KaTeX rendering
   */
  const renderMathPreview = useCallback((latex: string) => {
    if (!latex) return null;
    
    try {
      // Try to render with KaTeX
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      });
      
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-xs text-gray-600 mb-1">Xem trước:</div>
          <div 
            className="p-3 bg-white rounded border text-center"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      );
    } catch (error) {
      // Fallback to simple text display if KaTeX fails
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <div className="text-xs text-gray-600 mb-1">Xem trước (raw LaTeX):</div>
          <div 
            className="font-serif text-lg p-2 bg-white rounded border"
            style={{ 
              fontFamily: "'Times New Roman', serif",
              color: '#374151'
            }}
          >
            {latex}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Lỗi render: {error instanceof Error ? error.message : 'Không thể hiển thị công thức'}
          </div>
        </div>
      );
    }
  }, []);

  return (
    <div className={`rich-text-editor ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Toolbar */}
      {!disabled && (
        <div className="border border-gray-300 border-b-0 rounded-t-md bg-gray-50 p-2">
          <div className="flex flex-wrap gap-1">
            {/* Text formatting */}
            <button
              type="button"
              onClick={() => execCommand('bold')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Đậm"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => execCommand('italic')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Nghiêng"
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={() => execCommand('underline')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Gạch chân"
            >
              <Underline size={16} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Lists */}
            <button
              type="button"
              onClick={() => execCommand('insertUnorderedList')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Danh sách không thứ tự"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => execCommand('insertOrderedList')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Danh sách có thứ tự"
            >
              <ListOrdered size={16} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Alignment */}
            <button
              type="button"
              onClick={() => execCommand('justifyLeft')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Căn trái"
            >
              <AlignLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyCenter')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Căn giữa"
            >
              <AlignCenter size={16} />
            </button>
            <button
              type="button"
              onClick={() => execCommand('justifyRight')}
              className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200"
              title="Căn phải"
            >
              <AlignRight size={16} />
            </button>

            {allowMath && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>

                {/* Math insertion */}
                <button
                  type="button"
                  onClick={() => {
                    saveSelection();
                    setShowMathInput(true);
                  }}
                  className="p-2 rounded hover:bg-gray-200 focus:bg-gray-200 text-blue-600"
                  title="Chèn công thức toán học"
                >
                  <Calculator size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onClick={handleEditorClick}
        onFocus={handleEditorFocus}
        className={`border border-gray-300 ${disabled ? 'rounded-md' : 'rounded-b-md'} p-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
        } ${error ? 'border-red-300' : ''}`}
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'system-ui, sans-serif'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* Math Input Modal */}
      {showMathInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              {editingMathId ? 'Chỉnh sửa công thức' : 'Chèn công thức toán học'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Công thức LaTeX:
                </label>
                <input
                  type="text"
                  value={currentMathLatex}
                  onChange={(e) => setCurrentMathLatex(e.target.value)}
                  placeholder="Ví dụ: x^2 + y^2 = z^2"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              {/* Enhanced Preview */}
              {currentMathLatex && renderMathPreview(currentMathLatex)}

              {/* Common symbols */}
              <div className="border-t pt-3">
                <div className="text-xs text-gray-600 mb-2">Ký hiệu thường dùng:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { symbol: '^2', latex: '^2', title: 'Lũy thừa 2' },
                    { symbol: '√', latex: '\\sqrt{}', title: 'Căn bậc hai' },
                    { symbol: '∑', latex: '\\sum', title: 'Tổng' },
                    { symbol: '∫', latex: '\\int', title: 'Tích phân' },
                    { symbol: 'α', latex: '\\alpha', title: 'Alpha' },
                    { symbol: 'β', latex: '\\beta', title: 'Beta' },
                    { symbol: '≤', latex: '\\leq', title: 'Nhỏ hơn hoặc bằng' },
                    { symbol: '≥', latex: '\\geq', title: 'Lớn hơn hoặc bằng' },
                    { symbol: '∞', latex: '\\infty', title: 'Vô cực' },
                    { symbol: 'π', latex: '\\pi', title: 'Pi' },
                  ].map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentMathLatex(prev => prev + item.latex)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                      title={item.title}
                    >
                      {item.symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={insertMathBlock}
                disabled={!currentMathLatex.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                {editingMathId ? 'Cập nhật' : 'Chèn'}
              </button>
              {editingMathId && (
                <button
                  type="button"
                  onClick={() => deleteMathBlock(editingMathId)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  title="Xóa công thức"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowMathInput(false);
                  setCurrentMathLatex('');
                  setEditingMathId(null);
                  // Restore focus to editor
                  if (editorRef.current) {
                    editorRef.current.focus();
                    restoreSelection();
                  }
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-600 text-sm mt-1">
          {error}
        </div>
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500 mt-1">
        Hỗ trợ tiếng Việt và định dạng văn bản. 
        {allowMath && ' Nhấn nút máy tính để chèn công thức toán học.'}
      </div>
    </div>
  );
};

export default RichTextEditor; 