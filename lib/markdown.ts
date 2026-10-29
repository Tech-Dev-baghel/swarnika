/** Tiny, safe formatter for the editable pages: ## headings, - bullets, **bold**, [text](url), paragraphs. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function inline(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t: string, u: string) => {
      const safe = /^(\/|#|https?:\/\/|mailto:|tel:)/.test(u) ? u : "#";
      const ext = /^https?:\/\//.test(safe);
      return `<a href="${safe}"${ext ? ' target="_blank" rel="noreferrer"' : ""}>${t}</a>`;
    });
}

export function renderMarkdown(src: string) {
  const out: string[] = [];
  let list: string[] = [], para: string[] = [];
  const flush = () => {
    if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; }
    if (list.length) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = []; }
  };
  for (const raw of src.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    if (h) { flush(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const b = /^[-*]\s+(.*)$/.exec(line);
    if (b) { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } list.push(b[1]); continue; }
    if (list.length) flush();
    para.push(line);
  }
  flush();
  return out.join("\n");
}
