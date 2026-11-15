/**
 * @file theme.js
 * @description Exported JavaScript mirror of Tailwind design tokens for Recharts, Canvas, and SVG styling.
 */

export const theme = {
  colors: {
    bgPrimary: '#07070C',
    bgElevated: '#0D0E16',
    bgElevated2: '#12131C',
    borderSubtle: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    textPrimary: '#F5F6FA',
    textSecondary: '#9CA3B8',
    textMuted: '#5B5F73',
    accentIndigo: '#6366F1',
    accentViolet: '#9B6BFF',
    accentPink: '#EC4899',
    accentSuccess: '#22D3A5',
    accentWarning: '#F5B942',
    accentDanger: '#F43F5E',
  },
  gradients: {
    primary: ['#6366F1', '#9B6BFF', '#EC4899'],
    primaryCss: 'linear-gradient(135deg, #6366F1 0%, #9B6BFF 50%, #EC4899 100%)',
  },
  fonts: {
    sans: '"Inter", -apple-system, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  }
};

export default theme;
