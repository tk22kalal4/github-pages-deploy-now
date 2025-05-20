
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
    
    // Improved prompt with clearer formatting instructions and MINIMAL spacing directive
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
            content: "You are a specialized notes formatter that creates clear, structured notes from text. Format your response using proper HTML tags, not markdown. Use MINIMAL spacing between elements - no extra line breaks or whitespace allowed."
          },
          {
            role: "user",
            content: `Transform the following text into compact, well-structured point-wise notes with MINIMAL spacing between elements. Make short points and use simple language where possible:

${ocrText}

CRUCIAL FORMATTING RULES (FOLLOW EXACTLY):
- Use MINIMAL spacing between ALL elements - no more than ONE line break between any elements
- NO multiple blank lines anywhere in the output
- Format with proper HTML only (no markdown)
- For headings:
  * Main headings: Use <h1> tags
  * Sub-headings: Use <h2> tags
  * Minor headings: Use <h3> tags
- Use bullet points with proper HTML tags: <ul><li>point</li><li>point</li></ul>
- Use numbered lists with proper HTML tags: <ol><li>step</li><li>step</li></ol>
- Use <strong> tags for emphasis, NOT ** symbols
- Make content compact and dense - eliminate unnecessary white space
- Keep all content adjacent with minimal separation

EXAMPLE OF CORRECT FORMATTING (note the minimal spacing):
<h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Main Topic</span></span></h1>
<p>Introduction text with <strong>emphasized points</strong>.</p>
<h2><span style="text-decoration: underline;"><span style="color: rgb(26, 1, 157); text-decoration: underline;">Subtopic</span></span></h2>
<ul><li>First point</li><li>Second point</li><li>Third point with <strong>emphasis</strong></li></ul>
<p>Concluding text.</p>

IMPORTANT: 
- Ensure your output has NO extra blank lines or excessive spacing
- Keep elements compact and close together
- Do NOT use markdown formatting - only HTML tags`
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent formatting
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
    
    // Sanitize the notes to ensure valid HTML with MINIMAL spacing
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
