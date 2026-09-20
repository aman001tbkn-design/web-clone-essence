import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Bookmark, Eraser, Loader2, SendHorizontal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { answerQuestion, keyTerms } from "@/lib/research";
import { notebookStore, type ChatMessage, type Citation, type Notebook } from "@/lib/notebooks";

interface ChatPanelProps {
  notebook: Notebook;
  onCitationHover?: (sourceId: string | null) => void;
}

const CitationChip = ({
  citation,
  notebook,
  onHover,
}: {
  citation: Citation;
  notebook: Notebook;
  onHover?: (sourceId: string | null) => void;
}) => {
  const source = notebook.sources.find((s) => s.id === citation.sourceId);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => onHover?.(citation.sourceId)}
          onMouseLeave={() => onHover?.(null)}
          className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-semibold align-middle hover:bg-accent/25 transition-colors"
          aria-label={`Citation ${citation.index}`}
        >
          {citation.index}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm" align="start">
        <div className="text-xs font-medium text-muted-foreground mb-2 truncate">{source?.title ?? "Removed source"}</div>
        <p className="leading-relaxed text-foreground max-h-60 overflow-y-auto">{citation.passage}</p>
      </PopoverContent>
    </Popover>
  );
};

const renderWithCitations = (message: ChatMessage, notebook: Notebook, onHover?: (id: string | null) => void) => {
  const citations = message.citations ?? [];
  const byIndex = new Map(citations.map((c) => [c.index, c]));
  return message.content.split("\n").map((line, li) => (
    <p key={li} className={line ? "" : "h-2"}>
      {line.split(/(\[\d+\])/g).map((part, pi) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const citation = byIndex.get(Number(match[1]));
          return citation ? (
            <CitationChip key={pi} citation={citation} notebook={notebook} onHover={onHover} />
          ) : (
            <Fragment key={pi}>{part}</Fragment>
          );
        }
        return <Fragment key={pi}>{part}</Fragment>;
      })}
    </p>
  ));
};

const ChatPanel = ({ notebook, onCitationHover }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasSources = notebook.sources.length > 0;

  const suggestions = useMemo(() => {
    if (!hasSources) return [];
    const terms = keyTerms(notebook.sources, 3);
    return [
      "Summarize the main points of my sources",
      ...terms.map((t) => `What do the sources say about ${t}?`),
    ].slice(0, 4);
  }, [notebook.sources, hasSources]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notebook.messages.length, thinking]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q || thinking) return;
    notebookStore.addMessage(notebook.id, { role: "user", content: q });
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const answer = answerQuestion(q, notebookStore.get(notebook.id)?.sources ?? []);
      notebookStore.addMessage(notebook.id, { role: "assistant", content: answer.content, citations: answer.citations });
      setThinking(false);
    }, 450 + Math.random() * 400);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const saveToNotes = (message: ChatMessage) => {
    const previous = notebook.messages[notebook.messages.indexOf(message) - 1];
    notebookStore.addNote(notebook.id, {
      kind: "saved",
      title: previous?.role === "user" ? previous.content.slice(0, 80) : "Saved response",
      content: message.content,
    });
    toast.success("Saved to notes");
  };

  return (
    <section className="flex flex-col h-full bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="font-semibold text-foreground">Chat</h2>
          <p className="text-xs text-muted-foreground">Answers are grounded in your sources with citations</p>
        </div>
        {notebook.messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => notebookStore.clearMessages(notebook.id)}>
            <Eraser />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {notebook.messages.length === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {hasSources ? "Ask anything about your sources" : "Add a source to get started"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {hasSources
                  ? "Every answer cites the passages it came from, so you can check the facts."
                  : "Upload PDFs, websites, YouTube videos or paste text, then ask questions here."}
              </p>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="text-sm px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {notebook.messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                    : "group max-w-[92%] rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground space-y-1"
                }
              >
                {message.role === "user" ? message.content : renderWithCitations(message, notebook, onCitationHover)}
                {message.role === "assistant" && (
                  <div className="pt-2 flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => saveToNotes(message)}>
                      <Bookmark className="!size-3.5" />
                      Save to note
                    </Button>
                    {message.citations?.length ? (
                      <span className="text-xs text-muted-foreground">
                        {message.citations.length} {message.citations.length === 1 ? "citation" : "citations"}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted/60 px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Reading your sources…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={submit} className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder={hasSources ? "Ask a question about your sources…" : "Add a source first, then ask a question"}
            rows={1}
            disabled={!hasSources || thinking}
            className="min-h-[40px] max-h-40 resize-none border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button type="submit" variant="hero" size="icon" className="h-9 w-9 shrink-0" disabled={!hasSources || !input.trim() || thinking} aria-label="Send">
            <SendHorizontal />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 text-center">
          Research AI can make mistakes — check the cited passages.
        </p>
      </form>
    </section>
  );
};

export default ChatPanel;
