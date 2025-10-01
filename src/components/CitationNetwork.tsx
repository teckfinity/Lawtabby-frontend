import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Link2, TrendingUp, Eye, Calendar, Scale, Users, FileText, ArrowRight } from "lucide-react";

interface CaseNode {
  id: string;
  title: string;
  year: string;
  citations: number;
  influence: number;
  category: string;
  court: string;
  x: number;
  y: number;
  description: string;
  judges: string[];
  outcome: string;
  keyLegalPrinciples: string[];
  impactScore: number;
  relatedAreas: string[];
}

interface CitationLink {
  source: string;
  target: string;
  strength: number;
}

interface CitationNetworkProps {
  searchQuery: string;
  viewMode: 'network' | 'timeline';
  onNodeSelect: (node: CaseNode) => void;
}

export const CitationNetwork = ({ searchQuery, viewMode, onNodeSelect }: CitationNetworkProps) => {
  const [nodes, setNodes] = useState<CaseNode[]>([]);
  const [links, setLinks] = useState<CitationLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<CaseNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Enhanced sample network data with detailed information
  const sampleNetworks = {
    "brown v. board": {
      nodes: [
        { 
          id: "brown", 
          title: "Brown v. Board of Education", 
          year: "1954", 
          citations: 12847, 
          influence: 98, 
          category: "Constitutional", 
          court: "Supreme Court", 
          x: 400, 
          y: 200, 
          description: "Landmark case that declared racial segregation in public schools unconstitutional, overturning Plessy v. Ferguson's 'separate but equal' doctrine.",
          judges: ["Earl Warren", "Hugo Black", "Felix Frankfurter"],
          outcome: "Unanimous decision for plaintiff",
          keyLegalPrinciples: ["Equal Protection Clause", "Desegregation", "Constitutional Interpretation"],
          impactScore: 98,
          relatedAreas: ["Education Law", "Civil Rights", "Constitutional Law"]
        },
        { 
          id: "plessy", 
          title: "Plessy v. Ferguson", 
          year: "1896", 
          citations: 5432, 
          influence: 85, 
          category: "Constitutional", 
          court: "Supreme Court", 
          x: 200, 
          y: 150, 
          description: "Established the 'separate but equal' doctrine that justified racial segregation for nearly 60 years.",
          judges: ["Henry Billings Brown", "John Marshall Harlan"],
          outcome: "7-1 decision for defendant",
          keyLegalPrinciples: ["Separate but Equal", "Racial Segregation", "14th Amendment"],
          impactScore: 85,
          relatedAreas: ["Civil Rights", "Constitutional Law", "Transportation Law"]
        },
        { 
          id: "cooper", 
          title: "Cooper v. Aaron", 
          year: "1958", 
          citations: 3241, 
          influence: 78, 
          category: "Constitutional", 
          court: "Supreme Court", 
          x: 600, 
          y: 150, 
          description: "Reinforced Brown decision and established federal supremacy in enforcing constitutional rights against state resistance.",
          judges: ["Earl Warren", "William Brennan", "Felix Frankfurter"],
          outcome: "Unanimous decision",
          keyLegalPrinciples: ["Federal Supremacy", "School Integration", "Constitutional Authority"],
          impactScore: 78,
          relatedAreas: ["Education Law", "Federal Law", "State Rights"]
        },
        { 
          id: "green", 
          title: "Green v. County School Board", 
          year: "1968", 
          citations: 2156, 
          influence: 72, 
          category: "Education", 
          court: "Supreme Court", 
          x: 500, 
          y: 300, 
          description: "Required school districts to take affirmative steps to eliminate racial segregation, rejecting 'freedom of choice' plans.",
          judges: ["William Brennan", "Earl Warren", "Thurgood Marshall"],
          outcome: "Unanimous decision",
          keyLegalPrinciples: ["Affirmative Desegregation", "Good Faith Compliance", "Educational Equity"],
          impactScore: 72,
          relatedAreas: ["Education Law", "Civil Rights", "Administrative Law"]
        },
        { 
          id: "swann", 
          title: "Swann v. Charlotte-Mecklenburg", 
          year: "1971", 
          citations: 1987, 
          influence: 69, 
          category: "Education", 
          court: "Supreme Court", 
          x: 300, 
          y: 300, 
          description: "Authorized the use of busing and other remedies to achieve racial integration in public schools.",
          judges: ["Warren Burger", "William Brennan", "Thurgood Marshall"],
          outcome: "Unanimous decision",
          keyLegalPrinciples: ["School Busing", "Remedial Integration", "Judicial Oversight"],
          impactScore: 69,
          relatedAreas: ["Education Law", "Transportation", "Urban Planning"]
        }
      ],
      links: [
        { source: "plessy", target: "brown", strength: 0.95 },
        { source: "brown", target: "cooper", strength: 0.85 },
        { source: "brown", target: "green", strength: 0.75 },
        { source: "cooper", target: "green", strength: 0.65 },
        { source: "green", target: "swann", strength: 0.55 }
      ]
    },
    "miranda v. arizona": {
      nodes: [
        { 
          id: "miranda", 
          title: "Miranda v. Arizona", 
          year: "1966", 
          citations: 8934, 
          influence: 95, 
          category: "Criminal", 
          court: "Supreme Court", 
          x: 400, 
          y: 200, 
          description: "Established the requirement that police must inform suspects of their constitutional rights before custodial interrogation.",
          judges: ["Earl Warren", "Hugo Black", "William Brennan"],
          outcome: "5-4 decision for plaintiff",
          keyLegalPrinciples: ["Miranda Rights", "Fifth Amendment", "Self-Incrimination"],
          impactScore: 95,
          relatedAreas: ["Criminal Law", "Constitutional Law", "Police Procedure"]
        },
        { 
          id: "escobedo", 
          title: "Escobedo v. Illinois", 
          year: "1964", 
          citations: 4521, 
          influence: 82, 
          category: "Criminal", 
          court: "Supreme Court", 
          x: 200, 
          y: 150, 
          description: "Extended the right to counsel to the interrogation phase when the investigation focuses on a particular suspect.",
          judges: ["Arthur Goldberg", "Earl Warren", "William Brennan"],
          outcome: "5-4 decision for plaintiff",
          keyLegalPrinciples: ["Right to Counsel", "Sixth Amendment", "Criminal Investigation"],
          impactScore: 82,
          relatedAreas: ["Criminal Law", "Due Process", "Investigation Procedures"]
        },
        { 
          id: "gideon", 
          title: "Gideon v. Wainwright", 
          year: "1963", 
          citations: 6789, 
          influence: 88, 
          category: "Criminal", 
          court: "Supreme Court", 
          x: 150, 
          y: 300, 
          description: "Guaranteed the right to legal counsel for criminal defendants in state courts who cannot afford an attorney.",
          judges: ["Hugo Black", "Earl Warren", "William Brennan"],
          outcome: "Unanimous decision",
          keyLegalPrinciples: ["Right to Counsel", "Due Process", "Equal Justice"],
          impactScore: 88,
          relatedAreas: ["Criminal Law", "Public Defense", "Constitutional Rights"]
        },
        { 
          id: "dickerson", 
          title: "Dickerson v. United States", 
          year: "2000", 
          citations: 2341, 
          influence: 74, 
          category: "Criminal", 
          court: "Supreme Court", 
          x: 600, 
          y: 150, 
          description: "Reaffirmed Miranda v. Arizona and ruled that Miranda warnings are constitutionally required.",
          judges: ["William Rehnquist", "Sandra Day O'Connor", "Anthony Kennedy"],
          outcome: "7-2 decision",
          keyLegalPrinciples: ["Miranda Warnings", "Constitutional Requirement", "Stare Decisis"],
          impactScore: 74,
          relatedAreas: ["Criminal Procedure", "Constitutional Law", "Law Enforcement"]
        },
        { 
          id: "edwards", 
          title: "Edwards v. Arizona", 
          year: "1981", 
          citations: 3456, 
          influence: 76, 
          category: "Criminal", 
          court: "Supreme Court", 
          x: 550, 
          y: 300, 
          description: "Clarified that once a suspect invokes their right to counsel, police must cease interrogation until an attorney is present.",
          judges: ["Byron White", "Warren Burger", "William Brennan"],
          outcome: "Unanimous decision",
          keyLegalPrinciples: ["Right to Counsel Invocation", "Interrogation Cessation", "Miranda Rights"],
          impactScore: 76,
          relatedAreas: ["Criminal Procedure", "Police Interrogation", "Suspect Rights"]
        }
      ],
      links: [
        { source: "gideon", target: "escobedo", strength: 0.75 },
        { source: "escobedo", target: "miranda", strength: 0.90 },
        { source: "miranda", target: "dickerson", strength: 0.85 },
        { source: "miranda", target: "edwards", strength: 0.75 }
      ]
    },
    "contract law": {
      nodes: [
        {
          id: "hadley",
          title: "Hadley v. Baxendale",
          year: "1854",
          citations: 9876,
          influence: 92,
          category: "Contract",
          court: "Court of Exchequer",
          x: 400,
          y: 200,
          description: "Established the rule for consequential damages in contract law, limiting recovery to reasonably foreseeable damages.",
          judges: ["Baron Alderson"],
          outcome: "Decision for defendant",
          keyLegalPrinciples: ["Consequential Damages", "Foreseeability", "Contract Remedies"],
          impactScore: 92,
          relatedAreas: ["Contract Law", "Commercial Law", "Tort Law"]
        },
        {
          id: "carbolic",
          title: "Carlill v. Carbolic Smoke Ball Co.",
          year: "1893",
          citations: 7654,
          influence: 89,
          category: "Contract",
          court: "Court of Appeal",
          x: 200,
          y: 150,
          description: "Landmark case establishing principles of unilateral contracts and the intention to create legal relations.",
          judges: ["Lord Justice Lindley", "Lord Justice Bowen"],
          outcome: "Decision for plaintiff",
          keyLegalPrinciples: ["Unilateral Contract", "Offer and Acceptance", "Consideration"],
          impactScore: 89,
          relatedAreas: ["Contract Formation", "Consumer Law", "Advertising Law"]
        }
      ],
      links: [
        { source: "carbolic", target: "hadley", strength: 0.6 }
      ]
    }
  };

  useEffect(() => {
    if (searchQuery) {
      setIsLoading(true);
      
      // Simulate API call
      setTimeout(() => {
        const query = searchQuery.toLowerCase();
        let networkData = null;
        
        if (query.includes("brown") || query.includes("board") || query.includes("education") || query.includes("segregation")) {
          networkData = sampleNetworks["brown v. board"];
        } else if (query.includes("miranda") || query.includes("arizona") || query.includes("criminal") || query.includes("rights")) {
          networkData = sampleNetworks["miranda v. arizona"];
        } else if (query.includes("contract") || query.includes("hadley") || query.includes("carbolic") || query.includes("damages")) {
          networkData = sampleNetworks["contract law"];
        } else {
          // Default network for constitutional law searches
          networkData = sampleNetworks["brown v. board"];
        }
        
        setNodes(networkData.nodes);
        setLinks(networkData.links);
        setIsLoading(false);
      }, 1000);
    }
  }, [searchQuery]);

  const handleNodeClick = (node: CaseNode) => {
    setSelectedNode(node);
    onNodeSelect(node);
  };

  const getNodeSize = (influence: number) => {
    return Math.max(8, influence * 0.3);
  };

  const getNodeColor = (category: string) => {
    const colors = {
      'Constitutional': 'hsl(var(--legal-primary))',
      'Criminal': 'hsl(var(--legal-info))',
      'Education': 'hsl(var(--legal-success))',
      'Privacy Rights': 'hsl(var(--legal-warning))'
    };
    return colors[category as keyof typeof colors] || 'hsl(var(--legal-primary))';
  };

  if (viewMode === 'timeline') {
    return (
      <div className="h-96 p-4">
        <div className="h-full relative">
          {/* Timeline axis */}
          <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-border"></div>
          
          {/* Year markers */}
          {nodes.length > 0 && (
            <>
              {Array.from(new Set(nodes.map(n => n.year))).sort().map((year, index) => {
                const position = (index / (Array.from(new Set(nodes.map(n => n.year))).length - 1)) * 100;
                return (
                  <div key={year} className="absolute bottom-4" style={{ left: `${position}%` }}>
                    <div className="text-xs text-muted-foreground text-center">
                      {year}
                    </div>
                    <div className="w-0.5 h-4 bg-border mx-auto"></div>
                  </div>
                );
              })}
              
              {/* Cases on timeline */}
              {nodes.map((node, index) => {
                const yearIndex = Array.from(new Set(nodes.map(n => n.year))).sort().indexOf(node.year);
                const position = (yearIndex / (Array.from(new Set(nodes.map(n => n.year))).length - 1)) * 100;
                const height = 50 + (index * 30) % 150;
                
                return (
                  <TooltipProvider key={node.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute cursor-pointer transform -translate-x-1/2 hover:scale-110 transition-all duration-200 animate-fade-in"
                          style={{ left: `${position}%`, bottom: `${height}px` }}
                          onClick={() => handleNodeClick(node)}
                        >
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white shadow-lg hover:shadow-xl transition-shadow"
                            style={{ backgroundColor: getNodeColor(node.category) }}
                          ></div>
                          <div className="mt-2 text-xs font-medium text-center max-w-24 leading-tight">
                            {node.title.split(' v. ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {node.citations.toLocaleString()} citations
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">{node.title}</p>
                          <p className="text-sm">{node.description}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-3 w-3" />
                            <span>{node.year}</span>
                            <Badge variant="secondary" className="text-xs">
                              {node.category}
                            </Badge>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </>
          )}
          
          {nodes.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Search for cases to view timeline</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading citation network...</p>
          </div>
        </div>
      )}
      
      <svg ref={svgRef} className="w-full h-full border border-border rounded-lg bg-background">
        {/* Links */}
        {links.map((link, index) => {
          const sourceNode = nodes.find(n => n.id === link.source);
          const targetNode = nodes.find(n => n.id === link.target);
          if (!sourceNode || !targetNode) return null;
          
          return (
            <line
              key={index}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke="hsl(var(--border))"
              strokeWidth={link.strength * 3}
              opacity={0.6}
            />
          );
        })}
        
        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id} className="animate-scale-in">
            {/* Node glow effect */}
            <circle
              cx={node.x}
              cy={node.y}
              r={getNodeSize(node.influence) + 3}
              fill={getNodeColor(node.category)}
              opacity="0.3"
              className="animate-pulse"
            />
            {/* Main node */}
            <circle
              cx={node.x}
              cy={node.y}
              r={getNodeSize(node.influence)}
              fill={getNodeColor(node.category)}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
              onClick={() => handleNodeClick(node)}
            />
            {/* Citation count indicator */}
            {node.citations > 5000 && (
              <circle
                cx={node.x + getNodeSize(node.influence) - 3}
                cy={node.y - getNodeSize(node.influence) + 3}
                r="4"
                fill="hsl(var(--legal-warning))"
                stroke="white"
                strokeWidth="1"
              />
            )}
            {/* Node title */}
            <text
              x={node.x}
              y={node.y - getNodeSize(node.influence) - 8}
              textAnchor="middle"
              className="text-xs font-semibold fill-foreground pointer-events-none"
            >
              {node.title.length > 20 ? node.title.substring(0, 20) + '...' : node.title}
            </text>
            {/* Year and influence */}
            <text
              x={node.x}
              y={node.y + getNodeSize(node.influence) + 12}
              textAnchor="middle"
              className="text-xs fill-muted-foreground pointer-events-none"
            >
              {node.year}
            </text>
            <text
              x={node.x}
              y={node.y + getNodeSize(node.influence) + 24}
              textAnchor="middle"
              className="text-xs fill-legal-info pointer-events-none font-medium"
            >
              {node.influence}% influence
            </text>
          </g>
        ))}
      </svg>
      
      {nodes.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Citation Network Visualization
            </h3>
            <p className="text-muted-foreground mb-4">
              Search for a case above to explore its citation network
            </p>
          </div>
        </div>
      )}
      
      {/* Case Detail Modal */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-legal-primary" />
              {selectedNode?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNode?.court} • {selectedNode?.year}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNode && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Case Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Case Summary</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Citations</span>
                    <div className="flex items-center gap-1">
                      <Link2 className="h-4 w-4 text-legal-info" />
                      <span className="text-sm font-semibold">{selectedNode.citations.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Influence</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-legal-success" />
                      <span className="text-sm font-semibold">{selectedNode.influence}%</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Court and Category */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  {selectedNode.court}
                </Badge>
                <Badge variant="outline">{selectedNode.category}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {selectedNode.year}
                </Badge>
              </div>

              {/* Judges */}
              {selectedNode.judges && selectedNode.judges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Judges
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.judges.map((judge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {judge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Principles */}
              {selectedNode.keyLegalPrinciples && selectedNode.keyLegalPrinciples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Key Legal Principles
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.keyLegalPrinciples.map((principle, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {principle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcome */}
              {selectedNode.outcome && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Outcome</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedNode.outcome}
                  </p>
                </div>
              )}

              {/* Related Areas */}
              {selectedNode.relatedAreas && selectedNode.relatedAreas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Related Legal Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.relatedAreas.map((area, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Case
                </Button>
                <Button size="sm" variant="outline">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Expand Network
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};