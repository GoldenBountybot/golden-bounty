import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// All app & game images are mirrored into Supabase Storage (bucket: media),
// keeping the exact same path after the host. This plugin rewrites every
// hardcoded media.base44.com URL in the source to the Supabase CDN at build
// time, so no source file has to be touched and nothing loads from Base44.
const B44_MEDIA = 'https://media.base44.com/';
const SUPABASE_MEDIA = 'https://ovyrljtgviabkamomjso.supabase.co/storage/v1/object/public/media/';
const supabaseMediaRewrite = {
  name: 'supabase-media-rewrite',
  enforce: 'pre',
  transform(code, id) {
    if (!/\.(jsx?|tsx?|css)$/.test(id) || !code.includes(B44_MEDIA)) return null;
    return { code: code.split(B44_MEDIA).join(SUPABASE_MEDIA), map: null };
  },
  transformIndexHtml(html) {
    return html.split(B44_MEDIA).join(SUPABASE_MEDIA);
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