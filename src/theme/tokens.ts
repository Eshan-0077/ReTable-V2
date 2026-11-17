import type { AccentPalette } from '../types/timetable';

export interface PaletteOption {
  id: AccentPalette;
  label: string;
  swatchLight: string;
  swatchDark: string;
  tintPreview: string;
}

export const ACCENT_PALETTES: PaletteOption[] = [
  {
    id: 'sage',
    label: 'Sage',
    swatchLight: '#6FA995',
    swatchDark: '#7BC9B0',
    tintPreview: '#E4F0EA',
  },
  {
    id: 'lavender',
    label: 'Lavender',
    swatchLight: '#9683CC',
    swatchDark: '#B9A6F2',
    tintPreview: '#ECE7F6',
  },
  {
    id: 'sky',
    label: 'Sky',
    swatchLight: '#6CA5D6',
    swatchDark: '#8AC4F2',
    tintPreview: '#E3EFFA',
  },
  {
    id: 'peach',
    label: 'Peach',
    swatchLight: '#D9936A',
    swatchDark: '#F0B48E',
    tintPreview: '#FAEBDD',
  },
  {
    id: 'rose',
    label: 'Rose',
    swatchLight: '#CE7E96',
    swatchDark: '#EE9DB4',
    tintPreview: '#F8E5EA',
  },
];
