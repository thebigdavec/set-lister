---
description: How to deploy Set Lister to Firebase Hosting
---

# Deploying to Firebase Hosting

Firebase Hosting is a great alternative to GitHub Pages with better SPA support and no base URL issues.

## Prerequisites

- A Google/Firebase account
- Firebase CLI installed: `npm install -g firebase-tools`

## Setup Steps

### 1. Initialize Firebase

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting
```

When prompted:
- **Use an existing project or create a new one**
- **What do you want to use as your public directory?** `.output/public`
- **Configure as a single-page app (rewrite all urls to /index.html)?** Yes
- **Set up automatic builds and deploys with GitHub?** (Optional - Yes if you want CI/CD)
- **File .output/public/index.html already exists. Overwrite?** No

### 2. Update nuxt.config.ts

Change the baseURL back to root since Firebase serves from the root domain:

```typescript
app: {
  baseURL: '/', // No subdirectory needed for Firebase
  // ... rest of config
}
```

### 3. Build and Deploy

```bash
# Build the static site
pnpm generate

# Deploy to Firebase
firebase deploy --only hosting
```

### 4. Custom Domain (Optional)

You can add a custom domain in the Firebase Console:
1. Go to Hosting section
2. Click "Add custom domain"
3. Follow the DNS setup instructions

## Automated Deployment with GitHub Actions

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm generate
      
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

You'll need to add `FIREBASE_SERVICE_ACCOUNT` to your GitHub repository secrets.

## Benefits of Firebase Hosting

- ✅ No base URL / subdirectory issues
- ✅ Better performance with global CDN
- ✅ Automatic SSL certificates
- ✅ Easy custom domain setup
- ✅ Preview channels for testing
- ✅ Free tier includes 10GB storage and 360MB/day transfer

## Costs

Firebase Hosting free tier:
- 10 GB storage
- 360 MB/day transfer (~10.8 GB/month)

This should be more than enough for a personal app like Set Lister.
