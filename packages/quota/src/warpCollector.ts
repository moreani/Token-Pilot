import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export interface WarpAccountQuota {
  accountId: string;
  email: string;
  name: string;
  teamName: string;
  photoUrl?: string;
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  features?: {
    codeSuggestions?: boolean;
    promptSuggestions?: boolean;
    nextCommand?: boolean;
    gitOperations?: boolean;
    voiceEnabled?: boolean;
  };
}

export function getWarpDatabasePath(): string | null {
  const home = process.env.HOME || '';
  const candidates = [
    path.join(
      home,
      'Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite'
    ),
    path.join(home, 'Library/Application Support/dev.warp.Warp-Stable/warp.sqlite'),
    path.join(home, 'Library/Application Support/dev.warp.Warp/warp.sqlite'),
    path.join(home, '.local/share/warp-terminal/warp.sqlite'),
    path.join(home, '.config/warp-terminal/warp.sqlite')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function fetchWarpAccountsQuota(): WarpAccountQuota[] {
  const dbPath = getWarpDatabasePath();
  if (!dbPath) {
    return [];
  }

  try {
    let profiles: Array<{ email: string; display_name: string; photo_url?: string }> = [];
    let teams: Array<{ id: number; name: string; billing_metadata_json: string }> = [];

    // Try native node:sqlite first
    let readViaNative = false;
    try {
      const sqliteModule = (globalThis as any).require
        ? (globalThis as any).require('node:sqlite')
        : null;

      if (sqliteModule && sqliteModule.DatabaseSync) {
        const db = new sqliteModule.DatabaseSync(dbPath, { readOnly: true });
        try {
          profiles = db.prepare('SELECT email, display_name, photo_url FROM user_profiles').all() as any[];
          teams = db.prepare('SELECT id, name, billing_metadata_json FROM teams').all() as any[];
          readViaNative = true;
        } finally {
          db.close();
        }
      }
    } catch {
      readViaNative = false;
    }

    // Fallback to sqlite3 CLI (safe & read-only)
    if (!readViaNative) {
      try {
        const rawProfiles = execSync(
          `sqlite3 "${dbPath}" "SELECT json_group_array(json_object('email', email, 'display_name', display_name, 'photo_url', photo_url)) FROM user_profiles;"`,
          { encoding: 'utf8' }
        ).trim();
        if (rawProfiles) {
          profiles = JSON.parse(rawProfiles);
        }

        const rawTeams = execSync(
          `sqlite3 "${dbPath}" "SELECT json_group_array(json_object('id', id, 'name', name, 'billing_metadata_json', billing_metadata_json)) FROM teams;"`,
          { encoding: 'utf8' }
        ).trim();
        if (rawTeams) {
          teams = JSON.parse(rawTeams);
        }
      } catch (err) {
        console.warn('Warp sqlite3 CLI fallback failed:', err);
      }
    }

    if (!profiles || profiles.length === 0) {
      // Check current_user_information table
      try {
        const rawEmail = execSync(`sqlite3 "${dbPath}" "SELECT email FROM current_user_information LIMIT 1;"`, {
          encoding: 'utf8'
        }).trim();
        if (rawEmail) {
          profiles = [{ email: rawEmail, display_name: rawEmail.split('@')[0] }];
        }
      } catch {}
    }

    const team = teams[0] || { name: 'Personal Team', billing_metadata_json: '{}' };
    let billingMetadata: any = {};
    try {
      billingMetadata = typeof team.billing_metadata_json === 'string'
        ? JSON.parse(team.billing_metadata_json)
        : team.billing_metadata_json || {};
    } catch {}

    const tier = billingMetadata?.tier || {};
    const aiPolicy = tier?.warp_ai_policy || {};
    const limit = typeof aiPolicy?.limit === 'number' && aiPolicy.limit > 0 ? aiPolicy.limit : 2500;
    const planName = tier?.name ? tier.name.replace(/ plan$/i, '') : billingMetadata?.customer_type || 'Prosumer';

    return profiles.map((p) => {
      const email = p.email || 'warp-user';
      const name = p.display_name || email.split('@')[0];
      const accountId = `warp-${email.replace(/[@.]/g, '_')}`;

      return {
        accountId,
        email,
        name,
        teamName: team.name || `${name}'s Team`,
        photoUrl: p.photo_url || undefined,
        plan: planName,
        limit,
        used: 0,
        remaining: limit,
        features: {
          codeSuggestions: Boolean(aiPolicy?.is_code_suggestions_toggleable),
          promptSuggestions: Boolean(aiPolicy?.is_prompt_suggestions_toggleable),
          nextCommand: Boolean(aiPolicy?.is_next_command_enabled),
          gitOperations: Boolean(aiPolicy?.is_git_operations_ai_enabled),
          voiceEnabled: Boolean(aiPolicy?.is_voice_enabled)
        }
      };
    });
  } catch (err) {
    console.error('Error fetching Warp accounts quota:', err);
    return [];
  }
}
