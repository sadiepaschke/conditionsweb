import { useState } from "react";
import { THEME } from "../../constants/theme";
import { EDGE_COLORS } from "../../constants/domains";
import type { ConditionNode, Edge, EdgeRelationship } from "../../types";

const EDGE_TYPES: { value: EdgeRelationship; label: string }[] = [
  { value: "produces", label: "produces" },
  { value: "maintains", label: "maintains" },
  { value: "enables", label: "enables" },
  { value: "constrains", label: "constrains" },
  { value: "blocks", label: "blocks" },
  { value: "amplifies", label: "amplifies" },
  { value: "depends_on", label: "depends on" },
  { value: "addresses", label: "addresses" },
  { value: "partially_addresses", label: "partially addresses" },
];

interface ConnectionEditorProps {
  dark: boolean;
  nodes: ConditionNode[];
  edges: Edge[];
  onUpdateEdges: (edges: Edge[]) => void;
}

export default function ConnectionEditor({ dark, nodes, edges, onUpdateEdges }: ConnectionEditorProps) {
  const t = dark ? THEME.dark : THEME.light;
  const [adding, setAdding] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [relType, setRelType] = useState<EdgeRelationship>("enables");

  const addConnection = () => {
    if (!fromId || !toId || fromId === toId) return;
    const exists = edges.some(e => e.from === fromId && e.to === toId);
    if (exists) return;
    onUpdateEdges([...edges, { from: fromId, to: toId, relationship: relType }]);
    setFromId("");
    setToId("");
    setAdding(false);
  };

  const deleteConnection = (index: number) => {
    onUpdateEdges(edges.filter((_, i) => i !== index));
  };

  const getLabel = (id: string) => nodes.find(n => n.id === id)?.label || id;

  const selectStyle = {
    padding: "6px 8px", fontSize: 11,
    background: t.surface, border: `1px solid ${t.border}`,
    borderRadius: 4, color: t.text,
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    width: "100%",
  };

  return (
    <div style={{ padding: "12px 0" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Connections ({edges.length})
        </span>
        <button
          onClick={() => setAdding(!adding)}
          style={{
            padding: "3px 10px", fontSize: 9, borderRadius: 4,
            background: `${t.gold}15`, border: `1px solid ${t.borderAccent}`,
            color: t.gold, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}
        >
          + Add
        </button>
      </div>

      {adding && (
        <div style={{
          padding: 10, borderRadius: 8, marginBottom: 12,
          background: `${t.gold}08`, border: `1px solid ${t.borderAccent}`,
        }}>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 9, color: t.textDim, display: "block", marginBottom: 3 }}>From</label>
            <select value={fromId} onChange={e => setFromId(e.target.value)} style={selectStyle}>
              <option value="">Select condition...</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 6 }}>
            <label style={{ fontSize: 9, color: t.textDim, display: "block", marginBottom: 3 }}>Relationship</label>
            <select value={relType} onChange={e => setRelType(e.target.value as EdgeRelationship)} style={selectStyle}>
              {EDGE_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 9, color: t.textDim, display: "block", marginBottom: 3 }}>To</label>
            <select value={toId} onChange={e => setToId(e.target.value)} style={selectStyle}>
              <option value="">Select condition...</option>
              {nodes.filter(n => n.id !== fromId).map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={addConnection} disabled={!fromId || !toId} style={{
              padding: "5px 12px", fontSize: 10, borderRadius: 4,
              background: `${t.gold}15`, border: `1px solid ${t.borderAccent}`,
              color: t.gold, cursor: fromId && toId ? "pointer" : "not-allowed",
              opacity: fromId && toId ? 1 : 0.4, fontFamily: "'DM Sans', sans-serif",
            }}>Add</button>
            <button onClick={() => setAdding(false)} style={{
              padding: "5px 12px", fontSize: 10, borderRadius: 4,
              background: "transparent", border: "none",
              color: t.textDim, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Connection list */}
      <div style={{ maxHeight: 300, overflowY: "auto" }}>
        {edges.map((edge, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 8px", borderRadius: 4, marginBottom: 2,
            fontSize: 11, color: t.textMuted,
          }}>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getLabel(edge.from)}
            </span>
            <span style={{
              fontSize: 9, padding: "1px 6px", borderRadius: 3,
              background: `${EDGE_COLORS[edge.relationship] || "#888"}20`,
              color: EDGE_COLORS[edge.relationship] || "#888",
              whiteSpace: "nowrap",
            }}>
              {edge.relationship.replace("_", " ")}
            </span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getLabel(edge.to)}
            </span>
            <button onClick={() => deleteConnection(i)} style={{
              background: "none", border: "none", color: t.textDim,
              fontSize: 12, cursor: "pointer", padding: "0 2px", flexShrink: 0,
            }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
