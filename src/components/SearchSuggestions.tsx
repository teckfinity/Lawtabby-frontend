import { useEffect, useRef, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Users, FileText } from "lucide-react";
import { useCitationSearchSuggestions } from "@/api/hooks/useCitationMaps";
import type { CitationSearchSuggestion } from "@/api/ai-features/citation-maps";

interface SearchSuggestionsProps {
  searchQuery: string;
  /** Query already loaded into the graph — suggestions stay closed for it. */
  committedQuery?: string;
  onSelectSuggestion: (suggestion: CitationSearchSuggestion) => void;
  children: React.ReactNode;
}

export const SearchSuggestions = ({ searchQuery, committedQuery = "", onSelectSuggestion, children }: SearchSuggestionsProps) => {
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Query the user already committed (Enter or suggestion click) — don't reopen for it.
  const committedRef = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestions = [] } = useCitationSearchSuggestions(debouncedQuery);

  useEffect(() => {
    const q = searchQuery.trim();
    setOpen(
      q.length >= 2 &&
        suggestions.length > 0 &&
        q !== committedRef.current &&
        q !== committedQuery.trim()
    );
  }, [searchQuery, suggestions, committedQuery]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'case': return <BookOpen className="h-4 w-4" />;
      case 'topic': return <Scale className="h-4 w-4" />;
      case 'judge': return <Users className="h-4 w-4" />;
      case 'principle': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'case': return 'bg-legal-primary/10 text-legal-primary';
      case 'topic': return 'bg-legal-info/10 text-legal-info';
      case 'judge': return 'bg-legal-success/10 text-legal-success';
      case 'principle': return 'bg-legal-warning/10 text-legal-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'case': return 'Case';
      case 'topic': return 'Topic';
      case 'judge': return 'Judge';
      case 'principle': return 'Principle';
      default: return type;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Anchor, not Trigger: Trigger injects type="button" onto the input,
          which makes it impossible to type in the search bar. */}
      <PopoverAnchor asChild>
        <div
          className="w-full"
          onKeyDownCapture={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              committedRef.current = searchQuery.trim();
              setOpen(false);
            }
          }}
        >
          {children}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-96 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {suggestions.length === 0 ? (
              <CommandEmpty>No suggestions found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Search Suggestions">
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`${suggestion.type}-${index}`}
                    value={suggestion.title}
                    onSelect={() => {
                      committedRef.current = suggestion.title.trim();
                      onSelectSuggestion(suggestion);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <div className="mt-0.5">
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{suggestion.title}</span>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(suggestion.type)}`}>
                          {getTypeLabel(suggestion.type)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.description}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
