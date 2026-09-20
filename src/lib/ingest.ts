import type { Source } from "@/lib/notebooks";

export type SourceInput = Omit<Source, "id" | "addedAt" | "wordCount">;

const TEXT_TYPES = /^(text\/|application\/(json|xml|javascript|x-yaml|csv))/;
const TEXT_EXT = /\.(txt|md|markdown|csv|json|xml|html?|js|ts|tsx|jsx|py|java|c|cpp|h|css|yaml|yml|log|rtf)$/i;

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(text);
  }
  return pages.join("\n\n");
}

export async function ingestFile(file: File): Promise<SourceInput> {
  const title = file.name.replace(/\.[^.]+$/, "") || file.name;
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const content = await extractPdf(file);
    if (!content.trim()) throw new Error(`"${file.name}" has no selectable text (it may be a scanned image).`);
    return { type: "pdf", title, content };
  }
  if (TEXT_TYPES.test(file.type) || TEXT_EXT.test(file.name) || !file.type) {
    const raw = await file.text();
    const content = /\.html?$/i.test(file.name) || file.type === "text/html" ? htmlToText(raw) : raw;
    return { type: "file", title, content };
  }
  if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
    throw new Error(`Audio and video files need a transcript. Paste the transcript of "${file.name}" as text instead.`);
  }
  throw new Error(`Unsupported file type: ${file.type || file.name}. Upload a PDF, text, Markdown, CSV or HTML file.`);
}

export function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, noscript, nav, footer, header, svg, iframe").forEach((el) => el.remove());
  const main = doc.querySelector("main, article") ?? doc.body;
  return (main?.textContent ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

function pageTitle(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() || fallback;
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a URL first.");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  return url;
}

export const isYouTubeUrl = (url: URL) => /(^|\.)(youtube\.com|youtu\.be)$/i.test(url.hostname);

async function fetchText(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.text();
}

export async function ingestWebsite(input: string, signal?: AbortSignal): Promise<SourceInput> {
  const url = normalizeUrl(input);
  if (isYouTubeUrl(url)) return ingestYouTube(url, signal);

  try {
    const html = await fetchText(url.href, signal);
    const content = htmlToText(html);
    if (content.length > 200) return { type: "website", title: pageTitle(html, url.hostname), url: url.href, content };
  } catch {
    /* fall through to the readable-text proxy */
  }

  try {
    const readable = await fetchText(`https://r.jina.ai/${url.href}`, signal);
    const titleMatch = readable.match(/^Title:\s*(.+)$/m);
    const content = readable.replace(/^(Title|URL Source|Published Time|Markdown Content):.*$/gm, "").trim();
    if (content.length > 50) {
      return { type: "website", title: titleMatch?.[1]?.trim() || url.hostname, url: url.href, content };
    }
  } catch {
    /* handled below */
  }
  throw new Error(
    `We couldn't read ${url.hostname} from your browser (the site blocks cross-origin requests). Copy the page text and add it as pasted text instead.`,
  );
}

export async function ingestYouTube(url: URL, signal?: AbortSignal): Promise<SourceInput> {
  const videoId = url.hostname.includes("youtu.be")
    ? url.pathname.slice(1)
    : url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop() ?? "";
  if (!videoId) throw new Error("Couldn't find a video ID in that YouTube link.");
  const canonical = `https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(canonical)}`, { signal });
  if (!res.ok) throw new Error("YouTube didn't return details for that video.");
  const meta = (await res.json()) as { title?: string; author_name?: string; error?: string };
  if (meta.error || !meta.title) throw new Error("That YouTube video is unavailable or private.");
  const content = [
    `${meta.title}`,
    meta.author_name ? `A YouTube video by ${meta.author_name}.` : "",
    `Video URL: ${canonical}`,
    "Transcripts can't be downloaded from the browser. Paste the transcript as a text source to ask questions about the video's content.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { type: "youtube", title: meta.title, url: canonical, content };
}

export function ingestPastedText(title: string, text: string): SourceInput {
  if (!text.trim()) throw new Error("Paste some text first.");
  const firstLine = text.trim().split("\n")[0].slice(0, 60);
  return { type: "text", title: title.trim() || firstLine || "Pasted text", content: text.trim() };
}
