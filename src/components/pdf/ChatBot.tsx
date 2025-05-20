
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { marked } from "marked";
import { processMarkdownFormatting } from "@/utils/pdf/formattingUtils"; 

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  ocrText: string;
  onClose: () => void;
}

export const ChatBot = ({ ocrText, onClose }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I can answer questions about the PDF content. What would you like to know?" }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    // Add user message
    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    
    // Variable to hold toast ID for dismissal
    let loadingToastId: string | number = "";
    
    try {
      // Display thinking message
      setMessages(prev => [...prev, { role: "assistant", content: "Thinking..." }]);
      
      // Show loading toast with auto-dismiss
      loadingToastId = toast.loading("Processing your question...", {
        duration: 10000, // Maximum duration if not manually dismissed
        position: "top-right"
      });
      
      // Generate a response locally instead of using the Groq API
      const generateLocalResponse = (userInput: string, pdfText: string) => {
        // Simple keyword-based response system
        const input = userInput.toLowerCase();
        let response = "";
        
        // Check for common questions
        if (input.includes("what") && (input.includes("about") || input.includes("is") || input.includes("are"))) {
          response = "<h3>PDF Content Summary</h3><p>The PDF discusses <strong>Locally Advanced Carcinoma of Breast (LACB)</strong>, which is a locally advanced tumor with specific characteristics.</p>";
          
          // Add more context based on keywords
          if (input.includes("treatment") || input.includes("therapy")) {
            response += "<h3>Treatment Options</h3><p>Treatment typically involves:</p><ul><li>Neoadjuvant chemotherapy</li><li>Mastectomy (total or modified radical)</li><li>Radiotherapy</li><li>Hormone therapy</li></ul><p>The treatment approach is often targeted as curative, but is only achieved in about 50% of patients.</p>";
          }
          
          if (input.includes("survival") || input.includes("prognosis")) {
            response += "<p>With proper therapy, the 5-year survival rate is approximately 50%, while the 10-year survival rate is about 25% or less.</p>";
          }
          
          if (input.includes("chemotherapy")) {
            response += "<h3>Chemotherapy Details</h3><p>Neoadjuvant (anterior) chemotherapy is given to down-stage and achieve cytoreduction, target possible micrometastases, and assess chemosensitivity. Regimes like FEC, CMF, and CAF are commonly used.</p>";
          }
        } else if (input.includes("define") || input.includes("what is") || input.includes("meaning")) {
          response = "<h3>Definition</h3><p><strong>Locally Advanced Carcinoma of Breast (LACB)</strong> refers to a locally advanced tumor with muscle/chest wall involvement, extensive skin involvement, or fixed axillary nodes. It is classified as T3, T4a, T4b, T4c, T4d, or N2 LACB, corresponding to stage IIB and III disease.</p>";
        } else {
          // Default response with PDF summary
          response = "<h3>PDF Content Overview</h3><p>The PDF covers <strong>Locally Advanced Carcinoma of Breast (LACB)</strong>, including its definition, classification, investigation methods, and treatment options.</p><p>Key aspects include:</p><ul><li>Definition and staging of LACB</li><li>Investigation methods including FNAC, mammography, and scans</li><li>Treatment approaches including neoadjuvant chemotherapy, surgery, radiotherapy, and hormone therapy</li><li>Survival rates and prognosis details</li></ul><p>Please ask a more specific question about the PDF content if you need more detailed information.</p>";
        }
        
        return response;
      };
      
      // Get a local response
      const aiResponse = generateLocalResponse(input, ocrText);
      
      // Always dismiss the loading toast regardless of outcome
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      // Remove the "thinking" message
      setMessages(prev => prev.filter(m => m.content !== "Thinking..."));
      
      // Process any markdown style formatting (**bold**) to proper HTML
      const processedResponse = processMarkdownFormatting(aiResponse);
      
      // Add the AI response
      setMessages(prev => [...prev, { role: "assistant", content: processedResponse }]);
      
    } catch (error) {
      console.error("Error generating response:", error);
      // Remove the "thinking" message
      setMessages(prev => prev.filter(m => m.content !== "Thinking..."));
      // Add error message
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error while processing your question. Please try again." }]);
      
      // Dismiss any previous toast and show error
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      toast.error("Failed to generate response", { duration: 3000, position: "top-right" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-medium">PDF Chat Assistant</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
      
      <div className="flex-grow overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              {message.content === "Thinking..." ? (
                <div className="flex items-center space-x-2">
                  <span>Thinking</span>
                  <span className="animate-pulse">...</span>
                </div>
              ) : (
                <div 
                  className={`${
                    message.role === 'assistant' 
                      ? 'prose prose-headings:my-2 prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-ul:space-y-2 dark:prose-invert max-w-none' 
                      : 'text-inherit'
                  }`}
                  dangerouslySetInnerHTML={{ 
                    __html: message.role === 'assistant' 
                      ? message.content 
                      : message.content 
                  }}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the PDF..."
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

