import { useRef } from "react";
import { downloadAsWord } from "../../utils/downloadWord";
import type { LogicModelData, ThemeTokens } from "../../types";

interface LogicModelDiagramProps {
  data: LogicModelData;
  dark: boolean;
  t: ThemeTokens;
}

// Layout constants
const COL_WIDTH = 160;
const COL_GAP = 48;
const ITEM_HEIGHT = 36;
const ITEM_GAP = 6;
const ITEM_PAD_X = 10;
const HEADER_HEIGHT = 38;
const TOP_PAD = 20;
const LEFT_PAD = 24;
const ARROW_GAP = 16;

// Column colors — gradient from warm to cool across the logic model
const COL_COLORS = [
  "#8B7355", // inputs — earthy
  "#c99d28", // activities — gold
  "#cbb26a", // outputs — light gold
  "#81B29A", // short-term outcomes — teal
  "#6B8F71", // long-term outcomes — green
];

export default function LogicModelDiagram({ data, dark, t }: LogicModelDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data?.columns?.length) {
    return <div style={{ padding: 24, color: t.textMuted, fontSize: 13 }}>No logic model data available.</div>;
  }

  const columns = data.columns;
  const maxItems = Math.max(...columns.map(c => c.items.length), 1);
  const diagramHeight = TOP_PAD + HEADER_HEIGHT + 12 + maxItems * (ITEM_HEIGHT + ITEM_GAP) + 20;
  const diagramWidth = LEFT_PAD + columns.length * COL_WIDTH + (columns.length - 1) * COL_GAP + LEFT_PAD;

  // Build item position lookup
  const itemPositions: Record<string, { x: number; y: number }> = {};
  columns.forEach((col, ci) => {
    const colX = LEFT_PAD + ci * (COL_WIDTH + COL_GAP);
    col.items.forEach((item, ii) => {
      const itemY = TOP_PAD + HEADER_HEIGHT + 12 + ii * (ITEM_HEIGHT + ITEM_GAP);
      itemPositions[item.id] = {
        x: colX + COL_WIDTH / 2,
        y: itemY + ITEM_HEIGHT / 2,
      };
    });
  });

  // Compute total height including below-diagram sections
  const hasUnmapped = data.unmapped?.length > 0;
  const hasAssumptions = data.assumptions?.length > 0;
  const hasExternal = data.external_factors?.length > 0;
  const belowSections = [hasAssumptions, hasExternal, hasUnmapped].filter(Boolean).length;
  const totalHeight = diagramHeight + belowSections * 80 + 40;

  const handleDownloadPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", dark ? "#0e0d0a" : "#faf8f2");
    clone.insertBefore(bg, clone.firstChild);
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = diagramWidth * 2;
      canvas.height = totalHeight * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "logic-model.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  };

  const handleDownloadDoc = () => {
    // Build a markdown table representation
    let md = "# Logic Model\n\n";
    md += "| " + columns.map(c => c.label).join(" | ") + " |\n";
    md += "| " + columns.map(() => "---").join(" | ") + " |\n";

    const maxRows = Math.max(...columns.map(c => c.items.length));
    for (let i = 0; i < maxRows; i++) {
      md += "| " + columns.map(c => {
        const item = c.items[i];
        return item ? item.label + (item.note ? ` *(${item.note})*` : "") : "";
      }).join(" | ") + " |\n";
    }

    if (data.assumptions?.length) {
      md += "\n## Assumptions\n\n";
      md += data.assumptions.map(a => `- ${a}`).join("\n") + "\n";
    }
    if (data.external_factors?.length) {
      md += "\n## External Factors\n\n";
      md += data.external_factors.map(f => `- ${f}`).join("\n") + "\n";
    }
    if (data.unmapped?.length) {
      md += "\n## Contextual Conditions (Not Mapped)\n\n";
      md += data.unmapped.map(u => `- **${u.label}**: ${u.reason || "Context"}`).join("\n") + "\n";
    }
    md += "\n---\n*This logic model is a linear translation of a non-linear Conditions Web. It simplifies mutual causality into sequential steps for funder-facing communication.*\n";

    downloadAsWord(md, "logic-model.doc");
  };

  const surfaceBg = dark ? "#1a1814" : "#ffffff";
  const mutedText = dark ? "rgba(240,236,224,0.5)" : "rgba(24,21,10,0.5)";

  return (
    <div style={{ padding: "12px 16px" }}>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <button onClick={handleDownloadPng} style={{
          padding: "5px 14px", fontSize: 11, borderRadius: 6,
          background: "transparent", border: `1px solid ${t.border}`,
          color: t.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Download .png</button>
        <button onClick={handleDownloadDoc} style={{
          padding: "5px 14px", fontSize: 11, borderRadius: 6,
          background: "transparent", border: `1px solid ${t.border}`,
          color: t.textMuted, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Download .doc</button>
      </div>

      {/* SVG Diagram */}
      <div style={{ overflowX: "auto", overflowY: "hidden" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${diagramWidth} ${totalHeight}`}
          width={diagramWidth}
          height={totalHeight}
          style={{ display: "block", maxWidth: "100%" }}
        >
          <defs>
            <marker id="lm-arrow" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={t.gold} opacity="0.6" />
            </marker>
          </defs>

          {/* Column backgrounds and headers */}
          {columns.map((col, ci) => {
            const colX = LEFT_PAD + ci * (COL_WIDTH + COL_GAP);
            const colColor = COL_COLORS[ci] || COL_COLORS[0];
            const colH = HEADER_HEIGHT + 12 + col.items.length * (ITEM_HEIGHT + ITEM_GAP) + 8;

            return (
              <g key={col.id}>
                {/* Column background */}
                <rect
                  x={colX} y={TOP_PAD}
                  width={COL_WIDTH} height={colH}
                  rx={8} ry={8}
                  fill={surfaceBg}
                  stroke={colColor}
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
                {/* Header bar */}
                <rect
                  x={colX} y={TOP_PAD}
                  width={COL_WIDTH} height={HEADER_HEIGHT}
                  rx={8} ry={8}
                  fill={colColor}
                  fillOpacity={dark ? 0.85 : 0.9}
                />
                {/* Square off bottom corners of header */}
                <rect
                  x={colX} y={TOP_PAD + HEADER_HEIGHT - 8}
                  width={COL_WIDTH} height={8}
                  fill={colColor}
                  fillOpacity={dark ? 0.85 : 0.9}
                />
                {/* Header text */}
                <text
                  x={colX + COL_WIDTH / 2}
                  y={TOP_PAD + HEADER_HEIGHT / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="'DM Sans', sans-serif"
                  fill="#ffffff"
                >
                  {col.label}
                </text>

                {/* Items */}
                {col.items.map((item, ii) => {
                  const itemY = TOP_PAD + HEADER_HEIGHT + 12 + ii * (ITEM_HEIGHT + ITEM_GAP);
                  return (
                    <g key={item.id}>
                      <rect
                        x={colX + 6} y={itemY}
                        width={COL_WIDTH - 12} height={ITEM_HEIGHT}
                        rx={5} ry={5}
                        fill={surfaceBg}
                        stroke={colColor}
                        strokeWidth="1"
                        strokeOpacity="0.25"
                      />
                      <text
                        x={colX + ITEM_PAD_X + 6}
                        y={itemY + ITEM_HEIGHT / 2}
                        dominantBaseline="central"
                        fontSize="10"
                        fontFamily="'DM Sans', sans-serif"
                        fill={t.text}
                      >
                        {item.label.length > 20 ? item.label.slice(0, 19) + "…" : item.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Arrows between columns */}
          {columns.map((_, ci) => {
            if (ci >= columns.length - 1) return null;
            const fromX = LEFT_PAD + ci * (COL_WIDTH + COL_GAP) + COL_WIDTH;
            const toX = LEFT_PAD + (ci + 1) * (COL_WIDTH + COL_GAP);
            const midY = TOP_PAD + HEADER_HEIGHT / 2;
            return (
              <line
                key={`arrow-${ci}`}
                x1={fromX + ARROW_GAP / 2}
                y1={midY}
                x2={toX - ARROW_GAP / 2}
                y2={midY}
                stroke={t.gold}
                strokeWidth="2"
                strokeOpacity="0.5"
                markerEnd="url(#lm-arrow)"
              />
            );
          })}

          {/* Flow lines between specific items */}
          {data.flows?.map((flow, fi) => {
            const from = itemPositions[flow.from];
            const to = itemPositions[flow.to];
            if (!from || !to) return null;
            // Only draw if items are in different columns
            if (Math.abs(from.x - to.x) < COL_WIDTH) return null;
            const fromEdgeX = from.x + COL_WIDTH / 2 - 6;
            const toEdgeX = to.x - COL_WIDTH / 2 + 6;
            const midX = (fromEdgeX + toEdgeX) / 2;
            return (
              <path
                key={`flow-${fi}`}
                d={`M ${fromEdgeX} ${from.y} C ${midX} ${from.y} ${midX} ${to.y} ${toEdgeX} ${to.y}`}
                fill="none"
                stroke={t.gold}
                strokeWidth="1.5"
                strokeOpacity="0.25"
                strokeDasharray="4 3"
                markerEnd="url(#lm-arrow)"
              />
            );
          })}

          {/* Below-diagram sections */}
          {(() => {
            let yOffset = diagramHeight + 10;
            const sections: JSX.Element[] = [];

            if (hasAssumptions) {
              sections.push(
                <g key="assumptions">
                  <text x={LEFT_PAD} y={yOffset} fontSize="11" fontWeight="600"
                    fontFamily="'DM Sans', sans-serif" fill={t.gold}>
                    Assumptions
                  </text>
                  {data.assumptions.map((a, i) => (
                    <text key={i} x={LEFT_PAD + 8} y={yOffset + 18 + i * 16}
                      fontSize="10" fontFamily="'DM Sans', sans-serif" fill={mutedText}>
                      • {a.length > 80 ? a.slice(0, 79) + "…" : a}
                    </text>
                  ))}
                </g>
              );
              yOffset += 20 + data.assumptions.length * 16 + 12;
            }

            if (hasExternal) {
              sections.push(
                <g key="external">
                  <text x={LEFT_PAD} y={yOffset} fontSize="11" fontWeight="600"
                    fontFamily="'DM Sans', sans-serif" fill={t.gold}>
                    External Factors
                  </text>
                  {data.external_factors.map((f, i) => (
                    <text key={i} x={LEFT_PAD + 8} y={yOffset + 18 + i * 16}
                      fontSize="10" fontFamily="'DM Sans', sans-serif" fill={mutedText}>
                      • {f.length > 80 ? f.slice(0, 79) + "…" : f}
                    </text>
                  ))}
                </g>
              );
              yOffset += 20 + data.external_factors.length * 16 + 12;
            }

            if (hasUnmapped) {
              sections.push(
                <g key="unmapped">
                  <text x={LEFT_PAD} y={yOffset} fontSize="11" fontWeight="600"
                    fontFamily="'DM Sans', sans-serif" fill={mutedText}>
                    Contextual Conditions (Not Mapped)
                  </text>
                  {data.unmapped.map((u, i) => (
                    <text key={i} x={LEFT_PAD + 8} y={yOffset + 18 + i * 16}
                      fontSize="10" fontFamily="'DM Sans', sans-serif" fill={mutedText}>
                      • {u.label}{u.reason ? ` — ${u.reason}` : ""}
                    </text>
                  ))}
                </g>
              );
            }

            return sections;
          })()}
        </svg>
      </div>

      {/* Disclaimer */}
      <p style={{
        fontSize: 10, color: t.textDim, fontStyle: "italic",
        marginTop: 12, lineHeight: 1.5,
      }}>
        This logic model is a linear translation of a non-linear Conditions Web.
        It simplifies mutual causality into sequential steps for funder-facing communication.
      </p>
    </div>
  );
}
