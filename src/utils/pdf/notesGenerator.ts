
import { toast } from "sonner";
import { processMarkdownFormatting, sanitizeHtml } from "./formattingUtils";

export interface NotesResult {
  notes: string;
}

/**
 * Converts OCR text to notes using direct formatting
 * @param ocrText The text from OCR
 * @returns The formatted notes
 */
export const generateNotesFromText = async (ocrText: string): Promise<NotesResult> => {
  try {
    console.log("Formatting notes from OCR text...");
    
    // Create formatted notes directly
    const createFormattedNotes = (text: string) => {
      // Start with a header
      let formattedHtml = `
        <h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Complete PDF Content</span></span></h1>
        <p>Below is the <strong>complete text</strong> extracted from your PDF with formatting.</p>
      `;
      
      // Extract pages
      const pages = text.split('\n\n').filter(page => page.trim().startsWith('Page'));
      
      // If no pages were found, just format the entire text
      if (pages.length === 0) {
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        
        paragraphs.forEach(paragraph => {
          if (paragraph.trim().length > 0) {
            formattedHtml += `<p>${paragraph.trim()}</p>`;
          }
        });
        
        return sanitizeHtml(formattedHtml);
      }
      
      // Process each page
      pages.forEach(page => {
        const pageLines = page.split('\n');
        const pageTitle = pageLines[0].trim();
        const pageContent = pageLines.slice(1).join(' ').trim();
        
        // Add page title as h2
        formattedHtml += `
          <h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">${pageTitle}</span></span></h2>
        `;
        
        // Preserve content by creating paragraphs at natural break points
        const paragraphs = pageContent.split(/(?:\.|\?|\!)(?:\s+|\n)/g)
          .filter(p => p.trim().length > 0)
          .map(p => p.trim() + '.');
        
        if (paragraphs.length > 0) {
          paragraphs.forEach(paragraph => {
            if (paragraph.trim().length > 0) {
              // Process any markdown style formatting
              let processed = processMarkdownFormatting(paragraph.trim());
              
              // Highlight potential key terms
              processed = processed
                .replace(/\b([A-Z][a-z]{2,}|[A-Z]{2,})\b/g, '<strong>$1</strong>')
                .trim();
                
              formattedHtml += `<p>${processed}</p>`;
            }
          });
        } else {
          // If no paragraphs were detected, preserve the raw content
          const processed = processMarkdownFormatting(pageContent);
          formattedHtml += `<p>${processed}</p>`;
        }
      });
      
      return sanitizeHtml(formattedHtml);
    };
    
    // Create formatted notes
    const notes = createFormattedNotes(ocrText);
    console.log("Notes generation complete");
    
    return { notes };
    
  } catch (error) {
    console.error("Notes generation Error:", error);
    toast.error("Failed to generate complete notes. Falling back to raw OCR text formatting.", {
      duration: 5000,
      position: "top-right"
    });
    
    // Create a better fallback
    const createFormattedNotes = (text: string) => {
      // Start with a header explaining this is fallback formatting
      let formattedHtml = `
        <h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Complete PDF Content (Processing Failed)</span></span></h1>
        <p>Below is the <strong>complete text</strong> extracted from your PDF with minimal formatting.</p>
        <div>${text.split('\n').map(line => `<p>${line}</p>`).join('')}</div>
      `;
      
      return formattedHtml;
    };
    
    return { notes: createFormattedNotes(ocrText) };
  }
};
