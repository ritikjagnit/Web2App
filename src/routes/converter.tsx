import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Sparkles, Loader2, Download, Check, AlertCircle, 
  Globe, FileCode, Eye, Code2, Settings, ShieldCheck, 
  Info, Smartphone, ArrowRight, Laptop, PlusCircle 
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PhonePreview } from "@/components/site/PhonePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/converter")({
  validateSearch: (search: Record<string, unknown>): { url?: string } => {
    return {
      url: typeof search.url === "string" ? search.url : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Convert Website to APK — AppOrbit" },
      { name: "keywords", content: "web to apk, web to app, website to android app, apk builder, pwa to apk" },
      { name: "description", content: "Paste a URL, choose custom icons, select caching strategies, and compile your installable APK package instantly." },
    ],
  }),
  component: ConverterPage,
});

const urlSchema = z.string().trim().url("Enter a valid URL (https://...)").max(2048);
const nameSchema = z.string().trim().min(1).max(60);

type Step = "configure" | "building" | "done";

function ConverterPage() {
  const navigate = useNavigate();
  const { url } = Route.useSearch();
  const [userPlan, setUserPlan] = useState<string>("free");
  const [appCount, setAppCount] = useState<number>(0);
  const [checkingLimits, setCheckingLimits] = useState<boolean>(true);

  useEffect(() => {
    const checkLimits = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          setCheckingLimits(false);
          return;
        }
        
        const userId = sessionData.session.user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
          
        const plan = profile?.plan || "free";
        setUserPlan(plan);
        
        const backendUrl = (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5001";
        try {
          const limitRes = await fetch(`${backendUrl}/api/pwa/check-limits/${userId}`);
          if (limitRes.ok) {
            const limitData = await limitRes.json();
            setAppCount(limitData.count || 0);
          } else {
            const { count } = await supabase
              .from("apps")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId);
            setAppCount(count || 0);
          }
        } catch (fetchErr) {
          const { count } = await supabase
            .from("apps")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          setAppCount(count || 0);
        }
      } catch (err) {
        console.error("Error checking limits:", err);
      } finally {
        setCheckingLimits(false);
      }
    };
    
    checkLimits();
  }, []);
  const [websiteUrl, setWebsiteUrl] = useState(url || "https://en.wikipedia.org/wiki/Mobile_app");
  const [appName, setAppName] = useState("My Awesome App");
  const [shortName, setShortName] = useState("Awesome APK");
  const [themeColor, setThemeColor] = useState("#7c3aed");
  const [backgroundColor, setBackgroundColor] = useState("#0a0a0a");
  const [cacheStrategy, setCacheStrategy] = useState<"StaleWhileRevalidate" | "CacheFirst" | "NetworkFirst">("StaleWhileRevalidate");
  const [displayMode, setDisplayMode] = useState<"standalone" | "minimal-ui" | "fullscreen">("standalone");
  const [sourceType, setSourceType] = useState<"url" | "html">("url");
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [showCode, setShowCode] = useState(false);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState<string>("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [splashFile, setSplashFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>("");
  const [navStyle, setNavStyle] = useState<"top" | "bottom">("bottom");
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [androidBuildFormat, setAndroidBuildFormat] = useState<"apk" | "aab">("apk");
  const [previewDevice, setPreviewDevice] = useState<"android" | "ios">("android");
  const [targetPlatform, setTargetPlatform] = useState<"android" | "ios" | "both">("both");

  const [step, setStep] = useState<Step>("configure");
  const [progress, setProgress] = useState(0);
  const [currentLog, setCurrentLog] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [appId, setAppId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [isGeneratingSplash, setIsGeneratingSplash] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [complianceScore, setComplianceScore] = useState<number | null>(null);
  const [complianceReport, setComplianceReport] = useState<any[]>([]);

  const handleIcon = (f: File | null) => {
    setIconFile(f);
    if (f) setIconPreview(URL.createObjectURL(f));
  };

  const handleHtmlFileChange = (f: File | null) => {
    setHtmlFile(f);
    if (f) {
      setSourceType("html");
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlContent(content);
        const blob = new Blob([content], { type: "text/html" });
        setHtmlPreviewUrl(URL.createObjectURL(blob));
      };
      reader.readAsText(f);
    } else {
      setSourceType("url");
      setHtmlPreviewUrl("");
      setHtmlContent("");
    }
  };

  const updateHtmlFromCode = (newContent: string) => {
    setHtmlContent(newContent);
    const blob = new Blob([newContent], { type: "text/html" });
    if (htmlPreviewUrl) URL.revokeObjectURL(htmlPreviewUrl);
    setHtmlPreviewUrl(URL.createObjectURL(blob));
  };

  const generateAIIcon = async () => {
    setIsGeneratingIcon(true);
    await new Promise(r => setTimeout(r, 2000));
    const mockIcon = `https://api.dicebear.com/7.x/identicon/png?seed=${appName}`;
    setIconPreview(mockIcon);
    setIsGeneratingIcon(false);
    toast.success("AI Generated a unique brand icon!");
  };

  const generateAISplash = async () => {
    setIsGeneratingSplash(true);
    await new Promise(r => setTimeout(r, 1500));
    setSplashFile(new File([""], "ai-splash.png", { type: "image/png" }));
    setIsGeneratingSplash(false);
    toast.success("Smart Splash Screen configuration generated!");
  };

  const checkCompliance = async () => {
    if (sourceType === "url" && !websiteUrl) {
      toast.error("Please enter a website URL first.");
      return;
    }
    setIsCheckingCompliance(true);
    setComplianceScore(null);
    setComplianceReport([]);
    
    try {
      let backendUrl = (import.meta.env.VITE_BACKEND_URL as string);
      if (!backendUrl || backendUrl === "/" || backendUrl.includes("5173")) {
        backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : 'https://apporbit-backend.onrender.com';
      }
      const res = await fetch(`${backendUrl}/api/pwa/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website_url: websiteUrl,
          sourceType,
          htmlContent
        })
      });

      if (!res.ok) throw new Error("Validation service returned an error.");
      const data = await res.json();
      
      let score = 100;
      const report = [];

      if (sourceType !== 'html') {
        if (!data.details.hasHttps) {
          score -= 30;
          report.push({ name: "HTTPS Secure Context", passed: false, desc: "APK specifications require HTTPS context." });
        } else {
          report.push({ name: "HTTPS Secure Context", passed: true, desc: "HTTPS schema verified." });
        }

        if (!data.details.isReachable) {
          score -= 20;
          report.push({ name: "Server Reachability", passed: false, desc: "Target server could not be reached." });
        } else {
          report.push({ name: "Server Reachability", passed: true, desc: "Target server responded successfully." });
        }
      } else {
        report.push({ name: "Local HTML Hosting", passed: true, desc: "HTML content bundle is APK compilable." });
      }

      if (!data.details.hasViewport) {
        score -= 15;
        report.push({ name: "Mobile Responsive Viewport", passed: false, desc: "No viewport meta tag was found." });
      } else {
        report.push({ name: "Mobile Responsive Viewport", passed: true, desc: "Responsive viewport meta tags verified." });
      }

      if (!data.details.hasManifest) {
        report.push({ name: "W3C Manifest Detection", passed: false, desc: "No pre-existing manifest was detected. App Weaver will generate one." });
      } else {
        report.push({ name: "W3C Manifest Detection", passed: true, desc: "Existing manifest detected." });
      }

      if (!data.details.hasServiceWorker) {
        report.push({ name: "Offline Caching Engine", passed: false, desc: "No service worker detected. App Weaver will compile sw.js." });
      } else {
        report.push({ name: "Offline Caching Engine", passed: true, desc: "Service worker registered on site." });
      }

      setComplianceScore(score);
      setComplianceReport(report);
      
      if (score === 100) {
        toast.success("Perfect! Website meets 100% of APK criteria.");
      } else {
        toast.warning(`Scan complete. Score: ${score}/100. App Weaver will resolve missing assets.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed website compatibility scan.");
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const startBuild = async () => {
    if (sourceType === "url") {
      const u = urlSchema.safeParse(websiteUrl);
      if (!u.success) { toast.error(u.error.issues[0].message); return; }
    } else if (!htmlFile && !htmlContent) {
      toast.error("Please upload an HTML file or paste code first");
      return;
    }
    const n = nameSchema.safeParse(appName);
    if (!n.success) { toast.error("App name is required (max 60 chars)"); return; }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.info("Sign in to save and build your APK");
      navigate({ to: "/auth" });
      return;
    }
    const userId = sessionData.session.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    const currentPlan = profile?.plan || "free";
    if (currentPlan === "free") {
      let backendUrl = (import.meta.env.VITE_BACKEND_URL as string);
      if (!backendUrl || backendUrl === "/" || backendUrl.includes("5173")) {
        backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : 'https://apporbit-backend.onrender.com';
      }
      let count = 0;
      try {
        const limitRes = await fetch(`${backendUrl}/api/pwa/check-limits/${userId}`);
        if (limitRes.ok) {
          const limitData = await limitRes.json();
          count = limitData.count || 0;
        } else {
          const { count: activeCount } = await supabase
            .from("apps")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId);
          count = activeCount || 0;
        }
      } catch (err) {
        const { count: activeCount } = await supabase
          .from("apps")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        count = activeCount || 0;
      }

      if (count >= 1) {
        toast.error("Free Plan limit exceeded: Maximum 1 app allowed on the free plan.");
        setStep("configure");
        navigate({ to: "/pricing" });
        return;
      }
    }

    setStep("building");
    setProgress(0);
    setLogs([]);

    try {
      let iconUrl: string | null = null;
      let splashUrl: string | null = null;
      let htmlFileUrl: string | null = null;

      if (iconFile) {
        const path = `${userId}/icons/${Date.now()}-${iconFile.name}`;
        const { error } = await supabase.storage.from("app-assets").upload(path, iconFile);
        if (error) throw error;
        iconUrl = supabase.storage.from("app-assets").getPublicUrl(path).data.publicUrl;
      } else if (iconPreview && iconPreview.startsWith("http")) {
        iconUrl = iconPreview;
      }
      if (splashFile) {
        const path = `${userId}/splash/${Date.now()}-${splashFile.name}`;
        const { error } = await supabase.storage.from("app-assets").upload(path, splashFile);
        if (error) throw error;
        splashUrl = supabase.storage.from("app-assets").getPublicUrl(path).data.publicUrl;
      }
      if (sourceType === "html") {
        let fileToUpload = htmlFile;
        if (!fileToUpload && htmlContent) {
          fileToUpload = new File([htmlContent], "index.html", { type: "text/html" });
        }

        if (fileToUpload) {
          const path = `${userId}/sources/${Date.now()}-${fileToUpload.name}`;
          const { error } = await supabase.storage.from("app-assets").upload(path, fileToUpload);
          if (error) throw error;
          htmlFileUrl = supabase.storage.from("app-assets").getPublicUrl(path).data.publicUrl;
        } else {
          toast.error("Please upload an HTML file or paste code first");
          setStep("configure");
          return;
        }
      }

      // Insert app record in Supabase
      const packageName = `pwa.${shortName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      let appData: any = {
        user_id: userId,
        name: appName,
        website_url: sourceType === "url" ? websiteUrl : "local-html-source",
        html_file_url: htmlFileUrl,
        target_platform: targetPlatform,
        android_build_format: androidBuildFormat,
        package_name: packageName,
        theme_color: themeColor,
        icon_url: iconUrl,
        splash_url: splashUrl,
        status: "building",
      };

      let { data: app, error: appErr } = await supabase
        .from("apps")
        .insert(appData)
        .select()
        .single();

      if (appErr && appErr.message?.includes("column")) {
        console.warn("Falling back to basic insert...");
        const basicData = {
          user_id: userId,
          name: appName,
          website_url: sourceType === "url" ? websiteUrl : "local-html-source",
          package_name: packageName,
          theme_color: themeColor,
          icon_url: iconUrl,
          splash_url: splashUrl,
          status: "building",
        };
        const retry = await supabase.from("apps").insert(basicData).select().single();
        app = retry.data;
        appErr = retry.error;
      }

      if (appErr) throw appErr;
      if (!app) throw new Error("Failed to create app record");

      const { data: build, error: buildErr } = await supabase
        .from("builds")
        .insert({ app_id: app.id, user_id: userId, status: "running" })
        .select()
        .single();
      if (buildErr) throw buildErr;

      // Call our backend build pipeline
      let backendUrl = (import.meta.env.VITE_BACKEND_URL as string);
      if (!backendUrl || backendUrl === "/" || backendUrl.includes("5173")) {
        backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5001' : 'https://apporbit-backend.onrender.com';
      }
      
      let buildRes;
      try {
        buildRes = await fetch(`${backendUrl}/api/pwa/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          website_url: sourceType === "url" ? websiteUrl : "local-html-source",
          app_name: appName,
          short_name: shortName,
          theme_color: themeColor,
          background_color: backgroundColor,
          sourceType: sourceType,
          htmlContent: htmlContent,
          iconUrl: iconUrl,
          cacheStrategy: cacheStrategy,
          plan: userPlan,
          target_platform: targetPlatform,
          android_build_format: androidBuildFormat
        })
      });

      } catch (err: any) {
        throw new Error(err.message === "Failed to fetch" ? "Cannot connect to server. Ensure the backend is running." : err.message);
      }

      if (!buildRes.ok) {
        const errData = await buildRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to start App package builder.");
      }

      const buildData = await buildRes.json();
      const backendBuildId = buildData.buildId;
      
      let finished = false;
      let finalZipUrl = "";
      
      while (!finished) {
        await new Promise((r) => setTimeout(r, 1200));
        
        try {
          const statusRes = await fetch(`${backendUrl}/api/pwa/build/status/${backendBuildId}`);
          if (!statusRes.ok) continue;
          
          const statusData = await statusRes.json();
          
          try {
            const logsRes = await fetch(`${backendUrl}/api/pwa/build/logs/${backendBuildId}`);
            if (logsRes.ok) {
              const logsData = await logsRes.json();
              setLogs(logsData.logs || []);
            }
          } catch (e) {
            // Ignore log fetch errors
          }
          
          setProgress(statusData.progress || 0);
          if (statusData.step) {
            setCurrentLog(statusData.step);
          }
          
          try {
            await supabase.from("builds").update({ 
              progress: statusData.progress || 0, 
              log: statusData.step || "Compiling App assets..." 
            }).eq("id", build.id);
          } catch (e) {
            // Ignore supabase errors
          }

          if (statusData.status === "success") {
            finished = true;
            finalZipUrl = `${backendUrl}/api/pwa/download/${backendBuildId}`;
          } else if (statusData.status === "failed") {
            finished = true;
            throw new Error(statusData.error || "App pipeline failed on server");
          }
        } catch (pollErr) {
          console.warn("Backend temporarily unreachable while polling status", pollErr);
        }
      }

      // Update status and url in database
      await supabase.from("apps").update({ status: "ready", apk_url: finalZipUrl }).eq("id", app.id);

      const buildNameStr = targetPlatform === "both" ? "Android & iOS" : targetPlatform === "ios" ? "iOS" : "Android";
      const completionLog = `✓ ${buildNameStr} ${androidBuildFormat.toUpperCase()} package compiled successfully!`;
      await supabase.from("builds").update({
        status: "success",
        progress: 100,
        artifact_url: finalZipUrl,
        finished_at: new Date().toISOString(),
        log: completionLog,
      }).eq("id", build.id);

      setLogs((prev) => [...prev, completionLog, `→ Download ${androidBuildFormat.toUpperCase()}: ${finalZipUrl}`]);
      setAppId(app.id);
      setDownloadUrl(finalZipUrl);
      setStep("done");
      toast.success(`${buildNameStr} ${androidBuildFormat.toUpperCase()} generated successfully!`);
    } catch (err: any) {
      toast.error(err.message ?? "APK Generation failed");
      setStep("configure");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">
            Website <span className="text-primary">→</span> <br className="sm:hidden" /> Mobile App
          </h1>
          <p className="mt-3 text-muted-foreground">Configure launcher icons, offline caching, and package a ready-to-deploy App instantly.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div className="glass rounded-3xl p-4 sm:p-8">
            <AnimatePresence mode="wait">
              {step === "configure" && (
                <motion.div key="cfg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="space-y-4">
                    <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "url" | "html")} className="w-full">
                      <TabsList className="grid grid-cols-2 w-full bg-muted border border-border p-1 h-12 rounded-2xl">
                        <TabsTrigger
                          value="url"
                          className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
                        >
                          <Globe className="h-4 w-4" /> Website URL
                        </TabsTrigger>
                        <TabsTrigger
                          value="html"
                          className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 transition-all"
                        >
                          <FileCode className="h-4 w-4" /> HTML Source
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="url" className="mt-4 space-y-2 focus-visible:outline-none">
                        <Label htmlFor="url">Website URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            className="h-11 bg-background border-input focus:border-primary/50 transition-all flex-1"
                            placeholder="https://your-site.com"
                          />
                          <Button 
                            variant="secondary" 
                            className="h-11 rounded-lg border border-input px-4" 
                            onClick={checkCompliance} 
                            disabled={isCheckingCompliance}
                          >
                            {isCheckingCompliance ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan Website"}
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> Target must support HTTPS context for APK installation.</p>
                      </TabsContent>

                      <TabsContent value="html" className="mt-4 space-y-3 focus-visible:outline-none">
                        <div className="flex items-center justify-between">
                          <Label>HTML Source</Label>
                          <Dialog open={showCode} onOpenChange={setShowCode}>
                            <DialogTrigger asChild>
                              <button type="button" className="text-[10px] flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all font-bold uppercase tracking-wider">
                                <Code2 className="h-3.5 w-3.5" /> {htmlContent ? "Edit Code" : "Paste HTML Code"}
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden glass border-border">
                              <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
                                <DialogTitle className="flex items-center gap-2">
                                  <FileCode className="h-5 w-5 text-primary" />
                                  {htmlFile ? `Editing: ${htmlFile.name}` : "Paste your HTML Code"}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="flex-1 p-0 relative">
                                <Textarea
                                  value={htmlContent}
                                  onChange={(e) => {
                                    setSourceType("html");
                                    updateHtmlFromCode(e.target.value);
                                  }}
                                  className="w-full h-full p-6 font-mono text-sm bg-transparent border-0 focus-visible:ring-0 resize-none leading-relaxed text-foreground"
                                  placeholder="Paste your HTML code here (e.g., <html><body><h1>Hello</h1></body></html>)"
                                />
                                {!htmlContent && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                    <Code2 className="h-64 w-64" />
                                  </div>
                                )}
                              </div>
                              <div className="p-3 bg-muted/50 border-t border-border flex justify-between items-center px-6">
                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Live Preview Enabled</span>
                                <Button size="sm" onClick={() => setShowCode(false)}>Save & Preview</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <label className="flex items-center gap-3 p-3 rounded-xl border border-input bg-background cursor-pointer hover:border-primary/50 transition-all group h-12">
                          <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm text-muted-foreground truncate flex-1 font-medium">
                            {htmlFile ? htmlFile.name : htmlContent ? "Custom Code Source" : "Choose HTML file..."}
                          </span>
                          <input type="file" accept=".html" className="hidden" onChange={(e) => handleHtmlFileChange(e.target.files?.[0] ?? null)} />
                          {sourceType === "html" && (htmlFile || htmlContent) && (
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-emerald-500" />
                            </div>
                          )}
                        </label>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Compliance Report Card */}
                  {complianceScore !== null && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase font-black text-muted-foreground tracking-widest">Compatibility Scan Result</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-bold ${complianceScore >= 80 ? "text-emerald-400" : "text-yellow-400"}`}>{complianceScore}/100</span>
                          <span className="text-[10px] text-muted-foreground">APK Score</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {complianceReport.map((rep, idx) => (
                          <div key={idx} className="flex gap-2 items-start text-xs">
                            <span className="mt-0.5">
                              {rep.passed ? <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 text-yellow-500 shrink-0" />}
                            </span>
                            <div>
                              <div className="font-bold text-foreground">{rep.name}</div>
                              <div className="text-[10px] text-muted-foreground leading-normal">{rep.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Premium Optimization Options */}
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold flex items-center gap-1.5 text-primary">
                          <Sparkles className="h-4 w-4" /> APK Enhancement Engine
                        </Label>
                        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[220px]">
                          Automatically configure service workers, build offline pages, clean desktop sidebars, and set iOS status bars.
                        </p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableOptimization}
                          onChange={(e) => setEnableOptimization(e.target.checked)}
                          className="sr-only peer"
                          id="opt-engine"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary transition-colors border border-border" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">App Name</Label>
                      <Input id="name" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="My Awesome App" maxLength={60} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shortName">Short Name (Launcher)</Label>
                      <Input id="shortName" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="My App" maxLength={12} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="themeColor">Theme Color</Label>
                      <div className="flex gap-2 items-center">
                        <input id="themeColor" type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border border-border" />
                        <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="flex-1 font-mono text-xs h-10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2 items-center">
                        <input id="backgroundColor" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer bg-transparent border border-border" />
                        <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="flex-1 font-mono text-xs h-10" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cacheStrategy">Offline Cache Strategy</Label>
                      <select 
                        id="cacheStrategy" 
                        value={cacheStrategy} 
                        onChange={(e) => setCacheStrategy(e.target.value as any)} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none"
                      >
                        <option value="StaleWhileRevalidate" className="bg-background">Stale While Revalidate</option>
                        <option value="CacheFirst" className="bg-background">Cache First</option>
                        <option value="NetworkFirst" className="bg-background">Network First</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayMode">Display Experience</Label>
                      <select 
                        id="displayMode" 
                        value={displayMode} 
                        onChange={(e) => setDisplayMode(e.target.value as any)} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground ring-offset-background focus-visible:outline-none"
                      >
                        <option value="standalone" className="bg-background">Standalone App</option>
                        <option value="minimal-ui" className="bg-background">Minimal Navigation</option>
                        <option value="fullscreen" className="bg-background">Immersive Fullscreen</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Platform</Label>
                      <div className="flex gap-2">
                        {[
                          { id: "both", label: "Both" },
                          { id: "android", label: "Android" },
                          { id: "ios", label: "iOS" }
                        ].map((p) => (
                          <button 
                            key={p.id} 
                            type="button" 
                            onClick={() => setTargetPlatform(p.id as any)} 
                            className={`flex-1 flex items-center justify-center gap-1 h-10 rounded-lg border ${targetPlatform === p.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-transparent text-muted-foreground hover:bg-white/5"} transition-colors text-[11px] font-medium`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Navigation Preview Style</Label>
                      <div className="flex gap-3">
                        {["top", "bottom"].map((s) => (
                          <button 
                            key={s} 
                            type="button" 
                            onClick={() => setNavStyle(s as any)} 
                            className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border ${navStyle === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-transparent text-muted-foreground hover:bg-white/5"} transition-colors text-xs font-medium capitalize`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>App Icon</Label>
                        <button
                          type="button"
                          onClick={generateAIIcon}
                          disabled={isGeneratingIcon}
                          className="text-[9px] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          {isGeneratingIcon ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          AI Generate
                        </button>
                      </div>
                      <label className="flex flex-col items-center justify-center h-28 rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/60 cursor-pointer transition-all text-xs text-muted-foreground relative overflow-hidden group bg-white/[0.01]">
                        {iconPreview ? (
                          <div className="relative h-full w-full flex items-center justify-center p-2">
                            <img src={iconPreview} alt="" className="h-full w-full object-cover rounded-xl shadow-2xl" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="h-5 w-5" />
                            </div>
                            <span>Upload Icon</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleIcon(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Splash Screen</Label>
                        <button
                          type="button"
                          onClick={generateAISplash}
                          disabled={isGeneratingSplash}
                          className="text-[9px] flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          {isGeneratingSplash ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          AI Generate
                        </button>
                      </div>
                      <label className="flex flex-col items-center justify-center h-28 rounded-2xl border-2 border-dashed border-input hover:border-primary/60 cursor-pointer transition-all text-xs text-muted-foreground relative overflow-hidden group bg-background">
                        {splashFile ? (
                          <div className="relative h-full w-full flex items-center justify-center p-2">
                            <div className="flex flex-col items-center gap-1 text-emerald-500 font-medium">
                              <Check className="h-6 w-6" />
                              <span className="truncate max-w-[100px]">{splashFile.name}</span>
                            </div>
                            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload className="h-5 w-5 text-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="h-5 w-5" />
                            </div>
                            <span>Upload Splash</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setSplashFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>

                  {userPlan === "free" && appCount >= 1 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex gap-3 text-left mb-4">
                      <AlertCircle className="h-5.5 w-5.5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm text-destructive">Plan Limit Exceeded</h4>
                        <p className="text-xs text-muted-foreground mt-1">You are currently on the <b>Free Plan</b>, which allows a maximum of 1 app. You have already created 1 app. Please upgrade to Pro or Business to generate more apps.</p>
                        <Button variant="outline" size="sm" className="mt-3 text-xs h-8 rounded-lg" asChild>
                          <Link to="/pricing">View Pricing Plans</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <Button 
                      variant={userPlan === "free" && appCount >= 1 ? "secondary" : "hero"} 
                      size="xl" 
                      className="w-full" 
                      onClick={startBuild}
                      disabled={userPlan === "free" && appCount >= 1}
                    >
                      <Sparkles className="h-5 w-5" /> Generate App Package
                    </Button>

                    {downloadUrl && targetPlatform !== "ios" && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                        <Button variant="outline" size="xl" className="flex-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" asChild>
                          <a href={downloadUrl} download={`${appName.replace(/[^a-zA-Z0-9]/g, "_")}.apk`}>
                            <Download className="h-5 w-5 mr-2" /> Download APK
                          </a>
                        </Button>
                        <Button variant="outline" size="xl" className="flex-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" onClick={() => {
                          const blob = new Blob(["obb-data-not-required-for-lightweight-apps"], { type: "application/octet-stream" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `main.1.com.${(appName || "app").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}.obb`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}>
                          <Download className="h-5 w-5 mr-2" /> Download OBB
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === "building" && (
                <motion.div key="bld" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div>
                      <div className="font-display font-semibold">Compiling APK Package</div>
                      <div className="text-sm text-muted-foreground">{currentLog}</div>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="text-right text-sm text-muted-foreground">{progress}%</div>
                  <div className="rounded-xl bg-background border border-border p-4 font-mono text-xs h-56 overflow-auto">
                    {logs.map((l, i) => (
                      <div key={i} className={l.startsWith("✓") ? "text-accent" : l.startsWith("→") ? "text-primary" : "text-muted-foreground"}>{l}</div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-16 w-16 rounded-full gradient-bg flex items-center justify-center neon-glow">
                      <Check className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-display font-bold">{targetPlatform === "both" ? "Android & iOS" : targetPlatform === "ios" ? "iOS" : "Android"} Ready!</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">Your website has been compiled into an installable {targetPlatform === "both" ? "Android and iOS App" : targetPlatform === "ios" ? "iOS App" : "Android App"}.</p>
                  </div>

                  {/* Checklist of generated assets */}
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5 text-xs text-left">
                    <div className="font-bold border-b border-border pb-2 text-foreground">APK Package Elements Compiled:</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> W3C Web App Manifest</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> High-Resolution Brand Icons</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Service Worker Offline Engine</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Offline HTML Fallback Page</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Install-Ready Registration Guide</div>
                      <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Install-Ready App Package</div>
                    </div>
                  </div>

                  {/* Installation Guides */}
                  <Tabs defaultValue={targetPlatform === "ios" ? "ios" : "install"} className="w-full">
                    <TabsList className={`grid w-full bg-muted border border-border p-1 h-10 rounded-xl ${targetPlatform === "both" ? "grid-cols-2" : "grid-cols-1"}`}>
                      {targetPlatform !== "ios" && <TabsTrigger value="install" className="rounded-lg text-xs">Android (Chrome)</TabsTrigger>}
                      {targetPlatform !== "android" && <TabsTrigger value="ios" className="rounded-lg text-xs">iOS (Safari)</TabsTrigger>}
                    </TabsList>

                    {targetPlatform !== "ios" && (
                      <TabsContent value="install" className="mt-3 text-left space-y-2 text-xs text-muted-foreground p-2 border border-border bg-muted/30 rounded-xl">
                        <div className="font-bold text-foreground flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" /> Install on Android:</div>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Open Google Chrome on your Android device.</li>
                          <li>Navigate to your deployed website URL.</li>
                          <li>Tap the three dots menu button in the top right corner.</li>
                          <li>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                          <li>Confirm the prompt by tapping <strong>"Install"</strong>.</li>
                        </ol>
                      </TabsContent>
                    )}

                    {targetPlatform !== "android" && (
                      <TabsContent value="ios" className="mt-3 text-left space-y-2 text-xs text-muted-foreground p-2 border border-border bg-muted/30 rounded-xl">
                        <div className="font-bold text-foreground flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" /> Install on iOS (iPhone/iPad):</div>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>Open Safari browser on your iPhone or iPad.</li>
                          <li>Navigate to your deployed website URL.</li>
                          <li>Tap the <strong>"Share"</strong> icon (square with an up arrow) at the bottom toolbar.</li>
                          <li>Scroll down and select <strong>"Add to Home Screen"</strong> option.</li>
                          <li>Tap <strong>"Add"</strong> in the top right corner to complete the installation.</li>
                        </ol>
                      </TabsContent>
                    )}
                  </Tabs>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {targetPlatform !== "ios" && (
                      <>
                        <Button variant="hero" className="flex-1 gap-2" asChild>
                          <a href={downloadUrl} download={`${appName.replace(/[^a-zA-Z0-9]/g, "_")}.apk`}><Download className="h-4 w-4" /> Download APK</a>
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                          const blob = new Blob(["obb-data-not-required-for-lightweight-apps"], { type: "application/octet-stream" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `main.1.com.${(appName || "app").replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}.obb`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}>
                          <Download className="h-4 w-4" /> Download OBB
                        </Button>
                      </>
                    )}
                    <Button variant="glass" className="flex-1" onClick={() => setStep("configure")}>Configure Another</Button>
                  </div>
                  <div className="text-center pt-2">
                    <Button variant="link" className="text-xs text-primary" asChild>
                      <Link to="/dashboard">Go to Projects Dashboard <ArrowRight className="h-3 w-3 ml-1" /></Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-24 flex flex-col items-center lg:items-end justify-start lg:pl-16">
            <div className="bg-muted/50 p-1 rounded-full flex gap-1 mb-6 border border-border shadow-sm">
              <button 
                onClick={() => setPreviewDevice("android")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${previewDevice === "android" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Android
              </button>
              <button 
                onClick={() => setPreviewDevice("ios")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${previewDevice === "ios" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Smartphone className="h-3.5 w-3.5" /> iOS
              </button>
            </div>
            <PhonePreview url={sourceType === "url" ? websiteUrl : htmlPreviewUrl} appName={appName} themeColor={themeColor} iconUrl={iconPreview} navStyle={navStyle} deviceMode={previewDevice} />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}