export function themeColor(value: string): string {
  const color: Color = { r: 0, g: 0, b: 0, a: 1 };
  if (!parseColor(value.trim().toLowerCase(), color)) {
    return value;
  }
  const light = formatColor(color);
  let dark;
  if (color.r === color.g && color.g === color.b) {
    color.r = 255 - color.r;
    color.g = 255 - color.g;
    color.b = 255 - color.b;
    dark = formatColor(color);
  } else {
    dark = `oklch(from ${light} max(l, 0.7) c h)`;
  }
  return `light-dark(${light}, ${dark})`;
}

type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

function parseColor(value: string, color: Color): boolean {
  switch (value) {
    case "black":
      color.r = 0;
      color.g = 0;
      color.b = 0;
      color.a = 1;
      return true;
    case "gray":
      color.r = 128;
      color.g = 128;
      color.b = 128;
      color.a = 1;
      return true;
    case "silver":
      color.r = 192;
      color.g = 192;
      color.b = 192;
      color.a = 1;
      return true;
    case "white":
      color.r = 255;
      color.g = 255;
      color.b = 255;
      color.a = 1;
      return true;
  }

  const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (hex3) {
    color.r = Number.parseInt(hex3[1], 16) * 17;
    color.g = Number.parseInt(hex3[2], 16) * 17;
    color.b = Number.parseInt(hex3[3], 16) * 17;
    color.a = 1;
    return true;
  }

  const hex4 = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (hex4) {
    color.r = Number.parseInt(hex4[1], 16) * 17;
    color.g = Number.parseInt(hex4[2], 16) * 17;
    color.b = Number.parseInt(hex4[3], 16) * 17;
    color.a = (Number.parseInt(hex4[4], 16) * 17) / 255;
    return true;
  }

  const hex6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex6) {
    color.r = Number.parseInt(hex6[1], 16);
    color.g = Number.parseInt(hex6[2], 16);
    color.b = Number.parseInt(hex6[3], 16);
    color.a = 1;
    return true;
  }

  const hex8 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (hex8) {
    color.r = Number.parseInt(hex8[1], 16);
    color.g = Number.parseInt(hex8[2], 16);
    color.b = Number.parseInt(hex8[3], 16);
    color.a = Number.parseInt(hex8[4], 16) / 255;
    return true;
  }

  return false;
}

function formatColor(color: Color): string {
  const hex = [
    color.r.toString(16).padStart(2, "0"),
    color.g.toString(16).padStart(2, "0"),
    color.b.toString(16).padStart(2, "0"),
  ];
  const alpha = Math.round(color.a * 255);
  if (alpha < 255) {
    hex.push(alpha.toString(16).padStart(2, "0"));
  }
  return `#${hex.join("")}`;
}
