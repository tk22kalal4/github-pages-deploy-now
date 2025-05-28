
/**
 * Process markdown-style formatting in text into HTML
 * Specifically handles ** for bold text, bullet points, and proper spacing
 */
export const processMarkdownFormatting = (text: string): string => {
  if (!text) return '';
  
  // Step 1: Convert **text** to <strong>text</strong>
  let processed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Step 2: Handle multi-level bullet points (*, -, •) with proper indentation
  processed = processed.replace(/^(\s*)(\*|\-|•)\s+(.+)$/gm, (match, indent, bullet, content) => {
    const level = Math.floor(indent.length / 2) + 1; // Calculate nesting level
    const marginLeft = (level - 1) * 15; // Reduced indentation for nested lists
    return `<li style="margin-left: ${marginLeft}px; list-style-type: disc; margin-bottom: 4px;">${content.trim()}</li>`;
  });
  
  // Step 3: Handle numbered lists (1., 2., etc.) with proper indentation
  processed = processed.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (match, indent, number, content) => {
    const level = Math.floor(indent.length / 2) + 1;
    const marginLeft = (level - 1) * 15; // Reduced indentation
    return `<li style="margin-left: ${marginLeft}px; list-style-type: decimal; margin-bottom: 4px;">${content.trim()}</li>`;
  });
  
  // Step 4: Wrap consecutive list items in proper ul/ol tags
  processed = processed.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
    // Check if it's a numbered list by looking for decimal list-style-type
    if (match.includes('list-style-type: decimal')) {
      return `<ol style="padding-left: 15px; margin-bottom: 8px; margin-top: 4px;">${match}</ol>`;
    } else {
      return `<ul style="padding-left: 15px; margin-bottom: 8px; margin-top: 4px;">${match}</ul>`;
    }
  });
  
  // Step 5: Handle headers with appropriate styling and reduced spacing
  processed = processed.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    if (level === 1) {
      return `<h1 style="margin-top: 16px; margin-bottom: 8px;"><span style="text-decoration: underline; color: rgb(71, 0, 0);">${content}</span></h1>`;
    } else if (level === 2) {
      return `<h2 style="margin-top: 14px; margin-bottom: 6px;"><span style="text-decoration: underline; color: rgb(26, 1, 157);">${content}</span></h2>`;
    } else if (level === 3) {
      return `<h3 style="margin-top: 12px; margin-bottom: 6px;"><span style="text-decoration: underline; color: rgb(52, 73, 94);">${content}</span></h3>`;
    } else if (level === 4) {
      return `<h4 style="margin-top: 10px; margin-bottom: 4px;"><span style="text-decoration: underline; color: rgb(85, 85, 85);">${content}</span></h4>`;
    } else if (level === 5) {
      return `<h5 style="margin-top: 8px; margin-bottom: 4px;"><span style="text-decoration: underline; color: rgb(119, 119, 119);">${content}</span></h5>`;
    } else {
      return `<h6 style="margin-top: 6px; margin-bottom: 4px;"><span style="text-decoration: underline; color: rgb(153, 153, 153);">${content}</span></h6>`;
    }
  });
  
  // Step 6: Handle line breaks and paragraphs with reduced spacing
  processed = processed.replace(/\n\n+/g, '</p><p style="margin-bottom: 6px;">');
  processed = processed.replace(/\n/g, '<br>');
  
  return processed;
};

/**
 * Helper function to sanitize HTML and ensure it's valid for TinyMCE
 * with proper formatting preservation and reduced spacing
 */
export const sanitizeHtml = (html: string): string => {
  // First process any markdown-style formatting
  let sanitized = html;
  
  // Fix nested list elements and ensure proper structure
  sanitized = sanitized
    // Clean up any malformed list structures
    .replace(/<\/ul><ul[^>]*>/g, '')
    .replace(/<\/ol><ol[^>]*>/g, '')
    
    // Ensure proper paragraph structure with reduced spacing
    .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
    .replace(/<p>(<ul|<ol|<h[1-6])/g, '$1') // Remove p tags before lists and headers
    .replace(/(<\/ul>|<\/ol>|<\/h[1-6]>)<\/p>/g, '$1') // Remove p tags after lists and headers
    
    // Fix list item spacing
    .replace(/<li([^>]*)>\s*<br>\s*/g, '<li$1>')
    .replace(/\s*<br>\s*<\/li>/g, '</li>')
    
    // Ensure headers are properly closed
    .replace(/<h([1-6])([^>]*)>([^<]*?)(?=<h|<p|<ul|<ol|$)/gi, '<h$1$2>$3</h$1>')
    
    // Fix strong tags
    .replace(/<strong>([^<]*?)<strong>/g, '<strong>$1</strong>')
    .replace(/<\/strong>([^<]*?)<\/strong>/g, '</strong>$1</strong>')
    
    // Clean up spacing around elements
    .replace(/\s+<\/li>/g, '</li>')
    .replace(/<li[^>]*>\s+/g, match => match.replace(/\s+$/, ''))
    
    // Ensure proper paragraph wrapping for non-list, non-header content with reduced margins
    .replace(/^(?!<[huo]|<li)([^<\n].+?)$/gm, '<p style="margin-bottom: 6px;">$1</p>')
    
    // Clean up any double paragraph tags
    .replace(/<p[^>]*><p[^>]*>/g, '<p style="margin-bottom: 6px;">')
    .replace(/<\/p><\/p>/g, '</p>')
    
    // Reduce excessive spacing between elements
    .replace(/margin-bottom:\s*12px/g, 'margin-bottom: 6px')
    .replace(/margin-bottom:\s*16px/g, 'margin-bottom: 8px')
    .replace(/margin-bottom:\s*20px/g, 'margin-bottom: 10px')
    .replace(/margin-top:\s*24px/g, 'margin-top: 16px')
    .replace(/margin-top:\s*20px/g, 'margin-top: 14px');

  return sanitized;
};
