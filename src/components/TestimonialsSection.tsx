const testimonials = [
  {
    quote: "Game-changing for research. The source attribution makes it trustworthy.",
    author: "Dr. Sarah Chen",
    role: "Research Professor",
  },
  {
    quote: "Finally, an AI that cites its sources. Perfect for academic work.",
    author: "Michael Rodriguez",
    role: "Graduate Student",
  },
  {
    quote: "The audio overviews help me understand complex topics during commutes.",
    author: "Emma Thompson",
    role: "Business Analyst",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="px-6 py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16 text-foreground">
          What people are saying
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-xl shadow-[var(--shadow-soft)] border border-border"
            >
              <blockquote className="text-foreground mb-4 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              <div>
                <div className="font-medium text-foreground">
                  {testimonial.author}
                </div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;