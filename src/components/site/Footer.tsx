import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Github, 
  Twitter, 
  Instagram, 
  Linkedin,
  Send, 
  MessageCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email });
        
      if (error) {
        if (error.message?.includes("unique") || error.code === "23505") {
          toast.info("You are already subscribed to our newsletter!");
        } else {
          toast.error("Failed to subscribe: " + error.message);
        }
      } else {
        toast.success("Thank you for subscribing to our newsletter!");
        setEmail("");
      }
    } catch (err: any) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <footer className="relative border-t border-white/5 mt-24 bg-[#030303] overflow-hidden">
      {/* GLOW DECORATION */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />
      
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 mb-16">
          
          {/* BRAND SECTION */}
          <div className="col-span-1 lg:col-span-2">
            <Link to="/" className="flex flex-col items-start justify-center group mb-6 w-fit">
              <img
                src="/logo.png"
                alt="AppOrbit Logo"
                className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mt-1">web 2 apk builder</span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-md mb-8">
              Revolutionizing mobile presence. We turn any website into a high-performance installable Android App (APK) using <span className="text-white font-bold">AppOrbit</span>.
            </p>
            
            <form onSubmit={handleSubscribe} className="max-w-sm mb-8">
              <h5 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Join the Ecosystem</h5>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors text-white"
                  disabled={submitting}
                  required
                />
                <Button type="submit" disabled={submitting} className="rounded-xl px-6 h-12 bg-primary text-white hover:bg-primary/90 font-bold shadow-lg shadow-primary/20">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-white/30 mt-2 italic">Get early access to new build nodes and enterprise features.</p>
            </form>

            <div className="flex items-center gap-4">
              <SocialIcon href="https://github.com" icon={Github} color="hover:text-white" />
              <SocialIcon href="https://twitter.com" icon={Twitter} color="hover:text-[#1DA1F2]" />
              <SocialIcon href="https://www.instagram.com/stufflas_com" icon={Instagram} color="hover:text-[#E4405F]" />
              <SocialIcon href="https://www.linkedin.com/in/stufflas-it-b80850412" icon={Linkedin} color="hover:text-[#0A66C2]" />
            </div>
          </div>

          {/* PRODUCT LINKS */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Ecosystem</h4>
            <ul className="space-y-4 mb-8">
              <FooterLink to="/converter">App Engine</FooterLink>
              <FooterLink to="/pricing">Pricing Tiers</FooterLink>
              <FooterLink to="/dashboard">User Console</FooterLink>
            </ul>

            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6">Support</h4>
            <ul className="space-y-4">
              <li>
                <a href="mailto:support@stufflas.com" className="text-sm font-medium text-white/50 hover:text-primary transition-colors flex items-center gap-2 group">
                  <div className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  support@stufflas.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} AppOrbit. All rights reserved.
            </p>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Systems Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors uppercase tracking-widest">
              Privacy
            </Link>
            <Link to="/terms" className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors uppercase tracking-widest">
              Terms
            </Link>
            <Link to="/help" className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors uppercase tracking-widest">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon: Icon, color }: any) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 ${color}`}
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

function FooterLink({ to, children }: { to: string, children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-sm font-medium text-white/50 hover:text-primary transition-colors flex items-center gap-2 group">
        <div className="h-1 w-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        {children}
      </Link>
    </li>
  );
}
