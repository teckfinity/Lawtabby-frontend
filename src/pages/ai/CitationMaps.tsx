import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CitationNetwork } from "@/components/CitationNetwork";
import { FilterModal } from "@/components/FilterModal";
import { SearchSuggestions } from "@/components/SearchSuggestions";
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

const CitationMaps = () => {
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'network' | 'timeline'>('network');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    courts: [],
    categories: [],
    yearRange: [1800, 2024],
    minCitations: 0,
    minInfluence: 0
  });
  
  const featuredCases = [
    {
      id: 1,
      title: "Brown v. Board of Education",
      year: "1954",
      citations: 12847,
      influence: 98,
      category: "Constitutional",
      court: "Supreme Court",
      description: "Landmark case declaring racial segregation in public schools unconstitutional. Overturned Plessy v. Ferguson and established equal protection principles.",
      keyWords: ["segregation", "education", "equal protection", "constitutional"]
    },
    {
      id: 2,
      title: "Miranda v. Arizona", 
      year: "1966",
      citations: 8934,
      influence: 95,
      category: "Criminal",
      court: "Supreme Court",
      description: "Established Miranda rights requiring police to inform suspects of constitutional rights before custodial interrogation.",
      keyWords: ["miranda rights", "criminal", "interrogation", "fifth amendment"]
    },
    {
      id: 3,
      title: "Roe v. Wade",
      year: "1973", 
      citations: 7562,
      influence: 92,
      category: "Privacy Rights",
      court: "Supreme Court",
      description: "Established constitutional right to abortion under the privacy doctrine of the Due Process Clause.",
      keyWords: ["privacy", "abortion", "due process", "reproductive rights"]
    },
    {
      id: 4,
      title: "Gideon v. Wainwright",
      year: "1963",
      citations: 6789,
      influence: 88,
      category: "Criminal",
      court: "Supreme Court",
      description: "Guaranteed the right to legal counsel for criminal defendants who cannot afford an attorney.",
      keyWords: ["right to counsel", "criminal defense", "due process", "equal justice"]
    },
    {
      id: 5,
      title: "Hadley v. Baxendale",
      year: "1854",
      citations: 9876,
      influence: 92,
      category: "Contract",
      court: "Court of Exchequer",
      description: "Established the rule for consequential damages in contract law, limiting recovery to reasonably foreseeable damages.",
      keyWords: ["contract", "damages", "foreseeability", "commercial law"]
    }
  ];

  const networkStats = [
    { label: "Cases Mapped", value: "2.4M", icon: BookOpen },
    { label: "Citation Links", value: "15.7M", icon: Link2 },
    { label: "Influence Score", value: "94.2", icon: TrendingUp },
    { label: "Updated", value: "Daily", icon: Clock }
  ];

  const recentMaps = [
    { title: "Contract Law Evolution", cases: 1247, created: "2 hours ago" },
    { title: "Fourth Amendment Cases", cases: 892, created: "1 day ago" },
    { title: "Employment Discrimination", cases: 567, created: "3 days ago" }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      toast("Loading citation network for: " + query);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? zoomLevel * 1.2 : zoomLevel / 1.2;
    setZoomLevel(Math.max(0.5, Math.min(3, newZoom)));
    toast(`Zoom ${direction === 'in' ? 'in' : 'out'}: ${Math.round(newZoom * 100)}%`);
  };

  const handleDownload = () => {
    toast("Downloading citation network as PDF...");
    // Simulate download
    setTimeout(() => {
      toast("Citation network downloaded successfully!");
    }, 2000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast("Citation network link copied to clipboard!");
  };

  const handleSaveMap = () => {
    if (!searchQuery) {
      toast("Please search for cases first to save the map");
      return;
    }
    toast("Citation map saved to your library!");
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
              <Card key={index} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <stat.icon className="h-6 w-6 text-legal-info" />
                  </div>
                </CardContent>
              </Card>
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
                      searchQuery={searchQuery}
                      onSelectSuggestion={(suggestion) => {
                        setSearchQuery(suggestion);
                        handleSearch(suggestion);
                      }}
                    >
                      <Input
                        placeholder="Search cases, judges, or legal concepts..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch(searchQuery);
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
                    onClick={() => handleSearch(searchQuery)}
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </Button>
                </div>

                {/* Citation Network Visualization */}
                <CitationNetwork
                  searchQuery={searchQuery}
                  viewMode={viewMode}
                  onNodeSelect={(node) => setSelectedCase(node)}
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
                  {featuredCases.map((case_) => (
                    <div 
                      key={case_.id} 
                      className="p-3 border border-border rounded-lg hover:shadow-legal transition-all cursor-pointer hover:scale-[1.02] animate-fade-in"
                      onClick={() => {
                        setSelectedCase(case_);
                        setSearchQuery(case_.title);
                        handleSearch(case_.title);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm leading-tight">{case_.title}</h4>
                        <Badge variant="secondary" className="text-xs">{case_.year}</Badge>
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
                            setSearchQuery(case_.title);
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
                  {recentMaps.map((map, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{map.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {map.cases} cases • {map.created}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSearchQuery(map.title.toLowerCase());
                          handleSearch(map.title.toLowerCase());
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
                      setSearchQuery("Brown v. Board of Education");
                      handleSearch("Brown v. Board of Education");
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search by Case Name
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full justify-start"
                    onClick={() => {
                      const topics = ["Constitutional Law", "Criminal Law", "Civil Rights", "Contract Law"];
                      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                      setSearchQuery(randomTopic);
                      handleSearch(randomTopic);
                      toast(`Exploring ${randomTopic} cases...`);
                    }}
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
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.csv,.txt,.json';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          toast(`Processing case list from ${file.name}...`);
                          setTimeout(() => {
                            setSearchQuery("Uploaded case list");
                            handleSearch("Uploaded case list");
                          }, 2000);
                        }
                      };
                      input.click();
                    }}
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
                    setSearchQuery("Supreme Court decisions 2023");
                    handleSearch("Supreme Court decisions 2023");
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Recent Supreme Court
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSearchQuery("Circuit split cases");
                    handleSearch("Circuit split cases");
                  }}
                >
                  <Network className="h-4 w-4 mr-2" />
                  Circuit Splits
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setSearchQuery("Overruled precedents");
                    handleSearch("Overruled precedents");
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