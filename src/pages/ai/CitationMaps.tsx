import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CitationNetwork, type NetworkTarget } from "@/components/CitationNetwork";
import { FilterModal } from "@/components/FilterModal";
import { SearchSuggestions } from "@/components/SearchSuggestions";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useCitationFilterOptions,
  useDeleteCitationMap,
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
  ZoomOut,
  Download,
  Eye,
  Link2,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  Upload,
  Save,
  Plus,
  Trash2,
  Maximize,
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

/** Nature-of-suit values arrive like "368 Asbestos personal injury - Prod. Liab." — strip the code. */
const cleanTopicLabel = (topic: string): string =>
  topic.replace(/^\s*\d+\s*/, "").trim() || topic;

const CitationMaps = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [target, setTarget] = useState<NetworkTarget | null>(() => {
    // ?ids=1,2,3&label=… → map of specific cases (from Create Custom Map)
    const ids = searchParams.get("ids");
    if (ids) {
      const opinion_ids = ids.split(",").map(Number).filter(Boolean);
      if (opinion_ids.length > 0) {
        return {
          opinion_ids,
          label: searchParams.get("label") || `${opinion_ids.length} selected cases`,
        };
      }
    }
    const q = searchParams.get("q");
    return q ? { q, label: q } : null;
  });
  const [currentNetwork, setCurrentNetwork] = useState<CitationNetworkResponse | null>(null);
  const [viewMode, setViewMode] = useState<"network" | "timeline">("network");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    courts: [],
    categories: [],
    yearRange: [1800, new Date().getFullYear()],
    minCitations: 0,
    minInfluence: 0,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const graphCardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [featuredLimit, setFeaturedLimit] = useState(5);
  const { data: featuredCases = [], isLoading: featuredLoading } = useInfluentialCases(featuredLimit);
  const { data: savedMaps = [] } = useSavedCitationMaps();
  const { data: filterOptions } = useCitationFilterOptions();
  const saveMapMutation = useSaveCitationMap();
  const deleteMapMutation = useDeleteCitationMap();

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
      const courtCount = new Set(nodes.map((n) => n.court?.trim()).filter(Boolean)).size;

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
        label: "Cases Explored",
        value: formatCompact(exploredCases),
        icon: Network,
        tooltip: "Total cases included across your saved maps.",
      },
      {
        label: "Last Activity",
        value: lastActivity,
        icon: Clock,
        tooltip: "When you last saved a citation map to your account.",
      },
      {
        label: "Landmark Cases",
        value: formatCompact(featuredCases.length),
        icon: Star,
        tooltip: "Most influential cases available in the sidebar to start exploring from.",
      },
    ];
  }, [currentNetwork, savedMaps, featuredCases]);

  const scrollToGraph = () => {
    graphCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadTarget = useCallback(
    (next: NetworkTarget, { scroll = false }: { scroll?: boolean } = {}) => {
      setTarget(next);
      setSearchInput(next.label);
      setSearchParams(next.q ? { q: next.q } : {}, { replace: true });
      if (scroll) scrollToGraph();
    },
    [setSearchParams]
  );

  const handleSearch = (query: string, opts: { scroll?: boolean } = {}) => {
    const normalized = query.trim();
    if (!normalized) return;
    loadTarget({ q: normalized, label: normalized }, opts);
  };

  /** Rebuild the graph centred on one specific case (suggestion click / expand). */
  const handleOpenCase = (node: { opinion_id?: number | null; title: string }, opts: { scroll?: boolean } = {}) => {
    if (node.opinion_id && target?.opinion_id === node.opinion_id) {
      toast.info(`“${node.title}” is already the center of this map.`);
      return;
    }
    if (node.opinion_id) {
      loadTarget({ opinion_id: node.opinion_id, label: node.title }, opts);
    } else {
      handleSearch(node.title, opts);
    }
  };

  const handleNetworkData = useCallback(
    (network: CitationNetworkResponse | null) => {
      setCurrentNetwork(network);
      if (network && network.total_nodes <= 1) {
        toast.info(
          "This case has no citation links in the database yet, so only the case itself is shown."
        );
      }
    },
    []
  );

  const handleZoom = (direction: "in" | "out" | "reset") => {
    setZoomLevel((prev) => {
      if (direction === "reset") return 1;
      const next = direction === "in" ? prev * 1.25 : prev / 1.25;
      return Math.max(0.5, Math.min(3, next));
    });
  };

  /** Export the visible network SVG as a PNG image. */
  const handleDownload = () => {
    if (!currentNetwork || currentNetwork.nodes.length === 0) {
      toast.info("Search for a case first, then you can download the map as an image.");
      return;
    }
    if (viewMode === "timeline" || !svgRef.current) {
      toast.info("Switch to Network View to download the map as an image.");
      return;
    }
    const svg = svgRef.current;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const vb = svg.getAttribute("viewBox") ?? "0 0 800 440";
    clone.setAttribute("viewBox", vb);

    const data = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = 800 * scale;
      canvas.height = 440 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `citation-map-${(target?.label || "network").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Citation map image downloaded.");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error("Could not export the image. Please try again.");
    };
    img.src = url;
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied. Anyone opening it sees this same map.");
    } catch {
      toast.error("Could not copy the link to the clipboard.");
    }
  };

  const handleSaveMap = () => {
    if (!target || !currentNetwork || currentNetwork.nodes.length === 0) {
      toast.info("Search for a case first, then save the map you see.");
      return;
    }
    saveMapMutation.mutate({
      title: target.label,
      search_query: target.q ?? target.label,
      opinion_ids: currentNetwork.nodes.map((n) => n.opinion_id),
      filters: apiFilters as Record<string, unknown>,
      node_count: currentNetwork.total_nodes,
      edge_count: currentNetwork.total_links,
    });
  };

  const handleTopicSelect = (topic: string) => {
    setIsTopicsOpen(false);
    loadTarget({ q: topic, label: cleanTopicLabel(topic) }, { scroll: true });
    toast.info(`Showing the citation network for “${cleanTopicLabel(topic)}” cases.`);
  };

  const handleUploadCaseList = () => {
    uploadInputRef.current?.click();
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const names = text
        .split(/[\n;]+/)
        .map((s) => s.split(",")[0].replace(/^["']|["']$/g, "").trim())
        .filter((s) => s.length > 2 && !/^case[\s_-]?name$/i.test(s));
      if (names.length === 0) {
        toast.error(
          "No case names found. Use one case name per line (e.g. “Twombly”), optionally as a CSV with the name in the first column."
        );
        return;
      }
      handleSearch(names[0], { scroll: true });
      toast.success(
        names.length === 1
          ? `Loaded “${names[0]}” from ${file.name}.`
          : `Found ${names.length} case names in ${file.name}. Showing the first: “${names[0]}”. Search the others any time.`
      );
    } catch {
      toast.error("Could not read the file.");
    }
  };

  const handleNewMap = () => {
    setTarget(null);
    setSearchInput("");
    setCurrentNetwork(null);
    setViewMode("network");
    setSearchParams({}, { replace: true });
    searchInputRef.current?.focus();
  };

  const topics = (filterOptions?.categories ?? []).slice(0, 12);

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
                See which precedents a case relies on and which later cases cite it,
                so you can judge the strength of an authority at a glance
              </p>
            </div>
          </div>

          {/* Stats */}
          <p className="text-sm text-muted-foreground mb-2">
            {currentNetwork && currentNetwork.nodes.length > 0
              ? "About the map on screen (hover a card for details):"
              : "Your activity so far (hover a card for details):"}
          </p>
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
          <div className="lg:col-span-2" ref={graphCardRef}>
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handleZoom("in")}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom in ({Math.round(zoomLevel * 100)}%)</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handleZoom("out")}>
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom out</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handleZoom("reset")}>
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset zoom</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={handleDownload}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download map as PNG image</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={handleShare}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy a shareable link to this map</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveMap}
                          disabled={saveMapMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save this map to Recent Maps</TooltipContent>
                    </Tooltip>
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
                      committedQuery={target?.label ?? ""}
                      onSelectSuggestion={(suggestion) => {
                        handleOpenCase({
                          opinion_id: suggestion.opinion_id,
                          title: suggestion.title,
                        });
                      }}
                    >
                      <Input
                        ref={searchInputRef}
                        placeholder="Search a case name (e.g. Twombly), judge, or topic…"
                        className="pl-9"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearch(searchInput);
                          }
                        }}
                      />
                    </SearchSuggestions>
                  </div>
                  <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {(filters.courts.length > 0 || filters.categories.length > 0) && (
                      <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                        {filters.courts.length + filters.categories.length}
                      </Badge>
                    )}
                  </Button>
                  <Button onClick={() => handleSearch(searchInput)} disabled={!searchInput.trim()}>
                    Search
                  </Button>
                </div>

                {/* Citation Network Visualization */}
                <CitationNetwork
                  target={target}
                  viewMode={viewMode}
                  filters={apiFilters}
                  zoom={zoomLevel}
                  svgRef={svgRef}
                  onExpandNode={(node) => handleOpenCase(node)}
                  onNetworkDataChange={handleNetworkData}
                />

                {/* Legend + view toggle */}
                <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-primary rounded-full" />
                      <span>Primary case</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-info rounded-full" />
                      <span>Precedents it cites</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-success rounded-full" />
                      <span>Later cases citing it</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-legal-warning rounded-full" />
                      <span>Other connections</span>
                    </div>
                    <span className="text-xs">Bigger circle = more influential</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={viewMode === "network" ? "default" : "outline"}
                      onClick={() => setViewMode("network")}
                    >
                      Network View
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={viewMode === "timeline" ? "default" : "outline"}
                          onClick={() => setViewMode("timeline")}
                        >
                          Timeline View
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Same cases, ordered by year, to see how the precedent developed over time</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start a new map */}
            <Card className="shadow-card bg-gradient-primary text-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Start a New Map
                </CardTitle>
                <CardDescription className="text-white/80">
                  Pick any starting point to explore case relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={handleNewMap}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search by Case Name
                    </Button>
                    <p className="text-xs text-white/70 mt-1 pl-1">
                      Type any case in the search bar.
                    </p>
                  </div>

                  <div>
                    <Popover open={isTopicsOpen} onOpenChange={setIsTopicsOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="secondary" className="w-full justify-start">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Browse by Topic
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-2" align="start">
                        <p className="text-xs text-muted-foreground px-2 pb-2">
                          Pick a legal area to see its citation network:
                        </p>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {topics.length === 0 && (
                            <p className="text-sm text-muted-foreground px-2 py-1">
                              No topics available yet.
                            </p>
                          )}
                          {topics.map((topic) => (
                            <Button
                              key={topic}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start font-normal"
                              onClick={() => handleTopicSelect(topic)}
                            >
                              {cleanTopicLabel(topic)}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-white/70 mt-1 pl-1">
                      Top cases in a legal area.
                    </p>
                  </div>

                  <div>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={handleUploadCaseList}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Case List
                    </Button>
                    <p className="text-xs text-white/70 mt-1 pl-1">
                      .txt or .csv, one case name per line.
                    </p>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleUploadFile}
                    />
                  </div>

                  <div>
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      onClick={() => navigate("/ai/citation-maps/create")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Custom Map
                    </Button>
                    <p className="text-xs text-white/70 mt-1 pl-1">
                      Pick 2+ specific cases and connect them.
                    </p>
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
                  The most-cited cases in the database. Click one to map its citations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Scrolls inside the card so "Show more" never stretches the sidebar */}
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
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
                      <p className="text-sm text-muted-foreground">No cases in the database yet</p>
                    </div>
                  )}
                  {featuredCases.map((case_) => (
                    <div
                      key={case_.id}
                      className="p-3 border border-border rounded-lg hover:shadow-legal transition-shadow cursor-pointer"
                      onClick={() => handleOpenCase(case_, { scroll: true })}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm leading-tight">{case_.title}</h4>
                        {case_.year && (
                          <Badge variant="secondary" className="text-xs">
                            {case_.year}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {case_.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1" title="Times cited by later cases">
                          <Link2 className="h-3 w-3" />
                          {case_.citations.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1" title="Influence score (relative to the most-cited case)">
                          <TrendingUp className="h-3 w-3" />
                          {case_.influence}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {!featuredLoading && featuredCases.length >= 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => setFeaturedLimit((prev) => (prev === 5 ? 15 : 5))}
                  >
                    {featuredLimit === 5 ? "Show more cases" : "Show fewer cases"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ranked by citation count. For any other case, use the search bar.
                </p>
              </CardContent>
            </Card>

            {/* Recent Maps */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-primary" />
                  Recent Maps
                </CardTitle>
                <CardDescription>Maps you saved. Click the eye icon to reopen one</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedMaps.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nothing saved yet. Search a case, then press the{" "}
                      <Save className="h-3 w-3 inline mx-0.5" /> button above the graph.
                    </p>
                  )}
                  {savedMaps.slice(0, 5).map((map) => (
                    <div
                      key={map.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{map.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {map.node_count > 0 && `${map.node_count} cases · `}
                          {formatRelativeTime(map.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Open this map"
                          onClick={() => {
                            if (Array.isArray(map.opinion_ids) && map.opinion_ids.length > 0) {
                              loadTarget(
                                { opinion_ids: map.opinion_ids, label: map.title },
                                { scroll: true }
                              );
                            } else {
                              handleSearch(map.search_query || map.title, { scroll: true });
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete this saved map"
                          onClick={() => deleteMapMutation.mutate(map.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
