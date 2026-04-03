import { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { THEME } from "../../constants/theme";
import { NODE_COLORS, EDGE_COLORS } from "../../constants/domains";
import type { ConditionNode, SimEdge, Domain } from "../../types";

interface WebVisualizationProps {
  nodes: ConditionNode[];
  edges: { from: string; to: string; relationship: string }[];
  dark: boolean;
  filteredDomains?: Set<Domain>;
  selectedSubpop?: string | null;
  disconnectedNodeIds?: Set<string>;
}

// Enabling/positive relationship types use warm tones
const WARM_RELS = new Set(["enables", "amplifies", "produces", "maintains", "addresses", "partially_addresses"]);

export default function WebVisualization({ nodes, edges, dark, filteredDomains, selectedSubpop, disconnectedNodeIds }: WebVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simRef = useRef<d3.Simulation<ConditionNode, SimEdge> | null>(null);
  const nodesRef = useRef<ConditionNode[]>([]);
  const edgesRef = useRef<SimEdge[]>([]);
  const [renderCount, forceRender] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const prevNodeIds = useRef<Set<string>>(new Set());
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const newNodeIds = useRef<Set<string>>(new Set());

  // Compute connection counts for node sizing (generative density)
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of edges) {
      counts[e.from] = (counts[e.from] || 0) + 1;
      counts[e.to] = (counts[e.to] || 0) + 1;
    }
    return counts;
  }, [edges]);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const width = 900;
    const height = 700;

    // Merge with existing positioned nodes
    const oldMap: Record<string, ConditionNode> = {};
    nodesRef.current.forEach(n => { oldMap[n.id] = n; });

    const incoming = new Set<string>();
    const mergedNodes = nodes.map(n => {
      if (oldMap[n.id]) {
        oldMap[n.id].label = n.label;
        oldMap[n.id].domain = n.domain;
        oldMap[n.id].is_program_contribution = n.is_program_contribution;
        oldMap[n.id].subpopulation = n.subpopulation;
        return oldMap[n.id];
      }
      incoming.add(n.id);
      return {
        ...n,
        x: width / 2 + (Math.random() - 0.5) * 150,
        y: height / 2 + (Math.random() - 0.5) * 150,
      };
    });

    newNodeIds.current = incoming;
    prevNodeIds.current = new Set(nodes.map(n => n.id));

    // Filter edges to only those where both source and target exist in the node set
    const nodeIdSet = new Set(mergedNodes.map(n => n.id));
    const mergedEdges: SimEdge[] = edges
      .filter(e => nodeIdSet.has(e.from) && nodeIdSet.has(e.to))
      .map(e => ({
        source: e.from,
        target: e.to,
        relationship: e.relationship as any,
      }));

    nodesRef.current = mergedNodes;
    edgesRef.current = mergedEdges;

    // Stop old simulation
    if (simRef.current) simRef.current.stop();

    // Determine which nodes have connections for variable centering force
    const connectedIds = new Set<string>();
    for (const e of mergedEdges) {
      connectedIds.add(typeof e.source === "string" ? e.source : (e.source as any).id);
      connectedIds.add(typeof e.target === "string" ? e.target : (e.target as any).id);
    }

    // Create fresh simulation — tuned for 10-50 node concept maps
    const simulation = d3.forceSimulation<ConditionNode>(mergedNodes)
      .force("link", d3.forceLink<ConditionNode, SimEdge>(mergedEdges).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-450).distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<ConditionNode>().radius((d: any) => getNodeRadius(d.id) + 15).iterations(4))
      // Disconnected nodes get pulled toward center more strongly
      .force("x", d3.forceX(width / 2).strength((d: any) => connectedIds.has(d.id) ? 0.03 : 0.08))
      .force("y", d3.forceY(height / 2).strength((d: any) => connectedIds.has(d.id) ? 0.03 : 0.08))
      .alpha(0.4)
      .on("tick", () => forceRender(n => n + 1));

    simRef.current = simulation;

    // Auto-fit view after simulation settles for new nodes
    setTimeout(() => {
      newNodeIds.current = new Set();
      // Auto-fit: compute bounding box of all nodes and adjust zoom to fit
      if (svgRef.current && zoomRef.current && mergedNodes.length > 0) {
        const positioned = mergedNodes.filter(n => n.x != null && n.y != null && isFinite(n.x!) && isFinite(n.y!));
        if (positioned.length > 0) {
          const padding = 80;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const n of positioned) {
            if (n.x! < minX) minX = n.x!;
            if (n.y! < minY) minY = n.y!;
            if (n.x! > maxX) maxX = n.x!;
            if (n.y! > maxY) maxY = n.y!;
          }
          const bboxW = maxX - minX + padding * 2;
          const bboxH = maxY - minY + padding * 2;
          const scale = Math.min(width / bboxW, height / bboxH, 1.5);
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const tx = width / 2 - cx * scale;
          const ty = height / 2 - cy * scale;
          const svg = d3.select(svgRef.current);
          svg.transition().duration(500).call(
            zoomRef.current.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale)
          );
        }
      }
      forceRender(n => n + 1);
    }, 800);

    return () => { simulation.stop(); };
  }, [nodes, edges]);

  // Set up zoom behavior (supports mouse wheel + pinch-to-zoom on touch)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .filter((event) => {
        // Allow all zoom events including touch
        return !event.button;
      })
      .on("zoom", (event) => {
        setTransform(event.transform);
      });
    svg.call(zoom);
    // Prevent browser from intercepting touch gestures on the SVG
    svg.style("touch-action", "none");
    zoomRef.current = zoom;
    return () => { svg.on(".zoom", null); };
  }, []);

  const t = dark ? THEME.dark : THEME.light;

  const simNodes = nodesRef.current;
  const simEdges = edgesRef.current;

  // Fixed viewBox — zoom/pan is handled entirely by the d3 zoom transform on <g>
  const fixedViewBox = "0 0 900 700";

  if (!nodes.length) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100%", width: "100%",
      }}>
        <div style={{ textAlign: "center", opacity: 0.4 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: `1px solid ${t.gold}`,
            margin: "0 auto 16px",
            animation: "pulse 2.5s ease-in-out infinite",
          }} />
          <p style={{
            fontSize: 12, lineHeight: 1.6, maxWidth: 200, color: t.textMuted,
            margin: "0 auto",
          }}>
            Your conditions web will emerge here as we talk
          </p>
        </div>
      </div>
    );
  }

  // Determine if a node is visible based on filters
  const isNodeVisible = (node: ConditionNode) => {
    if (filteredDomains && !filteredDomains.has(node.domain)) return false;
    if (selectedSubpop && node.subpopulation?.length && !node.subpopulation.includes(selectedSubpop)) return false;
    return true;
  };

  const getEdgePath = (edge: SimEdge): string => {
    const s = typeof edge.source === "object" ? edge.source : simNodes.find(n => n.id === edge.source);
    const tgt = typeof edge.target === "object" ? edge.target : simNodes.find(n => n.id === edge.target);
    if (!s || !tgt || s.x == null || tgt.x == null) return "";
    const dx = tgt.x! - s.x!;
    const dy = tgt.y! - s.y!;
    const mx = s.x! + dx * 0.5 + dy * 0.15;
    const my = s.y! + dy * 0.5 - dx * 0.15;
    return `M ${s.x} ${s.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`;
  };

  const wrapLabel = (label: string): string[] => {
    const words = label.split(" ");
    const lines: string[] = [];
    let current: string[] = [];
    words.forEach(w => {
      if (current.join(" ").length + w.length > 20) {
        lines.push(current.join(" "));
        current = [w];
      } else {
        current.push(w);
      }
    });
    if (current.length) lines.push(current.join(" "));
    return lines;
  };

  // Compute node radius based on generative density
  const getNodeRadius = (nodeId: string) => {
    const count = connectionCounts[nodeId] || 0;
    // Scale: 0 connections = base, 4+ connections = large
    const base = 28;
    const scale = Math.min(count, 8) * 3;
    return base + scale;
  };

  return (
    <svg ref={svgRef} viewBox={fixedViewBox} style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}>
      <defs>
        {Object.entries(EDGE_COLORS).map(([rel, color]) => (
          <marker
            key={rel}
            id={`arrow-${rel}`}
            viewBox="0 0 10 10"
            refX="8" refY="5"
            markerWidth="6" markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={color} opacity="0.7" />
          </marker>
        ))}
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="density-glow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g ref={gRef} transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
      {simEdges.map((edge, i) => {
        const path = getEdgePath(edge);
        const rel = edge.relationship as string;
        const color = EDGE_COLORS[rel as keyof typeof EDGE_COLORS] || "#94A3B8";
        const isWarm = WARM_RELS.has(rel);

        // Check if both source and target are visible
        const sourceNode = typeof edge.source === "object" ? edge.source : simNodes.find(n => n.id === edge.source);
        const targetNode = typeof edge.target === "object" ? edge.target : simNodes.find(n => n.id === edge.target);
        const edgeVisible = sourceNode && targetNode && isNodeVisible(sourceNode) && isNodeVisible(targetNode);

        return (
          <g key={`edge-${i}`} style={{ opacity: edgeVisible ? 1 : 0.08, transition: "opacity 0.3s" }}>
            <path
              d={path} fill="none" stroke={color}
              strokeWidth={isWarm ? "2.5" : "2"}
              strokeOpacity="0.6"
              strokeDasharray={isWarm ? "none" : "6 3"}
              markerEnd={`url(#arrow-${rel})`}
            />
          </g>
        );
      })}

      {simNodes.map(node => {
        if (node.x == null || !node.label) return null;
        const colors = NODE_COLORS[node.domain] || NODE_COLORS.historical;
        const isHovered = hoveredNode === node.id;
        const isNew = newNodeIds.current.has(node.id);
        const lines = wrapLabel(node.label || "");
        const isProgramContrib = node.is_program_contribution;
        const isDisconnected = disconnectedNodeIds?.has(node.id) ?? false;
        const visible = isNodeVisible(node);
        const count = connectionCounts[node.id] || 0;
        const isHighLeverage = count >= 4;
        const r = getNodeRadius(node.id);
        const outerR = r + 12;

        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            style={{
              cursor: "default",
              opacity: isNew ? 0 : visible ? 1 : 0.08,
              transition: "opacity 0.4s ease-out",
            }}
          >
            {/* Disconnected node warning ring */}
            {isDisconnected && (
              <circle
                r={outerR + 6}
                fill="none"
                stroke={t.gold}
                strokeWidth="1.5"
                strokeOpacity="0.4"
                strokeDasharray="3 4"
              />
            )}
            {/* High-leverage glow ring */}
            {isHighLeverage && (
              <circle
                r={outerR + 8}
                fill={colors.bg}
                fillOpacity={0.06}
                filter="url(#density-glow)"
              />
            )}
            {/* Program contribution gold dashed ring */}
            {isProgramContrib && (
              <circle
                r={outerR + 4}
                fill="none"
                stroke="#cbb26a"
                strokeWidth="2"
                strokeOpacity="0.6"
                strokeDasharray="4 3"
              />
            )}
            <circle
              r={isHovered ? outerR + 4 : outerR}
              fill={colors.bg}
              fillOpacity={isHovered ? 0.15 : 0.08}
              stroke={colors.bg}
              strokeOpacity={isHovered ? 0.4 : 0.2}
              strokeWidth="1"
            />
            <circle
              r={isHovered ? r + 4 : r}
              fill={colors.bg}
              fillOpacity={isHovered ? 0.25 : 0.15}
              stroke={colors.bg}
              strokeOpacity="0.5"
              strokeWidth="1.5"
              filter={isHovered ? "url(#glow)" : ""}
            />
            <circle r="6" fill={colors.bg} fillOpacity="0.9" />
            {lines.map((line, li) => (
              <text
                key={li}
                y={r + 14 + li * 15}
                textAnchor="middle"
                fontSize="12"
                fill={colors.bg}
                fontWeight="500"
                fontFamily="'DM Sans', sans-serif"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
      </g>

      {/* Disconnected node count overlay — outside zoom group so it stays fixed */}
      {disconnectedNodeIds && disconnectedNodeIds.size > 0 && (
        <text
          x="16" y="24"
          fontSize="11"
          fontFamily="'DM Sans', sans-serif"
          fill={t.gold}
          fillOpacity="0.7"
        >
          {disconnectedNodeIds.size} condition{disconnectedNodeIds.size > 1 ? "s" : ""} not yet connected
        </text>
      )}
    </svg>
  );
}
