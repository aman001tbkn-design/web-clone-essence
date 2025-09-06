import { BookOpen, Brain, TrendingUp } from "lucide-react";

const useCases = [
  {
    icon: BookOpen,
    title: "Power study",
    description: "Record online meetings, lectures, and more. Upload content to build custom AI chatbots trained on your data for research and learning.",
  },
  {
    icon: Brain,
    title: "Organize your thinking",
    description: "Upload research papers, PDFs, web articles to have the best source-based AI conversations. Get insights and summaries with full source attribution.",
  },
  {
    icon: TrendingUp,
    title: "Spark new ideas",
    description: "Upload diverse content to explore new ideas and connections. Generate creative content while maintaining rigorous source tracking.",
  },
];

const UseCasesSection = () => {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          How people are using Research AI
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <useCase.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;