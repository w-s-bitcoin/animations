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
let imageList = [];
let visibleImages = [];
let currentIndex = 0;
let justUnstarredInModal = false;
let userSelectedLayout = null;
let showFavoritesOnly = localStorage.getItem('showFavoritesOnly') === 'true';
let searchWasInitiallyClosed = true;
let touchStartX = 0, touchEndX = 0;
let touchStartY = 0, touchEndY = 0;
let isPinching = false;
let isPanning = false;
let isMousePanning = false;
let mouseHadMoved = false;
let gestureConsumed = false;
let startPinchDistance = 0;
let startScale = 1;
let currentScale = 1;
let pinchFocus = null;
let lastTapTime = 0;
let translateX = 0;
let translateY = 0;
let panStartX = 0;
let panStartY = 0;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_DELAY = 300;
let lastTapX = 0;
let lastTapY = 0;
let singleTapMoved = false;
const MAX_TAP_MOVE_PX = 12;

/* ===========================
 * SEARCH PREFS (Title / Description)
 * =========================== */
function readSearchPrefs() {
    const t = localStorage.getItem('searchTitles');
    const d = localStorage.getItem('searchDescriptions');
    let inTitle = (t === null) ? true : (t === 'true');
    let inDesc = (d === null) ? true : (d === 'true');
    if (!inTitle && !inDesc) { inTitle = true; inDesc = false; }
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
function isSearchHappening() {
    const container = document.querySelector('.search-container');
    const input = document.getElementById('search-input');
    if (!container || !input) return false;
    return container.classList.contains('active') && input.value.trim().length > 0;
}
function toggleSearchPref(which) {
    let { inTitle, inDesc } = readSearchPrefs();
    if (which === 'title') {
        if (inTitle && !inDesc) { inTitle = false; inDesc = true; }
        else inTitle = !inTitle;
    } else {
        if (inDesc && !inTitle) { inDesc = false; inTitle = true; }
        else inDesc = !inDesc;
    }
    if (!inTitle && !inDesc) { if (which === 'title') inTitle = true; else inDesc = true; }
    writeSearchPrefs(inTitle, inDesc);
    applySearchPrefsToUI(inTitle, inDesc);
    if (isSearchHappening()) filterImages();
}

/* ===========================
 * CONSTANTS
 * =========================== */
const BVG_BASE = 'bitcoin_vs_gold';
const BVG_STORAGE_KEY = 'bvgYear';
const THIS_YEAR = new Date().getFullYear();
const BVG_YEARS = Array.from({ length: THIS_YEAR - 2013 + 1 }, (_, i) => THIS_YEAR - i);
const DAL_BASE = 'days_at_a_loss';
const DAL_STORAGE_KEY = 'dalScale';
const DAL_SCALES = ['linear', 'log'];
const DOM_BASE = 'bitcoin_dominance';
const DOM_STORAGE_KEY = 'dominanceUnit';
const DOM_UNITS = ['usd', 'btc'];
const POF_BASE = 'price_of_';
const POF_STORAGE_KEY = 'pofItem';
const POF_FAV_KEY = 'price_of_*';
let PRICE_OF_OPTIONS = [];
let PRICE_OF_META = {};
const COIN_STORAGE_KEY = 'coinType';
const COIN_ORDER = ['wholecoins', 'pi_coins', 'v_coins', 'x_coins', 'l_coins', 'c_coins', 'd_coins', 'm_coins'];
let COIN_OPTIONS = [];
let COIN_META = {};
const MYR_BASE = 'monthly_yearly_returns';
const MYR_START_YEAR = 2010;
const MYR_DEFAULT_RANGE = `${THIS_YEAR - 4} - ${THIS_YEAR}`;
function buildMyrRanges(startYear, endYear) {
    const ranges = [];
    for (let s = startYear; s <= endYear - 4; s++) ranges.push(`${s} - ${s + 4}`);
    return ranges;
}

/* ===========================
 * GENERIC HELPERS
 * =========================== */
function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function getCookie(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}
function replaceUrlForFilename(newFilename) {
    const slug = newFilename.replace('.png', '');
    if (location.hostname === 'localhost') {
        location.hash = slug;
    } else {
        const base = location.pathname.replace(/\/[^/]*$/, '');
        history.replaceState(null, '', `${base}/${slug}`);
    }
}
function updateGridThumbAtCurrent(newFilename, newAlt) {
    const thumb = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    if (thumb) {
        thumb.src = `final_frames/${newFilename}`;
        if (newAlt) thumb.alt = newAlt;
    }
}
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
function showYearControls(show) { yearControls?.classList.toggle('show', !!show); }
function showScaleControls(show) { scaleControls?.classList.toggle('show', !!show); }
function showPriceOfControls(show) { priceOfControls?.classList.toggle('show', !!show); }
function showDominanceControls(show) { dominanceControls?.classList.toggle('show', !!show); }
function showCoinControls(show) { coinControls?.classList.toggle('show', !!show); }
function showMyrControls(show) { myrControls?.classList.toggle('show', !!show); }
function setModalLinks({ x = '', nostr = '', youtube = '' } = {}) {
    const xLink = document.getElementById('x-link');
    const nostrLink = document.getElementById('nostr-link');
    const ytLink = document.getElementById('youtube-link');
    if (x) { xLink.href = x; xLink.classList.remove('disabled'); xLink.removeAttribute('aria-disabled'); xLink.removeAttribute('tabindex'); }
    else { xLink.href = '#'; xLink.classList.add('disabled'); xLink.setAttribute('aria-disabled', 'true'); xLink.setAttribute('tabindex', '-1'); }
    if (nostr) { nostrLink.href = nostr; nostrLink.classList.remove('disabled'); nostrLink.removeAttribute('aria-disabled'); nostrLink.removeAttribute('tabindex'); }
    else { nostrLink.href = '#'; nostrLink.classList.add('disabled'); nostrLink.setAttribute('aria-disabled', 'true'); nostrLink.setAttribute('tabindex', '-1'); }
    if (youtube) { ytLink.href = youtube; ytLink.classList.remove('disabled'); ytLink.removeAttribute('aria-disabled'); ytLink.removeAttribute('tabindex'); }
    else { ytLink.href = '#'; ytLink.classList.add('disabled'); ytLink.setAttribute('aria-disabled', 'true'); ytLink.setAttribute('tabindex', '-1'); }
}
let tempNonFavInjected = false;
function openByFilenameAllowingNonFav(filename) {
    let idx = visibleImages.findIndex(img => img.filename === filename);
    if (idx !== -1) { openModalByIndex(idx); return true; }
    const fullIdx = imageList.findIndex(img => img.filename === filename);
    if (fullIdx !== -1) {
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
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function distance(touches) {
    const [a, b] = touches; const dx = b.clientX - a.clientX, dy = b.clientY - a.clientY;
    return Math.hypot(dx, dy);
}
function midpoint(touches) {
    const [a, b] = touches; return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}
function applyTransform() {
    modalImg.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${currentScale})`;
}
function screenPointToImageLocal(clientX, clientY) {
    const rect = modalImg.getBoundingClientRect();
    const xRel = clientX - rect.left;
    const yRel = clientY - rect.top;
    const u = xRel / currentScale;
    const v = yRel / currentScale;
    return { u, v, xRel, yRel };
}
function computeBaseSizeAtScale1() {
    const vp = modal.getBoundingClientRect();
    const offset = getControlsOffset();
    const nw = modalImg.naturalWidth || 1;
    const nh = modalImg.naturalHeight || 1;
    const maxW = vp.width * 0.95;
    const availH = Math.max(0, vp.height - offset);
    const maxH = availH * 0.88;
    const fit = Math.min(maxW / nw, maxH / nh, 1);
    return { baseW: nw * fit, baseH: nh * fit, vpW: vp.width, vpH: vp.height, offset, availH };
}
function centerImageAtScale1() {
    const { baseW, baseH, vpW, vpH, offset } = computeBaseSizeAtScale1();
    currentScale = 1;
    translateX = (vpW - baseW) / 2;
    translateY = offset + ((vpH - offset) - baseH) / 2;
    applyTransform();
}
function resetZoomAndCenterAnimated() {
    const { baseW, baseH, vpW, vpH, offset } = computeBaseSizeAtScale1();
    currentScale = 1;
    translateX = (vpW - baseW) / 2;
    translateY = offset + ((vpH - offset) - baseH) / 2;
    modalImg.style.transition = 'transform 0.25s ease-out';
    applyTransform();
    modal.classList.remove('zoomed');
    pinchFocus = null;
    setTimeout(() => { modalImg.style.transition = ''; }, 300);
}
function zoomToPoint(targetScale, clientX, clientY) {
    const { u, v, xRel, yRel } = screenPointToImageLocal(clientX, clientY);
    currentScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    translateX = xRel - u * currentScale;
    translateY = yRel - v * currentScale;
    modal.classList.add('zoomed');
    clampPanToBounds();
    modalImg.style.transition = 'transform 0.2s ease-out';
    applyTransform();
    setTimeout(() => { modalImg.style.transition = ''; }, 220);
}
function handleDoubleTap(clientX, clientY) {
    gestureConsumed = true;
    if (currentScale <= 1.001) {
        zoomToPoint(2, clientX, clientY);
    } else {
        resetZoomAndCenterAnimated();
    }
}
let modalViewportRAF = null;
function handleModalViewportChange() {
    if (modal.style.display !== 'flex') return;
    updateModalSafePadding();
    if (modalViewportRAF) cancelAnimationFrame(modalViewportRAF);
    modalViewportRAF = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (currentScale <= 1.001 && !isPinching && !isPanning && !modal.classList.contains('zoomed')) {
                centerImageAtScale1();
            } else {
                clampPanToBounds();
                applyTransform();
            }
            modalViewportRAF = null;
        });
    });
}
function clampPanToBounds() {
    const { baseW, baseH, vpW, availH, offset } = computeBaseSizeAtScale1();
    const scaledW = baseW * currentScale;
    const scaledH = baseH * currentScale;
    const minTx = Math.min(0, vpW - scaledW);
    const maxTx = 0;
    if (scaledW <= vpW) {
        translateX = (vpW - scaledW) / 2;
    } else {
        translateX = Math.max(minTx, Math.min(translateX, maxTx));
    }
    const minTy = offset + Math.min(0, availH - scaledH);
    const maxTy = offset;
    if (scaledH <= availH) {
        translateY = offset + (availH - scaledH) / 2;
    } else {
        translateY = Math.max(minTy, Math.min(translateY, maxTy));
    }
}
function getControlsOffset() {
    const isSmallLandscape = window.matchMedia('(max-width: 900px) and (orientation: landscape)').matches;
    if (!isSmallLandscape) return 0;
    const v = parseFloat(getComputedStyle(modal).getPropertyValue('--controls-offset')) || 0;
    return Math.max(0, v);
}

/* ===========================
 * LAYOUT / SEARCH
 * =========================== */
function setLayout(type, manual = true) {
    imageGrid.classList.remove('grid', 'list');
    imageGrid.classList.add(type);
    if (type === 'grid') { gridIcon.classList.add('active'); listIcon.classList.remove('active'); }
    else { listIcon.classList.add('active'); gridIcon.classList.remove('active'); }
    if (manual) {
        userSelectedLayout = type;
        localStorage.setItem('preferredLayout', type);
    }
}
function updateLayoutBasedOnWidth() {
    const containerWidth = imageGrid.offsetWidth;
    const columnWidth = 280 + 32;
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
    if (nowActive) { searchWasInitiallyClosed = false; input.focus(); }
    else { input.value = ''; searchWasInitiallyClosed = true; filterImages(); }
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
function getAllFavoriteKeys() {
    const keys = new Set();
    if (!Array.isArray(imageList) || imageList.length === 0) return keys;
    let hasPriceOf = false;
    for (const img of imageList) {
        if (!img || !img.filename) continue;
        if (img.filename.startsWith(POF_BASE)) hasPriceOf = true;
        else keys.add(img.filename);
    }
    if (hasPriceOf) keys.add(POF_FAV_KEY);
    return keys;
}
function refreshFavoriteStarsUI() {
    const favs = new Set(getFavorites());
    document.querySelectorAll('.favorite-star').forEach(star => {
        const key = star.getAttribute('data-filename');
        const on = favs.has(key) || (key !== POF_FAV_KEY && favs.has(POF_FAV_KEY) && /^price_of_/.test(key));
        star.textContent = on ? '★' : '☆';
        star.classList.toggle('filled', on);
    });
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
    if (showFavoritesOnly) filterImages();
}
function unfavoriteAll() {
    saveFavorites([]);
    refreshFavoriteStarsUI();
    if (showFavoritesOnly) filterImages();
}
function isFavorite(filename) {
    const favs = getFavorites();
    if (filename.startsWith(POF_BASE)) {
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
        if (favKey === POF_FAV_KEY) favs = favs.filter(f => !/^price_of_/.test(f));
        favs.push(favKey);
        starElem.textContent = '★';
        starElem.classList.add('filled');
    }
    saveFavorites(favs);
    if (showFavoritesOnly && index !== -1) filterImages();
}
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
        let matchesSearch = true;
        if (query) {
            const hayTitle = inTitle ? (title || '').toLowerCase() : '';
            const hayDesc = inDesc ? (description || '').toLowerCase() : '';
            matchesSearch = hayTitle.includes(query) || hayDesc.includes(query);
        }
        const isFav = !showFavoritesOnly || isFavorite(filename);
        return matchesSearch && isFav;
    });
    const message = document.getElementById('no-favorites-message');
    message.style.display = (showFavoritesOnly && visibleImages.length === 0) ? 'block' : 'none';
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
        const star = document.createElement('div');
        star.className = 'favorite-star';
        const favOn = isFavorite(filename);
        star.textContent = favOn ? '★' : '☆';
        if (favOn) star.classList.add('filled');
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
function updateModalSafePadding() {
    const controls = document.querySelector('.modal-controls');
    const isSmallLandscape = window.matchMedia('(max-width: 900px) and (orientation: landscape)').matches;
    if (!controls || !isSmallLandscape || modal.style.display !== 'flex') {
        modal.style.removeProperty('--controls-offset');
        return;
    }
    const h = controls.getBoundingClientRect().height;
    const offset = Math.max(20, Math.min(h - 6, 44));
    modal.style.setProperty('--controls-offset', offset + 'px');
}
function openModalByIndex(index) {
    const image = visibleImages[index];
    if (!image) return;
    currentIndex = index;
    modal.style.display = 'flex';
    isPinching = false; isPanning = false; gestureConsumed = false;
    currentScale = 1; translateX = 0; translateY = 0; pinchFocus = null;
    modalImg.style.transform = '';
    modalImg.style.transformOrigin = '0 0';
    modal.classList.remove('zoomed');
    updateModalSafePadding();
    setTimeout(updateModalSafePadding, 0);
    document.body.style.overflow = 'hidden';
    setModalLinks({ x: image.latest_x || '', nostr: image.latest_nostr || '', youtube: image.latest_youtube || '' });
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
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(true); showMyrControls(false);
        populateCoinSelect();
        let chosen = coinSlugFromFilename(fname) || getStoredCoinSlug();
        if (!COIN_OPTIONS.some(o => o.slug === chosen)) chosen = COIN_OPTIONS[0]?.slug || 'wholecoins';
        coinSelect.value = chosen;
        setCoinType(chosen);
    } else if (isMyrFile(fname)) {
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(false); showMyrControls(true);
        populateMyrSelect();
        const chosenRange = myrRangeFromFilename(fname) || MYR_DEFAULT_RANGE;
        myrSelect.value = chosenRange;
        setMyrRange(chosenRange);
    } else {
        showYearControls(false); showScaleControls(false); showPriceOfControls(false); showDominanceControls(false); showCoinControls(false); showMyrControls(false);
        setModalImageAndCenter(fname, image.title);
        modalImg.alt = image.title;
        replaceUrlForFilename(fname);
    }
    const fav = isFavorite(visibleImages[currentIndex].filename);
    modalFavBtn.textContent = fav ? '★' : '☆';
    modalFavBtn.classList.toggle('filled', fav);
}
function closeModal() {
    modal.style.display = 'none';
    history.replaceState(null, '', '/');
    document.body.style.overflow = '';
    if (justUnstarredInModal) { justUnstarredInModal = false; filterImages(); }
    showYearControls(false); showScaleControls(false); showPriceOfControls(false); showMyrControls(false); showDominanceControls(false); showCoinControls(false);
    try {
        const cur = visibleImages[currentIndex];
        if (cur && isMyrFile(cur.filename) && cur.filename !== `${MYR_BASE}.png`) {
            const defaultFile = `${MYR_BASE}.png`;
            cur.filename = defaultFile;
            updateGridThumbAtCurrent(defaultFile);
        }
    } catch (_) { }
    if (tempNonFavInjected) { tempNonFavInjected = false; filterImages(); }
    isPinching = false; isPanning = false; gestureConsumed = false;
    currentScale = 1; translateX = 0; translateY = 0; pinchFocus = null;
    modalImg.style.transform = ''; modalImg.style.transformOrigin = '';
    modal.classList.remove('zoomed'); modal.style.removeProperty('--controls-offset');
}
function handleSwipe() {
    if (isPinching || currentScale > 1.001 || modal.classList.contains('zoomed')) return;
    const swipeDistance = touchEndX - touchStartX;
    const minSwipe = 50;
    if (Math.abs(swipeDistance) > minSwipe) { if (swipeDistance < 0) nextImage(); else prevImage(); }
}
function handleVerticalSwipe() {
    if (isPinching || currentScale > 1.001 || modal.classList.contains('zoomed')) return;
    const deltaY = touchEndY - touchStartY;
    const threshold = 50;
    const controls = document.querySelector('.modal-controls');
    if (Math.abs(deltaY) > threshold) {
        if (deltaY < 0) controls.classList.add('hidden');
        else controls.classList.remove('hidden');
    }
}
modalImg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        isPinching = true; gestureConsumed = true;
        modal.classList.add('zoomed');
        startPinchDistance = distance(e.touches);
        startScale = currentScale;
        const { x, y } = midpoint(e.touches);
        const { u, v, xRel, yRel } = screenPointToImageLocal(x, y);
        pinchFocus = { u, v, xRel, yRel };
    } else if (e.touches.length === 1) {
        singleTapMoved = false;
        modalImg.style.transition = '';
        if (currentScale > 1) {
            isPanning = true; gestureConsumed = true;
            panStartX = e.touches[0].clientX - translateX;
            panStartY = e.touches[0].clientY - translateY;
        }
    }
}, { passive: false });
modalImg.addEventListener('touchmove', (e) => {
    if (isPinching && e.touches.length === 2) {
        e.preventDefault();
        const rawScale = startScale * (distance(e.touches) / startPinchDistance);
        currentScale = clamp(rawScale, MIN_SCALE, MAX_SCALE);
        if (pinchFocus) {
            translateX = pinchFocus.xRel - pinchFocus.u * currentScale;
            translateY = pinchFocus.yRel - pinchFocus.v * currentScale;
        }
        if (currentScale <= 1.0001) { currentScale = 1; translateX = 0; translateY = 0; }
        clampPanToBounds(); applyTransform();
    } else if (isPanning && e.touches.length === 1 && currentScale > 1) {
        e.preventDefault();
        const cx = e.touches[0].clientX, cy = e.touches[0].clientY;
        translateX = cx - panStartX;
        translateY = cy - panStartY;
        clampPanToBounds(); applyTransform();
    } else if (e.touches.length === 1 && currentScale <= 1.001) {
        const dx = Math.abs(e.touches[0].clientX - (lastTapX || e.touches[0].clientX));
        const dy = Math.abs(e.touches[0].clientY - (lastTapY || e.touches[0].clientY));
        if (dx > MAX_TAP_MOVE_PX || dy > MAX_TAP_MOVE_PX) singleTapMoved = true;
    }
}, { passive: false });
modalImg.addEventListener('touchend', (e) => {
    if (isPinching && e.touches.length === 1) {
        isPinching = false; pinchFocus = null; isPanning = currentScale > 1;
        if (isPanning) {
            const t = e.touches[0];
            panStartX = t.clientX - translateX;
            panStartY = t.clientY - translateY;
        }
        return;
    }
    if (e.touches.length === 0) {
        const now = Date.now();
        const t = e.changedTouches[0];
        const dt = now - lastTapTime;
        const closeToLast =
            Math.abs(t.clientX - lastTapX) < 12 &&
            Math.abs(t.clientY - lastTapY) < 12;
        if (!singleTapMoved && dt > 0 && dt <= DOUBLE_TAP_DELAY && closeToLast) {
            gestureConsumed = true;
            modalImg.style.transition = '';
            if (currentScale <= 1.001) {
                zoomToPoint(3, t.clientX, t.clientY);
            } else {
                resetZoomAndCenterAnimated();
            }
            lastTapTime = 0; lastTapX = lastTapY = 0;
            return;
        }
        lastTapTime = now;
        lastTapX = t.clientX;
        lastTapY = t.clientY;
        isPinching = false; isPanning = false; pinchFocus = null;
        if (currentScale <= 1.001) {
            currentScale = 1;
            modal.classList.remove('zoomed');
            centerImageAtScale1();
        }
        setTimeout(() => { gestureConsumed = false; }, 0);
    }
});
let lastDownTime = 0;
let lastDownX = 0;
let lastDownY = 0;
modalImg.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    modalImg.style.transition = '';
    const now = Date.now();
    const x = e.clientX, y = e.clientY;
    const dt = now - lastDownTime;
    const closeToLast =
        Math.abs(x - lastDownX) <= 12 &&
        Math.abs(y - lastDownY) <= 12;
    if (dt > 0 && dt <= DOUBLE_TAP_DELAY && closeToLast) {
        e.preventDefault();
        e.stopPropagation();
        gestureConsumed = true;
        if (currentScale <= 1.001) {
            zoomToPoint(3, x, y);
        } else {
            resetZoomAndCenterAnimated();
        }
        lastDownTime = 0; lastDownX = 0; lastDownY = 0;
        return;
    }
    lastDownTime = now;
    lastDownX = x;
    lastDownY = y;
}, { passive: false });
modalImg.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || currentScale <= 1.001) return;
    e.preventDefault();
    gestureConsumed = true;
    isMousePanning = true;
    mouseHadMoved = false;
    panStartX = e.clientX - translateX;
    panStartY = e.clientY - translateY;
    modalImg.style.cursor = 'grabbing';
    modal.classList.add('zoomed');
});
window.addEventListener('mousemove', (e) => {
    if (!isMousePanning) return;
    const nx = e.clientX - panStartX;
    const ny = e.clientY - panStartY;
    if (Math.abs(nx - translateX) > 0.5 || Math.abs(ny - translateY) > 0.5) {
        mouseHadMoved = true;
    }
    translateX = nx;
    translateY = ny;
    clampPanToBounds();
    applyTransform();
});
function endMousePan() {
    if (!isMousePanning) return;
    isMousePanning = false;
    modalImg.style.cursor = '';
    setTimeout(() => { gestureConsumed = false; }, 0);
}
window.addEventListener('mouseup', endMousePan);
window.addEventListener('mouseleave', endMousePan);
modalImg.addEventListener('click', (e) => {
    if (mouseHadMoved) {
        e.preventDefault();
        e.stopPropagation();
    }
    mouseHadMoved = false;
}, true);
modalImg.addEventListener('touchcancel', () => {
    isPinching = false; isPanning = false; pinchFocus = null;
    if (currentScale <= 1.001) { currentScale = 1; modal.classList.remove('zoomed'); centerImageAtScale1(); }
    gestureConsumed = false;
});
modalImg.addEventListener('dragstart', (e) => e.preventDefault());
function prevImage() {
    if (justUnstarredInModal) { justUnstarredInModal = false; filterImages(); }
    const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
    openModalByIndex(prevIndex);
}
function nextImage() {
    if (justUnstarredInModal) { justUnstarredInModal = false; filterImages(); }
    const nextIndex = (currentIndex + 1) % visibleImages.length;
    openModalByIndex(nextIndex);
}
function toggleFavoriteFromModal() {
    const filename = visibleImages[currentIndex].filename;
    const favKey = filename.startsWith(POF_BASE) ? POF_FAV_KEY : filename;
    let favs = getFavorites();
    const index = favs.indexOf(favKey);
    const gridStar = document.querySelector(`.favorite-star[data-filename="${favKey}"]`);
    if (index !== -1) {
        favs.splice(index, 1);
        modalFavBtn.textContent = '☆'; modalFavBtn.classList.remove('filled');
        if (gridStar) { gridStar.textContent = '☆'; gridStar.classList.remove('filled'); }
    } else {
        if (favKey === POF_FAV_KEY) favs = favs.filter(f => !/^price_of_/.test(f));
        favs.push(favKey);
        modalFavBtn.textContent = '★'; modalFavBtn.classList.add('filled');
        if (gridStar) { gridStar.textContent = '★'; gridStar.classList.add('filled'); }
    }
    saveFavorites(favs);
    if (showFavoritesOnly && index !== -1) justUnstarredInModal = true;
}

/* ===========================
 * MODULE: Bitcoin vs Gold (BVG)
 * =========================== */
function isBvgFile(fname) { return fname.startsWith(BVG_BASE); }
function bvgFilenameForYear(y) { return `${BVG_BASE}_${y}.png`; }
function extractBvgYear(fname) { const m = fname.match(/bitcoin_vs_gold_(\d{4})\.png$/); return m ? m[1] : null; }
function getStoredBvgYear() { return localStorage.getItem(BVG_STORAGE_KEY) || '2018'; }
function setStoredBvgYear(y) { localStorage.setItem(BVG_STORAGE_KEY, y); }
function populateYearSelect() {
    if (!yearSelect || yearSelect.options.length) return;
    yearSelect.innerHTML = BVG_YEARS.map(y => `<option value="${y}">${y}</option>`).join('');
}
function isValidBvgYear(yStr) { const y = parseInt(yStr, 10); return Number.isInteger(y) && BVG_YEARS.includes(y); }
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
function getStoredDominanceUnit() { return getCookie(DOM_STORAGE_KEY) || localStorage.getItem(DOM_STORAGE_KEY) || 'usd'; }
function setStoredDominanceUnit(u) { setCookie(DOM_STORAGE_KEY, u, 365); localStorage.setItem(DOM_STORAGE_KEY, u); }
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
function slugToTitle(slug) { return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function buildPriceOfOptionsFromList(list) {
    const bySlug = new Map();
    list.forEach(img => {
        const m = img.filename.match(/^price_of_([a-z0-9_]+)\.png$/);
        if (!m) return;
        const slug = m[1];
        if (!bySlug.has(slug)) {
            bySlug.set(slug, {
                slug,
                label: slug === 'ca_min_wage'
                    ? 'CA Min Wage'
                    : slugToTitle(slug),
                filename: `price_of_${slug}.png`,
                title: img.title,
                description: img.description,
                latest_x: img.latest_x || '',
                latest_nostr: img.latest_nostr || '',
                latest_youtube: img.latest_youtube || ''
            });
        }
    });
    PRICE_OF_OPTIONS = Array.from(bySlug.values()).sort((a, b) => a.label.localeCompare(b.label));
    PRICE_OF_META = PRICE_OF_OPTIONS.reduce((acc, o) => (acc[o.slug] = o, acc), {});
}
function populatePriceOfSelect() {
    if (!priceOfSelect) return;
    priceOfSelect.innerHTML = PRICE_OF_OPTIONS.map(o => `<option value="${o.slug}">${o.label}</option>`).join('');
}
function applyPostLinksFromMeta(meta) {
    setModalLinks({ x: meta.latest_x || '', nostr: meta.latest_nostr || '', youtube: meta.latest_youtube || '' });
}
function getStoredPofItem() { return getCookie(POF_STORAGE_KEY) || localStorage.getItem(POF_STORAGE_KEY) || 'ground_beef'; }
function setStoredPofItem(slug) { setCookie(POF_STORAGE_KEY, slug, 365); localStorage.setItem(POF_STORAGE_KEY, slug); }
function setPriceOfItem(slug) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isPriceOfFile(oldFilename)) return;
    const newFilename = pofFilenameForSlug(slug);
    const fallbackTitle = `Price of ${slugToTitle(slug)}`;
    const meta = PRICE_OF_META[slug] || { title: fallbackTitle, description: '' };
    setStoredPofItem(slug);
    setModalImageAndCenter(newFilename, meta.title || fallbackTitle);
    replaceUrlForFilename(newFilename);
    applyPostLinksFromMeta(meta);
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title: meta.title || visibleImages[currentIndex].title || fallbackTitle,
        description: meta.description || visibleImages[currentIndex].description || '',
        latest_x: meta.latest_x || '',
        latest_nostr: meta.latest_nostr || '',
        latest_youtube: meta.latest_youtube || ''
    });
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
function isCoinFile(fname) { return /^(.+)\.png$/.test(fname) && COIN_ORDER.some(slug => `${slug}.png` === fname); }
function coinSlugFromFilename(fname) { const m = fname.match(/^([a-z0-9_]+)\.png$/i); return m ? m[1] : null; }
function coinFilenameForSlug(slug) { return `${slug}.png`; }
function getStoredCoinSlug() { return getCookie(COIN_STORAGE_KEY) || localStorage.getItem(COIN_STORAGE_KEY) || 'wholecoins'; }
function setStoredCoinSlug(slug) { setCookie(COIN_STORAGE_KEY, slug, 365); localStorage.setItem(COIN_STORAGE_KEY, slug); }
function buildCoinOptionsFromList(list) {
    const bySlug = new Map();
    list.forEach(img => {
        const slug = coinSlugFromFilename(img.filename);
        if (!slug || !COIN_ORDER.includes(slug)) return;
        const label = (img.title || slug).replace(/\s*\(.*?\)\s*$/, '');
        bySlug.set(slug, {
            slug, label,
            filename: img.filename,
            title: img.title || label,
            description: img.description || '',
            latest_x: img.latest_x || '',
            latest_nostr: img.latest_nostr || '',
            latest_youtube: img.latest_youtube || ''
        });
    });
    COIN_OPTIONS = COIN_ORDER.filter(slug => bySlug.has(slug)).map(slug => bySlug.get(slug));
    COIN_META = COIN_OPTIONS.reduce((acc, o) => (acc[o.slug] = o, acc), {});
}
function populateCoinSelect() {
    if (!coinSelect) return;
    coinSelect.innerHTML = COIN_OPTIONS.map(o => `<option value="${o.slug}">${o.label}</option>`).join('');
}
function setCoinType(slug) {
    const image = visibleImages[currentIndex];
    if (!image || !isCoinFile(image.filename)) return;
    const meta = COIN_META[slug];
    const oldFilename = image.filename;
    const newFilename = coinFilenameForSlug(slug);
    setStoredCoinSlug(slug);
    setModalImageAndCenter(newFilename, meta?.title || image.title || slug);
    replaceUrlForFilename(newFilename);
    setModalLinks({ x: meta?.latest_x || '', nostr: meta?.latest_nostr || '', youtube: meta?.latest_youtube || '' });
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title: meta?.title || image.title,
        description: meta?.description || image.description,
        latest_x: meta?.latest_x || '',
        latest_nostr: meta?.latest_nostr || '',
        latest_youtube: meta?.latest_youtube || ''
    });
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
function myrRangeFromFilename(fname) {
    if (fname === `${MYR_BASE}.png`) return MYR_DEFAULT_RANGE;
    const m = fname.match(/^monthly_yearly_returns_(\d{4})_(\d{4})\.png$/);
    return m ? `${m[1]} - ${m[2]}` : MYR_DEFAULT_RANGE;
}
function populateMyrSelect() {
    if (!myrSelect) return;
    myrSelect.innerHTML = MYR_RANGES.map(r => `<option value="${r}">${r}</option>`).join('');
}
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
    if (location.hash) {
        return location.hash.replace(/^#/, '') + '.png';
    }
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return null;
    return path + '.png';
}
fetch("final_frames/image_list.json")
    .then(res => res.json())
    .then(data => {
        imageList = data;
        MYR_RANGES = buildMyrRanges(MYR_START_YEAR, THIS_YEAR);
        populateMyrSelect();
        buildPriceOfOptionsFromList(imageList);
        populatePriceOfSelect();
        buildCoinOptionsFromList(imageList);
        populateCoinSelect();
        const coinSet = new Set(COIN_ORDER.map(s => `${s}.png`));
        const coinsAll = imageList.filter(img => coinSet.has(img.filename));
        const nonCoins = imageList.filter(img => !coinSet.has(img.filename));
        const firstCoinIdx = imageList.findIndex(img => coinSet.has(img.filename));
        let insertIdx = firstCoinIdx !== -1
            ? firstCoinIdx
            : nonCoins.findIndex(img => img.filename.startsWith('bitcoin_dominance')) + 1;
        if (insertIdx < 0) insertIdx = nonCoins.length;
        const initialFilename = getImageNameFromPath();
        let urlPofSlug = null;
        let urlCoinSlug = null;
        if (initialFilename && initialFilename.startsWith(POF_BASE)) {
            const s = pofSlugFromFilename(initialFilename);
            if (s && PRICE_OF_OPTIONS.some(o => o.slug === s)) { urlPofSlug = s; setStoredPofItem(s); }
        }
        if (initialFilename && coinSet.has(initialFilename)) {
            const s = coinSlugFromFilename(initialFilename);
            if (s && COIN_ORDER.includes(s)) { urlCoinSlug = s; setStoredCoinSlug(s); }
        }
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
        if (coinCard) {
            imageList = [...nonCoins.slice(0, insertIdx), coinCard, ...nonCoins.slice(insertIdx)];
        } else {
            imageList = nonCoins;
        }
        const storedPofSlug = getStoredPofItem();
        const repFilename = pofFilenameForSlug(storedPofSlug);
        const repMeta = PRICE_OF_META[storedPofSlug];
        const nonPof = imageList.filter(img => !isPriceOfFile(img.filename));
        const pofAll = imageList.filter(img => isPriceOfFile(img.filename));
        let pofCard = null;
        if (pofAll.length) {
            const chosen = pofAll.find(img => img.filename === repFilename) || pofAll[0];
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
        if (pofCard) {
            const gwIdx = nonPof.findIndex(img => img.filename.startsWith('global_wealth'));
            if (gwIdx !== -1) {
                imageList = [...nonPof.slice(0, gwIdx + 1), pofCard, ...nonPof.slice(gwIdx + 1)];
            } else {
                imageList = [...nonPof, pofCard];
            }
        } else {
            imageList = nonPof;
        }
        visibleImages = [...imageList];
        migratePriceOfFavorites();
        filterImages();
        let urlBvgYear = null;
        if (initialFilename && initialFilename.startsWith('bitcoin_vs_gold_')) {
            const m = initialFilename.match(/bitcoin_vs_gold_(\d{4})\.png$/);
            if (m && isValidBvgYear(m[1])) { urlBvgYear = m[1]; setStoredBvgYear(urlBvgYear); }
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
        const storedBvgYear = getStoredBvgYear();
        imageList = imageList.map(img => (img.filename.startsWith(BVG_BASE) ? { ...img, filename: `${BVG_BASE}_${storedBvgYear}.png` } : img));
        const storedDalScale = getStoredDalScale();
        imageList = imageList.map(img => (img.filename.startsWith(DAL_BASE) ? { ...img, filename: dalFilenameForScale(storedDalScale) } : img));
        const storedDomUnit = getStoredDominanceUnit();
        imageList = imageList.map(img => (img.filename.startsWith(DOM_BASE) ? { ...img, filename: domFilenameForUnit(storedDomUnit) } : img));
        visibleImages = [...imageList];
        filterImages();
        const savedLayout = localStorage.getItem('preferredLayout');
        if (savedLayout === 'list' || savedLayout === 'grid') setLayout(savedLayout, false);
        if (showFavoritesOnly) document.getElementById('favoritesToggle').classList.add('active');
        if (initialFilename) {
            let opened = false;
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
            if (openIdx !== -1) { openModalByIndex(openIdx); opened = true; }
            if (!opened) {
                if (!openByFilenameAllowingNonFav(initialFilename)) history.replaceState(null, '', '/');
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
const THUMB_PX = 16;
function expToSecs(exp) { return Math.pow(2, exp); }
function clampExp(val) { return Math.max(EXP_MIN, Math.min(EXP_MAX, Math.round(val))); }
function positionBubble(rangeEl, bubbleEl) {
    if (!rangeEl || !bubbleEl) return;
    const wrap = rangeEl.parentElement;
    const rect = rangeEl.getBoundingClientRect();
    const padL = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    const min = Number(rangeEl.min || 0);
    const max = Number(rangeEl.max || 6);
    const val = Number(rangeEl.value || 0);
    const pct = (val - min) / (max - min);
    const xWithinTrack = pct * (rect.width - THUMB_PX) + THUMB_PX / 2;
    bubbleEl.style.left = `${padL + xWithinTrack}px`;
}
function updateSlideDurationUI(fromUser = false) {
    if (!slideRange || !slideBubble) return;
    if (fromUser) {
        const snapped = clampExp(Number(slideRange.value));
        if (snapped !== Number(slideRange.value)) slideRange.value = String(snapped);
        localStorage.setItem(SLIDE_EXP_KEY, String(snapped));
    }
    const exp = clampExp(Number(slideRange.value));
    const secs = expToSecs(exp);
    slideRange.setAttribute('aria-valuenow', String(secs));
    slideRange.setAttribute('aria-valuemin', String(expToSecs(EXP_MIN)));
    slideRange.setAttribute('aria-valuemax', String(expToSecs(EXP_MAX)));
    slideRange.setAttribute('aria-valuetext', `${secs} seconds`);
    slideBubble.textContent = `${secs}s`;
    positionBubble(slideRange, slideBubble);
}
function initSlideDurationControl() {
    if (!slideRange || !slideBubble) return;
    const saved = Number(localStorage.getItem(SLIDE_EXP_KEY));
    const initial = Number.isFinite(saved) ? clampExp(saved) : 2;
    slideRange.value = String(initial);
    requestAnimationFrame(() => updateSlideDurationUI(false));
    window.addEventListener('resize', () => positionBubble(slideRange, slideBubble));
    slideRange.addEventListener('input', () => updateSlideDurationUI(true));
    slideRange.addEventListener('change', () => updateSlideDurationUI(true));
}
function bindSliderEventGuards() {
    if (!slideRange) return;
    const stop = (ev) => { ev.stopPropagation(); };
    ['pointerdown', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend']
        .forEach(type => slideRange.addEventListener(type, stop, { passive: true }));
    const wrap = slideRange.closest('.slideshow-row');
    if (wrap) {
        ['click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(type =>
            wrap.addEventListener(type, stop, { passive: true })
        );
    }
}
window.addEventListener('load', () => {
    kebabMenu?.classList.add('hidden');
    kebabBtn?.setAttribute('aria-expanded', 'false');
    updateLayoutBasedOnWidth();
    initSearchPrefsAndUI();
    initSlideDurationControl();
    bindSliderEventGuards();
});

/* ===========================
 * SLIDESHOW: core (autoplay + fade)
 * =========================== */
let slideshowIndex = 0;
let slideshowPlaying = false;
let slideshowTimer = null;
function isSlideshowOpen() {
    return !!slideshowEl && !slideshowEl.classList.contains('hidden');
}
function focusSlideshowShell() {
    try { slideshowEl?.focus(); } catch (_) { }
}
function getSlideDurationSecs() {
    if (!slideRange) return 4;
    const exp = Number(slideRange.value || 2);
    return Math.pow(2, Math.max(1, Math.min(6, Math.round(exp))));
}
function _applySlide(idx) {
    if (!visibleImages || visibleImages.length === 0) return;
    slideshowIndex = ((idx % visibleImages.length) + visibleImages.length) % visibleImages.length;
    const item = visibleImages[slideshowIndex];
    const alt = item?.title || item?.description || 'Slideshow image';
    slideshowImg.classList.add('ss-img-hidden');
    const onLoad = () => {
        requestAnimationFrame(() => { slideshowImg.classList.remove('ss-img-hidden'); });
        slideshowImg.removeEventListener('load', onLoad);
    };
    slideshowImg.removeEventListener('load', onLoad);
    slideshowImg.addEventListener('load', onLoad);
    slideshowImg.alt = alt;
    slideshowImg.src = `final_frames/${item.filename}`;
}
function setSlideshowImage(idx, restartTimer = false) {
    _applySlide(idx);
    if (restartTimer) restartSlideshowTimer();
    else if (slideshowPlaying) scheduleNextSlide();
}
function slideshowNext(restartTimer = true) { setSlideshowImage(slideshowIndex + 1, restartTimer); }
function slideshowPrev(restartTimer = true) { setSlideshowImage(slideshowIndex - 1, restartTimer); }
function clearSlideshowTimer() { if (slideshowTimer) { clearTimeout(slideshowTimer); slideshowTimer = null; } }
function scheduleNextSlide() {
    clearSlideshowTimer();
    if (!slideshowPlaying) return;
    const delayMs = getSlideDurationSecs() * 1000;
    slideshowTimer = setTimeout(() => { slideshowNext(false); }, delayMs);
}
function restartSlideshowTimer() { if (!slideshowPlaying) return; scheduleNextSlide(); }
function updatePlayButton() {
    if (!ssPlayPauseBtn) return;
    if (slideshowPlaying) {
        ssPlayPauseBtn.textContent = '။';
        ssPlayPauseBtn.setAttribute('aria-label', 'Pause slideshow');
        ssPlayPauseBtn.dataset.state = 'playing';
    } else {
        ssPlayPauseBtn.textContent = '▸';
        ssPlayPauseBtn.setAttribute('aria-label', 'Play slideshow');
        ssPlayPauseBtn.dataset.state = 'paused';
    }
}
function playSlideshow() {
    if (!slideshowEl || !visibleImages?.length) return;
    slideshowPlaying = true;
    updatePlayButton();
    showSlideshowUI(true);
    scheduleNextSlide();
}
function pauseSlideshow() {
    slideshowPlaying = false;
    updatePlayButton();
    clearSlideshowTimer();
    clearTimeout(slideshowUiTimer);
    slideshowUiTimer = null;
    showSlideshowUI(false);
}
function togglePlayPause() { if (slideshowPlaying) pauseSlideshow(); else playSlideshow(); }
async function enterFullscreen(el) {
    try {
        if (!document.fullscreenElement) {
            if (el?.requestFullscreen) await el.requestFullscreen();
            else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        }
    } catch (_) { }
}

/* ===========================
 * SLIDESHOW: auto-hide UI + cursor after inactivity (pause-aware)
 * =========================== */
const UI_HIDE_DELAY_MS = 1500;
let slideshowUiTimer = null;
function showSlideshowUI(armTimer = true) {
    if (!slideshowEl) return;
    slideshowEl.classList.add('show-ui');
    document.body.classList.remove('hide-cursor');
    clearTimeout(slideshowUiTimer);
    if (armTimer && slideshowPlaying) {
        slideshowUiTimer = setTimeout(() => {
            if (!slideshowPlaying) return;
            hideSlideshowUI();
        }, UI_HIDE_DELAY_MS);
    } else {
        slideshowUiTimer = null;
    }
}
function hideSlideshowUI() {
    if (!slideshowEl) return;
    if (!slideshowPlaying) return;
    slideshowEl.classList.remove('show-ui');
    if (document.body.classList.contains('slideshow-open')) {
        document.body.classList.add('hide-cursor');
    }
    clearTimeout(slideshowUiTimer);
    slideshowUiTimer = null;
}
function resetSlideshowUiHideTimer() {
    showSlideshowUI(true);
}
function onSlideshowActivity() {
    showSlideshowUI(slideshowPlaying);
}
function bindSlideshowUiActivityListeners() {
    slideshowEl?.addEventListener('pointermove', onSlideshowActivity, { passive: true });
    slideshowEl?.addEventListener('pointerdown', onSlideshowActivity, { passive: true });
    slideshowEl?.addEventListener('wheel', onSlideshowActivity, { passive: true });
    slideshowEl?.addEventListener('mousemove', onSlideshowActivity, { passive: true }); // legacy
}
function unbindSlideshowUiActivityListeners() {
    slideshowEl?.removeEventListener('pointermove', onSlideshowActivity);
    slideshowEl?.removeEventListener('pointerdown', onSlideshowActivity);
    slideshowEl?.removeEventListener('wheel', onSlideshowActivity);
    slideshowEl?.removeEventListener('mousemove', onSlideshowActivity);
}
async function exitFullscreen() { try { if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen(); } catch (_) { } }
async function openSlideshow(startAt = 0, startPlaying = true) {
    if (!slideshowEl) return;
    if (!visibleImages || visibleImages.length === 0) return;
    if (modal && modal.style.display === 'flex') closeModal();
    slideshowEl.classList.remove('hidden');
    slideshowEl.classList.add('show-ui');
    slideshowEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('slideshow-open');
    _applySlide(startAt);
    await enterFullscreen(slideshowEl);
    requestAnimationFrame(focusSlideshowShell);
    bindSlideshowUiActivityListeners();
    if (startPlaying) {
        slideshowPlaying = true;
        updatePlayButton();
        scheduleNextSlide();
    } else {
        slideshowPlaying = false;
        updatePlayButton();
    }
    showSlideshowUI(slideshowPlaying);
}
async function closeSlideshow() {
    if (!slideshowEl) return;
    pauseSlideshow();
    clearSlideshowTimer();
    unbindSlideshowUiActivityListeners();
    clearTimeout(slideshowUiTimer);
    slideshowUiTimer = null;
    document.body.classList.remove('hide-cursor');
    slideshowEl.classList.add('show-ui');
    slideshowEl.classList.add('hidden');
    slideshowEl.classList.remove('show-ui');
    slideshowEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('slideshow-open');
    await exitFullscreen();
}

/* ===========================
 * EVENT LISTENERS
 * =========================== */
window.addEventListener('resize', updateLayoutBasedOnWidth);
window.addEventListener('resize', updateModalSafePadding);
window.addEventListener('load', updateLayoutBasedOnWidth);
window.addEventListener('orientationchange', updateModalSafePadding);
window.addEventListener('resize', handleModalViewportChange);
window.addEventListener('orientationchange', handleModalViewportChange);
chkSearchTitles?.addEventListener('click', (e) => { e.stopPropagation(); toggleSearchPref('title'); });
chkSearchDescriptions?.addEventListener('click', (e) => { e.stopPropagation(); toggleSearchPref('desc'); });
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
modal.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});
modal.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    if (!gestureConsumed) { handleSwipe(); handleVerticalSwipe(); }
});
startSlideshowBtn?.addEventListener('click', () => {
    kebabMenu?.classList.add('hidden');
    kebabBtn?.setAttribute('aria-expanded', 'false');
    if (!visibleImages || !visibleImages.length) return;
    openSlideshow(0, true);
});
ssExitBtn?.addEventListener('click', (e) => { e.stopPropagation(); closeSlideshow(); });
ssNextBtn?.addEventListener('click', (e) => { e.stopPropagation(); slideshowNext(true); });
ssPrevBtn?.addEventListener('click', (e) => { e.stopPropagation(); slideshowPrev(true); });
ssExitBtn?.addEventListener('click', (e) => { e.stopPropagation(); showSlideshowUI(slideshowPlaying); closeSlideshow(); });
ssNextBtn?.addEventListener('click', (e) => { e.stopPropagation(); showSlideshowUI(slideshowPlaying); slideshowNext(true); });
ssPrevBtn?.addEventListener('click', (e) => { e.stopPropagation(); showSlideshowUI(slideshowPlaying); slideshowPrev(true); });
function onPlayPauseActivate(e) {
    if (e.type === 'keydown' && !(e.key === 'Enter' || e.key === ' ' || e.code === 'Space')) return;
    e.stopPropagation();
    e.preventDefault();
    if (slideshowPlaying) {
        pauseSlideshow();
        showSlideshowUI(false);
    } else {
        playSlideshow();
        showSlideshowUI(true);
    }
}
if (!ssPlayPauseBtn) {
    console.warn('ssPlayPauseBtn not found. Check the button id in your HTML.');
} else {
    ssPlayPauseBtn.addEventListener('click', onPlayPauseActivate);
    ssPlayPauseBtn.addEventListener('keydown', onPlayPauseActivate);
    ssPlayPauseBtn.setAttribute('tabindex', '0');
    ssPlayPauseBtn.setAttribute('role', 'button');
}
if (!ssPlayPauseBtn) {
    console.warn('ssPlayPauseBtn not found. Check the button id in your HTML.');
} else {
    ssPlayPauseBtn.addEventListener('click', onPlayPauseActivate);
    ssPlayPauseBtn.addEventListener('keydown', onPlayPauseActivate);
    ssPlayPauseBtn.setAttribute('tabindex', '0');
    ssPlayPauseBtn.setAttribute('role', 'button');
}
document.addEventListener('keydown', (e) => {
    if (!slideshowEl || slideshowEl.classList.contains('hidden')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSlideshow(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); slideshowNext(true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); slideshowPrev(true); }
    else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlayPause(); }
});
function onFullscreenChangeAutoClose() {
    if (!document.fullscreenElement && isSlideshowOpen()) {
        closeSlideshow();
    }
}
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
    .forEach(evt => document.addEventListener(evt, onFullscreenChangeAutoClose));
slideRange?.addEventListener('change', () => restartSlideshowTimer());
slideRange?.addEventListener('input', () => restartSlideshowTimer());

/* ===========================
 * SITE-WIDE: Option(Alt)+S starts slideshow (robust for macOS 'ß')
 * =========================== */
function onOptionSStartSlideshow(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.code !== 'KeyS') return;
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)) return;
    const slideshowOpen = !!slideshowEl && !slideshowEl.classList.contains('hidden');
    if (slideshowOpen) return;
    e.preventDefault();
    e.stopPropagation();
    kebabMenu?.classList.add('hidden');
    kebabBtn?.setAttribute('aria-expanded', 'false');
    if (modal && modal.style.display === 'flex') closeModal();
    if (startSlideshowBtn) startSlideshowBtn.click();
    else if (typeof openSlideshow === 'function') openSlideshow(0, true);
}
document.addEventListener('keydown', onOptionSStartSlideshow, true);

/* ===========================
 * KEBAB MENU (⋯) EVENTS
 * =========================== */
kebabBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !kebabMenu.classList.contains('hidden');
    kebabMenu.classList.toggle('hidden', isOpen);
    const nowOpen = !isOpen;
    kebabBtn.setAttribute('aria-expanded', String(nowOpen));
    if (nowOpen) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => updateSlideDurationUI(false));
        });
    }
});
kebabMenu?.addEventListener('click', (e) => {
    const btn = e.target.closest('.menu-item');
    if (!btn) return;
    if (btn.classList.contains('slideshow-row') || btn.closest('.slideshow-row')) { e.stopPropagation(); return; }
    if (btn.classList.contains('menu-check')) {
        e.stopPropagation();
        if (btn.id === 'chkSearchTitles') toggleSearchPref('title');
        else if (btn.id === 'chkSearchDescriptions') toggleSearchPref('desc');
        return;
    }
    const action = btn.dataset.action;
    if (action === 'star-all') favoriteAll();
    else if (action === 'unstar-all') unfavoriteAll();
    kebabMenu.classList.add('hidden');
    kebabBtn.setAttribute('aria-expanded', 'false');
});
document.addEventListener('click', (e) => {
    if (!kebabMenu || kebabMenu.classList.contains('hidden')) return;
    if (e.target === kebabBtn || kebabBtn.contains(e.target)) return;
    if (kebabMenu.contains(e.target)) return;
    kebabMenu.classList.add('hidden');
    kebabBtn.setAttribute('aria-expanded', 'false');
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && kebabMenu && !kebabMenu.classList.contains('hidden')) {
        kebabMenu.classList.add('hidden');
        kebabBtn.setAttribute('aria-expanded', 'false');
    }
});
yearSelect?.addEventListener('change', (e) => setBvgYear(e.target.value));
scaleSelect?.addEventListener('change', (e) => setDalScale(e.target.value));
dominanceSelect?.addEventListener('change', (e) => setDominanceUnit(e.target.value));
priceOfSelect?.addEventListener('change', (e) => setPriceOfItem(e.target.value));
coinSelect?.addEventListener('change', (e) => setCoinType(e.target.value));
myrSelect?.addEventListener('change', (e) => setMyrRange(e.target.value));
function toggleFavoritesView() {
    showFavoritesOnly = !showFavoritesOnly;
    localStorage.setItem('showFavoritesOnly', showFavoritesOnly);
    document.getElementById('favoritesToggle').classList.toggle('active', showFavoritesOnly);
    filterImages();
}

/* ===========================
 * MODAL KEYBOARD SHORTCUTS
 * =========================== */
document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') prevImage();
        else if (e.key === 'ArrowRight') nextImage();
        else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); closeModal(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            const currentFile = visibleImages[currentIndex]?.filename || '';
            if (isBvgFile(currentFile)) { e.preventDefault(); (e.key === 'ArrowUp') ? cycleBvgYear('up') : cycleBvgYear('down'); }
            else if (isDalFile(currentFile)) { e.preventDefault(); (e.key === 'ArrowUp') ? cycleDalScale('up') : cycleDalScale('down'); }
            else if (isDominanceFile(currentFile)) { e.preventDefault(); (e.key === 'ArrowUp') ? cycleDominance('up') : cycleDominance('down'); }
            else if (isPriceOfFile(currentFile)) { e.preventDefault(); (e.key === 'ArrowUp') ? cyclePriceOf('up') : cyclePriceOf('down'); }
            else if (isCoinFile(currentFile)) { e.preventDefault(); (e.key === 'ArrowUp') ? cycleCoinType('up') : cycleCoinType('down'); }
            else if (isMyrFile(currentFile)) { e.preventDefault(); (e.key === 'ArrowUp') ? cycleMyrRange('up') : cycleMyrRange('down'); }
        }
    }
});

/* ===========================
 * BRIDGE FOR INLINE HTML HANDLERS
 * =========================== */
window.setLayout = setLayout;
window.toggleSearch = toggleSearch;
window.toggleFavoritesView = toggleFavoritesView;
window.closeModal = closeModal;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.toggleFavoriteFromModal = toggleFavoriteFromModal;