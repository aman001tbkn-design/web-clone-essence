import { useCallback, useSyncExternalStore } from "react";
import { readJSON, uid, writeJSON } from "@/lib/storage";

export type SourceType = "file" | "pdf" | "website" | "youtube" | "text";

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  content: string;
  url?: string;
  wordCount: number;
  addedAt: string;
}

export interface Citation {
  sourceId: string;
  passage: string;
  index: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export type NoteKind = "summary" | "faq" | "study-guide" | "timeline" | "briefing" | "audio" | "saved";

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  content: string;
  createdAt: string;
}

export interface Notebook {
  id: string;
  ownerId: string;
  title: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
  sources: Source[];
  messages: ChatMessage[];
  notes: Note[];
}

export const MAX_SOURCES = 50;
export const MAX_WORDS = 25_000_000;

const KEY = "research-ai:notebooks";

let cache: Notebook[] | null = null;
const listeners = new Set<() => void>();

function load(): Notebook[] {
  if (!cache) cache = readJSON<Notebook[]>(KEY, []);
  return cache;
}

function commit(next: Notebook[]) {
  cache = next;
  writeJSON(KEY, next);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const EMOJIS = ["📘", "🔬", "🧠", "📊", "🗂️", "💡", "📝", "🎧", "🧪", "🌱"];

export const notebookStore = {
  list(ownerId: string) {
    return load()
      .filter((n) => n.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  get(id: string) {
    return load().find((n) => n.id === id) ?? null;
  },
  create(ownerId: string, title?: string) {
    const now = new Date().toISOString();
    const notebook: Notebook = {
      id: uid("nb"),
      ownerId,
      title: title?.trim() || "Untitled notebook",
      emoji: EMOJIS[load().length % EMOJIS.length],
      createdAt: now,
      updatedAt: now,
      sources: [],
      messages: [],
      notes: [],
    };
    commit([notebook, ...load()]);
    return notebook;
  },
  update(id: string, updater: (n: Notebook) => Notebook) {
    commit(
      load().map((n) => (n.id === id ? { ...updater(n), updatedAt: new Date().toISOString() } : n)),
    );
  },
  remove(id: string) {
    commit(load().filter((n) => n.id !== id));
  },
  rename(id: string, title: string) {
    this.update(id, (n) => ({ ...n, title: title.trim() || n.title }));
  },
  addSource(id: string, input: Omit<Source, "id" | "addedAt" | "wordCount">) {
    const notebook = this.get(id);
    if (!notebook) throw new Error("Notebook not found");
    if (notebook.sources.length >= MAX_SOURCES) {
      throw new Error(`Each notebook supports up to ${MAX_SOURCES} sources.`);
    }
    const wordCount = countWords(input.content);
    const total = notebook.sources.reduce((sum, s) => sum + s.wordCount, 0);
    if (total + wordCount > MAX_WORDS) {
      throw new Error("This source would exceed the 25 million word limit for the notebook.");
    }
    if (!input.content.trim()) {
      throw new Error("We couldn't extract any text from that source.");
    }
    const source: Source = { ...input, id: uid("src"), wordCount, addedAt: new Date().toISOString() };
    this.update(id, (n) => ({ ...n, sources: [...n.sources, source] }));
    return source;
  },
  removeSource(id: string, sourceId: string) {
    this.update(id, (n) => ({ ...n, sources: n.sources.filter((s) => s.id !== sourceId) }));
  },
  addMessage(id: string, message: Omit<ChatMessage, "id" | "createdAt">) {
    const full: ChatMessage = { ...message, id: uid("msg"), createdAt: new Date().toISOString() };
    this.update(id, (n) => ({ ...n, messages: [...n.messages, full] }));
    return full;
  },
  clearMessages(id: string) {
    this.update(id, (n) => ({ ...n, messages: [] }));
  },
  addNote(id: string, note: Omit<Note, "id" | "createdAt">) {
    const full: Note = { ...note, id: uid("note"), createdAt: new Date().toISOString() };
    this.update(id, (n) => ({ ...n, notes: [full, ...n.notes] }));
    return full;
  },
  removeNote(id: string, noteId: string) {
    this.update(id, (n) => ({ ...n, notes: n.notes.filter((x) => x.id !== noteId) }));
  },
};

export function useNotebooks(ownerId: string | undefined) {
  const getSnapshot = useCallback(() => load(), []);
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return ownerId ? all.filter((n) => n.ownerId === ownerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
}

export function useNotebook(id: string | undefined) {
  const getSnapshot = useCallback(() => load(), []);
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return id ? all.find((n) => n.id === id) ?? null : null;
}
