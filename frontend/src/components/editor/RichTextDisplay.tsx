import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

/**
 * RichTextDisplay - Displays rich text content with proper LaTeX rendering using KaTeX
 * Handles HTML content with embedded math expressions and renders them as formatted mathematics
 */
export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  content,
  className = ''
}) => {
  /**
   * Process content to render LaTeX expressions using KaTeX
   */
  const processContent = (htmlContent: string): string => {
    if (!htmlContent) return '';

    let processedContent = htmlContent;

    // First, handle math blocks from the RichTextEditor (with data-latex attribute)
    processedContent = processedContent.replace(
      /<span[^>]*class="math-block"[^>]*data-latex="([^"]*)"[^>]*>([^<]*)<\/span>/g,
      (_match, encodedLatex, _displayText) => {
        try {
          const latex = decodeURIComponent(encodedLatex);
          const renderedMath = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
            output: 'html'
          });
          return `<span class="katex-rendered">${renderedMath}</span>`;
        } catch (error) {
          console.warn('KaTeX rendering failed for math block:', error);
          return `<span class="latex-fallback" style="font-family: 'Times New Roman', serif; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 6px; margin: 0 2px; color: #374151;">${decodeURIComponent(encodedLatex)}</span>`;
        }
      }
    );

    // Then, handle inline LaTeX expressions ($$...$$, $...$)
    // Handle display math first ($$...$$)
    processedContent = processedContent.replace(
      /\$\$([^$]+)\$\$/g,
      (_match, latex) => {
        try {
          const renderedMath = katex.renderToString(latex.trim(), {
            throwOnError: false,
            displayMode: true,
            output: 'html'
          });
          return `<div class="katex-display">${renderedMath}</div>`;
        } catch (error) {
          console.warn('KaTeX rendering failed for display math:', error);
          return `<div class="latex-fallback display-math" style="text-align: center; margin: 8px 0; font-family: 'Times New Roman', serif; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; color: #374151;">$$${latex}$$</div>`;
        }
      }
    );

    // Handle inline math ($...$) - avoid matching already processed display math
    processedContent = processedContent.replace(
      /(?<!\$)\$([^$\n]+)\$(?!\$)/g,
      (_match, latex) => {
        try {
          const renderedMath = katex.renderToString(latex.trim(), {
            throwOnError: false,
            displayMode: false,
            output: 'html'
          });
          return `<span class="katex-inline">${renderedMath}</span>`;
        } catch (error) {
          console.warn('KaTeX rendering failed for inline math:', error);
          return `<span class="latex-fallback inline-math" style="font-family: 'Times New Roman', serif; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 6px; margin: 0 2px; color: #374151;">$${latex}$</span>`;
        }
      }
    );

    // Handle LaTeX expressions in \(...\) format (inline)
    processedContent = processedContent.replace(
      /\\[(]([^)]+)\\[)]/g,
      (_match, latex) => {
        try {
          const renderedMath = katex.renderToString(latex.trim(), {
            throwOnError: false,
            displayMode: false,
            output: 'html'
          });
          return `<span class="katex-inline">${renderedMath}</span>`;
        } catch (error) {
          console.warn('KaTeX rendering failed for inline math:', error);
          return `<span class="latex-fallback inline-math" style="font-family: 'Times New Roman', serif; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 6px; margin: 0 2px; color: #374151;">\\(${latex}\\)</span>`;
        }
      }
    );

    // Handle LaTeX expressions in \[...\] format (display)
    processedContent = processedContent.replace(
      /\\[([]([^)]+)\\[\]]/g,
      (_match, latex) => {
        try {
          const renderedMath = katex.renderToString(latex.trim(), {
            throwOnError: false,
            displayMode: true,
            output: 'html'
          });
          return `<div class="katex-display">${renderedMath}</div>`;
        } catch (error) {
          console.warn('KaTeX rendering failed for display math:', error);
          return `<div class="latex-fallback display-math" style="text-align: center; margin: 8px 0; font-family: 'Times New Roman', serif; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; color: #374151;">\\[${latex}\\]</div>`;
        }
      }
    );

    return processedContent;
  };

  const processedContent = processContent(content);

  return (
    <div 
      className={`rich-text-display prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
      style={{
        fontSize: '14px',
        lineHeight: '1.5',
        fontFamily: 'system-ui, sans-serif'
      }}
    />
  );
};

export default RichTextDisplay; 