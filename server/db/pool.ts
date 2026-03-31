import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "conditions_web",
  password: process.env.DB_PASSWORD || "dev_password",
  database: process.env.DB_NAME || "conditions_web",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected pool error:", err);
});

export default pool;

// Helper for AGE queries
export async function ageQuery(cypher: string, params?: Record<string, any>) {
  const client = await pool.connect();
  try {
    await client.query("LOAD 'age'");
    await client.query("SET search_path = ag_catalog, '$user', public");

    const result = await client.query(
      `SELECT * FROM cypher('conditions_graph', $$ ${cypher} $$) AS (result agtype)`,
    );
    return result.rows;
  } finally {
    client.release();
  }
}
