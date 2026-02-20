# Wicked Smart Bitcoin

**Live Site:** https://wickedsmartbitcoin.com  
**Repository:** https://github.com/w-s-bitcoin/animations

Wicked Smart Bitcoin is a static, client‑side website that presents high‑resolution, data‑driven visualizations about Bitcoin’s economics, history, and long‑term behavior.

All visualizations are generated locally via automated scripts, committed to this repository, and served globally via GitHub Pages.

---

## Project Overview

This repository contains **only static assets and frontend code**.  
There is no backend service and no runtime data fetching beyond static JSON and images.

At a high level, the system works as follows:

1. **Data & chart generation (offline)**
   - Python scripts (outside this repo) generate PNG charts and metadata.
   - A local cron job regenerates charts on a schedule and commits updates.

2. **Static frontend (this repo)**
   - The site loads `final_frames/image_list.json`, which describes every chart.
   - JavaScript renders an interactive gallery and modal viewer entirely in‑browser.
   - All state (favorites, preferences, dropdown selections) is stored locally.

---

## Key Features

### Visualization Browser
- Displays all charts with titles and descriptions.
- Responsive **grid** and **list** layouts.
- Keyboard‑navigable and mobile‑friendly.

### Modal Viewer
- Click or press Enter/Space to open any visualization.
- Zoom, pan, double‑tap reset.
- Keyboard navigation (← → Esc).
- Touch gestures (pinch, swipe).
- Context‑specific dropdown controls that modify the displayed chart.

### Contextual Controls
Certain visualization families expose dynamic controls in the modal, including:
- Starting year (Bitcoin vs Gold)
- Linear / log scales
- USD vs BTC dominance
- “Price Of” category selection
- Unit of Account comparisons
- Coin denomination views
- Monthly / yearly return windows
- BTC Map region and view selectors

Each control updates the image, URL, and metadata in sync.

### Favorites & Filtering
- Star individual charts.
- Filter to show favorites only.
- Bulk star / unstar actions via the menu.
- Favorites persist via `localStorage`.

### Search
- Instant search across titles and/or descriptions.
- Search scope preferences persist between sessions.

### Slideshow Mode
- Full‑screen slideshow playback.
- Adjustable slide duration.
- Auto‑hiding UI while playing.
- Keyboard shortcut support.

### Deep Linking
- Every visualization is addressable by URL.
- Opening a direct link automatically opens the modal in the correct state.
- Links are stable and shareable.

---

## Repository Structure

```
├── index.html            # Main HTML entry point
├── styles.css            # Global styles
├── js/                   # Frontend JavaScript (modular, ordered)
├── final_frames/
│   ├── image_list.json   # Metadata manifest for all charts
│   └── *.png             # Generated visualization images
├── assets/               # Icons, CSVs, donation images, misc assets
└── README.md             # This file
```

### JavaScript Architecture
The `js/` directory is intentionally split into many small, ordered files rather than a single monolithic script.

- Files are numbered to enforce load order.
- Each file has a narrow, well‑defined responsibility.
- Feature‑specific logic (e.g., BTC Maps, Unit of Account, Price Of) lives in dedicated modules.

For a detailed breakdown of the JavaScript architecture and edit guidance, see:

**`js/README.md`**

---

## Local Development

You can run the site locally with any static file server.

Example using Python:

```bash
git clone https://github.com/w-s-bitcoin/animations
cd animations
python3 -m http.server 8080
```

Then open:

```
http://localhost:8080
```

When running locally, deep links use hash routing:

```
http://localhost:8080/#<visualization_slug>
```

---

## Hosting

The site is hosted via **GitHub Pages**:

- Public URL: https://wickedsmartbitcoin.com
- Source: https://github.com/w-s-bitcoin/animations

Because the site is fully static:
- There are no servers to maintain
- No databases
- No external JavaScript dependencies

---

## Donations (Lightning)

If you find this project useful and want to support continued work:

**Lightning Address:**  
`wicked@getalby.com`

![Lightning Donation QR](assets/lightning_donation_qr.png)

---

## License

© 2025 Wicked Smart Bitcoin

All visualizations and source code are provided for educational and informational use.  
Redistribution or reuse of charts requires attribution.
