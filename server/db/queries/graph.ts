import { ageQuery } from "../pool.js";

export async function findPaths(webId: string, fromId?: string, toId?: string) {
  let cypher: string;

  if (fromId && toId) {
    cypher = `
      MATCH path = (a:Condition {ai_id: '${fromId}', web_id: '${webId}'})
        -[*1..5]->(b:Condition {ai_id: '${toId}', web_id: '${webId}'})
      RETURN path
    `;
  } else if (fromId) {
    cypher = `
      MATCH path = (a:Condition {ai_id: '${fromId}', web_id: '${webId}'})
        -[*1..5]->(b:Condition {web_id: '${webId}'})
      RETURN path
    `;
  } else {
    // Find all paths from program contributions
    cypher = `
      MATCH path = (a:Condition {web_id: '${webId}', is_program_contribution: true})
        -[*1..5]->(b:Condition {web_id: '${webId}'})
      RETURN path
    `;
  }

  return ageQuery(cypher);
}

export async function getProgramPathways(webId: string) {
  return ageQuery(`
    MATCH path = (p:Condition {web_id: '${webId}', is_program_contribution: true})
      -[*1..6]->(c:Condition {web_id: '${webId}'})
    RETURN p.ai_id AS source, c.ai_id AS target, length(path) AS depth
  `);
}

export async function getHighLeverageConditions(webId: string) {
  return ageQuery(`
    MATCH (c:Condition {web_id: '${webId}'})-[r]-()
    WITH c, count(r) AS connections
    WHERE connections >= 3
    RETURN c.ai_id AS id, c.name AS name, c.domain AS domain, connections
    ORDER BY connections DESC
  `);
}
