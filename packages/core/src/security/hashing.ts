import { createHash } from 'node:crypto';

export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalJsonStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalJsonStringify(val);
  });

  return '{' + pairs.join(',') + '}';
}

export function computeSha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

export function computeJobSpecHash(spec: unknown): string {
  const canonical = canonicalJsonStringify(spec);
  return computeSha256(canonical);
}

export function computePermissionsHash(permissions: unknown): string {
  const canonical = canonicalJsonStringify(permissions);
  return computeSha256(canonical);
}

export function verifyAuthorizationHashes(
  spec: unknown,
  permissions: unknown,
  expectedSpecHash: string,
  expectedPermissionsHash: string
): { valid: boolean; reason?: string } {
  const currentSpecHash = computeJobSpecHash(spec);
  if (currentSpecHash !== expectedSpecHash) {
    return {
      valid: false,
      reason: `Job spec hash mismatch. Expected ${expectedSpecHash}, computed ${currentSpecHash}`
    };
  }

  const currentPermissionsHash = computePermissionsHash(permissions);
  if (currentPermissionsHash !== expectedPermissionsHash) {
    return {
      valid: false,
      reason: `Permissions hash mismatch. Expected ${expectedPermissionsHash}, computed ${currentPermissionsHash}`
    };
  }

  return { valid: true };
}
