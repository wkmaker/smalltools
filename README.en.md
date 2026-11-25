# 🛠️ Smalltools - Modern Minimalist Online Toolbox

<p align="center">
  <a href="./README.md">繁體中文</a> | <strong>English</strong>
</p>

[![Online Tools](https://img.shields.io/badge/Online%20Tools-tools.cjkuo.net-00f0ff?style=for-the-badge&logo=vercel)](https://tools.cjkuo.net/en/)
[![Donate Stripe](https://img.shields.io/badge/Donate-Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.3.5-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**Smalltools** is a free, privacy-first collection of 39+ online utilities covering personal finance, workplace & life planning, developer tools, network diagnostics, media & document processing, and everyday utilities.

👉 **Live Site: [https://tools.cjkuo.net/en/](https://tools.cjkuo.net/en/)**

---

## ✨ Key Features

* 🎨 **Light/Dark Mode & Glassmorphism UI**: Seamless manual or system-synced theme switching. Dark mode pairs a deep `#030305` canvas with subtle neon accents, while light mode offers crisp, high-contrast WCAG AA glassmorphic surfaces.
* 🔒 **100% Client-Side Privacy First**: All computations—including PDF compression, image conversion, password generation, SSL/X.509 certificate handling, HAR sanitization, and financial calculations—run strictly inside your browser. Files and sensitive data are never uploaded to any server.
* ⚡ **Static Export & Non-Blocking Processing (SSG)**: Built with Next.js App Router `output: 'export'` and served globally via Cloudflare + AWS CloudFront + S3. Heavy crypto/hashing libraries are dynamically imported on demand, and intensive tasks yield asynchronously to keep the UI smooth at 60fps.
* 🔗 **Two-Way URL State Sync**: Inputs sync effortlessly with URL query parameters so you can bookmark, back up, or share exact calculator states with a single link.
* ⚡ **Global Command Palette (`Cmd + K` / `Ctrl + K`)**: Press `Cmd/Ctrl + K` from any page to fuzzy-search all 39+ tools and categories, switch themes, or toggle languages instantly.
* ⭐ **Favorites & Recent Tools Workspace**: Pin your go-to tools and revisit recently used ones directly from the home dashboard, stored locally in `localStorage`.
* 💾 **Tiered Local Persistence & Zero-Persistence Security (`IndexedDB`)**: Media and large-text tools (screen recorder, image processor, PDF compressor, `.ics` splitter, diff checker) auto-save binary `Blob`s and drafts in `IndexedDB` with TTL expiration to survive accidental page reloads. Sensitive tools (password generator, HAR cleaner, SSL converter, cert generator, checksum verifier) strictly enforce an in-memory, zero-disk-write boundary.
* 🧭 **Breadcrumbs, Related Tools & Schema.org**: Every tool page includes glassmorphic breadcrumbs (`Home > Category > Tool`), same-category related tool recommendations, and automated `BreadcrumbList`, `WebApplication`, and `FAQPage` JSON-LD structured data.
* 🌐 **Bilingual Support (Traditional Chinese & English)**: Every page provides dedicated localized routes (`/` and `/en/`) with symmetric `hreflang` tags and full UI translations.
* 📱 **Responsive Mobile-First Experience**: Wide tables automatically adapt into vertical cards or sticky-first-column layouts on mobile devices for zero awkward horizontal scrolling.

---

## 🛠️ Included Tools (39 Tools)

### 🏦 Finance & Wealth
* **[Compound Interest Calculator](https://tools.cjkuo.net/compound-interest/en/)** (`/compound-interest/en/`) - Supports lump sum & recurring deposits, annual/monthly compounding, inflation-adjusted purchasing power, Rule of 72 doubling estimate, dynamic stacked charts, and CSV export.
* **[Personal Loan Calculator](https://tools.cjkuo.net/personal-loan/en/)** (`/personal-loan/en/`) - Supports equal installment and equal principal amortization schedules with effective APR estimation.
* **[Car Loan Calculator](https://tools.cjkuo.net/car-loan/en/)** (`/car-loan/en/`) - Calculates vehicle price, down payment ratio, grace periods, monthly payments, and effective APR.
* **[Mortgage Loan Calculator](https://tools.cjkuo.net/mortgage-loan/en/)** (`/mortgage-loan/en/`) - Two-way down payment and loan-to-value sync, grace period simulation, and multi-tier stepped interest rates.
* **[Stock Pledging & Risk Calculator](https://tools.cjkuo.net/pledge-calculator/en/)** (`/pledge-calculator/en/`) - Share/lot switching, consecutive limit-down day alerts, monthly interest cost, 0%–60% drawdown stress tests, and margin-call remediation plans (add collateral, repay principal, or top up cash).
* **[Futures Margin & Leverage Calculator](https://tools.cjkuo.net/futures-calculator/en/)** (`/futures-calculator/en/`) - Supports TX/MTX/TMF and custom contracts, long/short switching, cockpit risk gauges, adverse point & limit-move tolerance, 0%–60% stress tests, and margin top-up / position reduction plans.

### 💼 Workplace & Life
* **[Salary, Tax & Insurance Calculator](https://tools.cjkuo.net/my-salary-calculator/en/)** (`/my-salary-calculator/en/`) - Taiwan salary breakdown covering labor insurance, health insurance, pension, withholding tax, net take-home pay, and total employer cost.
* **[Real Hourly Rate Calculator](https://tools.cjkuo.net/hourly-rate-calculator/en/)** (`/hourly-rate-calculator/en/`) - Factors in commute time, unpaid overtime, and hidden work costs to calculate your true hourly wage and compare against Taiwan salary percentiles.
* **[Resignation & Notice Period Calculator](https://tools.cjkuo.net/resignation-calculator/en/)** (`/resignation-calculator/en/`) - Computes statutory notice periods, last working day, Taiwan public holidays (2025–2027), annual leave encashment, severance pay, interactive leave calendar, `.ics` export, and resignation notice templates.
* **[Pregnancy & Maternity Leave Calculator](https://tools.cjkuo.net/pregnancy-calculator/en/)** (`/pregnancy-calculator/en/`) - Supports LMP, EDD, ultrasound CRL, and IVF dating; maps 40-week prenatal milestones, hospital bag checklists, fetal size, and Taiwan statutory prenatal/maternity leave & childcare allowances.
* **[Contraction Timer](https://tools.cjkuo.net/contraction-timer/en/)** (`/contraction-timer/en/`) - One-tap start/stop tracker using a 5-contraction sliding median to calculate frequency, duration, regularity, and 6-hour ECharts trends with wake lock and one-tap summary copy. Local-only with 6-hour auto-cleanup.
* **[Fetal Kick Counter](https://tools.cjkuo.net/kick-counter/en/)** (`/kick-counter/en/`) - Supports both Count-to-10 and 1-hour timed modes with 2-minute combo-kick grouping, vitality trend charts, wake lock, and quick call-in scripts. Data stays strictly on your device.

### 💻 Developer Tools
* **[Base64 Encoder & Decoder](https://tools.cjkuo.net/base64/en/)** (`/base64/en/`) - Real-time UTF-8 safe text encoding/decoding, drag-and-drop file encoding, multimedia preview, and binary download.
* **[URL Encoder & Decoder](https://tools.cjkuo.net/url/en/)** (`/url/en/`) - Supports URI and URIComponent modes with live query parameter parsing and two-way table editing.
* **[Secure Password Generator](https://tools.cjkuo.net/password/en/)** (`/password/en/`) - CSPRNG-powered password generator with ambiguous character exclusion, entropy strength meter, and local history.
* **[JSON Formatter & Minifier](https://tools.cjkuo.net/json/en/)** (`/json/en/`) - Real-time syntax linting with error line highlighting, multi-indent beautification, collapsible tree view, and compact minification.
* **[SSL Certificate Converter](https://tools.cjkuo.net/ssl-converter/en/)** (`/ssl-converter/en/`) - Convert between PFX/P12, PEM, and DER formats with private-key/certificate hash matching and expiration warnings.
* **[HAR Sanitizer & Privacy Cleaner](https://tools.cjkuo.net/har-cleaner/en/)** (`/har-cleaner/en/`) - Client-side HAR packet desensitizer that strips cookies, Authorization headers, Bearer JWTs, API keys, sensitive queries/payloads, and bloated binary responses purely in memory.
* **[Epoch Timestamp Converter](https://tools.cjkuo.net/epoch/en/)** (`/epoch/en/`) - Auto-detects seconds vs. milliseconds with instant bi-directional conversion across Taipei, UTC, US Pacific (PST/PDT), and custom time zones.
* **[CA & Server Certificate Generator](https://tools.cjkuo.net/cert-generator/en/)** (`/cert-generator/en/`) - Pure browser self-signed and CA-issued certificate generator supporting RSA, ECDSA, and Ed25519 keys with PEM, DER, and PKCS#12 exports for local HTTPS dev/testing.
* **[File Hash Calculator & Checksum Verifier](https://tools.cjkuo.net/checksum-verifier/en/)** (`/checksum-verifier/en/`) - Drag and drop files to compute MD5, SHA-1, SHA-256, SHA-512, and CRC32 locally, or drop official checksum manifests (`sha256sum`, `CHECKSUMS`, `.sfv`) for automatic verification.

### 🌐 Network & DevOps
* **[DNS DIG Web Tool](https://tools.cjkuo.net/dns-dig/en/)** (`/dns-dig/en/`) - Query A, CNAME, MX, TXT, and NS records via encrypted Cloudflare or Google DNS over HTTPS (DoH).
* **[IP & Connection Diagnostic Tool](https://tools.cjkuo.net/ip-detector/en/)** (`/ip-detector/en/`) - Dual-stack IPv4/IPv6 detection, Cloudflare & Mullvad privacy node inspection, and public cloud latency diagnostics.
* **[DNS HTTPS Record Generator](https://tools.cjkuo.net/https-dns-generator/en/)** (`/https-dns-generator/en/`) - Visual DNS HTTPS (Type 65 / RFC 9460) record generator for ALPN and IP hints with provider configuration guides.
* **[IP Subnet Calculator](https://tools.cjkuo.net/ip-calculator/en/)** (`/ip-calculator/en/`) - Fast IPv4 / CIDR subnetting with network/broadcast addresses, usable IP listings, membership lookup, and high-speed TXT/CSV export.
* **[PAC Script Generator](https://tools.cjkuo.net/pac-generator/en/)** (`/pac-generator/en/`) - Visual Proxy Auto-Config builder with IPv4/IPv6 (`isInNetEx`) subnets, intranet detection (`dnsResolve`), proxy failover pools, reverse-import from existing `.pac` scripts, and Data URI / `.pac` export.
* **[PAC Tester & Simulator](https://tools.cjkuo.net/pac-tester/en/)** (`/pac-tester/en/`) - In-browser PAC sandbox debugger featuring single-URL step-by-step tracing, batch regression testing with CSV reports, IPv6 extensions, and mock DNS.

### 📄 Images & Documents
* **[Open Graph Image Generator](https://tools.cjkuo.net/og-generator/en/)** (`/og-generator/en/`) - Social cover & OG card builder with 4 templates, 2x Retina rendering, custom logos and backgrounds, multi-ratio presets, and PNG/JPEG/WebP/SVG export.
* **[Universal Image Processor](https://tools.cjkuo.net/image-processor/en/)** (`/image-processor/en/`) - Visual cropping (Cropper.js v2), resizing, jSquash WebAssembly format conversion & compression, and multi-file batch ZIP packaging.
* **[PDF Page Composer](https://tools.cjkuo.net/pdf-processor/en/)** (`/pdf-processor/en/`) - Client-side PDF & image merging, drag-and-drop page reordering, 90° page rotation, page deletion, and lossless export.
* **[PDF Compressor Master](https://tools.cjkuo.net/pdf-compressor/en/)** (`/pdf-compressor/en/`) - Compresses and downsamples embedded PDF bitmaps locally while keeping native vector text crisp and selectable.
* **[Document Diff Checker](https://tools.cjkuo.net/diff-checker/en/)** (`/diff-checker/en/`) - 100% local text and code comparison supporting side-by-side Split and GitHub-style Unified diff views.
* **[Text Processing Utility](https://tools.cjkuo.net/text-utility/en/)** (`/text-utility/en/`) - Case conversion, whitespace cleanup, and real-time character, word, CJK character, and line counters.

### 🎲 Life & Utilities
* **[Online Screen Recorder](https://tools.cjkuo.net/screen-capture/en/)** (`/screen-capture/en/`) - Zero-install, watermark-free browser screen recorder with real-time system + microphone audio mixing, MP4/WebM capture (1080p default, switchable to native or 720p), and secure handshake transfer to PRV5 private sharing.
* **[Calendar ICS Splitter](https://tools.cjkuo.net/calendar-split/en/)** (`/calendar-split/en/`) - Splits oversized Google Calendar `.ics` files into compliant RFC 5545 chunks under 1MB with full `VTIMEZONE` preservation and one-click ZIP download.
* **[Designer QR Code Generator](https://tools.cjkuo.net/qr-generator/en/)** (`/qr-generator/en/`) - Custom liquid dot and eye styles, neon gradients, centered logo embedding, and high error correction.
* **[Target Timer](https://tools.cjkuo.net/time/en/)** (`/time/en/`) - Full-screen minimalist digital clock and target countdown/stopwatch timer with customizable formats and accent themes.
* **[Lucky Wheel Spinner](https://tools.cjkuo.net/lucky-wheel/en/)** (`/lucky-wheel/en/`) - Dual wheel and slot-machine modes, dual prize pools, multi-winner draws, quick paste lists, absent-winner redraws, shareable URLs, CSV verification reports, and full-screen spacebar stage controls.
* **[Liar's Dice Roller](https://tools.cjkuo.net/liars-dice/en/)** (`/liars-dice/en/`) - Built for bar and party games with an anti-cheat elapsed timer, center peek gesture, 5-roll history, full-screen stage, realistic audio effects, and mobile haptics.

---

## 🗓️ Roadmap

Upcoming tool ideas prioritized by quality and real-world demand (no fixed schedule):

* **PWA Icon Generator**: Upload a single image to generate all required Android / Web icon sizes and `manifest.json`.
* **Email Header Path Analyzer**: Paste raw email headers to visualize `Received` hops and transit delays.

---

## 💻 Tech Stack

* **Core Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
* **Styling & UI**: [Tailwind CSS v4 (CSS-first)](https://tailwindcss.com/) + Vanilla CSS Custom Tokens (full Light/Dark theme system)
* **Client-Side Libraries**: `bignumber.js` (high-precision financial arithmetic), `echarts` (interactive charts), `pdf-lib` / `pdfjs-dist` (PDF composition & compression), `diff` (text comparison), `qr-code-styling` (vector QR codes); heavy crypto/hashing libraries (`node-forge`, `@peculiar/x509`, `hash-wasm`) are dynamically imported on demand to keep initial bundles lean
* **Infrastructure & CI/CD**: AWS S3 + CloudFront CDN + CloudFormation (`infra/site.yml`, `infra/bootstrap.yml`) + GitHub Actions OIDC keyless deployment & PR CI quality gates (`.github/workflows/ci.yml`)

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 22.0.0
* npm >= 10.0.0

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open `http://localhost:3000` (or `http://localhost:3000/en/` for English) to preview with hot module replacement (HMR).

### 3. Build Static Export (SSG)
```bash
npm run build
```
Static assets are exported to `out/` and can be hosted on any static hosting provider (AWS S3, Cloudflare Pages, GitHub Pages, etc.).

### 4. Run Automated Quality & SEO Tests
```bash
# Run the full test suite (UI, SEO, FAQ, OG, i18n, and all 39 tool engine unit tests)
npm test

# Run individual audit and test suites
npm run test:ui       # UI design standards & WCAG Light/Dark contrast
npm run test:seo      # Deep SEO audit (Metadata, Canonical, Hreflang, Schema.org, Sitemap)
npm run test:faq      # FAQ structured data coverage
npm run test:og       # OG generator translations & constants
npm run test:i18n     # Full bilingual translation symmetry check
npm run test:engine   # Core engine unit tests across all 39 tools (100% coverage)
npm run audit:aria    # ARIA accessibility label audit

# TypeScript type checking and ESLint
npx tsc --noEmit
npm run lint
```

---

## 🎯 SEO & Schema.org Architecture

Smalltools enforces a production-grade SEO architecture across all pages:

1. **Metadata & Social Cards**: Every tool page defines tailored `title`, `description`, `keywords`, Open Graph (`og:image`, `og:title`, `og:description`, `og:locale`), and Twitter Large Card tags.
2. **Canonical & Hreflang Alternates**: Consistent `trailingSlash: true` URLs with symmetric `zh-TW`, `en`, and `x-default` (`en`) language alternates.
3. **Schema.org JSON-LD Rich Snippets**:
   - **`WebApplication` / `SoftwareApplication`**: App category, OS compatibility, and free pricing metadata.
   - **`FAQPage`**: All 39 tools include 7–9 structured Q&As for rich search results.
   - **`WebSite`**: Home page SearchAction structured data.
4. **Automated Sitemap & Robots.txt**: `app/sitemap.ts` automatically generates URLs for all 39 tools (Traditional Chinese & English), home pages, and dynamic salary percentile ranking pages.
5. **Prebuild & PR CI Gatekeepers**: Both `npm run build` (`prebuild`) and `.github/workflows/ci.yml` validate TypeScript, ESLint, UI/WCAG standards, SEO metadata, FAQs, i18n keys, ARIA labels, and core engine tests—blocking flawed builds or merges automatically.

---

## 🏗️ Deployment

Production is hosted on **Cloudflare + AWS CloudFront + AWS S3**, serving **[https://tools.cjkuo.net/](https://tools.cjkuo.net/)**:

* **Traffic Flow**: `Cloudflare (Edge CDN / DNS)` ➔ `AWS CloudFront (CDN)` ➔ `AWS S3 (Origin)`
* **Origin Access Control**: CloudFront reads the private S3 bucket via OAC (SigV4), while a CloudFront Function handles directory index rewrites and staging Basic Auth.
* **Automated CI/CD**: Pushing to `main` triggers `.github/workflows/deploy.yml` (production); other branches deploy to a shared staging environment (`deploy-staging.yml` with Basic Auth and `noindex`). Pure documentation changes (`**.md`) are automatically skipped via `paths-ignore`.

For detailed AWS IAM role isolation, `infra/bootstrap.sh` first-time setup, repository variables, and cross-account domain migration steps, please refer to the [Deployment section in README.md](./README.md#%EF%B8%8F-%E9%83%A8%E7%BD%B2%E8%AA%AA%E6%98%8E-deployment).

---

## ☕ Support & Donation

If **Smalltools** helps your daily work or life, consider supporting ongoing development and maintenance via Stripe:

👉 **[Support the author via Stripe ☕](https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools)**

---

## 📄 License

This project is open-sourced under the **GNU General Public License v3.0 (GPL-3.0)**, Copyright © 2026 CJ Kuo (Plume Intel LLC).

You are free to use, modify, and distribute this project; however, any derivative works or publicly deployed services based on this project must release their complete source code under the same GPL-3.0 license and retain the original copyright notice.

See [LICENSE](./LICENSE) or the [GNU website](https://www.gnu.org/licenses/gpl-3.0.html) for full details.

---

## ⚠️ Disclaimer

All tools and calculation results provided by this project (including financial, salary, mortgage, network, and file utilities) are for technical reference and personal use only and do not constitute professional financial, legal, medical, or engineering advice.

Users should independently verify critical figures with authoritative sources before making decisions. The author and Plume Intel LLC assume no liability for any direct or indirect damages arising from the use of these tools.

---

<p align="center">
  <sub>Smalltools Current Version: <b>v1.32.0</b> (Updated: 2026-11-25)</sub>
</p>
