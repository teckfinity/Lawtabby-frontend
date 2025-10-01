import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Plus, 
  Paperclip, 
  MessageSquare, 
  Bot, 
  User,
  FileText,
  Upload,
  Sparkles,
  RefreshCw
} from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      content: "Hello! I'm your AI legal assistant. I can help you analyze documents, summarize cases, research legal precedents, and answer questions about legal matters. How can I assist you today?",
      timestamp: "Just now"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputValue,
      timestamp: "Just now"
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        type: "ai",
        content: "I understand you're asking about legal documentation. Let me analyze this request and provide you with relevant information based on current legal standards and practices.",
        timestamp: "Just now"
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const quickPrompts = [
    "Summarize this legal document",
    "Analyze contract terms",
    "Research case precedents",
    "Draft legal memo",
    "Review compliance issues"
  ];

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" className="bg-legal-primary hover:bg-legal-primary/90">
                Default
              </Button>
              <Button size="sm" variant="outline">
                Summarizer
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost">
              <RefreshCw className="h-4 w-4" />
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
              className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 bg-legal-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-2xl ${message.type === 'user' ? 'order-first' : ''}`}>
                <Card className={`${message.type === 'user' ? 'bg-legal-primary text-white' : 'bg-card'} shadow-sm`}>
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs ${message.type === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {message.timestamp}
                      </span>
                      {message.type === 'ai' && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
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
                      <div className="w-2 h-2 bg-legal-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-legal-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">AI is typing...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground mb-3">Try these quick prompts:</p>
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
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
            <Button size="sm" variant="ghost" className="flex-shrink-0">
              <Paperclip className="h-4 w-4" />
              File
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Write a note"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              className="bg-legal-primary hover:bg-legal-primary/90 flex-shrink-0"
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            0 of 1 file upload left today
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;