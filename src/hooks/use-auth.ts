import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@/integrations/supabase/client";

export function useAuthGuard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) navigate({ to: "/auth" });
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return session;
}

export function useIsAdmin(userId?: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);
  return isAdmin;
}
