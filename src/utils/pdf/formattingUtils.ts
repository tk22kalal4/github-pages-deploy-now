
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
  
  // Step 3: Wrap consecutive list items in ul tags - with minimal spacing
  processed = processed.replace(/(<li>.*?<\/li>\n)+/g, (match) => {
    return '<ul>\n' + match + '</ul>\n';
  });
  
  // Step 4: Handle numbered lists (1., 2., etc.) - with minimal spacing
  processed = processed.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
  
  // Step 5: Wrap consecutive numbered list items in ol tags - with minimal spacing
  processed = processed.replace(/(<li>.*?<\/li>\n)+/g, (match) => {
    if (match.match(/^\s*\d+\.\s+/m)) { // Check if it's a numbered list
      return '<ol>\n' + match + '</ol>\n';
    }
    return match;
  });
  
  // Step 6: Handle headers with appropriate styling and MINIMAL spacing
  processed = processed.replace(/^#+\s+(.+)$/gm, (match, content) => {
    const level = match.trim().split(' ')[0].length;
    if (level === 1) {
      return `<h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">${content}</span></span></h1>\n`;
    } else if (level === 2) {
      return `<h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">${content}</span></span></h2>\n`;
    } else if (level === 3) {
      return `<h3><span style="text-decoration: underline;"><span style="color: rgb(52, 73, 94); text-decoration: underline;">${content}</span></span></h3>\n`;
    }
    return match;
  });
  
  // Step 7: DRASTICALLY reduce spacing - limit to single newlines maximum
  processed = processed.replace(/\n{2,}/g, '\n'); // Replace multiple newlines with single
  processed = processed.replace(/([^\n])\n([^\n])/g, '$1<br />$2'); // Single newlines become <br>
  
  return processed;
};

/**
 * Helper function to sanitize HTML and ensure it's valid for TinyMCE
 * with MINIMAL spacing between elements
 */
export const sanitizeHtml = (html: string): string => {
  // First process any markdown-style formatting
  let sanitized = processMarkdownFormatting(html);
  
  // Fix list elements that might not be properly nested - with MINIMAL spacing
  sanitized = sanitized
    // Ensure lists are properly structured with MINIMAL spacing
    .replace(/<li>(.+?)<\/li>\s*(?!<\/ul>|<\/ol>|<li>)/g, '<li>$1</li>\n</ul>\n<ul>\n')
    .replace(/<ul>\s*<\/ul>/g, '') // Remove empty lists
    
    // Ensure proper line breaks after closing tags with MINIMAL spacing
    .replace(/<\/(h[1-3])>/g, '</$1>\n')
    .replace(/<\/(ul|ol)>/g, '</$1>\n')
    
    // IMPORTANT: Fix excessive spacing issues by limiting consecutive line breaks
    .replace(/>\s+</g, '>\n<') // Limit to single newline between tags
    .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
    
    // Fix nested lists with proper spacing (minimal)
    .replace(/<\/li><li>/g, '</li>\n<li>')
    
    // Fix potential unclosed strong tags
    .replace(/<strong>([^<]*)<strong>/g, '<strong>$1</strong>')
    
    // Fix nested strong tags
    .replace(/<strong>([^<]*)<strong>([^<]*)<\/strong>([^<]*)<\/strong>/g, '<strong>$1$2$3</strong>')
    
    // Make sure headings have both opening and closing tags
    .replace(/<h([1-6])([^>]*)>([^<]*)/gi, (match, level, attrs, content) => {
      if (!content.trim()) return match;
      return `<h${level}${attrs}>${content}`;
    })
    
    // DRASTICALLY reduce whitespace - eliminate excessive spacing
    .replace(/\n{2,}/g, '\n') // Limit to single newlines
    .replace(/ +/g, ' ') // Remove multiple spaces
    
    // Ensure each paragraph has MINIMAL spacing
    .replace(/<p>/g, '<p>')
    .replace(/<\/p>/g, '</p>\n')
    
    // Clean up bullet points for consistent formatting with MINIMAL spacing
    .replace(/<ul>\s*<li>/g, '<ul>\n<li>')
    .replace(/<\/li>\s*<\/ul>/g, '</li>\n</ul>\n')
    
    // Clean up ordered lists for consistent formatting with MINIMAL spacing
    .replace(/<ol>\s*<li>/g, '<ol>\n<li>')
    .replace(/<\/li>\s*<\/ol>/g, '</li>\n</ol>\n')
    
    // Ensure headings are properly formatted according to the template
    .replace(/<h1>\s*([^<]+)\s*<\/h1>/g, '<h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">$1</span></span></h1>')
    .replace(/<h2>\s*([^<]+)\s*<\/h2>/g, '<h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">$1</span></span></h2>')
    .replace(/<h3>\s*([^<]+)\s*<\/h3>/g, '<h3><span style="text-decoration: underline;"><span style="color: rgb(52, 73, 94); text-decoration: underline;">$1</span></span></h3>')
    
    // Fix any double-decorated headings
    .replace(/<h([1-3])><span style="text-decoration: underline;"><span style="color: rgb\([^)]+\); text-decoration: underline;">(<span style="text-decoration: underline;"><span style="color: rgb\([^)]+\); text-decoration: underline;">[^<]+<\/span><\/span>)<\/span><\/span><\/h\1>/g, 
             '<h$1>$2</h$1>')
             
    // CRITICAL FIX: Drastically reduce spacing between all elements
    .replace(/(<\/h[1-3]>)\n+/g, '$1\n')
    .replace(/(<\/ul>|<\/ol>)\n+/g, '$1\n')
    .replace(/(<ul>|<ol>)\n+/g, '$1\n')
    .replace(/<\/li>\n+<li>/g, '</li>\n<li>')
    .replace(/\n{2,}/g, '\n')
    // Remove excessive line breaks before closing tags
    .replace(/\n+(<\/[^>]+>)/g, '$1')
    // Remove excessive line breaks after opening tags
    .replace(/(<[^\/][^>]*>)\n+/g, '$1');

  return sanitized;
};
