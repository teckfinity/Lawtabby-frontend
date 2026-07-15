import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCitationCaseSearch, useSaveCitationMap } from "@/api/hooks/useCitationMaps";
import { getCitationNetwork, type CitationCaseNode, type CitationNetworkResponse } from "@/api/ai-features/citation-maps";
import {
  ArrowLeft,
  Network,
  Search,
  Plus,
  Trash2,
  Zap,
  BookOpen,
  Link2,
  Target,
} from "lucide-react";

interface GeneratedMap {
  title: string;
  centralCase: CitationCaseNode;
  connectedCases: number;
  totalCitations: number;
  influenceScore: number;
  generatedAt: string;
  network: CitationNetworkResponse;
}

const SELECTED_CASES_KEY = "createMapSelectedCases";
const MAP_TITLE_KEY = "createMapTitle";

const CreateCitationMap = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null);
  // Selections survive navigating away and back (sessionStorage).
  const [selectedCases, setSelectedCases] = useState<CitationCaseNode[]>(() => {
    try {
      const raw = sessionStorage.getItem(SELECTED_CASES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [mapTitle, setMapTitle] = useState(
    () => sessionStorage.getItem(MAP_TITLE_KEY) ?? ""
  );

  useEffect(() => {
    sessionStorage.setItem(SELECTED_CASES_KEY, JSON.stringify(selectedCases));
  }, [selectedCases]);

  useEffect(() => {
    sessionStorage.setItem(MAP_TITLE_KEY, mapTitle);
  }, [mapTitle]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: suggestedCases = [], isLoading: casesLoading } =
    useCitationCaseSearch(debouncedTerm, 10);
  const saveMapMutation = useSaveCitationMap();

  const handleAddCase = (case_: CitationCaseNode) => {
    if (!selectedCases.find(c => c.opinion_id === case_.opinion_id)) {
      setSelectedCases([...selectedCases, case_]);
    }
  };

  const handleRemoveCase = (opinionId: number) => {
    setSelectedCases(selectedCases.filter(c => c.opinion_id !== opinionId));
  };

  const handleGenerateMap = async () => {
    if (selectedCases.length === 0) return;

    setIsGenerating(true);
    try {
      const res = await getCitationNetwork({
        opinion_ids: selectedCases.map((c) => c.opinion_id),
        depth: 2,
      });
      const network = res.data;
      const totalCitations = network.nodes.reduce((sum, n) => sum + n.citations, 0);
      const influenceScore = network.nodes.length
        ? Math.floor(
            network.nodes.reduce((sum, n) => sum + n.influence, 0) / network.nodes.length
          )
        : 0;

      const map: GeneratedMap = {
        title: mapTitle.trim() || `Citation Network Analysis - ${selectedCases.length} Cases`,
        centralCase: selectedCases[0],
        connectedCases: Math.max(0, network.total_nodes - selectedCases.length),
        totalCitations,
        influenceScore,
        generatedAt: new Date().toLocaleString(),
        network,
      };
      setGeneratedMap(map);

      saveMapMutation.mutate({
        title: map.title,
        opinion_ids: selectedCases.map((c) => c.opinion_id),
        node_count: network.total_nodes,
        edge_count: network.total_links,
      });
    } catch {
      toast.error("Failed to generate the citation map. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredCases = suggestedCases;

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 lg:pl-12 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Citation Maps
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-legal-info rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Custom Citation Map</h1>
              <p className="text-muted-foreground">
                Pick two or more specific cases, for example the key authorities in your brief,
                and generate one combined map showing how they connect through citations.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Add Cases */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-legal-primary" />
                  Search & Add Cases
                </CardTitle>
                <CardDescription>
                  Search for cases to include in your citation network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases by name, citation, or keywords..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <p className="text-sm font-medium text-muted-foreground">
                    {debouncedTerm.trim()
                      ? `Results for "${debouncedTerm.trim()}"`
                      : "Suggested starting points (most-cited cases in the database)"}
                  </p>

                  <div className="space-y-3">
                    {filteredCases.map((case_) => (
                      <div key={case_.opinion_id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{case_.title}</h4>
                            {case_.year && <Badge variant="outline" className="text-xs">{case_.year}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{case_.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{case_.court}</span>
                            <span>{case_.citations.toLocaleString()} citations</span>
                            <span>Influence: {case_.influence}%</span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleAddCase(case_)}
                          disabled={!!selectedCases.find(c => c.opinion_id === case_.opinion_id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {selectedCases.find(c => c.opinion_id === case_.opinion_id) ? "Added" : "Add"}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {casesLoading && filteredCases.length === 0 && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-primary mx-auto mb-3"></div>
                      <p className="text-muted-foreground">Searching cases…</p>
                    </div>
                  )}

                  {!casesLoading && filteredCases.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Cases Found</h3>
                      <p className="text-muted-foreground">
                        Try different search terms or keywords
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Map Generation */}
            {selectedCases.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-legal-primary" />
                    Generate Citation Map
                  </CardTitle>
                  <CardDescription>
                    Create a visual network from your selected cases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Map Title</label>
                      <Input 
                        placeholder="Enter a name for your citation map" 
                        value={mapTitle}
                        onChange={(e) => setMapTitle(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      onClick={handleGenerateMap}
                      className="w-full bg-legal-primary hover:bg-legal-primary/90"
                      disabled={isGenerating || selectedCases.length === 0}
                    >
                      {isGenerating ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          Generating Network...
                        </>
                      ) : (
                        <>
                          <Network className="h-4 w-4 mr-2" />
                          Generate Citation Map ({selectedCases.length} cases)
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Map Display */}
            {(generatedMap || isGenerating) && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-legal-success" />
                    Generated Citation Map
                  </CardTitle>
                  <CardDescription>
                    Your interactive citation network is ready
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isGenerating ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-legal-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Building Citation Network</h3>
                      <p className="text-muted-foreground">
                        Analyzing case relationships and citation patterns...
                      </p>
                    </div>
                  ) : generatedMap && (
                    <div className="space-y-6">
                      {/* Map Info */}
                      <div className="p-6 bg-gradient-primary rounded-lg text-white">
                        <h3 className="text-xl font-bold mb-2">{generatedMap.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-2xl font-bold">{generatedMap.network.total_nodes}</div>
                            <p className="text-sm opacity-90">Cases</p>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{generatedMap.totalCitations.toLocaleString()}</div>
                            <p className="text-sm opacity-90">Citations</p>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{generatedMap.influenceScore}</div>
                            <p className="text-sm opacity-90">Influence Score</p>
                          </div>
                          <div>
                            <div className="text-2xl font-bold">{generatedMap.network.total_links}</div>
                            <p className="text-sm opacity-90">Connections</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          const ids = generatedMap.network.nodes
                            .map((n) => n.opinion_id)
                            .join(",");
                          navigate(
                            `/ai/citation-maps?ids=${ids}&label=${encodeURIComponent(generatedMap.title)}`
                          );
                        }}
                      >
                        <Network className="h-4 w-4 mr-2" />
                        Open Interactive Map
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        The map is also saved to Recent Maps on the Citation Maps page.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Cases */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-legal-primary" />
                  Selected Cases
                </CardTitle>
                <CardDescription>
                  Cases included in your network ({selectedCases.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCases.length === 0 ? (
                  <div className="text-center py-6">
                    <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Search and add cases to build your network
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCases.map((case_, index) => (
                      <div key={case_.opinion_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{case_.title}</span>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs">Primary</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{case_.year}</span>
                            <span>•</span>
                            <span>{case_.citations.toLocaleString()} citations</span>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleRemoveCase(case_.opinion_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selection summary */}
            {selectedCases.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-legal-primary" />
                    Selection Summary
                  </CardTitle>
                  <CardDescription>
                    A quick read on the cases you picked. The real connections
                    appear when you generate the map.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cases selected</span>
                    <span className="font-medium">{selectedCases.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Combined citations</span>
                    <span className="font-medium">
                      {selectedCases.reduce((sum, c) => sum + c.citations, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average influence</span>
                    <span className="font-medium">
                      {Math.floor(
                        selectedCases.reduce((sum, c) => sum + c.influence, 0) /
                          selectedCases.length
                      )}
                      /100
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCitationMap;
