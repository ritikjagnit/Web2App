import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Search, 
  Bell, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Lock, 
  Share2, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles,
  Smartphone
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Props {
  url?: string;
  appName?: string;
  themeColor?: string;
  iconUrl?: string;
  navStyle?: "top" | "bottom";
  hasSubscription?: boolean;
}

type Tab = "home" | "search" | "alerts" | "profile";

export function PhonePreview({ url, appName = "Your App", themeColor = "#7c3aed", iconUrl, navStyle = "bottom", hasSubscription = false }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const showNav = hasSubscription;

  // Trigger splash animation when URL changes
  useEffect(() => {
    if (url) {
      setShowSplash(true);
      setIsLoading(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1600); // 1.6s premium native launch screen
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
      setIsLoading(false);
    }
  }, [url]);

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  // Extracts domain name for the address bar
  const getDisplayDomain = (inputUrl?: string) => {
    if (!inputUrl) return "secure.webview";
    try {
      const parsed = new URL(inputUrl);
      return parsed.hostname.replace("www.", "");
    } catch {
      return "secure.webview";
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
    toast.success("Refreshing app webview...");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: appName,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url || "");
      toast.success("App link copied to clipboard!");
    }
  };

  // Safe CSS injection hook to strip desktop styles and optimize layouts
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    setIsLoading(false);
    try {
      const iframe = e.currentTarget;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        // Enforce native app layout overrides inside the webview
        const style = iframeDoc.createElement("style");
        style.textContent = `
          /* Mobile-first WebView corrections */
          html, body {
            max-width: 100vw !important;
            overflow-x: hidden !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: manipulation !important;
            background-color: #ffffff !important;
            
            /* Native App Feel */
            -webkit-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
            -webkit-tap-highlight-color: transparent !important;
            overscroll-behavior-y: none !important;
          }
          
          /* Re-enable selection on input forms */
          input, textarea {
            -webkit-user-select: auto !important;
            user-select: auto !important;
          }
          
          /* Hide double scrollbars */
          ::-webkit-scrollbar {
            display: none !important;
          }

          /* Strip typical desktop elements and sidebars */
          .desktop-only, 
          #sidebar, 
          .sidebar, 
          #desktop-nav, 
          footer:not(.mobile-footer), 
          header:not(.mobile-header) {
            display: none !important;
          }

          /* Scale content correctly and add responsive touch padding */
          img {
            max-width: 100% !important;
            height: auto !important;
          }

          /* Enforce standard clickable mobile targets */
          button, a {
            min-height: 44px !important;
            min-width: 44px !important;
            cursor: pointer !important;
          }
        `;
        iframeDoc.head.appendChild(style);
      }
    } catch (err) {
      // Cross-origin iframe security prevents reading DOM, fallback to native CSS scaling
      console.log("Secure Cross-Origin WebView wrapper container active.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className={`absolute inset-0 ${
            showNav && navStyle === "bottom" 
              ? "bottom-[65px] top-[40px]" 
              : showNav && navStyle === "top" 
                ? "top-[90px] bottom-0" 
                : "top-[40px] bottom-0"
          } overflow-hidden bg-white`}>
            {url ? (
              <div className="absolute inset-0 bg-white overflow-hidden">
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={url}
                  className="w-[calc(100%+24px)] h-[calc(100%+24px)] border-0 pointer-events-auto"
                  title="webview-preview"
                  onLoad={handleIframeLoad}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-4 p-8 text-center bg-zinc-950/5">
                <div className="h-16 w-16 rounded-3xl bg-zinc-100 flex items-center justify-center border border-zinc-200 shadow-sm animate-bounce duration-1000">
                  <Smartphone className="h-6 w-6 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-zinc-800 text-sm font-bold">No Active WebView</h3>
                  <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed mx-auto">
                    Enter a website URL above to package it inside our secure native WebView frame.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      case "search":
        return (
          <div className={`p-5 space-y-5 bg-white h-full ${showNav && navStyle === "top" ? "pt-[155px]" : "pt-[105px]"}`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                type="text"
                readOnly
                placeholder={`Search in ${appName}...`}
                className="w-full h-11 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 px-11 text-xs text-zinc-500 font-medium focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-zinc-50/80 rounded-[1.5rem] border border-zinc-100 flex flex-col p-4 gap-2.5 shadow-sm">
                  <div className="h-2 w-12 bg-zinc-200 rounded-full" />
                  <div className="flex-1 bg-zinc-100/50 rounded-2xl border border-dashed border-zinc-200/40" />
                </div>
              ))}
            </div>
          </div>
        );
      case "alerts":
        return (
          <div className={`p-5 space-y-4 bg-white h-full ${showNav && navStyle === "top" ? "pt-[155px]" : "pt-[105px]"}`}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-sm font-extrabold text-zinc-800 uppercase tracking-wider">Notifications</h2>
              <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3.5 p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100/80 shadow-sm items-start">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                  <Bell className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-2.5 w-24 bg-zinc-300 rounded-full" />
                  <div className="h-2 w-full bg-zinc-200/60 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        );
      case "profile":
        return (
          <div className={`flex flex-col items-center p-6 space-y-5 bg-white h-full ${showNav && navStyle === "top" ? "pt-[155px]" : "pt-[105px]"}`}>
            <div className="h-20 w-20 rounded-3xl bg-zinc-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
              {iconUrl ? (
                <img src={iconUrl} alt="App Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl">
                  {appName.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-zinc-800">{appName} User</h2>
              <p className="text-xs text-zinc-400 font-medium">Welcome to {appName} Native Shell</p>
            </div>
            <div className="w-full space-y-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-full h-11 bg-zinc-50/80 rounded-xl border border-zinc-100/60 flex items-center px-4 justify-between shadow-sm cursor-pointer hover:bg-zinc-50 transition-colors">
                  <div className="h-2 w-24 bg-zinc-300 rounded-full" />
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10"
    >
      {/* Premium Simulator Phone Frame */}
      <div className="relative w-[326px] h-[670px] rounded-[3.2rem] bg-zinc-950 p-[10px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] border-[6px] border-zinc-800 ring-1 ring-white/10 overflow-hidden flex flex-col">

        {/* Dynamic Speaker Notch / Camera bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-36 h-7 bg-zinc-950 rounded-b-[1.5rem] flex items-center justify-center gap-2">
          <div className="w-10 h-1 bg-zinc-800 rounded-full" />
          <div className="w-2 h-2 bg-zinc-800 rounded-full" />
        </div>

        {/* Screen Container */}
        <div className="relative w-full h-full rounded-[2.6rem] overflow-hidden bg-white flex flex-col shadow-inner">

          {/* Native Status Bar */}
          <div
            className="h-10 flex items-end justify-between px-6 pb-1 text-[11px] text-white font-bold select-none z-40 transition-colors duration-500 shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <span>9:41</span>
            <div className="flex gap-1.5 items-center">
              {/* Battery indicator */}
              <div className="flex items-center gap-0.5 opacity-90">
                <span className="h-1.5 w-0.5 bg-white/40 rounded-full" />
                <span className="h-2 w-0.5 bg-white/60 rounded-full" />
                <span className="h-2.5 w-0.5 bg-white rounded-full" />
              </div>
              <div className="w-5 h-2.5 rounded-sm border border-white/60 p-0.5 flex items-center justify-start">
                <div className="w-full h-full bg-white rounded-[1px]" />
              </div>
            </div>
          </div>



          {/* Converted Tab Nav (Top Navigation Style) */}
          {showNav && navStyle === "top" && (
            <div className="absolute top-[40px] left-0 right-0 h-[50px] bg-white border-b border-zinc-100 flex items-center justify-around px-4 shadow-sm z-30">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className="flex flex-col items-center gap-0.5 outline-none relative py-1 cursor-pointer"
                  >
                    <item.icon className="h-4 w-4 transition-colors" style={{ color: isActive ? themeColor : "#a1a1aa" }} />
                    <span className="text-[8px] font-extrabold uppercase tracking-wide transition-colors" style={{ color: isActive ? themeColor : "#a1a1aa" }}>{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicatorTop" 
                        className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" 
                        style={{ backgroundColor: themeColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Screen Content Wrapper */}
          <div className="flex-1 bg-white relative overflow-hidden select-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>

            {/* Translucent Premium Launch Splash Screen */}
            <AnimatePresence>
              {showSplash && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white p-6"
                  style={{
                    background: `linear-gradient(135deg, ${themeColor}dd 0%, %2309090b 100%)`
                  }}
                >
                  {/* Floating particles background effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-60 pointer-events-none" />

                  {/* Centered App Logo/Icon */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
                    className="h-20 w-20 rounded-[2rem] bg-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/20 flex items-center justify-center overflow-hidden mb-6 relative group"
                  >
                    {iconUrl ? (
                      <img src={iconUrl} alt="App Logo" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-black text-2xl shadow-inner">
                        {appName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
                  </motion.div>

                  {/* App Metadata */}
                  <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-2.5 z-10"
                  >
                    <h2 className="text-xl font-black tracking-tight">{appName}</h2>
                    <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/5 rounded-full px-3 py-1">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">Progressive Web App</span>
                    </div>
                  </motion.div>

                  {/* Premium Micro Progress Bar */}
                  <div className="absolute bottom-16 left-12 right-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1.4, ease: "easeInOut", repeat: 0 }}
                      className="absolute top-0 bottom-0 w-1/2 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>

                  <span className="absolute bottom-8 text-[9px] text-white/40 uppercase font-black tracking-wider">Secured by Appify.io</span>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Custom Tab Navigation Bar (Bottom Style) */}
            {showNav && navStyle === "bottom" && (
              <div className="absolute bottom-0 left-0 right-0 h-[65px] bg-white/95 backdrop-blur-md border-t border-zinc-100 flex items-center justify-around px-4 pb-2 shadow-[0_-8px_24px_rgba(0,0,0,0.04)] z-30">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className="flex flex-col items-center gap-0.5 outline-none relative py-1 cursor-pointer shrink-0"
                    >
                      <item.icon className="h-4.5 w-4.5 transition-colors" style={{ color: isActive ? themeColor : "#a1a1aa" }} />
                      <span className="text-[8px] font-extrabold uppercase tracking-wider transition-colors" style={{ color: isActive ? themeColor : "#a1a1aa" }}>{item.label}</span>
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicatorBottom" 
                          className="absolute -top-[10px] left-[-4px] right-[-4px] h-[3px] rounded-full" 
                          style={{ backgroundColor: themeColor }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Safe-Area Bottom Home Indicator Line */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-300 rounded-full z-40" />
        </div>

        {/* Decorative Side Volume/Power buttons (Physical look) */}
        <div className="absolute left-[-4px] top-24 w-1 h-10 bg-zinc-700 rounded-l-sm" />
        <div className="absolute left-[-4px] top-36 w-1 h-10 bg-zinc-700 rounded-l-sm" />
        <div className="absolute right-[-4px] top-30 w-1 h-14 bg-zinc-700 rounded-r-sm" />
      </div>

      {/* Dynamic Ambient Backlight Glow */}
      <div
        className="absolute -inset-8 -z-10 opacity-15 blur-[60px] rounded-full transition-colors duration-1000"
        style={{ backgroundColor: themeColor }}
      />
    </motion.div>
  );
}
