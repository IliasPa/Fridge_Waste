# Changes

This file lists the changes in each version, newest first.

## v0.3 — 2026-10-03

### Added

- **Add food from a receipt.** Tap **Add → Receipt**, then take a photo of a supermarket receipt, or choose photos, screenshots or a PDF (for example a digital receipt from the Lidl Plus app). Fridge lists the food on it, with prices.
  - The receipt is read on the phone; nothing is uploaded. The text reader downloads once (about 3 MB, plus about 1.3 MB for Greek) and then works offline. PDFs that contain text are read directly.
  - Each line is matched to a line Fridge has learned before, or to a quick pick it looks like (marked "guess"). Lines it doesn't know yet appear under **Needs a name**: tap **Scan barcodes** and scan each product once, or type its name, or mark it as not food. The next receipt with that line is recognised by itself.
  - Fridge checks that the lines it found add up to the receipt's total, and says when something seems to be missing.
  - Understands quantities ("2 x 0,89"), weighed food ("0,876 kg x 1,99"), discounts and repeated lines. Bags, bottle deposits and household items are left out, and you can tick them back.
  - The purchase date is read from the receipt, so use-by dates count from the day you shopped.
  - Long receipt: take several overlapping photos and choose them together. Lines that appear in two photos are counted once.
  - Choose the receipt's language (Greek, English, German, French, Italian, Spanish and more) on the receipt screen or in **More → Settings**.
  - **More → Settings → Forget learned receipt lines** clears what Fridge has learned.
- **Money tab** in the bottom bar: what you spent on food each month (from receipts or prices you typed), how much of it you ate or threw out, your waste rate, a 6-month chart, your biggest losses, the month's receipts, and how much food at home has expired or expires within 2 days.
- **More → Settings → The + button opens**: the Add screen (as before), the receipt reader, or the barcode scanner.
- Home Screen quick action **Scan a receipt** (Android).
- **Self-repair at start-up.** If the app ever can't start, it deletes its offline copy of the app's files (never your food, list or settings), downloads them again and reloads. If that doesn't help, it shows a **Repair and reload** button.

### Changed

- The monthly stats moved from **More** to the new **Money** tab.
- The Add screen has three buttons: **Receipt**, **Barcode** and **Type it**.
- When scanning barcodes for receipt lines, the camera stays on between products, and a pack still in front of the camera isn't read twice.
- The app icon is now one PNG (`icons/icon.png`) plus `icons/favicon.svg`. The separate icon sizes and the iPhone splash screens were removed, so iOS shows a plain screen for a moment while the app starts.
- Backups include learned receipt lines and receipts. Merging a backup combines them with this device's.
- Updates always download a complete, fresh set of files instead of reusing files the browser kept, so an update can't leave old and new files mixed.

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
