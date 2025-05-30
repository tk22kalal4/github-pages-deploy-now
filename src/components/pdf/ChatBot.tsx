
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Key } from "lucide-react";
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
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('groq_api_key') || "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";
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Save API key to localStorage when it changes
    if (apiKey) {
      localStorage.setItem('groq_api_key', apiKey);
    }
  }, [apiKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing) return;
    
    if (!apiKey.trim()) {
      toast.error("Please enter your Groq API key first", {
        duration: 3000,
        position: "top-right"
      });
      setShowApiKeyInput(true);
      return;
    }
    
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
        duration: 10000,
        position: "top-right"
      });
      
      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that answers questions about PDF content and related to pdf content which are not in pdf content. Here is the PDF content to reference: ${ocrText.substring(0, 4000)}...`
            },
            {
              role: 'user',
              content: input
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
      
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
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error while processing your question. Please check your API key and try again." }]);
      
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            <Key className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      
      {showApiKeyInput && (
        <div className="p-4 border-b bg-yellow-50">
          <label className="block text-sm font-medium mb-2">Groq API Key:</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Groq API key"
              className="flex-grow px-3 py-2 border rounded-md text-sm"
            />
            <Button 
              size="sm" 
              onClick={() => setShowApiKeyInput(false)}
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Your API key is stored locally and not shared with anyone.
          </p>
        </div>
      )}
      
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
