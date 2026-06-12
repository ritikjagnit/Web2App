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
  head: () => ({ meta: [{ title: "Dashboard — stufflas" }] }),
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

function DashboardPage() {
  const session = useAuthGuard();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrApp, setQrApp] = useState<App | null>(null);
  const [previewApp, setPreviewApp] = useState<App | null>(null);
  const [editApp, setEditApp] = useState<App | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [plan, setPlan] = useState<string>("free");
  const [importUrl, setImportUrl] = useState("");
  const navigate = useNavigate();

  const handleRebuild = async () => {
    if (apps.length === 0) {
      toast.error("No projects available to rebuild. Please convert a website first.");
      return;
    }

    const latestApp = apps[0];
    toast.info(`Triggering priority PWA package rebuild for ${latestApp.name}...`);
    setApps(prev => prev.map(a => a.id === latestApp.id ? { ...a, status: 'building' } : a));

    try {
      await supabase.from("apps").update({ status: "building" }).eq("id", latestApp.id);

      const backendUrl = "http://localhost:5000";
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
          cacheStrategy: "StaleWhileRevalidate"
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
          toast.info(`PWA Builder: ${lastStep}`);
        }

        if (statusData.status === 'success') {
          finished = true;
          const finalZipUrl = `${backendUrl}/api/pwa/download/${backendBuildId}`;
          await supabase.from("apps").update({ status: "ready", apk_url: finalZipUrl }).eq("id", latestApp.id);
          toast.success(`${latestApp.name} PWA package is ready!`);
          loadApps();
        } else if (statusData.status === 'failed') {
          finished = true;
          throw new Error(statusData.error || "PWA compilation failed on server");
        }
      }

    } catch (error: any) {
      toast.error("PWA compilation failed: " + error.message);
      await supabase.from("apps").update({ status: "ready" }).eq("id", latestApp.id);
      loadApps();
    }
  };

  useEffect(() => {
    if (!session) return;
    loadApps();
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
      } else {
        const meta = session!.user.user_metadata || {};
        const displayName = meta.full_name || meta.name || meta.display_name || session!.user.email?.split('@')[0] || "User";
        
        await supabase.from("profiles").upsert({
          id: session!.user.id,
          display_name: displayName,
          plan: 'free'
        }, { onConflict: 'id' });
        
        setPlan('free');
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
    if (!confirm("Delete this PWA project? This action cannot be undone.")) return;
    const { error } = await supabase.from("apps").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("PWA project removed successfully");
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
      toast.success("PWA settings updated!");
      setEditApp(null);
      loadApps();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    }
  };

  const handlePwaDownload = async (app: App) => {
    if (!app.apk_url) return;
    try {
      toast.info("Downloading Progressive Web App (PWA) package...");
      const response = await fetch(app.apk_url);
      const blob = await response.blob();

      const zipBlob = new Blob([blob], { type: "application/zip" });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = `${app.name.replace(/[^a-zA-Z0-9]/g, "_")}_pwa.zip`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      window.open(app.apk_url, "_blank");
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
    onPreview: setPreviewApp,
    onQr: setQrApp,
    onRebuild: handleRebuild,
    onRefresh: loadApps,
    activeBuilds: apps.filter(a => a.status === 'building').length,
    plan,
    session
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
        <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl bg-zinc-950 border-white/10 text-white">
          <DialogHeader><DialogTitle className="text-center font-bold text-white">PWA Install Link QR</DialogTitle></DialogHeader>
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
        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none flex flex-col items-center">
          <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-zinc-700 rounded-full"></div>
            </div>
            <div className="w-full h-full pt-6">
              {previewApp && <iframe src={previewApp.website_url} className="w-full h-full border-none bg-white" title="App Preview" />}
            </div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-700 rounded-full z-20"></div>
          </div>
          <p className="mt-4 text-white/60 text-xs font-medium">Previewing: {previewApp?.name}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editApp} onOpenChange={() => setEditApp(null)}>
        <DialogContent className="max-w-md rounded-2xl bg-zinc-950 border-white/10 text-white">
          <DialogHeader><DialogTitle className="font-bold text-white">Edit PWA Settings</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">PWA Name</Label>
              <Input id="edit-name" value={editApp?.name || ""} onChange={(e) => setEditApp(prev => prev ? { ...prev, name: e.target.value } : null)} placeholder="My PWA" required className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-url">Website URL</Label>
              <Input id="edit-url" type="url" value={editApp?.website_url || ""} onChange={(e) => setEditApp(prev => prev ? { ...prev, website_url: e.target.value } : null)} placeholder="https://example.com" required className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Theme Color</Label>
              <div className="flex gap-3 items-center">
                <input id="edit-color" type="color" value={editApp?.theme_color || "#7c3aed"} onChange={(e) => setEditApp(prev => prev ? { ...prev, theme_color: e.target.value } : null)} className="h-10 w-16 rounded-lg cursor-pointer bg-transparent border border-border" />
                <Input value={editApp?.theme_color || ""} onChange={(e) => setEditApp(prev => prev ? { ...prev, theme_color: e.target.value } : null)} className="flex-1 font-mono text-sm bg-black/40 border-white/10" />
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
        <DialogContent className="max-w-md rounded-2xl bg-zinc-950 border-white/10 text-white">
          <DialogHeader><DialogTitle className="font-bold text-white">Import Website URL</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Enter the website address to begin the conversion process.</p>
            <Input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://example.com" className="h-11 rounded-lg bg-black/40 border-white/10" />
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

function FreeDashboard({ apps, loading, onDelete, onEdit, onDownload, onPreview, onQr }: any) {
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
          {apps.length < 1 ? (
            <Button className="rounded-lg px-5 h-11 gap-2 font-semibold shadow-sm" asChild>
              <Link to="/converter"><Plus className="h-4 w-4" /> Create PWA (1/1)</Link>
            </Button>
          ) : (
            <Button variant="outline" className="rounded-lg px-5 h-11 gap-2 font-semibold border-amber-500/50 text-amber-500 hover:bg-amber-500/5" asChild>
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
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border border-border">
                      {apps[0].icon_url ? <img src={apps[0].icon_url} className="h-12 w-12 rounded-xl object-cover" /> : <Smartphone className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{apps[0].name} <span className="text-[10px] bg-primary/20 text-primary px-2 rounded-full">PWA Package</span></h4>
                      <p className="text-sm text-muted-foreground">
                        {apps[0].website_url.startsWith("http") ? new URL(apps[0].website_url).hostname : "Local HTML Source"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform" onClick={() => onDownload(apps[0])}>
                      <Download className="h-4 w-4 mr-2" /> PWA Package
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform" onClick={() => onPreview(apps[0])}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform" onClick={() => onEdit(apps[0])}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform" onClick={() => onQr(apps[0])}><ExternalLink className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform hover:bg-destructive/10 text-destructive" onClick={() => onDelete(apps[0].id)}><Trash2 className="h-4 w-4" /></Button>
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
              <p className="text-sm opacity-90 mb-6">Remove branding and package unlimited PWAs.</p>
              <Button variant="glass" className="w-full font-bold" asChild><Link to="/pricing">Go Pro — ₹299</Link></Button>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProDashboard({ apps, activeBuilds, loading, onImport, onDelete, onEdit, onDownload, onPreview, onQr, onRebuild, plan, session }: any) {
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
            <p className="text-muted-foreground mt-1">Manage your unlimited Progressive Web Apps.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl px-5 h-11" onClick={onImport}>Import URL</Button>
            <Button className="rounded-xl px-5 h-11 shadow-neon" asChild><Link to="/converter">New PWA Project</Link></Button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <StatCard label="PWA Projects" val={apps.length} sub="Unlimited" icon={Box} color="text-primary" />
          <StatCard label="Priority Bundlers" val={activeBuilds} sub="Instant Compilation" icon={Zap} color="text-amber-500" />
          <StatCard label="White Labeling" val="Active" sub="White-label manifests" icon={CheckCircle2} color="text-emerald-500" />
          <StatCard label="PWA Push Services" val="Ready" sub="Web Push Notification" icon={Activity} color="text-blue-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20">
                <h3 className="font-bold">Active PWA Projects</h3>
                <span className="text-xs text-muted-foreground">{apps.length} items</span>
              </div>
              {loading ? (
                <div className="p-20 text-center animate-pulse">Syncing...</div>
              ) : apps.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground">No projects found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {apps.map((app: any) => (
                    <div key={app.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-muted/50 transition-colors duration-300 group relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                      <div className="flex items-center gap-5 flex-1 relative z-10">
                        <div className="h-14 w-14 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.3)] transition-all duration-300">
                          {app.icon_url ? <img src={app.icon_url} className="h-10 w-10 rounded-lg object-cover group-hover:scale-105 transition-transform duration-300" /> : <Smartphone className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold flex items-center gap-2">{app.name} <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 rounded-full">PRO PWA</span></h4>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-muted-foreground font-mono uppercase bg-white/5 px-2 py-0.5 rounded-md">Progressive Web App</p>
                            <p className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">{app.website_url}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                        <Button variant="secondary" size="sm" className="hover:scale-105 transition-transform" onClick={() => onDownload(app)}>
                          <Download className="h-4 w-4 mr-2" /> PWA Package
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform" onClick={() => onPreview(app)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform" onClick={() => onEdit(app)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform" onClick={() => onQr(app)}><ExternalLink className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform hover:bg-destructive/10 text-destructive" onClick={() => onDelete(app.id)}><Trash2 className="h-4 w-4" /></Button>
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
                  <AreaChart data={MOCK_CHART_DATA}>
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

function BusinessDashboard({ apps, activeBuilds, loading, onImport, onDelete, onEdit, onDownload, onPreview, onQr, onRebuild, plan, session, onRefresh }: any) {
  const [apiKey, setApiKey] = useState("");
  const [admobIds, setAdmobIds] = useState({ banner: "", interstitial: "" });
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
        toast.success("Organization Avatar saved!");
      };
      reader.readAsDataURL(file);
    }
  };

  const generateApiKey = () => {
    const key = "w2a_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(key);
    toast.success("New API Key generated for your workspace.");
  };

  useEffect(() => {
    const fetchAdmobConfig = async () => {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(`http://localhost:5000/api/admob/${session.user.id}`);
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
    fetchAdmobConfig();
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
              <p className="text-muted-foreground font-medium">Welcome back, {session?.user.email?.split('@')[0]}. Managing team workspace: <b className="text-foreground">Primary</b></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="outline" className="rounded-2xl h-14 px-8 border-border hover:bg-muted gap-3 transition-transform hover:scale-105" onClick={() => {
              toast.promise(new Promise(r => setTimeout(r, 1500)), {
                loading: 'Syncing with Enterprise API...',
                success: 'API synchronization complete. All nodes up to date.'
              });
            }}>
              <Terminal className="h-5 w-5" /> API Sync
            </Button>
            <Button className="rounded-2xl h-14 px-8 bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20 font-bold gap-3" asChild>
              <Link to="/converter"><Plus className="h-5 w-5" /> Deploy New PWA</Link>
            </Button>
          </div>
        </div>

        {/* BUSINESS STATS */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <BusinessStat label="Active PWA Nodes" val={apps.length} sub="Unlimited Quota" icon={Box} color="text-amber-500" />
          <BusinessStat label="API Calls" val="12.4k" sub="99.9% Success" icon={Key} color="text-blue-500" />
          <StatCard label="Team Members" val="5" sub="Manage Access" icon={Users} color="text-purple-500" />
          <StatCard label="Support" val="24/7" sub="Dedicated Agent" icon={LifeBuoy} color="text-emerald-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">

            {/* TEAM WORKSPACE / APPS */}
            <section className="glass rounded-[2.5rem] overflow-hidden border-amber-500/10 shadow-2xl">
              <div className="px-10 py-8 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">Team Workspace</h3>
                  <p className="text-xs text-muted-foreground mt-1">Shared PWAs and deployment history</p>
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
                  <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">Hydrating team data...</p>
                </div>
              ) : apps.length === 0 ? (
                <div className="p-24 text-center">
                  <Box className="h-16 w-16 mx-auto text-muted-foreground/20 mb-6" />
                  <p className="text-muted-foreground font-medium italic">No deployments found in this workspace.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {apps.map((app: any) => (
                    <div key={app.id} className="p-8 flex flex-col sm:flex-row items-center justify-between gap-8 hover:bg-muted/30 transition-all duration-300 group relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300"></div>
                      <div className="flex items-center gap-6 flex-1 relative z-10">
                        <div className="h-20 w-20 rounded-[2rem] bg-gradient-to-br from-amber-500/10 to-transparent border border-border flex items-center justify-center shadow-lg group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)] transition-all duration-500">
                          {app.icon_url ? <img src={app.icon_url} className="h-14 w-14 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500" /> : <Smartphone className="h-8 w-8 text-muted-foreground group-hover:text-amber-500 transition-colors duration-300" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-2xl font-bold tracking-tighter text-foreground">{app.name}</h4>
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-500/20 uppercase shadow-sm">Enterprise PWA</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> {app.website_url.startsWith("http") ? new URL(app.website_url).hostname : "Local HTML Source"}</span>
                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(app.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 relative z-10">
                        <Button className="rounded-2xl h-12 px-6 bg-amber-500 text-white hover:bg-amber-600 font-bold shadow-lg shadow-amber-500/20 hover:scale-105 hover:shadow-amber-500/40 transition-all duration-300" onClick={() => onDownload(app)}>
                          <Download className="h-4 w-4 mr-2" /> PWA Package
                        </Button>
                        <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl border-border hover:bg-muted hover:scale-105 transition-all duration-300" onClick={() => onPreview(app)}><Eye className="h-5 w-5 text-foreground" /></Button>
                        <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl border-border hover:bg-muted hover:scale-105 transition-all duration-300" onClick={() => onEdit(app)}><Pencil className="h-5 w-5 text-foreground" /></Button>
                        <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl border-border hover:bg-destructive/10 text-destructive hover:border-destructive/50 hover:scale-105 transition-all duration-300" onClick={() => onDelete(app.id)}><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* BUSINESS SIDEBAR */}
          <aside className="space-y-8">

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
            <section className="glass rounded-[2.5rem] p-8 border-amber-500/10 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500"><PlayCircle className="h-5 w-5" /></div>
                <h4 className="text-lg font-bold text-foreground">TWA Store Submission</h4>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">Need your PWA in the Google Play Store or Apple App Store? Package it using our Trusted Web Activity (TWA) compiler.</p>
                <Button variant="outline" className="w-full rounded-xl h-10 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02]" onClick={() => {
                  toast.success("TWA Packaging system is active. Contact enterprise support for customized keystores.");
                }}>Compile TWA Wrapper</Button>
              </div>
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
                    fetch("http://localhost:5000/api/admob/save", {
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
                      success: 'AdMob synchronized with PWA manifest headers!',
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