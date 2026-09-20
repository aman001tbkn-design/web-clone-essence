import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface AppShellProps {
  children: ReactNode;
  center?: ReactNode;
}

const AppShell = ({ children, center }: AppShellProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    toast("You've been signed out.");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between gap-4 px-6 py-3 bg-background border-b border-border">
        <Link to="/app" className="flex items-center gap-2 font-semibold text-foreground shrink-0">
          <Sparkles className="w-5 h-5 text-accent" />
          Research AI
        </Link>
        <div className="flex-1 min-w-0 flex justify-center">{center}</div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="rounded-full shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
              <DropdownMenuItem onSelect={() => navigate("/")}>Back to home</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {children}
    </div>
  );
};

export default AppShell;
