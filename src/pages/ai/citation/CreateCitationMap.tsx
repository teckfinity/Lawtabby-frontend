import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Download,
  Share2,
  BookOpen,
  Link2,
  Target,
  Printer
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

const CreateCitationMap = () => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMap, setGeneratedMap] = useState<GeneratedMap | null>(null);
  const [selectedCases, setSelectedCases] = useState<CitationCaseNode[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [mapTitle, setMapTitle] = useState("");

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
              <h1 className="text-3xl font-bold text-foreground">Create Citation Map</h1>
              <p className="text-muted-foreground">
                Build a visual network of case relationships and legal precedents
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
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Focus Area (Optional)</label>
                      <Textarea 
                        placeholder="Describe the legal focus or theme of this citation network..."
                        className="min-h-[80px] resize-none"
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

                      {/* Visualization Placeholder */}
                      <div className="h-80 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-legal-primary/5 to-legal-info/5">
                          {/* Network nodes representing the selected cases */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-20 h-20 bg-legal-primary rounded-full flex items-center justify-center text-white font-bold shadow-legal text-xs text-center px-1">
                              {generatedMap.centralCase?.title.split(' ')[0]}
                            </div>
                          </div>
                          
                          {generatedMap.network.nodes
                            .filter((n) => n.id !== String(generatedMap.centralCase?.opinion_id))
                            .slice(0, 8)
                            .map((case_, index, arr) => {
                            const angle = (index * 2 * Math.PI) / Math.max(arr.length, 1);
                            const radius = 120;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            
                            return (
                              <div 
                                key={case_.id}
                                className="absolute w-12 h-12 bg-legal-info rounded-full flex items-center justify-center text-white text-xs font-medium shadow-legal"
                                style={{ 
                                  left: `calc(50% + ${x}px - 24px)`, 
                                  top: `calc(50% + ${y}px - 24px)` 
                                }}
                                title={case_.title}
                              >
                                {case_.title.split(' ')[0].substring(0, 3)}
                              </div>
                            );
                          })}
                        </div>

                        <div className="text-center z-10 bg-background/90 p-6 rounded-lg">
                          <Network className="h-12 w-12 text-legal-primary mx-auto mb-3" />
                          <h3 className="text-lg font-semibold mb-2">Interactive Citation Network</h3>
                          <p className="text-sm text-muted-foreground">
                            Network visualization with {generatedMap.network.total_nodes} connected cases
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1" onClick={() => window.print()}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Map
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Map
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast("Map link copied to clipboard!");
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Map
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => navigate("/ai/citation-maps")}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Explore Network
                        </Button>
                      </div>
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

            {/* Network Stats */}
            {selectedCases.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-legal-primary" />
                    Network Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-legal-primary">{selectedCases.length}</div>
                      <p className="text-xs text-muted-foreground">Nodes</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-legal-info">{Math.max(0, selectedCases.length - 1)}</div>
                      <p className="text-xs text-muted-foreground">Connections</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Citations</span>
                      <span className="font-medium">
                        {selectedCases.reduce((sum, c) => sum + c.citations, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Influence</span>
                      <span className="font-medium">
                        {selectedCases.length > 0 ? 
                          Math.floor(selectedCases.reduce((sum, c) => sum + c.influence, 0) / selectedCases.length) 
                          : 0}%
                      </span>
                    </div>
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
