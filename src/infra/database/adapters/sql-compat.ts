/**
 * Converts SQLite-style `?` placeholders to PostgreSQL-style `$1, $2, ...`
 * Skips placeholders inside single-quoted string literals.
 */
export function sqliteToPostgres(sql: string): string {
  let result = "";
  let paramIndex = 0;
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (ch === "'") {
      // Handle escaped single quotes ('')
      if (inString && i + 1 < sql.length && sql[i + 1] === "'") {
        result += "''";
        i++;
        continue;
      }
      inString = !inString;
      result += ch;
    } else if (ch === "?" && !inString) {
      paramIndex++;
      result += `$${paramIndex}`;
    } else {
      result += ch;
    }
  }

  return result;
}
