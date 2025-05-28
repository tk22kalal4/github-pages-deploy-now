
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
    const marginLeft = (level - 1) * 20; // Indentation for nested lists
    return `<li style="margin-left: ${marginLeft}px; list-style-type: disc;">${content.trim()}</li>`;
  });
  
  // Step 3: Handle numbered lists (1., 2., etc.) with proper indentation
  processed = processed.replace(/^(\s*)(\d+)\.\s+(.+)$/gm, (match, indent, number, content) => {
    const level = Math.floor(indent.length / 2) + 1;
    const marginLeft = (level - 1) * 20;
    return `<li style="margin-left: ${marginLeft}px; list-style-type: decimal;">${content.trim()}</li>`;
  });
  
  // Step 4: Wrap consecutive list items in proper ul/ol tags
  processed = processed.replace(/(<li[^>]*>.*?<\/li>\s*)+/g, (match) => {
    // Check if it's a numbered list by looking for decimal list-style-type
    if (match.includes('list-style-type: decimal')) {
      return `<ol style="padding-left: 20px; margin-bottom: 12px;">${match}</ol>`;
    } else {
      return `<ul style="padding-left: 20px; margin-bottom: 12px;">${match}</ul>`;
    }
  });
  
  // Step 5: Handle headers with appropriate styling
  processed = processed.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    if (level === 1) {
      return `<h1><span style="text-decoration: underline; color: rgb(71, 0, 0);">${content}</span></h1>`;
    } else if (level === 2) {
      return `<h2><span style="text-decoration: underline; color: rgb(26, 1, 157);">${content}</span></h2>`;
    } else if (level === 3) {
      return `<h3><span style="text-decoration: underline; color: rgb(52, 73, 94);">${content}</span></h3>`;
    } else if (level === 4) {
      return `<h4><span style="text-decoration: underline; color: rgb(85, 85, 85);">${content}</span></h4>`;
    } else if (level === 5) {
      return `<h5><span style="text-decoration: underline; color: rgb(119, 119, 119);">${content}</span></h5>`;
    } else {
      return `<h6><span style="text-decoration: underline; color: rgb(153, 153, 153);">${content}</span></h6>`;
    }
  });
  
  // Step 6: Handle line breaks and paragraphs
  processed = processed.replace(/\n\n+/g, '</p><p>');
  processed = processed.replace(/\n/g, '<br>');
  
  return processed;
};

/**
 * Helper function to sanitize HTML and ensure it's valid for TinyMCE
 * with proper formatting preservation
 */
export const sanitizeHtml = (html: string): string => {
  // First process any markdown-style formatting
  let sanitized = html;
  
  // Fix nested list elements and ensure proper structure
  sanitized = sanitized
    // Clean up any malformed list structures
    .replace(/<\/ul><ul[^>]*>/g, '')
    .replace(/<\/ol><ol[^>]*>/g, '')
    
    // Ensure proper paragraph structure
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
    
    // Ensure proper paragraph wrapping for non-list, non-header content
    .replace(/^(?!<[huo]|<li)([^<\n].+?)$/gm, '<p>$1</p>')
    
    // Clean up any double paragraph tags
    .replace(/<p><p>/g, '<p>')
    .replace(/<\/p><\/p>/g, '</p>');

  return sanitized;
};
