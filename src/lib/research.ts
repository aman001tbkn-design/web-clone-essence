import type { Citation, Source } from "@/lib/notebooks";

const STOPWORDS = new Set(
  `a an the and or but if then else of to in on at by for with from as is are was were be been being this that these those it its into about over under again further once here there when where why how all any both each few more most other some such no nor not only own same so than too very can will just don should now i me my we our you your he him his she her they them their what which who whom do does did doing have has had having would could may might must shall`.split(
    /\s+/,
  ),
);

export const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));

const stem = (t: string) => t.replace(/'s$/, "").replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "");

export interface Passage {
  sourceId: string;
  sourceTitle: string;
  text: string;
  index: number;
}

export function splitPassages(source: Source): Passage[] {
  const cleaned = source.content.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const blocks = cleaned.split(/\n{2,}/).flatMap((b) => b.split(/\n/)).map((b) => b.trim()).filter(Boolean);
  const passages: string[] = [];
  let buffer = "";
  for (const block of blocks) {
    const sentences = block.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [block];
    for (const sentence of sentences) {
      buffer = buffer ? `${buffer} ${sentence.trim()}` : sentence.trim();
      if (buffer.length >= 320) {
        passages.push(buffer);
        buffer = "";
      }
    }
    if (buffer.length >= 160) {
      passages.push(buffer);
      buffer = "";
    }
  }
  if (buffer) passages.push(buffer);
  return passages.map((text, index) => ({ sourceId: source.id, sourceTitle: source.title, text, index }));
}

interface ScoredPassage extends Passage {
  score: number;
}

export function retrieve(question: string, sources: Source[], limit = 4): ScoredPassage[] {
  const passages = sources.flatMap(splitPassages);
  if (!passages.length) return [];
  const qTerms = Array.from(new Set(tokenize(question).map(stem)));
  if (!qTerms.length) return [];

  const docFreq = new Map<string, number>();
  const tokenized = passages.map((p) => {
    const terms = tokenize(p.text).map(stem);
    const unique = new Set(terms);
    unique.forEach((t) => docFreq.set(t, (docFreq.get(t) ?? 0) + 1));
    return terms;
  });
  const n = passages.length;

  const scored = passages.map((p, i) => {
    const terms = tokenized[i];
    if (!terms.length) return { ...p, score: 0 };
    const tf = new Map<string, number>();
    terms.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let score = 0;
    let matched = 0;
    for (const q of qTerms) {
      const f = tf.get(q);
      if (!f) continue;
      matched += 1;
      const idf = Math.log(1 + n / (docFreq.get(q) ?? 1));
      score += (f / Math.sqrt(terms.length)) * idf;
    }
    if (matched > 1) score *= 1 + matched / qTerms.length;
    return { ...p, score };
  });

  return scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

const trimPassage = (text: string, max = 420) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

export interface Answer {
  content: string;
  citations: Citation[];
}

export function answerQuestion(question: string, sources: Source[]): Answer {
  if (!sources.length) {
    return {
      content: "Add at least one source to this notebook and I'll answer using only that material, with citations you can check.",
      citations: [],
    };
  }
  const hits = retrieve(question, sources);
  if (!hits.length) {
    return {
      content: `I couldn't find anything in your ${sources.length === 1 ? "source" : `${sources.length} sources`} that addresses "${question.trim()}". Try rephrasing the question or adding a source that covers this topic.`,
      citations: [],
    };
  }

  const citations: Citation[] = hits.map((h, i) => ({ sourceId: h.sourceId, passage: h.text, index: i + 1 }));
  const bySource = new Map<string, number>();
  hits.forEach((h) => bySource.set(h.sourceTitle, (bySource.get(h.sourceTitle) ?? 0) + 1));
  const sourceList = Array.from(bySource.keys());
  const intro =
    sourceList.length === 1
      ? `Based on "${sourceList[0]}", here's what your sources say:`
      : `Drawing on ${sourceList.length} of your sources (${sourceList.map((s) => `"${s}"`).join(", ")}), here's what they say:`;

  const body = hits.map((h, i) => `• ${trimPassage(h.text)} [${i + 1}]`).join("\n\n");
  return { content: `${intro}\n\n${body}`, citations };
}

const titleLine = (title: string) => `# ${title}\n\n`;

function topPassages(sources: Source[], perSource: number) {
  return sources.flatMap((s) => {
    const passages = splitPassages(s);
    const terms = new Map<string, number>();
    passages.forEach((p) => tokenize(p.text).map(stem).forEach((t) => terms.set(t, (terms.get(t) ?? 0) + 1)));
    return passages
      .map((p) => ({
        ...p,
        score: tokenize(p.text)
          .map(stem)
          .reduce((sum, t) => sum + (terms.get(t) ?? 0), 0) / Math.sqrt(p.text.length + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, perSource)
      .sort((a, b) => a.index - b.index);
  });
}

export function keyTerms(sources: Source[], limit = 8) {
  const counts = new Map<string, number>();
  sources.forEach((s) =>
    tokenize(s.content).forEach((t) => {
      if (t.length < 4 || /^\d+$/.test(t)) return;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }),
  );
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

export function generateSummary(sources: Source[]) {
  const passages = topPassages(sources, 2);
  const terms = keyTerms(sources, 6);
  const lines = [
    titleLine("Summary"),
    `This notebook contains ${sources.length} ${sources.length === 1 ? "source" : "sources"} totalling ${sources
      .reduce((n, s) => n + s.wordCount, 0)
      .toLocaleString()} words.`,
    terms.length ? `Recurring themes: ${terms.join(", ")}.` : "",
    "",
    ...sources.map((s) => {
      const own = passages.filter((p) => p.sourceId === s.id);
      return `## ${s.title}\n${own.map((p) => `- ${trimPassage(p.text, 300)}`).join("\n")}`;
    }),
  ];
  return lines.filter((l) => l !== undefined).join("\n");
}

export function generateFAQ(sources: Source[]) {
  const terms = keyTerms(sources, 6);
  const qa = terms.map((term) => {
    const hits = retrieve(term, sources, 1);
    const answer = hits[0] ? trimPassage(hits[0].text, 360) : "Your sources mention this but don't elaborate.";
    const title = hits[0]?.sourceTitle;
    return `**Q: What do the sources say about ${term}?**\nA: ${answer}${title ? ` — _${title}_` : ""}`;
  });
  return `${titleLine("Frequently Asked Questions")}${qa.join("\n\n")}`;
}

export function generateStudyGuide(sources: Source[]) {
  const terms = keyTerms(sources, 10);
  const passages = topPassages(sources, 3);
  const quiz = terms.slice(0, 5).map((t, i) => `${i + 1}. Explain the role of **${t}** as described in your sources.`);
  const glossary = terms.map((t) => {
    const hit = retrieve(t, sources, 1)[0];
    return `- **${t}** — ${hit ? trimPassage(hit.text, 160) : "see sources"}`;
  });
  return [
    titleLine("Study Guide"),
    "## Key ideas",
    ...passages.map((p) => `- ${trimPassage(p.text, 220)} _(${p.sourceTitle})_`),
    "",
    "## Short-answer questions",
    ...quiz,
    "",
    "## Glossary",
    ...glossary,
  ].join("\n");
}

const DATE_RE =
  /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{1,2},? \d{4}|\d{1,2} (?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.? \d{4}|(?:19|20)\d{2}s?|\d{4}-\d{2}-\d{2})\b/gi;

export function generateTimeline(sources: Source[]) {
  const events: { when: string; year: number; text: string; source: string }[] = [];
  sources.forEach((s) =>
    splitPassages(s).forEach((p) => {
      const sentences = p.text.match(/[^.!?]+[.!?]+/g) ?? [p.text];
      sentences.forEach((sentence) => {
        const match = sentence.match(DATE_RE);
        if (!match) return;
        const when = match[0];
        const yearMatch = when.match(/(19|20)\d{2}/);
        events.push({ when, year: yearMatch ? Number(yearMatch[0]) : 0, text: sentence.trim(), source: s.title });
      });
    }),
  );
  if (!events.length) {
    return `${titleLine("Timeline")}No dates or years were found in your sources, so a timeline couldn't be built. Try adding a source that describes events over time.`;
  }
  const seen = new Set<string>();
  const unique = events.filter((e) => (seen.has(e.text) ? false : (seen.add(e.text), true)));
  unique.sort((a, b) => a.year - b.year);
  return `${titleLine("Timeline")}${unique
    .slice(0, 40)
    .map((e) => `- **${e.when}** — ${trimPassage(e.text, 240)} _(${e.source})_`)
    .join("\n")}`;
}

export function generateBriefing(sources: Source[]) {
  const terms = keyTerms(sources, 5);
  const passages = topPassages(sources, 2);
  return [
    titleLine("Briefing Document"),
    "## Purpose",
    `This briefing synthesises ${sources.length} ${sources.length === 1 ? "source" : "sources"}: ${sources
      .map((s) => `"${s.title}"`)
      .join(", ")}.`,
    "",
    "## Main themes",
    ...terms.map((t) => `- ${t.charAt(0).toUpperCase()}${t.slice(1)}`),
    "",
    "## Key excerpts",
    ...passages.map((p) => `> ${trimPassage(p.text, 320)}\n> — ${p.sourceTitle}`),
    "",
    "## Suggested next steps",
    "- Ask follow-up questions in the chat to dig into any theme above.",
    "- Add more sources to strengthen or challenge these findings.",
  ].join("\n");
}

export interface AudioLine {
  speaker: "Host A" | "Host B";
  text: string;
}

export function generateAudioScript(sources: Source[], notebookTitle: string): AudioLine[] {
  const terms = keyTerms(sources, 4);
  const passages = topPassages(sources, 1).slice(0, 4);
  const lines: AudioLine[] = [
    { speaker: "Host A", text: `Welcome to your audio overview of ${notebookTitle}. Today we're digging into ${sources.length} ${sources.length === 1 ? "source" : "sources"}.` },
    { speaker: "Host B", text: terms.length ? `Right, and a few big ideas kept coming up: ${terms.join(", ")}. Let's walk through them.` : "Let's walk through what stood out." },
  ];
  passages.forEach((p, i) => {
    lines.push({ speaker: i % 2 === 0 ? "Host A" : "Host B", text: `From ${p.sourceTitle}: ${trimPassage(p.text, 260).replace(/…$/, "")}.` });
    lines.push({ speaker: i % 2 === 0 ? "Host B" : "Host A", text: i === passages.length - 1 ? "That really ties the sources together." : "Interesting. What else did the material say?" });
  });
  lines.push({ speaker: "Host A", text: "That's our overview. Head back to the notebook to ask follow-up questions, with citations for everything." });
  return lines;
}

export function audioScriptToText(lines: AudioLine[]) {
  return lines.map((l) => `**${l.speaker}:** ${l.text}`).join("\n\n");
}
