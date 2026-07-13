import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CitationNetwork } from "@/components/CitationNetwork";
import { FilterModal } from "@/components/FilterModal";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useCitationFilterOptions,
  useInfluentialCases,
  useSaveCitationMap,
  useSavedCitationMaps,
} from "@/api/hooks/useCitationMaps";
import type {
  CitationCaseNode,
  CitationNetworkFilters,
  CitationNetworkResponse,
} from "@/api/ai-features/citation-maps";
import { 
  Network, 
  Search, 
  Share2, 
  Filter, 
  ZoomIn, 
  Download, 
  Eye,
  Link2,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Upload,
  FileText,
  Save,
  Plus,
  Zap,
  Calendar,
  TrendingDown,
  Printer
} from "lucide-react";

interface FilterState {
  courts: string[];
  categories: string[];
  yearRange: [number, number];
  minCitations: number;
  minInfluence: number;
}

const formatCompact = (value: number | undefined): string => {
  if (value === undefined || value === null) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const formatRelativeTime = (iso: string): string => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) return `${Math.max(diffMins, 1)} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const CitationMaps = () => {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<CitationCaseNode | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState<CitationNetworkResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("citationMapsRecentSearches");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
    } catch {
      return [];
    }
  });
  const [viewMode, setViewMode] = useState<'network' | 'timeline'>('network');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    courts: [],
    categories: [],
    yearRange: [1800, new Date().getFullYear()],
    minCitations: 0,
    minInfluence: 0
  });

  const { data: featuredCases = [], isLoading: featuredLoading } = useInfluentialCases(5);
  const { data: savedMaps = [] } = useSavedCitationMaps();
  const { data: filterOptions } = useCitationFilterOptions();
  const saveMapMutation = useSaveCitationMap();

  const apiFilters: CitationNetworkFilters = useMemo(() => {
    const yearMin = filterOptions?.year_min ?? 1800;
    const yearMax = filterOptions?.year_max ?? new Date().getFullYear();
    return {
      courts: filters.courts.length ? filters.courts : undefined,
      categories: filters.categories.length ? filters.categories : undefined,
      year_from: filters.yearRange[0] > yearMin ? filters.yearRange[0] : undefined,
      year_to: filters.yearRange[1] < yearMax ? filters.yearRange[1] : undefined,
      min_citations: filters.minCitations || undefined,
      min_influence: filters.minInfluence || undefined,
    };
  }, [filters, filterOptions]);

  const networkStats = useMemo(() => {
    const hasCurrentGraph = !!currentNetwork && currentNetwork.nodes.length > 0;
    if (hasCurrentGraph && currentNetwork) {
      const nodes = currentNetwork.nodes;
      const landmarkCount = nodes.filter((n) => n.influence >= 75).length;
      const avgInfluence = nodes.length
        ? (nodes.reduce((sum, n) => sum + n.influence, 0) / nodes.length).toFixed(1)
        : "0.0";
      const courtCount = new Set(
        nodes.map((n) => n.court?.trim()).filter(Boolean)
      ).size;

      return [
        {
          label: "Network Size",
          value: `${formatCompact(currentNetwork.total_nodes)} cases · ${formatCompact(currentNetwork.total_links)} links`,
          icon: Network,
          tooltip:
            "Cases and real citation links (A cites B) in your current search network, not the whole database.",
        },
        {
          label: "Landmark Cases",
          value: String(landmarkCount),
          icon: Star,
          tooltip:
            "Cases in this network with influence score 75 or higher. These are the most cited precedents in your graph.",
        },
        {
          label: "Average Influence",
          value: `${avgInfluence}/100`,
          icon: TrendingUp,
          tooltip:
            "Average influence (1–100) across all cases in the current network. Higher means stronger precedents overall.",
        },
        {
          label: "Jurisdictions",
          value: `${courtCount} courts`,
          icon: BookOpen,
          tooltip:
            "How many distinct courts appear in this network. Shows whether your results span one court or multiple jurisdictions.",
        },
      ];
    }

    const exploredCases = savedMaps.reduce(
      (sum, map) => sum + (Array.isArray(map.opinion_ids) ? map.opinion_ids.length : 0),
      0
    );
    const lastActivity = savedMaps.length
      ? formatRelativeTime(savedMaps[0].created_at)
      : "No activity";

    return [
      {
        label: "Saved Maps",
        value: formatCompact(savedMaps.length),
        icon: Save,
        tooltip: "Citation maps you saved with the Save button. Reopen them from Recent Maps.",
      },
      {
        label: "Recent Searches",
        value: formatCompact(recentSearches.length),
        icon: Search,
        tooltip: "Your recent search queries on this browser (stored locally, not synced across devices).",
      },
      {
        label: "Cases Explored",
        value: formatCompact(exploredCases),
        icon: Network,
        tooltip: "Total cases included across your saved maps. A count of cases you have mapped before.",
      },
      {
        label: "Last Activity",
        value: lastActivity,
        icon: Clock,
        tooltip: "When you last saved a citation map to your account.",
      },
    ];
  }, [currentNetwork, savedMaps, recentSearches]);

  const handleSearch = (query: string) => {
    setSearchInput(query);
    setSearchQuery(query);
    if (query.trim()) {
      const normalized = query.trim();
      setRecentSearches((prev) => {
        const next = [normalized, ...prev.filter((q) => q.toLowerCase() !== normalized.toLowerCase())].slice(0, 10);
        localStorage.setItem("citationMapsRecentSearches", JSON.stringify(next));
        return next;
      });
      toast("Loading citation network for: " + query);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? zoomLevel * 1.2 : zoomLevel / 1.2;
    setZoomLevel(Math.max(0.5, Math.min(3, newZoom)));
    toast(`Zoom ${direction === 'in' ? 'in' : 'out'}: ${Math.round(newZoom * 100)}%`);
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Citation network link copied to clipboard!");
  };

  const handleSaveMap = () => {
    if (!searchQuery.trim()) {
      toast("Please search for cases first to save the map");
      return;
    }
    saveMapMutation.mutate({
      title: searchQuery.trim(),
      search_query: searchQuery.trim(),
      filters: apiFilters as Record<string, unknown>,
    });
  };

  const handleBrowseByTopic = () => {
    const topics = filterOptions?.categories?.length
      ? filterOptions.categories
      : ["Constitutional Law", "Criminal Law", "Civil Rights", "Contract Law"];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    handleSearch(randomTopic);
    toast(`Exploring ${randomTopic} cases...`);
  };

  const handleUploadCaseList = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      toast(`Processing case list from ${file.name}...`);
      try {
        const text = await file.text();
        const firstCase = text
          .split(/[\n,;]+/)
          .map((s) => s.replace(/^["']|["']$/g, "").trim())
          .find((s) => s.length > 2);
        if (firstCase) {
          handleSearch(firstCase);
        } else {
          toast.error("No case names found in the file");
        }
      } catch {
        toast.error("Could not read the file");
      }
    };
    input.click();
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-legal-info rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Citation Maps</h1>
              <p className="text-muted-foreground">
                Visual exploration of case relationships and legal precedent networks
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {networkStats.map((stat, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Card className="shadow-card cursor-help transition-shadow hover:shadow-legal">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                        <stat.icon className="h-6 w-6 text-legal-info shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px] text-sm">
                  {stat.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visualization Area */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5 text-legal-primary" />
                      Interactive Citation Network
                    </CardTitle>
                    <CardDescription>
                      Explore case relationships and influence patterns
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleZoom('in')}
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleDownload}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => window.print()}
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleShare}
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleSaveMap}
                      disabled={saveMapMutation.isPending}
                      title="Save Map"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search Bar with Suggestions */}
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <SearchSuggestions
                      searchQuery={searchInput}
                      onSelectSuggestion={(suggestion) => {
                        handleSearch(suggestion);
                      }}
                    >
                      <Input
                        placeholder="Search cases, judges, or legal concepts..."
                        className="pl-9"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch(searchInput);
                          }
                        }}
                      />
                    </SearchSuggestions>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {(filters.courts.length > 0 || filters.categories.length > 0) && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {filters.courts.length + filters.categories.length}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    onClick={() => handleSearch(searchInput)}
                    disabled={!searchInput.trim()}
                  >
                    Search
                  </Button>
                </div>

                {/* Citation Network Visualization */}
                <CitationNetwork
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  filters={apiFilters}
                  onNodeSelect={(node) => setSelectedCase(node)}
                  onExpandNode={(node) => handleSearch(node.title)}
                  onNetworkDataChange={setCurrentNetwork}
                />

                {/* Network Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-primary rounded-full" />
                      <span>Primary Case</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-info rounded-full" />
                      <span>Citations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-success rounded-full" />
                      <span>Related</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === 'network' ? 'default' : 'outline'}
                      onClick={() => setViewMode('network')}
                    >
                      Network View
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'timeline' ? 'default' : 'outline'}
                      onClick={() => setViewMode('timeline')}
                    >
                      Timeline View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Cases */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-legal-warning" />
                  Most Influential Cases
                </CardTitle>
                <CardDescription>
                  Highly cited landmark decisions - Click to explore networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {featuredLoading && (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 border border-border rounded-lg">
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-full mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </>
                  )}
                  {!featuredLoading && featuredCases.length === 0 && (
                    <div className="text-center py-6">
                      <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No cases in the database yet
                      </p>
                    </div>
                  )}
                  {featuredCases.map((case_) => (
                    <div 
                      key={case_.id} 
                      className="p-3 border border-border rounded-lg hover:shadow-legal transition-all cursor-pointer hover:scale-[1.02] animate-fade-in"
                      onClick={() => {
                        setSelectedCase(case_);
                        handleSearch(case_.title);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm leading-tight">{case_.title}</h4>
                        {case_.year && <Badge variant="secondary" className="text-xs">{case_.year}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {case_.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Link2 className="h-3 w-3" />
                            {case_.citations.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {case_.influence}%
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSearch(case_.title);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Maps */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Maps
                </CardTitle>
                <CardDescription>
                  Your recently created networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedMaps.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No saved maps yet. Search and press Save to keep one.
                    </p>
                  )}
                  {savedMaps.slice(0, 3).map((map) => (
                    <div key={map.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{map.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(map.created_at)}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          handleSearch(map.search_query || map.title);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    setSearchInput("");
                    setSearchQuery("");
                    setViewMode('network');
                    toast("Ready to create a new citation map! Search for cases to begin.");
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Create New Map
                </Button>
              </CardContent>
            </Card>

            {/* Create New Map - Moved to middle for better access */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Create New Map
                </CardTitle>
                <CardDescription className="text-white/80">
                  Quick actions to start exploring case relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (featuredCases.length > 0) {
                        handleSearch(featuredCases[0].title);
                      } else {
                        toast("Search for a case by name above");
                      }
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search by Case Name
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start"
                    onClick={handleBrowseByTopic}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse by Topic
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start"
                    onClick={() => navigate("/ai/citation-maps/create")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Custom Map
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start"
                    onClick={handleUploadCaseList}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Case List
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-legal-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common mapping tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleSearch("Supreme Court");
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Recent Supreme Court
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleSearch("Circuit");
                  }}
                >
                  <Network className="h-4 w-4 mr-2" />
                  Circuit Splits
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (featuredCases.length > 1) {
                      handleSearch(featuredCases[1].title);
                    } else {
                      handleSearch("Overruled");
                    }
                  }}
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Overruled Cases
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterModal
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </div>
  );
};

export default CitationMaps;
