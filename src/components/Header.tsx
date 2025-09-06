import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="flex items-center justify-end px-6 py-4 bg-background border-b border-border">
      <nav className="flex items-center gap-4">
        <Button variant="auth" size="sm">
          Sign In
        </Button>
        <Button variant="hero" size="sm">
          Sign Up
        </Button>
      </nav>
    </header>
  );
};

export default Header;