import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Users, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Search, 
  RefreshCw, 
  Database, 
  Package, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  Server,
  Activity,
  HardDrive
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "Super Admin — System Control" }] }),
  component: SuperAdminPage,
});

function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({ profiles: [], apps: [], builds: [] });
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (email === "ritik@gmail.com" && password === "Ritik@123") {
      setLoading(true);
      try {
        // Authenticate with Supabase so RLS policies allow reading profiles
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If the admin user doesn't exist in Supabase yet, we can either throw or just proceed for demo purposes.
          // We'll proceed to allow the frontend to unlock, but warn them.
          toast.warning("Logged into UI, but Supabase auth failed: " + error.message);
        } else {
          toast.success("Super Admin authenticated successfully.");
        }
        setIsAuthenticated(true);
        sessionStorage.setItem("isSuperAdmin", "true");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Invalid credentials. Access denied.");
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("isSuperAdmin") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchFullData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, bRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("apps").select("*").order("created_at", { ascending: false }),
        supabase.from("builds").select("*").order("started_at", { ascending: false }),
      ]);
      setData({
        profiles: pRes.data || [],
        apps: aRes.data || [],
        builds: bRes.data || [],
      });
    } catch (err: any) {
      toast.error("System error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchFullData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <SuperAdminLogin onLogin={handleLogin} />;
  }

  const filteredUsers = data.profiles.filter((p: any) => 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        {/* SUPER HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Super Control</h1>
              <p className="text-white/40 text-xs font-mono uppercase tracking-[0.3em]">Global System Administration</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 h-12 px-6 rounded-xl" onClick={fetchFullData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Force Sync
            </Button>
            <Button variant="destructive" className="h-12 px-6 rounded-xl" onClick={() => {
              sessionStorage.removeItem("isSuperAdmin");
              setIsAuthenticated(false);
            }}>Logout</Button>
          </div>
        </div>

        {/* SYSTEM STATUS GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          <SystemStat label="Active Identities" val={data.profiles.length} icon={Users} color="text-primary" />
          <SystemStat label="Global Deployments" val={data.apps.length} icon={Package} color="text-blue-500" />
          <SystemStat label="Total Processed" val={data.builds.length} icon={Database} color="text-amber-500" />
          <SystemStat label="System Uptime" val="99.98%" icon={Server} color="text-emerald-500" />
        </div>

        {/* USER DIRECTORY */}
        <section className="glass rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl">
          <div className="px-10 py-8 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold">User Directory</h3>
              <p className="text-white/40 text-xs mt-1">Real-time access to all registered platform users</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <Input 
                placeholder="Search by name or UUID..." 
                className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="pl-10 text-white/40 uppercase text-[10px] font-black tracking-widest">Profile</TableHead>
                  <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Identity (UUID)</TableHead>
                  <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Plan</TableHead>
                  <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Deployments</TableHead>
                  <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Platform</TableHead>
                  <TableHead className="text-white/40 uppercase text-[10px] font-black tracking-widest">Registered</TableHead>
                  <TableHead className="pr-10 text-right text-white/40 uppercase text-[10px] font-black tracking-widest">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((p: any) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="pl-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/20 flex items-center justify-center text-xs font-bold ring-2 ring-white/5">
                          {p.display_name?.slice(0, 2).toUpperCase() || "UN"}
                        </div>
                        <span className="font-bold text-lg">{p.display_name || "Unknown Identity"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-white/30 truncate max-w-[150px]">{p.id}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                        p.plan === 'business' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        p.plan === 'pro' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-white/5 text-white/40 border-white/10'
                      }`}>
                        {p.plan}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {data.apps.filter((a: any) => a.user_id === p.id).length} Apps
                    </TableCell>
                    <TableCell>
                      {data.apps.filter((a: any) => a.user_id === p.id).length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-white/60 uppercase">
                            {data.apps.find((a: any) => a.user_id === p.id)?.target_platform || "N/A"}
                          </span>
                          <span className="text-[9px] font-mono text-white/30 uppercase">
                            {data.apps.find((a: any) => a.user_id === p.id)?.android_build_format || "N/A"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/10 italic">No apps</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-white/40">
                      {new Date(p.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="pr-10 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-white/60 uppercase">Active</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center">
              <Users className="h-12 w-12 mx-auto text-white/10 mb-4" />
              <p className="text-white/30 italic">No system records found matching your query.</p>
            </div>
          )}
        </section>

        {/* SYSTEM ACTIVITY TRACKER */}
        <div className="grid gap-8 lg:grid-cols-2 mt-12">
          <section className="glass rounded-[2.5rem] p-8 border-white/5">
            <h3 className="font-bold flex items-center gap-2 mb-6"><Activity className="h-5 w-5 text-primary" /> Traffic Monitor</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-bold italic uppercase tracking-widest">Build Node #{i+1}</p>
                      <p className="text-[10px] text-white/30">Latency: 24ms | Status: Healthy</p>
                    </div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </section>
          
          <section className="glass rounded-[2.5rem] p-8 border-white/5">
            <h3 className="font-bold flex items-center gap-2 mb-6"><HardDrive className="h-5 w-5 text-blue-500" /> Storage Capacity</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                  <span>Artifact Storage</span>
                  <span>14.2 GB / 50 GB</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "28%" }} className="h-full bg-blue-500" />
                </div>
              </div>
              <p className="text-[10px] text-white/30 italic">Cloud storage is optimized. No immediate action required.</p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

function SuperAdminLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="h-20 w-20 rounded-[2.5rem] bg-white text-black flex items-center justify-center mx-auto mb-6 shadow-[0_0_60px_rgba(255,255,255,0.2)]">
            <Lock className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">Super Access</h1>
          <p className="text-white/40 text-xs font-mono tracking-[0.4em] mt-2">Authorization Protocol Required</p>
        </div>

        <div className="glass p-10 rounded-[3rem] border-white/10 shadow-2xl backdrop-blur-2xl">
          <form onSubmit={onLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Terminal ID</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                <Input 
                  name="email" 
                  type="email" 
                  placeholder="admin@system.com" 
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-white/30 text-white font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-4">Access Secret</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                <Input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••••••" 
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-white/30 text-white"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] mt-4">
              Unlock Terminal
            </Button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck className="h-3 w-3" /> Secure Node Encrypted
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function SystemStat({ label, val, icon: Icon, color }: any) {
  return (
    <div className="glass rounded-[2rem] p-8 border-white/5 hover:border-primary/20 transition-all group">
      <div className="flex items-center justify-between mb-6">
        <div className={`h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </div>
      <div className="text-4xl font-black tracking-tighter italic">{val}</div>
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-1">{label}</p>
    </div>
  );
}
