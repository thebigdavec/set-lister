# Nuxt 4 Migration Quick Reference

## File Mapping

| Current (Vite)              | New (Nuxt 4)                    | Notes                          |
|-----------------------------|---------------------------------|--------------------------------|
| `index.html`                | `app.vue` + `nuxt.config.ts`    | Split between config and root  |
| `src/main.ts`               | *Removed*                       | Nuxt handles app initialization|
| `src/App.vue`               | `pages/index.vue`               | Main page component            |
| `src/components/`           | `app/components/`               | Auto-imported                  |
| `src/composables/`          | `app/composables/`              | Auto-imported                  |
| `src/utils/`                | `app/utils/`                    | Auto-imported (if configured)  |
| `src/store.ts`              | `app/composables/useStore.ts`   | Or use Pinia                   |
| `src/style.css`             | `app/assets/css/main.css`       | Import in nuxt.config          |
| `src/assets/`               | `app/assets/`                   | Keep structure                 |
| `src/constants/`            | `app/constants/`                | Keep structure                 |
| `src/types/`                | `app/types/`                    | Keep structure                 |
| `vite.config.ts`            | `nuxt.config.ts`                | Different format               |
| `package.json` scripts      | Updated for Nuxt commands       | See below                      |
| `vitest.config.ts`          | New config (see example)        | Updated paths                  |

## Command Changes

| Current (Vite)       | New (Nuxt 4)           |
|----------------------|------------------------|
| `npm run dev`        | `npm run dev`          |
| `npm run build`      | `npm run build`        |
| `npm run preview`    | `npm run preview`      |
| `npm run typecheck`  | `npm run typecheck`    |
| `vite`               | `nuxt dev`             |
| `vite build`         | `nuxt build`           |
| `vite preview`       | `nuxt preview`         |
| *n/a*                | `nuxt generate` (SSG)  |

## Import Changes

### Before (Vite)
```typescript
import { ref } from 'vue'
import MyComponent from './components/MyComponent.vue'
import { myComposable } from './composables/myComposable'
import { myUtil } from './utils/myUtil'
```

### After (Nuxt 4 - Auto-imports)
```typescript
// Vue composables auto-imported
// No need: import { ref } from 'vue'

// Components auto-imported
// No need: import MyComponent from '~/components/MyComponent.vue'

// Your composables auto-imported
// No need: import { myComposable } from '~/composables/myComposable'

// Utils need explicit import (unless configured in nuxt.config.ts)
import { myUtil } from '~/utils/myUtil'
```

## Component Registration

### Before (Vite - src/main.ts)
```typescript
import Button from './components/base/Button.vue'
app.component('Button', Button)
```

### After (Nuxt 4)
**Option 1**: Place in `app/components/base/` with global config:
```typescript
// nuxt.config.ts
components: [
  {
    path: '~/components/base',
    global: true
  }
]
```

**Option 2**: Auto-import (no registration needed)

## Path Aliases

Both `~` and `@` point to the app directory in Nuxt:

```typescript
import { store } from '~/composables/useStore'
import { store } from '@/composables/useStore'  // Same thing
```

## Critical Nuxt Config for This App

```typescript
export default defineNuxtConfig({
  // CRITICAL: Disable SSR for client-only app
  ssr: false,

  // Import global CSS
  css: ['~/assets/css/main.css'],

  // Auto-import base components globally
  components: [
    {
      path: '~/components/base',
      global: true
    }
  ]
})
```

## Testing Changes

### Test file imports
```typescript
// Before (Vite)
import { store } from '../store'

// After (Nuxt)
import { store } from '~/composables/useStore'
```

## Client-Only Code

Wrap browser-only code in `<ClientOnly>`:

```vue
<template>
  <ClientOnly>
    <!-- Code using localStorage, window, etc. -->
  </ClientOnly>
</template>
```

Or set `ssr: false` in nuxt.config.ts for entire app.

## Auto-Import Configuration

Enable auto-imports for utils:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  imports: {
    dirs: [
      'composables',
      'utils',
      'constants'
    ]
  }
})
```

## Common Gotchas

1. **localStorage undefined**: Ensure `ssr: false` or use `<ClientOnly>`
2. **Components not found**: Check they're in `app/components/`
3. **Module errors**: Run `nuxt prepare` after config changes
4. **Import errors**: Use `~/` or `@/` prefix for app imports
5. **Tests failing**: Update import paths to new structure

## Quick Migration Steps

1. Create app/ directory structure
2. Copy files from src/ to app/
3. Create app.vue at root
4. Create pages/index.vue with App.vue content
5. Install nuxt: `npm install nuxt@latest`
6. Create nuxt.config.ts
7. Update package.json scripts
8. Update test imports
9. Test: `npm run dev`

## Rollback

```bash
# Restore from backup
cp -r .migration-backup/src .
cp .migration-backup/package.json .
npm install
```

## Files to Create

- [ ] `app.vue` (root)
- [ ] `nuxt.config.ts` (root)
- [ ] `pages/index.vue` (copy from App.vue)
- [ ] `vitest.config.ts` (update paths)
- [ ] Update `package.json`
- [ ] Update `tsconfig.json` (auto-generated by Nuxt)

## Files to Delete After Migration

- [ ] `src/main.ts` (no longer needed)
- [ ] `index.html` (replaced by app.vue + nuxt.config)
- [ ] `vite.config.ts` (replaced by nuxt.config.ts)
- [ ] Original `src/` directory (after verifying migration)

## Testing the Migration

```bash
# 1. Dev server
npm run dev
# Check: http://localhost:5173 (or 3000)

# 2. Run tests
npm run test

# 3. Type checking
npm run typecheck

# 4. Build
npm run build

# 5. Preview build
npm run preview
```

## Need Help?

- Full guide: `NUXT_MIGRATION_GUIDE.md`
- Should you migrate? `SHOULD_YOU_MIGRATE.md`
- Examples: `MIGRATION_EXAMPLES/`
- Nuxt docs: https://nuxt.com
