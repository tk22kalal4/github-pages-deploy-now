
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
  const GROQ_API_KEY = "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";
  
  try {
    console.log("Generating notes using Groq API...");
    
    // Call Groq API to generate comprehensive notes
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are an expert note-taking assistant. Convert the provided OCR text into comprehensive, well-formatted notes. 

FORMATTING REQUIREMENTS:
- Use proper HTML formatting with headings, lists, and paragraphs
- Create clear sections with descriptive headings
- Use bullet points and numbered lists where appropriate
- Highlight important terms with **bold** formatting
- Organize content logically by topics
- Preserve all important information from the original text
- Add clear section breaks between different topics

OUTPUT FORMAT:
- Start with a main heading
- Use h2 for major sections, h3 for subsections
- Use bullet points for lists and key points
- Bold important terms and concepts
- Create well-structured paragraphs

Make the notes comprehensive and easy to read while preserving all the original information.`
          },
          {
            role: 'user',
            content: `Please convert this OCR text into comprehensive, well-formatted notes:\n\n${ocrText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedNotes = data.choices[0]?.message?.content || "Failed to generate notes.";
    
    // Process the generated notes with proper formatting
    const processedNotes = processMarkdownFormatting(generatedNotes);
    const finalNotes = sanitizeHtml(processedNotes);
    
    console.log("Notes generation complete using Groq API");
    
    return { notes: finalNotes };
    
  } catch (error) {
    console.error("Groq API Notes generation Error:", error);
    toast.error("Failed to generate notes using Groq API. Falling back to formatted OCR text.", {
      duration: 5000,
      position: "top-right"
    });
    
    // Create a better fallback with basic formatting
    const createFormattedFallback = (text: string) => {
      let formattedHtml = `
        <h1><span style="text-decoration: underline; color: rgb(71, 0, 0);">Complete PDF Content (Formatted OCR)</span></h1>
        <p>Below is the <strong>complete text</strong> extracted from your PDF with basic formatting.</p>
      `;
      
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          if (trimmedLine.startsWith('Page ')) {
            formattedHtml += `<h2><span style="text-decoration: underline; color: rgb(26, 1, 157);">${trimmedLine}</span></h2>`;
          } else if (trimmedLine.length > 50 && trimmedLine.toUpperCase() === trimmedLine) {
            // Likely a header
            formattedHtml += `<h3><span style="text-decoration: underline; color: rgb(52, 73, 94);">${trimmedLine}</span></h3>`;
          } else if (/^[\s]*[\*\-\•]\s+/.test(trimmedLine)) {
            // Bullet point
            const processed = processMarkdownFormatting(trimmedLine);
            formattedHtml += `<ul><li>${processed.replace(/^[\s]*[\*\-\•]\s+/, '')}</li></ul>`;
          } else if (/^[\s]*\d+\.\s+/.test(trimmedLine)) {
            // Numbered list
            const processed = processMarkdownFormatting(trimmedLine);
            formattedHtml += `<ol><li>${processed.replace(/^[\s]*\d+\.\s+/, '')}</li></ol>`;
          } else {
            const processed = processMarkdownFormatting(trimmedLine);
            formattedHtml += `<p>${processed}</p>`;
          }
        }
      }
      
      return sanitizeHtml(formattedHtml);
    };
    
    return { notes: createFormattedFallback(ocrText) };
  }
};
