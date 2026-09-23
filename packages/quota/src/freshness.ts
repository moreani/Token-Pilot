import type { QuotaFreshness } from '@tokenpilot/contracts';

export function calculateFreshness(observedAt: string, now: Date = new Date()): QuotaFreshness {
  const diffMs = now.getTime() - new Date(observedAt).getTime();
  const diffMinutes = diffMs / (1000 * 60);

  if (diffMinutes <= 15) {
    return 'fresh';
  } else if (diffMinutes <= 120) {
    return 'stale';
  } else {
    return 'too_stale';
  }
}
