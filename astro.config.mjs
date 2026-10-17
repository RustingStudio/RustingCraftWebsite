import { defineConfig } from 'astro/config';

// GitHub Pages with the custom domain in public/CNAME; the deploy workflow passes SITE_URL and BASE_PATH.
export default defineConfig({
  site: process.env.SITE_URL || 'https://mc.rustingstudio.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
});
