import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PageLayoutProps {
  title: string;
  intro?: string;
  children: ReactNode;
}

const PageLayout = ({ title, intro, children }: PageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{title}</h1>
          {intro && <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{intro}</p>}
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
