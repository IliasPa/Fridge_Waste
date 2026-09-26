# Changes

This file lists the changes in each version, newest first.

## v0.2 — 2026-09-27

### Added

- **Notifications the day before food expires.** Turn them on in **More → Notifications**. One notification lists what expires tomorrow, plus anything that expires today, e.g. "Today: 🍗 Chicken / Tomorrow: 🥛 Milk".
  - Each item is notified once per use-by date. If you change the date, you're notified again.
  - Includes a **Send a test** button, and can be turned off at any time.
  - **When they arrive:** Fridge checks each time it opens or comes back to the screen. On Android (Chrome, installed app) it also checks in the background about once a day. Without a server, iPhone doesn't let web apps run in the background, so on iPhone they appear when you open Fridge. For an alert at a fixed time, keep using the calendar reminders.
  - On iPhone, notifications need the Home Screen app. In a Safari tab the app explains how to install it first.
  - Clear messages when notifications are blocked or not supported.
  - On iPhone, allowing notifications also lets the Home Screen icon show the badge with the number of items to use soon.
- **Undo "Opened" at any time.** The Opened button is now a toggle: tap it again (it shows "Opened ✓") to mark the item as not opened. The use-by date goes back to what it was before opening. The edit form's Opened / Not opened switch does the same.
  - If you moved the item or changed its date after opening it, the newer date is kept.

## v0.1.1 — 2026-09-27

### Added

- **Take a photo of the barcode.** A new button on the scan screen opens the phone's own camera app and reads the barcode from the photo. It doesn't need the browser's camera permission, so it works where the live camera is blocked: Lockdown Mode, in-app browsers (Viber, Messenger, Instagram…), or after camera access was denied. Sideways barcodes are read too.
- **Try the live camera again** button, so you don't have to close the scan screen after changing a permission.

### Fixed

- Some devices never asked for camera permission, and the scan screen showed only a black box. The app now works out why the camera didn't start and shows matching help:
  - camera blocked on iPhone
  - camera blocked on Android
  - Lockdown Mode or a browser without camera support
  - opened inside another app's built-in browser
  - no camera found
  - camera in use by another app
- In "Read date from photo", the date field and button no longer show before the photo has been read.

## v0.1 — 2026-09-27

### Fixed

- The app no longer crashes with **"Can't find variable: indexedDB"** on iPhones with **Lockdown Mode** turned on, or in other browsers that don't provide IndexedDB storage. It now falls back to the browser's simpler localStorage and works normally.
- If a browser blocks all storage, the app still opens. A warning explains that items won't be saved and how to fix it.
- If Lockdown Mode is later turned off, the items saved in the fallback storage move into IndexedDB automatically on the next launch.
- "Read date from photo" now says clearly when the browser can't run the text reader (Lockdown Mode turns off WebAssembly), instead of wrongly saying it needs internet.

### Changed

- **More → Backup** shows a note when the app is using the fallback storage, suggesting regular backups.

## v0.0 — 2026-09-26

This is the first release of Fridge. It's a free, offline-first web app (PWA) that tracks the food in your fridge, freezer and pantry.

### Added

**App and platform**

- Static web app with no build step, so it can be hosted free on GitHub Pages or Netlify.
- Installable on the iPhone Home Screen: web app manifest, app icons, maskable icon, and splash screens for the iPhone 15 Pro Max and iPhone 15/15 Pro.
- Works offline: the service worker pre-caches the app files, and the OCR library and product photos are cached the first time they're used.
- Mobile-first layout with a bottom tab bar for one-handed use, large tap targets, and support for the iPhone notch and home indicator.
- Light, dark and automatic themes.
- English and Greek (Ελληνικά), switchable in **More → Settings**.

**Storage and backup**

- All data is stored on the device in IndexedDB. There are no accounts and no server.
- The app asks the browser to keep its storage permanently.
- Export and import of a JSON backup, with a choice to replace or merge.
- A reminder appears when the last backup is more than 30 days old.
- Erase-all-data option.

**Adding items**

- Barcode scanning with the camera, using html5-qrcode (bundled, works offline). A code must be read twice in a row, to avoid misreads.
- Free product lookup in Open Food Facts: name, brand, image, and category mapped to the app's categories.
- Products are remembered on the device. If a product is unknown or you're offline, you type its name once and it's known the next time.
- Barcode number can also be typed by hand.
- Quick-pick grid with about 70 loose items in 6 groups, including Greek staples (feta, graviera, kasseri, mizithra, horta, tzatziki, taramosalata, gemista, moussaka/pastitsio, spanakopita, koulouri, phyllo, souvlaki).
- "Recent" row to add something you've added before again.
- Search-as-you-type on the Add screen, and "Add ‘…’" for any new name. The category is guessed from the name.
- Quantity, with each unit counted separately in the stats, and an optional price per item.
- Optional "Read date from photo" using on-device OCR (Tesseract.js). It understands numeric, month-name and month/year date formats, and you always confirm or correct the result.

**Dates and rules**

- Editable shelf-life table in `js/defaults.js`: 29 categories × fridge, freezer and pantry, plus days left after opening and after thawing.
- Quick date buttons: +2 days, +5 days, +1 week, +2 weeks, +1 month, or pick a date.
- **Opened** shortens the date according to category (e.g. milk to about 4 days).
- **Move** into the freezer extends the date. Taking an item out of the freezer gives a short thawed life. Moving between fridge and pantry never lengthens the date.

**Home screen**

- "Use first" section: expired in red, 2 days or less in orange, 5 days or less in yellow.
- Filters for All, Fridge, Freezer and Pantry, with counts. Search across names, brands and categories.
- One-tap **Ate it / Threw out / Opened / Move** on every item, each with Undo.
- Tapping an item opens it for editing or deleting.
- Badge showing how many items are expired or expire within 2 days. It appears on the Home tab and in the page title, and on the app icon where iOS supports it.

**Reminders**

- Calendar (.ics) file export: one event per item on its use-by day, at a time you choose, with alerts 1 day, 2 days, or both before.
- "Only new since last time" option, to avoid duplicate events.

**Extras**

- Shopping list with a "Recently used up" section: add anything you ate or threw out back to the list with one tap. The list can be shared.
- Monthly stats: eaten vs. thrown out, waste rate, money wasted (from prices), most thrown-out items, and a 6-month chart.
- "What can I cook?": 25 built-in simple recipes, mostly Greek, ranked by how urgently their ingredients need using.
- README with iPhone install and free hosting instructions.
