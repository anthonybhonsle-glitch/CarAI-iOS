// Automotive engineering design tokens for CarAI
// Muted, high-contrast dashboard palette (Graphite, Brushed Steel, Warm Amber accent)
// Designed for older audience & automotive workshop legibility (WCAG AA compliant)
export const motionTokens = {
  durations: {
    instant: 0.1, // 100ms
    quick: 0.18, // 180ms
    standard: 0.28, // 280ms
    deliberate: 0.55, // 550ms
  },
  easings: {
    instant: [0, 0, 0.2, 1] as const,
    quick: [0.4, 0, 0.2, 1] as const,
    standard: [0.4, 0, 0.2, 1] as const,
    deliberate: [0.16, 1, 0.3, 1] as const,
  },
  springs: {
    bouncy: { type: 'spring', stiffness: 350, damping: 24 },
    gentle: { type: 'spring', stiffness: 240, damping: 22 },
    overshoot: { type: 'spring', stiffness: 280, damping: 19 },
  },
  stagger: {
    standard: 0.04,
    checklist: 0.05,
  },
};

export const themeTokens = {
  colors: {
    // Professional automotive dashboard backgrounds & surfaces
    background: '#0D0F12', // Deep graphite charcoal
    surface: '#15181D', // Instrument cluster casing
    surfaceElevated: '#1D2128', // Raised dial bezel / card
    surfaceSubtle: '#252B33', // Inset sensor well
    border: '#2E3540', // Milled aluminum edge
    borderHighlight: '#434D5C', // Brushed metallic border

    // Restrained, functional accents (Active states only)
    accentAmber: '#F59E0B', // Standard automotive warning / gauge indicator
    accentCopper: '#D97706', // Warm copper mechanical highlight
    accentCyan: '#0284C7', // Technical telemetry readout
    accentEmerald: '#10B981', // System pass & verified status
    accentCrimson: '#EF4444', // Critical DTC fault alert

    // High-contrast, highly legible text tokens (WCAG AA compliant)
    textPrimary: '#F8FAFC', // Pure readable instrument white
    textSecondary: '#CBD5E1', // High contrast steel gray
    textMuted: '#94A3B8', // Subdued metadata gray (never below 4.5:1 ratio)
    dialBezel: '#333C48',
    dialTick: '#E2E8F0',
    needleAmber: '#F59E0B',
  },
  typography: {
    display: 'font-display',
    body: 'font-sans',
    mono: 'font-mono-tech',
    minBodySize: '15px',
  },
};

