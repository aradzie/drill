export function themeColor(value: string): string {
  const color = value.trim().toLowerCase();
  switch (color) {
    case "black":
    case "#000":
    case "#000000":
      return "light-dark(#000, #fff)";
    case "white":
    case "#fff":
    case "#ffffff":
      return "light-dark(#fff, #000)";
  }
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)) {
    return `light-dark(${color}, oklch(from ${color} max(l, 0.7) c h))`;
  }
  return value;
}
