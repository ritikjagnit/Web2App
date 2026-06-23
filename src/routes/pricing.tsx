import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { backendUrl } from "@/lib/api";



export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Stufflas" },
      { name: "description", content: "Simple, transparent pricing. Upgrade for unlimited apps and push notifications." },
    ],
  }),
  component: PricingPage,
});

const getPlans = (billingPeriod: "monthly" | "yearly") => [
  { name: "Free", price: "₹0", priceValue: 0, billingLabel: "/mo", desc: "Perfect for testing", features: ["1 app", "Stufflas branding", "Basic build pipeline", "Community support"], cta: "Start free", featured: false },
  { name: "Pro", price: billingPeriod === "monthly" ? "₹285" : "₹199", priceValue: billingPeriod === "monthly" ? 285 : 199, billingLabel: billingPeriod === "monthly" ? "/mo" : "/mo billed annually", desc: "For serious creators", features: ["Unlimited apps", "Custom branding", "Push notifications", "QR distribution", "Priority builds"], cta: "Go Pro", featured: true },
  { name: "Business", price: billingPeriod === "monthly" ? "₹570" : "₹399", priceValue: billingPeriod === "monthly" ? 570 : 399, billingLabel: billingPeriod === "monthly" ? "/mo" : "/mo billed annually", desc: "For teams", features: ["Everything in Pro", "Team workspaces", "API access", "Play Store assistance", "Dedicated support"], cta: "Contact sales", featured: false },
];

function PricingPage() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const currentPlans = getPlans(billingPeriod);

  const handleSubscribe = async (planName: string, priceAmount: number) => {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      toast.info("Please sign in to subscribe");
      navigate({ to: "/auth" });
      return;
    }

    if (priceAmount === 0 || sessionData.session.user.email === "ritikjagnit@gmail.com") {
      updatePlan(planName, sessionData.session.user.id);
      return;
    }

    try {
      setLoadingPlan(planName);
      
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setLoadingPlan(null);
        return;
      }

      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SwJ45pOyifghIt";
      
      // If billed annually, charge the full annual amount
      const checkoutAmount = billingPeriod === "yearly" ? priceAmount * 12 : priceAmount;

      const options = {
        key: keyId,
        amount: checkoutAmount * 100, // amount in paisa
        currency: "INR",
        name: "Stufflas",
        description: `${planName} Plan Subscription (${billingPeriod === "yearly" ? "Annually" : "Monthly"})`,
        handler: async function (response: any) {
          try {
            // Payment successful, update the plan
            await updatePlan(planName, sessionData.session.user.id);
          } catch (error) {
            toast.error("Failed to update subscription after payment");
          }
        },
        prefill: {
          email: sessionData.session.user.email,
        },
        theme: {
          color: "#3b82f6", // Adjust to match your theme
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      
      paymentObject.open();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong during checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };



  const updatePlan = async (planName: string, userId: string) => {
    setLoadingPlan(planName);
    const { error } = await supabase
      .from("profiles")
      .update({ plan: planName.toLowerCase() })
      .eq("id", userId);
      
    setLoadingPlan(null);
    
    if (error) {
      toast.error("Failed to subscribe");
    } else {
      try {
        const { data: userData } = await supabase.auth.getSession();
        const email = userData.session?.user?.email || "";
        
        await fetch(`${backendUrl}/api/profiles/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: userId,
            email: email,
            plan: planName.toLowerCase()
          })
        });
      } catch (syncErr) {
        console.error("Error syncing plan to backend:", syncErr);
      }

      toast.success(`Successfully subscribed to ${planName} plan!`);
      navigate({ to: "/converter" });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-bold">Pricing that scales with you</h1>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your needs. Upgrade or cancel anytime.
          </p>
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
          {currentPlans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-8 ${p.featured ? "gradient-bg neon-glow" : "glass"}`}>
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
              <Button 
                variant={p.featured ? "glass" : "hero"} 
                size="lg" 
                className="w-full mt-8" 
                onClick={() => handleSubscribe(p.name, p.priceValue)}
                disabled={loadingPlan === p.name}
              >
                {loadingPlan === p.name ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                {loadingPlan === p.name ? "Processing..." : p.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold italic underline decoration-primary/30">Detailed Comparison</h2>
        </div>
        <div className="glass rounded-[2.5rem] overflow-hidden border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capability</th>
                <th className="p-8 text-center text-xs font-bold text-foreground">Free</th>
                <th className="p-8 text-center text-xs font-bold text-primary">Pro</th>
                <th className="p-8 text-center text-xs font-bold text-emerald-500">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              <ComparisonRow label="Simultaneous Builds" free="1 Node" pro="Unlimited" business="Enterprise Cluster" />
              <ComparisonRow label="Push Notifications" free="✕" pro="FCM / OneSignal" business="Full Managed" />
              <ComparisonRow label="API Integration" free="✕" freeStatus="disabled" pro="✕" proStatus="disabled" business="✓ Full Access" />
              <ComparisonRow label="White-label Branding" free="✕" pro="✓" business="✓ + custom splash" />
              <ComparisonRow label="Build Priority" free="Normal" pro="Priority" business="Instant Instant" />
              <ComparisonRow label="Team Members" free="1" pro="1" business="Unlimited" />
              <ComparisonRow label="Play Store Support" free="✕" pro="Community" business="Dedicated Expert" />
            </tbody>
          </table>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function ComparisonRow({ label, free, pro, business, freeStatus, proStatus, businessStatus }: any) {
  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="p-8 font-medium text-foreground/80">{label}</td>
      <td className={`p-8 text-center ${freeStatus === 'disabled' ? 'text-muted-foreground/30' : 'text-muted-foreground font-mono text-xs'}`}>{free}</td>
      <td className={`p-8 text-center ${proStatus === 'disabled' ? 'text-muted-foreground/30' : 'text-foreground font-bold text-xs italic'}`}>{pro}</td>
      <td className={`p-8 text-center ${businessStatus === 'disabled' ? 'text-muted-foreground/30' : 'text-emerald-500 font-black text-xs uppercase'}`}>{business}</td>
    </tr>
  );
}

