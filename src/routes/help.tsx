import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, Mail, Send, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Stufflas Help Center. Find answers to FAQs, guides, and support resources." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  {
    question: "What is a Android App (APK)?",
    answer: "A APK is a website that utilizes modern web technologies (Service Workers, Manifests, Cache API) to behave exactly like a native app. They are installable directly from the browser onto Android, iOS, Windows, and macOS, can run offline, load instantly, and send push notifications.",
  },
  {
    question: "How long does a website-to-app conversion take?",
    answer: "Stufflas converts standard websites into APKs in less than 30 seconds. Once you input your URL and choose your styling/manifest properties, our high-performance build nodes compile, structure, and package your installable build file instantly.",
  },
  {
    question: "How do I deploy my generated app build?",
    answer: "Once conversion is complete, Stufflas generates a zip package including the custom Service Worker, web app manifest, and icons. Simply upload these files to the root directory of your website server. Your website will instantly prompt visitors to install your new app.",
  },
  {
    question: "Do push notifications work on iOS and Android?",
    answer: "Yes. Push notifications are fully supported on Android. iOS supports push notifications for installable APKs starting with iOS 16.4. You can configure Web Push APIs within the generated service worker files.",
  },
  {
    question: "Is my target website source code modified?",
    answer: "Absolutely not. Stufflas works as a custom shell overlay. We load your secure website inside a APK wrapper with high-performance client caching layers. We never rewrite, download, or access your core site codebase.",
  },
];

function HelpPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSending(true);
    setTimeout(() => {
      toast.success("Help request submitted successfully! We will email you back within 24 hours.");
      setName("");
      setEmail("");
      setMessage("");
      setSending(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen text-foreground">
      <Header />
      
      <main className="pt-32 pb-24 relative overflow-hidden">
        {/* Background Mesh Glows */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/15 via-accent/5 to-transparent blur-[140px] -z-10" />
        <div className="absolute top-[40%] left-[-10%] w-[450px] h-[450px] bg-accent/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />

        <div className="mx-auto max-w-4xl px-6">
          {/* Header Section */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/5 border border-border/40 text-xs font-bold text-primary uppercase tracking-widest mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" /> Support Hub
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight leading-none text-foreground"
            >
              Help & <span className="gradient-text">Support</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-base max-w-lg mx-auto"
            >
              Find instant answers to frequently asked questions, learn how APKs function, or reach our technical support team directly.
            </motion.p>
          </div>

          {/* Interactive FAQs Accordion */}
          <div className="mb-24">
            <h2 className="text-2xl font-display font-black text-foreground mb-8 flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-primary" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = activeIndex === index;
                return (
                  <div
                    key={index}
                    className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen 
                        ? "border-primary/30 bg-card/65 shadow-lg shadow-primary/5" 
                        : "border-border/40 bg-card/25 hover:border-border/60"
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full px-6 py-5 text-left flex justify-between items-center gap-4 transition-colors"
                    >
                      <span className={`font-bold transition-colors text-sm md:text-base ${isOpen ? 'text-primary' : 'text-foreground/90 group-hover:text-foreground'}`}>
                        {faq.question}
                      </span>
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                        isOpen ? 'bg-primary border-primary text-white rotate-180' : 'bg-foreground/5 border-border/40 text-foreground/45 group-hover:text-foreground'
                      }`}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-6 pb-6 pt-2 text-muted-foreground leading-relaxed text-sm md:text-base border-t border-border/40">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Support Form */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 glass shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

            <h2 className="text-3xl font-display font-black text-foreground mb-3 flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-accent animate-bounce" /> Contact Support Team
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-8">
              Cannot find what you are looking for? Send us a message and our support engineers will review your request.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name..."
                    className="w-full bg-card border border-border/40 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="w-full bg-card border border-border/40 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you today?"
                  rows={5}
                  className="w-full bg-card border border-border/40 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary/50 transition-colors text-foreground resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full rounded-xl py-6 bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {sending ? "Sending Request..." : (
                  <>
                    Submit Support Request <Send className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
