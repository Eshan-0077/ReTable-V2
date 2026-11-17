import type { AccentPalette } from '../types/timetable';

const STANDARD_CANVAS_HEX: Record<AccentPalette, { light: string; dark: string }> = {
  sage: { light: '#eef3f0', dark: '#0b100e' },
  lavender: { light: '#f1eff7', dark: '#0e0d14' },
  sky: { light: '#edf3f8', dark: '#0b1015' },
  peach: { light: '#f7f2ed', dark: '#130e0c' },
  rose: { light: '#f7f0f3', dark: '#130d10' },
};

export function resolveThemeCanvasHex(
  palette: AccentPalette,
  isDark: boolean,
  glassProMax: boolean,
): string {
  if (glassProMax) {
    return isDark ? '#040914' : '#cce0f2';
  }
  const entry = STANDARD_CANVAS_HEX[palette] ?? STANDARD_CANVAS_HEX.sage;
  return isDark ? entry.dark : entry.light;
}
