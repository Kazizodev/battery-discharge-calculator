// @ts-check
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    site: 'https://discharge-calculator.vercel.app',
    vite: { plugins: [tailwindcss()] },
    integrations: [react(), sitemap({ changefreq: 'monthly', priority: 1.0 })],
})
