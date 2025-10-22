/* ===========================
 * DOM ELEMENTS
 * =========================== */
const imageGrid = document.getElementById('image-grid');
const gridIcon = document.getElementById('gridView');
const listIcon = document.getElementById('listView');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalFavBtn = document.getElementById('modal-fav-btn');
const kebabBtn = document.getElementById('kebabBtn');
const kebabMenu = document.getElementById('kebabMenu');
const chkSearchTitles = document.getElementById('chkSearchTitles');
const chkSearchDescriptions = document.getElementById('chkSearchDescriptions');
const startSlideshowBtn = document.getElementById('startSlideshowBtn');
const slideshowEl = document.getElementById('slideshow');
const slideshowImg = document.getElementById('slideshow-img');
const ssExitBtn = document.getElementById('ssExitBtn');
const ssPlayPauseBtn = document.getElementById('ssPlayPauseBtn');
const ssPrevBtn = document.getElementById('ssPrevBtn');
const ssNextBtn = document.getElementById('ssNextBtn');
const slideRange = document.getElementById('slideDuration');
const slideBubble = document.getElementById('slideDurationBubble');
const SLIDE_EXP_KEY = 'slideshowExp';

// Modal control groups + selects
const yearControls = document.getElementById('year-controls');
const yearSelect = document.getElementById('year-select');

const scaleControls = document.getElementById('scale-controls');
const scaleSelect = document.getElementById('scale-select');

const dominanceControls = document.getElementById('dominance-controls');
const dominanceSelect = document.getElementById('dominance-select');

const priceOfControls = document.getElementById('priceof-controls');
const priceOfSelect = document.getElementById('priceof-select');

const coinControls = document.getElementById('coin-controls');
const coinSelect = document.getElementById('coin-select');

const myrControls = document.getElementById('myr-controls');
const myrSelect = document.getElementById('myr-select');

/* ===========================
 * GLOBAL STATE
 * =========================== */
let imageList = [];            // Full list (post-processed after fetch)
let visibleImages = [];        // Filtered list currently rendered
let currentIndex = 0;          // Index in visibleImages of open modal
let justUnstarredInModal = false;

// Layout & search state
let userSelectedLayout = null; // 'grid' | 'list' when user manually sets
let showFavoritesOnly = localStorage.getItem('showFavoritesOnly') === 'true';
let searchWasInitiallyClosed = true;

// Touch tracking for modal swipe gestures
let touchStartX = 0, touchEndX = 0;
let touchStartY = 0, touchEndY = 0;
// --- Pinch & Pan state for modal image ---
let isPinching = false;
let isPanning = false;
let gestureConsumed = false;     // stops swipe handlers when true this gesture
let startPinchDistance = 0;
let startScale = 1;
let currentScale = 1;
let pinchFocus = null; // {u,v,xRel,yRel} captured at pinch start
let lastTapTime = 0;
const DOUBLE_TAP_DELAY = 300; // milliseconds between taps

let translateX = 0;
let translateY = 0;
let panStartX = 0;
let panStartY = 0;

const MIN_SCALE = 1;
const MAX_SCALE = 5;

/* ===========================
 * SEARCH PREFS (Title / Description)
 * =========================== */

// Read booleans with defaults = true
function readSearchPrefs() {
    const t = localStorage.getItem('searchTitles');
    const d = localStorage.getItem('searchDescriptions');
    let inTitle = (t === null) ? true : (t === 'true');
    let inDesc = (d === null) ? true : (d === 'true');

    // Enforce: at least one must be true
    if (!inTitle && !inDesc) {
        inTitle = true; inDesc = false; // your rule: if both off → Title reselects
    }
    return { inTitle, inDesc };
}

function writeSearchPrefs(inTitle, inDesc) {
    localStorage.setItem('searchTitles', String(inTitle));
    localStorage.setItem('searchDescriptions', String(inDesc));
}

function applySearchPrefsToUI(inTitle, inDesc) {
    if (chkSearchTitles) {
        chkSearchTitles.classList.toggle('checked', inTitle);
        chkSearchTitles.setAttribute('aria-checked', String(inTitle));
    }
    if (chkSearchDescriptions) {
        chkSearchDescriptions.classList.toggle('checked', inDesc);
        chkSearchDescriptions.setAttribute('aria-checked', String(inDesc));
    }
}

function initSearchPrefsAndUI() {
    const { inTitle, inDesc } = readSearchPrefs();
    writeSearchPrefs(inTitle, inDesc);
    applySearchPrefsToUI(inTitle, inDesc);
}

// Returns true only when the search UI is open AND there's a non-empty query
function isSearchHappening() {
    const container = document.querySelector('.search-container');
    const input = document.getElementById('search-input');
    if (!container || !input) return false;
    return container.classList.contains('active') && input.value.trim().length > 0;
}

function toggleSearchPref(which) {
    let { inTitle, inDesc } = readSearchPrefs();

    if (which === 'title') {
        if (inTitle && !inDesc) {
            inTitle = false;
            inDesc = true;
        } else {
            inTitle = !inTitle;
        }
    } else {
        if (inDesc && !inTitle) {
            inDesc = false;
            inTitle = true;
        } else {
            inDesc = !inDesc;
        }
    }

    // Safety net: never allow both false. Prefer to re-enable the one the user touched.
    if (!inTitle && !inDesc) {
        if (which === 'title') inTitle = true;
        else inDesc = true;
    }

    writeSearchPrefs(inTitle, inDesc);
    applySearchPrefsToUI(inTitle, inDesc);

    // Only rebuild the grid if a search is actually happening
    if (isSearchHappening()) {
        filterImages();
    }
}

/* ===========================
 * CONSTANTS
 * =========================== */

// --- Bitcoin vs Gold (BVG) ---
const BVG_BASE = 'bitcoin_vs_gold';
const BVG_STORAGE_KEY = 'bvgYear';
// Years newest → oldest (2013..2025 inclusive)
const THIS_YEAR = new Date().getFullYear();
const BVG_YEARS = Array.from({ length: THIS_YEAR - 2013 + 1 }, (_, i) => THIS_YEAR - i);

// --- Days At a Loss (DAL) ---
const DAL_BASE = 'days_at_a_loss';
const DAL_STORAGE_KEY = 'dalScale';
// Dropdown order and ↑/↓ cycling order
const DAL_SCALES = ['linear', 'log'];

// --- Dominance (USD/BTC) ---
const DOM_BASE = 'bitcoin_dominance';
const DOM_STORAGE_KEY = 'dominanceUnit';
const DOM_UNITS = ['usd', 'btc'];

// --- Price Of (POF) group (price_of_*) ---
const POF_BASE = 'price_of_';
const POF_STORAGE_KEY = 'pofItem';          // cookie/localStorage slug (e.g., "ground_beef")
const POF_FAV_KEY = 'price_of_*';       // Group favorite key
let PRICE_OF_OPTIONS = [];                 // [{slug, label, filename}]
let PRICE_OF_META = {};                 // { slug: { label, filename, title, description, latest_* } }

// --- Coins group (single card representing 8 coin visuals) ---
const COIN_STORAGE_KEY = 'coinType';         // Persist selected coin slug
const COIN_ORDER = [                          // Desired dropdown & cycling order
    'wholecoins', 'pi_coins', 'v_coins', 'x_coins',
    'l_coins', 'c_coins', 'd_coins', 'm_coins'
];
let COIN_OPTIONS = [];                       // [{slug, label, filename, title, description, latest_*}]
let COIN_META = {};                       // { slug: {...} }

// --- Monthly Yearly Returns (MYR) ---
const MYR_BASE = 'monthly_yearly_returns';
const MYR_START_YEAR = 2010;

// Default is the last 5-year window (e.g., 2021 - 2025)
const MYR_DEFAULT_RANGE = `${THIS_YEAR - 4} - ${THIS_YEAR}`;

// Build rolling 5-year windows oldest → newest (e.g., 2010-2014 ... 2021-2025)
// The default (base PNG) is always the last window (e.g., 2021-2025).
function buildMyrRanges(startYear, endYear) {
    const ranges = [];
    // rolling windows: 2010-2014, 2011-2015, ... , 2021-2025
    for (let s = startYear; s <= endYear - 4; s++) {
        ranges.push(`${s} - ${s + 4}`);
    }
    return ranges; // already oldest → newest; default will be the last one
}

/* ===========================
 * GENERIC HELPERS
 * =========================== */

// Cookies (used alongside localStorage for some selectors)
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

// Update URL for current modal (strip .png)
function replaceUrlForFilename(newFilename) {
    const base = location.pathname.replace(/\/[^/]*$/, ''); // drop last segment
    const slug = newFilename.replace('.png', '');
    history.replaceState(null, '', `${base}/${slug}`);
}

// Update the currently visible grid thumbnail (for the open modal image)
function updateGridThumbAtCurrent(newFilename, newAlt) {
    const thumb = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    if (thumb) {
        thumb.src = `final_frames/${newFilename}`;
        if (newAlt) thumb.alt = newAlt;
    }
}

// Migrate favorites when a filename-based variant changes (BVG/DAL/DOM/Coins)
function migrateFavoriteFilename(oldFilename, newFilename) {
    let favs = getFavorites();
    const pos = favs.indexOf(oldFilename);
    if (pos !== -1) {
        favs.splice(pos, 1);
        if (!favs.includes(newFilename)) favs.push(newFilename);
        saveFavorites(favs);
        modalFavBtn.classList.add('filled');
        modalFavBtn.textContent = '★';
    }
    const gridStar = document.querySelector(`.favorite-star[data-filename="${oldFilename}"]`);
    if (gridStar) gridStar.setAttribute('data-filename', newFilename);
}

// Show/hide modal control groups
function showYearControls(show) { yearControls?.classList.toggle('show', !!show); }
function showScaleControls(show) { scaleControls?.classList.toggle('show', !!show); }
function showPriceOfControls(show) { priceOfControls?.classList.toggle('show', !!show); }
function showDominanceControls(show) { dominanceControls?.classList.toggle('show', !!show); }
function showCoinControls(show) { coinControls?.classList.toggle('show', !!show); }
function showMyrControls(show) { myrControls?.classList.toggle('show', !!show); }

// Modal post links (X / Nostr / YouTube)
function setModalLinks({ x = '', nostr = '', youtube = '' } = {}) {
    const xLink = document.getElementById('x-link');
    const nostrLink = document.getElementById('nostr-link');
    const ytLink = document.getElementById('youtube-link');

    // X
    if (x) {
        xLink.href = x;
        xLink.classList.remove('disabled');
        xLink.removeAttribute('aria-disabled');
        xLink.removeAttribute('tabindex');
    } else {
        xLink.href = '#';
        xLink.classList.add('disabled');
        xLink.setAttribute('aria-disabled', 'true');
        xLink.setAttribute('tabindex', '-1');
    }

    // Nostr
    if (nostr) {
        nostrLink.href = nostr;
        nostrLink.classList.remove('disabled');
        nostrLink.removeAttribute('aria-disabled');
        nostrLink.removeAttribute('tabindex');
    } else {
        nostrLink.href = '#';
        nostrLink.classList.add('disabled');
        nostrLink.setAttribute('aria-disabled', 'true');
        nostrLink.setAttribute('tabindex', '-1');
    }

    // YouTube
    if (youtube) {
        ytLink.href = youtube;
        ytLink.classList.remove('disabled');
        ytLink.removeAttribute('aria-disabled');
        ytLink.removeAttribute('tabindex');
    } else {
        ytLink.href = '#';
        ytLink.classList.add('disabled');
        ytLink.setAttribute('aria-disabled', 'true');
        ytLink.setAttribute('tabindex', '-1');
    }
}

let tempNonFavInjected = false;

/** Try to open a modal by filename even if it's filtered out by favorites. */
function openByFilenameAllowingNonFav(filename) {
    // If it's already in the current visible list, open normally.
    let idx = visibleImages.findIndex(img => img.filename === filename);
    if (idx !== -1) {
        openModalByIndex(idx);
        return true;
    }

    // Otherwise, look it up in the full (unfiltered) list.
    const fullIdx = imageList.findIndex(img => img.filename === filename);
    if (fullIdx !== -1) {
        // Inject it at the front of visibleImages temporarily so nav works.
        visibleImages = [imageList[fullIdx], ...visibleImages];
        tempNonFavInjected = true;
        openModalByIndex(0);
        return true;
    }
    return false;
}

function setModalImageAndCenter(filename, altText = "") {
    modalImg.alt = altText || "";
    modalImg.src = `final_frames/${filename}`;

    // If the image is already cached, natural sizes exist now.
    if (modalImg.complete && modalImg.naturalWidth) {
        if (currentScale <= 1.001) centerImageAtScale1();
        return;
    }

    const onLoad = () => {
        if (currentScale <= 1.001) centerImageAtScale1();
        modalImg.removeEventListener('load', onLoad);
    };
    modalImg.addEventListener('load', onLoad);
}

// ----- Pinch & Pan helpers -----
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function distance(touches) {
    const [a, b] = touches;
    const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
    return Math.hypot(dx, dy);
}

function midpoint(touches) {
    const [a, b] = touches;
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

// Replace your applyTransform with this version
function applyTransform() {
    // translate first, then scale (your code already uses this order)
    modalImg.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${currentScale})`;
}

// Convert a screen point to image-local coords given the current transform
function screenPointToImageLocal(clientX, clientY) {
    const rect = modalImg.getBoundingClientRect();
    const xRel = clientX - rect.left;   // already subtracts layout+translate
    const yRel = clientY - rect.top;

    // Do NOT subtract translateX/Y again; rect already reflects them.
    const u = xRel / currentScale;
    const v = yRel / currentScale;

    return { u, v, xRel, yRel };
}

function computeBaseSizeAtScale1() {
    const vp = modal.getBoundingClientRect();
    const nw = modalImg.naturalWidth || 1;
    const nh = modalImg.naturalHeight || 1;

    // Respect your CSS constraints: max-width:95vw; max-height:88vh;
    const maxW = vp.width * 0.95;
    const maxH = vp.height * 0.88;

    const fit = Math.min(maxW / nw, maxH / nh, 1); // don't upscale past 1
    return { baseW: nw * fit, baseH: nh * fit, vpW: vp.width, vpH: vp.height };
}

function centerImageAtScale1() {
    const { baseW, baseH, vpW, vpH } = computeBaseSizeAtScale1();
    currentScale = 1;
    translateX = (vpW - baseW) / 2;
    translateY = (vpH - baseH) / 2;
    applyTransform();
}

// Clamp pan so you can't drag the image totally off screen
function clampPanToBounds() {
    const vp = modal.getBoundingClientRect();              // viewport we want to fill
    const imgRect = modalImg.getBoundingClientRect();      // current (scaled) box
    // Recover the unscaled display size (the size the browser laid out at scale=1)
    const baseW = imgRect.width / currentScale;
    const baseH = imgRect.height / currentScale;

    const scaledW = baseW * currentScale;
    const scaledH = baseH * currentScale;

    // For origin 0 0, the image’s screen X range is [translateX, translateX + scaledW]
    // We clamp so there is no blank space unless the image is smaller than the viewport,
    // in which case we center and disable panning in that axis.
    const minTx = Math.min(0, vp.width - scaledW);
    const maxTx = 0;

    const minTy = Math.min(0, vp.height - scaledH);
    const maxTy = 0;

    if (scaledW <= vp.width) {
        // Center horizontally
        translateX = (vp.width - scaledW) / 2;
    } else {
        translateX = Math.max(minTx, Math.min(translateX, maxTx));
    }

    if (scaledH <= vp.height) {
        // Center vertically
        translateY = (vp.height - scaledH) / 2;
    } else {
        translateY = Math.max(minTy, Math.min(translateY, maxTy));
    }
}


/* ===========================
 * LAYOUT / SEARCH
 * =========================== */

function setLayout(type, manual = true) {
    imageGrid.classList.remove('grid', 'list');
    imageGrid.classList.add(type);
    if (type === 'grid') {
        gridIcon.classList.add('active');
        listIcon.classList.remove('active');
    } else {
        listIcon.classList.add('active');
        gridIcon.classList.remove('active');
    }
    if (manual) {
        userSelectedLayout = type;
        localStorage.setItem('preferredLayout', type);
    }
}

function updateLayoutBasedOnWidth() {
    const containerWidth = imageGrid.offsetWidth;
    const columnWidth = 280 + 32; // card width + gap
    const columns = Math.floor(containerWidth / columnWidth);

    const toggleIconsEl = document.getElementById('toggleIcons');
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (columns < 2) {
        toggleIconsEl.style.display = 'none';
        if (!searchContainer.classList.contains('active')) {
            searchContainer.classList.add('active');
            searchBtn.classList.add('active');
        }
        searchBtn.disabled = true;
        if (userSelectedLayout !== 'list') setLayout('list', false);
    } else {
        toggleIconsEl.style.display = 'inline-flex';
        if (searchWasInitiallyClosed && searchInput.value.trim() === '') {
            searchContainer.classList.remove('active');
            searchBtn.classList.remove('active');
        }
        searchBtn.disabled = false;
        if (userSelectedLayout === 'list') setLayout('list', false);
        else setLayout('grid', false);
    }
}

function toggleSearch() {
    const container = document.querySelector('.search-container');
    const input = document.getElementById('search-input');
    const button = document.getElementById('search-btn');
    const nowActive = !container.classList.contains('active');

    container.classList.toggle('active');
    button.classList.toggle('active', nowActive);

    if (nowActive) {
        searchWasInitiallyClosed = false;
        input.focus();
    } else {
        input.value = '';
        searchWasInitiallyClosed = true;
        filterImages();
    }
}

/* ===========================
 * FAVORITES (localStorage)
 * =========================== */

function getFavorites() {
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favs) {
    localStorage.setItem('favorites', JSON.stringify(favs));
}

/** Return the set of favorite keys representing "all images".
 *  - normal files use their filename
 *  - price_of_* collapses to the single group key POF_FAV_KEY
 */
function getAllFavoriteKeys() {
    const keys = new Set();
    if (!Array.isArray(imageList) || imageList.length === 0) return keys;

    let hasPriceOf = false;
    for (const img of imageList) {
        if (!img || !img.filename) continue;
        if (img.filename.startsWith(POF_BASE)) {
            hasPriceOf = true;
        } else {
            keys.add(img.filename);
        }
    }
    if (hasPriceOf) keys.add(POF_FAV_KEY);
    return keys;
}

/** Update all grid stars + modal star to reflect current favorites array. */
function refreshFavoriteStarsUI() {
    const favs = new Set(getFavorites());

    // Grid stars
    document.querySelectorAll('.favorite-star').forEach(star => {
        const key = star.getAttribute('data-filename'); // may be POF_FAV_KEY
        const on = favs.has(key) || (key !== POF_FAV_KEY && favs.has(POF_FAV_KEY) && /^price_of_/.test(key));
        star.textContent = on ? '★' : '☆';
        star.classList.toggle('filled', on);
    });

    // Modal star
    if (modal && modal.style.display === 'flex') {
        const cur = visibleImages[currentIndex];
        if (cur) {
            const key = cur.filename.startsWith(POF_BASE) ? POF_FAV_KEY : cur.filename;
            const on = favs.has(key);
            modalFavBtn.textContent = on ? '★' : '☆';
            modalFavBtn.classList.toggle('filled', on);
        }
    }
}

function favoriteAll() {
    const all = Array.from(getAllFavoriteKeys());
    saveFavorites(all);
    refreshFavoriteStarsUI();
    // If currently filtering by favorites, re-render to reveal everything
    if (showFavoritesOnly) filterImages();
}

function unfavoriteAll() {
    saveFavorites([]);
    refreshFavoriteStarsUI();
    // If filtering by favorites, the grid could go empty → re-render for message
    if (showFavoritesOnly) filterImages();
}

function isFavorite(filename) {
    const favs = getFavorites();
    if (filename.startsWith(POF_BASE)) {
        // Group favorite applies to any price_of_* item (defensively accept legacy per-file entries)
        return favs.includes(POF_FAV_KEY) || favs.some(f => /^price_of_/.test(f));
    }
    return favs.includes(filename);
}

function toggleFavorite(filename, starElem) {
    const favKey = filename.startsWith(POF_BASE) ? POF_FAV_KEY : filename;
    let favs = getFavorites();
    const index = favs.indexOf(favKey);

    if (index !== -1) {
        favs.splice(index, 1);
        starElem.textContent = '☆';
        starElem.classList.remove('filled');
    } else {
        // If toggling Price Of, remove any legacy per-file entries and keep only the group key
        if (favKey === POF_FAV_KEY) {
            favs = favs.filter(f => !/^price_of_/.test(f));
        }
        favs.push(favKey);
        starElem.textContent = '★';
        starElem.classList.add('filled');
    }

    saveFavorites(favs);

    // In favorites-only view, remove card immediately if it was unstarred
    if (showFavoritesOnly && index !== -1) {
        filterImages();
    }
}

// One-time migration for legacy price_of_* favorites → group key
function migratePriceOfFavorites() {
    let favs = getFavorites();
    const hadLegacy = favs.some(f => /^price_of_/.test(f));
    if (!hadLegacy) return;

    favs = favs.filter(f => !/^price_of_/.test(f));
    if (!favs.includes(POF_FAV_KEY)) favs.push(POF_FAV_KEY);
    saveFavorites(favs);
}

/* ===========================
 * GRID RENDERING & FILTERING
 * =========================== */

function filterImages() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('image-grid');
    grid.innerHTML = '';

    visibleImages = imageList.filter(({ title, description, filename }) => {
        const { inTitle, inDesc } = readSearchPrefs();

        // If query is empty, match everything (then favorites filter applies)
        let matchesSearch = true;
        if (query) {
            const hayTitle = inTitle ? (title || '').toLowerCase() : '';
            const hayDesc = inDesc ? (description || '').toLowerCase() : '';
            matchesSearch = hayTitle.includes(query) || hayDesc.includes(query);
        }

        const isFav = !showFavoritesOnly || isFavorite(filename);
        return matchesSearch && isFav;
    });

    // "No favorites" message visibility
    const message = document.getElementById('no-favorites-message');
    if (showFavoritesOnly && visibleImages.length === 0) {
        message.style.display = 'block';
    } else {
        message.style.display = 'none';
    }

    // Build each card
    visibleImages.forEach(({ filename, title, description }, index) => {
        const container = document.createElement('div');

        const titleElem = document.createElement('div');
        titleElem.className = 'chart-title';
        titleElem.textContent = title;
        titleElem.dataset.gridIndex = index;

        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';

        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';

        const spinner = document.createElement('div');
        spinner.className = 'chart-loading';

        const img = document.createElement('img');
        img.className = 'grid-thumb';
        img.dataset.gridIndex = index;
        img.alt = title;
        img.style.opacity = 0;
        img.onload = () => { spinner.remove(); img.style.opacity = 1; };
        img.onerror = () => { spinner.remove(); img.style.opacity = 1; };
        img.onclick = () => openModalByIndex(index);
        img.src = `final_frames/${filename}`;

        // Star (favorites)
        const star = document.createElement('div');
        star.className = 'favorite-star';
        const favOn = isFavorite(filename);
        star.textContent = favOn ? '★' : '☆';
        if (favOn) star.classList.add('filled');

        // Use group key for price_of_* so grid + modal share the same toggle target
        const favKeyForThisCard = filename.startsWith(POF_BASE) ? POF_FAV_KEY : filename;
        star.setAttribute('data-filename', favKeyForThisCard);
        star.onclick = (e) => { e.stopPropagation(); toggleFavorite(filename, star); };

        chartContainer.appendChild(star);
        chartWrapper.appendChild(spinner);
        chartWrapper.appendChild(img);
        chartContainer.appendChild(chartWrapper);

        const desc = document.createElement('div');
        desc.className = 'chart-description';
        desc.textContent = description;
        desc.dataset.gridIndex = index;

        chartContainer.appendChild(desc);
        container.appendChild(titleElem);
        container.appendChild(chartContainer);
        grid.appendChild(container);
    });

    updateLayoutBasedOnWidth();
}

/* ===========================
 * MODAL OPEN/CLOSE & SWIPES
 * =========================== */

// Adjust safe padding in landscape on small screens so controls don't overlap the image
function updateModalSafePadding() {
    const controls = document.querySelector('.modal-controls');
    const isSmallLandscape = window.matchMedia('(max-width: 900px) and (orientation: landscape)').matches;

    if (!controls || !isSmallLandscape || modal.style.display !== 'flex') {
        modal.style.removeProperty('--controls-offset');
        return;
    }

    // Measure height; clamp reserved space (a bit under real height to let image tuck)
    const h = controls.getBoundingClientRect().height;
    const offset = Math.max(20, Math.min(h - 6, 44));
    modal.style.setProperty('--controls-offset', offset + 'px');
}

function openModalByIndex(index) {
    const image = visibleImages[index];
    if (!image) return;

    currentIndex = index;
    modal.style.display = 'flex';
    // Reset zoom/pan state for the new image
    isPinching = false;
    isPanning = false;
    gestureConsumed = false;
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    pinchFocus = null;
    modalImg.style.transform = '';
    modalImg.style.transformOrigin = '0 0';
    modal.classList.remove('zoomed');
    updateModalSafePadding();
    setTimeout(updateModalSafePadding, 0); // after layout/wrap
    document.body.style.overflow = 'hidden';

    // Post links for this image
    setModalLinks({
        x: image.latest_x || '',
        nostr: image.latest_nostr || '',
        youtube: image.latest_youtube || ''
    });

    // Populate modal controls according to file type
    populateYearSelect();
    const fname = image.filename;

    if (isBvgFile(fname)) {
        showYearControls(true); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(false); showMyrControls(false);
        const chosenYear = extractBvgYear(fname) || getStoredBvgYear();
        yearSelect.value = chosenYear;
        setBvgYear(chosenYear);
    } else if (isDominanceFile(fname)) {
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(true); showCoinControls(false); showMyrControls(false);
        const unit = domUnitFromFilename(fname) || getStoredDominanceUnit();
        dominanceSelect.value = unit;
        setDominanceUnit(unit);
    } else if (isDalFile(fname)) {
        showYearControls(false); showScaleControls(true); showPriceOfControls(false); showDominanceControls(false); showCoinControls(false); showMyrControls(false);
        const sc = dalScaleFromFilename(fname) || getStoredDalScale();
        scaleSelect.value = sc;
        setDalScale(sc);
    } else if (isPriceOfFile(fname)) {
        showYearControls(false); showScaleControls(false); showPriceOfControls(true); showDominanceControls(false); showCoinControls(false); showMyrControls(false);
        populatePriceOfSelect();
        let chosenSlug = pofSlugFromFilename(fname) || getStoredPofItem();
        if (!PRICE_OF_OPTIONS.some(o => o.slug === chosenSlug)) {
            chosenSlug = PRICE_OF_OPTIONS.find(o => o.slug === 'ground_beef')?.slug || PRICE_OF_OPTIONS[0]?.slug;
        }
        priceOfSelect.value = chosenSlug;
        const meta = PRICE_OF_META[chosenSlug];
        if (meta) applyPostLinksFromMeta(meta);
        setPriceOfItem(chosenSlug);
    } else if (isCoinFile(fname)) {
        // Single "Coins" card
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(true); showMyrControls(false);
        populateCoinSelect();
        let chosen = coinSlugFromFilename(fname) || getStoredCoinSlug();
        if (!COIN_OPTIONS.some(o => o.slug === chosen)) {
            chosen = COIN_OPTIONS[0]?.slug || 'wholecoins';
        }
        coinSelect.value = chosen;
        setCoinType(chosen);
    } else if (isMyrFile(fname)) {
        // Monthly/Yearly Returns dropdown
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(false); showMyrControls(true);

        // Build options (once)
        populateMyrSelect();

        // Select from filename if it has a range; otherwise default
        const chosenRange = myrRangeFromFilename(fname) || MYR_DEFAULT_RANGE;
        myrSelect.value = chosenRange;
        setMyrRange(chosenRange);
    } else {
        // Plain image
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(false); showMyrControls(false);
        setModalImageAndCenter(fname, image.title);
        modalImg.alt = image.title;
        replaceUrlForFilename(fname);
    }

    // Star state (uses possibly-updated filename)
    const fav = isFavorite(visibleImages[currentIndex].filename);
    modalFavBtn.textContent = fav ? '★' : '☆';
    modalFavBtn.classList.toggle('filled', fav);
}

function closeModal() {
    modal.style.display = 'none';
    history.replaceState(null, '', '/');
    document.body.style.overflow = '';

    if (justUnstarredInModal) {
        justUnstarredInModal = false;
        filterImages();
    }

    showYearControls(false);
    showScaleControls(false);
    showPriceOfControls(false);
    showMyrControls(false);
    showDominanceControls(false);
    showCoinControls(false);

    // If closing on a MYR variant, reset grid/model back to default png
    try {
        const cur = visibleImages[currentIndex];
        if (cur && isMyrFile(cur.filename) && cur.filename !== `${MYR_BASE}.png`) {
            const defaultFile = `${MYR_BASE}.png`;
            cur.filename = defaultFile;
            updateGridThumbAtCurrent(defaultFile);
        }
    } catch (e) { /* ignore if index changed */ }

    if (tempNonFavInjected) {
        tempNonFavInjected = false;
        // Rebuild the grid and visibleImages according to the active filters
        filterImages();
    }

    // Reset zoom/pan state on close
    isPinching = false;
    isPanning = false;
    gestureConsumed = false;
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    pinchFocus = null; // <-- add this line
    modalImg.style.transform = '';
    modalImg.style.transformOrigin = '';
    modal.classList.remove('zoomed');
    modal.style.removeProperty('--controls-offset');
}

// Horizontal swipe → prev/next image
function handleSwipe() {
    if (isPinching || currentScale > 1.001 || modal.classList.contains('zoomed')) return;
    const swipeDistance = touchEndX - touchStartX;
    const minSwipe = 50;
    if (Math.abs(swipeDistance) > minSwipe) {
        if (swipeDistance < 0) nextImage();
        else prevImage();
    }
}

// Vertical swipe → hide/show modal controls
function handleVerticalSwipe() {
    if (isPinching || currentScale > 1.001 || modal.classList.contains('zoomed')) return;
    const deltaY = touchEndY - touchStartY;
    const threshold = 50;
    const controls = document.querySelector('.modal-controls');

    if (Math.abs(deltaY) > threshold) {
        if (deltaY < 0) controls.classList.add('hidden'); // swipe up
        else controls.classList.remove('hidden');         // swipe down
    }
}

/* ===== Pinch to Zoom (two-finger) on modal image ===== */

// ----- Pinch & Pan on the full-size image -----
modalImg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        isPinching = true;
        gestureConsumed = true;

        // ensure layout is in "zoom mode" before measuring
        modal.classList.add('zoomed');

        startPinchDistance = distance(e.touches);
        startScale = currentScale;

        const { x, y } = midpoint(e.touches);
        const { u, v, xRel, yRel } = screenPointToImageLocal(x, y);
        pinchFocus = { u, v, xRel, yRel };
    } else if (e.touches.length === 1 && currentScale > 1) {
        isPanning = true;
        gestureConsumed = true;
        panStartX = e.touches[0].clientX - translateX;
        panStartY = e.touches[0].clientY - translateY;
    }
}, { passive: false });

modalImg.addEventListener('touchmove', (e) => {
    if (isPinching && e.touches.length === 2) {
        e.preventDefault();

        const rawScale = startScale * (distance(e.touches) / startPinchDistance);
        currentScale = clamp(rawScale, MIN_SCALE, MAX_SCALE);

        if (pinchFocus) {
            // Maintain: pinchFocus.u * currentScale + translateX = pinchFocus.xRel
            // ⇒ translateX = xRel - u * currentScale  (same for Y)
            translateX = pinchFocus.xRel - pinchFocus.u * currentScale;
            translateY = pinchFocus.yRel - pinchFocus.v * currentScale;
        }

        // When scale nearly identity, recenter
        if (currentScale <= 1.0001) {
            currentScale = 1;
            translateX = 0;
            translateY = 0;
        }

        clampPanToBounds();
        applyTransform();
    } else if (isPanning && e.touches.length === 1 && currentScale > 1) {
        e.preventDefault(); // stop scrolling while panning
        translateX = e.touches[0].clientX - panStartX;
        translateY = e.touches[0].clientY - panStartY;
        clampPanToBounds();
        applyTransform();
    }
}, { passive: false });

modalImg.addEventListener('touchend', (e) => {
    // If we went from 2 touches to 1, end pinch and start a pan from the remaining finger
    if (isPinching && e.touches.length === 1) {
        isPinching = false;
        pinchFocus = null; // prevent stale reuse
        isPanning = currentScale > 1;
        if (isPanning) {
            const t = e.touches[0];
            panStartX = t.clientX - translateX;
            panStartY = t.clientY - translateY;
        }
        return; // we handled this path
    }
    // If all fingers lifted
    if (e.touches.length === 0) {
        isPinching = false;
        isPanning = false;
        pinchFocus = null;
        // Snap back to identity if basically not zoomed
        if (currentScale <= 1.001) {
            currentScale = 1;
            modal.classList.remove('zoomed');
            // Keep using a transform at scale 1 so the image stays centered
            centerImageAtScale1();
        }
        // Allow swipes again on next gesture
        setTimeout(() => { gestureConsumed = false; }, 0);
    }
});

// ----- Double-tap to reset & perfectly center -----
modalImg.addEventListener('touchend', (e) => {
    const now = Date.now();

    if (e.touches.length === 0 && e.changedTouches.length === 1 && !isPinching && !isPanning) {
        const delta = now - lastTapTime;
        lastTapTime = now;

        if (delta < DOUBLE_TAP_DELAY) { // double-tap
            e.preventDefault();

            // Compute exact centered target first, then animate to it
            const { baseW, baseH, vpW, vpH } = computeBaseSizeAtScale1();

            currentScale = 1;
            translateX = (vpW - baseW) / 2;
            translateY = (vpH - baseH) / 2;

            modalImg.style.transition = 'transform 0.25s ease-out';
            applyTransform();
            modal.classList.remove('zoomed');
            pinchFocus = null;

            setTimeout(() => { modalImg.style.transition = ''; }, 300);
        }
    }
});

modalImg.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const { baseW, baseH, vpW, vpH } = computeBaseSizeAtScale1();

    currentScale = 1;
    translateX = (vpW - baseW) / 2;
    translateY = (vpH - baseH) / 2;

    modalImg.style.transition = 'transform 0.25s ease-out';
    applyTransform();
    modal.classList.remove('zoomed');
    pinchFocus = null;

    setTimeout(() => { modalImg.style.transition = ''; }, 300);
});

modalImg.addEventListener('touchcancel', () => {
    isPinching = false;
    isPanning = false;
    pinchFocus = null;
    // optional: snap back if nearly identity
    if (currentScale <= 1.001) {
        currentScale = 1;
        modal.classList.remove('zoomed');
        // Keep centered instead of clearing the transform
        centerImageAtScale1();
    }
    gestureConsumed = false;
});

function prevImage() {
    if (justUnstarredInModal) {
        justUnstarredInModal = false;
        filterImages();  // remove unstarred image now that user moved on
    }
    const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
    openModalByIndex(prevIndex);
}

function nextImage() {
    if (justUnstarredInModal) {
        justUnstarredInModal = false;
        filterImages();  // remove unstarred image now that user moved on
    }
    const nextIndex = (currentIndex + 1) % visibleImages.length;
    openModalByIndex(nextIndex);
}

function toggleFavoriteFromModal() {
    const filename = visibleImages[currentIndex].filename;
    const favKey = filename.startsWith(POF_BASE) ? POF_FAV_KEY : filename;

    let favs = getFavorites();
    const index = favs.indexOf(favKey);

    // The grid star uses the same data-filename key
    const gridStar = document.querySelector(`.favorite-star[data-filename="${favKey}"]`);

    if (index !== -1) {
        favs.splice(index, 1);
        modalFavBtn.textContent = '☆';
        modalFavBtn.classList.remove('filled');
        if (gridStar) { gridStar.textContent = '☆'; gridStar.classList.remove('filled'); }
    } else {
        if (favKey === POF_FAV_KEY) {
            favs = favs.filter(f => !/^price_of_/.test(f)); // drop legacy per-file entries
        }
        favs.push(favKey);
        modalFavBtn.textContent = '★';
        modalFavBtn.classList.add('filled');
        if (gridStar) { gridStar.textContent = '★'; gridStar.classList.add('filled'); }
    }

    saveFavorites(favs);

    // If in favorites-only view and unstarred, remove image after user navigates
    if (showFavoritesOnly && index !== -1) {
        justUnstarredInModal = true;
    }
}

/* ===========================
 * MODULE: Bitcoin vs Gold (BVG)
 * =========================== */

function isBvgFile(fname) { return fname.startsWith(BVG_BASE); }
function bvgFilenameForYear(y) { return `${BVG_BASE}_${y}.png`; }
function extractBvgYear(fname) {
    const m = fname.match(/bitcoin_vs_gold_(\d{4})\.png$/);
    return m ? m[1] : null;
}
function getStoredBvgYear() { return localStorage.getItem(BVG_STORAGE_KEY) || '2018'; }
function setStoredBvgYear(y) { localStorage.setItem(BVG_STORAGE_KEY, y); }

function populateYearSelect() {
    if (!yearSelect || yearSelect.options.length) return;
    yearSelect.innerHTML = BVG_YEARS.map(y => `<option value="${y}">${y}</option>`).join('');
}

function isValidBvgYear(yStr) {
    const y = parseInt(yStr, 10);
    return Number.isInteger(y) && BVG_YEARS.includes(y);
}

function setBvgYear(year) {
    const oldFilename = visibleImages[currentIndex].filename;
    const newFilename = bvgFilenameForYear(year);

    setStoredBvgYear(year);

    setModalImageAndCenter(newFilename, `Bitcoin vs Gold (${year})`);
    replaceUrlForFilename(newFilename);

    visibleImages[currentIndex].filename = newFilename;
    updateGridThumbAtCurrent(newFilename);

    migrateFavoriteFilename(oldFilename, newFilename);
}

function cycleBvgYear(direction) {
    const current = parseInt(yearSelect.value, 10);
    const idx = BVG_YEARS.indexOf(current);
    if (idx === -1) return;

    // BVG_YEARS order is [2025, 2024, ..., 2013]
    const delta = direction === 'up' ? -1 : 1;
    const len = BVG_YEARS.length;
    const newIdx = (idx + delta + len) % len;

    const newYear = BVG_YEARS[newIdx];
    yearSelect.value = newYear;
    setBvgYear(newYear);
}

/* ===========================
 * MODULE: Days at a Loss (DAL)
 * =========================== */

function isDalFile(fname) { return fname.startsWith(DAL_BASE); }
function dalScaleFromFilename(fname) { return /_log\.png$/.test(fname) ? 'log' : 'linear'; }
function dalFilenameForScale(scale) { return scale === 'log' ? `${DAL_BASE}_log.png` : `${DAL_BASE}.png`; }
function getStoredDalScale() { return localStorage.getItem(DAL_STORAGE_KEY) || 'linear'; }
function setStoredDalScale(s) { localStorage.setItem(DAL_STORAGE_KEY, s); }

function setDalScale(scale) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isDalFile(oldFilename)) return;

    const newFilename = dalFilenameForScale(scale);

    setStoredDalScale(scale);

    setModalImageAndCenter(newFilename, `Days at a Loss (${scale})`);
    replaceUrlForFilename(newFilename);

    visibleImages[currentIndex].filename = newFilename;
    updateGridThumbAtCurrent(newFilename);

    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}

function cycleDalScale(direction) {
    const current = (scaleSelect?.value) || getStoredDalScale();
    const idx = DAL_SCALES.indexOf(current);
    if (idx === -1) return;

    const delta = direction === 'up' ? -1 : 1;
    const len = DAL_SCALES.length;
    const newIdx = (idx + delta + len) % len;

    const next = DAL_SCALES[newIdx];
    if (scaleSelect) scaleSelect.value = next;
    setDalScale(next);
}

/* ===========================
 * MODULE: Dominance (USD/BTC)
 * =========================== */

function isDominanceFile(fname) { return fname.startsWith(DOM_BASE); }
function domUnitFromFilename(fname) { return /_btc\.png$/.test(fname) ? 'btc' : 'usd'; }
function domFilenameForUnit(u) { return u === 'btc' ? `${DOM_BASE}_btc.png` : `${DOM_BASE}.png`; }

function getStoredDominanceUnit() {
    return getCookie(DOM_STORAGE_KEY) || localStorage.getItem(DOM_STORAGE_KEY) || 'usd';
}
function setStoredDominanceUnit(u) {
    setCookie(DOM_STORAGE_KEY, u, 365);
    localStorage.setItem(DOM_STORAGE_KEY, u);
}

function setDominanceUnit(unit) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isDominanceFile(oldFilename)) return;

    const newFilename = domFilenameForUnit(unit);

    setStoredDominanceUnit(unit);

    setModalImageAndCenter(newFilename, `Bitcoin Dominance (${unit.toUpperCase()})`);
    replaceUrlForFilename(newFilename);

    visibleImages[currentIndex].filename = newFilename;
    updateGridThumbAtCurrent(newFilename);

    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}

function cycleDominance(direction) {
    const current = (dominanceSelect?.value) || getStoredDominanceUnit();
    const idx = DOM_UNITS.indexOf(current);
    if (idx === -1) return;

    const delta = direction === 'up' ? -1 : 1;
    const len = DOM_UNITS.length;
    const newIdx = (idx + delta + len) % len;

    const next = DOM_UNITS[newIdx];
    if (dominanceSelect) dominanceSelect.value = next;
    setDominanceUnit(next);
}

/* ===========================
 * MODULE: Price Of (price_of_*)
 * =========================== */

function isPriceOfFile(fname) { return fname.startsWith(POF_BASE); }

function pofSlugFromFilename(fname) {
    const m = fname.match(/^price_of_([a-z0-9_]+)\.png$/);
    return m ? m[1] : null;
}

function pofFilenameForSlug(slug) { return `${POF_BASE}${slug}.png`; }

function slugToTitle(slug) {
    return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildPriceOfOptionsFromList(list) {
    const bySlug = new Map();
    list.forEach(img => {
        const m = img.filename.match(/^price_of_([a-z0-9_]+)\.png$/);
        if (!m) return;
        const slug = m[1];
        if (!bySlug.has(slug)) {
            bySlug.set(slug, {
                slug,
                label: slugToTitle(slug),
                filename: `price_of_${slug}.png`,
                // capture post links + meta for later swaps
                title: img.title,
                description: img.description,
                latest_x: img.latest_x || '',
                latest_nostr: img.latest_nostr || '',
                latest_youtube: img.latest_youtube || ''
            });
        }
    });

    PRICE_OF_OPTIONS = Array.from(bySlug.values())
        .sort((a, b) => a.label.localeCompare(b.label));
    PRICE_OF_META = PRICE_OF_OPTIONS.reduce((acc, o) => (acc[o.slug] = o, acc), {});
}

function populatePriceOfSelect() {
    if (!priceOfSelect) return;
    priceOfSelect.innerHTML = PRICE_OF_OPTIONS
        .map(o => `<option value="${o.slug}">${o.label}</option>`)
        .join('');
}

function applyPostLinksFromMeta(meta) {
    setModalLinks({
        x: meta.latest_x || '',
        nostr: meta.latest_nostr || '',
        youtube: meta.latest_youtube || ''
    });
}

function getStoredPofItem() {
    return getCookie(POF_STORAGE_KEY) || localStorage.getItem(POF_STORAGE_KEY) || 'ground_beef';
}
function setStoredPofItem(slug) {
    setCookie(POF_STORAGE_KEY, slug, 365);
    localStorage.setItem(POF_STORAGE_KEY, slug);
}

function setPriceOfItem(slug) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isPriceOfFile(oldFilename)) return;

    const newFilename = pofFilenameForSlug(slug);
    const fallbackTitle = `Price of ${slugToTitle(slug)}`;
    const meta = PRICE_OF_META[slug] || { title: fallbackTitle, description: '' };

    // Persist selection
    setStoredPofItem(slug);

    // Modal + URL
    setModalImageAndCenter(newFilename, meta.title || fallbackTitle);
    replaceUrlForFilename(newFilename);

    // Modal post links
    applyPostLinksFromMeta(meta);

    // Update in-memory item (so future opens use correct text/links)
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title: meta.title || visibleImages[currentIndex].title || fallbackTitle,
        description: meta.description || visibleImages[currentIndex].description || '',
        latest_x: meta.latest_x || '',
        latest_nostr: meta.latest_nostr || '',
        latest_youtube: meta.latest_youtube || ''
    });

    // Live update the grid UI for this card
    const titleEl = document.querySelector(`.chart-title[data-grid-index="${currentIndex}"]`);
    if (titleEl) titleEl.textContent = meta.title || fallbackTitle;

    const descEl = document.querySelector(`.chart-description[data-grid-index="${currentIndex}"]`);
    if (descEl) descEl.textContent = meta.description || '';

    const gridImg = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    const cardContainer = gridImg ? gridImg.closest('.chart-container') : null;
    if (cardContainer) {
        const tip = meta.description || meta.title || fallbackTitle;
        cardContainer.setAttribute('title', tip);
        gridImg.alt = meta.title || fallbackTitle;
    }

    updateGridThumbAtCurrent(newFilename);

    // Reflect group favorite state in both modal + grid star
    const favOn = isFavorite(newFilename);
    modalFavBtn.textContent = favOn ? '★' : '☆';
    modalFavBtn.classList.toggle('filled', favOn);

    const gridStar = document.querySelector(`.favorite-star[data-filename="${POF_FAV_KEY}"]`);
    if (gridStar) {
        gridStar.textContent = favOn ? '★' : '☆';
        gridStar.classList.toggle('filled', favOn);
    }

    updateModalSafePadding();
}

function cyclePriceOf(direction) {
    if (!priceOfSelect) return;
    const opts = Array.from(priceOfSelect.options);
    if (opts.length === 0) return;

    const slugs = opts.map(o => o.value);
    const currentSlug = priceOfSelect.value || getStoredPofItem();
    const idx = slugs.indexOf(currentSlug);
    if (idx === -1) return;

    const delta = direction === 'up' ? -1 : 1;
    const len = slugs.length;
    const newIdx = (idx + delta + len) % len;

    const nextSlug = slugs[newIdx];
    priceOfSelect.value = nextSlug;
    setPriceOfItem(nextSlug);
}

/* ===========================
 * MODULE: Coins (single card)
 * =========================== */

function isCoinFile(fname) {
    return /^(.+)\.png$/.test(fname) && COIN_ORDER.some(slug => `${slug}.png` === fname);
}
function coinSlugFromFilename(fname) {
    const m = fname.match(/^([a-z0-9_]+)\.png$/i);
    return m ? m[1] : null;
}
function coinFilenameForSlug(slug) { return `${slug}.png`; }

function getStoredCoinSlug() {
    return getCookie(COIN_STORAGE_KEY) || localStorage.getItem(COIN_STORAGE_KEY) || 'wholecoins';
}
function setStoredCoinSlug(slug) {
    setCookie(COIN_STORAGE_KEY, slug, 365);
    localStorage.setItem(COIN_STORAGE_KEY, slug);
}

function buildCoinOptionsFromList(list) {
    // Pick only the 8 coin visuals (respect COIN_ORDER)
    const bySlug = new Map();
    list.forEach(img => {
        const slug = coinSlugFromFilename(img.filename);
        if (!slug || !COIN_ORDER.includes(slug)) return;

        // Human-friendly label = title without trailing " (…)" if present
        const label = (img.title || slug).replace(/\s*\(.*?\)\s*$/, '');

        bySlug.set(slug, {
            slug,
            label,
            filename: img.filename,
            title: img.title || label,
            description: img.description || '',
            latest_x: img.latest_x || '',
            latest_nostr: img.latest_nostr || '',
            latest_youtube: img.latest_youtube || ''
        });
    });

    COIN_OPTIONS = COIN_ORDER
        .filter(slug => bySlug.has(slug))
        .map(slug => bySlug.get(slug));

    COIN_META = COIN_OPTIONS.reduce((acc, o) => (acc[o.slug] = o, acc), {});
}

function populateCoinSelect() {
    if (!coinSelect) return;
    coinSelect.innerHTML = COIN_OPTIONS
        .map(o => `<option value="${o.slug}">${o.label}</option>`)
        .join('');
}

function setCoinType(slug) {
    const image = visibleImages[currentIndex];
    if (!image || !isCoinFile(image.filename)) return;

    const meta = COIN_META[slug];
    const oldFilename = image.filename;
    const newFilename = coinFilenameForSlug(slug);

    // Persist
    setStoredCoinSlug(slug);

    // Modal image + URL
    setModalImageAndCenter(newFilename, meta?.title || image.title || slug);
    replaceUrlForFilename(newFilename);

    // Modal links
    setModalLinks({
        x: meta?.latest_x || '',
        nostr: meta?.latest_nostr || '',
        youtube: meta?.latest_youtube || ''
    });

    // Update in-memory model (so grid/modal text is consistent)
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title: meta?.title || image.title,
        description: meta?.description || image.description,
        latest_x: meta?.latest_x || '',
        latest_nostr: meta?.latest_nostr || '',
        latest_youtube: meta?.latest_youtube || ''
    });

    // Live update grid title/desc and thumb
    const titleEl = document.querySelector(`.chart-title[data-grid-index="${currentIndex}"]`);
    if (titleEl) titleEl.textContent = meta?.title || image.title;

    const descEl = document.querySelector(`.chart-description[data-grid-index="${currentIndex}"]`);
    if (descEl) descEl.textContent = meta?.description || image.description;

    updateGridThumbAtCurrent(newFilename, meta?.title || image.title || slug);

    const gridImg = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    const cardContainer = gridImg ? gridImg.closest('.chart-container') : null;
    if (cardContainer) {
        const tip = (meta?.description || meta?.title || slug);
        cardContainer.setAttribute('title', tip);
    }

    // Preserve favorites across variant swap
    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}

function cycleCoinType(direction) {
    if (!coinSelect || COIN_OPTIONS.length === 0) return;
    const slugs = COIN_OPTIONS.map(o => o.slug);
    const currentSlug = coinSelect.value || getStoredCoinSlug();
    const idx = slugs.indexOf(currentSlug);
    if (idx === -1) return;

    const delta = direction === 'up' ? -1 : 1;
    const len = slugs.length;
    const newIdx = (idx + delta + len) % len;

    const nextSlug = slugs[newIdx];
    coinSelect.value = nextSlug;
    setCoinType(nextSlug);
}

/* ===========================
 * MODULE: Monthly/Yearly Returns (MYR)
 * =========================== */

function isMyrFile(fname) { return fname.startsWith(MYR_BASE); }

// Parse "monthly_yearly_returns_2010_2014.png" → "2010 - 2014"
// "monthly_yearly_returns.png" → MYR_DEFAULT_RANGE
function myrRangeFromFilename(fname) {
    if (fname === `${MYR_BASE}.png`) return MYR_DEFAULT_RANGE;
    const m = fname.match(/^monthly_yearly_returns_(\d{4})_(\d{4})\.png$/);
    return m ? `${m[1]} - ${m[2]}` : MYR_DEFAULT_RANGE;
}

function populateMyrSelect() {
    if (!myrSelect) return;
    myrSelect.innerHTML = MYR_RANGES.map(r => `<option value="${r}">${r}</option>`).join('');
}

// Keep this so the base PNG represents the default window (2021-2025)
function myrFilenameForRange(rangeLabel) {
    if (!rangeLabel || rangeLabel === MYR_DEFAULT_RANGE) return `${MYR_BASE}.png`;
    const m = rangeLabel.match(/^(\d{4})\s*-\s*(\d{4})$/);
    return m ? `${MYR_BASE}_${m[1]}_${m[2]}.png` : `${MYR_BASE}.png`;
}

function setMyrRange(rangeLabel) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isMyrFile(oldFilename)) return;

    const newFilename = myrFilenameForRange(rangeLabel);

    setModalImageAndCenter(newFilename, `Monthly & Yearly Returns (${rangeLabel})`);
    replaceUrlForFilename(newFilename);

    visibleImages[currentIndex].filename = newFilename;
    updateGridThumbAtCurrent(newFilename);

    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}

// Arrow-key cycling for the MYR dropdown
function cycleMyrRange(direction) {
    if (!myrSelect) return;
    const opts = Array.from(myrSelect.options).map(o => o.value);
    if (!opts.length) return;

    const cur = myrSelect.value || MYR_DEFAULT_RANGE;
    const idx = opts.indexOf(cur);
    const delta = direction === 'up' ? -1 : 1;
    const newIdx = ((idx === -1 ? 0 : idx) + delta + opts.length) % opts.length;

    const next = opts[newIdx];
    myrSelect.value = next;
    setMyrRange(next);
}

/* ===========================
 * FETCH LIST / BUILD VIEW / DEEP LINKS
 * =========================== */

function getImageNameFromPath() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, ''); // remove leading/trailing slashes
    if (!path) return null;
    return path + '.png';
}

fetch("final_frames/image_list.json")
    .then(res => res.json())
    .then(data => {
        imageList = data;

        // Build MYR ranges deterministically from 2010 → current year
        MYR_RANGES = buildMyrRanges(MYR_START_YEAR, THIS_YEAR);
        populateMyrSelect();

        // Build dynamic option lists
        buildPriceOfOptionsFromList(imageList);
        populatePriceOfSelect();

        buildCoinOptionsFromList(imageList);
        populateCoinSelect();

        // Extract coins and non-coins
        const coinSet = new Set(COIN_ORDER.map(s => `${s}.png`));
        const coinsAll = imageList.filter(img => coinSet.has(img.filename));
        const nonCoins = imageList.filter(img => !coinSet.has(img.filename));

        // Determine where to insert the single coin card:
        //   - at index of first coin originally
        //   - fallback: after Dominance; else end
        const firstCoinIdx = imageList.findIndex(img => coinSet.has(img.filename));
        let insertIdx = firstCoinIdx !== -1
            ? firstCoinIdx
            : nonCoins.findIndex(img => img.filename.startsWith('bitcoin_dominance')) + 1;
        if (insertIdx < 0) insertIdx = nonCoins.length;

        // Deep-link handling
        const initialFilename = getImageNameFromPath();
        let urlPofSlug = null;
        let urlCoinSlug = null;

        if (initialFilename && initialFilename.startsWith(POF_BASE)) {
            const s = pofSlugFromFilename(initialFilename);
            if (s && PRICE_OF_OPTIONS.some(o => o.slug === s)) {
                urlPofSlug = s;
                setStoredPofItem(s); // persist only if valid
            }
        }
        if (initialFilename && coinSet.has(initialFilename)) {
            const s = coinSlugFromFilename(initialFilename);
            if (s && COIN_ORDER.includes(s)) {
                urlCoinSlug = s;
                setStoredCoinSlug(s);
            }
        }

        // Build coin card seeded with stored/URL selection; default to 'wholecoins'
        const storedCoinSlug = getStoredCoinSlug();
        const repCoinMeta = COIN_META[storedCoinSlug] || COIN_META['wholecoins'] || COIN_OPTIONS[0];

        let coinCard = null;
        if (repCoinMeta) {
            coinCard = {
                filename: coinFilenameForSlug(repCoinMeta.slug),
                title: repCoinMeta.title,
                description: repCoinMeta.description,
                latest_x: repCoinMeta.latest_x || '',
                latest_nostr: repCoinMeta.latest_nostr || '',
                latest_youtube: repCoinMeta.latest_youtube || ''
            };
        }

        // Compose new imageList with ONE coin card
        if (coinCard) {
            imageList = [
                ...nonCoins.slice(0, insertIdx),
                coinCard,
                ...nonCoins.slice(insertIdx)
            ];
        } else {
            imageList = nonCoins; // if somehow no coin data exists
        }

        // Build representative "Price Of" card (after global_wealth)
        const storedPofSlug = getStoredPofItem();
        const repFilename = pofFilenameForSlug(storedPofSlug);
        const repMeta = PRICE_OF_META[storedPofSlug];

        const nonPof = imageList.filter(img => !isPriceOfFile(img.filename));
        const pofAll = imageList.filter(img => isPriceOfFile(img.filename));

        let pofCard = null;
        if (pofAll.length) {
            const chosen = pofAll.find(img => img.filename === repFilename) || pofAll[0];
            // Seed card with stored selection's filename AND its posts/meta
            pofCard = {
                ...chosen,
                filename: repFilename,
                title: repMeta?.title || chosen.title,
                description: repMeta?.description || chosen.description,
                latest_x: repMeta?.latest_x || '',
                latest_nostr: repMeta?.latest_nostr || '',
                latest_youtube: repMeta?.latest_youtube || ''
            };
        }

        // Insert POF card after global_wealth (or at end)
        if (pofCard) {
            const gwIdx = nonPof.findIndex(img => img.filename.startsWith('global_wealth'));
            if (gwIdx !== -1) {
                imageList = [
                    ...nonPof.slice(0, gwIdx + 1),
                    pofCard,
                    ...nonPof.slice(gwIdx + 1)
                ];
            } else {
                imageList = [...nonPof, pofCard];
            }
        } else {
            imageList = nonPof;
        }

        // Initial render
        visibleImages = [...imageList];
        migratePriceOfFavorites();
        filterImages();

        // Handle deep links for BVG / DAL / DOM
        let urlBvgYear = null;
        if (initialFilename && initialFilename.startsWith('bitcoin_vs_gold_')) {
            const m = initialFilename.match(/bitcoin_vs_gold_(\d{4})\.png$/);
            if (m && isValidBvgYear(m[1])) {
                urlBvgYear = m[1];
                setStoredBvgYear(urlBvgYear); // persist only if valid
            }
        }

        let urlDalScale = null;
        if (initialFilename && initialFilename.startsWith(DAL_BASE)) {
            if (initialFilename === `${DAL_BASE}_log.png`) urlDalScale = 'log';
            else if (initialFilename === `${DAL_BASE}.png`) urlDalScale = 'linear';
            if (urlDalScale) setStoredDalScale(urlDalScale);
        }

        let urlDomUnit = null;
        if (initialFilename && initialFilename.startsWith(DOM_BASE)) {
            if (initialFilename === `${DOM_BASE}_btc.png`) urlDomUnit = 'btc';
            else if (initialFilename === `${DOM_BASE}.png`) urlDomUnit = 'usd';
            if (urlDomUnit) setStoredDominanceUnit(urlDomUnit);
        }

        // Normalize grid cards to stored/URL selections
        const storedBvgYear = getStoredBvgYear();
        imageList = imageList.map(img => {
            if (img.filename.startsWith(BVG_BASE)) {
                return { ...img, filename: `${BVG_BASE}_${storedBvgYear}.png` };
            }
            return img;
        });

        const storedDalScale = getStoredDalScale();
        imageList = imageList.map(img => {
            if (img.filename.startsWith(DAL_BASE)) {
                return { ...img, filename: dalFilenameForScale(storedDalScale) };
            }
            return img;
        });

        const storedDomUnit = getStoredDominanceUnit();
        imageList = imageList.map(img => {
            if (img.filename.startsWith(DOM_BASE)) {
                return { ...img, filename: domFilenameForUnit(storedDomUnit) };
            }
            return img;
        });

        // Re-render grid after normalization
        visibleImages = [...imageList];
        filterImages();

        // Restore layout & favorites toggle
        const savedLayout = localStorage.getItem('preferredLayout');
        if (savedLayout === 'list' || savedLayout === 'grid') setLayout(savedLayout, false);
        if (showFavoritesOnly) document.getElementById('favoritesToggle').classList.add('active');

        // Open modal only when there is a valid target
        if (initialFilename) {
            let opened = false;

            // Try your existing index logic first (it respects variants & stored prefs)
            let openIdx = -1;
            if (urlBvgYear) {
                openIdx = visibleImages.findIndex(img => img.filename === initialFilename);
                if (openIdx === -1) openIdx = visibleImages.findIndex(img => img.filename.startsWith('bitcoin_vs_gold_'));
            } else if (urlDalScale) {
                openIdx = visibleImages.findIndex(img => img.filename === initialFilename);
                if (openIdx === -1) openIdx = visibleImages.findIndex(img => img.filename.startsWith(DAL_BASE));
            } else if (urlPofSlug) {
                openIdx = visibleImages.findIndex(img => img.filename === initialFilename);
                if (openIdx === -1) openIdx = visibleImages.findIndex(img => img.filename.startsWith(POF_BASE));
            } else if (urlDomUnit) {
                openIdx = visibleImages.findIndex(img => img.filename === initialFilename);
                if (openIdx === -1) openIdx = visibleImages.findIndex(img => img.filename.startsWith(DOM_BASE));
            } else if (coinSet.has(initialFilename)) {
                openIdx = visibleImages.findIndex(img => img.filename === initialFilename);
                if (openIdx === -1) openIdx = visibleImages.findIndex(img => isCoinFile(img.filename));
            } else if (!initialFilename.startsWith('bitcoin_vs_gold_')) {
                openIdx = visibleImages.findIndex(img => img.filename === initialFilename);
            }

            if (openIdx !== -1) {
                openModalByIndex(openIdx);
                opened = true;
            }

            // If not found (e.g., filtered out by favorites), open it anyway temporarily.
            if (!opened) {
                if (!openByFilenameAllowingNonFav(initialFilename)) {
                    history.replaceState(null, '', '/');
                }
            }
        }
    })
    .catch(err => {
        imageGrid.textContent = "Failed to load visualizations.";
        console.error(err);
    });

/* ===========================
* SLIDESHOW: Duration control (2^x seconds; x = 1..6)
* =========================== */
const EXP_MIN = 1;
const EXP_MAX = 6;
const THUMB_PX = 16; // keep in sync with CSS thumb size

function expToSecs(exp) { return Math.pow(2, exp); } // 2,4,8,16,32,64
function clampExp(val) { return Math.max(EXP_MIN, Math.min(EXP_MAX, Math.round(val))); }

function positionBubble(rangeEl, bubbleEl) {
  if (!rangeEl || !bubbleEl) return;

  const wrap = rangeEl.parentElement; // .ss-track
  const rect = rangeEl.getBoundingClientRect();
  const padL = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;

  const min = Number(rangeEl.min || 0);
  const max = Number(rangeEl.max || 6);
  const val = Number(rangeEl.value || 0);
  const pct = (val - min) / (max - min);

  // The bubble is absolutely positioned inside .ss-row (sibling), but we want
  // it to align over the thumb center, which lives inside .ss-track with padL.
  const xWithinTrack = pct * (rect.width - THUMB_PX) + THUMB_PX / 2;

  // place the bubble relative to the padded track left edge
  bubbleEl.style.left = `${padL + xWithinTrack}px`;
}

function updateSlideDurationUI(fromUser = false) {
  if (!slideRange || !slideBubble) return;

  if (fromUser) {
    const snapped = clampExp(Number(slideRange.value));
    if (snapped !== Number(slideRange.value)) slideRange.value = String(snapped);
    localStorage.setItem(SLIDE_EXP_KEY, String(snapped));
  }

  const exp  = clampExp(Number(slideRange.value));
  const secs = expToSecs(exp);

  slideRange.setAttribute('aria-valuenow', String(secs));
  slideRange.setAttribute('aria-valuemin', String(expToSecs(EXP_MIN)));
  slideRange.setAttribute('aria-valuemax', String(expToSecs(EXP_MAX)));
  slideRange.setAttribute('aria-valuetext', `${secs} seconds`);

  slideBubble.textContent = `${secs}s`;
  positionBubble(slideRange, slideBubble);
}

// Initialize once layout exists; guard if elements aren’t present
function initSlideDurationControl() {
  if (!slideRange || !slideBubble) return;

  const saved = Number(localStorage.getItem(SLIDE_EXP_KEY));
  const initial = Number.isFinite(saved) ? clampExp(saved) : clampExp(Number(slideRange.value || 2));
  slideRange.value = String(initial);

  requestAnimationFrame(() => updateSlideDurationUI(false));

  window.addEventListener('resize', () => positionBubble(slideRange, slideBubble));
  slideRange.addEventListener('input',  () => updateSlideDurationUI(true));
  slideRange.addEventListener('change', () => updateSlideDurationUI(true));
}

// Prevent outside-click handlers from seeing slider interactions
function bindSliderEventGuards() {
    if (!slideRange) return;

    const stop = (ev) => { ev.stopPropagation(); };
    ['pointerdown', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend']
        .forEach(type => slideRange.addEventListener(type, stop, { passive: true }));

    // The wrapper may also get clicks; guard it too
    const wrap = slideRange.closest('.slideshow-row');
    if (wrap) {
        ['click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(type =>
            wrap.addEventListener(type, stop, { passive: true })
        );
    }
}

// Call from your load initializer alongside the slider init
window.addEventListener('load', () => {
  // header menu defaults
  kebabMenu?.classList.add('hidden');
  kebabBtn?.setAttribute('aria-expanded', 'false');

  // layout + search prefs
  updateLayoutBasedOnWidth();
  initSearchPrefsAndUI();

  // slideshow duration UI + guards
  initSlideDurationControl();
  bindSliderEventGuards();
});

/* ===========================
 * SLIDESHOW: core (autoplay + fade)
 * =========================== */

// Index into visibleImages for slideshow
let slideshowIndex   = 0;
let slideshowPlaying = false;
let slideshowTimer   = null;

// Reuse duration mapping (2^exp seconds); default to 4s if control missing
function getSlideDurationSecs() {
  if (!slideRange) return 4;
  const exp = Number(slideRange.value || 2);
  return Math.pow(2, Math.max(1, Math.min(6, Math.round(exp))));
}

// Internal: actually point the <img> to the given index (no fade logic)
function _applySlide(idx) {
  if (!visibleImages || visibleImages.length === 0) return;
  slideshowIndex = ((idx % visibleImages.length) + visibleImages.length) % visibleImages.length;

  const item = visibleImages[slideshowIndex];
  const alt  = item?.title || item?.description || 'Slideshow image';

  // Fade-out current, then swap src, fade-in onload
  slideshowImg.classList.add('ss-img-hidden');
  const onLoad = () => {
    // Let layout tick, then fade in
    requestAnimationFrame(() => {
      slideshowImg.classList.remove('ss-img-hidden');
    });
    slideshowImg.removeEventListener('load', onLoad);
  };

  slideshowImg.removeEventListener('load', onLoad); // avoid dupes
  slideshowImg.addEventListener('load', onLoad);

  slideshowImg.alt = alt;
  slideshowImg.src = `final_frames/${item.filename}`;
}

function setSlideshowImage(idx, restartTimer = false) {
  _applySlide(idx);

  if (restartTimer) {
    // Manual skip → restart timer using the current duration
    restartSlideshowTimer();
  } else if (slideshowPlaying) {
    // Auto-advance path → immediately schedule the next timeout
    // (don’t wait for onload; image might be cached and not fire it)
    scheduleNextSlide();
  }
}

// Manual navigation
function slideshowNext(restartTimer = true) {
  setSlideshowImage(slideshowIndex + 1, restartTimer);
}
function slideshowPrev(restartTimer = true) {
  setSlideshowImage(slideshowIndex - 1, restartTimer);
}


// Timer control
function clearSlideshowTimer() {
  if (slideshowTimer) {
    clearTimeout(slideshowTimer);
    slideshowTimer = null;
  }
}
function scheduleNextSlide() {
  clearSlideshowTimer();
  if (!slideshowPlaying) return;
  const delayMs = getSlideDurationSecs() * 1000;
  slideshowTimer = setTimeout(() => {
    slideshowNext(false);  // auto-advance (no extra restart)
  }, delayMs);
}
function restartSlideshowTimer() {
  if (!slideshowPlaying) return;
  scheduleNextSlide();
}

// Play/Pause UI state
function updatePlayButton() {
  if (!ssPlayPauseBtn) return;
  if (slideshowPlaying) {
    ssPlayPauseBtn.textContent = '❚❚';
    ssPlayPauseBtn.setAttribute('aria-label', 'Pause slideshow');
    ssPlayPauseBtn.dataset.state = 'playing';
  } else {
    ssPlayPauseBtn.textContent = '▶';
    ssPlayPauseBtn.setAttribute('aria-label', 'Play slideshow');
    ssPlayPauseBtn.dataset.state = 'paused';
  }
}

function playSlideshow() {
  if (!slideshowEl || !visibleImages?.length) return;
  slideshowPlaying = true;
  updatePlayButton();
  scheduleNextSlide();
}
function pauseSlideshow() {
  slideshowPlaying = false;
  updatePlayButton();
  clearSlideshowTimer();
}
function togglePlayPause() {
  if (slideshowPlaying) pauseSlideshow();
  else playSlideshow();
}

// Try to enter true browser fullscreen (best effort)
async function enterFullscreen(el) {
  try {
    if (!document.fullscreenElement) {
      if (el?.requestFullscreen) await el.requestFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    }
  } catch (_) { /* ignore */ }
}

// Leave fullscreen (best effort)
async function exitFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (_) { /* ignore */ }
}

// Open overlay and show current slide
async function openSlideshow(startAt = 0, startPlaying = true) {
  if (!slideshowEl) return;
  if (!visibleImages || visibleImages.length === 0) return;

  // If the modal is open, close it first
  if (modal && modal.style.display === 'flex') closeModal();

  // Show overlay
  slideshowEl.classList.remove('hidden');
  slideshowEl.classList.add('show-ui');   // start with controls visible
  slideshowEl.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // First slide visible immediately (no timer yet)
  _applySlide(startAt);

  // Best-effort fullscreen
  await enterFullscreen(slideshowEl);

  // Autoplay per request
  if (startPlaying) {
    slideshowPlaying = true;
    updatePlayButton();
    scheduleNextSlide();
  } else {
    slideshowPlaying = false;
    updatePlayButton();
  }
}

// Minimal exit (Esc / ×)
async function closeSlideshow() {
  if (!slideshowEl) return;
  slideshowEl.classList.add('hidden');
  slideshowEl.classList.remove('show-ui');
  slideshowEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  pauseSlideshow(); // clears timer
  await exitFullscreen();
}

/* ===========================
 * EVENT LISTENERS
 * =========================== */

// Window/UI responsiveness
window.addEventListener('resize', updateLayoutBasedOnWidth);
window.addEventListener('resize', updateModalSafePadding);
window.addEventListener('load', updateLayoutBasedOnWidth);
window.addEventListener('orientationchange', updateModalSafePadding);
// Direct click listeners on the two menu-check rows (keep menu open)
chkSearchTitles?.addEventListener('click', (e) => { e.stopPropagation(); toggleSearchPref('title'); });
chkSearchDescriptions?.addEventListener('click', (e) => { e.stopPropagation(); toggleSearchPref('desc'); });

// Modal backdrop click → close
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Modal touch gestures
modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});
modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    if (!gestureConsumed) {
        handleSwipe();
        handleVerticalSwipe();
    }
});

// Start Slideshow → open overlay with the first currently visible image and start autoplay
startSlideshowBtn?.addEventListener('click', () => {
  kebabMenu?.classList.add('hidden');
  kebabBtn?.setAttribute('aria-expanded', 'false');
  if (!visibleImages || !visibleImages.length) return;
  openSlideshow(0, true);
});

// Slideshow overlay controls
ssExitBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeSlideshow(); });
ssNextBtn?.addEventListener('click', (e) => { e.stopPropagation(); slideshowNext(true); });
ssPrevBtn?.addEventListener('click', (e) => { e.stopPropagation(); slideshowPrev(true); });
ssPlayPauseBtn?.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); });

// Keyboard handling while slideshow is visible
document.addEventListener('keydown', (e) => {
  if (!slideshowEl || slideshowEl.classList.contains('hidden')) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    closeSlideshow();
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    slideshowNext(true);   // manual → reset timer
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    slideshowPrev(true);   // manual → reset timer
  } else if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();     // space toggles play/pause
  }
});

// If the user changes the duration while playing, restart the timer with the new value
slideRange?.addEventListener('change', () => restartSlideshowTimer());
slideRange?.addEventListener('input',  () => restartSlideshowTimer());

/* ===========================
 * KEBAB MENU (⋯) EVENTS
 * =========================== */

// Open/close menu
kebabBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !kebabMenu.classList.contains('hidden');
    kebabMenu.classList.toggle('hidden', isOpen); // close if open, open if closed
    const nowOpen = !isOpen;
    kebabBtn.setAttribute('aria-expanded', String(nowOpen));

    // If menu just opened, give layout a tick and position the bubble
    if (nowOpen) {
        requestAnimationFrame(() => {
            // one more frame helps after CSS transitions (if any)
            requestAnimationFrame(() => updateSlideDurationUI(false));
        });
    }
});

// Click on a menu item
kebabMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('.menu-item');
    if (!btn) return;

    // 0) Slideshow duration row: never close the menu
    if (btn.classList.contains('slideshow-row') || btn.closest('.slideshow-row')) {
        e.stopPropagation();
        return; // keep menu open while using the slider
    }

    // 1) Checkbox items: toggle without closing menu
    if (btn.classList.contains('menu-check')) {
        e.stopPropagation();
        if (btn.id === 'chkSearchTitles') {
            toggleSearchPref('title');
        } else if (btn.id === 'chkSearchDescriptions') {
            toggleSearchPref('desc');
        }
        return; // keep menu open
    }

    // 2) Regular action items
    const action = btn.dataset.action;
    if (action === 'star-all') {
        favoriteAll();
    } else if (action === 'unstar-all') {
        unfavoriteAll();
    }

    // Close after action items
    kebabMenu.classList.add('hidden');
    kebabBtn.setAttribute('aria-expanded', 'false');
});

// Click outside → close
document.addEventListener('click', (e) => {
    if (!kebabMenu || kebabMenu.classList.contains('hidden')) return;
    if (e.target === kebabBtn || kebabBtn.contains(e.target)) return;
    if (kebabMenu.contains(e.target)) return;
    kebabMenu.classList.add('hidden');
    kebabBtn.setAttribute('aria-expanded', 'false');
});

// Escape key closes menu (unless modal is open and using Esc there)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && kebabMenu && !kebabMenu.classList.contains('hidden')) {
        kebabMenu.classList.add('hidden');
        kebabBtn.setAttribute('aria-expanded', 'false');
    }
});

// Dropdown changes
yearSelect?.addEventListener('change', (e) => setBvgYear(e.target.value));
scaleSelect?.addEventListener('change', (e) => setDalScale(e.target.value));
dominanceSelect?.addEventListener('change', (e) => setDominanceUnit(e.target.value));
priceOfSelect?.addEventListener('change', (e) => setPriceOfItem(e.target.value));
coinSelect?.addEventListener('change', (e) => setCoinType(e.target.value));
myrSelect?.addEventListener('change', (e) => setMyrRange(e.target.value));

// Favorites filter toggle (header star)
function toggleFavoritesView() {
    showFavoritesOnly = !showFavoritesOnly;
    localStorage.setItem('showFavoritesOnly', showFavoritesOnly);
    document.getElementById('favoritesToggle').classList.toggle('active', showFavoritesOnly);
    filterImages();
}

// Keyboard shortcuts within modal
document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') {
            prevImage();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            closeModal();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentFile = visibleImages[currentIndex]?.filename || '';
            if (isBvgFile(currentFile)) {
                e.preventDefault(); (e.key === 'ArrowUp') ? cycleBvgYear('up') : cycleBvgYear('down');
            } else if (isDalFile(currentFile)) {
                e.preventDefault(); (e.key === 'ArrowUp') ? cycleDalScale('up') : cycleDalScale('down');
            } else if (isDominanceFile(currentFile)) {
                e.preventDefault(); (e.key === 'ArrowUp') ? cycleDominance('up') : cycleDominance('down');
            } else if (isPriceOfFile(currentFile)) {
                e.preventDefault(); (e.key === 'ArrowUp') ? cyclePriceOf('up') : cyclePriceOf('down');
            } else if (isCoinFile(currentFile)) {
                e.preventDefault(); (e.key === 'ArrowUp') ? cycleCoinType('up') : cycleCoinType('down');
            } else if (isMyrFile(currentFile)) {
                e.preventDefault(); (e.key === 'ArrowUp') ? cycleMyrRange('up') : cycleMyrRange('down');
            }
        }
    }
});

// ---- temporary global bridge for inline HTML handlers ----
// layout/search
window.setLayout = setLayout;
window.toggleSearch = toggleSearch;
// favorites
window.toggleFavoritesView = toggleFavoritesView;
// modal nav + close + favorite
window.closeModal = closeModal;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.toggleFavoriteFromModal = toggleFavoriteFromModal;