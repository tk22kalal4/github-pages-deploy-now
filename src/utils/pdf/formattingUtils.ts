
/**
 * Process markdown-style formatting in text into HTML
 * Specifically handles ** for bold text, bullet points, and proper spacing
 */
export const processMarkdownFormatting = (text: string): string => {
  if (!text) return '';
  
  // Step 1: Convert **text** to <strong>text</strong>
  let processed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Step 2: Handle bullet points (* and - at start of lines)
  processed = processed.replace(/^\s*(\*|\-)\s+(.+)$/gm, '<li>$2</li>');
  
  // Step 3: Wrap consecutive list items in ul tags with proper spacing
  processed = processed.replace(/(<li>.*?<\/li>\n)+/g, (match) => {
    return '<ul>' + match + '</ul>';
  });
  
  // Step 4: Handle numbered lists (1., 2., etc.)
  processed = processed.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
  
  // Step 5: Wrap consecutive numbered list items in ol tags
  processed = processed.replace(/(<li>.*?<\/li>\n)+/g, (match) => {
    if (match.match(/^\s*\d+\.\s+/m)) { // Check if it's a numbered list
      return '<ol>' + match + '</ol>';
    }
    return match;
  });
  
  // Step 6: Handle headers with appropriate styling
  processed = processed.replace(/^#+\s+(.+)$/gm, (match, content) => {
    const level = match.trim().split(' ')[0].length;
    if (level === 1) {
      return `<h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">${content}</span></span></h1>`;
    } else if (level === 2) {
      return `<h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">${content}</span></span></h2>`;
    } else if (level === 3) {
      return `<h3><span style="text-decoration: underline;"><span style="color: rgb(52, 73, 94); text-decoration: underline;">${content}</span></span></h3>`;
    }
    return match;
  });
  
  return processed;
};

/**
 * Helper function to sanitize HTML and ensure it's valid for TinyMCE
 * with minimal formatting changes
 */
export const sanitizeHtml = (html: string): string => {
  // First process any markdown-style formatting
  let sanitized = processMarkdownFormatting(html);
  
  // Fix list elements that might not be properly nested
  sanitized = sanitized
    // Ensure lists are properly structured
    .replace(/<li>(.+?)<\/li>\s*(?!<\/ul>|<\/ol>|<li>)/g, '<li>$1</li></ul><ul>')
    .replace(/<ul>\s*<\/ul>/g, '') // Remove empty lists
    
    // Fix nested lists
    .replace(/<\/li><li>/g, '</li><li>')
    
    // Fix potential unclosed strong tags
    .replace(/<strong>([^<]*)<strong>/g, '<strong>$1</strong>')
    
    // Fix nested strong tags
    .replace(/<strong>([^<]*)<strong>([^<]*)<\/strong>([^<]*)<\/strong>/g, '<strong>$1$2$3</strong>')
    
    // Make sure headings have both opening and closing tags
    .replace(/<h([1-6])([^>]*)>([^<]*)/gi, (match, level, attrs, content) => {
      if (!content.trim()) return match;
      return `<h${level}${attrs}>${content}`;
    })
    
    // Clean up bullet points for consistent formatting
    .replace(/<ul>\s*<li>/g, '<ul><li>')
    .replace(/<\/li>\s*<\/ul>/g, '</li></ul>')
    
    // Clean up ordered lists for consistent formatting
    .replace(/<ol>\s*<li>/g, '<ol><li>')
    .replace(/<\/li>\s*<\/ol>/g, '</li></ol>')
    
    // Ensure headings are properly formatted according to the template
    .replace(/<h1>\s*([^<]+)\s*<\/h1>/g, '<h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">$1</span></span></h1>')
    .replace(/<h2>\s*([^<]+)\s*<\/h2>/g, '<h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">$1</span></span></h2>')
    .replace(/<h3>\s*([^<]+)\s*<\/h3>/g, '<h3><span style="text-decoration: underline;"><span style="color: rgb(52, 73, 94); text-decoration: underline;">$1</span></span></h3>')
    
    // Fix any double-decorated headings
    .replace(/<h([1-3])><span style="text-decoration: underline;"><span style="color: rgb\([^)]+\); text-decoration: underline;">(<span style="text-decoration: underline;"><span style="color: rgb\([^)]+\); text-decoration: underline;">[^<]+<\/span><\/span>)<\/span><\/span><\/h\1>/g, 
             '<h$1>$2</h$1>');

  return sanitized;
};
