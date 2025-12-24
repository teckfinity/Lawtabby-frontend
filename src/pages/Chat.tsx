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
import { getUserProfile } from "@/api/user";
import {
  createConversation,
  sendChatMessage,
  getConversation,
} from "@/api/ai_chat";

// Define message type
interface ChatMessage {
  id?: number;
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
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load session ID and saved messages on mount
  useEffect(() => {
    const initConversation = async () => {
      setIsLoadingConversation(true);
      const storedConvId = localStorage.getItem("legal_chat_conversation_id");

      let convId: number;

      if (storedConvId) {
        convId = parseInt(storedConvId, 10);
        setConversationId(convId);

        try {
          const data = await getConversation(convId);
          const backendMessages: ChatMessage[] = data.messages.map((msg: any) => ({
            id: msg.id || Date.now(),
            type: msg.role === "ai" ? "ai" : "user",
            content: msg.content,
            timestamp: formatTime(msg.created_at),
            file: null, // backend doesn't return file info
          }));

          setMessages(backendMessages.length > 0 ? backendMessages : getWelcomeMessage());
        } catch (err) {
          console.error("Failed to load conversation, starting new");
          convId = await createNewConversation();
        }
      } else {
        convId = await createNewConversation();
        setMessages(getWelcomeMessage());
      }

      setIsLoadingConversation(false);
    };

    const createNewConversation = async (): Promise<number> => {
      const response = await createConversation();
      const newConvId = response.conversation_id;
      localStorage.setItem("legal_chat_conversation_id", newConvId.toString());
      setConversationId(newConvId);
      return newConvId;
    };

    initConversation();

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

  const formatTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Just now";
    }
  };

  const getWelcomeMessage = (): ChatMessage[] => [
    {
      id: 1,
      type: "ai",
      content:
        "Hello! I'm your AI legal assistant. I can help you analyze documents, summarize cases, research legal precedents, and answer questions about legal matters. How can I assist you today?",
      timestamp: "Just now",
    },
  ];

  const handleClearChat = async () => {
    if (isLoadingConversation) return;

    try {
      const response = await createConversation();
      const newConvId = response.conversation_id;
      localStorage.setItem("legal_chat_conversation_id", newConvId.toString());
      setConversationId(newConvId);
      setMessages(getWelcomeMessage());
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to create new conversation");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;
    if (!conversationId || isLoadingConversation) return;

    const hasFile = !!selectedFile;
    const messageContent = inputValue || (hasFile ? "Uploaded a file" : "");

    const newUserMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      content: messageContent,
      file: hasFile ? { name: selectedFile!.name, type: selectedFile!.type } : null,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);
    setSelectedFile(null); // Clear file after showing in UI

    try {
      // Note: Currently backend doesn't support file, so sending only text
      // When backend adds file support, we'll update sendChatMessage to accept file
      const aiResponse = await sendChatMessage(conversationId, inputValue || "Uploaded a file");

      const aiMessage: ChatMessage = {
        id: aiResponse.id,
        type: "ai",
        content: aiResponse.content,
        timestamp: formatTime(aiResponse.created_at),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        type: "ai",
        content: "Sorry, there was an issue contacting the legal assistant.",
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };
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
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearChat}
              disabled={isLoadingConversation}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:pl-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoadingConversation ? (
            <div className="text-center text-muted-foreground py-10">
              Loading conversation...
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-4 ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.type === "ai" && (
                  <div className="w-8 h-8 bg-legal-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className={`max-w-2xl ${message.type === "user" ? "order-first" : ""}`}>
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
            ))
          )}

          {/* Typing Indicator */}
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
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoadingConversation}
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