import { createFileRoute } from "@tanstack/react-router";
import { Features } from "@/components/site/Features";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { motion } from "framer-motion";
import { Link, Palette, Zap, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Explore the futuristic capabilities of our web-to-app conversion engine." },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <section className="pt-20 pb-10 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent blur-3xl -z-10"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-6xl md:text-8xl font-display font-bold mb-6 tracking-tight"
          >
            Capabilities of <br />
            <span className="gradient-text">Tomorrow</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-xl max-w-2xl mx-auto"
          >
            We've engineered the world's most advanced web-to-app conversion platform. 
            Designed for business scaling, available today.
          </motion.p>
        </div>
      </section>

      {/* 3 STEPS SECTION */}
      <section className="py-20 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-4xl font-display font-bold mb-4"
            >
              Build your app in <span className="gradient-text">3 simple steps</span>
            </motion.h2>
            <div className="h-1 w-20 gradient-bg mx-auto rounded-full shadow-neon"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 -z-10"></div>

            {[
              { 
                step: "01", 
                title: "Connect Source", 
                desc: "Input your website URL. Our AI analyzes the architecture and extracts core assets instantly.",
                icon: <Link className="h-6 w-6 text-primary" />
              },
              { 
                step: "02", 
                title: "Customize UI", 
                desc: "Personalize your app icon, splash screen, and color scheme. Preview changes in real-time.",
                icon: <Palette className="h-6 w-6 text-accent" />
              },
              { 
                step: "03", 
                title: "Finalize & Deploy", 
                desc: "Hit generate. Our APK engine processes settings, compiles caching engines, structures manifests, and bundles a deploy-ready package in seconds.",
                icon: <Zap className="h-6 w-6 text-emerald-400" />
              }
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -10 }}
                className="glass rounded-[2rem] p-4 sm:p-8 border-border/40 relative group"
              >
                <div className="absolute -top-4 left-4 sm:-left-4 w-12 h-12 rounded-2xl bg-background border border-border/40 flex items-center justify-center font-display font-bold text-lg text-primary shadow-xl">
                  {s.step}
                </div>
                <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {s.desc}
                </p>
                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary font-bold">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Features />

      <section className="py-32 bg-black/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-4 sm:p-10 border-border/40 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="w-40 h-40 border-4 border-accent rounded-full animate-ping"></div>
              </div>
              <h3 className="text-3xl font-display font-bold mb-6">Hybrid Bridge Architecture</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Our proprietary bridge technology connects your web code to native APIs in microseconds. 
                With zero-latency message passing, your web app gains full access to device features like haptics and file systems.
              </p>
              <div className="flex gap-4">
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "99.9%" }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full gradient-bg shadow-neon"
                  ></motion.div>
                </div>
                <span className="text-xs font-mono text-accent">99.9% RELIABILITY</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-4 sm:p-10 border-border/40 relative overflow-hidden group"
            >
              <h3 className="text-3xl font-display font-bold mb-6">Enterprise Security</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Your app's integrity is protected by state-of-the-art obfuscation and signature verification. 
                Whether you're building for internal enterprise use or public stores, 
                your source code remains shielded from reverse engineering.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Capacitor 6+', 'SSL Pinning', 'JWT Auth', 'Biometric Lock'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-secondary border border-border/40 text-xs font-mono text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
