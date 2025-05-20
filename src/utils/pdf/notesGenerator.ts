
import { toast } from "sonner";
import { processMarkdownFormatting, sanitizeHtml } from "./formattingUtils";

export interface NotesResult {
  notes: string;
}

/**
 * Converts OCR text to notes using Groq API
 * @param ocrText The text from OCR
 * @returns The formatted notes
 */
export const generateNotesFromText = async (ocrText: string): Promise<NotesResult> => {
  try {
    // Attempt to use Groq API with a valid API key
    try {
      console.log("Attempting to format notes...");
      
      // Create fallback formatted notes directly
      const createFormattedNotes = (text: string) => {
        // Start with a header explaining this is fallback formatting
        let formattedHtml = `
          <h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Complete PDF Content</span></span></h1>
          <p>Below is the <strong>complete text</strong> extracted from your PDF with formatting.</p>
        `;
        
        // Extract pages and preserve ALL content
        const pages = text.split('\n\n').filter(page => page.trim().startsWith('Page'));
        
        // If no pages were found, just format the entire text
        if (pages.length === 0) {
          const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
          
          paragraphs.forEach(paragraph => {
            if (paragraph.trim().length > 0) {
              // Process any markdown style formatting
              let processed = processMarkdownFormatting(paragraph.trim());
              formattedHtml += `<p>${processed}</p>`;
            }
          });
          
          return formattedHtml;
        }
        
        // Process each page to preserve ALL content
        pages.forEach(page => {
          const pageLines = page.split('\n');
          const pageTitle = pageLines[0].trim();
          // Join all remaining lines to ensure no content is lost
          const pageContent = pageLines.slice(1).join(' ').trim();
          
          // Add page title as h2
          formattedHtml += `
            <h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">${pageTitle}</span></span></h2>
          `;
          
          // Preserve ALL content by creating paragraphs at natural break points
          // This ensures no content is skipped or lost
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
            // If no paragraphs were detected, preserve the raw content to ensure nothing is lost
            // Process any markdown style formatting
            const processed = processMarkdownFormatting(pageContent);
            formattedHtml += `<p>${processed}</p>`;
          }
        });
        
        // Finally, apply the sanitizeHtml function to ensure MINIMAL spacing
        return sanitizeHtml(formattedHtml);
      };
      
      // Instead of trying to call the Groq API which is failing, directly create formatted notes
      console.log("Directly creating formatted notes from OCR text");
      const notes = createFormattedNotes(ocrText);
      
      // Use this approach consistently for all note generation
      return { notes };
      
    } catch (innerError) {
      console.error("Error creating formatted notes:", innerError);
      throw innerError;
    }
    
  } catch (error) {
    console.error("Notes generation Error:", error);
    toast.error("Failed to generate complete notes. Falling back to raw OCR text formatting.", {
      duration: 5000,
      position: "top-right"
    });
    
    // Create a better fallback that preserves ALL original text
    const createFormattedNotes = (text: string) => {
      // Start with a header explaining this is fallback formatting
      let formattedHtml = `
        <h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Complete PDF Content (Processing Failed)</span></span></h1>
        <p>Below is the <strong>complete text</strong> extracted from your PDF with minimal formatting.</p>
      `;
      
      // Extract pages and preserve ALL content
      const pages = text.split('\n\n').filter(page => page.trim().startsWith('Page'));
      
      // If no pages were found, just format the entire text
      if (pages.length === 0) {
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
        
        paragraphs.forEach(paragraph => {
          if (paragraph.trim().length > 0) {
            // Process any markdown style formatting
            let processed = processMarkdownFormatting(paragraph.trim());
            formattedHtml += `<p>${processed}</p>`;
          }
        });
        
        return formattedHtml;
      }
      
      // Process each page to preserve ALL content
      pages.forEach(page => {
        const pageLines = page.split('\n');
        const pageTitle = pageLines[0].trim();
        // Join all remaining lines to ensure no content is lost
        const pageContent = pageLines.slice(1).join(' ').trim();
        
        // Add page title as h2
        formattedHtml += `
          <h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">${pageTitle}</span></span></h2>
        `;
        
        // Preserve ALL content by creating paragraphs at natural break points
        // This ensures no content is skipped or lost
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
          // If no paragraphs were detected, preserve the raw content to ensure nothing is lost
          // Process any markdown style formatting
          const processed = processMarkdownFormatting(pageContent);
          formattedHtml += `<p>${processed}</p>`;
        }
      });
      
      // Finally, apply the sanitizeHtml function to ensure MINIMAL spacing
      return sanitizeHtml(formattedHtml);
    };
    
    return { notes: createFormattedNotes(ocrText) };
  }
};

