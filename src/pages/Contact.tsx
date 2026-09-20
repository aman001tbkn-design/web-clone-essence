import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { readJSON, uid, writeJSON } from "@/lib/storage";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  subject: z.string().trim().min(3, "Add a short subject"),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)"),
});

interface Values {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const MESSAGES_KEY = "research-ai:contact-messages";

const Contact = () => {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "", subject: "", message: "" },
  });

  const onSubmit = (values: Values) => {
    const existing = readJSON<unknown[]>(MESSAGES_KEY, []);
    writeJSON(MESSAGES_KEY, [...existing, { id: uid("contact"), ...values, sentAt: new Date().toISOString() }]);
    setSent(true);
    toast.success("Message sent. We'll reply to your email.");
  };

  return (
    <PageLayout title="Contact Us" intro="Questions, feedback or a bug to report? Send us a note and we'll get back to you.">
      {sent ? (
        <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Thanks for reaching out!</h2>
          <p className="text-muted-foreground mb-6">We've received your message and will reply to {form.getValues("email")}.</p>
          <Button
            variant="auth"
            onClick={() => {
              form.reset({ name: user?.name ?? "", email: user?.email ?? "", subject: "", message: "" });
              setSent(false);
            }}
          >
            Send another message
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_260px] gap-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="How can we help?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Write your message…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant="hero" disabled={form.formState.isSubmitting}>
                Send message
              </Button>
            </form>
          </Form>
          <aside className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Email</div>
                <a href="mailto:hello@researchai.app" className="text-sm text-muted-foreground hover:text-foreground">
                  hello@researchai.app
                </a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We typically respond within two business days. For privacy questions, see our Privacy Policy.
            </p>
          </aside>
        </div>
      )}
    </PageLayout>
  );
};

export default Contact;
