import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Simple, transparent pricing. Upgrade for unlimited apps and push notifications." },
    ],
  }),
  component: PricingPage,
});

const getPlans = (billingPeriod: "monthly" | "yearly") => {
  const isMonthly = billingPeriod === "monthly";
  return [
    { name: "Free", priceINR: "₹0", priceValueINR: 0, priceUSD: "$0", priceValueUSD: 0, platformFeeUSD: 0, billingLabel: "/mo", desc: "Perfect for testing", features: ["1 app", "Stufflas branding", "Basic build pipeline", "Community support"], cta: "Start free", featured: false },
    { name: "Pro", priceINR: isMonthly ? "₹285" : "₹199", priceValueINR: isMonthly ? 285 : 199, priceUSD: isMonthly ? "$5.99" : "$4.49", priceValueUSD: isMonthly ? 3.99 : 2.49, platformFeeUSD: 2, billingLabel: isMonthly ? "/mo" : "/mo billed annually", desc: "For serious creators", features: ["Unlimited apps", "Custom branding", "Push notifications", "QR distribution", "Priority builds"], cta: "Go Pro", featured: true },
    { name: "Business", priceINR: isMonthly ? "₹570" : "₹399", priceValueINR: isMonthly ? 570 : 399, priceUSD: isMonthly ? "$9.99" : "$7.49", priceValueUSD: isMonthly ? 7.99 : 5.49, platformFeeUSD: 2, billingLabel: isMonthly ? "/mo" : "/mo billed annually", desc: "For teams", features: ["Everything in Pro", "API access", "Play Store assistance", "Dedicated support"], cta: "Contact sales", featured: false },
  ];
};

function PricingPage() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any>(null);

  const currentPlans = getPlans(billingPeriod);

  const handleSubscribe = async (plan: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      toast.info("Please sign in to subscribe");
      navigate({ to: "/auth" });
      return;
    }

    if (plan.priceValueINR === 0 || sessionData.session.user.email === "ritikjagnit@gmail.com" || sessionData.session.user.email === "jahanpatle01@gmail.com") {
      updatePlan(plan.name, sessionData.session.user.id);
      return;
    }

    setSelectedPlanForCheckout(plan);
    setShowCurrencyModal(true);
  };

  const executeSubscribe = async (planName: string, priceAmount: number, platformFee: number, currency: "INR" | "USD") => {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session) {
      toast.info("Please sign in to subscribe");
      navigate({ to: "/auth" });
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
      const baseAmount = billingPeriod === "yearly" ? priceAmount * 12 : priceAmount;
      const checkoutAmount = baseAmount + platformFee;

      const options = {
        key: keyId,
        amount: Math.round(checkoutAmount * 100), // amount in cents/paisa
        currency: currency,
        name: "AppOrbit",
        image: "/logo.png",
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

  const backendUrl = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5001";

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
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                billingPeriod === "yearly" 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
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
              <div className="mt-4 flex flex-col gap-1.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-5xl font-display font-bold ${p.featured ? "text-primary-foreground" : "gradient-text"}`}>
                    {p.priceINR}
                  </span>
                  <span className="text-base font-normal text-muted-foreground">{p.billingLabel}</span>
                </div>
                {p.priceValueINR > 0 && (
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                      p.featured 
                        ? "bg-muted text-foreground border-border" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {p.priceUSD} USD (Intl)
                    </span>
                  </div>
                )}
              </div>

              <p className={`mt-4 text-sm ${p.featured ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{p.desc}</p>
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
                onClick={() => handleSubscribe(p)}
                disabled={loadingPlan === p.name}
              >
                {loadingPlan === p.name ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> : null}
                {loadingPlan === p.name ? "Processing..." : p.cta}
              </Button>
            </div>
          ))}
        </div>

        {showCurrencyModal && selectedPlanForCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-[2.5rem] border border-border/40 p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-2xl font-display font-bold text-center mb-2 text-foreground">Select Currency</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Choose how you would like to complete your checkout for {selectedPlanForCheckout.name} plan.
              </p>
              
              <div className="space-y-4">
                {/* INR Option */}
                <button
                  onClick={() => {
                    setShowCurrencyModal(false);
                    executeSubscribe(
                      selectedPlanForCheckout.name, 
                      selectedPlanForCheckout.priceValueINR, 
                      0, 
                      "INR"
                    );
                  }}
                  className="w-full p-4 rounded-2xl border border-border/40 hover:border-primary/50 bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all text-left flex justify-between items-center group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-foreground group-hover:text-primary transition-colors">Pay in INR (₹)</div>
                    <div className="text-xs text-muted-foreground">For Indian cards & UPI</div>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ₹{billingPeriod === "yearly" ? selectedPlanForCheckout.priceValueINR * 12 : selectedPlanForCheckout.priceValueINR}
                  </div>
                </button>
 
                {/* USD Option */}
                <button
                  onClick={() => {
                    setShowCurrencyModal(false);
                    executeSubscribe(
                      selectedPlanForCheckout.name, 
                      selectedPlanForCheckout.priceValueUSD, 
                      selectedPlanForCheckout.platformFeeUSD, 
                      "USD"
                    );
                  }}
                  className="w-full p-4 rounded-2xl border border-border/40 hover:border-emerald-500/50 bg-foreground/[0.03] hover:bg-foreground/[0.06] transition-all text-left flex justify-between items-center group cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-foreground group-hover:text-emerald-400 transition-colors">Pay in USD ($)</div>
                    <div className="text-xs text-muted-foreground">For international cards (Includes $2 fee)</div>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    ${billingPeriod === "yearly" 
                      ? (selectedPlanForCheckout.priceValueUSD * 12 + selectedPlanForCheckout.platformFeeUSD).toFixed(2)
                      : (selectedPlanForCheckout.priceValueUSD + selectedPlanForCheckout.platformFeeUSD).toFixed(2)
                    }
                  </div>
                </button>
              </div>
 
              <Button
                variant="ghost"
                className="w-full mt-6 text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setShowCurrencyModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* COMPARISON TABLE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold italic underline decoration-primary/30 text-foreground">Detailed Comparison</h2>
        </div>
        <div className="glass rounded-[2.5rem] overflow-x-auto border-border/40">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-foreground/[0.02] border-b border-border/40">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Capability</th>
                <th className="p-8 text-center text-xs font-bold text-foreground">Free</th>
                <th className="p-8 text-center text-xs font-bold text-primary">Pro</th>
                <th className="p-8 text-center text-xs font-bold text-emerald-500">Business</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              <ComparisonRow label="Simultaneous Builds" free="1 Node" pro="Unlimited" business="Enterprise Cluster" />
              <ComparisonRow label="Push Notifications" free="✕" pro="FCM / OneSignal" business="Full Managed" />
              <ComparisonRow label="API Integration" free="✕" freeStatus="disabled" pro="✕" proStatus="disabled" business="✓ Full Access" />
              <ComparisonRow label="White-label Branding" free="✕" pro="✓" business="✓ + custom splash" />
              <ComparisonRow label="Build Priority" free="Normal" pro="Priority" business="Instant Instant" />
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
    <tr className="hover:bg-foreground/[0.01] transition-colors">
      <td className="p-8 font-medium text-foreground/75">{label}</td>
      <td className={`p-8 text-center ${freeStatus === 'disabled' ? 'text-muted-foreground/30' : 'text-foreground/60 font-mono text-xs'}`}>{free}</td>
      <td className={`p-8 text-center ${proStatus === 'disabled' ? 'text-muted-foreground/30' : 'text-foreground font-bold text-xs italic'}`}>{pro}</td>
      <td className={`p-8 text-center ${businessStatus === 'disabled' ? 'text-muted-foreground/30' : 'text-emerald-500 font-black text-xs uppercase'}`}>{business}</td>
    </tr>
  );
}

