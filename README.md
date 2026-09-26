# Fridge 🧊

Fridge is a free web app that keeps track of the food in your **fridge, freezer and pantry**, so you eat things before they go bad. You install it on your iPhone's Home Screen and it then works like a normal app, even offline.

- **Free to run.** No accounts, no server and no paid APIs.
- **Private.** All your data stays on your device, in the browser's IndexedDB storage (or localStorage if IndexedDB isn't available).
- **English and Ελληνικά**, with a light and a dark theme.

**Live app:** https://iliaspa.github.io/Fridge_Waste/ (once GitHub Pages is switched on, see below)

## What it does

| | |
|---|---|
| **Add food fast** | Scan a barcode (product details come free from Open Food Facts), tap one of about 70 quick picks (Greek staples like feta, graviera, horta, tzatziki and gemista are included), or type a name. Products you name yourself are remembered for the next time you scan them. |
| **Smart dates** | Each item gets a default use-by date based on its category and where you store it. Quick buttons: +2 days, +5 days, +1 week, +2 weeks, +1 month. Optionally, the app can read the printed date from a photo (on-device OCR), and you always confirm the result. |
| **Opened / Move** | Tapping *Opened* shortens the remaining life (for example, milk gets about 4 days). Moving an item to the freezer extends its date, and taking it out of the freezer gives it a short "thawed" life. |
| **Use first** | Expired items show in red, items expiring within 2 days in orange, and items expiring within 5 days in yellow. A badge counts the urgent ones. |
| **One-tap actions** | Ate it · Threw out · Opened · Move, with Undo. Tapped "Opened" by mistake? Tap it again to restore the original date. |
| **Shopping list** | Anything you ate or threw out can go back on the list with one tap. You can share the list. |
| **Stats** | Items eaten vs. thrown out each month, your waste rate, and the money wasted if you entered prices. |
| **What can I cook?** | 25 simple (mostly Greek) recipe ideas, ranked by what expires soonest. |
| **Notifications** | Optional notification the day before food expires (see below for how this works on iPhone). |
| **Calendar reminders** | Download a calendar file (.ics) with one event per item and an alert 1 and/or 2 days before, at a time you choose. |
| **Backup** | Export and import everything as a JSON file. |

## Install on your iPhone

1. Open the app's link in **Safari**. It has to be Safari, not Chrome.
2. Tap the **Share** button (the square with an arrow ↑).
3. Scroll down and tap **Add to Home Screen**, then **Add**.
4. Open **Fridge** from your Home Screen. It opens full-screen and works offline.

The first time you scan, allow camera access. If you said no by mistake, turn it back on in **Settings → Apps → Safari → Camera**.

If the live camera doesn't work, tap **Take a photo of the barcode** on the scan screen. It uses the iPhone's own camera and needs no permission. This happens with Lockdown Mode, if you opened the link inside Viber, Messenger or Instagram, or if camera access was denied. You can also type the barcode number.

**Notifications on iPhone:**

1. Open Fridge from the Home Screen.
2. Go to **More → Notifications → Turn on notifications** and tap **Allow**.

iPhone only lets web apps run while they're open, and a server would be needed to wake them up. So notifications about food expiring tomorrow appear when you open Fridge. They don't arrive at a set time. For a guaranteed alert at a fixed time, also add the calendar reminders. On Android (Chrome, installed app), Fridge also checks in the background about once a day.

**Calendar reminders on iPhone:** go to **More → Calendar reminders → Download**, then tap **Add All**. If nothing happens when you're inside the Home Screen app, open the same link in Safari and do it there. Safari always hands .ics files to the Calendar app. After the first time, use **"Only new since last time"** so you don't get duplicate events. Events stay in your calendar after you eat the item, so just ignore those.

**Your data:** when the app is installed on the Home Screen, iOS keeps its storage. Still, use **More → Export backup** now and then (it saves a file to Files or iCloud Drive). Use the same button to move your data to your MacBook.

## Host it for free (GitHub Pages, from a Mac)

The code is already in this repository. To put it online:

1. Open https://github.com/IliasPa/Fridge_Waste and go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then click **Save**.
4. Wait 1–2 minutes and refresh the page. It shows your link: **https://iliaspa.github.io/Fridge_Waste/**

You don't need a custom domain. The free `github.io` address already uses HTTPS, which the camera and offline mode require.

### Updating the app later

To change something (for example the shelf-life table), edit the files and run these commands in **Terminal** from the project folder:

```bash
git add .
git commit -m "Describe your change"
git push
```

GitHub Pages republishes within a minute or two. The app on your phone picks up the new version on its next launch, and shows a "Reload" prompt when it's ready. If you add or rename files, also list them in `APP_FILES` in `sw.js` and bump `VERSION` there.

### Alternative: Netlify

1. Sign up free at https://app.netlify.com.
2. Choose **Add new site → Import an existing project → GitHub**, then pick `Fridge_Waste`.
3. Leave the build command empty and set the publish directory to `/`. Click **Deploy**.

### Optional: your own domain

This is only needed if you want an address like `fridge.example.com`. Buy the domain from any registrar, then:

1. In **GitHub → Settings → Pages → Custom domain**, type your domain and save. GitHub creates a `CNAME` file in the repo.
2. At your registrar, add a **CNAME** DNS record pointing `fridge` to `iliaspa.github.io`.
3. When the certificate is ready, tick **Enforce HTTPS**.

Warning: data is stored per web address. If you switch addresses, export a backup on the old one and import it on the new one.

## Try it on your Mac before publishing

```bash
cd path/to/fridge_tracker
python3 -m http.server 8000
```

Then open http://localhost:8000 in Safari or Chrome. Opening `index.html` directly by double-clicking won't work, because the modules and service worker need a web server.

## Customising

| File | What to change |
|---|---|
| `js/defaults.js` | **Shelf-life table** (days in fridge, freezer and pantry, after opening, after thawing), the quick-pick buttons, and the barcode category mapping. |
| `js/recipes.js` | The built-in recipe ideas. |
| `js/i18n.js` | All English and Greek interface text. |
| `tools/make-icons.mjs` | Regenerates the icons and splash screens (`node tools/make-icons.mjs`). |

## Project layout

```
index.html              app page
manifest.webmanifest    install info (name, icons, colours)
sw.js                   service worker (offline support)
css/styles.css          all styles, light and dark
js/app.js               screens and actions
js/defaults.js          ← editable shelf-life defaults and quick picks
js/rules.js             date rules (default, opened, moved)
js/recipes.js           built-in recipes
js/i18n.js              English and Greek text
js/db.js                storage (IndexedDB, with localStorage fallback)
js/scanner.js           barcode camera and Open Food Facts lookup
js/ocr.js               expiry-date reading (Tesseract.js)
js/ics.js               calendar file builder
js/notify.js            notifications (permission, showing, Android background check)
js/utils.js, icons.js   helpers and SVG icons
lib/html5-qrcode.min.js barcode library (bundled, works offline)
icons/                  app icons and iPhone splash screens
```

## Notes and limits

- **Barcode lookup** needs internet. Offline, the app asks for the name once and remembers it.
- **Date-from-photo** downloads the Tesseract.js text reader (about 5 MB) from a free CDN the first time you use it. After that it's cached and works offline. It reads numeric dates best (e.g. `30/09/2026`, `09.2026`), and you always confirm the date before it's used.
- **iPhones with Lockdown Mode** block IndexedDB, WebAssembly and the live camera. Fridge switches to basic storage, and barcodes can still be scanned with **Take a photo of the barcode**, but "Read date from photo" isn't available. To get everything, turn off Lockdown Mode for this site in Safari's website settings.
- **No push notifications**, because those would need a server. Notifications appear when the app runs, plus in the background on Android. For alerts at a fixed time on iPhone, use the calendar file. The in-app badge and the red/orange/yellow colours show what's urgent.
- The shelf-life defaults are rough household guides, not food-safety advice. Always check the label.

## Credits

- Product data: [Open Food Facts](https://world.openfoodfacts.org), open database (ODbL).
- Barcode scanning: [html5-qrcode](https://github.com/mebjas/html5-qrcode) (Apache-2.0), based on ZXing.
- OCR: [Tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0).
