import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Users, 
  Package, 
  Activity, 
  ShieldOff, 
  Trash2, 
  Settings, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Database, 
  BarChart3,
  ExternalLink,
  RefreshCw,
  Crown
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthGuard, useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — AppOrbit" }, { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" }] }),
  component: AdminPage,
});

function AdminPage() {
  const session = useAuthGuard();
  const isAdmin = useIsAdmin(session?.user.id);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [builds, setBuilds] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, bRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("apps").select("*").order("created_at", { ascending: false }),
        supabase.from("builds").select("*").order("started_at", { ascending: false }).limit(100),
      ]);

      if (pRes.error) throw pRes.error;
      if (aRes.error) throw aRes.error;
      if (bRes.error) throw bRes.error;

      setProfiles(pRes.data || []);
      setApps(aRes.data || []);
      setBuilds(bRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load admin data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const updatePlan = async (userId: string, newPlan: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan })
      .eq("id", userId);
    
    if (error) toast.error(error.message);
    else {
      toast.success(`Plan updated to ${newPlan}`);
      fetchData();
    }
  };

  const deleteApp = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this app globally?")) return;
    const { error } = await supabase.from("apps").delete().eq("id", appId);
    if (error) toast.error(error.message);
    else {
      toast.success("App deleted successfully");
      fetchData();
    }
  };

  if (!session) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-md px-4 py-32 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass rounded-[2rem] p-10 neon-glow"
          >
            <ShieldOff className="h-16 w-16 mx-auto text-destructive mb-6" />
            <h1 className="text-3xl font-display font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-8">
              This terminal is reserved for stufflas administrators. 
              Please contact the company if you believe this is an error.
            </p>
            <Button variant="hero" size="lg" className="w-full" asChild>
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = profiles.reduce((acc, p) => {
    if (p.plan === "pro") return acc + 19;
    if (p.plan === "business") return acc + 49;
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest mb-2">
              <ShieldOff className="h-3 w-3" /> System Administrator
            </div>
            <h1 className="text-4xl font-display font-bold">Admin Console</h1>
            <p className="text-muted-foreground mt-1">Manage users, apps, and system infrastructure.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Data
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/converter">System Build</Link>
            </Button>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          <AdminStat 
            icon={Users} 
            label="Total Users" 
            value={profiles.length} 
            trend="+12% this week"
            color="text-blue-500"
          />
          <AdminStat 
            icon={Package} 
            label="Total Apps" 
            value={apps.length} 
            trend={`${apps.filter(a => a.status === 'ready').length} active`}
            color="text-emerald-500"
          />
          <AdminStat 
            icon={BarChart3} 
            label="Est. Revenue" 
            value={`$${totalRevenue}`} 
            trend="Monthly Recurring"
            color="text-amber-500"
          />
          <AdminStat 
            icon={Database} 
            label="Cloud Builds" 
            value={builds.length} 
            trend={`${builds.filter(b => b.status === 'running').length} in progress`}
            color="text-primary"
          />
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass p-2 rounded-2xl">
            <TabsList className="bg-transparent h-auto p-0 gap-1">
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl px-6 py-2.5">Users</TabsTrigger>
              <TabsTrigger value="apps" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl px-6 py-2.5">Applications</TabsTrigger>
              <TabsTrigger value="builds" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl px-6 py-2.5">Build Log</TabsTrigger>
            </TabsList>
            
            <div className="relative w-full sm:w-64 px-2">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-10 h-10 bg-foreground/[0.05] border border-border/40 rounded-xl" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="glass rounded-[2rem] overflow-hidden border-border/40">
              <Table>
                <TableHeader className="bg-foreground/[0.03]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Current Plan</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((p) => (
                    <TableRow key={p.id} className="hover:bg-foreground/[0.02] transition-colors border-border/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {p.display_name?.slice(0, 2).toUpperCase() || "??"}
                          </div>
                          <span className="font-semibold">{p.display_name || "Anonymous"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.plan === 'business' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/20' :
                          p.plan === 'pro' ? 'bg-primary/20 text-primary border border-primary/20' :
                          'bg-muted text-muted-foreground border border-border/40'
                        }`}>
                          {p.plan}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-border/40">
                            <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem onClick={() => updatePlan(p.id, "free")}>Set Free Plan</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePlan(p.id, "pro")}>Set Pro Plan</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePlan(p.id, "business")}>Set Business Plan</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border/40" />
                            <DropdownMenuItem className="text-destructive">Ban User</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProfiles.length === 0 && (
                <div className="p-20 text-center text-muted-foreground">No users found matching your search.</div>
              )}
            </div>
          </TabsContent>

          {/* APPS TAB */}
          <TabsContent value="apps">
            <div className="glass rounded-[2rem] overflow-hidden border-border/40">
              <Table>
                <TableHeader className="bg-foreground/[0.03]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Application</TableHead>
                    <TableHead>Owner ID</TableHead>
                    <TableHead>Website URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((a) => (
                    <TableRow key={a.id} className="hover:bg-foreground/[0.02] transition-colors border-border/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-foreground/[0.03] border border-border/40 flex items-center justify-center shrink-0">
                            {a.icon_url ? (
                              <img src={a.icon_url} className="h-8 w-8 rounded-md object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold">{a.name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-mono">{a.package_name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{a.user_id}</TableCell>
                      <TableCell>
                        <a href={a.website_url} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                          {new URL(a.website_url).hostname} <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          a.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'
                        }`}>
                          {a.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(a.apk_url, '_blank')}>
                            <Database className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteApp(a.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* BUILDS TAB */}
          <TabsContent value="builds">
            <div className="glass rounded-[2rem] overflow-hidden border-border/40">
              <Table>
                <TableHeader className="bg-foreground/[0.03]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Build ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Latest Log</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {builds.map((b) => (
                    <TableRow key={b.id} className="hover:bg-foreground/[0.02] transition-colors border-border/40">
                      <TableCell className="font-mono text-xs">{b.id.slice(0, 13)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            b.status === 'success' ? 'bg-emerald-500' :
                            b.status === 'running' ? 'bg-primary animate-pulse' :
                            'bg-destructive'
                          }`} />
                          <span className="text-xs capitalize">{b.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-foreground/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${b.progress}%` }} />
                          </div>
                          <span className="text-[10px] font-mono">{b.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                        {b.log || "Initialing..."}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(b.started_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

function AdminStat({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string | number; trend: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass rounded-2xl p-6 border-border/40 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`h-11 w-11 rounded-xl bg-foreground/[0.03] flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-[10px] font-bold text-emerald-500 flex items-center">
          {trend}
        </div>
      </div>
      <div className="text-3xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
    </motion.div>
  );
}
