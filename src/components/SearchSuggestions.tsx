import { useEffect, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Users, FileText } from "lucide-react";
import { useCitationSearchSuggestions } from "@/api/hooks/useCitationMaps";

interface SearchSuggestionsProps {
  searchQuery: string;
  onSelectSuggestion: (suggestion: string) => void;
  children: React.ReactNode;
}

export const SearchSuggestions = ({ searchQuery, onSelectSuggestion, children }: SearchSuggestionsProps) => {
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: suggestions = [] } = useCitationSearchSuggestions(debouncedQuery);

  useEffect(() => {
    if (searchQuery.length >= 2 && suggestions.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [searchQuery, suggestions]);

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
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
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
                      onSelectSuggestion(suggestion.title);
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
