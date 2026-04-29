// Example Nuxt 4 configuration for Set Lister migration
// Rename this file to nuxt.config.ts when ready to migrate

export default defineNuxtConfig({
  // Nuxt 4 features
  future: {
    compatibilityVersion: 4
  },

  // Client-side only rendering (no SSR)
  // This is CRITICAL for localStorage and File System Access API
  ssr: false,

  // App configuration
  app: {
    head: {
      title: "Dave's Lister",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'A simple set lister for solo performers and bands.'
        }
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/red-worf.png' }]
    }
  },

  // Development server
  devServer: {
    port: 5173 // Match Vite's default port
  },

  // Modules
  modules: [
    // '@nuxtjs/tailwindcss', // If you add Tailwind later
    // '@vueuse/nuxt', // VueUse auto-import (optional)
  ],

  // CSS files
  css: ['~/assets/css/main.css'], // Renamed from src/style.css

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false
  },

  // Vite configuration (Nuxt uses Vite under the hood)
  vite: {
    // Match your current Vite config
    build: {
      // Any Vite build options
    }
  },

  // Component auto-import configuration
  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      path: '~/components/base',
      global: true, // Makes base components globally available
      pathPrefix: false
    }
  ],

  // Composables auto-import
  imports: {
    dirs: [
      'composables', // Auto-import composables
      'utils' // Auto-import utilities
    ]
  },

  // Runtime config for environment variables
  runtimeConfig: {
    public: {
      // Add any public runtime config here
    }
  },

  // Nitro (server) configuration - minimal since this is client-only
  nitro: {
    preset: 'static' // For static generation
  },

  // Experimental features (if needed)
  experimental: {
    // Enable any experimental features you need
    payloadExtraction: false // Not needed for client-only
  },

  // Compatibility date for Nuxt 4
  compatibilityDate: '2024-04-03'
})
