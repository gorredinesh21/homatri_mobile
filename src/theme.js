// Shared Homatri design tokens — single source of truth for colors, fonts, money.
// Mirrors the website palette (tailwind.config.js): cream #FDF8F0, forest
// #1E6B4E, orange-red #E8501E.

export const colors = {
  cream: '#FDF8F0',
  sand: '#F6EFE3',
  orange: '#E8501E',
  orangeDark: '#C64212',
  orangeLight: '#FDEEE6',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  forest: '#1E6B4E',
  forestDeep: '#124A36',
  forestMist: '#E8F1EC',
  dark: '#1E293B',
  muted: '#64748B',
  border: '#E7DFD2',
  white: '#FFFFFF',
};

export const fonts = {
  base: 'Figtree_400Regular',
  baseMedium: 'Figtree_500Medium',
  baseSemiBold: 'Figtree_600SemiBold',
  baseBold: 'Figtree_700Bold',
  heading: 'Fraunces_700Bold',
};

// ₹ formatting with Indian digit grouping (en-IN), e.g. 1250 -> ₹1,250
export function formatINR(amount) {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}
