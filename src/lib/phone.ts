export function normalizeIranPhone(input: string) {
  const p = input.replace(/\D/g, "");
  if (p.startsWith("09") && p.length === 11) return p;
  if (p.startsWith("989") && p.length === 12) return "0" + p.slice(2);
  if (p.startsWith("9") && p.length === 10) return "0" + p;
  return "";
}
