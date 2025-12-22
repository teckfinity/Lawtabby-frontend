import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  FileText,
} from "lucide-react";
import { sendLegalChat } from "@/api/ai_chat";
import { getUserProfile } from "@/api/user"; 

// Define message type
interface ChatMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: string;
  file?: {
    name: string;
    type: string;
  } | null;
}

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load session ID and saved messages on mount
  useEffect(() => {
    const storedSession = localStorage.getItem("legal_chat_session_id");
    const storedMessages = localStorage.getItem("legal_chat_messages");

    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("legal_chat_session_id", newSession);
      setSessionId(newSession);
    }

    // Load saved messages or start with welcome message
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        setMessages(parsed);
      } catch (e) {
        // If corrupted, start fresh
        setMessages(getWelcomeMessage());
      }
    } else {
      setMessages(getWelcomeMessage());
    }

    // Load user avatar
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserAvatar(profile.avatar || null);
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Helper to get welcome message
  const getWelcomeMessage = (): ChatMessage[] => [
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm your AI legal assistant. I can help you analyze documents, summarize cases, research legal precedents, and answer questions about legal matters. How can I assist you today?",
      timestamp: "Just now",
    },
  ];

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("legal_chat_messages", JSON.stringify(messages));
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages(getWelcomeMessage());
    // New session on clear
    const newSession = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("legal_chat_session_id", newSession);
    localStorage.removeItem("legal_chat_messages"); // Clear old history
    setSessionId(newSession);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    const hasFile = !!selectedFile;

    const newMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      content: inputValue || (hasFile ? "Uploaded a file" : ""),
      file: hasFile ? { name: selectedFile!.name, type: selectedFile!.type } : null,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const response = await sendLegalChat(
        inputValue,
        selectedFile || undefined,
        sessionId || undefined
      );

      const aiReply =
        response.data?.response ||
        response.data?.message ||
        "AI responded, but no detailed message was returned.";

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: aiReply,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const aiError: ChatMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: "Sorry, there was an issue contacting the legal assistant.",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiError]);
    } finally {
      setIsTyping(false);
      setSelectedFile(null);
    }
  };

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserAvatar(profile.avatar || null);
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };
  fetchProfile();
  }, []);

  // const quickPrompts = [
  //   "Summarize this legal document",
  //   "Analyze contract terms",
  //   "Research case precedents",
  //   "Draft legal memo",
  //   "Review compliance issues",
  // ];

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3"></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={handleClearChat}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:pl-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type === "ai" && (
                <div className="w-8 h-8 bg-legal-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}

              <div
               className={`max-w-2xl ${message.type === "user" ? "order-first" : ""}`}>
                <Card
                  className={`${
                    message.type === "user"
                      ? "bg-legal-primary text-white"
                      : "bg-card"
                  } shadow-sm`}
                >
                  <CardContent className="p-4">
                    <div className="text-sm leading-relaxed space-y-2">
                      <p>{message.content}</p>

                      {/* Show file preview if exists */}
                      {message.file && (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-background/50">
                          <FileText className="h-4 w-4 text-legal-primary" />
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {message.file.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs ${
                          message.type === "user"
                            ? "text-white/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp}
                      </span>
                      {message.type === "ai" && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {message.type === "user" && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 bg-legal-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <Card className="bg-card shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-legal-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-legal-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-legal-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                    <span className="text-sm text-muted-foreground">AI is typing...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Invisible anchor to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts */}
      {/* {messages.length === 1 && (
        <div className="p-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">
              Try these quick prompts:
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(prompt)}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )} */}

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
            <label className="flex items-center gap-2 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span className="text-sm">File</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />
            </label>
            {selectedFile && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {selectedFile.name}
              </span>
            )}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              className="bg-legal-primary hover:bg-legal-primary/90 flex-shrink-0"
              disabled={!inputValue.trim() && !selectedFile}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {selectedFile ? "File selected for upload" : "File upload optional"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;