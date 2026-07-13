import { X } from "lucide-react";

export const CHAT_HISTORY_HINT_KEY = "lexorbit_chat_history_hint_dismissed";

type ChatHistoryHintProps = {
  onDismiss: () => void;
  compact?: boolean;
};

/** Small anchored tooltip beside the chat panel icon. */
export function ChatHistoryHint({ onDismiss, compact = false }: ChatHistoryHintProps) {
  return (
    <div
      className="absolute left-full top-2.5 z-50 ml-2.5 w-[168px] pointer-events-auto animate-in fade-in slide-in-from-left-2 duration-300"
      role="status"
    >
      <div className="relative rounded-lg border border-border/80 bg-card px-2.5 py-2 shadow-lg">
        <div
          className="absolute -left-[5px] top-[11px] h-2.5 w-2.5 rotate-45 border-l border-b border-border/80 bg-card"
          aria-hidden
        />
        <div className="flex items-start gap-1.5">
          <p className="text-[11px] leading-snug flex-1">
            <span className="font-medium text-foreground">Past chats</span>
            {!compact && (
              <span className="text-muted-foreground"> live here. Tap the icon to open.</span>
            )}
            {compact && (
              <span className="text-muted-foreground"> · tap the icon</span>
            )}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-sm p-0.5 text-muted-foreground/70 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
