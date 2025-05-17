
/**
 * Process markdown-style formatting in text into HTML
 * Specifically handles ** for bold text
 */
export const processMarkdownFormatting = (text: string): string => {
  if (!text) return '';
  
  // Convert **text** to <strong>text</strong> with word boundary check
  let processed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Handle potential case where ** characters are at the beginning/end of lines
  processed = processed.replace(/^\*\*\s*|\s*\*\*$/gm, '');
  
  // Ensures we're not missing asterisks that should be <strong> tags
  processed = processed.replace(/\b\*\*([^*]+)\*\*\b/g, '<strong>$1</strong>');
  
  return processed;
};

/**
 * Helper function to sanitize HTML and ensure it's valid for TinyMCE
 */
export const sanitizeHtml = (html: string): string => {
  // Process markdown-style formatting first (** to <strong>)
  let sanitized = processMarkdownFormatting(html);
  
  // Apply formatting similar to the provided template logic
  sanitized = sanitized
    // Ensure proper line breaks after closing tags for better readability
    .replace(/<\/(h[1-3])>/g, '</$1>\n\n')
    .replace(/<\/(ul|ol)>/g, '</$1>\n')
    
    // Fix spacing issues and ensure proper paragraph breaks
    .replace(/>\s+</g, '>\n<')
    
    // Fix nested lists by ensuring proper closing tags
    .replace(/<\/li><li>/g, '</li>\n<li>')
    .replace(/<\/li><\/ul>/g, '</li>\n</ul>')
    .replace(/<\/li><\/ol>/g, '</li>\n</ol>')
    
    // Fix potential unclosed strong tags
    .replace(/<strong>([^<]*)<strong>/g, '<strong>$1</strong>')
    
    // Fix nested strong tags
    .replace(/<strong>([^<]*)<strong>([^<]*)<\/strong>([^<]*)<\/strong>/g, '<strong>$1$2$3</strong>')
    
    // Make sure headings have both opening and closing tags
    .replace(/<h([1-6])([^>]*)>([^<]*)/gi, (match, level, attrs, content) => {
      if (!content.trim()) return match;
      return `<h${level}${attrs}>${content}`;
    })
    
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ +/g, ' ')
    
    // Ensure each paragraph has proper spacing
    .replace(/<p>/g, '\n<p>')
    .replace(/<\/p>/g, '</p>\n')
    
    // Clean up bullet points for consistent formatting
    .replace(/<ul><li>/g, '\n<ul>\n<li>')
    .replace(/<\/li><\/ul>/g, '</li>\n</ul>\n')
    
    // Clean up ordered lists for consistent formatting
    .replace(/<ol><li>/g, '\n<ol>\n<li>')
    .replace(/<\/li><\/ol>/g, '</li>\n</ol>\n')
    
    // Ensure headings are properly formatted according to the template
    .replace(/<h1>([^<]+)<\/h1>/g, '<h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">$1</span></span></h1>')
    .replace(/<h2>([^<]+)<\/h2>/g, '<h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">$1</span></span></h2>')
    .replace(/<h3>([^<]+)<\/h3>/g, '<h3><span style="text-decoration: underline;"><span style="color: rgb(52, 73, 94); text-decoration: underline;">$1</span></span></h3>')
    
    // Fix any double-decorated headings
    .replace(/<h([1-3])><span style="text-decoration: underline;"><span style="color: rgb\([^)]+\); text-decoration: underline;">(<span style="text-decoration: underline;"><span style="color: rgb\([^)]+\); text-decoration: underline;">[^<]+<\/span><\/span>)<\/span><\/span><\/h\1>/g, 
             '<h$1>$2</h$1>');

  return sanitized;
};
