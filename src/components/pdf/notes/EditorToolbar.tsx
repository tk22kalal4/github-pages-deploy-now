
import { Button } from "@/components/ui/button";
import { MessageSquare, Info } from "lucide-react";

interface EditorToolbarProps {
  onViewRawOCR: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onDownloadHTML: () => void;
  onReturn: () => void;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
}

export const EditorToolbar = ({
  onViewRawOCR,
  onCopy,
  onDownload,
  onDownloadHTML,
  onReturn,
  showChat,
  setShowChat
}: EditorToolbarProps) => {
  return (
    <div className="p-4 border-b flex justify-between items-center">
      <h2 className="text-xl font-semibold flex items-center">
        <span>Complete PDF Notes Editor</span>
        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">100% Content Preserved</span>
      </h2>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowChat(!showChat)}
          className="flex items-center gap-1"
        >
          <MessageSquare size={16} />
          {showChat ? "Hide Chat" : "Chat"}
        </Button>
        <Button variant="outline" size="sm" onClick={onViewRawOCR}>
          <Info size={16} className="mr-1" />
          View Raw OCR
        </Button>
        <Button variant="outline" size="sm" onClick={onCopy}>
          Copy
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload}>
          Download Text
        </Button>
        <Button variant="outline" size="sm" onClick={onDownloadHTML}>
          Download HTML
        </Button>
        <Button variant="outline" size="sm" onClick={onReturn}>
          Return to PDF
        </Button>
      </div>
    </div>
  );
};
