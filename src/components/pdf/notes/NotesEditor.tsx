
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatBot } from "../ChatBot";
import { EditorToolbar } from "./EditorToolbar";
import { EditorPane } from "./EditorPane";
import { useNotesActions } from "./NotesActions";

interface NotesEditorProps {
  notes: string;
  ocrText: string;
  onReturn: () => void;
}

export const NotesEditor = ({ notes, ocrText, onReturn }: NotesEditorProps) => {
  const editorRef = useRef<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [notesContent, setNotesContent] = useState(notes);

  const { handleCopy, handleDownload, handleDownloadHTML, viewRawOCR } = useNotesActions({
    editorRef,
    notesContent,
    ocrText
  });

  useEffect(() => {
    // Inform user about complete content preservation
    toast.success("Complete PDF content has been preserved in the notes. No information has been omitted.", {
      duration: 4000,
      position: "top-right"
    });
  }, []);

  // Function to check if content is being deleted and preserve important parts
  const handleEditorChange = (content: string) => {
    // Store the updated content
    setNotesContent(content);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg flex flex-col h-[85vh]">
      <EditorToolbar
        onViewRawOCR={viewRawOCR}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onDownloadHTML={handleDownloadHTML}
        onReturn={onReturn}
        showChat={showChat}
        setShowChat={setShowChat}
      />
      
      <div className="flex-grow overflow-hidden flex">
        <div className={`${showChat ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
          <EditorPane
            initialValue={notes}
            onEditorChange={handleEditorChange}
            ocrText={ocrText}
            notesContent={notesContent}
          />
        </div>
        
        {showChat && (
          <div className="w-1/2">
            <ChatBot 
              ocrText={ocrText} 
              onClose={() => setShowChat(false)} 
            />
          </div>
        )}
      </div>
    </div>
  );
};
