import { useState } from "react";
import { THEME } from "../../constants/theme";
import { NODE_COLORS, DOMAIN_LABELS } from "../../constants/domains";
import ConnectionEditor from "./ConnectionEditor";
import type { ConditionNode, Domain, Edge } from "../../types";

interface ConditionEditorProps {
  dark: boolean;
  nodes: ConditionNode[];
  edges: Edge[];
  onUpdateNodes: (nodes: ConditionNode[]) => void;
  onUpdateEdges: (edges: Edge[]) => void;
  onClose: () => void;
}

export default function ConditionEditor({ dark, nodes, edges, onUpdateNodes, onUpdateEdges, onClose }: ConditionEditorProps) {
  const t = dark ? THEME.dark : THEME.light;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDomain, setEditDomain] = useState<Domain>("situational");
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDomain, setNewDomain] = useState<Domain>("situational");

  const startEdit = (node: ConditionNode) => {
    setEditingId(node.id);
    setEditLabel(node.label);
    setEditDomain(node.domain);
  };

  const saveEdit = () => {
    if (!editingId || !editLabel.trim()) return;
    onUpdateNodes(nodes.map(n =>
      n.id === editingId ? { ...n, label: editLabel.trim(), domain: editDomain } : n
    ));
    setEditingId(null);
  };

  const deleteCondition = (id: string) => {
    onUpdateNodes(nodes.filter(n => n.id !== id));
    onUpdateEdges(edges.filter(e => e.from !== id && e.to !== id));
  };

  const addCondition = () => {
    if (!newLabel.trim()) return;
    const newId = `c-${Date.now()}`;
    onUpdateNodes([...nodes, {
      id: newId,
      label: newLabel.trim(),
      domain: newDomain,
      is_program_contribution: false,
    }]);
    setNewLabel("");
    setAddingNew(false);
  };

  const domainGroups: Record<string, ConditionNode[]> = {};
  for (const n of nodes) {
    if (!domainGroups[n.domain]) domainGroups[n.domain] = [];
    domainGroups[n.domain].push(n);
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: `1px solid ${t.border}`,
      }}>
        <div style={{
          fontSize: 11, textTransform: "uppercase",
          letterSpacing: "0.12em", color: t.textDim,
        }}>
          Edit Conditions
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setAddingNew(true)}
            style={{
              padding: "4px 12px", fontSize: 10, borderRadius: 6,
              background: `${t.gold}15`, border: `1px solid ${t.borderAccent}`,
              color: t.gold, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            + Add
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              color: t.textDim, fontSize: 16, cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
        {/* Add new condition form */}
        {addingNew && (
          <div style={{
            padding: 12, borderRadius: 8, marginBottom: 16,
            background: `${t.gold}08`, border: `1px solid ${t.borderAccent}`,
          }}>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Condition name..."
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") addCondition(); }}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13,
                background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: 6, color: t.text, marginBottom: 8,
                fontFamily: "'DM Sans', sans-serif", outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {(Object.keys(NODE_COLORS) as Domain[]).map(d => (
                <button
                  key={d}
                  onClick={() => setNewDomain(d)}
                  style={{
                    padding: "3px 8px", fontSize: 9, borderRadius: 4,
                    background: newDomain === d ? `${NODE_COLORS[d].bg}30` : "transparent",
                    border: `1px solid ${newDomain === d ? NODE_COLORS[d].bg : t.border}`,
                    color: newDomain === d ? NODE_COLORS[d].bg : t.textDim,
                    cursor: "pointer",
                  }}
                >
                  {DOMAIN_LABELS[d].split(" ")[0]}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addCondition} style={{
                padding: "6px 14px", fontSize: 11, borderRadius: 6,
                background: `${t.gold}15`, border: `1px solid ${t.borderAccent}`,
                color: t.gold, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>Save</button>
              <button onClick={() => setAddingNew(false)} style={{
                padding: "6px 14px", fontSize: 11, borderRadius: 6,
                background: "transparent", border: "none",
                color: t.textDim, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Condition list by domain */}
        {Object.entries(domainGroups).map(([domain, conditions]) => (
          <div key={domain} style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: NODE_COLORS[domain as Domain]?.bg || "#888",
              }} />
              <span style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {DOMAIN_LABELS[domain as Domain] || domain}
              </span>
            </div>
            {conditions.map(node => (
              <div key={node.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: 6, marginBottom: 3,
                background: editingId === node.id ? `${t.gold}08` : "transparent",
                border: `1px solid ${editingId === node.id ? t.borderAccent : "transparent"}`,
              }}>
                {editingId === node.id ? (
                  <>
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                      autoFocus
                      style={{
                        flex: 1, padding: "4px 8px", fontSize: 12,
                        background: t.surface, border: `1px solid ${t.border}`,
                        borderRadius: 4, color: t.text,
                        fontFamily: "'DM Sans', sans-serif", outline: "none",
                      }}
                    />
                    <button onClick={saveEdit} style={{
                      fontSize: 10, color: t.gold, background: "none", border: "none", cursor: "pointer",
                    }}>Save</button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: 12, color: t.text }}>
                      {node.label}
                      {node.is_program_contribution && (
                        <span style={{ fontSize: 9, color: t.gold, marginLeft: 6 }}>program</span>
                      )}
                    </span>
                    <button onClick={() => startEdit(node)} style={{
                      fontSize: 10, color: t.textDim, background: "none", border: "none", cursor: "pointer",
                    }}>Edit</button>
                    <button onClick={() => deleteCondition(node.id)} style={{
                      fontSize: 12, color: t.textDim, background: "none", border: "none", cursor: "pointer",
                    }}>×</button>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Connection editor */}
        {nodes.length > 1 && (
          <ConnectionEditor
            dark={dark}
            nodes={nodes}
            edges={edges}
            onUpdateEdges={onUpdateEdges}
          />
        )}
      </div>
    </div>
  );
}
