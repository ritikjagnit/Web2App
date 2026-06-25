import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Privacy Policy for Stufflas. Understand how we protect and manage your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const sections = [
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      color: "from-primary/20 to-primary/5",
      borderColor: "hover:border-primary/30",
      title: "Data Stewardship & Sovereignty",
      content: "At Stufflas, we hold your digital sovereignty in high regard. We do not inspect, monetize, or retain the proprietary logic, backend APIs, or assets of the web applications you convert. All raw code processing runs in sandboxed virtual environments that terminate immediately post-generation.",
    },
    {
      icon: <Lock className="h-6 w-6 text-accent" />,
      color: "from-accent/20 to-accent/5",
      borderColor: "hover:border-accent/30",
      title: "Secure Caching & Service Workers",
      content: "Our Android App (APK) builder designs automated caching structures using Service Workers. Caching takes place on device local storage (IndexedDB, Cache Storage API) under your control. We do not store app database credentials or configuration files on our external systems.",
    },
    {
      icon: <Eye className="h-6 w-6 text-emerald-400" />,
      color: "from-emerald-500/20 to-emerald-500/5",
      borderColor: "hover:border-emerald-500/30",
      title: "Information Collection & Utilization",
      content: "We collect minimal analytical metrics required to maintain, measure, and scale Stufflas' build nodes. This includes browser type, conversion speed, build success rates, and account management emails. We strictly never sell your personal information.",
    },
    {
      icon: <Server className="h-6 w-6 text-blue-400" />,
      color: "from-blue-500/20 to-blue-500/5",
      borderColor: "hover:border-blue-500/30",
      title: "Hosting & Global Build Infrastructure",
      content: "All app compilations are handled by secure, geographically distributed build nodes. Manifest generations, icon resizing, and asset compilation logs are kept strictly private and purged dynamically from our active servers within 24 hours of successful build exports.",
    },
    {
      icon: <RefreshCw className="h-6 w-6 text-purple-400" />,
      color: "from-purple-500/20 to-purple-500/5",
      borderColor: "hover:border-purple-500/30",
      title: "Updates to our Privacy Policy",
      content: "We periodically optimize our security architecture. When updates occur, we will notify you by updating the timestamp at the top of this policy and notifying users through the Admin Dashboard and email lists.",
    },
  ];

  return (
    <div className="min-h-screen text-foreground">
      <Header />
      
      <main className="pt-32 pb-24 relative overflow-hidden">
        {/* Background Mesh Glows */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/15 via-accent/5 to-transparent blur-[140px] -z-10" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

        <div className="mx-auto max-w-4xl px-6">
          {/* Header Section */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="px-4 py-1.5 rounded-full bg-foreground/5 border border-border/40 text-xs font-bold text-accent uppercase tracking-widest">
                🛡️ Trust & Security First
              </span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl md:text-7xl font-display font-black mt-6 mb-6 tracking-tight leading-none text-foreground"
            >
              Privacy <span className="gradient-text">Policy</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-sm font-mono uppercase tracking-wider"
            >
              Last Updated: June 18, 2026
            </motion.p>
          </div>

          {/* Policy Intro Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-[2.5rem] glass p-8 md:p-10 mb-16 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <p className="text-foreground/80 leading-relaxed text-base md:text-lg">
              This Privacy Policy explains how Stufflas ("we", "us", or "our") manages, processes, and protects your information when you utilize our web-to-app conversion platform. By converting websites into installable APKs, you trust us to handle critical asset structures. We are fully committed to ensuring that trust is respected.
            </p>
          </motion.div>

          {/* Detailed Sections */}
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className={`group relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/20 p-8 flex flex-col md:flex-row gap-6 items-start hover:bg-card/45 transition-all duration-300 ${section.borderColor}`}
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center shrink-0 border border-border/40 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-foreground mb-3 group-hover:text-primary transition-colors">{section.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{section.content}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Support Footer Card */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20 text-center border-t border-border/40 pt-16"
          >
            <p className="text-muted-foreground text-sm mb-6">Have questions about our security controls, service workers, or code sandboxing?</p>
            <a 
              href="mailto:security@stufflas.com"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-sm hover:opacity-90 active:scale-95 transition-all text-white font-black shadow-lg shadow-primary/20"
            >
              Contact Security Officer
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
