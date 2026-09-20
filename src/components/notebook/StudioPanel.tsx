import { useMemo, useState } from "react";
import {
  Bookmark,
  BookOpenCheck,
  Clock,
  Copy,
  FileText,
  Headphones,
  HelpCircle,
  ListChecks,
  Loader2,
  Pause,
  Play,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SimpleMarkdown from "@/components/notebook/SimpleMarkdown";
import { useSpeech } from "@/hooks/use-speech";
import {
  audioScriptToText,
  generateAudioScript,
  generateBriefing,
  generateFAQ,
  generateStudyGuide,
  generateSummary,
  generateTimeline,
  type AudioLine,
} from "@/lib/research";
import { notebookStore, type Note, type NoteKind, type Notebook } from "@/lib/notebooks";

interface StudioPanelProps {
  notebook: Notebook;
}

const GENERATORS: { kind: NoteKind; label: string; icon: typeof FileText; run: (n: Notebook) => string }[] = [
  { kind: "summary", label: "Summary", icon: FileText, run: (n) => generateSummary(n.sources) },
  { kind: "faq", label: "FAQ", icon: HelpCircle, run: (n) => generateFAQ(n.sources) },
  { kind: "study-guide", label: "Study guide", icon: BookOpenCheck, run: (n) => generateStudyGuide(n.sources) },
  { kind: "timeline", label: "Timeline", icon: Clock, run: (n) => generateTimeline(n.sources) },
  { kind: "briefing", label: "Briefing doc", icon: ListChecks, run: (n) => generateBriefing(n.sources) },
];

const KIND_ICON: Record<NoteKind, typeof FileText> = {
  summary: FileText,
  faq: HelpCircle,
  "study-guide": BookOpenCheck,
  timeline: Clock,
  briefing: ListChecks,
  audio: Headphones,
  saved: Bookmark,
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const StudioPanel = ({ notebook }: StudioPanelProps) => {
  const [generating, setGenerating] = useState<NoteKind | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const speech = useSpeech();
  const hasSources = notebook.sources.length > 0;

  const audioNote = useMemo(() => notebook.notes.find((n) => n.kind === "audio") ?? null, [notebook.notes]);
  const audioScript = useMemo<AudioLine[] | null>(() => {
    if (!audioNote) return null;
    return audioNote.content
      .split("\n\n")
      .map((line) => {
        const m = line.match(/^\*\*(Host [AB]):\*\* (.*)$/s);
        return m ? ({ speaker: m[1] as AudioLine["speaker"], text: m[2] } satisfies AudioLine) : null;
      })
      .filter((l): l is AudioLine => !!l);
  }, [audioNote]);

  const generate = (kind: NoteKind) => {
    if (!hasSources) {
      toast.error("Add at least one source first.");
      return;
    }
    setGenerating(kind);
    window.setTimeout(() => {
      const current = notebookStore.get(notebook.id);
      if (!current) return;
      if (kind === "audio") {
        const script = generateAudioScript(current.sources, current.title);
        const existing = current.notes.find((n) => n.kind === "audio");
        if (existing) notebookStore.removeNote(current.id, existing.id);
        notebookStore.addNote(current.id, { kind: "audio", title: "Audio Overview", content: audioScriptToText(script) });
        toast.success("Audio Overview ready", { description: "Press play to listen to two hosts discuss your sources." });
      } else {
        const gen = GENERATORS.find((g) => g.kind === kind);
        if (!gen) return;
        const note = notebookStore.addNote(current.id, { kind, title: gen.label, content: gen.run(current) });
        toast.success(`${gen.label} created`);
        setViewing(note);
      }
      setGenerating(null);
    }, 700 + Math.random() * 500);
  };

  const copyNote = async (note: Note) => {
    try {
      await navigator.clipboard.writeText(note.content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access.");
    }
  };

  const removeNote = (note: Note) => {
    if (note.kind === "audio") speech.stop();
    notebookStore.removeNote(notebook.id, note.id);
    if (viewing?.id === note.id) setViewing(null);
    toast(`Deleted "${note.title}"`);
  };

  return (
    <aside className="flex flex-col h-full bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground">Studio</h2>
        <p className="text-xs text-muted-foreground">Turn your sources into study material</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-foreground">Audio Overview</div>
                <div className="text-xs text-muted-foreground">Two AI hosts talk through your sources</div>
              </div>
            </div>
            {!audioScript ? (
              <Button
                variant="hero"
                size="sm"
                className="w-full"
                disabled={!hasSources || generating === "audio"}
                onClick={() => generate("audio")}
              >
                {generating === "audio" ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                {!speech.supported && (
                  <p className="text-xs text-destructive">Your browser doesn't support speech playback. You can still read the script.</p>
                )}
                <div className="flex items-center gap-2">
                  {speech.status === "playing" ? (
                    <Button variant="hero" size="sm" onClick={speech.pause} aria-label="Pause">
                      <Pause />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      size="sm"
                      disabled={!speech.supported}
                      onClick={() => (speech.status === "paused" ? speech.resume() : speech.play(audioScript))}
                      aria-label="Play"
                    >
                      <Play />
                      {speech.status === "paused" ? "Resume" : "Play"}
                    </Button>
                  )}
                  {speech.status !== "idle" && (
                    <Button variant="auth" size="sm" onClick={speech.stop} aria-label="Stop">
                      <Square />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => audioNote && setViewing(audioNote)}>
                    Script
                  </Button>
                </div>
                {speech.currentLine >= 0 && audioScript[speech.currentLine] && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">{audioScript[speech.currentLine].speaker}:</span>{" "}
                    {audioScript[speech.currentLine].text}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  disabled={generating === "audio"}
                  onClick={() => {
                    speech.stop();
                    generate("audio");
                  }}
                >
                  Regenerate
                </Button>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Generate</h3>
            <div className="grid grid-cols-2 gap-2">
              {GENERATORS.map((g) => (
                <Button
                  key={g.kind}
                  variant="auth"
                  size="sm"
                  className="justify-start h-auto py-2"
                  disabled={!hasSources || generating !== null}
                  onClick={() => generate(g.kind)}
                >
                  {generating === g.kind ? <Loader2 className="animate-spin" /> : <g.icon />}
                  {g.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Notes {notebook.notes.length > 0 && `(${notebook.notes.length})`}
            </h3>
            {notebook.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Generated material and saved chat responses appear here.
              </p>
            ) : (
              <ul className="space-y-1">
                {notebook.notes.map((note) => {
                  const Icon = KIND_ICON[note.kind];
                  return (
                    <li key={note.id} className="group flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors">
                      <button type="button" onClick={() => setViewing(note)} className="flex items-start gap-2 flex-1 min-w-0 text-left">
                        <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{note.title}</div>
                          <div className="text-xs text-muted-foreground">{formatTime(note.createdAt)}</div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                        aria-label={`Delete ${note.title}`}
                        onClick={() => removeNote(note)}
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </ScrollArea>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-6">{viewing?.title}</DialogTitle>
            <DialogDescription>{viewing && `Created ${formatTime(viewing.createdAt)}`}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
            {viewing && <SimpleMarkdown content={viewing.content} />}
          </ScrollArea>
          {viewing && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="auth" size="sm" onClick={() => copyNote(viewing)}>
                <Copy />
                Copy
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeNote(viewing)}>
                <Trash2 />
                Delete
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default StudioPanel;
