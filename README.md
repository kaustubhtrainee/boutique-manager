# Boutique Manager — Android app

A complete app for women's-wear fashion designers and tailors: customers, measurements by dress type,
orders, work board, payments, bills, reports and WhatsApp messages. Made by WingzSphere Tech.

All data is saved on the phone itself (works without internet). Use **More → Backup & restore** every week.

---

## Get the APK — easiest way (no software to install)

GitHub builds the APK for you for free.

1. Go to **github.com**, sign in (or create a free account).
2. Top right **+** → **New repository** → name it `boutique-manager` → **Create repository**.
3. On the new page click **uploading an existing file**.
4. Unzip `boutique-manager-source.zip` on your computer. Open the folder, select **everything inside it**
   (including the `.github` and `android` folders) and drag it into the GitHub page.
   *Tip: on Windows, turn on "View → Hidden items" so the `.github` folder is visible.*
5. Click **Commit changes**.
6. Open the **Actions** tab. A job called **Build Android APK** starts by itself (takes about 5–7 minutes).
7. When it shows a green tick, click it → scroll down to **Artifacts** → download **BoutiqueManager-APK**.
8. Unzip it — you get **BoutiqueManager.apk**. Send it to the phone (WhatsApp / Drive / cable) and tap to install.
   Android will ask to allow "Install unknown apps" for that app once — allow it.

Every time you change the code and upload again, a fresh APK is built automatically.

## Other way — Android Studio (on your computer)

1. Install **Node.js 20+** and **Android Studio**.
2. In this folder run:
   ```
   npm install
   npm run build
   npx cap sync android
   npx cap open android
   ```
3. In Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

## Before giving it to a customer (Play Store / release)

- The APK built above is a *debug* build: perfect for testing and for sharing directly.
- For the Play Store you need a signed *release* build (Android Studio → Build → Generate Signed Bundle / APK).
- App id: `in.wingzspheretech.boutique` (change in `capacitor.config.json` per client if needed).

## Project layout (for developers)

| Path | What it is |
|---|---|
| `src/data.js` | Default dress types, measurement fields, prices, WhatsApp templates, calculations, demo data |
| `src/store.jsx` | Saves everything on the phone (IndexedDB) |
| `src/screens/` | Home, Orders (new order wizard, order detail, bill), Work board, Customers, More (reports, dues, settings, backup) |
| `android/` | Native Android project (Capacitor 6) |
| `.github/workflows/build-apk.yml` | Automatic APK build on GitHub |

Run in a browser for development: `npm install` then `npm run dev`.
