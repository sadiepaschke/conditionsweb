import type { WebData, ConditionNode, Edge } from "../types";

/**
 * Merge incoming AI web data with current state, preserving manual user edits.
 * - Incoming AI nodes replace existing AI nodes (full state from AI)
 * - Manual nodes (source === "manual") not in incoming set are preserved
 * - Edges: incoming edges + current edges for manual nodes (deduped)
 */
export function mergeWebData(current: WebData, incoming: WebData): WebData {
  const incomingIds = new Set(incoming.nodes.map(n => n.id));

  // Preserve manual nodes that aren't in the incoming set
  const preservedManual = current.nodes.filter(
    n => n.source === "manual" && !incomingIds.has(n.id)
  );

  const mergedNodes = [...incoming.nodes, ...preservedManual];
  const mergedNodeIds = new Set(mergedNodes.map(n => n.id));

  // Deduplicate edges by from+to+relationship
  const edgeKey = (e: Edge) => `${e.from}|${e.to}|${e.relationship}`;
  const seen = new Set<string>();

  const mergedEdges: Edge[] = [];

  // Add all incoming edges that reference valid nodes
  for (const e of incoming.edges) {
    if (mergedNodeIds.has(e.from) && mergedNodeIds.has(e.to)) {
      const key = edgeKey(e);
      if (!seen.has(key)) {
        seen.add(key);
        mergedEdges.push(e);
      }
    }
  }

  // Preserve current edges involving manual nodes (if both endpoints still exist)
  for (const e of current.edges) {
    const key = edgeKey(e);
    if (!seen.has(key) && mergedNodeIds.has(e.from) && mergedNodeIds.has(e.to)) {
      const fromNode = mergedNodes.find(n => n.id === e.from);
      const toNode = mergedNodes.find(n => n.id === e.to);
      // Keep if at least one endpoint is manual
      if (fromNode?.source === "manual" || toNode?.source === "manual") {
        seen.add(key);
        mergedEdges.push(e);
      }
    }
  }

  return { nodes: mergedNodes, edges: mergedEdges };
}

/**
 * Find nodes with zero connections (neither source nor target of any edge).
 */
export function findDisconnectedNodes(nodes: ConditionNode[], edges: Edge[]): Set<string> {
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  const disconnected = new Set<string>();
  for (const n of nodes) {
    if (!connected.has(n.id)) {
      disconnected.add(n.id);
    }
  }
  return disconnected;
}
