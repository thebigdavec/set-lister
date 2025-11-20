---
description: How to deploy the Set Lister application
---

# Deploying Set Lister

This project is built with Vue.js and Vite, making it easy to deploy to various static hosting providers.

## Option 1: Vercel (Recommended)

Vercel is optimized for frontend frameworks and is the easiest way to deploy.

1.  **Install Vercel CLI** (optional, or use the web dashboard):
    ```bash
    npm i -g vercel
    ```
2.  **Deploy**:
    Run the following command in your terminal:
    ```bash
    vercel
    ```
    Follow the prompts (accept defaults).

Alternatively, you can push your code to GitHub and connect your repository to Vercel in their web dashboard. It will automatically detect the Vite settings.

## Option 2: Netlify

1.  **Install Netlify CLI**:
    ```bash
    npm install netlify-cli -g
    ```
2.  **Deploy**:
    ```bash
    netlify deploy
    ```
    - **Publish directory**: `dist`

## Option 3: Manual Build

If you want to host it on any static file server:

1.  **Build the project**:
    ```bash
    pnpm build
    ```
2.  **Locate files**:
    The built files will be in the `dist` directory.
3.  **Serve**:
    Upload the contents of the `dist` folder to your web server.

## Option 4: GitHub Pages (Automated)

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

1.  **Push your code** to a GitHub repository.
2.  **Go to Settings > Pages** in your repository.
3.  **Source**: Select `Deploy from a branch`.
4.  **Branch**: Select `gh-pages` / `root` (Note: The workflow will create the `gh-pages` branch for you after the first successful run. You might need to wait for the first action to complete before you can select it here).
5.  **Save**.

The workflow file is located at `.github/workflows/deploy.yml`.

## Testing the Build Locally

Before deploying, you can test the production build locally:

```bash
pnpm build
pnpm preview
```
