import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Link2, TrendingUp, Eye, Calendar, Scale, Users, FileText, ArrowRight, AlertCircle } from "lucide-react";
import { useCitationNetwork } from "@/api/hooks/useCitationMaps";
import type {
  CitationCaseNode,
  CitationNetworkResponse,
  CitationNetworkFilters,
} from "@/api/ai-features/citation-maps";

export interface PositionedCaseNode extends CitationCaseNode {
  x: number;
  y: number;
}

interface CitationNetworkProps {
  searchQuery: string;
  viewMode: 'network' | 'timeline';
  filters?: CitationNetworkFilters;
  onNodeSelect: (node: CitationCaseNode) => void;
  onExpandNode?: (node: CitationCaseNode) => void;
  onNetworkDataChange?: (network: CitationNetworkResponse | null) => void;
}

/** Compute an ellipse layout: center case in the middle, related cases around it. */
const layoutNodes = (
  nodes: CitationCaseNode[],
  centerId: string | null
): PositionedCaseNode[] => {
  const cx = 400;
  const cy = 190;
  const centerIndex = Math.max(
    0,
    nodes.findIndex((n) => n.id === centerId)
  );
  const others = nodes.filter((_, i) => i !== centerIndex);

  const positioned: PositionedCaseNode[] = [];
  if (nodes.length > 0) {
    positioned.push({ ...nodes[centerIndex], x: cx, y: cy });
  }

  const ringSize = 8;
  others.forEach((node, i) => {
    const ring = Math.floor(i / ringSize);
    const inRing = Math.min(others.length - ring * ringSize, ringSize);
    const angle = ((i % ringSize) / inRing) * 2 * Math.PI - Math.PI / 2;
    const rx = 210 + ring * 70;
    const ry = 110 + ring * 35;
    positioned.push({
      ...node,
      x: Math.round(cx + rx * Math.cos(angle)),
      y: Math.round(cy + ry * Math.sin(angle)),
    });
  });
  return positioned;
};

export const CitationNetwork = ({
  searchQuery,
  viewMode,
  filters,
  onNodeSelect,
  onExpandNode,
  onNetworkDataChange,
}: CitationNetworkProps) => {
  const [selectedNode, setSelectedNode] = useState<PositionedCaseNode | null>(null);

  const hasQuery = searchQuery.trim().length > 0;
  const { data, isFetching, isError } = useCitationNetwork(
    { q: searchQuery.trim(), depth: 2, ...(filters || {}) },
    hasQuery
  );

  const nodes = useMemo(
    () => layoutNodes(data?.nodes ?? [], data?.center_id ?? null),
    [data]
  );
  const links = data?.links ?? [];
  const isLoading = hasQuery && isFetching && !data;

  useEffect(() => {
    onNetworkDataChange?.(hasQuery ? (data ?? null) : null);
  }, [hasQuery, data, onNetworkDataChange]);

  const handleNodeClick = (node: PositionedCaseNode) => {
    setSelectedNode(node);
    onNodeSelect(node);
  };

  const getNodeSize = (influence: number) => {
    return Math.max(8, influence * 0.3);
  };

  const getNodeColor = (category: string) => {
    const palette = [
      'hsl(var(--legal-primary))',
      'hsl(var(--legal-info))',
      'hsl(var(--legal-success))',
      'hsl(var(--legal-warning))'
    ];
    if (!category) return palette[0];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  };

  if (viewMode === 'timeline') {
    const years = Array.from(new Set(nodes.map(n => n.year).filter(Boolean))).sort();
    return (
      <div className="h-96 p-4">
        <div className="h-full relative">
          {/* Timeline axis */}
          <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-border"></div>

          {/* Year markers */}
          {nodes.length > 0 && (
            <>
              {years.map((year, index) => {
                const position = years.length > 1 ? (index / (years.length - 1)) * 100 : 50;
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
                const yearIndex = years.indexOf(node.year);
                const position = years.length > 1 ? (yearIndex / (years.length - 1)) * 100 : 50;
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
                <p className="text-muted-foreground">
                  {hasQuery ? "No cases found for this search" : "Search for cases to view timeline"}
                </p>
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

      <svg viewBox="0 0 800 400" className="w-full h-full border border-border rounded-lg bg-background">
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
            {node.citations > 1000 && (
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
            {isError ? (
              <>
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Unable to load network
                </h3>
                <p className="text-muted-foreground mb-4">
                  Something went wrong. Please try searching again.
                </p>
              </>
            ) : (
              <>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Citation Network Visualization
                </h3>
                <p className="text-muted-foreground mb-4">
                  {hasQuery
                    ? "No cases found matching your search and filters"
                    : "Search for a case above to explore its citation network"}
                </p>
              </>
            )}
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
              {selectedNode.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Case Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>
              )}

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
                {selectedNode.court && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    {selectedNode.court}
                  </Badge>
                )}
                <Badge variant="outline">{selectedNode.category}</Badge>
                {selectedNode.year && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedNode.year}
                  </Badge>
                )}
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
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedNode(null)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Case
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onExpandNode?.(selectedNode);
                    setSelectedNode(null);
                  }}
                >
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
