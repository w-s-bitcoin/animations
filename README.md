# Wicked Smart Bitcoin

Live Site: https://wickedsmartbitcoin.com  
Repository: https://github.com/w-s-bitcoin/animations

This project hosts a static website that displays high‑resolution Bitcoin visualizations.  
Charts are generated locally via scheduled scripts and pushed to GitHub, where the site is served through GitHub Pages.

---

## Overview

Wicked Smart Bitcoin is a client‑side web application built with HTML, CSS, and JavaScript.  
All charts are loaded from `final_frames/` and described by `image_list.json`.  
The interface supports advanced features such as a modal viewer, zooming, contextual dropdown controls, favorites, and a full‑screen slideshow.

The repository contains:
- Generated PNG charts (`final_frames/`)
- A metadata manifest (`image_list.json`)
- A static frontend (`index.html`, `styles.css`, `js/app.js`)
- Supporting assets (`assets/`)

---

## Core Features

### Visualization Browser
- Renders all charts with titles and descriptions.
- Grid and list layouts with responsive design.

### Modal Viewer
- Zoom, pan, double‑tap reset.
- Keyboard navigation (← → Esc Space).
- Touch gestures (pinch, swipe).
- Context‑specific dropdowns:
  - Starting Year (Bitcoin vs Gold)
  - Scale (Linear / Log)
  - Dominance unit (USD / BTC)
  - “Price Of” category selector
  - Coin type selector
  - Monthly/Yearly returns range selector

### Favorites
- Star individual charts.
- Filter to show favorites only.
- Star/Unstar all through the menu.

### Search
- Search titles and/or descriptions.
- Toggles for search scope.

### Slideshow
- Full‑screen mode with fade transitions.
- Adjustable slide duration (2ⁱ seconds).
- Auto‑hide controls while playing.
- Global shortcut: Option/Alt + S.

### Deep Linking
- Every visualization has a dedicated URL.
- Direct links open the appropriate image and configuration.

---

## File Structure

```
├── index.html
├── styles.css
├── js/
│   └── app.js
├── final_frames/
│   ├── image_list.json
│   └── *.png
├── assets/
│   ├── btcusd_10m_prices.csv
│   ├── block_data_*.csv
│   ├── lightning_donation_qr.png
│   ├── favicon.png
│   └── (...more CSVs and icons...)
└── README.md
```

---

## Local Development

```
git clone https://github.com/w-s-bitcoin/animations
cd animations
python3 -m http.server 8080
```

Visit: http://localhost:8080  
Deep links locally use hash format: `/#<slug>`.

---

## Donations (Lightning)

Lightning Address: `wicked@getalby.com`

QR Code:

![Lightning Donation QR](assets/lightning_donation_qr.png)

---

## License

All content © 2025 Wicked Smart Bitcoin. Charts and assets may be viewed freely; redistribution requires attribution.
