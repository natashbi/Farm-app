# Sakahan — Farm Budget App 🌾

A mobile-first React app for farmers to:

- **Budget** — record production costs (seeds, abono, labor, land prep, irrigation, fuel, rent, hauling), **tools & equipment** (bought, rented, repairs) and **income** (harvest sales). See production cost, tools cost and profit per season or all-time.
- **Crop Doctor** — pick your crop and the signs you see (yellow leaves, spots, holes, wilting, snails…). The app lists the likely causes with the **fertilizer / treatment**, **tools needed** and **step-by-step fix**, and one tap records the purchase in your budget. Problems are saved in a log you can mark as solved. 24 built-in guides for rice, corn, vegetables, root crops and fruit trees.
- **Harvest records** — save each past season: fertilizer bags used, harvest, cost and sales. The app compares seasons (per hectare when field sizes differ) and tells you the fertilizer amount that gave your best harvest.
  Example: 10 bags → 150 cavans vs 20 bags → 100 cavans ⇒ *"More fertilizer did not mean more harvest — go back to about 10 bags."*

Everything is saved on the phone (no account, works offline). Back up / restore your data as a file and export the budget to Excel (CSV) from the Profile tab.

## Run it

```bash
npm install
npm run dev        # open the printed link on your computer or phone (same Wi-Fi: npm run dev -- --host)
npm test           # unit tests for the budget math, season comparison and Crop Doctor
npm run build      # production build in dist/
npm run build:single  # one self-contained HTML file in dist-single/ (easy to share)
```

## Put it online (free)

The included GitHub Actions workflow publishes the app to GitHub Pages on every push to `main`.
Enable it once in **Settings → Pages → Source: GitHub Actions**. On the phone, open the page and
choose **Add to Home screen** to install it like an app.

## Project layout

```
src/
  App.jsx               tabs, bottom nav, full-screen sheets (phone Back button closes them)
  store.jsx             data + saving to phone storage
  data/categories.js    budget categories & crops (English + Tagalog)
  data/cropDoctor.js    crop problem knowledge base + diagnose()
  data/sample.js        demo data
  lib/calc.js           totals, season cost/income/profit
  lib/analysis.js       past-season comparison & fertilizer recommendation
  screens/              Home, Budget, Doctor, Records, Profile
  forms/                add/edit record, season, Crop Doctor flow
  components/           UI pieces, charts, illustrations
```

> Crop Doctor advice is a general guide. Confirm with your Municipal Agriculture Office / DA technician and always follow product labels.
