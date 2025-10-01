import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Users, FileText, Calendar, TrendingUp } from "lucide-react";

interface SearchSuggestion {
  title: string;
  type: 'case' | 'topic' | 'judge' | 'principle';
  description: string;
  icon: React.ReactNode;
  keywords: string[];
}

interface SearchSuggestionsProps {
  searchQuery: string;
  onSelectSuggestion: (suggestion: string) => void;
  children: React.ReactNode;
}

export const SearchSuggestions = ({ searchQuery, onSelectSuggestion, children }: SearchSuggestionsProps) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  const allSuggestions: SearchSuggestion[] = [
    // Landmark Cases
    {
      title: "Brown v. Board of Education",
      type: "case",
      description: "School desegregation landmark case",
      icon: <BookOpen className="h-4 w-4" />,
      keywords: ["brown", "board", "education", "segregation", "constitutional", "equal protection"]
    },
    {
      title: "Miranda v. Arizona",
      type: "case", 
      description: "Criminal rights and police procedure",
      icon: <BookOpen className="h-4 w-4" />,
      keywords: ["miranda", "arizona", "criminal", "rights", "interrogation", "fifth amendment"]
    },
    {
      title: "Gideon v. Wainwright",
      type: "case",
      description: "Right to counsel in criminal cases",
      icon: <BookOpen className="h-4 w-4" />,
      keywords: ["gideon", "wainwright", "counsel", "criminal", "defense", "sixth amendment"]
    },
    {
      title: "Hadley v. Baxendale",
      type: "case",
      description: "Contract damages and foreseeability",
      icon: <BookOpen className="h-4 w-4" />,
      keywords: ["hadley", "baxendale", "contract", "damages", "foreseeability", "commercial"]
    },
    {
      title: "Roe v. Wade",
      type: "case",
      description: "Privacy rights and reproductive freedom",
      icon: <BookOpen className="h-4 w-4" />,
      keywords: ["roe", "wade", "privacy", "abortion", "reproductive", "due process"]
    },
    
    // Legal Topics
    {
      title: "Constitutional Law",
      type: "topic",
      description: "Cases involving constitutional interpretation",
      icon: <Scale className="h-4 w-4" />,
      keywords: ["constitutional", "amendment", "rights", "supreme court", "interpretation"]
    },
    {
      title: "Criminal Law",
      type: "topic",
      description: "Criminal procedure and defendant rights",
      icon: <Scale className="h-4 w-4" />,
      keywords: ["criminal", "procedure", "defendant", "prosecution", "evidence", "trial"]
    },
    {
      title: "Contract Law",
      type: "topic",
      description: "Commercial agreements and remedies",
      icon: <Scale className="h-4 w-4" />,
      keywords: ["contract", "agreement", "commercial", "breach", "remedies", "damages"]
    },
    {
      title: "Civil Rights",
      type: "topic",
      description: "Equal protection and discrimination cases",
      icon: <Scale className="h-4 w-4" />,
      keywords: ["civil rights", "discrimination", "equal protection", "voting", "housing"]
    },
    {
      title: "Education Law",
      type: "topic",
      description: "School policies and student rights",
      icon: <Scale className="h-4 w-4" />,
      keywords: ["education", "school", "student", "teacher", "policy", "funding"]
    },

    // Legal Principles
    {
      title: "Due Process",
      type: "principle",
      description: "Fundamental fairness in legal proceedings",
      icon: <FileText className="h-4 w-4" />,
      keywords: ["due process", "fairness", "procedure", "constitutional", "rights"]
    },
    {
      title: "Equal Protection",
      type: "principle",
      description: "Constitutional guarantee of equal treatment",
      icon: <FileText className="h-4 w-4" />,
      keywords: ["equal protection", "discrimination", "classification", "constitutional"]
    },
    {
      title: "Right to Counsel",
      type: "principle",
      description: "Sixth Amendment guarantee of legal representation",
      icon: <FileText className="h-4 w-4" />,
      keywords: ["counsel", "attorney", "representation", "sixth amendment", "criminal"]
    },

    // Notable Judges
    {
      title: "Earl Warren",
      type: "judge",
      description: "Chief Justice (1953-1969), Warren Court",
      icon: <Users className="h-4 w-4" />,
      keywords: ["earl warren", "chief justice", "warren court", "civil rights"]
    },
    {
      title: "William Brennan",
      type: "judge", 
      description: "Associate Justice (1956-1990)",
      icon: <Users className="h-4 w-4" />,
      keywords: ["william brennan", "associate justice", "liberal", "criminal rights"]
    },
    {
      title: "Thurgood Marshall",
      type: "judge",
      description: "First African American Supreme Court Justice",
      icon: <Users className="h-4 w-4" />,
      keywords: ["thurgood marshall", "civil rights", "first african american", "naacp"]
    }
  ];

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = allSuggestions.filter(suggestion => 
        suggestion.keywords.some(keyword => 
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        ) || 
        suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8);
      
      setSuggestions(filtered);
      setOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [searchQuery]);

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
      <PopoverContent className="w-96 p-0" align="start">
        <Command>
          <CommandList>
            {suggestions.length === 0 ? (
              <CommandEmpty>No suggestions found.</CommandEmpty>
            ) : (
              <CommandGroup heading="Search Suggestions">
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    value={suggestion.title}
                    onSelect={() => {
                      onSelectSuggestion(suggestion.title);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <div className="mt-0.5">
                      {suggestion.icon}
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