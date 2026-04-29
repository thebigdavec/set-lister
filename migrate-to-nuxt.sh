#!/bin/bash

# Set Lister - Nuxt 4 Migration Script
# This script automates the migration from Vite to Nuxt 4
# 
# IMPORTANT: Review NUXT_MIGRATION_GUIDE.md before running!
# 
# Usage: bash migrate-to-nuxt.sh

set -e

echo "=========================================="
echo "Set Lister - Nuxt 4 Migration Script"
echo "=========================================="
echo ""

# Check if git is clean
if [[ -n $(git status -s) ]]; then
  echo "⚠️  WARNING: You have uncommitted changes!"
  echo "Please commit or stash your changes before migrating."
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "Step 1: Creating backup..."
mkdir -p .migration-backup
cp -r src .migration-backup/
cp package.json .migration-backup/
cp vite.config.ts .migration-backup/
cp tsconfig.json .migration-backup/
echo "✅ Backup created in .migration-backup/"

echo ""
echo "Step 2: Creating Nuxt directory structure..."
mkdir -p app/components
mkdir -p app/composables
mkdir -p app/utils
mkdir -p app/stores
mkdir -p app/assets/css
mkdir -p app/constants
mkdir -p app/types
mkdir -p pages
echo "✅ Directories created"

echo ""
echo "Step 3: Moving files..."

# Move components (excluding base, we'll handle that separately)
if [ -d "src/components" ]; then
  cp -r src/components/* app/components/
  echo "  ✓ Moved components"
fi

# Move composables
if [ -d "src/composables" ]; then
  cp -r src/composables/* app/composables/
  echo "  ✓ Moved composables"
fi

# Move utils
if [ -d "src/utils" ]; then
  cp -r src/utils/* app/utils/
  echo "  ✓ Moved utils"
fi

# Move constants
if [ -d "src/constants" ]; then
  cp -r src/constants/* app/constants/
  echo "  ✓ Moved constants"
fi

# Move types
if [ -d "src/types" ]; then
  cp -r src/types/* app/types/
  echo "  ✓ Moved types"
fi

# Move store
if [ -f "src/store.ts" ]; then
  cp src/store.ts app/composables/useSetlistStore.ts
  echo "  ✓ Moved store to composables/useSetlistStore.ts"
fi

# Move CSS
if [ -f "src/style.css" ]; then
  cp src/style.css app/assets/css/main.css
  echo "  ✓ Moved CSS"
fi

# Move assets
if [ -d "src/assets" ]; then
  cp -r src/assets/* app/assets/
  echo "  ✓ Moved assets"
fi

echo "✅ Files moved to app/ directory"

echo ""
echo "Step 4: Creating Nuxt configuration files..."

# Create app.vue
cat > app.vue << 'EOF'
<template>
  <div id="app">
    <NuxtPage />
  </div>
</template>
EOF
echo "  ✓ Created app.vue"

# Create nuxt.config.ts
if [ ! -f "nuxt.config.ts" ]; then
  cp nuxt.config.example.ts nuxt.config.ts 2>/dev/null || echo "Warning: nuxt.config.example.ts not found"
  echo "  ✓ Created nuxt.config.ts"
fi

# Create pages/index.vue (placeholder - user needs to migrate App.vue content)
cat > pages/index.vue << 'EOF'
<template>
  <ClientOnly>
    <div>
      <!-- TODO: Copy content from src/App.vue here -->
      <p>Migration in progress - copy App.vue content here</p>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
// TODO: Copy script from src/App.vue here
</script>

<style scoped>
/* TODO: Copy styles from src/App.vue here */
</style>
EOF
echo "  ✓ Created pages/index.vue (placeholder)"

echo "✅ Configuration files created"

echo ""
echo "Step 5: Installing Nuxt dependencies..."
read -p "Install dependencies now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm install nuxt@latest
  npm install --save-dev @nuxt/test-utils
  echo "✅ Dependencies installed"
else
  echo "⏭️  Skipped dependency installation"
  echo "   Run: npm install nuxt@latest @nuxt/test-utils"
fi

echo ""
echo "=========================================="
echo "Migration Script Complete!"
echo "=========================================="
echo ""
echo "⚠️  MANUAL STEPS REQUIRED:"
echo ""
echo "1. Copy src/App.vue content to pages/index.vue"
echo "2. Review and update import paths in all files"
echo "3. Update package.json scripts (see MIGRATION_EXAMPLES/package.json.example)"
echo "4. Review nuxt.config.ts and customize as needed"
echo "5. Update tests to use new paths"
echo "6. Test the app: npm run dev"
echo "7. Run tests: npm run test"
echo ""
echo "📚 See NUXT_MIGRATION_GUIDE.md for detailed instructions"
echo ""
echo "🔙 To rollback:"
echo "   cp -r .migration-backup/src ."
echo "   cp .migration-backup/package.json ."
echo "   npm install"
echo ""
