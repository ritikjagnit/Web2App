// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  nitro: true,
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true
        },
        manifest: {
          name: "App Weaver PWA Platform",
          short_name: "AppWeaver",
          description: "Convert websites into installable Progressive Web Apps instantly.",
          theme_color: "#7c3aed",
          background_color: "#0a0a0a",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        }
      })
    ],
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      },
      watch: {
        ignored: ['**/backend/**']
      }
    },
  },
});
