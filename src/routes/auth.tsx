import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

import { signInWithPopup } from "firebase/auth";
import { auth as firebaseAuth, googleProvider } from "@/lib/firebase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Sign in or create an account to start building Android apps." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  displayName: z.string().trim().min(1).max(80).optional(),
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName: mode === "signup" ? displayName : undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;

        // Ensure profile is created immediately so it shows up in directory
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            display_name: displayName || email.split('@')[0],
            plan: 'free',
          }, { onConflict: 'id' });
        }

        // Sign out immediately so they have to login
        await supabase.auth.signOut();

        toast.success("Account created successfully! Please sign in.");
        setMode("signin");
        setPassword("");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Ensure profile exists on sign in
        if (data.session?.user) {
          await supabase.from("profiles").upsert({
            id: data.session.user.id,
            display_name: data.session.user.user_metadata.display_name || email.split('@')[0],
          }, { onConflict: 'id' });
        }

        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      if (result.user) {
        const fUser = result.user;
        const email = fUser.email!;

        // Create/Update local profile in our mock DB (localStorage)
        await supabase.from("profiles").upsert({
          id: fUser.uid,
          display_name: fUser.displayName || email.split('@')[0],
          plan: 'free',
        }, { onConflict: 'id' });

        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Password reset email sent successfully! Please check your inbox.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 grid-bg relative overflow-hidden"
      onClick={() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          navigate({ to: "/" });
        }
      }}
    >
      {/* Premium Ambient Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: "12s" }} />

      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md glass rounded-[2.5rem] p-10 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border"
      >
        <Link to="/" className="flex flex-col items-center gap-2 justify-center mb-8 group">
          <span className="font-display font-bold text-3xl tracking-tight text-foreground flex items-center gap-1.5">
            Join <span className="gradient-text font-black">AppOrbit</span>
          </span>
        </Link>

        <h1 className="text-2xl font-display font-bold text-center mb-1 text-foreground">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-xs text-muted-foreground text-center mb-8">
          {mode === "signin" ? "Access your mobile app build studio" : "Compile websites to APK packages in seconds"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Display name</Label>
              <Input 
                id="name" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="Jane Doe" 
                required 
                className="h-11 rounded-xl text-sm"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              required 
              className="h-11 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-primary hover:underline font-semibold uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer outline-none focus:outline-none"
                  disabled={loading}
                >
                  Forgot?
                </button>
              )}
            </div>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <Button variant="hero" size="xl" type="submit" className="w-full h-12 rounded-xl mt-2 flex items-center justify-center font-bold tracking-wide" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">OR</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        <Button
          variant="glass"
          size="lg"
          className="w-full mt-4 h-12 rounded-xl flex items-center justify-center gap-3 border border-border hover:bg-muted/50 transition-all text-foreground font-medium text-sm"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          {mode === "signin" ? (
            <>New to AppOrbit?{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:underline font-bold transition-all">Create an account</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-primary hover:underline font-bold transition-all">Sign in here</button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
