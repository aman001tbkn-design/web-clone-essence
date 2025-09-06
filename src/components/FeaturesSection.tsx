import { Upload, Zap, Search, Headphones } from "lucide-react";
import uploadInterface from "@/assets/upload-interface.jpg";
import chatInterface from "@/assets/chat-interface.jpg";
import sourceInterface from "@/assets/source-interface.jpg";
import audioInterface from "@/assets/audio-interface.jpg";

const features = [
  {
    icon: Upload,
    title: "Upload your sources",
    description: "Upload PDFs, websites, YouTube videos, audio files, and Google Docs. Each project notebook supports up to 50 sources and 25 million words.",
    image: uploadInterface,
  },
  {
    icon: Zap,
    title: "Instant insights",
    description: "NotebookLM can create FAQs, study guides, timelines, briefing docs, and more. And if you prefer to listen, you can generate an AI-hosted podcast.",
    image: chatInterface,
  },
  {
    icon: Search,
    title: "Get the source, not just the answer",
    description: "Every response NotebookLM provides includes citations that link back to supporting passages in your source material, so you can fact-check its responses.",
    image: sourceInterface,
  },
  {
    icon: Headphones,
    title: "Listen and learn on the go",
    description: "Generate Audio Overviews to turn your sources into engaging discussions. Two AI hosts will talk through your sources, making complex topics easier to understand.",
    image: audioInterface,
  },
];

const FeaturesSection = () => {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
          Your AI-Powered Research Partner
        </h2>
        
        <div className="space-y-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div className={index % 2 === 1 ? "md:order-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <feature.icon className="w-6 h-6 text-foreground" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
              <div className={index % 2 === 1 ? "md:order-1" : ""}>
                <div className="rounded-2xl overflow-hidden shadow-[var(--shadow-feature)] bg-card">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;