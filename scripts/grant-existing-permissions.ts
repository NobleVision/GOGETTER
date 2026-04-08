/**
 * One-time migration: grant full permissions to all existing users.
 * Prevents existing users from being locked out after RBAC enforcement.
 *
 * Run: npx tsx scripts/grant-existing-permissions.ts
 */
import "dotenv/config";
import { Pool } from "pg";

const FULL_PERMISSIONS = {
  businessCatalog: true,
  myBusinesses: true,
  monitoring: true,
  tokenUsage: true,
  apiConfig: true,
  webhooks: true,
  settings: true,
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Grant full permissions to all non-admin users with default (all-false) permissions
  const result = await pool.query(
    `UPDATE users
     SET permissions = $1::json
     WHERE role != 'admin'
       AND (permissions IS NULL
            OR NOT (permissions::jsonb @> '{"businessCatalog": true}'::jsonb))`,
    [JSON.stringify(FULL_PERMISSIONS)]
  );

  console.log(
    `✅  Granted full permissions to ${result.rowCount} existing users.`
  );

  await pool.end();
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
