# Nuxt 4 Migration Guide for Set Lister

## Overview

This guide helps migrate the Vue 3 + Vite Set Lister application to Nuxt 4.

**⚠️ RECOMMENDATION**: Consider whether Nuxt is necessary. This app is perfectly suited for Vite as a client-side SPA. Nuxt adds complexity without clear benefits unless you plan to add SSR/SSG features.

## If You Choose to Migrate to Nuxt 4

### Prerequisites

- Node.js >= 20.19.0
- Clean git state (commit current work)

### Step 1: Install Nuxt 4

```bash
# Backup current package.json
cp package.json package.json.backup

# Install Nuxt 4 and required modules
npm install nuxt@latest

# Install Nuxt modules
npm install @nuxt/test-utils @nuxtjs/tailwindcss
npm install --save-dev @nuxt/devtools vitest happy-dom
```

### Step 2: Project Structure Changes

```bash
# Create Nuxt directory structure
mkdir -p app/components app/composables app/utils app/stores

# Move files
mv src/components/* app/components/
mv src/composables/* app/composables/
mv src/utils/* app/utils/
mv src/constants app/
mv src/types app/
mv src/assets app/
mv src/style.css app/assets/css/main.css

# Tests stay in their current locations for now
# We'll configure Nuxt to find them
```

### Step 3: Create Nuxt Configuration

Create `nuxt.config.ts` (see NUXT_CONFIG.ts file)

### Step 4: Update Dependencies

**Remove** (Nuxt includes these):

- `vite` (Nuxt uses Vite internally)
- `@vitejs/plugin-vue` (included)
- `vue-tsc` (use `nuxi typecheck` instead)

**Keep**:

- `@vueuse/core` ✅
- `lucide-vue-next` ✅
- `sortablejs` ✅
- `@types/sortablejs` ✅
- `@vitest/coverage-v8` ✅
- `@vue/test-utils` ✅
- `happy-dom` ✅
- `typescript` ✅
- `vitest` ✅

**Add** (Nuxt-specific):

- `@nuxt/test-utils`

### Step 5: File Migrations

#### 5.1 App.vue → app.vue

Create `app.vue` at root (Nuxt's entry point):

```vue
<template>
  <div>
    <NuxtPage />
  </div>
</template>
```

#### 5.2 Main App Component

Move `src/App.vue` to `app/pages/index.vue` (or make it a layout)

#### 5.3 Store Migration

**Option A**: Keep reactive store in composable
Move `src/store.ts` → `app/composables/useSetlistStore.ts`

**Option B**: Use Pinia (Nuxt's recommended state management)

- Install: `npm install pinia @pinia/nuxt`
- Convert to Pinia store pattern

#### 5.4 Global Components

In Nuxt, components in `app/components/` are auto-imported.
No need for manual registration like in `src/main.ts`.

Remove the base component registration - Nuxt will auto-discover them.

### Step 6: Update Imports

Search and replace across codebase:

- `@/` already works in Nuxt
- `~/` also works and is more common

Update any Vite-specific imports (shouldn't be many).

### Step 7: Update Scripts (package.json)

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 8: Testing Updates

Update `vitest.config.ts` to work with Nuxt:

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['**/__tests__/**/*.spec.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.ts', 'app/**/*.vue'],
      exclude: ['app/**/*.d.ts', 'app/**/*.spec.ts', 'app/**/*.test.ts']
    }
  },
  resolve: {
    alias: {
      '@': '/app',
      '~': '/app'
    }
  }
})
```

### Step 9: Client-Only Rendering

Since this is a client-side app using localStorage and File System Access API,
add to components that need client-only rendering:

```vue
<template>
  <ClientOnly>
    <!-- Your component -->
  </ClientOnly>
</template>
```

Or configure entire app as client-only in nuxt.config.ts:

```typescript
export default defineNuxtConfig({
  ssr: false // Full client-side rendering
})
```

### Step 10: Environment Variables

If you have any environment variables, rename:

- `.env` stays the same
- Access via `useRuntimeConfig()` in Nuxt

### Step 11: localStorage and Browser APIs

All localStorage and File System Access API code should work as-is since:

1. App will be client-only (ssr: false)
2. Or wrapped in `<ClientOnly>` components

No changes needed to:

- `src/utils/storage.ts`
- `src/composables/useFileOperations.ts`

## Migration Checklist

- [ ] Backup current working app
- [ ] Install Nuxt 4 dependencies
- [ ] Create nuxt.config.ts
- [ ] Restructure directories (src/ → app/)
- [ ] Update package.json scripts
- [ ] Move components to app/components/
- [ ] Move composables to app/composables/
- [ ] Move utils to app/utils/
- [ ] Create app.vue at root
- [ ] Move App.vue to pages/index.vue or use as layout
- [ ] Remove src/main.ts global component registration
- [ ] Update vitest.config.ts
- [ ] Update tsconfig.json for Nuxt
- [ ] Test dev server: `npm run dev`
- [ ] Run tests: `npm run test`
- [ ] Test build: `npm run build`
- [ ] Test preview: `npm run preview`
- [ ] Verify all features work (save, load, undo/redo, preview, print)

## Common Issues & Solutions

### Issue: "Cannot find module" errors

**Solution**: Check import paths use `~/` or `@/` prefix

### Issue: localStorage is undefined

**Solution**: Ensure `ssr: false` in nuxt.config.ts or use `<ClientOnly>`

### Issue: Components not auto-imported

**Solution**: Ensure they're in `app/components/` and properly named

### Issue: Tests failing

**Solution**: Update import paths in test files to match new structure

### Issue: CSS not loading

**Solution**: Import in nuxt.config.ts:

```typescript
css: ['~/assets/css/main.css']
```

## Alternative: Keep Vite

If Nuxt migration seems too complex or unnecessary, consider:

1. **Keep using Vite** - Your app is ideal for it
2. **Just upgrade dependencies** - Keep current architecture
3. **Add features gradually** - SSR/SSG only if actually needed

Nuxt is excellent but adds overhead. For a client-side tool like Set Lister, Vite is often the better choice.

## Rollback Plan

If migration fails:

```bash
# Restore backup
mv package.json.backup package.json
npm install

# Restore file structure
git checkout .
```

## Support & Resources

- Nuxt 4 Docs: https://nuxt.com
- Migration Guide: https://nuxt.com/docs/getting-started/upgrade
- VueUse in Nuxt: Works out of the box
- Nuxt Discord: https://discord.com/invite/nuxt
