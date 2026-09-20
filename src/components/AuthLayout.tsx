import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center px-6 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="w-5 h-5 text-accent" />
          Research AI
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-[var(--shadow-soft)] p-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{subtitle}</p>
          {children}
          <div className="mt-6 text-sm text-center text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
