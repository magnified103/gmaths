import React from 'react';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

/**
 * RichTextDisplay - Displays rich text content with proper math rendering
 * Handles HTML content with embedded math blocks from RichTextEditor
 */
export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  content,
  className = ''
}) => {
  /**
   * Process HTML content to render math blocks properly
   */
  const processContent = (htmlContent: string): string => {
    if (!htmlContent) return '';

    // Replace math blocks with proper LaTeX rendering
    // This looks for our math block spans and processes them
    return htmlContent.replace(
      /<span[^>]*class="math-block"[^>]*data-latex="([^"]*)"[^>]*>([^<]*)<\/span>/g,
      (_match, encodedLatex, displayText) => {
        try {
          const latex = decodeURIComponent(encodedLatex);
          // For now, we'll display the LaTeX as text with some styling
          // In the future, this could be enhanced with KaTeX or MathJax rendering
          return `<span class="inline-math" style="font-family: 'Times New Roman', serif; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; padding: 2px 6px; margin: 0 2px; color: #374151;">${latex}</span>`;
        } catch {
          return displayText; // Fallback to display text if decoding fails
        }
      }
    );
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