
import { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { getEditorConfig } from "./EditorConfig";

interface EditorPaneProps {
  initialValue: string;
  onEditorChange: (content: string) => void;
  ocrText: string;
  notesContent: string;
}

export const EditorPane = ({ 
  initialValue, 
  onEditorChange,
  ocrText,
  notesContent
}: EditorPaneProps) => {
  const editorRef = useRef<any>(null);

  // Function to handle image upload directly from TinyMCE
  const imageUploadHandler = (blobInfo: any, progress: (percent: number) => void) => {
    return new Promise<string>((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          progress(100);
          resolve(e.target?.result as string);
        };
        reader.onerror = () => {
          reject('Failed to load image');
        };
        reader.readAsDataURL(blobInfo.blob());
      } catch (error) {
        reject('Image upload failed');
      }
    });
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

  return (
    <Editor
      apiKey="cg09wsf15duw9av3kj5g8d8fvsxvv3uver3a95xyfm1ngtq4"
      onInit={(evt, editor) => {
        editorRef.current = editor;
      }}
      initialValue={initialValue}
      onEditorChange={onEditorChange}
      init={getEditorConfig(imageUploadHandler, notesContent)}
    />
  );
};
