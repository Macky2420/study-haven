import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png'
      ],
      manifest: {
        name: 'Study-Haven',
        short_name: 'Study-Haven',
        description: 'A simple PWA for Student online forum and study tools.',
        theme_color: '#1890ff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          },
          {
            src: '/icons/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: '/icons/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          }
        ],
      },
    }),
  ],
})
