import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { motion } from "motion/react";
import { Mail } from "lucide-react";

type NewsletterFormProps = {
  variant?: "footer" | "inline";
};

export default function NewsletterForm({ variant = "footer" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const subscribe = useMutation(api.subscribers.subscribe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const result = await subscribe({ email: trimmed });
      setDone(true);
      toast.success(result.resubscribed ? "Welcome back! You're re-subscribed." : "You're subscribed! 🎉");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={variant === "inline" ? "text-center" : ""}
      >
        <p className={`font-medium ${variant === "inline" ? "text-primary text-lg" : "text-sidebar-primary"}`}>
          You're subscribed!
        </p>
        <p className={`text-sm mt-1 ${variant === "inline" ? "text-muted-foreground" : "text-sidebar-foreground/60"}`}>
          Look out for African food stories in your inbox.
        </p>
      </motion.div>
    );
  }

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={loading}
          className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={loading} className="cursor-pointer shrink-0">
          {loading ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    );
  }

  // Footer variant
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        disabled={loading}
        className="flex-1 bg-sidebar-accent text-sidebar-foreground text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-sidebar-ring"
      />
      <Button
        type="submit"
        size="sm"
        disabled={loading}
        className="bg-primary hover:bg-primary/90 cursor-pointer"
      >
        {loading ? "..." : "Subscribe"}
      </Button>
    </form>
  );
}

// Standalone inline newsletter section for embedding in pages
export function NewsletterCTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-8 md:p-12 text-center"
      >
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
          Never Miss a Recipe
        </h2>
        <p className="text-muted-foreground text-base mb-6 max-w-sm mx-auto">
          Get the best African food stories, recipes, and guides delivered straight to your inbox.
        </p>
        <NewsletterForm variant="inline" />
      </motion.div>
    </section>
  );
}
