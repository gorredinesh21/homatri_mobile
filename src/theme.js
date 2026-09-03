// Shared Homatri design tokens — single source of truth for colors, fonts, money.

export const colors = {
  cream: "#FBF9F6",
  orange: "#E53A00",
  orangeDark: "#C43200",
  orangeLight: "#FFF1EC",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  dark: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
  white: "#FFFFFF",
};

export const fonts = {
  base: "Figtree_400Regular",
  baseMedium: "Figtree_500Medium",
  baseSemiBold: "Figtree_600SemiBold",
  baseBold: "Figtree_700Bold",
  heading: "Fraunces_700Bold",
};

// ₹ formatting with Indian digit grouping (en-IN), e.g. 1250 -> ₹1,250
export function formatINR(amount) {
  const value = Number(amount ?? 0);
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
