'use client';

import { useTheme } from '@/components/layout/theme-provider';

/**
 * Chart colors — validated with the palette checker (CVD separation, lightness band,
 * contrast) for both surfaces. Dark mode uses its own selected steps, not an automatic flip.
 */
const PALETTES = {
  light: {
    series1: '#2a78d6',
    critical: '#d03b3b',
    good: '#0ca30c',
    warning: '#fab219',
    grid: '#e1e0d9',
    axis: '#c3c2b7',
    tick: '#898781',
    surface: '#fdfdfc',
    cursor: 'rgba(11,11,11,0.05)',
  },
  dark: {
    series1: '#3987e5',
    critical: '#d03b3b',
    good: '#0ca30c',
    warning: '#fab219',
    grid: '#2c2c2a',
    axis: '#383835',
    tick: '#898781',
    surface: '#1a1a19',
    cursor: 'rgba(255,255,255,0.06)',
  },
};

export type ChartPalette = (typeof PALETTES)['light'];

export function useChartPalette(): ChartPalette {
  return PALETTES[useTheme().theme];
}
