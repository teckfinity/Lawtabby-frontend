import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Database, FileUp, FolderOpen, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RESEARCH_MODES,
  type ResearchMode,
} from "@/constants/researchModes";

type ChatToolsMenuProps = {
  researchMode: ResearchMode;
  onResearchModeChange: (mode: ResearchMode) => void;
  onUploadClick: () => void;
  onPickFromLibraryClick?: () => void;
  disabled?: boolean;
  showModePill?: boolean;
  onClearMode?: () => void;
};

export function ChatToolsMenu({
  researchMode,
  onResearchModeChange,
  onUploadClick,
  onPickFromLibraryClick,
  disabled,
  showModePill = true,
  onClearMode,
}: ChatToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const active = RESEARCH_MODES[researchMode];

  const handleModeSelect = (mode: ResearchMode) => {
    onResearchModeChange(mode);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground",
              open && "bg-muted text-foreground"
            )}
            disabled={disabled}
            aria-label="Tools and research mode"
          >
            {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-72 rounded-xl p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground px-2 py-1">
            Tools
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="rounded-lg gap-2.5 py-2.5 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setOpen(false);
              onUploadClick();
            }}
          >
            <FileUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm leading-none">Upload file</p>
              <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, or TXT</p>
            </div>
          </DropdownMenuItem>

          {onPickFromLibraryClick && (
            <DropdownMenuItem
              className="rounded-lg gap-2.5 py-2.5 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setOpen(false);
                onPickFromLibraryClick();
              }}
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm leading-none">Pick from Library</p>
                <p className="text-[11px] text-muted-foreground mt-1">Reuse a saved upload</p>
              </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground px-2 py-1">
            Research mode
          </DropdownMenuLabel>

          <DropdownMenuItem
            className="rounded-lg gap-2.5 py-2.5 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              handleModeSelect("standard");
            }}
          >
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-none">{RESEARCH_MODES.standard.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {RESEARCH_MODES.standard.description}
              </p>
            </div>
            {researchMode === "standard" && <Check className="h-4 w-4 text-gold shrink-0" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="rounded-lg gap-2.5 py-2.5 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              handleModeSelect("deep_research");
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-none">{RESEARCH_MODES.deep_research.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {RESEARCH_MODES.deep_research.description}
              </p>
            </div>
            {researchMode === "deep_research" && <Check className="h-4 w-4 text-gold shrink-0" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showModePill && researchMode === "deep_research" && (
        <button
          type="button"
          onClick={() => (onClearMode ? onClearMode() : onResearchModeChange("standard"))}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] text-gold hover:bg-gold/15 transition-colors max-w-[140px]"
          title="Switch to database research only"
        >
          <Search className="h-3 w-3 shrink-0" />
          <span className="truncate">{active.shortLabel}</span>
          <X className="h-3 w-3 shrink-0 opacity-70" />
        </button>
      )}
    </div>
  );
}
