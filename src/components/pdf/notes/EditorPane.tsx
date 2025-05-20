
import { useRef } from "react";
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

  return (
    <Editor
      apiKey="cg09wsf15duw9av3kj5g8d8fvsxvv3uver3a95xyfm1ngtq4"
      onInit={(evt, editor) => {
        editorRef.current = editor;
      }}
      initialValue={initialValue}
      onEditorChange={onEditorChange}
      init={{
        ...getEditorConfig(imageUploadHandler, notesContent),
        // Add specific settings to ensure full content is displayed
        forced_root_block: 'p',
        remove_trailing_brs: false,
        keep_styles: true,
        extended_valid_elements: '*[*]',
        valid_elements: '*[*]',
        invalid_elements: '',
        entity_encoding: 'raw',
        convert_urls: false,
        valid_children: '+body[style],+body[link]'
      }}
    />
  );
};
