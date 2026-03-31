import pool from "../pool.js";

export async function createWeb(data: {
  org_name: string;
  program_name: string;
  target_population?: string;
  geography?: string;
  sector?: string;
  ontological_frame?: string;
}) {
  const result = await pool.query(
    `INSERT INTO web_metadata (org_name, program_name, target_population, geography, sector, ontological_frame)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [data.org_name, data.program_name, data.target_population, data.geography, data.sector, data.ontological_frame || "human_systems"]
  );
  return result.rows[0];
}

export async function getWeb(webId: string) {
  const webResult = await pool.query("SELECT * FROM web_metadata WHERE id = $1", [webId]);
  if (!webResult.rows.length) return null;

  const conditionsResult = await pool.query(
    "SELECT * FROM conditions WHERE web_id = $1 ORDER BY created_at",
    [webId]
  );

  const connectionsResult = await pool.query(
    `SELECT c.*, src.ai_node_id as source_ai_id, tgt.ai_node_id as target_ai_id
     FROM connections c
     JOIN conditions src ON c.source_id = src.id
     JOIN conditions tgt ON c.target_id = tgt.id
     WHERE c.web_id = $1`,
    [webId]
  );

  const subpopResult = await pool.query(
    "SELECT * FROM subpopulations WHERE web_id = $1",
    [webId]
  );

  return {
    metadata: webResult.rows[0],
    conditions: conditionsResult.rows,
    connections: connectionsResult.rows,
    subpopulations: subpopResult.rows,
  };
}

export async function updateWeb(webId: string, data: Partial<{
  org_name: string;
  program_name: string;
  target_population: string;
  geography: string;
  sector: string;
  ontological_frame: string;
  status: string;
}>) {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
  }

  if (!fields.length) return null;

  values.push(webId);
  const result = await pool.query(
    `UPDATE web_metadata SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function listWebs() {
  const result = await pool.query(
    "SELECT * FROM web_metadata ORDER BY created_at DESC"
  );
  return result.rows;
}
