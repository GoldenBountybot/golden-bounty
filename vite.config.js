import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// All app & game images are mirrored into a public GitHub repo and served by
// jsDelivr (free, unmetered CDN), keeping the exact same path after the host.
// This plugin rewrites every hardcoded media.base44.com URL in the source at
// build time, so no source file has to be touched and no image traffic hits
// Supabase Storage (which has a hard egress limit).
const CDN = 'https://cdn.jsdelivr.net/gh/GoldenBountybot/golden-bounty-assets@main/';
// Every host an image was ever served from, all rewritten to the CDN.
const OLD_HOSTS = [
  'https://media.base44.com/',
  'https://ovyrljtgviabkamomjso.supabase.co/storage/v1/object/public/media/',
];
const rewrite = (s) => OLD_HOSTS.reduce((acc, h) => acc.split(h).join(CDN), s);
const supabaseMediaRewrite = {
  name: 'supabase-media-rewrite',
  enforce: 'pre',
  transform(code, id) {
    if (!/\.(jsx?|tsx?|css)$/.test(id) || !OLD_HOSTS.some(h => code.includes(h))) return null;
    return { code: rewrite(code), map: null };
  },
  transformIndexHtml(html) {
    return rewrite(html);
  },
};

export default defineConfig({
  define: { global: 'globalThis' },
  plugins: [
    supabaseMediaRewrite,
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});