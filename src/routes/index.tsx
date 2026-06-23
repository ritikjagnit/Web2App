import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Check, HelpCircle, Smartphone as Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PhonePreview } from "@/components/site/PhonePreview";
import { Features } from "@/components/site/Features";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "stufflas — Convert your website into a Progressive Web App (PWA)" },
      { name: "description", content: "Turn any website into a beautiful Progressive Web App (PWA) in minutes. No coding required." },
    ],
  }),
  component: HomePage,
});


const testimonials = [
  { name: "Sarah Chen", role: "Founder, Bloomly", text: "Shipped our mobile app in 10 minutes. Saved us months of dev work.", avatar: "SC" },
  { name: "Marcus Reed", role: "CEO, ShopHive", text: "The build quality is insane. Our customers can't tell it's a webview.", avatar: "MR" },
  { name: "Priya Patel", role: "CTO, FinNest", text: "Push notifications doubled our user retention overnight.", avatar: "PP" },
];

const getPlans = (billingPeriod: "monthly" | "yearly") => [
  { name: "Free", price: "₹0", billingLabel: "/mo", desc: "Perfect for testing", features: ["1 app", "stufflas branding", "Basic PWA pipeline", "Community support"], cta: "Start free", featured: false },
  { name: "Pro", price: billingPeriod === "monthly" ? "₹285" : "₹199", billingLabel: billingPeriod === "monthly" ? "/mo" : "/mo billed annually", desc: "For serious creators", features: ["Unlimited apps", "Custom branding", "Offline service worker", "QR distribution", "Priority PWA packaging"], cta: "Go Pro", featured: true },
  { name: "Business", price: billingPeriod === "monthly" ? "₹570" : "₹399", billingLabel: billingPeriod === "monthly" ? "/mo" : "/mo billed annually", desc: "For teams", features: ["Everything in Pro", "Team workspaces", "API access", "App Store packaging support", "Dedicated support"], cta: "Contact sales", featured: false },
];

function ShowcaseCard({ title, desc, type, image }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="glass rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl group"
    >
      <div className="h-64 bg-gradient-to-br from-white/10 to-transparent relative flex items-center justify-center p-8 overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-40 h-80 bg-zinc-900 rounded-[2rem] border-[4px] border-zinc-800 shadow-2xl transform rotate-12 group-hover:rotate-0 transition-transform duration-500 flex flex-col p-2 overflow-hidden">
          <div className="w-10 h-1 bg-zinc-800 rounded-full mx-auto mb-2 shrink-0" />
          <div className="flex-1 bg-white/5 rounded-xl border border-white/5 overflow-hidden relative">
            <img src={image} className="absolute inset-0 w-full h-full object-cover" alt={title} />
          </div>
        </div>
      </div>
      <div className="p-8 border-t border-white/5">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">{type}</span>
        <h4 className="text-xl font-bold text-foreground mb-2">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed italic">{desc}</p>
      </div>
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="glass rounded-[2rem] border-white/5 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-6 flex items-center justify-between text-left"
      >
        <span className="font-bold text-lg">{question}</span>
        <div className={`h-8 w-8 rounded-full bg-white/5 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ArrowRight className="h-4 w-4 rotate-90" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-8 pb-8 text-sm text-muted-foreground leading-relaxed italic">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HomePage() {
  const [useStateReady, setUseStateReady] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  
  const currentPlans = getPlans(billingPeriod);

  return (
    <div className="min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden grid-bg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs mb-6">
              <span className="h-2 w-2 rounded-full bg-accent neon-glow-cyan animate-pulse" />
              <span className="text-muted-foreground">v2.0 — Now with push notifications</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.05] tracking-tight">
              Convert your <span className="gradient-text">website</span><br />
              into a <span className="gradient-text">PWA</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-lg">
              Paste a URL. Pick an icon. Download a deploy-ready PWA package. The fastest way
              to make your site installable and support offline access — no coding required.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/converter">
                  Convert your site <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/pricing">View pricing</Link>
              </Button>
            </div>
          </motion.div>

          <PhonePreview url="https://en.wikipedia.org/wiki/Mobile_app" appName="Demo App" themeColor="#7c3aed" />
        </div>
      </section>

      <Features />

      {/* PRICING */}
      <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">Simple, honest pricing</h2>
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <div className="glass p-1.5 rounded-2xl flex items-center border border-white/5">
            <button 
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                billingPeriod === "monthly" 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                billingPeriod === "yearly" 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              Yearly
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                billingPeriod === "yearly"
                  ? "bg-emerald-500 text-white border-emerald-400"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                Save 30%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {currentPlans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl p-8 ${p.featured ? "gradient-bg neon-glow" : "glass"}`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background border border-primary rounded-full px-3 py-1 text-xs font-medium">
                  Most popular
                </div>
              )}
              <h3 className={`text-2xl font-display font-bold ${p.featured ? "text-primary-foreground" : ""}`}>{p.name}</h3>
              <div className={`mt-4 text-5xl font-display font-bold ${p.featured ? "text-primary-foreground" : "gradient-text"}`}>
                {p.price}<span className="text-base font-normal text-muted-foreground">{p.billingLabel}</span>
              </div>
              <p className={`mt-2 text-sm ${p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{p.desc}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((feat) => (
                  <li key={feat} className={`flex items-center gap-2 ${p.featured ? "text-primary-foreground" : ""}`}>
                    <Check className={`h-4 w-4 ${p.featured ? "text-primary-foreground" : "text-accent"}`} />
                    {feat}
                  </li>
                ))}
              </ul>
              <Button variant={p.featured ? "glass" : "hero"} size="lg" className="w-full mt-8" asChild>
                <Link to="/auth">{p.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-widest text-accent font-semibold mb-3">Loved by builders</div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold">Trusted by 10,000+ creators</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm mb-6 text-foreground/90">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* APP SHOWCASE */}
      <section className="py-24 bg-white/[0.01] border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-primary font-black mb-3">Gallery</div>
            <h2 className="text-4xl sm:text-6xl font-display font-bold italic tracking-tighter text-foreground">Engineered for <span className="gradient-text">Excellence</span></h2>
            <p className="text-muted-foreground mt-4 text-sm max-w-lg mx-auto uppercase tracking-widest font-bold">Discover high-performance apps built on our node</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ShowcaseCard title="E-Commerce Pro" desc="Fully responsive shopping experience" type="Retail" image="/showcase/ecommerce.png" />
            <ShowcaseCard title="Identity Portfolio" desc="Minimalist developer presence" type="Creative" image="/showcase/portfolio.png" />
            <ShowcaseCard title="Social Sync" desc="Community-driven web hub" type="Community" image="/showcase/social.png" />
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold italic text-foreground">Curious? <span className="text-primary">We have answers.</span></h2>
        </div>
        <div className="space-y-4">
          <FAQItem question="Are the PWAs ready for App Stores?" answer="Absolutely. The generated PWA packages include standard W3C Manifests and Service Workers, making them eligible for store packaging via tools like PWABuilder. We offer assistance for Business tier users." />
          <FAQItem question="Can I send Push Notifications?" answer="Yes! Our Pro and Business tiers support PWA Web Push notifications to keep your users engaged." />
          <FAQItem question="Does it support custom icons?" answer="Of course. You can upload your own high-resolution icon during the conversion process to generate customized launcher icons and theme configs." />
          <FAQItem question="What happens if my site is down?" answer="The app acts as a reflection of your site. However, we offer custom offline-caching strategy configurations (like Stale-While-Revalidate and Cache-First) to maintain offline accessibility." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="glass rounded-3xl p-12 text-center neon-glow">
          <h2 className="text-4xl sm:text-5xl font-display font-bold">Ready to ship your app?</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join thousands of creators who launched their mobile app in
            minutes, not months.
          </p>
          <Button variant="hero" size="xl" className="mt-8" asChild>
            <Link to="/converter">Start building free <ArrowRight className="h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
