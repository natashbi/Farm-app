# Sakahan: Farm Expense and Harvest Record App 🌾

A mobile-first app that helps **large-scale farmers** (developed for farms in Zaragoza, Nueva Ecija) record,
organize and monitor farm expenses, harvests and income, replacing notebooks and loose sheets.

| Module | What it does |
| --- | --- |
| **Home** | Farm summary (fields, hectares), plantings growing now with days to harvest, fertilizer advice (which brand and how many bags), this season's money, recent activity |
| **Expenses** | Record expenses (seeds, fertilizer, pesticide, labor, land prep, irrigation, fuel, rent, hauling, tools bought/rented/repairs) and income; totals and profit computed automatically; filter by season and field |
| **Harvest** | *Plantings*: crop, field, planting date and expected harvest date with a days-after-planting monitor. *Harvest log*: each harvest batch with date, crop and quantity (optionally recorded as a sale). *Compare*: compares seasons to find which fertilizer brand and how many bags gave the best harvest, and explains why |
| **Reports** | Summary report per season and field: expenses, income, net profit, harvest, yield per hectare, cost per cavan, field performance, plantings, expenses by category, activity log; export to Excel (CSV) or print / save as PDF |
| **Profile** | Farm fields (lote), app lock with a 4-digit PIN, backup / restore, export, appearance |

### Fertilizer advice

Every finished planting records the fertilizer brand, bags used and harvest. The app compares them and tells the
farmer which brand to use and about how many bags (per hectare when every planting has its area). Example:

| Season | Fertilizer | Harvest |
| --- | --- | --- |
| Year 1 | 10 bags Brand A | 120 cavans |
| Year 2 | 5 bags Brand A | 80 cavans |
| Year 3 | 10 bags Brand B | 50 cavans |

Advice: **Use Brand A, about 10 bags.** Reasons shown: with the same 10 bags Brand A gave 120 but Brand B only 50;
even 5 bags of Brand A beat 10 bags of Brand B; 5 bags of Brand A gave less than 10, so stay near 10. It also warns
when the latest season used the weaker brand, when another brand came close with fewer bags or less money, and when
seasons disagree. The advice shows on Home, in Harvest → Compare, and in the planting form (with a warning when a
weaker brand is picked). If fewer bags gave almost the same harvest (97% or more), it recommends the fewer bags.

Extra tool: **Crop Doctor** (Profile → Extra tools) suggests fertilizer, tools and steps for common crop problems.

Everything is saved on the phone (works offline, no account). Back up / restore from the Profile tab.

## Run it

```bash
npm install
npm run dev        # open the printed link on your computer or phone (same Wi-Fi: npm run dev -- --host)
npm test           # unit tests: expense math, harvest logs, date monitor, reports, PIN hashing, Crop Doctor
npm run build      # production build in dist/
npm run build:single  # one self-contained HTML file in dist-single/ (easy to share)
```

## Android app (APK)

The app is also packaged as an installable Android app with [Capacitor](https://capacitorjs.com/).
All files ship inside the APK, so it works without internet from the first launch.

- **Get the APK:** every push to `main` runs the *Build Android APK* workflow, which publishes
  `Sakahan.apk` as a GitHub release. The newest one is always at
  `https://github.com/<owner>/<repo>/releases/latest/download/Sakahan.apk`.
- **Install:** open the APK on the phone, allow *Install unknown apps* when asked, then tap **Install**.
  A newer APK installs over the old one and keeps the records.
- **Which version is this?** Profile → bottom of the page shows `Version <commit> · built <date>`. It matches the
  commit code on GitHub, so you can tell if the phone or website has the latest change.
- **Build it yourself:** install Node.js 22 and Android Studio, then run
  `npm install`, `npm run android:sync` and `npm run android:open`, and press **Run** in Android Studio.

The APK is signed with the test key in `android/app/sakahan-debug.keystore` so every build can update
the previous one. A Google Play release needs its own private key.

## Put it online (free)

The included GitHub Actions workflow publishes the app to GitHub Pages on every push to `main`.
Enable it once in **Settings → Pages → Source: GitHub Actions**. On the phone, open the page and
choose **Add to Home screen** to install it like an app.

## Project layout

```
src/
  App.jsx               tabs, bottom nav, full-screen sheets (phone Back button closes them)
  lib/native.js         Android app glue: back button, status bar, sharing files
  store.jsx             data + saving to phone storage
  data/categories.js    expense categories & crops (English + Tagalog, days to harvest)
  data/cropDoctor.js    crop problem knowledge base + diagnose()
  data/sample.js        demo farm: 3 fields in Zaragoza, Nueva Ecija
  lib/calc.js           totals, planting cost/income/profit, harvest logs, planting-date monitor
  lib/report.js         report filters, summary, field performance, activity log, CSV export
  lib/analysis.js       past-season comparison: fertilizer brand + amount advice
  lib/sha256.js         PIN hashing for the app lock
  screens/              Home, Budget (Expenses), Harvest, Reports, Profile, Doctor
  forms/                expense/income, planting, field, harvest log, PIN, Crop Doctor flow
  components/           UI pieces, charts, illustrations
android/                Android project (Capacitor); assets/ holds the icon and splash sources
```

> Crop Doctor advice is a general guide. Confirm with your Municipal Agriculture Office / DA technician and always follow product labels.
