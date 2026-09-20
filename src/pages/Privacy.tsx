import PageLayout from "@/components/PageLayout";

const sections = [
  {
    title: "What we collect",
    body: "Research AI runs entirely in your browser. Your account details, notebooks, uploaded sources, chat history and generated notes are stored in your browser's local storage on this device. Nothing is sent to our servers.",
  },
  {
    title: "How your data is used",
    body: "Your sources are used only to answer your questions and generate study material inside your own notebooks. We do not use your personal data, including your uploads, queries, and the responses from the model, for training.",
  },
  {
    title: "Third-party requests",
    body: "When you add a website or YouTube link as a source, your browser fetches that page (or a readable-text copy of it) directly so the content can be added to your notebook. No other data leaves your device.",
  },
  {
    title: "Your control",
    body: "You can delete any source, note or notebook at any time from the app. Clearing your browser's site data for Research AI removes everything, including your account.",
  },
  {
    title: "Contact",
    body: "Questions about privacy? Use the Contact Us page and we'll get back to you.",
  },
];

const Privacy = () => {
  return (
    <PageLayout
      title="Privacy Policy"
      intro="We value your privacy and do not use your personal data to train Research AI. Here's exactly what happens with your information."
    >
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

export default Privacy;
