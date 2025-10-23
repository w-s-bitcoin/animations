# 🍎 Wicked Smart Bitcoin

**Live Site:** https://wickedsmartbitcoin.com  
**Repository:** https://github.com/w-s-bitcoin/animations

Bitcoin visualizations, updated hourly/daily from live blockchain and market data.  
Each chart is generated automatically by a local cron job, committed to this GitHub repository, and hosted via GitHub Pages.

---

## 📊 Overview

**Wicked Smart Bitcoin** is a static site that displays high-resolution, data-driven visualizations about Bitcoin’s economics, market behavior, and long-term metrics.

It is a fully client-side web app built with plain **HTML, CSS, and JavaScript**, with no external dependencies.

The site dynamically loads an `image_list.json` manifest containing metadata for each visualization (title, description, links, etc.), renders them in a responsive grid or list layout, and provides an interactive modal viewer with advanced features.

---

## ✨ Features

### 🖼️ Visualization Gallery
- Displays all charts from `final_frames/` (PNG files) with their titles and descriptions.
- Supports **grid** and **list** layouts with a responsive design.

### ⭐ Favorites
- Star images to mark favorites (persisted via `localStorage`).
- Header star toggle for **Favorites-only** view.
- ⋯ menu actions:
  - **★ Star All** — add every visualization to favorites  
  - **☆ Unstar All** — remove all favorites  
- Special handling for the **Price Of** series: one favorite key represents the whole set, so favoriting “Price Of” applies across all “price_of_*” images.

### 🔍 Search & Filtering
- Expandable search bar with smooth animation.
- Filters images by title and/or description (you can toggle which fields are searched from the ⋯ menu).
- Works live as you type.

### 🔢 Contextual Dropdowns (in the modal)
When a chart is opened, context-specific controls appear at the top of the modal:
- **Bitcoin vs Gold** → Choose starting **year**  
- **Days at a Loss** → **Linear / Log** scale  
- **Dominance** → **USD / BTC** units  
- **Price Of** → Select the item (e.g., beef, electricity, eggs, etc.)  
- **Coins** → Choose coin type (wholecoin, π-coin, …)  
- **Monthly / Yearly Returns** → Pick a 5-year range

### 🖱️ Modal Viewer
- Click a card to open a dedicated full-screen **modal** viewer.
- **Pinch-to-zoom** and **drag/pan** while zoomed.
- **Double-tap/double-click** to reset zoom and re-center.
- **Swipe left/right** (touch) or use **← / →** keys to navigate.
- **Swipe up/down** (touch) to hide/show the modal controls.
- **Social links** (X / Nostr / YouTube) open latest posts.

### 🎬 Slideshow (full-screen)
- Starts at the current image set (**visible** images after filters/favorites).
- **Play/Pause**: click the **▸ / ။** button or hit **Space**  
- **Next/Prev**: click the edge buttons or press **→ / ←**.
- **Exit**: click **×** or press **Esc**.
- **Auto-hide UI & cursor** while **playing**: controls fade out after **1.5s** of no pointer activity and reappear on movement/tap. While **paused**, controls remain visible.
- **Duration control** in ⋯ menu (2ˣ seconds, x=1..6) with a live bubble indicator.
- **Global shortcut**: **Option (Alt) + S** starts the slideshow from anywhere (if it isn’t already open).

### 🔗 Deep Linking
- Every visualization has a stable URL:
  - On production (GitHub Pages / custom domain), URLs look like:  
    `https://wickedsmartbitcoin.com/<slug>` (e.g., `/days_at_a_loss`)
  - In local development, deep links use the **hash** form:  
    `http://localhost:8080/#<slug>`  
- Opening a deep link loads the gallery and automatically opens the matching image (or the appropriate “representative card” for dynamic series such as **Price Of** or **Coins**).

### 🧠 Persistence
- **Favorites**, **layout** (grid/list), search field preferences, and dropdown selections (e.g., BVG year, DAL scale, Dominance unit, Price Of item, Coin type) are saved to `localStorage` / cookies.

---

## 🧩 File Structure

```
├── index.html
├── styles.css
├── app.js
├── final_frames/
│   ├── image_list.json
│   └── *.png
└── README.md
```

> Note: The app expects `final_frames/image_list.json` and PNGs in `final_frames/`.

---

## 🧠 How It Works

1. **Data Generation (Offline / Cron)**
   - External scripts generate daily PNGs and update `final_frames/image_list.json`.
   - Those changes are pushed to GitHub.

2. **Frontend Rendering (Static)**
   - On page load, `app.js` fetches `final_frames/image_list.json`.
   - The grid/list is composed dynamically, and the modal/slideshow features are wired up.
   - UI state is kept in the browser (no server needed).

3. **Hosting**
   - Hosted via GitHub Pages and routed to `https://wickedsmartbitcoin.com`.

---

## ⚙️ Local Development

```bash
# Clone the repository
git clone https://github.com/w-s-bitcoin/animations.git
cd animations

# Start a simple HTTP server (Python 3)
python3 -m http.server 8080
```

Then visit:  
👉 http://localhost:8080

**Deep linking locally:** use the hash form, e.g.  
`http://localhost:8080/#days_at_a_loss` (not `/days_at_a_loss`).

---

## ⌨️ Keyboard & Touch Shortcuts

**Gallery (modal closed)**
- **Alt/Option + S** — start slideshow

**Modal**
- **← / →** — previous / next image  
- **Space** — close modal  
- **Esc** — close modal  
- **Double-click** — reset zoom and re-center

**Slideshow**
- **Space** — play/pause  
- **← / →** — previous / next  
- **Esc** — exit

**Touch**
- **Swipe left/right** — previous/next (modal)  
- **Swipe up/down** — hide/show modal controls  
- **Pinch** — zoom; **drag** — pan while zoomed  
- **Double-tap** — reset zoom and re-center

---

## 📱 Accessibility & Compatibility

- Fully responsive (mobile, tablet, desktop)
- Focusable, keyboard-operable controls; button labels and ARIA states updated on play/pause
- Works offline once loaded (static files)
- Modern browsers (Chrome, Safari, Firefox, Edge)

---

## ⚡ Bitcoin Lightning Donations

If you find this project valuable and want to support continued development,  
you can send a Lightning payment using the Lightning address or QR code below.

**Lightning Address:**  
`wicked@getalby.com`

**QR Code:**  
![Lightning Donation QR](assets/lightning_donation_qr.png)

✌️🍎🍻

---

## 🧾 License

All original visualizations and source code © 2025 Wicked Smart Bitcoin.  
Openly viewable for educational purposes; redistribution or reuse of images requires attribution.

---

## 🍎 Author

**Wicked**
Bitcoin researcher & data analyst  
🌐 [wickedsmartbitcoin.com](https://wickedsmartbitcoin.com)  
𝕏 [@w_s_bitcoin](https://x.com/w_s_bitcoin)  
📺 [YouTube @wickedsmartbitcoin](https://www.youtube.com/@wickedsmartbitcoin)  
💜 [Nostr @wicked](https://primal.net/wicked)  
💻 [GitHub @w-s-bitcoin](https://github.com/w-s-bitcoin)
