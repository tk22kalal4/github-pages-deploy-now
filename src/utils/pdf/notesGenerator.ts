
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
        <h1><span style="text-decoration: underline; color: rgb(71, 0, 0);">Complete PDF Content</span></h1>
        <p>Below is the <strong>complete text</strong> extracted from your PDF with proper formatting.</p>
      `;
      
      // Split text into logical sections
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      let currentSection = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Detect page headers
        if (line.startsWith('Page ') && /Page\s+\d+/.test(line)) {
          // Process previous section if exists
          if (currentSection.trim()) {
            formattedHtml += formatSection(currentSection);
            currentSection = '';
          }
          
          // Add page header
          formattedHtml += `<h2><span style="text-decoration: underline; color: rgb(26, 1, 157);">${line}</span></h2>`;
          continue;
        }
        
        // Add line to current section
        currentSection += line + '\n';
        
        // Process section if we hit a natural break (empty line ahead or end of text)
        if (i === lines.length - 1 || !lines[i + 1]?.trim()) {
          if (currentSection.trim()) {
            formattedHtml += formatSection(currentSection);
            currentSection = '';
          }
        }
      }
      
      // Process any remaining section
      if (currentSection.trim()) {
        formattedHtml += formatSection(currentSection);
      }
      
      return sanitizeHtml(formattedHtml);
    };
    
    // Helper function to format a section of text
    const formatSection = (sectionText: string): string => {
      if (!sectionText.trim()) return '';
      
      let formatted = '';
      const lines = sectionText.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;
        
        // Handle different types of content
        if (isHeader(trimmedLine)) {
          formatted += formatAsHeader(trimmedLine);
        } else if (isBulletPoint(trimmedLine)) {
          formatted += formatBulletPoint(trimmedLine);
        } else if (isNumberedItem(trimmedLine)) {
          formatted += formatNumberedItem(trimmedLine);
        } else {
          // Regular paragraph
          const processedLine = processMarkdownFormatting(trimmedLine);
          formatted += `<p>${processedLine}</p>`;
        }
      }
      
      return formatted;
    };
    
    // Helper functions for content detection and formatting
    const isHeader = (line: string): boolean => {
      return /^[A-Z][A-Z\s]{3,}$/.test(line) || // ALL CAPS headers
             /^\d+\.\s*[A-Z]/.test(line) || // Numbered sections
             line.startsWith('#'); // Markdown headers
    };
    
    const isBulletPoint = (line: string): boolean => {
      return /^[\s]*[\*\-\•]\s+/.test(line);
    };
    
    const isNumberedItem = (line: string): boolean => {
      return /^[\s]*\d+\.\s+/.test(line);
    };
    
    const formatAsHeader = (line: string): string => {
      const cleanLine = line.replace(/^#+\s*/, '').trim();
      return `<h3><span style="text-decoration: underline; color: rgb(52, 73, 94);">${cleanLine}</span></h3>`;
    };
    
    const formatBulletPoint = (line: string): string => {
      const match = line.match(/^(\s*)([\*\-\•])\s+(.+)$/);
      if (match) {
        const [, indent, bullet, content] = match;
        const level = Math.floor(indent.length / 2) + 1;
        const marginLeft = (level - 1) * 20;
        const processedContent = processMarkdownFormatting(content);
        return `<li style="margin-left: ${marginLeft}px; list-style-type: disc; margin-bottom: 4px;">${processedContent}</li>`;
      }
      return `<p>${processMarkdownFormatting(line)}</p>`;
    };
    
    const formatNumberedItem = (line: string): string => {
      const match = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
      if (match) {
        const [, indent, number, content] = match;
        const level = Math.floor(indent.length / 2) + 1;
        const marginLeft = (level - 1) * 20;
        const processedContent = processMarkdownFormatting(content);
        return `<li style="margin-left: ${marginLeft}px; list-style-type: decimal; margin-bottom: 4px;">${processedContent}</li>`;
      }
      return `<p>${processMarkdownFormatting(line)}</p>`;
    };
    
    // Create formatted notes
    const notes = createFormattedNotes(ocrText);
    console.log("Notes generation complete");
    
    return { notes };
    
  } catch (error) {
    console.error("Notes generation Error:", error);
    toast.error("Failed to generate complete notes. Falling back to formatted OCR text.", {
      duration: 5000,
      position: "top-right"
    });
    
    // Create a better fallback with basic formatting
    const createFormattedFallback = (text: string) => {
      let formattedHtml = `
        <h1><span style="text-decoration: underline; color: rgb(71, 0, 0);">Complete PDF Content (Basic Formatting)</span></h1>
        <p>Below is the <strong>complete text</strong> extracted from your PDF with basic formatting.</p>
      `;
      
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          if (trimmedLine.startsWith('Page ')) {
            formattedHtml += `<h2><span style="text-decoration: underline; color: rgb(26, 1, 157);">${trimmedLine}</span></h2>`;
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
