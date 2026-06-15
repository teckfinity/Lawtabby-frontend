import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Send,
  Sparkles,
  FileText,
  X,
  History,
  MessageSquarePlus,
} from "lucide-react";
import { getUserProfile } from "@/api/user";
import { UserAvatar } from "@/components/UserAvatar";
import { ChatResearchMessage } from "@/components/chat/ChatResearchMessage";
import { ChatConversationSidebar } from "@/components/chat/ChatConversationSidebar";
import { ChatToolsMenu } from "@/components/chat/ChatToolsMenu";
import { CHAT_HISTORY_HINT_KEY } from "@/components/chat/ChatHistoryHint";
import { useSidebar } from "@/components/ui/sidebar";
import { CHAT_WELCOME, chatInputFooter } from "@/constants/chatWelcome";
import {
  RESEARCH_MODES,
  isDeepResearch,
  researchModeFromApi,
  type ResearchMode,
} from "@/constants/researchModes";
import {
  createConversation,
  sendChatMessage,
  getConversation,
  listConversations,
  deleteConversation,
  LEGAL_CHAT_ACTIVE_KEY,
  type ChatSource,
  type ConversationSummary,
} from "@/api/ai_chat";
import type { ChatStructuredResponse } from "@/types/chatResearch";

interface ChatMessage {
  id?: number;
  type: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: ChatSource[];
  externalReferences?: ChatSource[];
  ragUsed?: boolean;
  structured?: ChatStructuredResponse;
  intent?: string;
  confidence?: number;
  file?: { name: string; type: string } | null;
}

function ChatAssistantAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 p-1" : "w-8 h-8 p-1.5";
  return (
    <div
      className={`${dim} rounded-full bg-legal-primary flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-background`}
    >
      <img src="/logo.svg" alt="LexOrbit AI" className="h-full w-full object-contain object-left" />
    </div>
  );
}

function mapApiMessages(
  messages: Awaited<ReturnType<typeof getConversation>>["messages"],
  formatTime: (iso: string) => string
): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg.id || Date.now(),
    type: msg.role === "ai" ? "ai" : "user",
    content: msg.content,
    timestamp: formatTime(msg.created_at),
    sources: msg.sources ?? [],
    externalReferences: msg.external_references ?? [],
    ragUsed: msg.rag_used ?? false,
    structured: msg.structured,
    intent: msg.intent,
    confidence: msg.confidence,
    file: null,
  }));
}

function ChatEmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[320px] px-6 text-center">
      <ChatAssistantAvatar />
      <h2 className="text-2xl font-semibold text-foreground mt-5 tracking-tight">{CHAT_WELCOME.title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mt-2 leading-relaxed">{CHAT_WELCOME.subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 w-full max-w-lg">
        {CHAT_WELCOME.suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestionClick(s)}
            className="text-left text-xs rounded-xl border border-gold/45 bg-cream/80 text-gold-dark px-3 py-2.5 transition-colors leading-snug hover:bg-gold-dark hover:border-gold-dark hover:text-cream"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatInputFooter() {
  return (
    <p className="text-[11px] text-muted-foreground px-1 leading-relaxed">
      {chatInputFooter()}
    </p>
  );
}

const Chat = () => {
  const { open: mainSidebarOpen, setOpen: setMainSidebarOpen } = useSidebar();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [researchMode, setResearchMode] = useState<ResearchMode>("standard");
  const [showHistoryHint, setShowHistoryHint] = useState(
    () => !localStorage.getItem(CHAT_HISTORY_HINT_KEY)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = useCallback((isoString: string): string => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  }, []);

  const savedConversations = conversations.filter((c) => c.message_count > 0);

  const startFreshChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setInputValue("");
    setSelectedFile(null);
    setResearchMode("standard");
    localStorage.removeItem(LEGAL_CHAT_ACTIVE_KEY);
    setMobileHistoryOpen(false);
  }, []);

  const purgeEmptyDrafts = useCallback(async (list: ConversationSummary[]) => {
    const empty = list.filter((c) => c.message_count === 0);
    if (empty.length === 0) return list.filter((c) => c.message_count > 0);
    await Promise.allSettled(empty.map((c) => deleteConversation(c.conversation_id)));
    return list.filter((c) => c.message_count > 0);
  }, []);

  const refreshConversationList = useCallback(async () => {
    try {
      const list = await listConversations();
      const saved = await purgeEmptyDrafts(list);
      setConversations(saved);
      return saved;
    } catch (err) {
      console.error("Failed to load conversations", err);
      return [];
    }
  }, [purgeEmptyDrafts]);

  const loadConversation = useCallback(
    async (convId: number) => {
      setIsLoadingMessages(true);
      try {
        const data = await getConversation(convId);
        setConversationId(convId);
        localStorage.setItem(LEGAL_CHAT_ACTIVE_KEY, convId.toString());
        setResearchMode(researchModeFromApi(data.research_mode));
        setMessages(mapApiMessages(data.messages, formatTime));
      } catch (err) {
        console.error("Failed to load conversation", err);
        throw err;
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [formatTime]
  );

  const dismissHistoryHint = useCallback(() => {
    localStorage.setItem(CHAT_HISTORY_HINT_KEY, "1");
    setShowHistoryHint(false);
  }, []);

  const handleToggleChatSidebar = useCallback(() => {
    setSidebarCollapsed((collapsed) => {
      if (collapsed && mainSidebarOpen) {
        setMainSidebarOpen(false);
      }
      if (collapsed && showHistoryHint) {
        dismissHistoryHint();
      }
      return !collapsed;
    });
  }, [mainSidebarOpen, setMainSidebarOpen, showHistoryHint, dismissHistoryHint]);

  const handleNewChat = useCallback(async () => {
    if (!conversationId && messages.length === 0) {
      startFreshChat();
      return;
    }

    if (conversationId) {
      const current = conversations.find((c) => c.conversation_id === conversationId);
      if (current && current.message_count === 0) {
        await deleteConversation(conversationId).catch(() => undefined);
        setConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId));
      }
    }

    startFreshChat();
  }, [conversationId, conversations, messages.length, startFreshChat]);

  const handleSelectConversation = useCallback(
    async (convId: number) => {
      if (convId === conversationId || isTyping) return;
      setSelectedFile(null);
      setInputValue("");
      setMobileHistoryOpen(false);
      await loadConversation(convId);
    },
    [conversationId, isTyping, loadConversation]
  );

  const handleDeleteConversation = useCallback(
    async (convId: number) => {
      try {
        await deleteConversation(convId);
        const remaining = conversations.filter((c) => c.conversation_id !== convId);
        setConversations(remaining);

        if (convId === conversationId) {
          if (remaining.length > 0) {
            await loadConversation(remaining[0].conversation_id);
          } else {
            startFreshChat();
          }
        }
      } catch (err) {
        console.error("Failed to delete conversation", err);
      }
    },
    [conversationId, conversations, loadConversation, startFreshChat]
  );

  useEffect(() => {
    if (mainSidebarOpen && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [mainSidebarOpen, sidebarCollapsed]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const init = async () => {
      setIsLoadingList(true);
      try {
        const list = await refreshConversationList();
        const saved = list.filter((c) => c.message_count > 0);

        const storedId =
          localStorage.getItem(LEGAL_CHAT_ACTIVE_KEY) ??
          localStorage.getItem("legal_chat_conversation_id");
        const storedConvId = storedId ? parseInt(storedId, 10) : null;
        const validStored =
          storedConvId && saved.some((c) => c.conversation_id === storedConvId);

        if (validStored && storedConvId) {
          await loadConversation(storedConvId);
        } else if (saved.length > 0) {
          await loadConversation(saved[0].conversation_id);
        } else {
          startFreshChat();
        }
      } catch {
        startFreshChat();
      } finally {
        setIsLoadingList(false);
      }
    };

    init();

    getUserProfile()
      .then((profile) => {
        setUserAvatar(profile.avatar || null);
        setUserDisplayName(profile.name || "");
        setUserEmail(profile.email || "");
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;
    if (isLoadingMessages) return;

    const messageContent = inputValue || (selectedFile ? "Uploaded a file for analysis" : "");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "user",
        content: messageContent,
        file: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : null,
        timestamp: "Just now",
      },
    ]);
    setInputValue("");
    setIsTyping(true);
    setSelectedFile(null);

    try {
      let activeConvId = conversationId;
      if (!activeConvId) {
        const created = await createConversation(researchMode);
        activeConvId = created.conversation_id;
        setConversationId(activeConvId);
        localStorage.setItem(LEGAL_CHAT_ACTIVE_KEY, activeConvId.toString());
      }

      const result = await sendChatMessage(activeConvId, messageContent, {
        deepResearch: isDeepResearch(researchMode),
        includeSources: isDeepResearch(researchMode),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: result.message.id,
          type: "ai",
          content: result.message.content,
          timestamp: formatTime(result.message.created_at),
          sources: result.sources,
          externalReferences: result.external_references,
          ragUsed: result.rag_used,
          structured: result.structured,
          intent: result.intent,
          confidence: result.confidence,
        },
      ]);

      const convId = activeConvId;
      if (result.conversationTitle) {
        setConversations((prev) => {
          const existing = prev.find((c) => c.conversation_id === convId);
          if (existing) {
            const updated = prev.map((c) =>
              c.conversation_id === convId
                ? {
                    ...c,
                    title: result.conversationTitle!,
                    updated_at: new Date().toISOString(),
                    message_count: Math.max(c.message_count, 0) + 2,
                  }
                : c
            );
            const active = updated.find((c) => c.conversation_id === convId)!;
            const rest = updated.filter((c) => c.conversation_id !== convId);
            return [active, ...rest];
          }
          return [
            {
              conversation_id: convId,
              title: result.conversationTitle!,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              research_mode: researchMode,
              message_count: 2,
            },
            ...prev,
          ];
        });
      } else {
        await refreshConversationList();
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      const detail =
        err.response?.status === 500
          ? "Server error. Run: python manage.py migrate legal_ai_agent"
          : err.response?.status === 401
            ? "Session expired. Please sign in again."
            : "Could not reach the legal research engine. Check that Django is running.";
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "",
          structured: { answer: detail, confidence: 0 },
          timestamp: "Just now",
        },
      ]);
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const activeTitle =
    conversationId === null
      ? "New research"
      : conversations.find((c) => c.conversation_id === conversationId)?.title || "New research";
  const showEmptyState = !isLoadingMessages && messages.length === 0;
  const chatSidebarCollapsed = sidebarCollapsed || mainSidebarOpen;

  return (
    <div className="flex h-svh min-h-0 max-h-svh shrink-0 overflow-hidden bg-background">
      <ChatConversationSidebar
        conversations={savedConversations}
        activeConversationId={conversationId}
        isLoadingList={isLoadingList}
        collapsed={chatSidebarCollapsed}
        mainSidebarOpen={mainSidebarOpen}
        showHistoryHint={showHistoryHint && chatSidebarCollapsed}
        onDismissHistoryHint={dismissHistoryHint}
        onToggleCollapse={handleToggleChatSidebar}
        onNewChat={handleNewChat}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
      />

      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <header className="h-12 border-b border-border px-4 flex items-center shrink-0 bg-background z-10">
          <div className="flex items-center gap-2 min-w-0 w-full max-w-3xl mx-auto">
            <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="lg:hidden h-8 w-8 shrink-0"
                  aria-label="Open chat history"
                >
                  <History className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b text-left shrink-0">
                  <SheetTitle className="text-sm">Chats</SheetTitle>
                </SheetHeader>
                <div className="p-3 border-b shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 h-8 text-xs"
                    onClick={handleNewChat}
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    New chat
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {savedConversations.map((conv) => (
                    <button
                      key={conv.conversation_id}
                      type="button"
                      onClick={() => handleSelectConversation(conv.conversation_id)}
                      className={`w-full text-left px-2.5 py-2 rounded-md text-[13px] truncate ${
                        conv.conversation_id === conversationId
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      {conv.title || "New research"}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <p className="text-sm font-medium truncate">{activeTitle}</p>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col px-4">
            {isLoadingMessages ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Loading messages...
              </div>
            ) : showEmptyState ? (
              <ChatEmptyState onSuggestionClick={setInputValue} />
            ) : (
              <div className="py-6 space-y-6">
                {messages.map((message, index) =>
                  message.type === "user" ? (
                    <div key={message.id || index} className="flex justify-end gap-2">
                      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-legal-primary text-primary-foreground px-4 py-2.5">
                        <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        {message.file && (
                          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/20 text-xs opacity-90">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{message.file.name}</span>
                          </div>
                        )}
                      </div>
                      <UserAvatar
                        src={userAvatar}
                        name={userDisplayName}
                        email={userEmail}
                        className="w-7 h-7 shrink-0 self-end"
                        emojiClassName="text-sm"
                      />
                    </div>
                  ) : (
                    <div key={message.id || index} className="flex gap-2.5">
                      <div className="shrink-0 mt-0.5">
                        <ChatAssistantAvatar size="sm" />
                      </div>
                      <div className="flex-1 min-w-0 rounded-2xl rounded-bl-sm bg-muted/50 border border-border/60 px-4 py-3">
                        <ChatResearchMessage
                          structured={message.structured}
                          fallbackSources={message.sources}
                          externalReferences={message.externalReferences}
                          showExternalLinks={(message.externalReferences?.length ?? 0) > 0}
                        />
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                            <Sparkles className="h-2.5 w-2.5 mr-1" />
                            LexOrbit AI
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {isTyping && (
                  <div className="flex gap-2.5">
                    <div className="shrink-0 mt-0.5">
                      <ChatAssistantAvatar size="sm" />
                    </div>
                    <div className="rounded-2xl rounded-bl-sm bg-muted/50 border border-border/60 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-legal-primary rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-legal-primary rounded-full animate-bounce [animation-delay:0.1s]" />
                          <div className="w-1.5 h-1.5 bg-legal-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        </div>
                        <span className="text-sm text-muted-foreground">Searching authorities...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <footer className="border-t border-border px-4 py-3 shrink-0 bg-background">
          <div className="max-w-3xl mx-auto space-y-2">
            {selectedFile && (
              <div className="inline-flex items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 text-legal-primary" />
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                <button type="button" onClick={clearSelectedFile} aria-label="Remove file">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
            />

            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-end gap-1 p-1.5">
                <ChatToolsMenu
                  researchMode={researchMode}
                  onResearchModeChange={setResearchMode}
                  onUploadClick={() => fileInputRef.current?.click()}
                  disabled={isLoadingMessages}
                  onClearMode={() => setResearchMode("standard")}
                />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={RESEARCH_MODES[researchMode].placeholder}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none min-h-[40px] text-[15px] px-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoadingMessages}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  className="h-9 w-9 bg-legal-primary hover:bg-legal-primary/90 shrink-0 rounded-xl mb-0.5"
                  disabled={(!inputValue.trim() && !selectedFile) || isTyping}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ChatInputFooter />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;
