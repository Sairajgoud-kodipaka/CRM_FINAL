Solid — below is a **single, ordered, error-minimizing flow** you must follow:

1. PWA → 2) Electron dev & prod build → 3) Release `.exe` with auto-update.
   Each section has exact commands, files to add, validations, and common-failure fixes. Follow steps in order — don’t skip verification checks.

---

# 1) PWA — make sure the web app is PWA-ready (do this first)

* Install nothing new. Use `public/` for static PWA files.

**Files to add (copy/paste)**   

* `public/manifest.json`

```json
{
  "name": "jewellery-crm",
  "short_name": "JewelleryCRM",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0a84ff",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

* `public/sw.js`

```js
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => clients.claim());
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});
```

* Register SW + `beforeinstallprompt` in `pages/_app.js` (or root client entry)

```js
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('load', () => {
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-ready'));
    });
    window.addEventListener('app-install', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    });
  }, []);
  return <Component {...pageProps} />;
}
export default MyApp;
```

**Add Install button to `/` (login page)**

* In `pages/index.js` or login component:

```jsx
<button id="pwa-install" disabled>Install Mobile App (PWA)</button>
<script>
window.addEventListener('pwa-ready', () => {
  document.getElementById('pwa-install').disabled = false;
});
document.getElementById('pwa-install').addEventListener('click', () => {
  window.dispatchEvent(new Event('app-install'));
});
</script>
```

(Or handle via React handlers as earlier messages showed.)

**Local tests — do these now**

* `npm run dev`
* Open `http://localhost:3000/manifest.json` — should return JSON.
* DevTools → Application → Manifest — icons & `display: standalone` visible.
* DevTools → Application → Service Workers — `/sw.js` registered (or at least tried).
* Try install flow in Chrome/Edge (desktop) or on mobile (localhost is OK for dev).

**Deploy to Vercel (production tests)**

* Push to GitHub branch and let Vercel build (Vercel runs `npm run build`).
* Visit `https://<your-vercel>.vercel.app/manifest.json` — confirm accessible over HTTPS.
* Do the same DevTools checks on the deployed URL. PWA installability requires HTTPS — verify install prompt on production.

**Common PWA failures & fixes**

* Manifest 404 → file not under `public/manifest.json` or wrong path.
* SW not registering → registration code not executed; add console.log. Next.js serves `public/` statics at root.
* Install prompt never appears → ensure site on HTTPS (Vercel) and have manifest + service worker + icons.

---

# 2) Electron — dev → production build (load Vercel in prod to avoid bundling server)

**Install dev tooling**

```bash
npm install -D electron electron-builder electron-updater wait-on concurrently cross-env
```

**Create `electron/main.js` (copy/paste and replace VERCEL URL)**

```js
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV !== 'production';
const DEV_URL = 'http://localhost:3000';
const PROD_URL = process.env.ELECTRON_PROD_URL || 'https://your-vercel-url.vercel.app';

let win;
function createWindow() {
  win = new BrowserWindow({ width: 1200, height: 800, webPreferences: { nodeIntegration: false, contextIsolation: true } });
  win.loadURL(isDev ? DEV_URL : PROD_URL);
}
function setupAutoUpdater() {
  if (isDev) return;
  autoUpdater.on('update-available', () => win && win.webContents.send('update-available'));
  autoUpdater.on('update-downloaded', () => {
    const res = dialog.showMessageBoxSync(win, { type: 'info', buttons: ['Restart', 'Later'], title: 'Update', message: 'Update ready. Restart now?' });
    if (res === 0) autoUpdater.quitAndInstall();
  });
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 5000);
}
app.whenReady().then(() => { createWindow(); setupAutoUpdater(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
```

* **Important:** set `PROD_URL` to your real Vercel domain when building the installer.

**package.json scripts — add these (merge with existing)**

```json
"scripts": {
  "dev:electron": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
  "build:electron": "cross-env NODE_ENV=production electron-builder --win nsis",
  "release:electron": "cross-env ELECTRON_PROD_URL=https://your-vercel-url.vercel.app npm run build:electron"
}
```

**package.json build block — add/merge**

```json
"build": {
  "appId": "com.jewellery.crm",
  "productName": "JewelleryCRM",
  "directories": { "output": "release" },
  "files": ["electron/**/*", "package.json"],
  "win": { "target": ["nsis"], "icon": "build/icons/win/icon.ico" },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowElevation": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "JewelleryCRM"
  },
  "publish": [
    { "provider": "github", "owner": "YOUR_GITHUB_USER", "repo": "YOUR_REPO" }
  ]
}
```

* Replace `YOUR_GITHUB_USER`, `YOUR_REPO` and the `ELECTRON_PROD_URL` value.

**Dev run (test locally)**

* Start dev Electron (loads localhost):

```bash
npm run dev:electron
```

* Verify Electron opens and site works. Test auto-update code does not trigger in dev.

**Build installer locally (after Vercel is live)**

* Ensure your Vercel site is deployed and stable.
* Run:

```bash
cross-env ELECTRON_PROD_URL=https://your-vercel-url.vercel.app NODE_ENV=production electron-builder --win nsis
# or: npm run release:electron
```

* Output: `release/` folder containing `JewelleryCRM Setup x.y.z.exe`.

**Test installer on Windows VM**

* Copy `.exe` to Windows VM, run installer, verify:

  * Wizard flow: Next → choose path → Install → Finish.
  * Desktop & Start Menu shortcut creation.
  * App launches and loads Vercel URL.
  * Uninstaller present in Apps & Features.

**Common Electron build/test errors & fixes**

* `electron-builder` missing files → ensure `files` pattern includes `electron/**/*` and `package.json` in build.
* Port mismatch in dev → ensure Next dev uses `http://localhost:3000` or change wait-on URL accordingly.
* Installer size 0 / missing → check build logs; ensure Windows runner or local Windows build produced NSIS artifact. Use `windows-latest` on CI for best parity.

---

# 3) GitHub Releases + Auto-update — publish installer and metadata correctly

**Goal:** publish artifacts *with* `latest.yml` so `electron-updater` can auto-update.

**Set GH token (if private repo)**

* In GitHub repo → Settings → Secrets → Actions: add `GH_TOKEN` (Personal Access Token with `repo` scope). For public repos `secrets.GITHUB_TOKEN` usually works; electron-builder reads `GH_TOKEN`.

**GitHub Actions workflow — create `.github/workflows/windows-release.yml`**

```yaml
name: Build & Publish Windows NSIS

on:
  push:
    tags:
      - 'v*.*.*'

permissions:
  contents: write

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install deps
        run: npm ci
      - name: Build web assets
        run: npm run build
      - name: Build & publish Windows NSIS
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN || secrets.GITHUB_TOKEN }}
        run: npx electron-builder --win nsis --publish=always
```

* **Trigger**: create tag `vX.Y.Z`. Workflow will build and publish `.exe` *and* `latest.yml`.

**Release flow (exact commands)**

* Bump `version` in `package.json` (e.g., `0.1.1`).
* Commit & tag:

```bash
git add package.json
git commit -m "release v0.1.1"
git tag v0.1.1
git push origin main --tags
# or just: git push --follow-tags
```

* The Action runs, creates a Release and uploads artifacts.

**What gets published**

* Installer: `JewelleryCRM Setup v0.1.1.exe` (NSIS).
* `latest.yml` and other metadata required by `electron-updater`.
* Release page will hold the installer.

**Auto-update behavior**

* Installed app calls `autoUpdater.checkForUpdatesAndNotify()` on startup (we added this).
* When a new release is published with higher version, `electron-updater` downloads update and triggers `update-downloaded` event. Our code prompts user to restart and install.

**Verification steps — test updates**

1. Publish v0.1.0, install on Windows VM.
2. Bump to v0.1.1, tag & push. Wait for Actions to publish.
3. Start app on VM — should detect update, download, prompt and install.
4. Confirm new `app.getVersion()` (or UI) shows updated version.

**Common Release & Auto-update errors & fixes**

* `401` publishing error in CI → set `GH_TOKEN` secret (PAT) and ensure env mapped to `GH_TOKEN`.
* `latest.yml` missing → ensure `--publish=always` or `publish` config present in `package.json` and CI uses `electron-builder` with `--publish`.
* App says "No update available" → check installed app version is lower than published release version. `app.getVersion()` must match `package.json.version`.
* Updater downloads but fails to install → check permissions and path; `quitAndInstall()` requires correct privileges. For per-machine installs, elevation may be required.

---

# Final ordered checklist to execute (copy-paste)

1. Add `public/manifest.json`, `public/sw.js`, register SW in `_app.js`.
2. Add install button to `/` (login). Test PWA locally and on Vercel.

   * `npm run dev` → test manifest & SW.
   * Deploy to Vercel → verify HTTPS and PWA install works.
3. Install electron tooling:

   ```bash
   npm install -D electron electron-builder electron-updater wait-on concurrently cross-env
   ```
4. Add `electron/main.js` (auto-updater wired), update `package.json` scripts & `build` block (NSIS + publish to GitHub).
5. Test Electron in dev:

   ```bash
   npm run dev:electron
   ```
6. Deploy to Vercel (if not done) and confirm stable domain `https://your-vercel-url.vercel.app`.
7. Build local installer (optional local test):

   ```bash
   cross-env ELECTRON_PROD_URL=https://your-vercel-url.vercel.app NODE_ENV=production electron-builder --win nsis
   ```

   * Test `.exe` on Windows VM.
8. Add `GH_TOKEN` secret if repo private. Add GitHub Actions workflow `.github/workflows/windows-release.yml` (above).
9. Publish release via tag:

   ```bash
   npm version patch    # updates package.json and creates tag optionally
   git push --follow-tags
   ```

   or manually:

   ```bash
   git tag v0.1.0
   git push --tags
   ```
10. Verify GitHub Release: `.exe` + `latest.yml` present.
11. Test auto-update: install older version, publish newer tag, start app, confirm update flow.
12. Address any errors from the "common failures" sections above.

---

If you want, I will **now**:

* produce the **exact** `electron/main.js` and `package.json` `build` JSON block with your real GitHub username and your Vercel URL inserted, ready to paste — tell me your GitHub user/org and the Vercel deployment URL and I’ll paste them right away.
