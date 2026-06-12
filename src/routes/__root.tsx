import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MessageCircle, HelpCircle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-2xl p-10">
        <h1 className="text-7xl font-display font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl gradient-bg px-6 py-2.5 text-sm font-medium text-primary-foreground neon-glow"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "stufflas — Convert your website into an installable Progressive Web App (PWA)" },
      { name: "description", content: "Turn any website into a beautiful, installable PWA in minutes. No coding required. Push notifications, offline support, custom branding, and instant configuration." },
      { property: "og:title", content: "stufflas — Website to PWA Converter" },
      { property: "og:description", content: "Turn any website into a beautiful, installable Progressive Web App (PWA) in minutes. No coding required." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/logo.png" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <LiveActivityFeed />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      import("virtual:pwa-register").then(({ registerSW }) => {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            toast.info("Update available! Click to update the platform.", {
              duration: 10000,
              action: {
                label: "Update",
                onClick: () => {
                  window.location.reload();
                },
              },
            });
          },
          onOfflineReady() {
            toast.success("App Weaver is ready to work offline!");
          },
        });
      });
    }
  }, []);

  return (
    <>
      <Outlet />
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <SupportWidget />
    </>
  );
}

function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 glass rounded-[2.5rem] border-white/10 shadow-2xl p-8 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold flex items-center gap-2 italic uppercase tracking-tighter text-white">
                <HelpCircle className="h-5 w-5 text-primary" /> Support Hub
              </h4>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-white/5" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 text-white/50" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-white/50 leading-relaxed italic">Hi! Lead Architect Ritik here. How can I help you build today?</p>
              <div className="grid gap-3">
                <Button variant="secondary" className="w-full justify-start h-12 rounded-xl text-xs font-bold gap-3 border border-white/5 bg-white/5 hover:bg-white/10 text-white" asChild>
                  <a href="https://wa.me" target="_blank"><MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp Support</a>
                </Button>
                <Button variant="secondary" className="w-full justify-start h-12 rounded-xl text-xs font-bold gap-3 border border-white/5 bg-white/5 hover:bg-white/10 text-white" asChild>
                  <a href="mailto:ritik@mbig.in"><HelpCircle className="h-4 w-4 text-blue-500" /> Email Support</a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.6)] ring-4 ring-primary/20 z-50 relative group"
      >
        <MessageCircle className="h-8 w-8 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-black" />
      </motion.button>
    </div>
  );
}

function LiveActivityFeed() {
  const [activity, setActivity] = useState<any>(null);
  const activities = [
    { name: "Arjun S.", action: "built a Pro App", location: "Delhi" },
    { name: "Lisa M.", action: "deployed to Play Store", location: "London" },
    { name: "Rahul K.", action: "generated API Key", location: "Mumbai" },
    { name: "Elena V.", action: "started Business trial", location: "Berlin" },
    { name: "Sam R.", action: "rebuilt 5 apps", location: "Austin" }
  ];

  useEffect(() => {
    const showRandom = () => {
      const random = activities[Math.floor(Math.random() * activities.length)];
      setActivity(random);
      setTimeout(() => setActivity(null), 4000);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) showRandom();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-8 left-8 z-[100] pointer-events-none font-sans">
      <AnimatePresence>
        {activity && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="glass rounded-2xl border-white/10 p-4 shadow-2xl flex items-center gap-4 bg-black/60 backdrop-blur-xl"
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{activity.location} • Just Now</p>
              <p className="text-xs font-bold text-white">
                <span className="text-primary">{activity.name}</span> {activity.action}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
