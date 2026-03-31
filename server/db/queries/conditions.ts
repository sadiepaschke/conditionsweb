import pool, { ageQuery } from "../pool.js";

export async function syncConditions(
  webId: string,
  nodes: { id: string; label: string; domain: string; is_program_contribution?: boolean; subpopulation?: string[]; confidence?: string; felt_experience?: string }[],
  turnNumber?: number
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get existing conditions for this web
    const existing = await client.query(
      "SELECT id, ai_node_id FROM conditions WHERE web_id = $1",
      [webId]
    );
    const existingMap = new Map(existing.rows.map((r: any) => [r.ai_node_id, r.id]));
    const incomingIds = new Set(nodes.map(n => n.id));

    // Delete conditions no longer in the AI output
    const toDelete = existing.rows.filter((r: any) => !incomingIds.has(r.ai_node_id));
    for (const row of toDelete) {
      await client.query("DELETE FROM conditions WHERE id = $1", [row.id]);
    }

    // Upsert conditions
    for (const node of nodes) {
      if (existingMap.has(node.id)) {
        await client.query(
          `UPDATE conditions SET name = $1, domain = $2, is_program_contribution = $3,
           subpopulation = $4, confidence = $5, felt_experience = $6
           WHERE web_id = $7 AND ai_node_id = $8`,
          [node.label, node.domain, node.is_program_contribution || false,
           node.subpopulation || null, node.confidence || "explicit",
           node.felt_experience || null, webId, node.id]
        );
      } else {
        await client.query(
          `INSERT INTO conditions (web_id, ai_node_id, name, domain, is_program_contribution,
           subpopulation, source_turn, confidence, felt_experience)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [webId, node.id, node.label, node.domain, node.is_program_contribution || false,
           node.subpopulation || null, turnNumber || null,
           node.confidence || "explicit", node.felt_experience || null]
        );
      }
    }

    await client.query("COMMIT");

    // Mirror to AGE graph
    try {
      await syncConditionsToGraph(webId, nodes);
    } catch (e) {
      console.warn("AGE graph sync failed (non-fatal):", e);
    }

    return { synced: nodes.length, deleted: toDelete.length };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function syncConditionsToGraph(webId: string, nodes: any[]) {
  for (const node of nodes) {
    const safeLabel = node.label.replace(/'/g, "\\'");
    try {
      await ageQuery(
        `MERGE (c:Condition {ai_id: '${node.id}', web_id: '${webId}'})
         SET c.name = '${safeLabel}', c.domain = '${node.domain}',
             c.is_program_contribution = ${node.is_program_contribution || false}
         RETURN c`
      );
    } catch (e) {
      // AGE graph sync is best-effort
    }
  }
}

export async function getConditionsByWeb(webId: string) {
  const result = await pool.query(
    "SELECT * FROM conditions WHERE web_id = $1 ORDER BY created_at",
    [webId]
  );
  return result.rows;
}
