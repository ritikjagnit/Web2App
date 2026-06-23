export const supabaseAdmin = new Proxy({} as any, {
  get(_, prop) {
    console.warn(`[Supabase Admin Mock] Accessed property ${String(prop)}`);
    return () => {};
  },
});
