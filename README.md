# RunCo Growth — Landing Page

Single-page landing site for RunCo Growth (Meta Ads for Indian clothing brands).

## Stack

Plain HTML, CSS, and a tiny bit of vanilla JS. No build step, no framework. Drop the folder on any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3) and it ships.

## Files

- `index.html` — all sections (nav, hero, pain, proof, offer, how, faq, scarcity, final CTA, footer)
- `styles.css` — full theme (light cream + pastel accents, matching the RUNCO OS dashboard look)
- `script.js` — sticky nav, scroll reveal, Calendly popup wiring, Meta Pixel events

---

## Two things to fill in before launch

### 1. Meta Pixel ID

Open `index.html` and find this block in the `<head>`:

```js
fbq('init', 'REPLACE_WITH_PIXEL_ID');
```

Replace `REPLACE_WITH_PIXEL_ID` with your real Pixel ID from Meta Events Manager. There's a second copy of the same placeholder inside the `<noscript>` tag right below it. Replace both.

To get your Pixel ID: business.facebook.com → Events Manager → Data Sources → your Pixel → the ID is the 15–16 digit number under the Pixel name.

### 2. Calendly link

Open `script.js` and set the `CALENDLY_URL` constant:

```js
const CALENDLY_URL = "https://calendly.com/abhay-runcogrowth/strategy-call";
```

Once it's set, every CTA button on the page opens Calendly as a popup overlay (no page redirect, no new tab). Until it's set, CTAs scroll to the contact section at the bottom — so the page is launchable even before Calendly is wired.

---

## What the JS already does for you

- **Sticky nav** with a subtle border that appears on scroll
- **Calendly popup** opens in-page when any CTA is clicked
- **Meta Pixel `Lead` event** fires every time a CTA is clicked, tagged with the button label (e.g. `"Book My Free Strategy Call"`). This means your Meta ads can optimize for "Lead" and you'll see exactly which CTA on the page is converting in Events Manager.
- **PageView** is already tracked automatically when the page loads
- **Scroll reveal** on cards and sections (respects `prefers-reduced-motion`)

## Contact links (already wired)

- Email → `mailto:abhay@runcogrowth.com`
- WhatsApp → `https://wa.me/917023812488`
- Call → `tel:+917023812488`

## Run locally

Just double-click `index.html` to open it in your browser. Or run a local server:

```cmd
:: from this folder
python -m http.server 5500
:: then open http://localhost:5500
```

## Verifying the Pixel works

After you replace `REPLACE_WITH_PIXEL_ID` and host the site:

1. Install the **Meta Pixel Helper** Chrome extension.
2. Open your live site.
3. The extension should show one Pixel found, firing `PageView`.
4. Click any "Book a Call" button — the helper should also show a `Lead` event.

## Design notes

- Theme matches the RUNCO OS dashboard: cream surface, soft pastel pills (pink, blue, orange, lavender, green), Plus Jakarta Sans + Instrument Serif italics for editorial flourishes.
- Mobile-first; tested down to 360px.
- Single page, single primary CTA, no contact form by design.
