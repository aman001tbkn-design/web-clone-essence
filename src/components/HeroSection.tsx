import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="px-6 py-24 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold mb-6 text-foreground">
          Understand{" "}
          <span className="text-accent">Anything</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Your AI-powered research partner, grounded in the information you trust, built with
          our latest Gemini models.
        </p>
        <Button variant="hero" size="lg" className="text-base px-8 py-3">
          Try Research AI
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;