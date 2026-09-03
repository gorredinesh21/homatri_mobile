export function generateSmartUsername(fullName, phone) {
  if (fullName && fullName.trim().length > 0) {
    const sanitized = fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${sanitized.slice(0, 20)}_${randomSuffix}`;
  }
  const phoneDigits = (phone || "").replace(/\D/g, "").slice(-4) || "0000";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `foodie_${phoneDigits}_${randomSuffix}`;
}

export function sanitizeUsername(raw) {
  return (raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 20);
}
