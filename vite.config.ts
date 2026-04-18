import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['coruja-pwa-192.png', 'coruja-pwa-512.png', 'coruja_APPLE.svg', 'coruja_favicon_32.svg'],
      manifest: {
        name: 'Fluxoo EDU - Portal da Família',
        short_name: 'Fluxoo EDU',
        description: 'Acompanhe a vida escolar do seu filho',
        theme_color: '#3b82f6',
        display: 'standalone',
        background_color: '#3b82f6',
        icons: [
          {
            src: 'coruja-pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'coruja-pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5242880, // Aumentado para 5 MiB para suportar o bundle atual
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            // Storage público (avatares, logos) — cache por 30 dias
            urlPattern: /^https:\/\/.*supabase\.co\/storage\/v1\/object\/public\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // REST API — NetworkFirst, cache máximo de 5 minutos
            urlPattern: /^https:\/\/.*supabase\.co\/rest\/v1\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
        type: 'classic',
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@react-pdf/renderer')) return 'pdf-renderer';
            if (id.includes('date-fns')) return 'date-utils';
            if (id.includes('framer-motion')) return 'animation-vendor';
            if (id.includes('@tanstack/react-query')) return 'query-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            // Unimos Radix ao chunk principal 'vendor' para evitar dependência circular na Vercel
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    host: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
})
