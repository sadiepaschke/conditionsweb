import pool, { ageQuery } from "../pool.js";

export async function syncConnections(
  webId: string,
  edges: { from: string; to: string; relationship: string; description?: string }[]
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get condition ID map (ai_node_id -> uuid)
    const conditions = await client.query(
      "SELECT id, ai_node_id FROM conditions WHERE web_id = $1",
      [webId]
    );
    const idMap = new Map(conditions.rows.map((r: any) => [r.ai_node_id, r.id]));

    // Delete existing connections for this web and re-insert
    await client.query("DELETE FROM connections WHERE web_id = $1", [webId]);

    for (const edge of edges) {
      const sourceId = idMap.get(edge.from);
      const targetId = idMap.get(edge.to);
      if (!sourceId || !targetId) continue;

      await client.query(
        `INSERT INTO connections (web_id, source_id, target_id, type, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [webId, sourceId, targetId, edge.relationship, edge.description || null]
      );
    }

    await client.query("COMMIT");

    // Mirror to AGE graph
    try {
      await syncConnectionsToGraph(webId, edges);
    } catch (e) {
      console.warn("AGE graph edge sync failed (non-fatal):", e);
    }

    return { synced: edges.length };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function syncConnectionsToGraph(webId: string, edges: any[]) {
  // Clear existing edges for this web in the graph
  try {
    await ageQuery(
      `MATCH (a:Condition {web_id: '${webId}'})-[r]->(b:Condition {web_id: '${webId}'})
       DELETE r`
    );
  } catch (e) {}

  for (const edge of edges) {
    try {
      const relType = edge.relationship.toUpperCase();
      await ageQuery(
        `MATCH (a:Condition {ai_id: '${edge.from}', web_id: '${webId}'}),
               (b:Condition {ai_id: '${edge.to}', web_id: '${webId}'})
         CREATE (a)-[:${relType}]->(b)`
      );
    } catch (e) {
      // Best-effort
    }
  }
}

export async function getConnectionDensity(webId: string) {
  const result = await pool.query(
    `SELECT c.ai_node_id,
            (SELECT COUNT(*) FROM connections WHERE source_id = c.id AND web_id = $1)
            + (SELECT COUNT(*) FROM connections WHERE target_id = c.id AND web_id = $1)
            AS connection_count
     FROM conditions c WHERE c.web_id = $1`,
    [webId]
  );
  return result.rows;
}
