import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { notebookStore, useNotebooks, type Notebook } from "@/lib/notebooks";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const Notebooks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notebooks = useNotebooks(user?.id);
  const [renaming, setRenaming] = useState<Notebook | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleting, setDeleting] = useState<Notebook | null>(null);

  const createNotebook = () => {
    if (!user) return;
    const nb = notebookStore.create(user.id);
    navigate(`/app/${nb.id}`);
  };

  const confirmRename = () => {
    if (!renaming) return;
    notebookStore.rename(renaming.id, renameValue);
    toast.success("Notebook renamed");
    setRenaming(null);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    notebookStore.remove(deleting.id);
    toast.success(`Deleted "${deleting.title}"`);
    setDeleting(null);
  };

  return (
    <AppShell>
      <main className="flex-1 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome{user ? `, ${user.name.split(" ")[0]}` : ""}
              </h1>
              <p className="text-muted-foreground">
                {notebooks.length
                  ? `You have ${notebooks.length} ${notebooks.length === 1 ? "notebook" : "notebooks"}.`
                  : "Create a notebook, add your sources, and start asking questions."}
              </p>
            </div>
            <Button variant="hero" onClick={createNotebook}>
              <Plus />
              New notebook
            </Button>
          </div>

          {notebooks.length === 0 ? (
            <button
              type="button"
              onClick={createNotebook}
              className="w-full rounded-2xl border-2 border-dashed border-border bg-card hover:bg-muted/50 transition-colors p-16 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-7 h-7 text-accent" />
              </div>
              <div className="text-lg font-semibold text-foreground mb-1">Create your first notebook</div>
              <div className="text-sm text-muted-foreground">
                Upload PDFs, websites, YouTube videos, or paste text — then chat with your sources.
              </div>
            </button>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {notebooks.map((nb) => (
                <div
                  key={nb.id}
                  className="group relative bg-card rounded-2xl border border-border shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-feature)] transition-shadow"
                >
                  <Link to={`/app/${nb.id}`} className="block p-6 h-full">
                    <div className="text-3xl mb-4">{nb.emoji}</div>
                    <h2 className="text-lg font-semibold text-foreground mb-2 pr-8 line-clamp-2">{nb.title}</h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {nb.sources.length} {nb.sources.length === 1 ? "source" : "sources"}
                      </span>
                      <span>·</span>
                      <span>{formatDate(nb.updatedAt)}</span>
                    </div>
                  </Link>
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notebook options">
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setRenaming(nb);
                            setRenameValue(nb.title);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(nb)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename notebook</DialogTitle>
            <DialogDescription>Give your notebook a name that describes its sources.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              confirmRename();
            }}
          >
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus maxLength={80} />
            <DialogFooter className="mt-6">
              <Button type="button" variant="auth" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={!renameValue.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the notebook, its {deleting?.sources.length ?? 0} sources, chat history and notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Notebooks;
