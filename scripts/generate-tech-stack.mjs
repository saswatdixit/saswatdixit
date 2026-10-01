// Generates assets/tech-stack.svg (light) and assets/tech-stack-dark.svg (dark).
// Icons are embedded inline, because GitHub blocks external images inside an <img> SVG.
//
// Update flow:
//   npm i --no-save simple-icons @lobehub/icons-static-svg devicon
//   edit CATEGORIES below, then: node scripts/generate-tech-stack.mjs
//
// Icon sources:  si("slug")  -> Simple Icons, mono, brand colour
//                lobe("file") / lobeColor("file") -> LobeHub static icons
//                dev("name", hex) -> Devicon "plain" (mono) with brand colour; devColor("name") -> Devicon full-colour
//                text("g")    -> letter fallback when no logo exists
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
const require = createRequire(import.meta.url);
const SI = require("simple-icons");
const siBySlug = Object.fromEntries(Object.values(SI).filter(i => i?.slug).map(i => [i.slug, i]));
const pkgDir = (p) => dirname(require.resolve(p + "/package.json", { paths: [process.cwd()] }));
const read = (p) => readFileSync(p, "utf8");

const si = (slug, hex) => ({ kind: "path", get: () => { const i = siBySlug[slug]; if (!i) throw new Error("Simple Icons missing: " + slug); return { d: i.path, vb: "0 0 24 24", hex: hex || i.hex }; } });
const lobe = (file, hex) => ({ kind: "inner", mono: true, hex, src: () => read(join(pkgDir("@lobehub/icons-static-svg"), "icons", file + ".svg")) });
const lobeColor = (file) => ({ kind: "inner", mono: false, src: () => read(join(pkgDir("@lobehub/icons-static-svg"), "icons", file + ".svg")) });
const dev = (name, hex) => ({ kind: "inner", mono: true, hex, src: () => read(join(pkgDir("devicon"), "icons", name, name + "-plain.svg")) });
const devColor = (name) => ({ kind: "inner", mono: false, src: () => read(join(pkgDir("devicon"), "icons", name, name + "-original.svg")) });
const text = (ch) => ({ kind: "text", ch });

const CATEGORIES = [
  { title: "PROGRAMMING", rows: [[
    ["Python", si("python")], ["Java", dev("java", "E76F00")], ["C", si("c")],
  ]] },
  { title: "AI / MACHINE LEARNING", rows: [[
    ["NumPy", si("numpy")], ["Pandas", si("pandas")], ["Matplotlib", dev("matplotlib", "11557C")],
    ["Scikit-Learn", si("scikitlearn")], ["TensorFlow", si("tensorflow")], ["PyTorch", si("pytorch")],
    ["OpenCV", si("opencv")], ["MediaPipe", si("mediapipe")],
  ]] },
  { title: "WEB DEVELOPMENT", rows: [[
    ["React", si("react")], ["Node.js", si("nodedotjs")], ["FastAPI", si("fastapi")], ["Vite", si("vite")],
    ["HTML5", si("html5")], ["CSS3", dev("css3", "1572B6")], ["Postman", si("postman")],
  ]] },
  { title: "IDEs & EDITORS", rows: [[
    ["VS Code", dev("vscode", "007ACC")], ["Claude Code", lobeColor("claudecode-color")], ["Antigravity", lobe("antigravity")],
    ["Cursor", si("cursor")], ["OpenAI Codex", lobe("codex")], ["Replit", si("replit")], ["Vim", si("vim")],
    ["Notepad++", si("notepadplusplus", "6CC24A")], ["Sublime Text", si("sublimetext")], ["PyCharm", si("pycharm", "21D789")],
  ]] },
  { title: "AI TOOLS", rows: [[
    ["ChatGPT", lobe("openai")], ["Claude", si("claude")], ["Gemini", si("googlegemini")], ["Perplexity", si("perplexity")],
    ["Replit", si("replit")], ["Manus", lobe("manus")], ["NotebookLM", si("notebooklm")], ["Hugging Face", si("huggingface")],
    ["Lovable", lobeColor("lovable-color")],
  ]] },
  { title: "TOOLS & PLATFORMS", rows: [
    { label: "CODING / DEVELOPMENT", items: [["Git", si("git")], ["GitHub", si("github")]] },
    { label: "DESIGN", items: [["Canva", devColor("canva")], ["Figma", si("figma")]] },
    { label: "VIDEO EDITING", items: [["DaVinci Resolve", si("davinciresolve", "5B8DB8")], ["CapCut", lobe("capcut")]] },
    { label: "CLOUD / DEPLOYMENT / INFRASTRUCTURE", items: [["AWS", lobe("aws", "FF9900")], ["Vercel", si("vercel")], ["Render", si("render")], ["Railway", si("railway")], ["Docker", si("docker")]] },
  ] },
];

const THEMES = {
  light: { file: "tech-stack.svg", heading: "#24292f", name: "#57606a", sub: "#6e7781", neutral: "#24292f", darkBrandBelow: 0, lightBrandAbove: 0.8 },
  dark:  { file: "tech-stack-dark.svg", heading: "#e6edf3", name: "#8b949e", sub: "#8b949e", neutral: "#e6edf3", darkBrandBelow: 0.12, lightBrandAbove: 2 },
};
const lum = (hex) => { const c = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const tint = (hex, t) => {
  if (!hex) return t.neutral;
  hex = hex.replace("#", "");
  const l = lum(hex);
  if (l < t.darkBrandBelow || (t === THEMES.light && l < 0.04)) return t.neutral;
  if (l > t.lightBrandAbove) return "#6e7781";
  return "#" + hex;
};

const W = 830, CELL = 74, ICON = 28, GAP_NAME = 12, LINE = 13, HEAD_H = 26, SUB_H = 20, ROW_GAP = 20, CAT_GAP = 22;
const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const lines = (name) => { const i = name.indexOf(" "); return name.length > 9 && i > 0 ? [name.slice(0, i), name.slice(i + 1)] : [name]; };

let uid = 0;
function iconSvg(def, x, y, t) {
  const box = `x="${x}" y="${y}" width="${ICON}" height="${ICON}"`;
  if (def.kind === "path") { const g = def.get(); return `<svg ${box} viewBox="${g.vb}"><path fill="${tint(g.hex, t)}" d="${g.d}"/></svg>`; }
  if (def.kind === "text") return `<text x="${x + ICON / 2}" y="${y + ICON - 3}" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="600" fill="${t.neutral}">${def.ch}</text>`;
  let raw = def.src();
  const vb = raw.match(/viewBox="([^"]+)"/)[1];
  let inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>[\s\S]*?<\/title>/g, "");
  const n = ++uid;
  inner = inner.replace(/id="([^"]+)"/g, (_, id) => `id="i${n}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#i${n}-${id})`);
  const rootFill = /fill-rule="evenodd"/.test(raw.match(/<svg[^>]*>/)[0]) ? ` fill-rule="evenodd"` : "";
  if (def.mono) {
    const hex = def.hex ?? raw.match(/fill="(#[0-9a-fA-F]{6})"/)?.[1];
    return `<svg ${box} viewBox="${vb}" fill="${tint(hex, t)}"${rootFill}>${inner.replace(/ fill="#[0-9a-fA-F]{6}"/g, "")}</svg>`;
  }
  return `<svg ${box} viewBox="${vb}"${rootFill}>${inner}</svg>`;
}

function build(t) {
  let y = 0; const out = [];
  CATEGORIES.forEach((cat, ci) => {
    out.push(`<text x="0" y="${y + 12}" font-family="${FONT}" font-size="12" font-weight="700" letter-spacing="1.2" fill="${t.heading}">${esc(cat.title)}</text>`);
    y += HEAD_H;
    const groups = Array.isArray(cat.rows[0]) && !cat.rows[0].label ? cat.rows.map(items => ({ items })) : cat.rows;
    groups.forEach((g) => {
      if (g.label) { out.push(`<text x="0" y="${y + 11}" font-family="${FONT}" font-size="10" letter-spacing="0.8" fill="${t.sub}">${esc(g.label)}</text>`); y += SUB_H; }
      const maxLines = Math.max(...g.items.map(([n]) => lines(n).length));
      g.items.forEach(([name, def], i) => {
        const cx = i * CELL + CELL / 2;
        out.push(iconSvg(def, cx - ICON / 2, y, t));
        lines(name).forEach((ln, li) => out.push(`<text x="${cx}" y="${y + ICON + GAP_NAME + li * LINE}" text-anchor="middle" font-family="${FONT}" font-size="11" fill="${t.name}">${esc(ln)}</text>`));
      });
      y += ICON + GAP_NAME + (maxLines - 1) * LINE + ROW_GAP - 6;
    });
    y += CAT_GAP - (cat.rows.length ? 0 : 0);
  });
  y -= CAT_GAP;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Math.ceil(y)}" viewBox="0 0 ${W} ${Math.ceil(y)}" role="img" aria-label="Tech stack"><title>Tech stack</title>\n${out.join("\n")}\n</svg>\n`;
}

const outDir = join(process.cwd(), "assets");
mkdirSync(outDir, { recursive: true });
for (const t of Object.values(THEMES)) { uid = 0; writeFileSync(join(outDir, t.file), build(t)); console.log("wrote assets/" + t.file); }
