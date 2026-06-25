import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Sun, Moon, User, Settings, LayoutDashboard, LogOut, ChevronDown, Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const PRESET_AVATARS = [
  // Coder Hacker Cat (white cat, green glasses, black terminal background)
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231e1e2e'/><circle cx='50' cy='48' r='22' fill='%23cdd6f4'/><path d='M36 34 L32 20 L44 28 M64 34 L68 20 L56 28' fill='%23cdd6f4'/><rect x='32' y='42' width='14' height='10' rx='3' fill='none' stroke='%23a6e3a1' stroke-width='3'/><rect x='54' y='42' width='14' height='10' rx='3' fill='none' stroke='%23a6e3a1' stroke-width='3'/><path d='M46 47 L54 47' stroke='%23a6e3a1' stroke-width='3'/><path d='M46 56 Q50 60 54 56' fill='none' stroke='%23f38ba8' stroke-width='2.5'/></svg>",

  // Caffeine Coder (blue mug, cute smile, programming steam, yellow background)
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23f9e2af'/><rect x='32' y='36' width='36' height='40' rx='8' fill='%2389b4fa'/><path d='M68 46 C76 46, 76 60, 68 60' fill='none' stroke='%2389b4fa' stroke-width='5'/><circle cx='44' cy='50' r='3.5' fill='%2311111b'/><circle cx='56' cy='50' r='3.5' fill='%2311111b'/><path d='M47 58 Q50 61 53 58' fill='none' stroke='%2311111b' stroke-width='2'/><path d='M40 24 Q44 16 48 24' fill='none' stroke='%23f38ba8' stroke-width='2.5'/><path d='M50 24 Q54 16 58 24' fill='none' stroke='%23f38ba8' stroke-width='2.5'/></svg>",

  // Coding Alien/Gopher (cyberpunk green alien, dark goggles, cyan background)
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2374c7ec'/><circle cx='50' cy='52' r='24' fill='%23a6e3a1'/><circle cx='38' cy='48' r='6' fill='%2311111b'/><circle cx='62' cy='48' r='6' fill='%2311111b'/><circle cx='38' cy='48' r='2' fill='%23ffffff'/><circle cx='62' cy='48' r='2' fill='%23ffffff'/><path d='M42 62 Q50 68 58 62' fill='none' stroke='%2311111b' stroke-width='3'/><path d='M30 28 L42 38' stroke='%2311111b' stroke-width='4' stroke-linecap='round'/><path d='M70 28 L58 38' stroke='%2311111b' stroke-width='4' stroke-linecap='round'/></svg>",

  // Coder Ladybug (funny debug bug, green keyboard hat, rose background)
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23f38ba8'/><circle cx='50' cy='52' r='22' fill='%2311111b'/><circle cx='38' cy='50' r='3.5' fill='%23fab387'/><circle cx='62' cy='50' r='3.5' fill='%23fab387'/><path d='M50 30 L50 40 M32 32 L40 42 M68 32 L60 42' stroke='%23fab387' stroke-width='3' stroke-linecap='round'/><rect x='34' y='64' width='32' height='6' rx='2' fill='%23a6e3a1'/></svg>",

  // Code Nerd (yellow smiley, square specs, monospace crown, violet background)
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23cba6f7'/><circle cx='50' cy='52' r='24' fill='%23f9e2af'/><rect x='28' y='42' width='18' height='14' rx='2' fill='none' stroke='%2311111b' stroke-width='3'/><rect x='54' y='42' width='18' height='14' rx='2' fill='none' stroke='%2311111b' stroke-width='3'/><path d='M46 48 L54 48' stroke='%2311111b' stroke-width='3'/><path d='M44 64 Q50 68 56 64' fill='none' stroke='%2311111b' stroke-width='3'/><text x='50' y='28' font-family='monospace' font-weight='bold' font-size='16' fill='%2311111b' text-anchor='middle'>&lt;/&gt;</text></svg>",

  // Cybersecurity Cyber-Bot (neon glowing AI programmer robot, blue background)
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2389b4fa'/><rect x='28' y='32' width='44' height='36' rx='8' fill='%231e1e2e'/><rect x='34' y='42' width='10' height='6' rx='2' fill='%23a6e3a1'/><rect x='56' y='42' width='10' height='6' rx='2' fill='%23a6e3a1'/><path d='M42 58 L58 58' stroke='%23a6e3a1' stroke-width='3' stroke-linecap='round'/><path d='M50 20 L50 32' stroke='%23fab387' stroke-width='3'/><circle cx='50' cy='18' r='4' fill='%23fab387'/></svg>"
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // States for Profile Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();

  // States for Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAdmin = useIsAdmin(userId);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const isDarkTheme = document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
      setIsDark(isDarkTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark, mounted]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setUserId(session?.user.id);
      setEmail(session?.user?.email);
    });
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setUserId(data.session?.user.id);
      setEmail(data.session?.user?.email);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Fetch avatar and display name from localStorage and database profile
  useEffect(() => {
    if (!userId) {
      setAvatar(null);
      setDisplayName(null);
      return;
    }

    // Try loading immediately from localStorage (fast/offline load for dashboard uploads)
    const localAvatar = localStorage.getItem(`avatar_${userId}`);
    if (localAvatar) {
      setAvatar(localAvatar);
    }
    const localName = localStorage.getItem(`display_name_${userId}`);
    if (localName) {
      setDisplayName(localName);
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url, display_name, plan")
          .eq("id", userId)
          .maybeSingle();

        if (data) {
          // If the test account is set to premium, reset it to 'free' to enable testing normal account flows
          // Skip resetting for ritikjagnit@gmail.com and jahanpatle01@gmail.com so these accounts can test Pro and Business features
          if (data.plan && data.plan !== 'free' && email !== 'ritikjagnit@gmail.com' && email !== 'jahanpatle01@gmail.com') {
            await supabase.from("profiles").update({ plan: 'free' }).eq("id", userId);
          }
          if (data.avatar_url) {
            setAvatar(data.avatar_url);
            localStorage.setItem(`avatar_${userId}`, data.avatar_url);
          }
          if (data.display_name) {
            setDisplayName(data.display_name);
            localStorage.setItem(`display_name_${userId}`, data.display_name);
          }
        }
      } catch (err) {
        console.error("Error fetching header profile:", err);
      }
    };

    fetchProfile();
  }, [userId, email]);

  // Click outside detector for Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const links = [
    { to: "/", label: "Home" },
    { to: "/converter", label: "Converter" },
    { to: "/pricing", label: "Pricing" },
    { to: "/features", label: "Features" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  const openEditProfileModal = () => {
    setTempName(displayName || email?.split("@")[0] || "");
    setTempAvatar(avatar);
    setIsEditProfileOpen(true);
    setDropdownOpen(false);
    setOpen(false); // Close mobile drawer as well
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          display_name: tempName,
          avatar_url: tempAvatar
        }, { onConflict: "id" });

      if (error) throw error;

      // Update state and localStorage
      setDisplayName(tempName);
      setAvatar(tempAvatar);
      localStorage.setItem(`display_name_${userId}`, tempName);
      if (tempAvatar) {
        localStorage.setItem(`avatar_${userId}`, tempAvatar);
      } else {
        localStorage.removeItem(`avatar_${userId}`);
      }

      toast.success("Profile updated successfully!");
      setIsEditProfileOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const fallbackLetter = (displayName || email || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-[4.5rem] py-2 flex items-center justify-between">
        <Link to="/" className="flex flex-col items-center justify-center group shrink-0">
          <img
            src="/logo.png"
            alt="AppOrbit Logo"
            className="h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5 text-center"></span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions - aligned together on all viewports */}
        <div className="flex items-center gap-3">


          {!authed && (
            <>
              <Button variant="ghost" asChild className="inline-flex text-xs font-semibold">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="hero" asChild className="hidden sm:inline-flex text-xs font-semibold">
                <Link to="/converter">Get Started</Link>
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-9 h-9 border border-border/40 hover:bg-muted transition-all shrink-0 cursor-pointer"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun className="h-[1.1rem] w-[1.1rem]" /> : <Moon className="h-[1.1rem] w-[1.1rem]" />}
          </Button>

          {authed && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full border border-border/40 hover:border-primary/50 bg-black/20 hover:bg-black/40 dark:bg-white/5 dark:hover:bg-white/10 transition-all focus:outline-none focus:ring-1 focus:ring-primary overflow-hidden shrink-0 cursor-pointer shadow-sm relative group/avatar"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-xs font-bold text-foreground overflow-hidden shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground group-hover/avatar:text-foreground transition-colors font-mono">
                      {fallbackLetter}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover/avatar:text-foreground transition-colors mr-1 hidden sm:inline-flex" />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/40 shadow-2xl p-2.5 z-[60] origin-top-right overflow-hidden bg-card/95 backdrop-blur-2xl text-foreground"
                  >
                    {/* User Profile Summary */}
                    <div className="px-3 py-2.5 border-b border-border/40 mb-2 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-sm font-black text-primary overflow-hidden shrink-0 font-mono">
                        {avatar ? (
                          <img src={avatar} className="w-full h-full object-cover" />
                        ) : (
                          fallbackLetter
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate leading-tight">
                          {displayName || email?.split("@")[0] || "User"}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {email || "Logged in"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-0.5">
                      <button
                        onClick={openEditProfileModal}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5" />
                        Edit Profile
                      </button>

                      <div className="h-px bg-border/40 my-1" />

                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await supabase.auth.signOut();
                          navigate({ to: "/" });
                          toast.success("Successfully logged out");
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-semibold rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      </div>

      {/* Edit Profile Modal Dialog Overlay — Rendered outside the sticky blurred header using a React Portal */}
      {isEditProfileOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-card/95 backdrop-blur-3xl p-6 text-foreground shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Close Button */}
            <button
              onClick={() => setIsEditProfileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-lg font-bold mb-5 tracking-tight">Edit Profile</h3>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Profile Image Upload section */}
              <div className="flex flex-col items-center gap-2.5">
                <label className="relative cursor-pointer group/upload block">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-border/40 flex items-center justify-center text-2xl font-black shadow-lg overflow-hidden group-hover/upload:border-primary/50 transition-all duration-300">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    {tempAvatar ? (
                      <img src={tempAvatar} className="w-full h-full object-cover" alt="Temporary Avatar" />
                    ) : (
                      <span className="font-mono text-primary">{tempName.charAt(0).toUpperCase() || fallbackLetter}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-background hover:bg-muted rounded-full shadow-md flex items-center justify-center border border-border/40 transition-colors z-10">
                    <Camera className="h-3.5 w-3.5 text-foreground/80" />
                  </div>
                </label>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Change Profile Photo</span>
                  {tempAvatar && (
                    <button
                      type="button"
                      onClick={() => setTempAvatar(null)}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Avatars Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Or Select a Preset Avatar</label>
                <div className="grid grid-cols-6 gap-2 bg-foreground/[0.02] border border-border/40 rounded-xl p-2.5">
                  {PRESET_AVATARS.map((avatarUrl, idx) => {
                    const isSelected = tempAvatar === avatarUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempAvatar(avatarUrl)}
                        className={`h-9 w-9 rounded-full overflow-hidden border transition-all cursor-pointer relative group ${isSelected
                            ? "border-primary ring-2 ring-primary/40 scale-105"
                            : "border-border/40 hover:border-foreground/30 hover:scale-105"
                          }`}
                      >
                        <img src={avatarUrl} className="w-full h-full object-cover" alt={`Preset ${idx + 1}`} />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Username Input section */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Username / Display Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-background border border-border/40 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Username"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 h-10 rounded-xl text-xs font-bold border border-border/40 text-muted-foreground hover:text-foreground hover:bg-foreground/5 cursor-pointer"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
