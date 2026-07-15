import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookOpen, Link2, TrendingUp, Calendar, Scale, Users, ArrowRight, AlertCircle } from "lucide-react";
import { useCitationNetwork } from "@/api/hooks/useCitationMaps";
import type {
  CitationCaseNode,
  CitationNetworkResponse,
  CitationNetworkFilters,
} from "@/api/ai-features/citation-maps";

export interface NetworkTarget {
  q?: string;
  opinion_id?: number;
  opinion_ids?: number[];
  /** Human-readable label shown in loading / empty states. */
  label: string;
}

export interface PositionedCaseNode extends CitationCaseNode {
  x: number;
  y: number;
  role: "primary" | "cited" | "citing" | "related";
}

interface CitationNetworkProps {
  target: NetworkTarget | null;
  viewMode: "network" | "timeline";
  filters?: CitationNetworkFilters;
  zoom: number;
  onNodeSelect?: (node: CitationCaseNode) => void;
  onExpandNode?: (node: CitationCaseNode) => void;
  onNetworkDataChange?: (network: CitationNetworkResponse | null) => void;
  svgRef?: React.RefObject<SVGSVGElement>;
}

const CANVAS_W = 800;
const CANVAS_H = 520;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

// Ring capacities/radii tuned so ~30 nodes fit without circles or labels colliding.
const RINGS = [
  { count: 6, rx: 165, ry: 95 },
  { count: 10, rx: 265, ry: 160 },
  { count: 14, rx: 355, ry: 220 },
];

/**
 * Resolve theme CSS variables to literal hsl() strings so the SVG renders
 * correctly on screen AND survives serialization for PNG export
 * (var(--…) does not resolve inside a standalone SVG image).
 */
const useResolvedColors = () =>
  useMemo(() => {
    const fallback = {
      primary: "hsl(43, 74%, 49%)",
      cited: "hsl(215, 22%, 42%)",
      citing: "hsl(140, 25%, 45%)",
      related: "hsl(32, 48%, 48%)",
      border: "hsl(30, 20%, 85%)",
      foreground: "hsl(220, 15%, 20%)",
      muted: "hsl(220, 10%, 46%)",
      background: "hsl(40, 33%, 98%)",
    };
    if (typeof window === "undefined") return fallback;
    const styles = getComputedStyle(document.documentElement);
    const v = (name: string, fb: string) => {
      const raw = styles.getPropertyValue(name).trim();
      return raw ? `hsl(${raw})` : fb;
    };
    return {
      primary: v("--primary", fallback.primary),
      cited: v("--chart-info", fallback.cited),
      citing: v("--success", fallback.citing),
      related: v("--chart-warning", fallback.related),
      border: v("--border", fallback.border),
      foreground: v("--foreground", fallback.foreground),
      muted: v("--muted-foreground", fallback.muted),
      background: v("--background", fallback.background),
    };
  }, []);

/** Ellipse ring layout: center case in the middle, neighbours around it. */
const layoutNodes = (
  data: CitationNetworkResponse | undefined
): PositionedCaseNode[] => {
  if (!data || data.nodes.length === 0) return [];
  const centerId = data.center_id;
  const centerIndex = Math.max(0, data.nodes.findIndex((n) => n.id === centerId));
  const center = data.nodes[centerIndex];
  const others = data.nodes.filter((_, i) => i !== centerIndex);

  // Direction of the link relative to the center decides the node's role:
  //   center → node  = case the primary case cites (precedent)
  //   node → center  = case that cites the primary case
  const citedIds = new Set<string>();
  const citingIds = new Set<string>();
  for (const link of data.links) {
    if (link.source === centerId) citedIds.add(link.target);
    if (link.target === centerId) citingIds.add(link.source);
  }
  const roleOf = (id: string): PositionedCaseNode["role"] =>
    citedIds.has(id) ? "cited" : citingIds.has(id) ? "citing" : "related";

  const positioned: PositionedCaseNode[] = [
    { ...center, x: CX, y: CY, role: "primary" },
  ];

  let ringIndex = 0;
  let placedInRing = 0;
  others.forEach((node) => {
    const ring = RINGS[Math.min(ringIndex, RINGS.length - 1)];
    // Past the configured rings, keep growing outward.
    const extra = Math.max(0, ringIndex - (RINGS.length - 1));
    const capacity = ring.count + extra * 4;
    const remaining = others.length - positioned.length + 1;
    const countInRing = Math.min(capacity, remaining + placedInRing);
    // Stagger each ring's start angle so nodes don't stack in columns.
    const startAngle = -Math.PI / 2 + ringIndex * (Math.PI / capacity);
    const angle = startAngle + (placedInRing / countInRing) * 2 * Math.PI;
    positioned.push({
      ...node,
      x: Math.round(CX + (ring.rx + extra * 70) * Math.cos(angle)),
      y: Math.round(CY + (ring.ry + extra * 50) * Math.sin(angle)),
      role: roleOf(node.id),
    });
    placedInRing += 1;
    if (placedInRing >= capacity) {
      ringIndex += 1;
      placedInRing = 0;
    }
  });
  return positioned;
};

export const CitationNetwork = ({
  target,
  viewMode,
  filters,
  zoom,
  onNodeSelect,
  onExpandNode,
  onNetworkDataChange,
  svgRef,
}: CitationNetworkProps) => {
  const [selectedNode, setSelectedNode] = useState<PositionedCaseNode | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const colors = useResolvedColors();

  const hasTarget = !!target;
  const { data, isFetching, isError } = useCitationNetwork(
    {
      q: target?.q,
      opinion_id: target?.opinion_id,
      opinion_ids: target?.opinion_ids,
      depth: 2,
      ...(filters || {}),
    },
    hasTarget
  );

  const nodes = useMemo(() => layoutNodes(data), [data]);
  const links = data?.links ?? [];
  const isLoading = hasTarget && isFetching;

  useEffect(() => {
    onNetworkDataChange?.(hasTarget ? (data ?? null) : null);
  }, [hasTarget, data, onNetworkDataChange]);

  const handleNodeClick = (node: PositionedCaseNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node);
  };

  // 6px to 16px: big enough to read influence at a glance, small enough
  // that a 100-influence node doesn't swallow its neighbours' labels.
  const getNodeSize = (influence: number) => 6 + Math.max(0, Math.min(100, influence)) * 0.1;

  // Auto-fit: frame the view around the actual nodes so a 2-node map fills
  // the canvas instead of floating tiny in empty space.
  const baseView = useMemo(() => {
    if (nodes.length === 0) return { cx: CX, cy: CY, w: CANVAS_W, h: CANVAS_H };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      const r = getNodeSize(n.influence);
      minX = Math.min(minX, n.x - r - 85); // side margin for text labels
      maxX = Math.max(maxX, n.x + r + 85);
      minY = Math.min(minY, n.y - r - 30);
      maxY = Math.max(maxY, n.y + r + 34);
    }
    let w = maxX - minX;
    let h = maxY - minY;
    const aspect = CANVAS_W / CANVAS_H;
    if (w / h < aspect) w = h * aspect;
    else h = w / aspect;
    w = Math.min(Math.max(w, 360), CANVAS_W);
    h = Math.min(Math.max(h, 360 / aspect), CANVAS_H);
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w, h };
  }, [nodes]);

  const roleColor = (role: PositionedCaseNode["role"]) => colors[role === "primary" ? "primary" : role];

  const roleLabel = (role: PositionedCaseNode["role"]) =>
    role === "primary"
      ? "Primary case"
      : role === "cited"
        ? "Cited by the primary case (precedent)"
        : role === "citing"
          ? "Cites the primary case"
          : "Related case in the network";

  // User zoom applies on top of the auto-fitted frame.
  const vw = baseView.w / zoom;
  const vh = baseView.h / zoom;
  const viewBox = `${baseView.cx - vw / 2} ${baseView.cy - vh / 2} ${vw} ${vh}`;

  const emptyState = (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        {isError ? (
          <>
            <AlertCircle className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load network</h3>
            <p className="text-muted-foreground">Something went wrong. Please try searching again.</p>
          </>
        ) : (
          <>
            <BookOpen className="h-14 w-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasTarget ? "No cases found" : "Start with a search"}
            </h3>
            <p className="text-muted-foreground">
              {hasTarget
                ? `No cases matched "${target?.label}" with the current filters. Try a different name or clear filters.`
                : "Type a case name (e.g. Twombly) in the search bar, or pick one from Most Influential Cases."}
            </p>
          </>
        )}
      </div>
    </div>
  );

  // ── Timeline view ──────────────────────────────────────────────────────────
  if (viewMode === "timeline") {
    const sorted = [...nodes].sort((a, b) => (a.year || "").localeCompare(b.year || ""));
    const itemWidth = 120;
    const laneOffsets = [150, 96, 42];

    return (
      <div className="h-[520px] relative border border-border rounded-lg bg-background">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading timeline for “{target?.label}”…</p>
            </div>
          </div>
        )}

        {sorted.length > 0 ? (
          <div className="h-full overflow-x-auto overflow-y-hidden px-4">
            <p className="text-xs text-muted-foreground pt-3">
              Same cases as Network View, arranged oldest → newest. Click a dot for details.
            </p>
            <div
              className="relative h-[460px]"
              style={{ minWidth: `${Math.max(sorted.length * itemWidth, 600)}px` }}
            >
              {/* axis */}
              <div className="absolute bottom-10 left-0 right-0 h-0.5 bg-border" />
              {sorted.map((node, index) => {
                const left = index * itemWidth + itemWidth / 2;
                const stemHeight = laneOffsets[index % laneOffsets.length];
                return (
                  <div key={node.id} className="absolute bottom-10" style={{ left: `${left}px` }}>
                    {/* stem */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-border"
                      style={{ height: `${stemHeight}px` }}
                    />
                    {/* dot + label */}
                    <button
                      type="button"
                      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center w-28 group"
                      style={{ bottom: `${stemHeight}px` }}
                      onClick={() => handleNodeClick(node)}
                      title={`${node.title} (${node.year}): ${node.citations.toLocaleString()} citations`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border-2 border-white shadow group-hover:ring-2 group-hover:ring-legal-primary/40"
                        style={{ backgroundColor: roleColor(node.role) }}
                      />
                      <span className="mt-1 text-xs font-medium text-center leading-tight line-clamp-2">
                        {node.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {node.citations.toLocaleString()} citations
                      </span>
                    </button>
                    {/* year tick */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      {node.year || "n/a"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          !isLoading && emptyState
        )}

        {renderDialog()}
      </div>
    );
  }

  // ── Network view ───────────────────────────────────────────────────────────
  return (
    <div className="h-[520px] relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading citation network for “{target?.label}”…</p>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full border border-border rounded-lg bg-background"
      >
        {/* Links */}
        {links.map((link, index) => {
          const sourceNode = nodes.find((n) => n.id === link.source);
          const targetNode = nodes.find((n) => n.id === link.target);
          if (!sourceNode || !targetNode) return null;
          return (
            <line
              key={index}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={colors.border}
              strokeWidth={1 + link.strength * 2}
              opacity={0.7}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, index) => {
          const r = getNodeSize(node.influence);
          const isHovered = hoveredId === node.id;
          // Alternate labels above/below so neighbouring titles don't collide.
          const labelBelow = node.role !== "primary" && index % 2 === 1;
          return (
            <g key={node.id}>
              {/* hover ring — highlight without moving the node (no jitter) */}
              {isHovered && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 4}
                  fill="none"
                  stroke={roleColor(node.role)}
                  strokeWidth="2"
                  opacity="0.5"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={roleColor(node.role)}
                stroke="white"
                strokeWidth={node.role === "primary" ? 3 : 2}
                className="cursor-pointer"
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <title>
                  {`${node.title}${node.year ? ` (${node.year})` : ""}\n${roleLabel(node.role)}\n${node.court || "Unknown court"} • ${node.citations.toLocaleString()} citations\nClick for details`}
                </title>
              </circle>
              {/* case name */}
              <text
                x={node.x}
                y={labelBelow ? node.y + r + 13 : node.y - r - 7}
                textAnchor="middle"
                fontSize="11"
                fontWeight={node.role === "primary" ? "700" : "600"}
                fill={colors.foreground}
                className="pointer-events-none"
              >
                {node.title.length > 22 ? node.title.substring(0, 22) + "…" : node.title}
              </text>
              {/* year only on the primary case; other years live in the hover tooltip */}
              {node.role === "primary" && node.year && (
                <text
                  x={node.x}
                  y={node.y + r + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill={colors.muted}
                  className="pointer-events-none"
                >
                  {node.year}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {nodes.length === 0 && !isLoading && emptyState}

      {renderDialog()}
    </div>
  );

  // ── Case detail dialog ─────────────────────────────────────────────────────
  function renderDialog() {
    return (
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-legal-primary" />
              {selectedNode?.title}
            </DialogTitle>
            <DialogDescription>
              {[selectedNode?.court, selectedNode?.year].filter(Boolean).join(" • ")}
            </DialogDescription>
          </DialogHeader>

          {selectedNode && (
            <div className="space-y-5 max-h-96 overflow-y-auto">
              {selectedNode.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Case Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Times Cited</span>
                    <div className="flex items-center gap-1">
                      <Link2 className="h-4 w-4 text-legal-info" />
                      <span className="text-sm font-semibold">
                        {selectedNode.citations.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    How many later cases cite this decision.
                  </p>
                </Card>

                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Influence</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-legal-success" />
                      <span className="text-sm font-semibold">{selectedNode.influence}/100</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Citation count relative to the most-cited case in the database.
                  </p>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedNode.court && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Scale className="h-3 w-3" />
                    {selectedNode.court}
                  </Badge>
                )}
                {selectedNode.category && selectedNode.category !== "General" && (
                  <Badge variant="outline">{selectedNode.category}</Badge>
                )}
                {selectedNode.year && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedNode.year}
                  </Badge>
                )}
              </div>

              {selectedNode.judges && selectedNode.judges.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Author
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

              {selectedNode.outcome && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Outcome</h4>
                  <p className="text-sm text-muted-foreground">{selectedNode.outcome}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                {selectedNode.role === "primary" ? (
                  <p className="text-sm text-muted-foreground text-center py-1">
                    This case is already the primary case of the map. The graph
                    around it shows everything it cites and everything citing it
                    in our database. Click any other node to explore from there.
                  </p>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        onExpandNode?.(selectedNode);
                        setSelectedNode(null);
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Map This Case's Citations
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Rebuilds the graph with this case in the center, showing what it cites
                      and what cites it.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }
};
