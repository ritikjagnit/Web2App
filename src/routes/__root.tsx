import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { MessageCircle, HelpCircle, X, Zap, Send, Home, CreditCard, Sparkles, LayoutDashboard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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
      { title: "AppOrbit - Web To APK Builder" },
      { name: "description", content: "Turn any website into a beautiful, installable Android App (APK/AAB) in minutes. No coding required. Push notifications, offline support, custom branding, and instant configuration." },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk, convert website to app, apporbit" },
      { name: "author", content: "AppOrbit" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "AppOrbit - Web To APK Builder" },
      { property: "og:description", content: "Turn any website into a beautiful, installable Android App (APK) in minutes. No coding required." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://apporbit.in/" },
      { property: "og:image", content: "https://apporbit.in/logo2.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AppOrbit - Web To APK Builder" },
      { name: "twitter:description", content: "Turn any website into a beautiful, installable Android App (APK) in minutes. No coding required." },
      { name: "twitter:image", content: "https://apporbit.in/logo2.png" },
      { name: "geo.region", content: "IN" },
      { name: "geo.placename", content: "India" },
    ],
    links: [
      { rel: "icon", href: "/logo2.png?v=2" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AppOrbit",
    "url": "https://apporbit.in/",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Android",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "570",
      "priceCurrency": "INR"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AppOrbit",
      "url": "https://apporbit.in/",
      "logo": "https://apporbit.in/logo2.png"
    }
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "AppOrbit",
    "image": "https://apporbit.in/logo2.png",
    "url": "https://apporbit.in/",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      </head>
      <body suppressHydrationWarning>
        {children}
        <LiveActivityFeed />
        <Scripts />
      </body>
    </html>
  );
}

function BottomNavBar() {
  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/converter", label: "Converter", icon: Zap },
    { to: "/pricing", label: "Pricing", icon: CreditCard },
    { to: "/features", label: "Features", icon: Sparkles },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/40 px-2 py-2 flex items-center justify-around pb-3 shadow-2xl">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors py-1 px-3 rounded-xl"
          activeProps={{ className: "text-primary font-bold bg-primary/5" }}
        >
          <link.icon className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">{link.label}</span>
        </Link>
      ))}
    </div>
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
      <div className="pb-24 md:pb-0 overflow-x-hidden">
        <Outlet />
      </div>
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <SupportWidget />
      <BottomNavBar />
    </>
  );
}

function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 glass rounded-2xl border-border shadow-2xl p-6 backdrop-blur-2xl flex flex-col text-center"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 border-b border-border/40 pb-3 shrink-0">
              <h4 className="font-bold flex items-center gap-2 italic uppercase tracking-tighter text-foreground text-sm">
                <HelpCircle className="h-5 w-5 text-primary" /> Support Hub
              </h4>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-foreground/5" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="py-6 flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg tracking-tight">Need Help?</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Our support team is here for you. Click the button below to send us an email directly.
                </p>
              </div>
              <Button asChild className="w-full rounded-xl h-10 mt-2 bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                <a href="mailto:support@stufflas.com">
                  <Send className="h-4 w-4 mr-2 inline" /> Email Support
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.6)] ring-4 ring-primary/20 relative group cursor-pointer"
        title="Open Support Hub"
      >
        <MessageCircle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-black" />
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
    <div className="fixed bottom-24 md:bottom-8 left-4 md:left-8 z-[100] pointer-events-none font-sans">
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
