import { useState } from "react";
import { ExternalLink, FileText, FileType2, Globe, Plus, Trash2, Type, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddSourceDialog from "@/components/notebook/AddSourceDialog";
import { notebookStore, type Notebook, type Source, type SourceType } from "@/lib/notebooks";

const ICONS: Record<SourceType, typeof FileText> = {
  file: FileText,
  pdf: FileType2,
  website: Globe,
  youtube: Youtube,
  text: Type,
};

const TYPE_LABEL: Record<SourceType, string> = {
  file: "File",
  pdf: "PDF",
  website: "Website",
  youtube: "YouTube",
  text: "Pasted text",
};

interface SourcesPanelProps {
  notebook: Notebook;
  highlightedSourceId?: string | null;
}

const SourcesPanel = ({ notebook, highlightedSourceId }: SourcesPanelProps) => {
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<Source | null>(null);
  const totalWords = notebook.sources.reduce((n, s) => n + s.wordCount, 0);

  const remove = (source: Source) => {
    notebookStore.removeSource(notebook.id, source.id);
    toast(`Removed "${source.title}"`);
  };

  return (
    <aside className="flex flex-col h-full bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h2 className="font-semibold text-foreground">Sources</h2>
          <p className="text-xs text-muted-foreground">
            {notebook.sources.length} {notebook.sources.length === 1 ? "source" : "sources"} · {totalWords.toLocaleString()} words
          </p>
        </div>
        <Button variant="hero" size="sm" onClick={() => setAdding(true)}>
          <Plus />
          Add
        </Button>
      </div>

      {notebook.sources.length === 0 ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex-1 m-4 rounded-xl border-2 border-dashed border-border hover:bg-muted/40 transition-colors flex flex-col items-center justify-center text-center p-6"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-accent" />
          </div>
          <p className="font-medium text-foreground mb-1">Add your first source</p>
          <p className="text-sm text-muted-foreground">PDFs, websites, YouTube videos, or pasted text</p>
        </button>
      ) : (
        <ScrollArea className="flex-1">
          <ul className="p-2 space-y-1">
            {notebook.sources.map((source) => {
              const Icon = ICONS[source.type];
              const highlighted = source.id === highlightedSourceId;
              return (
                <li key={source.id}>
                  <div
                    className={`group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors ${
                      highlighted ? "bg-accent/10" : "hover:bg-muted/60"
                    }`}
                  >
                    <button type="button" onClick={() => setViewing(source)} className="flex items-start gap-3 flex-1 min-w-0 text-left">
                      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{source.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {TYPE_LABEL[source.type]} · {source.wordCount.toLocaleString()} words
                        </div>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                      aria-label={`Remove ${source.title}`}
                      onClick={() => remove(source)}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}

      <AddSourceDialog notebook={notebook} open={adding} onOpenChange={setAdding} />

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-6">{viewing?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {viewing && `${TYPE_LABEL[viewing.type]} · ${viewing.wordCount.toLocaleString()} words`}
              {viewing?.url && (
                <a
                  href={viewing.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  Open original <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{viewing?.content}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

export default SourcesPanel;
