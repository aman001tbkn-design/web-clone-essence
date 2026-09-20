import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import AppShell from "@/components/AppShell";
import SourcesPanel from "@/components/notebook/SourcesPanel";
import ChatPanel from "@/components/notebook/ChatPanel";
import StudioPanel from "@/components/notebook/StudioPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { notebookStore, useNotebook } from "@/lib/notebooks";

const TitleEditor = ({ id, title }: { id: string; title: string }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  useEffect(() => setValue(title), [title]);

  const commit = () => {
    notebookStore.rename(id, value);
    setEditing(false);
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="flex items-center gap-2 w-full max-w-md"
      >
        <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus maxLength={80} className="h-9" onBlur={commit} />
        <Button type="submit" size="icon" variant="ghost" className="h-9 w-9 shrink-0" aria-label="Save title">
          <Check />
        </Button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-2 max-w-full font-semibold text-foreground truncate rounded-md px-2 py-1 hover:bg-muted transition-colors"
      title="Rename notebook"
    >
      <span className="truncate">{title}</span>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
  );
};

const NotebookWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const notebook = useNotebook(id);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (notebook) document.title = `${notebook.title} · Research AI`;
    return () => {
      document.title = "Research AI - Understand Anything";
    };
  }, [notebook]);

  if (!notebook || notebook.ownerId !== user?.id) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AppShell
      center={
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
            <Link to="/app" aria-label="Back to notebooks">
              <ArrowLeft />
            </Link>
          </Button>
          <span className="text-xl shrink-0">{notebook.emoji}</span>
          <TitleEditor id={notebook.id} title={notebook.title} />
        </div>
      }
    >
      <main className="flex-1 min-h-0 px-4 py-4 lg:px-6">
        <div className="hidden lg:grid grid-cols-[280px_minmax(0,1fr)_320px] gap-4 h-[calc(100vh-5.5rem)]">
          <SourcesPanel notebook={notebook} highlightedSourceId={highlighted} />
          <ChatPanel notebook={notebook} onCitationHover={setHighlighted} />
          <StudioPanel notebook={notebook} />
        </div>

        <Tabs defaultValue="chat" className="lg:hidden flex flex-col h-[calc(100vh-5.5rem)]">
          <TabsList className="grid grid-cols-3 w-full mb-3">
            <TabsTrigger value="sources">Sources ({notebook.sources.length})</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
          </TabsList>
          <TabsContent value="sources" className="flex-1 min-h-0 mt-0">
            <SourcesPanel notebook={notebook} highlightedSourceId={highlighted} />
          </TabsContent>
          <TabsContent value="chat" className="flex-1 min-h-0 mt-0">
            <ChatPanel notebook={notebook} onCitationHover={setHighlighted} />
          </TabsContent>
          <TabsContent value="studio" className="flex-1 min-h-0 mt-0">
            <StudioPanel notebook={notebook} />
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
};

export default NotebookWorkspace;
