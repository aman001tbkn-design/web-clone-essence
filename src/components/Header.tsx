import { Link, useNavigate } from "react-router-dom";
import { LogOut, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { initialsOf } from "@/lib/utils";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    toast("You've been signed out.");
    navigate("/");
  };

  return (
    <header className="flex items-center justify-end px-6 py-4 bg-background border-b border-border">
      <nav className="flex items-center gap-4">
        {user ? (
          <>
            <Button variant="hero" size="sm" asChild>
              <Link to="/app">
                <NotebookPen />
                My Notebooks
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-accent/10 text-accent font-medium">{initialsOf(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground font-normal truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/app")}>
                  <NotebookPen className="mr-2 h-4 w-4" />
                  My Notebooks
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button variant="auth" size="sm" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
