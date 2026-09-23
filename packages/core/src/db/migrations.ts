import type { DatabaseSync } from 'node:sqlite';

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db: DatabaseSync) => {
      // 1. Providers table
      db.exec(`
        CREATE TABLE IF NOT EXISTS providers (
          id TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          icon_key TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          capabilities_json TEXT NOT NULL
        );
      `);

      // 2. Accounts table
      db.exec(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          provider_id TEXT NOT NULL,
          display_alias TEXT NOT NULL,
          upstream_identities_json TEXT NOT NULL,
          capabilities_json TEXT NOT NULL,
          auth_status TEXT NOT NULL,
          last_seen_at TEXT,
          enabled INTEGER NOT NULL DEFAULT 1,
          FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
        );
      `);

      // 3. Quota snapshots table
      db.exec(`
        CREATE TABLE IF NOT EXISTS quota_snapshots (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          windows_json TEXT NOT NULL,
          recommendation TEXT NOT NULL,
          recommendation_reason TEXT,
          freshness TEXT NOT NULL,
          raw_source_version TEXT,
          observed_at TEXT NOT NULL,
          FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );
      `);

      // 4. Jobs table
      db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          objective TEXT NOT NULL,
          state TEXT NOT NULL,
          provider_id TEXT,
          account_id TEXT,
          security_profile_id TEXT NOT NULL,
          spec_json TEXT NOT NULL,
          permissions_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          authorized_at TEXT,
          first_execution_at TEXT,
          completed_at TEXT,
          failure_reason TEXT
        );
      `);

      // 5. Execution intents table (immutable once created)
      db.exec(`
        CREATE TABLE IF NOT EXISTS execution_intents (
          job_id TEXT PRIMARY KEY,
          user_confirmed INTEGER NOT NULL,
          confirmed_at TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          account_id TEXT NOT NULL,
          security_profile_id TEXT NOT NULL,
          job_spec_hash TEXT NOT NULL,
          permissions_hash TEXT NOT NULL,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
      `);

      // 6. Job events table
      db.exec(`
        CREATE TABLE IF NOT EXISTS job_events (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          data_json TEXT,
          timestamp TEXT NOT NULL,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
      `);

      // 7. Security and audit events table
      db.exec(`
        CREATE TABLE IF NOT EXISTS audit_events (
          id TEXT PRIMARY KEY,
          job_id TEXT,
          type TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT NOT NULL,
          details_json TEXT,
          timestamp TEXT NOT NULL
        );
      `);

      // 8. Job artifacts table
      db.exec(`
        CREATE TABLE IF NOT EXISTS job_artifacts (
          id TEXT PRIMARY KEY,
          job_id TEXT NOT NULL,
          name TEXT NOT NULL,
          relative_path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          sha256 TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
        );
      `);

      // 9. Local settings
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value_json TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      // 10. Upstream health checks
      db.exec(`
        CREATE TABLE IF NOT EXISTS upstream_health (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT NOT NULL,
          details TEXT,
          critical INTEGER NOT NULL,
          checked_at TEXT NOT NULL
        );
      `);
    }
  }
];

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>;
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const migration of migrations) {
    if (!appliedVersions.has(migration.version)) {
      migration.up(db);
      const stmt = db.prepare(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
      );
      stmt.run(migration.version, migration.name, new Date().toISOString());
    }
  }
}
