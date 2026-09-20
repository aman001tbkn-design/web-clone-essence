import { useRef, useState, type DragEvent } from "react";
import { FileUp, Globe, Loader2, Type, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ingestFile, ingestPastedText, ingestWebsite, type SourceInput } from "@/lib/ingest";
import { MAX_SOURCES, notebookStore, type Notebook } from "@/lib/notebooks";

interface AddSourceDialogProps {
  notebook: Notebook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSourceDialog = ({ notebook, open, onOpenChange }: AddSourceDialogProps) => {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [text, setText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const remaining = MAX_SOURCES - notebook.sources.length;

  const add = (input: SourceInput) => {
    const source = notebookStore.addSource(notebook.id, input);
    toast.success(`Added "${source.title}"`, { description: `${source.wordCount.toLocaleString()} words` });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    let added = 0;
    for (const file of list.slice(0, remaining)) {
      try {
        add(await ingestFile(file));
        added += 1;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Couldn't read ${file.name}`);
      }
    }
    if (list.length > remaining) toast.error(`Only ${remaining} more sources fit in this notebook.`);
    setBusy(false);
    if (added) onOpenChange(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  const handleUrl = async () => {
    setBusy(true);
    try {
      add(await ingestWebsite(url));
      setUrl("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that link");
    } finally {
      setBusy(false);
    }
  };

  const handleText = () => {
    try {
      add(ingestPastedText(textTitle, text));
      setText("");
      setTextTitle("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add text");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add sources</DialogTitle>
          <DialogDescription>
            Sources let Research AI base its responses on the information that matters most to you. {remaining} of{" "}
            {MAX_SOURCES} slots remaining.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload" className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="upload">
              <FileUp className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="link">
              <Globe className="w-4 h-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="w-4 h-4 mr-2" />
              Paste text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                dragging ? "border-accent bg-accent/5" : "border-border bg-muted/30"
              }`}
            >
              {busy ? (
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-accent" />
              ) : (
                <FileUp className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              )}
              <p className="font-medium text-foreground mb-1">{busy ? "Reading your files…" : "Drag & drop files here"}</p>
              <p className="text-sm text-muted-foreground mb-4">PDF, TXT, Markdown, CSV, JSON, HTML</p>
              <Button variant="auth" size="sm" disabled={busy} onClick={() => fileInput.current?.click()}>
                Choose files
              </Button>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.yaml,.yml,.log,text/*,application/pdf,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) void handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-url">Website or YouTube URL</Label>
              <Input
                id="source-url"
                placeholder="https://example.com/article or https://youtu.be/…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !busy && url.trim() && void handleUrl()}
                disabled={busy}
              />
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
              <Youtube className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Web pages are read directly in your browser. For YouTube, the video's title and channel are saved — paste
                the transcript as text to chat about what's said in the video.
              </span>
            </div>
            <Button variant="hero" onClick={handleUrl} disabled={busy || !url.trim()} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="animate-spin" />
                  Fetching…
                </>
              ) : (
                "Add link"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-title">Title (optional)</Label>
              <Input
                id="source-title"
                placeholder="Lecture notes, meeting transcript…"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-text">Text</Label>
              <Textarea
                id="source-text"
                rows={8}
                placeholder="Paste the text you want to ask questions about…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <Button variant="hero" onClick={handleText} disabled={!text.trim()} className="w-full">
              Add text
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddSourceDialog;
