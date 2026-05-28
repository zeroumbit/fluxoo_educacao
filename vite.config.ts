import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

const normalizeModuleId = (id: string) => id.split(path.win32.sep).join('/')

const getNodeModulePackage = (id: string) => {
  const normalizedId = normalizeModuleId(id)
  if (!normalizedId.includes('/node_modules/')) return null

  const [, packagePath] = normalizedId.split('/node_modules/')
  if (!packagePath) return null

  const parts = packagePath.split('/')
  return parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]
}

export default defineConfig({
  optimizeDeps: {
    include: ['idb-keyval', 'dompurify', 'framer-motion', 'lucide-react']
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['coruja-pwa-192.png', 'coruja-pwa-512.png', 'coruja_APPLE.svg', 'coruja_favicon_32.svg'],
      manifest: {
        name: 'Fluxoo EDU - Portal da Familia',
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
        maximumFileSizeToCacheInBytes: 5242880,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            // Public storage only. Supabase REST responses may contain PII and
            // must not be cached by the service worker.
            urlPattern: /^https:\/\/.*supabase\.co\/storage\/v1\/object\/public\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-public-storage-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
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
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // PDF generation is isolated into async chunks; pdfkit is expected to be
    // larger than Vite's generic 500 kB warning threshold.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: (id) => {
          const packageName = getNodeModulePackage(id)
          if (!packageName) return undefined

          if (['react', 'react-dom', 'scheduler'].includes(packageName)) return 'react-vendor'
          if (packageName.startsWith('@radix-ui/')) return 'radix-vendor'
          if (packageName.startsWith('@react-pdf/')) return `pdf-${packageName.split('/')[1]}`
          if (packageName.startsWith('@supabase/')) return 'supabase-vendor'
          if (packageName.startsWith('@sentry/') || packageName.startsWith('@sentry-internal/')) return 'sentry-vendor'
          if (packageName.startsWith('@tanstack/')) return 'query-vendor'
          if (['react-hook-form', '@hookform/resolvers', 'zod'].includes(packageName)) return 'forms-vendor'
          if (packageName === 'date-fns') return 'date-utils'
          if (packageName === 'framer-motion') return 'animation-vendor'
          if (packageName === 'lucide-react') return 'icons-vendor'
          if (packageName === 'dompurify') return 'sanitize-vendor'
          if (packageName === 'recharts') return 'charts-vendor'
          if (['idb-keyval', 'vite-plugin-pwa'].includes(packageName) || packageName.startsWith('workbox-')) return 'pwa-vendor'

          return undefined
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
