import react from "@vitejs/plugin-react";
import postcss from "postcss";
import { defineConfig, type Plugin } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ compiler: { logDiagnostics: true } }), keepModernFontsPlugin()],
  build: {
    target: "esnext",
    outDir: "../app/public",
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "katex", test: /node_modules\/katex/ },
            { name: "marked", test: /node_modules\/marked/ },
            { name: "react", test: /node_modules\/(react|react-dom|scheduler)/ },
            { name: "fonts", test: /node_modules\/@fontsource/ },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});

// Runs before Vite's own css plugin resolves url()s into asset imports, so the stripped
// woff/ttf files never get emitted into the bundle in the first place.
function keepModernFontsPlugin(): Plugin {
  return {
    name: "keep-modern-fonts",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith(".css")) return;
      if (!id.includes("/@fontsource/") && !id.includes("katex.css")) return;
      return keepModernFonts(code);
    },
  };
}

// Vendored CSS (KaTeX's and @fontsource's prebuilt stylesheets) ships every @font-face with
// legacy woff/ttf sources alongside woff2, even though the build only targets modern browsers.
// Parses the CSS with postcss to find each @font-face's `src` declaration structurally,
// then drops every comma-separated alternative except the woff2 one.
function keepModernFonts(css: string): string {
  const root = postcss.parse(css);
  root.walkAtRules("font-face", (rule) => {
    rule.walkDecls("src", (decl) => {
      decl.value = splitTopLevel(decl.value)
        .filter((alternative) => /format\(\s*(['"])woff2\1\s*\)/i.test(alternative))
        .join(", ");
    });
  });
  return root.toString();
}

// Splits a CSS value on top-level commas, ignoring commas nested inside parens (e.g. inside a
// url() or format() argument list) — used to separate the comma-separated alternatives of an
// @font-face `src` declaration.
function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "(") depth++;
    else if (char === ")") depth--;
    else if (char === "," && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim());
}
