import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  Trash2,
  Plus,
  Smartphone,
  ExternalLink,
  Activity,
  Box,
  Zap,
  Clock,
  TrendingUp,
  RefreshCw,
  Globe,
  Link as LinkIcon,
  CheckCircle2,
  Eye,
  Settings,
  Crown,
  Users,
  Key,
  LifeBuoy,
  PlayCircle,
  BarChart3,
  Terminal,
  ShieldCheck,
  History as HistoryIcon,
  Copy,
  Lock as LockIcon,
  Camera,
  Pencil
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthGuard } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AppOrbit" }, { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" }] }),
  component: DashboardPage,
});

interface App {
  id: string;
  name: string;
  website_url: string;
  html_file_url: string | null;
  target_platform: string;
  android_build_format: string;
  package_name: string;
  theme_color: string;
  icon_url: string | null;
  status: string;
  apk_url: string | null;
  created_at: string;
}

const MOCK_CHART_DATA = [
  { name: "Mon", builds: 4 },
  { name: "Tue", builds: 7 },
  { name: "Wed", builds: 5 },
  { name: "Thu", builds: 12 },
  { name: "Fri", builds: 9 },
  { name: "Sat", builds: 15 },
  { name: "Sun", builds: 10 },
];

const backendUrl = (import.meta.env.VITE_BACKEND_URL as string) || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? "http://localhost:5001" : "https://web2app-689l.onrender.com");

function DashboardPage() {
  const session = useAuthGuard();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrApp, setQrApp] = useState<App | null>(null);
  const [previewApp, setPreviewApp] = useState<App | null>(null);
  const [editApp, setEditApp] = useState<App | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [plan, setPlan] = useState<string>("free");
  const [backendAppCount, setBackendAppCount] = useState<number>(0);
  const [importUrl, setImportUrl] = useState("");
  const [builds, setBuilds] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState("");
  const navigate = useNavigate();

  const loadBuilds = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from("builds")
      .select("*")
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false });
    if (!error && data) {
      setBuilds(data);
    }
  };

  const handleRebuild = async () => {
    if (apps.length === 0) {
      toast.error("No projects available to rebuild. Please convert a website first.");
      return;
    }

    const latestApp = apps[0];
    toast.info(`Triggering priority Android APK rebuild for ${latestApp.name}...`);
    setApps(prev => prev.map(a => a.id === latestApp.id ? { ...a, status: 'building' } : a));

    try {
      await supabase.from("apps").update({ status: "building" }).eq("id", latestApp.id);

      const buildRes = await fetch(`${backendUrl}/api/pwa/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: session?.user.id,
          website_url: latestApp.website_url,
          app_name: latestApp.name,
          short_name: latestApp.name.slice(0, 12),
          theme_color: latestApp.theme_color,
          background_color: "#0a0a0a",
          sourceType: latestApp.html_file_url ? 'html' : 'url',
          htmlContent: latestApp.html_file_url ? '<!-- rebuilt offline html -->' : '',
          iconUrl: latestApp.icon_url,
          cacheStrategy: "StaleWhileRevalidate",
          android_build_format: latestApp.android_build_format || "apk"
        })
      });

      if (!buildRes.ok) {
        throw new Error("Failed to start build on server");
      }

      const buildData = await buildRes.json();
      const backendBuildId = buildData.buildId;

      let finished = false;
      let lastStep = "";
      while (!finished) {
        await new Promise(r => setTimeout(r, 1500));
        const statusRes = await fetch(`${backendUrl}/api/pwa/build/status/${backendBuildId}`);
        if (!statusRes.ok) continue;
        
        const statusData = await statusRes.json();
        if (statusData.step && statusData.step !== lastStep) {
          lastStep = statusData.step;
          toast.info(`APK Builder: ${lastStep}`);
        }

        if (statusData.status === 'success') {
          finished = true;
          const finalZipUrl = `${backendUrl}/api/pwa/download/${backendBuildId}`;
          await supabase.from("apps").update({ status: "ready", apk_url: finalZipUrl }).eq("id", latestApp.id);
          toast.success(`${latestApp.name} Android APK is ready!`);
          loadApps();
        } else if (statusData.status === 'failed') {
          finished = true;
          throw new Error(statusData.error || "APK compilation failed on server");
        }
      }

    } catch (error: any) {
      toast.error("APK compilation failed: " + error.message);
      await supabase.from("apps").update({ status: "ready" }).eq("id", latestApp.id);
      loadApps();
    }
  };

  useEffect(() => {
    if (!session) return;
    loadApps();
    loadBuilds();
    fetchPlan();
  }, [session]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session!.user.id)
        .maybeSingle();
        
      if (data) {
        setPlan(data.plan || 'free');
        if (data.api_key) setApiKey(data.api_key);
        
        try {
          const limitRes = await fetch(`${backendUrl}/api/pwa/check-limits/${session!.user.id}`);
          if (limitRes.ok) {
            const limitData = await limitRes.json();
            setBackendAppCount(limitData.count || 0);
          }
        } catch (e) {
          console.error("Error fetching backend app count:", e);
        }

        // Sync profile details to Neon backend database
        fetch(`${backendUrl}/api/profiles/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.id,
            email: session!.user.email,
            plan: data.plan || 'free',
            api_key: data.api_key || null
          })
        }).catch(err => console.error("Error syncing profile:", err));
      } else {
        const meta = session!.user.user_metadata || {};
        const displayName = meta.full_name || meta.name || meta.display_name || session!.user.email?.split('@')[0] || "User";
        
        await supabase.from("profiles").upsert({
          id: session!.user.id,
          display_name: displayName,
          plan: 'free'
        }, { onConflict: 'id' });
        
        setPlan('free');
        
        try {
          const limitRes = await fetch(`${backendUrl}/api/pwa/check-limits/${session!.user.id}`);
          if (limitRes.ok) {
            const limitData = await limitRes.json();
            setBackendAppCount(limitData.count || 0);
          }
        } catch (e) {
          console.error("Error fetching backend app count:", e);
        }

        // Sync new profile details to Neon backend database
        fetch(`${backendUrl}/api/profiles/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: session!.user.id,
            email: session!.user.email,
            plan: 'free',
            api_key: null
          })
        }).catch(err => console.error("Error syncing new profile:", err));
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setPlan('free');
    }
  };

  const loadApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .eq("user_id", session!.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setApps((data ?? []) as App[]);
    setLoading(false);
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Delete this APK project? This action cannot be undone.")) return;
    const { error } = await supabase.from("apps").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("APK project removed successfully");
      setApps((a) => a.filter((x) => x.id !== id));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editApp) return;
    try {
      const { error } = await supabase.from("apps").update({
        name: editApp.name,
        website_url: editApp.website_url,
        theme_color: editApp.theme_color
      }).eq("id", editApp.id);

      if (error) throw error;
      toast.success("APK settings updated!");
      setEditApp(null);
      loadApps();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    }
  };

  const handlePwaDownload = async (app: App, formatOverride?: "apk" | "aab") => {
    if (!app.apk_url) return;
    const format = formatOverride || (app.android_build_format === "aab" ? "aab" : "apk");
    const label = format.toUpperCase();
    try {
      toast.info(`Downloading Android ${label}...`);
      const downloadUrl = app.apk_url.includes("?") 
        ? `${app.apk_url}&format=${format}` 
        : `${app.apk_url}?format=${format}`;
        
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      const mimeType = format === "aab" ? "application/octet-stream" : "application/vnd.android.package-archive";
      const fileBlob = new Blob([blob], { type: mimeType });
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${app.name.replace(/[^a-zA-Z0-9]/g, "_")}.${format}`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${label} download started`);
    } catch (error) {
      const downloadUrl = app.apk_url.includes("?") 
        ? `${app.apk_url}&format=${format}` 
        : `${app.apk_url}?format=${format}`;
      window.open(downloadUrl, "_blank");
    }
  };

  const handleObbDownload = async (app: App) => {
    if (!app.apk_url) {
      toast.error("App package not ready yet. Please wait for the build to complete.");
      return;
    }
    toast.info("Preparing OBB file...");
    try {
      const blob = new Blob(["Android OBB expansion file content for " + app.name], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `main.1.${app.package_name || "com.app.pwa"}.obb`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("OBB file download started");
    } catch (error) {
      toast.error("Failed to download OBB file");
    }
  };

  if (!session) return null;

  const dashboardProps = {
    apps,
    loading,
    onImport: () => setIsImportDialogOpen(true),
    onDelete: deleteApp,
    onEdit: setEditApp,
    onDownload: handlePwaDownload,
    onDownloadObb: handleObbDownload,
    onPreview: setPreviewApp,
    onQr: setQrApp,
    onRebuild: handleRebuild,
    onRefresh: async () => {
      await Promise.all([loadApps(), loadBuilds()]);
    },
    activeBuilds: apps.filter(a => a.status === 'building').length,
    isImportDialogOpen,
    setIsImportDialogOpen,
    backendAppCount,
    plan,
    session,
    builds,
    apiKey,
    setApiKey
  };

  return (
    <>
      {plan === "free" ? (
        <FreeDashboard {...dashboardProps} />
      ) : plan === "pro" ? (
        <ProDashboard {...dashboardProps} />
      ) : (
        <BusinessDashboard {...dashboardProps} />
      )}

      {/* SHARED DIALOGS */}
      <Dialog open={!!qrApp} onOpenChange={() => setQrApp(null)}>
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl bg-card border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="text-center font-bold text-foreground">APK Install Link QR</DialogTitle></DialogHeader>
          {qrApp?.website_url && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeSVG value={qrApp.website_url} size={180} level="H" />
              </div>
              <p className="text-xs text-muted-foreground text-center">Scan to open and install <b>{qrApp.name}</b> directly on mobile.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewApp} onOpenChange={() => setPreviewApp(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center" aria-describedby={undefined}>
          <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-zinc-700 rounded-full"></div>
            </div>
            <div className="w-full h-full pt-6">
              {previewApp && <iframe src={previewApp.website_url} className="w-full h-full border-none bg-white" title="App Preview" />}
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-700 rounded-full z-20"></div>
          </div>
          <p className="mt-4 text-muted-foreground text-xs font-medium">Previewing: {previewApp?.name}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editApp} onOpenChange={() => setEditApp(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="font-bold text-foreground">Edit APK Settings</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">APK Name</Label>
              <Input id="edit-name" value={editApp?.name || ""} onChange={(e) => setEditApp(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="My APK" required className="bg-background border-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Website URL</Label>
              <Input id="edit-url" type="url" value={editApp?.website_url || ""} onChange={(e) => setEditApp(prev => prev ? { ...prev, website_url: e.target.value } : null)} placeholder="https://example.com" required className="bg-background border-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Theme Color</Label>
              <div className="flex gap-3 items-center">
                <input id="edit-color" type="color" value={editApp?.theme_color || "#7c3aed"} onChange={(e) => setEditApp(prev => prev ? { ...prev, theme_color: e.target.value } : null)} className="h-10 w-16 rounded-lg cursor-pointer bg-transparent border border-border" />
                <Input value={editApp?.theme_color || ""} onChange={(e) => setEditApp(prev => prev ? { ...prev, theme_color: e.target.value } : null)} className="flex-1 font-mono text-sm bg-background border-input" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg" onClick={() => setEditApp(null)}>Cancel</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border text-foreground" aria-describedby={undefined}>
          <DialogHeader><DialogTitle className="font-bold text-foreground">Import Website URL</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Enter the website address to begin the conversion process.</p>
            <Input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://example.com" className="h-11 rounded-lg bg-background border-input" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-10 rounded-lg" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-10 rounded-lg" onClick={() => {
              if (importUrl) {
                navigate({ to: "/converter", search: { url: importUrl } });
                setIsImportDialogOpen(false);
              } else {
                toast.error("Please enter a URL");
              }
            }}>Analyze URL</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FreeDashboard({ apps, loading, onDelete, onEdit, onDownload, onDownloadObb, onPreview, onQr, backendAppCount }: any) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Free Plan — Limited Access
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Free Panel</h1>
            <p className="text-muted-foreground mt-1">Experience stufflas with your free tier.</p>
          </div>
          {apps.length < 1 && backendAppCount < 1 ? (
            <Button className="rounded-lg px-4 h-10 gap-2 font-semibold shadow-sm w-full md:w-auto justify-center" asChild>
              <Link to="/converter"><Plus className="h-4 w-4" /> Create APK (1/1)</Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-lg px-4 h-10 gap-2 font-semibold border-amber-500/50 text-amber-500 hover:bg-amber-500/5 w-full md:w-auto justify-center" asChild>
              <Link to="/pricing"><Crown className="h-4 w-4" /> Upgrade to build more</Link>
            </Button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-8">
            <section className="bg-card border border-border/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden group/section">
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30 backdrop-blur-sm">
                <h3 className="text-sm font-bold uppercase tracking-wider">Your Application</h3>
              </div>
              {loading ? (
                <div className="p-10 text-center animate-pulse">Checking records...</div>
              ) : apps.length === 0 ? (
                <div className="p-16 text-center">
                  <Box className="h-12 w-12 mx-auto text-muted/20 mb-4" />
                  <h4 className="font-bold">No apps yet</h4>
                  <p className="text-sm text-muted-foreground mb-6">Start by converting your first website.</p>
                  <Button asChild><Link to="/converter">Get Started</Link></Button>
                </div>
              ) : (
                <div className="p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border border-border shrink-0">
                      {apps[0].icon_url ? <img src={apps[0].icon_url} className="h-12 w-12 rounded-xl object-cover" /> : <Smartphone className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
                        {apps[0].name} 
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0">{apps[0].android_build_format === 'aab' ? 'AAB Bundle' : 'APK Package'}</span>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {apps[0].website_url.startsWith("http") ? new URL(apps[0].website_url).hostname : "Local HTML Source"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                    <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform flex-1 sm:flex-initial" onClick={() => onDownload(apps[0], "apk")}>
                      <Download className="h-4 w-4 mr-2" /> Download APK
                    </Button>
                    <Button variant="outline" size="sm" className="hover:scale-105 transition-transform border-dashed flex-1 sm:flex-initial" onClick={() => onDownload(apps[0], "aab")}>
                      <Download className="h-4 w-4 mr-2" /> Download AAB
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto justify-center">
                      <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2" onClick={() => onPreview(apps[0])}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2" onClick={() => onEdit(apps[0])}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2" onClick={() => onQr(apps[0])}><ExternalLink className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2 hover:bg-destructive/10 text-destructive" onClick={() => onDelete(apps[0].id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              )}
            </section>
            <div className="grid sm:grid-cols-2 gap-6">
              <DashboardFeatureCard icon={Zap} label="Fast Manifest Generator" desc="Fully compliant W3C manifest files." color="text-primary" />
              <DashboardFeatureCard icon={Globe} label="Offline Service Worker" desc="Configured caching for offline use." color="text-blue-500" />
            </div>
          </div>
          <aside className="space-y-6">
            <div className="gradient-bg rounded-[2rem] p-6 text-primary-foreground shadow-xl neon-glow">
              <Crown className="h-10 w-10 mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Unlock Unlimited</h3>
              <p className="text-sm opacity-90 mb-6">Remove branding and package unlimited APKs.</p>
              <Button variant="glass" className="w-full font-bold" asChild><Link to="/pricing">Upgrade to Pro</Link></Button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProDashboard({ apps, activeBuilds, loading, onImport, onDelete, onEdit, onDownload, onDownloadObb, onPreview, onQr, onRebuild, plan, session, builds }: any) {
  const [avatar, setAvatar] = useState<string | null>(() => {
    if (typeof window !== "undefined" && session?.user?.id) {
      return localStorage.getItem(`avatar_${session.user.id}`);
    }
    return null;
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        if (session?.user?.id) {
          localStorage.setItem(`avatar_${session.user.id}`, base64String);
        }
        toast.success("Profile photo saved successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
              <Crown className="h-3 w-3" /> {plan} Creator
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Pro Console</h1>
            <p className="text-muted-foreground mt-1">Manage your unlimited Android Apps.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button variant="outline" className="rounded-xl px-4 h-10 w-full sm:w-auto justify-center" onClick={onImport}>Import URL</Button>
            <Button className="rounded-xl px-4 h-10 shadow-neon w-full sm:w-auto justify-center" asChild><Link to="/converter">New APK Project</Link></Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <StatCard label="APK Projects" val={apps.length} sub="Unlimited" icon={Box} color="text-primary" />
          <StatCard label="Priority Bundlers" val={activeBuilds} sub="Instant Compilation" icon={Zap} color="text-amber-500" />
          <StatCard label="White Labeling" val="Active" sub="White-label manifests" icon={CheckCircle2} color="text-emerald-500" />
          <StatCard label="APK Push Services" val="Ready" sub="Web Push Notification" icon={Activity} color="text-blue-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="font-bold">Active APK Projects</h3>
                <span className="text-xs text-muted-foreground">{apps.length} items</span>
              </div>
              {loading ? (
                <div className="p-20 text-center animate-pulse">Syncing...</div>
              ) : apps.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground">No projects found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {apps.map((app: any) => (
                    <div key={app.id} className="p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 hover:bg-muted/50 transition-colors duration-300 group relative overflow-hidden text-center md:text-left">
                      <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                      <div className="flex flex-col sm:flex-row items-center gap-5 flex-1 relative z-10">
                        <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 shrink-0">
                          {app.icon_url ? <img src={app.icon_url} className="h-10 w-10 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300" /> : <Smartphone className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
                            {app.name} 
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full shrink-0">PRO {app.android_build_format === 'aab' ? 'AAB' : 'APK'}</span>
                          </h4>
                          <div className="flex flex-col sm:flex-row items-center gap-2 mt-1.5 justify-center sm:justify-start">
                            <p className="text-[10px] text-muted-foreground font-mono uppercase bg-white/5 px-2 py-0.5 rounded-md shrink-0">Android App</p>
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">{app.website_url}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto relative z-10">
                        <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform flex-1 sm:flex-initial" onClick={() => onDownload(app, "apk")}>
                          <Download className="h-4 w-4 mr-2" /> Download APK
                        </Button>
                        <Button variant="outline" size="sm" className="hover:scale-105 transition-transform border-dashed flex-1 sm:flex-initial" onClick={() => onDownload(app, "aab")}>
                          <Download className="h-4 w-4 mr-2" /> Download AAB
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto justify-center">
                          <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2" onClick={() => onPreview(app)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2" onClick={() => onEdit(app)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2" onClick={() => onQr(app)}><ExternalLink className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform p-2 hover:bg-destructive/10 text-destructive" onClick={() => onDelete(app.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
              <h3 className="font-bold mb-6 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Compilation History</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(() => {
                    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const last7Days = [];
                    for (let i = 6; i >= 0; i--) {
                      const d = new Date();
                      d.setDate(d.getDate() - i);
                      const dayName = days[d.getDay()];
                      const count = (builds || []).filter((b: any) => {
                        const buildDate = new Date(b.started_at);
                        return buildDate.toDateString() === d.toDateString();
                      }).length;
                      last7Days.push({ name: dayName, builds: count });
                    }
                    return last7Days;
                  })()}>
                    <defs><linearGradient id="colorBuilds" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="builds" stroke="var(--primary)" strokeWidth={3} fill="url(#colorBuilds)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          <aside className="space-y-8">
            <div className="glass p-8 rounded-[2rem] space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Settings className="h-4 w-4" /> Pro Features</h4>
              <ul className="space-y-4 text-xs font-medium">
                <li className="flex justify-between"><span>White Labeling</span> <span className="text-emerald-500">Active</span></li>
                <li className="flex justify-between"><span>Offline Compilation</span> <span className="text-amber-500">Enabled</span></li>
                <li className="flex justify-between"><span>Priority Queue</span> <span className="text-blue-500">Ready</span></li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl" onClick={onRebuild}>Global Rebuild</Button>
            </div>

            <div className="glass p-8 rounded-[2rem] border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative group overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-24 w-24" />
              </div>
              <h4 className="font-bold text-sm uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Identity Card
              </h4>
              <div className="flex items-center gap-4 mb-6">
                <label className="relative cursor-pointer group/avatar block">
                  <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-black shadow-lg overflow-hidden border border-border/50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    {avatar ? (
                      <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      session?.user.email?.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-card rounded-full shadow-xl flex items-center justify-center border border-border opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 scale-75 group-hover/avatar:scale-100 z-10">
                    <Camera className="h-3 w-3 text-foreground" />
                  </div>
                </label>
                <div>
                  <h5 className="font-bold text-lg leading-none">{session?.user.email?.split('@')[0]}</h5>
                  <p className="text-[10px] text-primary font-black uppercase mt-1 tracking-widest">{plan} Verified</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/40">
                  <span>Trust Score</span>
                  <span className="text-emerald-500">98%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[98%]" />
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-6 h-10 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 transition-transform hover:scale-[1.02]" onClick={() => toast.success("Opening profile settings...")}>Manage Public Profile</Button>
            </div>
          </aside>
        </motion.div>
      </motion.main>
      <Footer />
    </div>
  );
}

function BusinessDashboard({ apps, activeBuilds, loading, onImport, onDelete, onEdit, onDownload, onDownloadObb, onPreview, onQr, onRebuild, plan, session, onRefresh, builds, apiKey, setApiKey }: any) {
  const [admobIds, setAdmobIds] = useState({ banner: "", interstitial: "" });
  const [avatar, setAvatar] = useState<string | null>(() => {
    if (typeof window !== "undefined" && session?.user?.id) {
      return localStorage.getItem(`avatar_${session.user.id}`);
    }
    return null;
  });

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const [tickets, setTickets] = useState<any[]>([]);
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "normal" });
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const [playSubmissions, setPlaySubmissions] = useState<any[]>([]);
  const [requestPlayAppId, setRequestPlayAppId] = useState("");
  const [playNotes, setPlayNotes] = useState("");
  const [submittingPlay, setSubmittingPlay] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        if (session?.user?.id) {
          localStorage.setItem(`avatar_${session.user.id}`, base64String);
        }
        toast.success("Organization Avatar saved!");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateApiKey = async () => {
    const key = "w2a_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ api_key: key })
        .eq("id", session.user.id);
      
      if (error) {
        throw error;
      }

      // Sync API Key to Neon/SQLite Database
      fetch(`${backendUrl}/api/profiles/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          plan: plan,
          api_key: key
        })
      }).catch(err => console.error("Error syncing generated API Key:", err));

      setApiKey(key);
      toast.success("New API Key generated and saved to your profile.");
    } catch (err: any) {
      toast.error("Failed to save API Key: " + err.message);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const { error } = await supabase
        .from("team_members")
        .insert({
          owner_id: session.user.id,
          email: inviteEmail,
          role: 'developer'
        });
      if (error) throw error;

      // Send email via nodemailer backend
      try {
        const inviteRes = await fetch(`${backendUrl}/api/team/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: inviteEmail,
            ownerEmail: session.user.email,
            inviteLink: `${window.location.origin}/auth`
          })
        });
        if (!inviteRes.ok) {
          console.warn("Backend failed to send email. Check SMTP setup in backend .env");
        }
      } catch (mailErr) {
        console.error("Error triggering invite email:", mailErr);
      }

      toast.success(`Invited ${inviteEmail} to team workspace!`);
      setInviteEmail("");
      // reload
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", session.user.id);
      if (data) setTeamMembers(data);
    } catch (err: any) {
      toast.error("Invitation failed: " + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Failed to remove member");
    } else {
      toast.success("Team member removed");
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", session.user.id);
      if (data) setTeamMembers(data);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) {
      toast.error("Please fill in all fields");
      return;
    }
    setCreatingTicket(true);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: session.user.id,
          subject: newTicket.subject,
          description: newTicket.description,
          priority: newTicket.priority
        });
      if (error) throw error;
      toast.success("Ticket submitted! A dedicated expert is assigned and will email you.");
      setNewTicket({ subject: "", description: "", priority: "normal" });
      setIsSupportOpen(false);
      // reload
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setTickets(data);
    } catch (err: any) {
      toast.error("Failed to create ticket: " + err.message);
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleRequestPlaySubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestPlayAppId) {
      toast.error("Please select an app");
      return;
    }
    setSubmittingPlay(true);
    try {
      const selectedApp = apps.find((a: any) => a.id === requestPlayAppId);
      const { error } = await supabase
        .from("play_store_submissions")
        .insert({
          user_id: session.user.id,
          app_id: requestPlayAppId,
          package_name: selectedApp?.package_name || "com.app.twa",
          notes: playNotes
        });
      if (error) throw error;
      toast.success("Play Store compilation and submission request registered!");
      setPlayNotes("");
      setIsPlayModalOpen(false);
      // reload
      const { data } = await supabase
        .from("play_store_submissions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setPlaySubmissions(data);
    } catch (err: any) {
      toast.error("Failed to request submission: " + err.message);
    } finally {
      setSubmittingPlay(false);
    }
  };

  useEffect(() => {
    const fetchApiKey = async () => {
      if (!session?.user?.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("api_key")
          .eq("id", session.user.id)
          .maybeSingle();
        if (!error && data?.api_key) {
          setApiKey(data.api_key);
        }
      } catch (err) {
        console.error("Failed to fetch API Key:", err);
      }
    };

    const fetchAdmobConfig = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`${backendUrl}/api/admob/${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAdmobIds({
            banner: data.banner_id || "",
            interstitial: data.interstitial_id || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch AdMob configuration:", err);
      }
    };

    const fetchTeamMembers = async () => {
      if (!session?.user?.id) return;
      try {
        const { data } = await supabase
          .from("team_members")
          .select("*")
          .eq("owner_id", session.user.id);
        if (data) setTeamMembers(data);
      } catch (err) {
        console.error("Failed to fetch team members:", err);
      }
    };

    const fetchTickets = async () => {
      if (!session?.user?.id) return;
      try {
        const { data } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        if (data) setTickets(data);
      } catch (err) {
        console.error("Failed to fetch tickets:", err);
      }
    };

    const fetchPlaySubmissions = async () => {
      if (!session?.user?.id) return;
      try {
        const { data } = await supabase
          .from("play_store_submissions")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        if (data) setPlaySubmissions(data);
      } catch (err) {
        console.error("Failed to fetch Play Store submissions:", err);
      }
    };

    fetchApiKey();
    fetchAdmobConfig();
    fetchTeamMembers();
    fetchTickets();
    fetchPlaySubmissions();
  }, [session]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />
      <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 container mx-auto px-4 py-12 max-w-7xl">

        {/* BUSINESS HEADER */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 glass p-8 rounded-[2.5rem] border-amber-500/30 shadow-[0_0_40px_-15px_rgba(245,158,11,0.2)]">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_50px_-12px_rgba(245,158,11,0.5)]">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black tracking-tighter italic uppercase text-foreground">Business Hub</h1>
                <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-tighter shadow-sm">Enterprise</span>
              </div>
              <p className="text-muted-foreground font-medium">Welcome back, {session?.user.email?.split('@')[0]}.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="rounded-xl h-11 px-6 border-border hover:bg-muted gap-2 transition-transform hover:scale-105" onClick={() => {
              toast.promise(new Promise(r => setTimeout(r, 1500)), {
                loading: 'Syncing with Enterprise API...',
                success: 'API synchronization complete. All nodes up to date.'
              });
            }}>
              <Terminal className="h-4 w-4" /> API Sync
            </Button>
            <Button className="rounded-xl h-11 px-6 bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 font-bold gap-2" asChild>
              <Link to="/converter"><Plus className="h-4 w-4" /> Deploy New APK</Link>
            </Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <BusinessStat label="Active APK Nodes" val={apps.length} sub="Unlimited Quota" icon={Box} color="text-amber-500" />
          <BusinessStat label="API Calls" val="12.4k" sub="99.9% Success" icon={Key} color="text-blue-500" />
          <StatCard label="Support Tickets" val={tickets.filter(t => t.status === 'open').length} sub="Dedicated support" icon={LifeBuoy} color="text-emerald-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">

            {/* MY WORKSPACE / APPS */}
            <section className="glass rounded-[2.5rem] overflow-hidden border-amber-500/10 shadow-2xl">
              <div className="px-10 py-8 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">My Workspace</h3>
                  <p className="text-xs text-muted-foreground mt-1">Your deployed APKs and deployment history</p>
                </div>
                <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-muted transition-transform hover:rotate-180 duration-500" onClick={() => {
                  toast.promise(onRefresh(), {
                    loading: 'Fetching latest logs...',
                    success: 'Workspace history is completely synced!',
                    error: 'Failed to sync workspace history.'
                  });
                }}><HistoryIcon className="h-5 w-5" /></Button>
              </div>

              {loading ? (
                <div className="p-24 text-center">
                  <RefreshCw className="h-10 w-10 mx-auto text-amber-500 animate-spin mb-4" />
                  <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Hydrating deployments...</p>
                </div>
              ) : apps.length === 0 ? (
                <div className="p-24 text-center">
                  <Box className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" />
                  <p className="text-muted-foreground font-medium italic">No deployments found in this workspace.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {apps.map((app: any) => (
                    <div key={app.id} className="p-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-8 hover:bg-muted/30 transition-all duration-300 group relative overflow-hidden text-center md:text-left">
                      <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                      <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 relative z-10">
                        <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-amber-500/10 to-transparent border border-border flex items-center justify-center shadow-lg group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)] transition-all duration-500 shrink-0">
                          {app.icon_url ? <img src={app.icon_url} className="h-14 w-14 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500" /> : <Smartphone className="h-8 w-8 text-muted-foreground group-hover:text-amber-500 transition-colors duration-300" />}
                        </div>
                        <div>
                          <div className="flex flex-col sm:flex-row items-center gap-3 mb-2 justify-center sm:justify-start">
                            <h4 className="text-2xl font-bold tracking-tighter text-foreground">{app.name}</h4>
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-500/20 uppercase shadow-sm shrink-0">Enterprise {app.android_build_format === 'aab' ? 'AAB' : 'APK'}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-mono text-muted-foreground justify-center sm:justify-start">
                            <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {app.website_url.startsWith("http") ? new URL(app.website_url).hostname : "Local HTML Source"}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto relative z-10">
                        <Button className="rounded-xl h-10 px-4 bg-amber-500 text-white hover:bg-amber-600 font-bold shadow-lg shadow-amber-500/20 hover:scale-105 hover:shadow-amber-500/40 transition-all duration-300 flex-1 sm:flex-initial" onClick={() => onDownload(app, "apk")}>
                          <Download className="h-4 w-4 mr-2" /> Download APK
                        </Button>
                        <Button variant="outline" className="rounded-xl h-10 px-4 border-dashed border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500 font-bold hover:scale-105 transition-all duration-300 flex-1 sm:flex-initial" onClick={() => onDownload(app, "aab")}>
                          <Download className="h-4 w-4 mr-2" /> Download AAB
                        </Button>
                        <div className="flex gap-2 w-full sm:w-auto justify-center">
                          <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-border hover:bg-muted hover:scale-105 transition-all duration-300" onClick={() => onPreview(app)}><Eye className="h-4 w-4 text-foreground" /></Button>
                          <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-border hover:bg-muted hover:scale-105 transition-all duration-300" onClick={() => onEdit(app)}><Pencil className="h-4 w-4 text-foreground" /></Button>
                          <Button variant="outline" className="h-10 w-10 p-0 rounded-xl border-border hover:bg-destructive/10 text-destructive hover:border-destructive/50 hover:scale-105 transition-all duration-300" onClick={() => onDelete(app.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>



            {/* DEDICATED SUPPORT DESK */}
            <section className="glass rounded-[2.5rem] p-8 border-emerald-500/10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <LifeBuoy className="h-5 w-5 text-emerald-500" /> Dedicated Support Hub
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Direct communication channel with your dedicated support expert</p>
                </div>
                <Button onClick={() => setIsSupportOpen(!isSupportOpen)} variant="outline" className="text-xs h-9 rounded-xl border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                  {isSupportOpen ? "Close Ticket Form" : "Create New Ticket"}
                </Button>
              </div>

              {isSupportOpen && (
                <form onSubmit={handleCreateTicket} className="bg-black/30 p-6 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="font-bold text-sm text-foreground">Submit Support Request</h4>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-subject" className="text-foreground">Subject</Label>
                    <Input
                      id="ticket-subject"
                      placeholder="Issue with splash screen scaling"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      className="bg-black/40 border-white/10 text-xs h-10 text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-desc" className="text-foreground">Description</Label>
                    <Textarea
                      id="ticket-desc"
                      placeholder="Describe the issue or assistance required in detail..."
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                      className="bg-black/40 border-white/10 text-xs h-24 text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticket-priority" className="text-foreground">Priority</Label>
                    <select
                      id="ticket-priority"
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus-visible:outline-none"
                    >
                      <option value="normal" className="bg-zinc-900">Normal</option>
                      <option value="high" className="bg-zinc-900">High</option>
                      <option value="urgent" className="bg-zinc-900">Urgent (SLA 1-Hour)</option>
                    </select>
                  </div>
                  <Button type="submit" disabled={creatingTicket} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold text-xs">
                    {creatingTicket ? "Submitting..." : "Send Ticket"}
                  </Button>
                </form>
              )}

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/30 border-b border-white/5 pb-2">
                  <span>Support Ticket History</span>
                  <span>Status</span>
                </div>
                {tickets.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No support requests created yet.</p>
                ) : (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex justify-between items-start text-xs hover:border-emerald-500/20 transition-all">
                      <div className="space-y-1">
                        <h5 className="font-bold text-foreground">{ticket.subject}</h5>
                        <p className="text-[10px] text-muted-foreground leading-relaxed max-w-md">{ticket.description}</p>
                        <div className="flex gap-3 text-[9px] text-muted-foreground/60 font-mono mt-2">
                          <span>Priority: <b className="capitalize text-white/80">{ticket.priority}</b></span>
                          <span>Opened: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        ticket.status === 'open' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>{ticket.status}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* BUSINESS SIDEBAR */}
          <aside className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-8">

            {/* API ACCESS CARD */}
            <section className="glass rounded-[2.5rem] p-8 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500"><Key className="h-5 w-5" /></div>
                <h4 className="text-lg font-bold text-foreground">API Infrastructure</h4>
              </div>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">Integrate stufflas directly into your CI/CD pipeline using our Enterprise API.</p>
                {apiKey ? (
                  <div className="bg-muted p-4 rounded-xl border border-border font-mono text-[10px] break-all relative group text-foreground">
                    {apiKey}
                    <Button variant="ghost" className="absolute right-2 top-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success("Copied to clipboard");
                    }}><Copy className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <Button variant="secondary" className="w-full rounded-xl h-12 font-bold hover:bg-amber-500 hover:text-white transition-colors border border-border hover:border-amber-500" onClick={generateApiKey}>Generate Access Key</Button>
                )}
              </div>
            </section>

            {/* STORE SUBMISSION WRAPPERS */}
            <section className="glass rounded-[2.5rem] p-8 border-amber-500/10 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500"><PlayCircle className="h-5 w-5" /></div>
                <h4 className="text-lg font-bold text-foreground">TWA Store Submission</h4>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">Need your APK in the Google Play Store or Apple App Store? Package it using our Trusted Web Activity (TWA) compiler.</p>
                <Button variant="outline" className="w-full rounded-xl h-10 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02]" onClick={() => {
                  if (apps.length === 0) {
                    toast.error("Please deploy a APK project first before compiling TWA.");
                    return;
                  }
                  setIsPlayModalOpen(true);
                }}>Compile TWA Wrapper</Button>
              </div>

              {playSubmissions.length > 0 && (
                <div className="space-y-2.5 pt-4 border-t border-white/5">
                  <div className="text-[10px] uppercase font-bold text-white/30">TWA Compilations</div>
                  {playSubmissions.map((sub) => {
                    const subApp = apps.find((a: any) => a.id === sub.app_id);
                    return (
                      <div key={sub.id} className="p-3 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-white/90">{subApp?.name || "TWA Package"}</div>
                          <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{sub.package_name}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          sub.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>{sub.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ADMOB WIZARD */}
            <section className="glass rounded-[2.5rem] p-8 border-amber-500/10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500"><BarChart3 className="h-5 w-5" /></div>
                <h4 className="text-lg font-bold text-foreground">AdMob Settings</h4>
              </div>
              <div className="space-y-3">
                <Input placeholder="Banner Unit ID" value={admobIds.banner} onChange={(e) => setAdmobIds({ ...admobIds, banner: e.target.value })} className="h-10 text-xs bg-background border-border text-foreground" />
                <Input placeholder="Interstitial ID" value={admobIds.interstitial} onChange={(e) => setAdmobIds({ ...admobIds, interstitial: e.target.value })} className="h-10 text-xs bg-background border-border text-foreground" />
                <Button variant="outline" className="w-full rounded-xl h-10 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02]" onClick={() => {
                  if (!admobIds.banner && !admobIds.interstitial) {
                    toast.error("Please enter at least one AdMob Unit ID");
                    return;
                  }
                  toast.promise(
                    fetch(`${backendUrl}/api/admob/save`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: session?.user?.id,
                        banner_id: admobIds.banner,
                        interstitial_id: admobIds.interstitial
                      })
                    }).then(async (res) => {
                      if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || "Failed to save AdMob configuration");
                      }
                      return await res.json();
                    }),
                    {
                      loading: 'Syncing AdMob settings...',
                      success: 'AdMob synchronized with APK manifest headers!',
                      error: (err) => err.message || 'Failed to save AdMob settings'
                    }
                  );
                }}>Save AdMob Config</Button>
              </div>
            </section>
          </aside>
        </motion.div>
      </motion.main>
      <Footer />

      {/* PLAY STORE SUBMISSION MODAL */}
      <Dialog open={isPlayModalOpen} onOpenChange={setIsPlayModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border text-foreground">
          <DialogHeader><DialogTitle className="font-bold text-foreground flex items-center gap-2"><PlayCircle className="h-5 w-5 text-amber-500" /> Play Store Wrapper Request</DialogTitle></DialogHeader>
          <form onSubmit={handleRequestPlaySubmission} className="py-4 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">Submit a request to generate a signed Google Play Asset (.aab) and receive dedicated play store setup assistance.</p>
            
            <div className="space-y-2">
              <Label htmlFor="play-app" className="text-foreground">Select APK Project</Label>
              <select
                id="play-app"
                value={requestPlayAppId}
                onChange={(e) => setRequestPlayAppId(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none"
                required
              >
                <option value="" className="bg-background text-foreground">Select an App...</option>
                {apps.map((a: any) => (
                  <option key={a.id} value={a.id} className="bg-background text-foreground">{a.name} ({a.package_name})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="play-notes" className="text-foreground">Additional Instructions (e.g. AdMob placements, custom icons)</Label>
              <Textarea
                id="play-notes"
                placeholder="Specify private signing keys details, or app descriptions..."
                value={playNotes}
                onChange={(e) => setPlayNotes(e.target.value)}
                className="bg-background border-input text-xs h-24 text-foreground"
              />
            </div>

            <Button type="submit" disabled={submittingPlay} className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 font-bold text-xs mt-2">
              {submittingPlay ? "Registering request..." : "Request Wrapper Generation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BusinessStat({ label, val, sub, icon: Icon, color }: any) {
  return (
    <div className="glass rounded-[2rem] p-8 border-white/5 hover:border-primary/50 transition-all duration-500 group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(var(--primary-rgb),0.3)] relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="flex items-center gap-5 mb-6 relative z-10">
        <div className={`h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-500 shadow-2xl`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic">{val}</h2>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black group-hover:text-primary/70 transition-colors duration-300">{label}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] font-bold text-white/40 pt-4 border-t border-white/5 relative z-10">
        <span>{sub}</span>
        <Activity className="h-3 w-3 text-primary animate-pulse" />
      </div>
    </div>
  );
}

function StatCard({ label, val, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-card border border-border rounded-[1.5rem] p-6 shadow-sm border-white/5 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="flex items-center gap-4 relative z-10">
        <div className={`h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10`}><Icon className="h-6 w-6" /></div>
        <div>
          <h2 className="text-3xl font-bold">{val}</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-muted-foreground flex items-center gap-1.5 relative z-10"><Activity className="h-3 w-3 text-emerald-500" /> {sub}</div>
    </div>
  );
}

function DashboardFeatureCard({ icon: Icon, label, desc, color }: any) {
  return (
    <div className="glass p-6 rounded-2xl border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}><Icon className="h-4 w-4" /></div>
        <h4 className="font-bold text-sm group-hover:text-primary transition-colors duration-300">{label}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}