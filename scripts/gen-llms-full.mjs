/**
 * Generate build/llms-full.txt — an expanded, single-fetch corpus for agents.
 *
 * Prepends the structured /llms.txt overview, then inlines the full Markdown
 * of every doc page. Runs as a `postbuild` step (after `docusaurus build`),
 * writing into the already-generated build/ output.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DOCS = "docs";
const SITE = "https://docs.atomic.dev";
const OUT = "build/llms-full.txt";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const stripFrontMatter = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, "");

function titleOf(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function urlOf(file) {
  const rel = path
    .relative(DOCS, file)
    .split(path.sep)
    .join("/")
    .replace(/\.mdx?$/, "");
  return rel === "intro" ? `${SITE}/` : `${SITE}/${rel}`;
}

const intro = (await readFile("static/llms.txt", "utf8")).trimEnd();
const files = (await walk(DOCS)).sort();

let out = `${intro}\n\n---\n\n# Full documentation content\n`;
for (const file of files) {
  const body = stripFrontMatter(await readFile(file, "utf8")).trim();
  out += `\n\n## ${titleOf(body, path.basename(file))}\nSource: ${urlOf(file)}\n\n${body}\n`;
}

await writeFile(OUT, out, "utf8");
console.log(`[llms-full] wrote ${OUT} from ${files.length} docs`);
