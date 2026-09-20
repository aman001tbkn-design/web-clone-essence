import PageLayout from "@/components/PageLayout";

const sections = [
  {
    title: "1. Using Research AI",
    body: "Research AI helps you understand the sources you upload by answering questions with citations and generating study material. You may use it for personal, academic and professional research.",
  },
  {
    title: "2. Your content",
    body: "You keep full ownership of everything you upload. Only add sources you have the right to use. You are responsible for the content you add to your notebooks.",
  },
  {
    title: "3. Accuracy",
    body: "Answers are grounded in your sources and every response links back to supporting passages so you can fact-check it. Always verify important information against the original material before relying on it.",
  },
  {
    title: "4. Limits",
    body: "Each notebook supports up to 50 sources and 25 million words. Data is stored in your browser, so storage is limited by your device and is not synced between devices.",
  },
  {
    title: "5. Acceptable use",
    body: "Don't use Research AI to process content that is unlawful, infringing or harmful, or to attempt to disrupt the service for others.",
  },
  {
    title: "6. Changes",
    body: "We may update these terms as the product evolves. Continued use after an update means you accept the revised terms.",
  },
];

const Terms = () => {
  return (
    <PageLayout title="Terms of Service" intro="The short, plain-language rules for using Research AI.">
      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold text-foreground mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.body}</p>
          </section>
        ))}
        <p className="text-sm text-muted-foreground">Last updated: January 2024</p>
      </div>
    </PageLayout>
  );
};

export default Terms;
