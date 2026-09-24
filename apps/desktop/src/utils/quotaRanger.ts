export interface QuotaRangeTier {
  id: 'critical' | 'low' | 'moderate' | 'healthy' | 'optimal';
  label: string;
  minPercent: number;
  maxPercent: number;
  // SVG Stroke color for rings
  strokeHex: string;
  // Tailwind text color class
  textClass: string;
  // Tailwind bg color class for progress bars
  barClass: string;
  // Gradient for progress bars
  gradientClass: string;
  // Badge styling
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
}

export const QUOTA_RANGES: QuotaRangeTier[] = [
  {
    id: 'optimal',
    label: 'Optimal',
    minPercent: 81,
    maxPercent: 100,
    strokeHex: '#10b981', // emerald-500
    textClass: 'text-emerald-500 dark:text-emerald-400',
    barClass: 'bg-emerald-500',
    gradientClass: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
    dotColor: 'bg-emerald-500'
  },
  {
    id: 'healthy',
    label: 'Healthy',
    minPercent: 61,
    maxPercent: 80,
    strokeHex: '#06b6d4', // cyan-500
    textClass: 'text-cyan-500 dark:text-cyan-400',
    barClass: 'bg-cyan-500',
    gradientClass: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800/60',
    dotColor: 'bg-cyan-500'
  },
  {
    id: 'moderate',
    label: 'Moderate',
    minPercent: 36,
    maxPercent: 60,
    strokeHex: '#f59e0b', // amber-500
    textClass: 'text-amber-500 dark:text-amber-400',
    barClass: 'bg-amber-500',
    gradientClass: 'bg-gradient-to-r from-amber-600 to-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'low',
    label: 'Low',
    minPercent: 16,
    maxPercent: 35,
    strokeHex: '#f97316', // orange-500
    textClass: 'text-orange-500 dark:text-orange-400',
    barClass: 'bg-orange-500',
    gradientClass: 'bg-gradient-to-r from-orange-600 to-orange-400',
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-300',
    badgeBorder: 'border-orange-200 dark:border-orange-800/60',
    dotColor: 'bg-orange-500'
  },
  {
    id: 'critical',
    label: 'Critical',
    minPercent: 0,
    maxPercent: 15,
    strokeHex: '#f43f5e', // rose-500
    textClass: 'text-rose-500 dark:text-rose-400',
    barClass: 'bg-rose-500',
    gradientClass: 'bg-gradient-to-r from-rose-600 to-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    dotColor: 'bg-rose-500'
  }
];

export function getQuotaRangeTier(percentage: number): QuotaRangeTier {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  if (clamped >= 81) return QUOTA_RANGES[0]; // optimal
  if (clamped >= 61) return QUOTA_RANGES[1]; // healthy
  if (clamped >= 36) return QUOTA_RANGES[2]; // moderate
  if (clamped >= 16) return QUOTA_RANGES[3]; // low
  return QUOTA_RANGES[4]; // critical
}
