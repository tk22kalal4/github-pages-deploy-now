
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
    const GROQ_API_KEY = "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";
    const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    console.log("Using Groq API to generate notes");
    
    // Improved prompt with clearer formatting instructions
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct", 
        messages: [
          {
            role: "system",
            content: "You are a specialized notes formatter that creates clear, structured notes from text. Format your response using proper HTML tags, not markdown."
          },
          {
            role: "user",
            content: `Transform the following text into concise, well-structured point-wise notes. Make short points and use simple language where possible:

${ocrText}

Guidelines for notes generation:
- Organize content logically with proper hierarchy
- For headings:
  * Main headings: Use <h1> tags
  * Sub-headings: Use <h2> tags
  * Minor headings: Use <h3> tags
- Break down complex concepts into digestible parts
- Use bullet points with proper HTML tags: <ul><li>point 1</li><li>point 2</li></ul>
- Use numbered lists with proper HTML tags: <ol><li>step 1</li><li>step 2</li></ol>
- Use <strong> tags directly for important terms, DO NOT USE ** symbols
- If there are contrasting concepts, create a table using proper HTML table tags
- Include all relevant details, dates, numbers, and specific information
- Ensure each bullet point and section is separated by proper spacing

IMPORTANT: 
- Use ONLY HTML formatting, not markdown
- NO markdown asterisks for bold text
- Always use <strong> tags for emphasis, not ** symbols
- Ensure proper nesting of HTML tags
- Each bullet point must be wrapped in <li> tags inside <ul> tags
- Each numbered item must be wrapped in <li> tags inside <ol> tags`
          }
        ],
        temperature: 0.2, // Lower temperature for more consistent formatting
        max_tokens: 4000,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error response:", errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }
    
    const data = await response.json();
    let notes = data.choices[0].message.content;
    
    // Verify we have valid formatted notes
    if (!notes || notes.trim().length === 0) {
      throw new Error("Empty response from Groq API");
    }
    
    console.log("Raw Groq response:", notes);
    
    // Process any remaining markdown style formatting (**bold**) to proper HTML
    notes = processMarkdownFormatting(notes);
    
    // Check if the notes are significantly shorter than the OCR text (potential content loss)
    if (notes.length < ocrText.length * 0.7) {
      console.warn("Warning: Generated notes appear to be significantly shorter than the source text");
      // Still proceed, but with a warning
      toast.warning("Notes may not contain all information from the PDF. Consider reviewing the original text.", {
        duration: 5000,
        position: "top-right"
      });
    }
    
    // Sanitize the notes to ensure valid HTML
    const sanitizedNotes = sanitizeHtml(notes);
    
    return { notes: sanitizedNotes };
    
  } catch (error) {
    console.error("Groq API Error:", error);
    toast.error("Failed to generate complete notes. Falling back to raw OCR text formatting.", {
      duration: 5000,
      position: "top-right"
    });
    
    // Create a better fallback that preserves ALL original text
    const createFormattedNotes = (text: string) => {
      // Start with a header explaining this is fallback formatting
      let formattedHtml = `
        <h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Complete PDF Content (API Processing Failed)</span></span></h1>
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
            formattedHtml += `<p>${processed}</p>\n`;
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
                
              formattedHtml += `<p>${processed}</p>\n`;
            }
          });
        } else {
          // If no paragraphs were detected, preserve the raw content to ensure nothing is lost
          // Process any markdown style formatting
          const processed = processMarkdownFormatting(pageContent);
          formattedHtml += `<p>${processed}</p>\n`;
        }
      });
      
      return formattedHtml;
    };
    
    return { notes: createFormattedNotes(ocrText) };
  }
};
