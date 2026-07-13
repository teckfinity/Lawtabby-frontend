import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/api/ai_chat";
import { ChatHistoryHint } from "@/components/chat/ChatHistoryHint";

type ChatConversationSidebarProps = {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  isLoadingList: boolean;
  collapsed: boolean;
  mainSidebarOpen?: boolean;
  showHistoryHint?: boolean;
  onDismissHistoryHint?: () => void;
  onToggleCollapse: () => void;
  onNewChat: () => void;
  onSelect: (conversationId: number) => void;
  onDelete: (conversationId: number) => void;
};

function formatRelativeTime(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function ChatConversationSidebar({
  conversations,
  activeConversationId,
  isLoadingList,
  collapsed,
  mainSidebarOpen = false,
  showHistoryHint = false,
  onDismissHistoryHint,
  onToggleCollapse,
  onNewChat,
  onSelect,
  onDelete,
}: ChatConversationSidebarProps) {
  if (collapsed) {
    return (
      <div className="hidden lg:flex w-11 shrink-0 self-start sticky top-0 h-svh border-r border-border bg-background flex-col items-center py-3 gap-2 z-20">
        <div className="relative shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              showHistoryHint && "bg-gold/10 text-gold-dark ring-1 ring-gold/40"
            )}
            onClick={onToggleCollapse}
            title="Open chat history"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          {showHistoryHint && onDismissHistoryHint && (
            <ChatHistoryHint onDismiss={onDismissHistoryHint} compact={mainSidebarOpen} />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gold"
          onClick={onNewChat}
          title="New chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="hidden lg:flex w-[220px] xl:w-[240px] shrink-0 self-start sticky top-0 h-svh border-r border-border bg-background flex-col min-w-0 z-20">
      <div className="px-3 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-1 mb-2.5 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">Chats</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            onClick={onToggleCollapse}
            title="Hide chats"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs font-normal border-gold/40 text-gold hover:bg-gold/10"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 py-2 space-y-0.5">
          {isLoadingList && conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-3">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-3 leading-relaxed">
              Your chats will show up here after your first message.
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.conversation_id === activeConversationId;
              return (
                <div
                  key={conv.conversation_id}
                  className={cn(
                    "group relative rounded-md transition-colors min-w-0",
                    isActive ? "bg-muted" : "hover:bg-muted/60"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conv.conversation_id)}
                    className="w-full text-left px-2.5 py-2 pr-8 min-w-0"
                  >
                    <p
                      className={cn(
                        "text-[13px] truncate leading-snug",
                        isActive ? "font-medium text-foreground" : "text-foreground/85"
                      )}
                    >
                      {conv.title || "New research"}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {formatRelativeTime(conv.updated_at)}
                    </p>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.conversation_id);
                    }}
                    title="Delete chat"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
