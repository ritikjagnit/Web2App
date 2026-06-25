import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { motion } from "framer-motion";
import { Scale, CheckCircle2, ShieldAlert, Cpu, Award } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Terms of Service for Stufflas. Read the policies governing your use of our platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const sections = [
    {
      icon: <Scale className="h-6 w-6 text-primary" />,
      color: "from-primary/20 to-primary/5",
      borderColor: "hover:border-primary/30",
      title: "1. Acceptance of Terms",
      content: "By creating an account, running conversion requests, or accessing Stufflas' web tools, you agree to comply with and be bound by these Terms of Service. If you disagree with any segment of these provisions, you must immediately terminate usage of our services.",
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-400" />,
      color: "from-emerald-500/20 to-emerald-500/5",
      borderColor: "hover:border-emerald-500/30",
      title: "2. Authorized Source Materials",
      content: "You warrant that you own or possess valid, written legal rights to convert the target website URLs provided into APKs. Stufflas takes zero liability for the infringement of third-party IP or copyrighted websites converted by users without authorization.",
    },
    {
      icon: <ShieldAlert className="h-6 w-6 text-red-400" />,
      color: "from-red-500/20 to-red-500/5",
      borderColor: "hover:border-red-500/30",
      title: "3. Prohibited Applications & Content",
      content: "You may not compile apps that transmit malicious software, run phishing schemes, distribute explicit content, or bypass native operating system security sandboxes. Any breach will trigger immediate termination of service and potential notification to authorities.",
    },
    {
      icon: <Cpu className="h-6 w-6 text-accent" />,
      color: "from-accent/20 to-accent/5",
      borderColor: "hover:border-accent/30",
      title: "4. Build Node Resource Allocation",
      content: "Stufflas operates a modern build pipeline. Free and developer tiers share processing nodes. Excessive queue load, automated scripting of build calls, or server DDoS attempts will result in temporary or permanent build rate-limiting and account suspensions.",
    },
    {
      icon: <Award className="h-6 w-6 text-blue-400" />,
      color: "from-blue-500/20 to-blue-500/5",
      borderColor: "hover:border-blue-500/30",
      title: "5. Intellectual Property rights",
      content: "The generated APK assets (compiled manifests, icons, service workers) belong entirely to you. Stufflas claims no ownership over your app's code or brand. The Stufflas core conversion engine, interface assets, styling libraries, and branding templates remain the sole property of Stufflas.",
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
                ⚖️ Legal Framework
              </span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl md:text-7xl font-display font-black mt-6 mb-6 tracking-tight leading-none text-foreground"
            >
              Terms of <span className="gradient-text">Service</span>
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

          {/* Terms Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative overflow-hidden rounded-[2.5rem] glass p-8 md:p-10 mb-16 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <p className="text-foreground/80 leading-relaxed text-base md:text-lg">
              Please review these Terms of Service closely. They define your legal permissions, responsibilities, and constraints when building Android Applications utilizing Stufflas. By utilizing any of our build tools, engines, or templates, you accept these provisions in full.
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
            <p className="text-muted-foreground text-sm mb-6">Questions or concerns about our intellectual property policies or resources?</p>
            <a 
              href="mailto:legal@stufflas.com"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-sm hover:opacity-90 active:scale-95 transition-all text-white font-black shadow-lg shadow-primary/20"
            >
              Contact Legal Counsel
            </a>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
