# GlobePulse by Galib (`globepulse-galib`)

An open-source, zero-API-key **Global City Intelligence Dashboard** built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

GlobePulse aggregates **5 live public APIs in parallel** to deliver real-time weather forecasts, air quality health metrics, live currency exchange conversion, country economic profiles, and city summaries—while exporting cleanly to static HTML/CSS/JS (`out/`) for **cPanel Shared Hosting** and **GitHub Pages**.

---

## Features

- **Global City Search**: IME-safe autocomplete search across 190+ countries with keyboard navigation.
- **Live Weather & 12h/7-Day Forecast**: Current temperature, feels-like, humidity, wind, sunrise/sunset, UV peak, hourly bar curve, and 7-day temperature range matrix.
- **Air Quality & Health Index**: Real-time US AQI, PM2.5, PM10, NO₂, and Ozone (O₃) with actionable health advisories.
- **Live FX Currency Converter**: Real-time currency conversion (USD, BDT, EUR, GBP, JPY, SGD, AED, and local city currency).
- **Side-by-Side City Comparison**: Compare up to 4 active/pinned cities in parallel inside an accessible native `<dialog>` modal.
- **Pin Watchlist & Shareable Deep Links**: Saved pinned cities in `localStorage` and shareable query-parameter links (`?city=...&lat=...&lon=...&cc=...`).
- **Automatic Light & Dark Mode**: Respects system `color-scheme: light dark` using modern CSS `light-dark()` tokens with full fallback support.
- **Zero Secrets Required**: Runs with 100% free, CORS-enabled public APIs—no `.env` keys or database setup needed.

---

## Public APIs Aggregated

All 5 upstream data sources are queried in parallel (`Promise.allSettled`) with timeout protection and in-memory TTL caching in [`src/lib/city-service.ts`](src/lib/city-service.ts):

| Service | Purpose | Auth / Key |
| :--- | :--- | :--- |
| [Open-Meteo Geocoding & Forecast](https://open-meteo.com/) | City search, current weather, 12h curve, 7-day forecast | None |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | US AQI, PM2.5, PM10, NO₂, O₃ | None |
| [ExchangeRate-API (Open)](https://www.exchangerate-api.com/docs/free) | Live currency exchange rates | None |
| [World Bank Country API](https://datahelpdesk.worldbank.org/knowledgebase/articles/898590) | Official country name, region & income tier | None |
| [Wikipedia REST Summary API](https://en.wikipedia.org/api/rest_v1/) | City summary blurb & landmark thumbnail | None |

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Static Export `output: "export"`)
- **UI**: React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/turbopack`), Lucide Icons
- **Hosting Targets**: GitHub Pages (GitHub Actions) & cPanel Shared Hosting (Apache/LiteSpeed `.htaccess`)

---

## Getting Started Locally

```bash
# 1. Clone the repository
git clone https://github.com/<your-github-username>/globepulse-galib.git
cd globepulse-galib

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

- `npm run dev` — Start local development server
- `npm run lint` — Run ESLint checks
- `npm run build` — Build optimized static export into `out/`

---

## Deployment

### Option 1: GitHub Pages (Automatic via GitHub Actions)

This repository includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which automatically computes the repository `basePath`, builds `out/`, creates `.nojekyll`, and deploys to GitHub Pages.

1. Create a GitHub repository named **`globepulse-galib`** (or any name).
2. Push your code to the `main` branch:
   ```bash
   git add .
   git commit -m "Initial open-source release of GlobePulse"
   git remote add origin https://github.com/<your-github-username>/globepulse-galib.git
   git push -u origin main
   ```
3. Go to **Repository Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

### Option 2: cPanel Shared Hosting (`public_html`)

1. Run the static export build:
   ```bash
   npm run build
   ```
2. Zip the contents inside `out/` (including hidden `.htaccess`):
   ```bash
   cd out && zip -r ../globepulse-cpanel.zip . && cd ..
   ```
3. Upload `globepulse-cpanel.zip` to your cPanel **File Manager → `public_html`** and click **Extract**.

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## Author & Maintainer

**Md. Asadullah Hil Galib**
- Email: [freelancermurad99@gmail.com](mailto:freelancermurad99@gmail.com)
