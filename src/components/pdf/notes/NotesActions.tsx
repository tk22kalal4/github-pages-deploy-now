
import { toast } from "sonner";

export interface NotesActionsProps {
  editorRef: React.MutableRefObject<any>;
  notesContent: string;
  ocrText: string;
}

export const useNotesActions = ({ editorRef, notesContent, ocrText }: NotesActionsProps) => {
  const handleCopy = () => {
    const content = editorRef.current?.getContent() || notesContent;
    navigator.clipboard.writeText(content)
      .then(() => toast.success("Complete notes copied to clipboard", { duration: 2000, position: "top-right" }))
      .catch(() => toast.error("Failed to copy notes", { duration: 4000, position: "top-right" }));
  };

  const handleDownload = () => {
    const content = editorRef.current?.getContent() || notesContent;
    const blob = new Blob([content.replace(/<[^>]*>/g, ' ')], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `complete_pdf_notes_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Complete notes downloaded successfully", { duration: 2000, position: "top-right" });
  };

  const handleDownloadHTML = () => {
    const content = editorRef.current?.getContent() || notesContent;
    const blob = new Blob([
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Complete PDF Notes</title><style>body{font-family:Arial,sans-serif;line-height:1.6;margin:20px;max-width:800px;margin:0 auto;}h1{color:rgb(71,0,0);}h2{color:rgb(26,1,157);}h3{color:rgb(52,73,94);}ul{margin-left:20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;}th{background-color:#f2f2f2;}p{margin-bottom:12px;}li{margin-bottom:8px;}strong{font-weight:bold;}</style></head><body>' +
      content +
      '</body></html>'
    ], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `complete_pdf_notes_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Complete HTML notes downloaded successfully", { duration: 2000, position: "top-right" });
  };

  // Function to view raw OCR text
  const viewRawOCR = () => {
    // Create modal or dialog to show raw OCR
    editorRef.current?.setContent(`
      <h1><span style="text-decoration: underline;"><span style="color: rgb(71, 0, 0); text-decoration: underline;">Raw OCR Text (View Only)</span></span></h1>
      <p>Below is the complete raw text extracted from the PDF:</p>
      <pre style="background-color: #f5f5f5; padding: 10px; border: 1px solid #ddd; white-space: pre-wrap;">${ocrText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      <p><strong>Note:</strong> This is for verification only. Click "Reset Notes" to return to the formatted notes.</p>
      <p><button onclick="resetNotes()">Reset Notes</button></p>
    `);
    // Add custom reset function
    const editor = editorRef.current;
    if (editor) {
      const win = editor.getWin();
      win.resetNotes = () => {
        editor.setContent(notesContent);
      };
    }
  };

  return {
    handleCopy,
    handleDownload,
    handleDownloadHTML,
    viewRawOCR
  };
};
