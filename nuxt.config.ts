// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4 compatibility
  future: {
    compatibilityVersion: 4
  },

  // For now, client-side only during migration
  // We'll enable SSR after migration is complete and Firebase is integrated
  ssr: false,

  compatibilityDate: '2024-04-03',

  // Development tools
  devtools: { enabled: true },

  // App configuration
  app: {
    baseURL: '/set-lister/',
    buildAssetsDir: '/_nuxt/',
    head: {
      title: "Dave's Lister",
      titleTemplate: '%s | Set Lister',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'A simple set lister for solo performers and bands.'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/set-lister/red-worf.png'
        }
      ]
    }
  },

  // CSS files
  css: ['~/assets/css/main.css'],

  // Modules to install later:
  // '@nuxtjs/tailwindcss' - if you want Tailwind
  // 'nuxt-vuefire' - for Firebase integration
  // '@pinia/nuxt' - for state management (optional, can keep reactive store)
  modules: [],

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false, // Disabled during build - run `pnpm typecheck` separately
    shim: false
  },

  // Component auto-import configuration
  components: [
    {
      path: '~/components',
      pathPrefix: false
    },
    {
      path: '~/components/base',
      global: true, // Make base components globally available
      pathPrefix: false
    }
  ],

  // Composables and utils auto-import
  imports: {
    dirs: [
      'composables',
      'composables/**',
      'utils',
      'constants'
    ]
  },

  // Vite configuration
  vite: {
    vue: {
      script: {
        defineModel: true,
        propsDestructure: true
      }
    }
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (server-side only)
    // firebaseAdminKey: process.env.FIREBASE_ADMIN_KEY,

    public: {
      // Public keys (client-side accessible)
      // Will add Firebase config here later
      // firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      // firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      // etc.
    }
  },

  // Nitro (server) configuration
  nitro: {
    preset: 'static', // For now, will change when adding API routes
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },

  // Development server
  devServer: {
    port: 3000
  }
})
