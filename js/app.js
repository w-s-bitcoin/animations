/* ===========================
 * CONSTANTS
 * =========================== */
const BVG_BASE = 'bitcoin_vs_gold';
const BVG_STORAGE_KEY = 'bvgYear';
const THIS_YEAR = new Date().getFullYear();
const BVG_YEARS = Array.from({length: THIS_YEAR - 2013 + 1}, (_, i) => THIS_YEAR - i);
const DAL_BASE = 'days_at_a_loss';
const DAL_STORAGE_KEY = 'dalScale';
const DAL_SCALES = ['linear', 'log'];
const DOM_BASE = 'bitcoin_dominance';
const DOM_STORAGE_KEY = 'dominanceUnit';
const DOM_UNITS = ['usd', 'btc'];
const POF_BASE = 'price_of_';
const POF_STORAGE_KEY = 'pofItem';
const POF_FAV_KEY = 'price_of_*';
const POF_SORT_STORAGE_KEY = 'pofSort';
let PRICE_OF_OPTIONS = [];
let PRICE_OF_META = {};
const COIN_STORAGE_KEY = 'coinType';
const COIN_ORDER = ['wholecoins', 'pi_coins', 'v_coins', 'x_coins', 'l_coins', 'c_coins', 'd_coins', 'm_coins'];
let COIN_OPTIONS = [];
let COIN_META = {};
const MYR_BASE = 'monthly_yearly_returns';
let MYR_RANGES = [];
const MYR_START_YEAR = 2010;
const MYR_DEFAULT_RANGE = `${THIS_YEAR - 4} - ${THIS_YEAR}`;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_DELAY = 300;
const MAX_TAP_MOVE_PX = 12;
const SLIDE_EXP_KEY = 'slideshowExp';
const BUY_COFFEE_METHOD_KEY = 'buyCoffeeMethod';

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
const yearControls = document.getElementById('year-controls');
const yearSelect = document.getElementById('year-select');
const scaleControls = document.getElementById('scale-controls');
const scaleSelect = document.getElementById('scale-select');
const hashControls = document.getElementById('hashlen-controls');
const hashSelect = document.getElementById('hashlen-select');
const dominanceControls = document.getElementById('dominance-controls');
const dominanceSelect = document.getElementById('dominance-select');
const priceOfControls = document.getElementById('priceof-controls');
const priceOfSelect = document.getElementById('priceof-select');
const pofSortControls = document.getElementById('pof-sort-controls');
const pofSortSelect = document.getElementById('pof-sort-select');
const pofIndexInput = document.getElementById('pof-index-input');
const pofIndexTotal = document.getElementById('pof-index-total');
const coinControls = document.getElementById('coin-controls');
const coinSelect = document.getElementById('coin-select');
const myrControls = document.getElementById('myr-controls');
const myrSelect = document.getElementById('myr-select');
const alignmentControls = document.getElementById('alignment-controls');
const alignmentSelect = document.getElementById('alignment-select');
const uoaControls = document.getElementById('uoa-controls');
const uoaSelect = document.getElementById('uoa-select');
const sortControls = document.getElementById('sort-controls');
const uoaSortSelect = document.getElementById('sort-select');
const uoaIndexInput = document.getElementById('uoa-index-input');
const uoaIndexTotal = document.getElementById('uoa-index-total');
const uoaShowControls = document.getElementById('uoa-show-controls');
const uoaShowSelect = document.getElementById('uoa-show-select');
const buyMeBtn = document.getElementById('buyCoffeeBtn');
const favoritesToggleBtn = document.getElementById('favoritesToggle');
const buyCoffeeMethodBtns = Array.from(document.querySelectorAll('.buy-coffee-method-btn'));

/* ===========================
 * GLOBAL STATE
 * =========================== */
let imageList = [];
let visibleImages = [];
let currentIndex = 0;
let lastOpenedFilename = null;
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
let lastTapX = 0;
let lastTapY = 0;
let singleTapMoved = false;
let nonModalFocusable = [];
let thanksOverlay = null;
let thanksToastTimeout = null;
let isBuyMeVisible = false;
let buyCoffeeCloseBtn = null;
let tempNonFavInjected = false;

/* ===========================
 * PERSISTENCE (cookies + localStorage)
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
function readSearchPrefs() {
    const t = localStorage.getItem('searchTitles');
    const d = localStorage.getItem('searchDescriptions');
    let inTitle = t === null ? true : t === 'true';
    let inDesc = d === null ? true : d === 'true';
    if (!inTitle && !inDesc) {
        inTitle = true;
        inDesc = false;
    }
    return {inTitle, inDesc};
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
    const {inTitle, inDesc} = readSearchPrefs();
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
    let {inTitle, inDesc} = readSearchPrefs();
    if (which === 'title') {
        if (inTitle && !inDesc) {
            inTitle = false;
            inDesc = true;
        } else inTitle = !inTitle;
    } else {
        if (inDesc && !inTitle) {
            inDesc = false;
            inTitle = true;
        } else inDesc = !inDesc;
    }
    if (!inTitle && !inDesc) {
        if (which === 'title') inTitle = true;
        else inDesc = true;
    }
    writeSearchPrefs(inTitle, inDesc);
    applySearchPrefsToUI(inTitle, inDesc);
    if (isSearchHappening()) filterImages();
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
 * CORE HELPERS (url + image src + geometry)
 * =========================== */
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
        thumb.dataset.filename = newFilename;
        thumb.src = imgSrc(newFilename);
        if (newAlt) thumb.alt = newAlt;
    }
}
function showYearControls(show) {
    yearControls?.classList.toggle('show', !!show);
}
function showScaleControls(show) {
    scaleControls?.classList.toggle('show', !!show);
}
function showHashControls(show) {
    hashControls?.classList.toggle('show', !!show);
}
function showPriceOfControls(show) {
    const on = !!show;
    priceOfControls?.classList.toggle('show', on);
    pofSortControls?.classList.toggle('show', on);
}
function showUoaControls(show) {
    const on = !!show;
    if (uoaControls) uoaControls.classList.toggle('show', on);
    if (sortControls) sortControls.classList.toggle('show', on);
    if (uoaShowControls) uoaShowControls.classList.toggle('show', on);
}
function showDominanceControls(show) {
    dominanceControls?.classList.toggle('show', !!show);
}
function showCoinControls(show) {
    coinControls?.classList.toggle('show', !!show);
}
function showMyrControls(show) {
    myrControls?.classList.toggle('show', !!show);
}
function showAlignmentControls(show) {
    alignmentControls?.classList.toggle('show', !!show);
}
function setModalLinks({x = '', nostr = '', youtube = ''} = {}) {
    const xLink = document.getElementById('x-link');
    const nostrLink = document.getElementById('nostr-link');
    const ytLink = document.getElementById('youtube-link');
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
function openByFilenameAllowingNonFav(filename) {
    let idx = visibleImages.findIndex(img => img.filename === filename);
    if (idx !== -1) {
        openModalByIndex(idx);
        return true;
    }
    const fullIdx = imageList.findIndex(img => img.filename === filename);
    if (fullIdx !== -1) {
        visibleImages = [imageList[fullIdx], ...visibleImages];
        tempNonFavInjected = true;
        openModalByIndex(0);
        return true;
    }
    return false;
}
function setModalImageAndCenter(filename, altText = '') {
    modalImg.dataset.filename = filename;
    modalImg.alt = altText || '';
    modalImg.src = imgSrc(filename);
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
function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}
function distance(touches) {
    const [a, b] = touches;
    const dx = b.clientX - a.clientX,
        dy = b.clientY - a.clientY;
    return Math.hypot(dx, dy);
}
function midpoint(touches) {
    const [a, b] = touches;
    return {x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2};
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
    return {u, v, xRel, yRel};
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
    return {baseW: nw * fit, baseH: nh * fit, vpW: vp.width, vpH: vp.height, offset, availH};
}
function centerImageAtScale1() {
    const {baseW, baseH, vpW, vpH, offset} = computeBaseSizeAtScale1();
    currentScale = 1;
    translateX = (vpW - baseW) / 2;
    translateY = offset + (vpH - offset - baseH) / 2;
    applyTransform();
}
function resetZoomAndCenterAnimated() {
    const {baseW, baseH, vpW, vpH, offset} = computeBaseSizeAtScale1();
    currentScale = 1;
    translateX = (vpW - baseW) / 2;
    translateY = offset + (vpH - offset - baseH) / 2;
    modalImg.style.transition = 'transform 0.25s ease-out';
    applyTransform();
    modal.classList.remove('zoomed');
    pinchFocus = null;
    setTimeout(() => {
        modalImg.style.transition = '';
    }, 300);
}
function zoomToPoint(targetScale, clientX, clientY) {
    const {u, v, xRel, yRel} = screenPointToImageLocal(clientX, clientY);
    currentScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);
    translateX = xRel - u * currentScale;
    translateY = yRel - v * currentScale;
    modal.classList.add('zoomed');
    clampPanToBounds();
    modalImg.style.transition = 'transform 0.2s ease-out';
    applyTransform();
    setTimeout(() => {
        modalImg.style.transition = '';
    }, 220);
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
    const {baseW, baseH, vpW, availH, offset} = computeBaseSizeAtScale1();
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
function getContainerOrigin() {
    const r = modal.getBoundingClientRect();
    return {ox: r.left, oy: r.top};
}
function setSearchInputFocusability(active) {
    const input = document.getElementById('search-input');
    if (!input) return;
    if (active) {
        const orig = input.getAttribute('data-original-tabindex');
        if (orig !== null) {
            if (orig === '') input.removeAttribute('tabindex');
            else input.setAttribute('tabindex', orig);
        } else {
            input.removeAttribute('tabindex');
        }
        input.removeAttribute('aria-hidden');
    } else {
        if (!input.hasAttribute('data-original-tabindex')) {
            const existing = input.getAttribute('tabindex');
            input.setAttribute('data-original-tabindex', existing === null ? '' : existing);
        }
        input.setAttribute('tabindex', '-1');
        input.setAttribute('aria-hidden', 'true');
    }
}
function getImgVersion() {
    const BUCKET_MS = 15 * 60 * 1000;
    return Math.floor(Date.now() / BUCKET_MS);
}
function imgSrc(filename) {
    return `final_frames/${filename}?v=${getImgVersion()}`;
}

/* ===========================
 * IMAGE LOADING (cache-bust + refresh)
 * =========================== */
let lastImgVersion = getImgVersion();
function refreshVisibleImagesForNewVersion() {
    document.querySelectorAll('img.grid-thumb').forEach(img => {
        const filename = img.dataset.filename;
        if (!filename) return;
        img.src = imgSrc(filename);
    });
    if (modal && modal.style.display === 'flex' && modalImg && modalImg.dataset.filename) {
        const fname = modalImg.dataset.filename;
        modalImg.src = imgSrc(fname);
    }
    if (typeof isSlideshowOpen === 'function' && isSlideshowOpen() && slideshowImg && slideshowImg.dataset.filename) {
        const fname = slideshowImg.dataset.filename;
        slideshowImg.src = imgSrc(fname);
    }
}
(function setupImageVersionRefresh() {
    function checkForNewVersion() {
        const v = getImgVersion();
        if (v !== lastImgVersion) {
            lastImgVersion = v;
            refreshVisibleImagesForNewVersion();
        }
    }
    setInterval(checkForNewVersion, 60 * 1000);
})();

/* ===========================
 * GRID: LAYOUT + FILTER/RENDER
 * =========================== */
function filterImages() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('image-grid');
    grid.innerHTML = '';
    visibleImages = imageList.filter(({title, description, filename}) => {
        const {inTitle, inDesc} = readSearchPrefs();
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
    message.style.display = showFavoritesOnly && visibleImages.length === 0 ? 'block' : 'none';
    visibleImages.forEach(({filename, title, description}, index) => {
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
        img.dataset.filename = filename;
        img.alt = title || '';
        img.tabIndex = 0;
        img.addEventListener('click', (e) => {
        e.preventDefault();
        openModalByIndex(index);
        });
        img.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        openModalByIndex(index);
        });
        img.onload = () => { spinner.remove(); img.style.opacity = 1; };
        img.onerror = () => { spinner.remove(); img.style.opacity = 1; };
        img.src = imgSrc(filename);
        const star = document.createElement('div');
        star.className = 'favorite-star';
        const favOn = isFavorite(filename);
        star.textContent = favOn ? '★' : '☆';
        if (favOn) star.classList.add('filled');
        const favKeyForThisCard = filename.startsWith(POF_BASE) ? POF_FAV_KEY : filename;
        star.setAttribute('data-filename', favKeyForThisCard);
        star.onclick = e => {
            e.stopPropagation();
            toggleFavorite(filename, star);
        };
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
        setSearchInputFocusability(true);
        if (userSelectedLayout !== 'list') setLayout('list', false);
    } else {
        toggleIconsEl.style.display = 'inline-flex';
        if (searchWasInitiallyClosed && searchInput.value.trim() === '') {
            searchContainer.classList.remove('active');
            searchBtn.classList.remove('active');
        }
        searchBtn.disabled = false;
        setSearchInputFocusability(searchContainer.classList.contains('active'));
        const storedLayout = localStorage.getItem('preferredLayout');
        const preferred =
            userSelectedLayout ||
            (storedLayout === 'grid' || storedLayout === 'list' ? storedLayout : null) ||
            (imageGrid.classList.contains('list') ? 'list' : 'grid');
        setLayout(preferred, false);
    }
}
function toggleSearch() {
    const container = document.querySelector('.search-container');
    const input = document.getElementById('search-input');
    const button = document.getElementById('search-btn');
    const nowActive = !container.classList.contains('active');
    container.classList.toggle('active');
    button.classList.toggle('active', nowActive);
    setSearchInputFocusability(nowActive);
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
    const firstOpen = modal.style.display !== 'flex';
    currentIndex = index;
    lastOpenedFilename = image.filename || null;
    if (firstOpen) {
        const focusable = document.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        nonModalFocusable = [];
        focusable.forEach(el => {
            if (!modal.contains(el)) {
                const prev = el.getAttribute('tabindex');
                nonModalFocusable.push({ el, prev });
                el.setAttribute('tabindex', '-1');
            }
        });
    }
    modal.style.display = 'flex';
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
    setTimeout(updateModalSafePadding, 0);
    document.body.style.overflow = 'hidden';
    setModalLinks({
        x: image.latest_x || '',
        nostr: image.latest_nostr || '',
        youtube: image.latest_youtube || ''
    });
    populateYearSelect();
    const fname = image.filename;
    showYearControls(false);
    showScaleControls(false);
    showHashControls(false);
    showPriceOfControls(false);
    showDominanceControls(false);
    showCoinControls(false);
    showMyrControls(false);
    showAlignmentControls(false);
    showUoaControls(false);
    if (isBvgFile(fname)) {
        showYearControls(true);
        const chosenYear = extractBvgYear(fname) || getStoredBvgYear();
        yearSelect.value = chosenYear;
        setBvgYear(chosenYear);
    } else if (isDominanceFile(fname)) {
        showDominanceControls(true);
        const unit = domUnitFromFilename(fname) || getStoredDominanceUnit();
        dominanceSelect.value = unit;
        setDominanceUnit(unit);
    } else if (isDalFile(fname)) {
        showScaleControls(true);
        const sc = dalScaleFromFilename(fname) || getStoredDalScale();
        scaleSelect.value = sc;
        setDalScale(sc);
    } else if (isPotdFile(fname)) {
        showScaleControls(true);
        const sc = potdScaleFromFilename(fname) || getStoredPotdScale();
        scaleSelect.value = sc;
        setPotdScale(sc);
    } else if (isNlbpFile(fname)) {
        showScaleControls(true);
        const sc = nlbpScaleFromFilename(fname) || getStoredNlbpScale();
        scaleSelect.value = sc;
        setNlbpScale(sc);
    } else if (isHalvingCyclesFile(fname)) {
        showAlignmentControls(true);
        populateAlignmentSelect();
        const align = alignmentFromFilename(fname);
        if (alignmentSelect) alignmentSelect.value = align;
        setHalvingAlignment(align);
    } else if (isPriceOfFile(fname)) {
        showPriceOfControls(true);
        sortPriceOfOptions(getStoredPofSort());
        if (pofSortSelect) {
            pofSortSelect.value = getStoredPofSort();
        }
        let chosenSlug = pofSlugFromFilename(fname) || getStoredPofItem();
        if (!PRICE_OF_OPTIONS.some(o => o.slug === chosenSlug)) {
            chosenSlug =
                PRICE_OF_OPTIONS.find(o => o.slug === 'ground_beef')?.slug ||
                PRICE_OF_OPTIONS[0]?.slug;
        }
        priceOfSelect.value = chosenSlug;
        const meta = PRICE_OF_META[chosenSlug];
        if (meta) applyPostLinksFromMeta(meta);
        setPriceOfItem(chosenSlug);
        updatePofIndexUiBySlug(chosenSlug);
    } else if (isUoaFile(fname)) {
        showUoaControls(true);
        sortUoaOptions(getStoredUoaSort());
        populateUoaSelect();
        let chosenSlug = uoaSlugFromFilename(fname) || getStoredUoaItem();
        if (!UOA_OPTIONS.some(o => o.slug === chosenSlug)) {
            chosenSlug = UOA_OPTIONS[0]?.slug || chosenSlug;
        }
        if (uoaSelect) uoaSelect.value = chosenSlug;
        if (uoaSortSelect) {
            uoaSortSelect.value = getStoredUoaSort();
        }
        if (uoaShowSelect) {
            uoaShowSelect.value = getStoredUoaShowMode();
        }
        setUoaItem(chosenSlug);
    } else if (isTargetHashFile(fname)) {
        showHashControls(true);
        const len = hashLengthFromFilename(fname);
        if (hashSelect) hashSelect.value = len;
        setHashLength(len);
    } else if (isCoinFile(fname)) {
        showCoinControls(true);
        populateCoinSelect();
        let chosen = coinSlugFromFilename(fname) || getStoredCoinSlug();
        if (!COIN_OPTIONS.some(o => o.slug === chosen)) {
            chosen = COIN_OPTIONS[0]?.slug || 'wholecoins';
        }
        coinSelect.value = chosen;
        setCoinType(chosen);
    } else if (isMyrFile(fname)) {
        showMyrControls(true);
        populateMyrSelect();
        const chosenRange = myrRangeFromFilename(fname) || MYR_DEFAULT_RANGE;
        myrSelect.value = chosenRange;
        setMyrRange(chosenRange);
    } else {
        setModalImageAndCenter(fname, image.title);
        replaceUrlForFilename(fname);
    }
    const fav = isFavorite(visibleImages[currentIndex].filename);
    modalFavBtn.textContent = fav ? '★' : '☆';
    modalFavBtn.classList.toggle('filled', fav);
    requestAnimationFrame(() => {
        const focusableButtons = Array.from(
            modal.querySelectorAll('button, [role="button"], [data-modal-close]')
        );
        let closeBtn = focusableButtons.find(btn => {
            if (!modal.contains(btn)) return false;
            const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
            const text = (btn.textContent || '').toLowerCase().trim();
            return (
                ariaLabel.includes('close') ||
                text === '×' ||
                text === 'x' ||
                text.includes('close')
            );
        });
        if (closeBtn && typeof closeBtn.focus === 'function') {
            closeBtn.focus();
        } else if (modalFavBtn && typeof modalFavBtn.focus === 'function') {
            modalFavBtn.focus();
        }
    });
}
function closeModal() {
    modal.style.display = 'none';
    history.replaceState(null, '', '/');
    document.body.style.overflow = '';
    nonModalFocusable.forEach(({ el, prev }) => {
        if (prev === null) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', prev);
    });
    nonModalFocusable = [];
    if (justUnstarredInModal) {
        justUnstarredInModal = false;
        filterImages();
    }
    showYearControls(false);
    showScaleControls(false);
    showHashControls(false);
    showPriceOfControls(false);
    showMyrControls(false);
    showDominanceControls(false);
    showCoinControls(false);
    showAlignmentControls(false);
    try {
        const cur = visibleImages[currentIndex];
        if (cur && isMyrFile(cur.filename) && cur.filename !== `${MYR_BASE}.png`) {
            const defaultFile = `${MYR_BASE}.png`;
            cur.filename = defaultFile;
            updateGridThumbAtCurrent(defaultFile);
        }
    } catch (_) {}
    if (tempNonFavInjected) {
        tempNonFavInjected = false;
        filterImages();
    }
    isPinching = false;
    isPanning = false;
    gestureConsumed = false;
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    pinchFocus = null;
    modalImg.style.transform = '';
    modalImg.style.transformOrigin = '';
    modal.classList.remove('zoomed');
    modal.style.removeProperty('--controls-offset');
    if (typeof currentIndex === 'number' && currentIndex >= 0) {
        const thumb = document.querySelector(
            `img.grid-thumb[data-grid-index="${currentIndex}"]`
        );
        if (thumb && typeof thumb.focus === 'function') {
            requestAnimationFrame(() => thumb.focus());
        }
    }
}
function handleSwipe() {
    if (isPinching || currentScale > 1.001 || modal.classList.contains('zoomed')) return;
    const swipeDistance = touchEndX - touchStartX;
    const minSwipe = 50;
    if (Math.abs(swipeDistance) > minSwipe) {
        if (swipeDistance < 0) nextImage();
        else prevImage();
    }
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
modalImg.addEventListener(
    'touchstart',
    e => {
        if (e.touches.length === 2) {
            isPinching = true;
            gestureConsumed = true;
            modal.classList.add('zoomed');
            startPinchDistance = distance(e.touches);
            startScale = currentScale;
            const {x, y} = midpoint(e.touches);
            const {ox, oy} = getContainerOrigin();
            const focusUx = (x - ox - translateX) / startScale;
            const focusUy = (y - oy - translateY) / startScale;
            pinchFocus = {focusUx, focusUy};
        } else if (e.touches.length === 1) {
            singleTapMoved = false;
            modalImg.style.transition = '';
            if (currentScale > 1) {
                isPanning = true;
                gestureConsumed = true;
                panStartX = e.touches[0].clientX - translateX;
                panStartY = e.touches[0].clientY - translateY;
            }
        }
    },
    {passive: false}
);
modalImg.addEventListener(
    'touchmove',
    e => {
        if (isPinching && e.touches.length === 2) {
            e.preventDefault();
            const s = startScale * (distance(e.touches) / startPinchDistance);
            currentScale = clamp(s, MIN_SCALE, MAX_SCALE);
            const {x, y} = midpoint(e.touches);
            const {ox, oy} = getContainerOrigin();
            if (pinchFocus) {
                const {focusUx, focusUy} = pinchFocus;
                translateX = x - ox - focusUx * currentScale;
                translateY = y - oy - focusUy * currentScale;
                if (currentScale === MIN_SCALE) {
                    translateX = x - ox - focusUx * MIN_SCALE;
                    translateY = y - oy - focusUy * MIN_SCALE;
                }
            }
            clampPanToBounds();
            applyTransform();
        } else if (isPanning && e.touches.length === 1 && currentScale > 1) {
            e.preventDefault();
            const cx = e.touches[0].clientX,
                cy = e.touches[0].clientY;
            translateX = cx - panStartX;
            translateY = cy - panStartY;
            clampPanToBounds();
            applyTransform();
        } else if (e.touches.length === 1 && currentScale <= 1.001) {
            const dx = Math.abs(e.touches[0].clientX - (lastTapX || e.touches[0].clientX));
            const dy = Math.abs(e.touches[0].clientY - (lastTapY || e.touches[0].clientY));
            if (dx > MAX_TAP_MOVE_PX || dy > MAX_TAP_MOVE_PX) singleTapMoved = true;
        }
    },
    {passive: false}
);
modalImg.addEventListener('touchend', e => {
    if (isPinching && e.touches.length === 1) {
        isPinching = false;
        pinchFocus = null;
        if (currentScale > 1) {
            const t = e.touches[0];
            panStartX = t.clientX - translateX;
            panStartY = t.clientY - translateY;
            isPanning = true;
            gestureConsumed = true;
        } else {
            isPanning = false;
        }
        return;
    }
    if (e.touches.length === 0) {
        const now = Date.now();
        const t = e.changedTouches[0];
        const dt = now - lastTapTime;
        const closeToLast = Math.abs(t.clientX - lastTapX) < 12 && Math.abs(t.clientY - lastTapY) < 12;
        if (!singleTapMoved && dt > 0 && dt <= DOUBLE_TAP_DELAY && closeToLast) {
            gestureConsumed = true;
            modalImg.style.transition = '';
            if (currentScale <= 1.001) {
                zoomToPoint(3, t.clientX, t.clientY);
            } else {
                resetZoomAndCenterAnimated();
            }
            lastTapTime = 0;
            lastTapX = lastTapY = 0;
            return;
        }
        lastTapTime = now;
        lastTapX = t.clientX;
        lastTapY = t.clientY;
        isPinching = false;
        isPanning = false;
        pinchFocus = null;
        if (currentScale <= 1.001) {
            currentScale = 1;
            modal.classList.remove('zoomed');
            centerImageAtScale1();
        }
        setTimeout(() => {
            gestureConsumed = false;
        }, 0);
    }
});
let lastDownTime = 0;
let lastDownX = 0;
let lastDownY = 0;
modalImg.addEventListener(
    'pointerdown',
    e => {
        if (e.pointerType !== 'mouse') return;
        modalImg.style.transition = '';
        const now = Date.now();
        const x = e.clientX,
            y = e.clientY;
        const dt = now - lastDownTime;
        const closeToLast = Math.abs(x - lastDownX) <= 12 && Math.abs(y - lastDownY) <= 12;
        if (dt > 0 && dt <= DOUBLE_TAP_DELAY && closeToLast) {
            e.preventDefault();
            e.stopPropagation();
            gestureConsumed = true;
            if (currentScale <= 1.001) {
                zoomToPoint(3, x, y);
            } else {
                resetZoomAndCenterAnimated();
            }
            lastDownTime = 0;
            lastDownX = 0;
            lastDownY = 0;
            return;
        }
        lastDownTime = now;
        lastDownX = x;
        lastDownY = y;
    },
    {passive: false}
);
modalImg.addEventListener('mousedown', e => {
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
window.addEventListener('mousemove', e => {
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
    setTimeout(() => {
        gestureConsumed = false;
    }, 0);
}
window.addEventListener('mouseup', endMousePan);
window.addEventListener('mouseleave', endMousePan);
modalImg.addEventListener(
    'click',
    e => {
        if (mouseHadMoved) {
            e.preventDefault();
            e.stopPropagation();
        }
        mouseHadMoved = false;
    },
    true
);
modalImg.addEventListener('touchcancel', () => {
    isPinching = false;
    isPanning = false;
    pinchFocus = null;
    if (currentScale <= 1.001) {
        currentScale = 1;
        modal.classList.remove('zoomed');
        centerImageAtScale1();
    }
    gestureConsumed = false;
});
modalImg.addEventListener('dragstart', e => e.preventDefault());
function prevImage() {
    if (justUnstarredInModal) {
        justUnstarredInModal = false;
        filterImages();
    }
    const prevIndex = (currentIndex - 1 + visibleImages.length) % visibleImages.length;
    openModalByIndex(prevIndex);
}
function nextImage() {
    if (justUnstarredInModal) {
        justUnstarredInModal = false;
        filterImages();
    }
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
        modalFavBtn.textContent = '☆';
        modalFavBtn.classList.remove('filled');
        if (gridStar) {
            gridStar.textContent = '☆';
            gridStar.classList.remove('filled');
        }
    } else {
        if (favKey === POF_FAV_KEY) favs = favs.filter(f => !/^price_of_/.test(f));
        favs.push(favKey);
        modalFavBtn.textContent = '★';
        modalFavBtn.classList.add('filled');
        if (gridStar) {
            gridStar.textContent = '★';
            gridStar.classList.add('filled');
        }
    }
    saveFavorites(favs);
    if (showFavoritesOnly && index !== -1) justUnstarredInModal = true;
}

/* ===========================
 * MODULE: Bitcoin vs Gold (BVG)
 * =========================== */
function isBvgFile(fname) {
    return fname.startsWith(BVG_BASE);
}
function bvgFilenameForYear(y) {
    return `${BVG_BASE}_${y}.png`;
}
function extractBvgYear(fname) {
    const m = fname.match(/bitcoin_vs_gold_(\d{4})\.png$/);
    return m ? m[1] : null;
}
function getStoredBvgYear() {
    return localStorage.getItem(BVG_STORAGE_KEY) || '2018';
}
function setStoredBvgYear(y) {
    localStorage.setItem(BVG_STORAGE_KEY, y);
}
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
function isDalFile(fname) {
    return fname.startsWith(DAL_BASE);
}
function dalScaleFromFilename(fname) {
    return /_log\.png$/.test(fname) ? 'log' : 'linear';
}
function dalFilenameForScale(scale) {
    return scale === 'log' ? `${DAL_BASE}_log.png` : `${DAL_BASE}.png`;
}
function getStoredDalScale() {
    return localStorage.getItem(DAL_STORAGE_KEY) || 'linear';
}
function setStoredDalScale(s) {
    localStorage.setItem(DAL_STORAGE_KEY, s);
}
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
    const current = scaleSelect?.value || getStoredDalScale();
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
 * MODULE: Price On This Day (POTD)
 * =========================== */
const POTD_BASE = 'price_on_this_day';
const POTD_STORAGE_KEY = 'potdScale';
const POTD_SCALES = ['linear', 'log'];

function isPotdFile(fname) {
    return fname.startsWith(POTD_BASE);
}
function potdScaleFromFilename(fname) {
    return /_log\.png$/.test(fname) ? 'log' : 'linear';
}
function potdFilenameForScale(scale) {
    return scale === 'log'
        ? `${POTD_BASE}_log.png`
        : `${POTD_BASE}.png`;
}
function getStoredPotdScale() {
    return localStorage.getItem(POTD_STORAGE_KEY) || 'linear';
}
function setStoredPotdScale(s) {
    localStorage.setItem(POTD_STORAGE_KEY, s);
}
function setPotdScale(scale) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isPotdFile(oldFilename)) return;
    const newFilename = potdFilenameForScale(scale);
    setStoredPotdScale(scale);
    const newTitle = `Price On This Day (${scale})`;
    setModalImageAndCenter(newFilename, newTitle);
    replaceUrlForFilename(newFilename);
    visibleImages[currentIndex].filename = newFilename;
    updateGridThumbAtCurrent(newFilename);
    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}
function cyclePotdScale(direction) {
    const current = scaleSelect?.value || getStoredPotdScale();
    const idx = POTD_SCALES.indexOf(current);
    if (idx === -1) return;
    const delta = direction === 'up' ? -1 : 1;
    const newIdx = (idx + delta + POTD_SCALES.length) % POTD_SCALES.length;
    const next = POTD_SCALES[newIdx];
    if (scaleSelect) scaleSelect.value = next;
    setPotdScale(next);
}

/* ===========================
 * MODULE: Dominance (USD/BTC)
 * =========================== */
function isDominanceFile(fname) {
    return fname.startsWith(DOM_BASE);
}
function domUnitFromFilename(fname) {
    return /_btc\.png$/.test(fname) ? 'btc' : 'usd';
}
function domFilenameForUnit(u) {
    return u === 'btc' ? `${DOM_BASE}_btc.png` : `${DOM_BASE}.png`;
}
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
    const current = dominanceSelect?.value || getStoredDominanceUnit();
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
 * MODULE: Never Look Back Price (NLBP)
 * =========================== */
const NLBP_BASE = 'never_look_back_price';
const NLBP_STORAGE_KEY = 'nlbpScale';
const NLBP_SCALES = ['linear', 'log'];
function isNlbpFile(fname) {
    return fname.startsWith(NLBP_BASE);
}
function nlbpScaleFromFilename(fname) {
    return /_log\.png$/.test(fname) ? 'log' : 'linear';
}
function nlbpFilenameForScale(scale) {
    return scale === 'log'
        ? `${NLBP_BASE}_log.png`
        : `${NLBP_BASE}.png`;
}
function getStoredNlbpScale() {
    return localStorage.getItem(NLBP_STORAGE_KEY) || 'linear';
}
function setStoredNlbpScale(s) {
    localStorage.setItem(NLBP_STORAGE_KEY, s);
}
function setNlbpScale(scale) {
    const oldFilename = visibleImages[currentIndex].filename;
    if (!isNlbpFile(oldFilename)) return;
    const newFilename = nlbpFilenameForScale(scale);
    setStoredNlbpScale(scale);
    const newTitle = `Never Look Back Price (${scale})`;
    setModalImageAndCenter(newFilename, newTitle);
    replaceUrlForFilename(newFilename);
    visibleImages[currentIndex].filename = newFilename;
    updateGridThumbAtCurrent(newFilename);
    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}
function cycleNlbpScale(direction) {
    const current = scaleSelect?.value || getStoredNlbpScale();
    const idx = NLBP_SCALES.indexOf(current);
    if (idx === -1) return;
    const delta = direction === 'up' ? -1 : 1;
    const newIdx = (idx + delta + NLBP_SCALES.length) % NLBP_SCALES.length;
    const next = NLBP_SCALES[newIdx];
    if (scaleSelect) scaleSelect.value = next;
    setNlbpScale(next);
}

/* ===========================
 * MODULE: Target & Block Hashes length (32 / 64)
 * =========================== */
const TARGET_HASH_BASE = 'target_and_block_hashes';
const TARGET_HASH_32 = 'target_and_block_hashes.png';
const TARGET_HASH_64 = 'target_and_block_hashes_64.png';
const TARGET_HASH_LENGTHS = ['32', '64'];
function isTargetHashFile(fname) {
    return fname === TARGET_HASH_32 || fname === TARGET_HASH_64;
}
function hashLengthFromFilename(fname) {
    return fname === TARGET_HASH_64 ? '64' : '32';
}
function targetHashFilenameForLength(len) {
    return String(len) === '64' ? TARGET_HASH_64 : TARGET_HASH_32;
}
function setHashLength(len) {
    const image = visibleImages[currentIndex];
    if (!image || !isTargetHashFile(image.filename)) return;
    const oldFilename = image.filename;
    const newFilename = targetHashFilenameForLength(len);
    const title = image.title || 'Target & Block Hashes';
    const description = image.description || '';
    setModalImageAndCenter(newFilename, title);
    replaceUrlForFilename(newFilename);
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title,
        description,
        latest_x: image.latest_x || '',
        latest_nostr: image.latest_nostr || '',
        latest_youtube: image.latest_youtube || ''
    });
    updateGridThumbAtCurrent(newFilename, title);
    const gridImg = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    const cardContainer = gridImg ? gridImg.closest('.chart-container') : null;
    if (cardContainer) {
        const tip = description || title;
        cardContainer.setAttribute('title', tip);
        if (gridImg) gridImg.alt = title;
    }
    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
    if (hashSelect) hashSelect.value = String(len);
}
function cycleHashLength(direction) {
    if (!hashSelect) return;
    const current = hashSelect.value || hashLengthFromFilename(visibleImages[currentIndex]?.filename || TARGET_HASH_32);
    const idx = TARGET_HASH_LENGTHS.indexOf(current);
    if (idx === -1) return;
    const delta = direction === 'up' ? -1 : 1;
    const len = TARGET_HASH_LENGTHS.length;
    const newIdx = (idx + delta + len) % len;
    const next = TARGET_HASH_LENGTHS[newIdx];
    hashSelect.value = next;
    setHashLength(next);
}

/* ===========================
 * MODULE: Halving Cycles Alignment
 * =========================== */
const HALVING_ALIGN_OPTIONS = ['block', 'days'];
const HALVING_STORAGE_KEY = 'halvingAlignment';
let HALVING_META = {};
function isHalvingCyclesFile(fname) {
    return fname === 'halving_cycles.png' || fname === 'halving_cycles_days.png';
}
function alignmentFromFilename(fname) {
    return fname === 'halving_cycles_days.png' ? 'days' : 'block';
}
function halvingFilenameForAlignment(alignment) {
    return alignment === 'days' ? 'halving_cycles_days.png' : 'halving_cycles.png';
}
function buildHalvingMetaFromList(list) {
    HALVING_META = {};
    list.forEach(img => {
        if (isHalvingCyclesFile(img.filename)) {
            HALVING_META[img.filename] = {
                title: img.title || '',
                description: img.description || '',
                latest_x: img.latest_x || '',
                latest_nostr: img.latest_nostr || '',
                latest_youtube: img.latest_youtube || ''
            };
        }
    });
}
function populateAlignmentSelect() {
    if (!alignmentSelect) return;

    alignmentSelect.innerHTML = HALVING_ALIGN_OPTIONS.map(opt => {
        const label =
            opt === 'block'
                ? 'Block Height'
                : 'Days After Halving';
        return `<option value="${opt}">${label}</option>`;
    }).join('');
}
function getStoredHalvingAlignment() {
    const v = localStorage.getItem(HALVING_STORAGE_KEY);
    return HALVING_ALIGN_OPTIONS.includes(v) ? v : 'block';
}
function setStoredHalvingAlignment(a) {
    if (!HALVING_ALIGN_OPTIONS.includes(a)) a = 'block';
    localStorage.setItem(HALVING_STORAGE_KEY, a);
}
function setHalvingAlignment(alignment) {
    if (!HALVING_ALIGN_OPTIONS.includes(alignment)) alignment = 'block';
    const cur = visibleImages[currentIndex];
    if (!cur || !isHalvingCyclesFile(cur.filename)) return;
    const oldFilename = cur.filename;
    const newFilename = halvingFilenameForAlignment(alignment);
    setStoredHalvingAlignment(alignment);
    const meta = HALVING_META[newFilename] || {};
    const fallbackTitle =
        meta.title ||
        (alignment === 'days'
            ? 'Halving Cycles (Days After Halving)'
            : 'Halving Cycles (Block-Height Aligned)');
    const newTitle = meta.title || cur.title || fallbackTitle;
    const newDescription = meta.description || cur.description || '';
    const latest_x = meta.latest_x || cur.latest_x || '';
    const latest_nostr = meta.latest_nostr || cur.latest_nostr || '';
    const latest_youtube = meta.latest_youtube || cur.latest_youtube || '';
    setModalImageAndCenter(newFilename, newTitle);
    replaceUrlForFilename(newFilename);
    setModalLinks({ x: latest_x, nostr: latest_nostr, youtube: latest_youtube });
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title: newTitle,
        description: newDescription,
        latest_x,
        latest_nostr,
        latest_youtube
    });
    const titleEl = document.querySelector(`.chart-title[data-grid-index="${currentIndex}"]`);
    if (titleEl) titleEl.textContent = newTitle;
    const descEl = document.querySelector(`.chart-description[data-grid-index="${currentIndex}"]`);
    if (descEl) descEl.textContent = newDescription;
    updateGridThumbAtCurrent(newFilename, newTitle);
    const gridImg = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    const cardContainer = gridImg ? gridImg.closest('.chart-container') : null;
    if (cardContainer) {
        const tip = newDescription || newTitle;
        cardContainer.setAttribute('title', tip);
        if (gridImg) gridImg.alt = newTitle;
    }
    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
}
function cycleHalvingAlignment(direction) {
    if (!alignmentSelect) return;
    const current = alignmentSelect.value || alignmentFromFilename(visibleImages[currentIndex]?.filename || '');
    const idx = HALVING_ALIGN_OPTIONS.indexOf(current);
    if (idx === -1) return;
    const delta = direction === 'up' ? -1 : 1;
    const len = HALVING_ALIGN_OPTIONS.length;
    const newIdx = (idx + delta + len) % len;
    const next = HALVING_ALIGN_OPTIONS[newIdx];
    alignmentSelect.value = next;
    setHalvingAlignment(next);
}

/* ===========================
 * MODULE: Price Of (price_of_*)
 * =========================== */
function isPriceOfFile(fname) {
    return fname.startsWith(POF_BASE);
}
function pofSlugFromFilename(fname) {
    const m = fname.match(/^price_of_([a-z0-9_]+)\.png$/);
    return m ? m[1] : null;
}
function pofFilenameForSlug(slug) {
    return `${POF_BASE}${slug}.png`;
}
function slugToTitle(slug) {
    return slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function buildPriceOfOptionsFromList(list) {
    const bySlug = new Map();
    list.forEach(img => {
        const m = img.filename.match(/^price_of_([a-z0-9_]+)\.png$/);
        if (!m) return;
        const slug = m[1];
        const rawMsat = img.pof_msat ?? img.uoa_msat ?? img.msat;
        const msatNum = Number(rawMsat);
        const msat = Number.isFinite(msatNum) ? msatNum : null;
        if (!bySlug.has(slug)) {
            bySlug.set(slug, {
                slug,
                label:
                    slug === 'min_wage_ca' ? 'Min Wage CA' :
                    slug === 'min_wage_fl' ? 'Min Wage FL' :
                    slug === 'min_wage_ma' ? 'Min Wage MA' :
                    slug === 'min_wage_ny' ? 'Min Wage NY' :
                    slug === 'min_wage_oh' ? 'Min Wage OH' :
                    slug === 'min_wage_pa' ? 'Min Wage PA' :
                    slug === 'min_wage_tx' ? 'Min Wage TX' :
                    slug === 'min_wage_wa' ? 'Min Wage WA' :
                    slug === 'wti_crude' ? 'WTI Crude' :
                    slug === 'natural_gas_us' ? 'Natural Gas US' :
                    slug === 'natural_gas_eu' ? 'Natural Gas EU' :
                    slugToTitle(slug),
                filename: `price_of_${slug}.png`,
                title: img.title,
                description: img.description,
                latest_x: img.latest_x || '',
                latest_nostr: img.latest_nostr || '',
                latest_youtube: img.latest_youtube || '',
                msat
            });
        }
    });
    PRICE_OF_OPTIONS = Array.from(bySlug.values());
    PRICE_OF_META = PRICE_OF_OPTIONS.reduce((acc, o) => {
        acc[o.slug] = o;
        return acc;
    }, {});
}
function populatePriceOfSelect() {
    if (!priceOfSelect) return;
    priceOfSelect.innerHTML = PRICE_OF_OPTIONS.map(o => `<option value="${o.slug}">${o.label}</option>`).join('');
}
function updatePofIndexUiBySlug(slug) {
    if (
        !pofIndexInput ||
        !pofIndexTotal ||
        !Array.isArray(PRICE_OF_OPTIONS) ||
        PRICE_OF_OPTIONS.length === 0
    ) {
        return;
    }
    const total = PRICE_OF_OPTIONS.length;
    pofIndexTotal.textContent = String(total);
    pofIndexInput.min = '1';
    pofIndexInput.max = String(total);

    const idx = PRICE_OF_OPTIONS.findIndex(o => o.slug === slug);
    if (idx === -1) {
        pofIndexInput.value = '';
        return;
    }
    pofIndexInput.value = String(idx + 1);
}
function applyPostLinksFromMeta(meta) {
    setModalLinks({x: meta.latest_x || '', nostr: meta.latest_nostr || '', youtube: meta.latest_youtube || ''});
}
function getStoredPofItem() {
    return getCookie(POF_STORAGE_KEY) || localStorage.getItem(POF_STORAGE_KEY) || 'ground_beef';
}
function setStoredPofItem(slug) {
    setCookie(POF_STORAGE_KEY, slug, 365);
    localStorage.setItem(POF_STORAGE_KEY, slug);
}
function normalizePofSortMode(mode) {
    if (!mode) return 'az';
    const m = String(mode).toLowerCase();
    if (m === 'a-z' || m === 'az') return 'az';
    if (m === 'z-a' || m === 'za') return 'za';
    if (m === 'highest' || m === 'highest price' || m === 'high') return 'high';
    if (m === 'lowest' || m === 'lowest price' || m === 'low') return 'low';
    return 'az';
}
function getStoredPofSort() {
    const raw = localStorage.getItem(POF_SORT_STORAGE_KEY);
    return normalizePofSortMode(raw || 'az');
}
function setStoredPofSort(mode) {
    const norm = normalizePofSortMode(mode);
    localStorage.setItem(POF_SORT_STORAGE_KEY, norm);
}
function sortPriceOfOptions(mode, preferredSlug) {
    const norm = normalizePofSortMode(mode);
    if (!Array.isArray(PRICE_OF_OPTIONS) || PRICE_OF_OPTIONS.length === 0) return;

    const byLabel = (a, b) => a.label.localeCompare(b.label);
    const byMsatAsc = (a, b) => {
        const am = typeof a.msat === 'number' ? a.msat : Infinity;
        const bm = typeof b.msat === 'number' ? b.msat : Infinity;
        if (am === bm) return byLabel(a, b);
        return am - bm;
    };
    const byMsatDesc = (a, b) => {
        const am = typeof a.msat === 'number' ? a.msat : -Infinity;
        const bm = typeof b.msat === 'number' ? b.msat : -Infinity;
        if (am === bm) return byLabel(a, b);
        return bm - am;
    };
    const hasAnyNumericMsat = PRICE_OF_OPTIONS.some(
        o => typeof o.msat === 'number' && Number.isFinite(o.msat)
    );
    if ((norm === 'high' || norm === 'low') && !hasAnyNumericMsat) {
        PRICE_OF_OPTIONS.sort(byLabel);
    } else if (norm === 'az') {
        PRICE_OF_OPTIONS.sort(byLabel);
    } else if (norm === 'za') {
        PRICE_OF_OPTIONS.sort((a, b) => byLabel(b, a));
    } else if (norm === 'high') {
        PRICE_OF_OPTIONS.sort(byMsatDesc);
    } else if (norm === 'low') {
        PRICE_OF_OPTIONS.sort(byMsatAsc);
    }
    PRICE_OF_META = PRICE_OF_OPTIONS.reduce((acc, o) => {
        acc[o.slug] = o;
        return acc;
    }, {});
    const currentSlug =
        preferredSlug ||
        (priceOfSelect && priceOfSelect.value) ||
        getStoredPofItem() ||
        (PRICE_OF_OPTIONS[0] && PRICE_OF_OPTIONS[0].slug);
    populatePriceOfSelect();
    if (priceOfSelect && currentSlug && PRICE_OF_OPTIONS.some(o => o.slug === currentSlug)) {
        priceOfSelect.value = currentSlug;
    }
    if (currentSlug) {
        updatePofIndexUiBySlug(currentSlug);
    }
}
function setPofSortMode(modeRaw) {
    const norm = normalizePofSortMode(modeRaw);
    setStoredPofSort(norm);
    let currentSlug = null;
    const curImg = visibleImages[currentIndex];
    if (curImg && isPriceOfFile(curImg.filename)) {
        currentSlug = pofSlugFromFilename(curImg.filename) || getStoredPofItem();
    } else {
        currentSlug = getStoredPofItem();
    }
    sortPriceOfOptions(norm, currentSlug);
    if (pofSortSelect) {
        pofSortSelect.value = norm;
    }
}
function setPriceOfItem(slug) {
    const image = visibleImages[currentIndex];
    if (!image || !isPriceOfFile(image.filename)) return;
    const oldFilename   = image.filename;
    const newFilename   = pofFilenameForSlug(slug);
    const fallbackTitle = `Price of ${slugToTitle(slug)}`;
    const meta          = PRICE_OF_META[slug] || { title: fallbackTitle, description: '' };
    const title       = meta.title       || image.title       || fallbackTitle;
    const description = meta.description || image.description || '';
    setStoredPofItem(slug);
    setModalImageAndCenter(newFilename, title);
    replaceUrlForFilename(newFilename);
    applyPostLinksFromMeta(meta);
    Object.assign(image, {
        filename:      newFilename,
        title,
        description,
        latest_x:      meta.latest_x      || image.latest_x      || '',
        latest_nostr:  meta.latest_nostr  || image.latest_nostr  || '',
        latest_youtube: meta.latest_youtube || image.latest_youtube || ''
    });
    const titleEl = document.querySelector(`.chart-title[data-grid-index="${currentIndex}"]`);
    if (titleEl) titleEl.textContent = title;
    const descEl = document.querySelector(`.chart-description[data-grid-index="${currentIndex}"]`);
    if (descEl) descEl.textContent = description;
    updateGridThumbAtCurrent(newFilename, title);
    const gridImg = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    const cardContainer = gridImg ? gridImg.closest('.chart-container') : null;
    if (cardContainer && gridImg) {
        const tip = description || title;
        cardContainer.setAttribute('title', tip);
        gridImg.alt = title;
    }
    const favOn = isFavorite(newFilename);
    modalFavBtn.textContent = favOn ? '★' : '☆';
    modalFavBtn.classList.toggle('filled', favOn);
    const gridStar = document.querySelector(`.favorite-star[data-filename="${POF_FAV_KEY}"]`);
    if (gridStar) {
        gridStar.textContent = favOn ? '★' : '☆';
        gridStar.classList.toggle('filled', favOn);
    }
    updateModalSafePadding();
    updatePofIndexUiBySlug(slug);
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
 * MODULE: Unit of Account (UOA)
 * =========================== */
const UOA_BASE = 'uoa_';
const UOA_STORAGE_KEY = 'uoaItem';
const UOA_SORT_STORAGE_KEY = 'uoaSort';
const UOA_SHOW_STORAGE_KEY = 'uoaShowMode';
const UOA_SHOW_MODES = [
    'all',
    'g7',
    'g20',
    'africa',
    'asia',
    'europe',
    'latam',
    'mena',
    'oceania',
    'metals'
];
const G7_FIAT_CODES = new Set(['usd', 'eur', 'jpy', 'gbp', 'cad']);
const G20_FIAT_CODES = new Set([
    'usd', 'eur', 'jpy', 'gbp', 'cad',
    'cny', 'aud', 'brl', 'inr', 'mxn',
    'rub', 'zar', 'krw', 'try', 'sar', 'idr', 'ars'
]);
const AFRICA_FIAT_CODES = new Set([
    // Southern Africa
    'zar', 'bwp', 'nad', 'lsl', 'szl', 'zwg', 'mwk', 'mzn', 'zmw',
    // East Africa
    'kes', 'ugx', 'tzs', 'rwf', 'sos', 'djf', 'bif', 'kpmf', 'ssp', 'mga', 'ern',
    // Central Africa
    'cdf', 'xaf',
    // West Africa
    'ngn', 'ghs', 'gmd', 'gnf', 'sle', 'lrd', 'cve', 'xof',
    // North Africa (overlaps with MENA)
    'egp', 'mad', 'tnd', 'dzd', 'sdg', 'mru', 'lyd'
]);
const ASIA_FIAT_CODES = new Set([
    // East Asia
    'cny', 'jpy', 'krw', 'twd', 'hkd', 'kpw', 'mnt',
    // South Asia
    'inr', 'bdt', 'lkr', 'npr', 'btn', 'mvr', 'pkr', 'afn',
    // Southeast Asia
    'idr', 'thb', 'php', 'myr', 'vnd', 'mmk', 'khr', 'lak', 'mop',
    // Central Asia
    'kzt', 'kgs', 'tjs', 'uzs', 'tmt',
    // Caucasus (Asia, not MENA)
    'azn', 'amd', 'gel',
    // Russia
    'rub'
]);
const EUROPE_FIAT_CODES = new Set([
    // Core Western & Northern Europe
    'eur', 'gbp', 'chf', 'sek', 'nok', 'dkk', 'isk',
    // Central & Eastern Europe
    'pln', 'czk', 'huf', 'ron', 'bgn', 'hrk',
    // Balkans & Southeastern Europe
    'rsd', 'mkd', 'bam', 'all', 'mdl',
    // Eastern Europe
    'byn', 'uah', 'rub',
    // Caucasus (allowed overlap with Asia)
    'gel', 'amd', 'azn',
    // European territories & dependencies
    'gip', 'fkp', 'shp', 'fok'
]);
const LATAM_FIAT_CODES = new Set([
    // South America
    'brl', 'ars', 'clp', 'cop', 'pen', 'uyu', 'pyg', 'bob', 'ves',
    // Central America + Mexico
    'mxn', 'crc', 'hnl', 'gtq', 'nio', 'bzd',
    // Caribbean
    'dop', 'htg', 'jmd', 'ttd', 'bbd', 'bsd', 'xcd',
    // Optional: sovereign but tightly pegged or special cases
    'pab', 'cup'
]);
const MENA_FIAT_CODES = new Set([
    // Gulf Cooperation Council (GCC)
    'aed', 'sar', 'qar', 'kwd', 'omr', 'bhd',
    // Middle East (non-GCC)
    'ils', 'try', 'iqd', 'irr', 'syp', 'yer', 'lbp', 'jod',
    // North Africa
    'egp', 'mad', 'tnd', 'dzd'
]);
const OCEANIA_FIAT_CODES = new Set([
    'aud', 'nzd', 'pgk', 'fjd', 'wst', 'top',
    'sbd', 'vuv', 'kid'
]);
const METALS_FIAT_CODES = new Set([
    'xau', 'xag'
]);
let UOA_OPTIONS = [];
let UOA_META = {};
function normalizeUoaShowMode(mode) {
    const m = String(mode || '').toLowerCase();
    if (m === 'g7') return 'g7';
    if (m === 'g20') return 'g20';
    if (m === 'europe' || m === 'eu') return 'europe';
    if (m === 'asia' || m === 'apac') return 'asia';
    if (m === 'africa') return 'africa';
    if (m === 'latam' || m === 'latin' || m === 'latin_america') return 'latam';
    if (m === 'mena' || m === 'middle_east' || m === 'middle-east') return 'mena';
    if (m === 'oceania' || m === 'pacific') return 'oceania';
    if (m === 'metals' || m === 'metal') return 'metals';
    return 'all';
}
function getStoredUoaShowMode() {
    const raw = localStorage.getItem(UOA_SHOW_STORAGE_KEY);
    return normalizeUoaShowMode(raw || 'all');
}
function setStoredUoaShowMode(mode) {
    const norm = normalizeUoaShowMode(mode);
    localStorage.setItem(UOA_SHOW_STORAGE_KEY, norm);
}
function slugHasCode(slug, codeSet) {
    const parts = String(slug || '').toLowerCase().split('_');
    return parts.some(p => codeSet.has(p));
}
function slugIsG7(slug) {
    return slugHasCode(slug, G7_FIAT_CODES);
}
function slugIsG20(slug) {
    return slugHasCode(slug, G20_FIAT_CODES);
}
function slugIsEurope(slug) {
    return slugHasCode(slug, EUROPE_FIAT_CODES);
}
function slugIsAsia(slug) {
    return slugHasCode(slug, ASIA_FIAT_CODES);
}
function slugIsAfrica(slug) {
    return slugHasCode(slug, AFRICA_FIAT_CODES);
}
function slugIsLatam(slug) {
    return slugHasCode(slug, LATAM_FIAT_CODES);
}
function slugIsMena(slug) {
    return slugHasCode(slug, MENA_FIAT_CODES);
}
function slugIsOceania(slug) {
    return slugHasCode(slug, OCEANIA_FIAT_CODES);
}
function slugIsMetals(slug) {
    return slugHasCode(slug, METALS_FIAT_CODES);
}
let uoaShowMode = getStoredUoaShowMode();
function getFilteredUoaOptions() {
    if (!Array.isArray(UOA_OPTIONS) || UOA_OPTIONS.length === 0) return [];
    if (uoaShowMode === 'g7') {
        return UOA_OPTIONS.filter(o => slugIsG7(o.slug));
    } else if (uoaShowMode === 'g20') {
        return UOA_OPTIONS.filter(o => slugIsG20(o.slug));
    } else if (uoaShowMode === 'europe') {
        return UOA_OPTIONS.filter(o => slugIsEurope(o.slug));
    } else if (uoaShowMode === 'asia') {
        return UOA_OPTIONS.filter(o => slugIsAsia(o.slug));
    } else if (uoaShowMode === 'africa') {
        return UOA_OPTIONS.filter(o => slugIsAfrica(o.slug));
    } else if (uoaShowMode === 'latam') {
        return UOA_OPTIONS.filter(o => slugIsLatam(o.slug));
    } else if (uoaShowMode === 'mena') {
        return UOA_OPTIONS.filter(o => slugIsMena(o.slug));
    } else if (uoaShowMode === 'oceania') {
        return UOA_OPTIONS.filter(o => slugIsOceania(o.slug));
    } else if (uoaShowMode === 'metals') {
        return UOA_OPTIONS.filter(o => slugIsMetals(o.slug));
    }
    return [...UOA_OPTIONS];
}
function isUoaFile(fname) {
    return /^uoa_[a-z0-9_]+\.png$/i.test(fname);
}
function uoaSlugFromFilename(fname) {
    const m = fname.match(/^uoa_([a-z0-9_]+)\.png$/i);
    return m ? m[1] : null;
}
function uoaFilenameForSlug(slug) {
    return `${UOA_BASE}${slug}.png`;
}
function uoaLabelFromSlug(slug) {
    const parts = slug.split('_');
    if (parts.length === 2) {
        return `${parts[0].toUpperCase()}/${parts[1].toUpperCase()}`;
    }
    if (parts.length === 1) {
        return parts[0].toUpperCase();
    }
    return parts.map(p => p.toUpperCase()).join(' ');
}
function buildUoaOptionsFromList(list) {
    const bySlug = new Map();
    list.forEach(img => {
        if (!isUoaFile(img.filename)) return;
        const slug = uoaSlugFromFilename(img.filename);
        if (!slug) return;
        const uoaMsatRaw = img.uoa_msat;
        const uoaMsatNum = Number(uoaMsatRaw);
        const msat = Number.isFinite(uoaMsatNum) ? uoaMsatNum : null;
        if (!bySlug.has(slug)) {
            const label = uoaLabelFromSlug(slug);
            bySlug.set(slug, {
                slug,
                label,
                filename: uoaFilenameForSlug(slug),
                title: img.title || `Unit of Account – ${label}`,
                description: img.description || '',
                latest_x: img.latest_x || '',
                latest_nostr: img.latest_nostr || '',
                latest_youtube: img.latest_youtube || '',
                msat
            });
        }
    });
    UOA_OPTIONS = Array.from(bySlug.values());
    UOA_META = UOA_OPTIONS.reduce((acc, o) => {
        acc[o.slug] = o;
        return acc;
    }, {});
}
function updateUoaIndexUiBySlug(slug) {
    if (!uoaIndexInput || !uoaIndexTotal) return;
    const opts = getFilteredUoaOptions();
    if (!Array.isArray(opts) || opts.length === 0) {
        uoaIndexTotal.textContent = '0';
        uoaIndexInput.min = '0';
        uoaIndexInput.max = '0';
        uoaIndexInput.value = '';
        return;
    }
    const total = opts.length;
    uoaIndexTotal.textContent = String(total);
    uoaIndexInput.min = '1';
    uoaIndexInput.max = String(total);
    const idx = opts.findIndex(o => o.slug === slug);
    if (idx === -1) {
        uoaIndexInput.value = '';
        return;
    }
    uoaIndexInput.value = String(idx + 1);
}
function normalizeUoaSortMode(mode) {
    if (!mode) return 'az';
    const m = String(mode).toLowerCase();
    if (m === 'a-z' || m === 'az') return 'az';
    if (m === 'z-a' || m === 'za') return 'za';
    if (m === 'highest' || m === 'highest price' || m === 'high') return 'high';
    if (m === 'lowest' || m === 'lowest price' || m === 'low') return 'low';
    return 'az';
}
function getStoredUoaSort() {
    const raw = localStorage.getItem(UOA_SORT_STORAGE_KEY);
    return normalizeUoaSortMode(raw || 'az');
}
function setStoredUoaSort(mode) {
    const norm = normalizeUoaSortMode(mode);
    localStorage.setItem(UOA_SORT_STORAGE_KEY, norm);
}
function sortUoaOptions(mode, preferredSlug) {
    const norm = normalizeUoaSortMode(mode);
    if (!Array.isArray(UOA_OPTIONS) || UOA_OPTIONS.length === 0) return;

    const byLabel = (a, b) => a.label.localeCompare(b.label);
    const byMsatAsc = (a, b) => {
        const am = typeof a.msat === 'number' ? a.msat : Infinity;
        const bm = typeof b.msat === 'number' ? b.msat : Infinity;
        if (am === bm) return byLabel(a, b);
        return am - bm;
    };
    const byMsatDesc = (a, b) => {
        const am = typeof a.msat === 'number' ? a.msat : -Infinity;
        const bm = typeof b.msat === 'number' ? b.msat : -Infinity;
        if (am === bm) return byLabel(a, b);
        return bm - am;
    };
    if (norm === 'az') {
        UOA_OPTIONS.sort(byLabel);
    } else if (norm === 'za') {
        UOA_OPTIONS.sort((a, b) => byLabel(b, a));
    } else if (norm === 'high') {
        UOA_OPTIONS.sort(byMsatDesc);
    } else if (norm === 'low') {
        UOA_OPTIONS.sort(byMsatAsc);
    }
    UOA_META = UOA_OPTIONS.reduce((acc, o) => {
        acc[o.slug] = o;
        return acc;
    }, {});
    const allCurrentSlug =
        preferredSlug ||
        (uoaSelect && uoaSelect.value) ||
        getStoredUoaItem() ||
        (UOA_OPTIONS[0] && UOA_OPTIONS[0].slug);
    populateUoaSelect();
    const filtered = getFilteredUoaOptions();
    let currentSlug = allCurrentSlug;
    if (!filtered.some(o => o.slug === currentSlug)) {
        currentSlug = filtered[0]?.slug || '';
    }
    if (uoaSelect && currentSlug && filtered.some(o => o.slug === currentSlug)) {
        uoaSelect.value = currentSlug;
    }
    if (currentSlug) {
        updateUoaIndexUiBySlug(currentSlug);
    }
}
function setUoaSortMode(modeRaw) {
    const norm = normalizeUoaSortMode(modeRaw);
    setStoredUoaSort(norm);
    let currentSlug = null;
    const curImg = visibleImages[currentIndex];
    if (curImg && isUoaFile(curImg.filename)) {
        currentSlug = uoaSlugFromFilename(curImg.filename) || getStoredUoaItem();
    } else {
        currentSlug = getStoredUoaItem();
    }
    sortUoaOptions(norm, currentSlug);
    if (uoaSortSelect) {
        uoaSortSelect.value = norm;
    }
}
function setUoaShowMode(modeRaw) {
    const mode = normalizeUoaShowMode(modeRaw);
    uoaShowMode = mode;
    setStoredUoaShowMode(mode);
    if (uoaShowSelect && uoaShowSelect.value !== mode) {
        uoaShowSelect.value = mode;
    }
    const filtered = getFilteredUoaOptions();
    let keepSlug = null;
    if (uoaSelect && uoaSelect.value) {
        keepSlug = uoaSelect.value;
    } else {
        const img = visibleImages[currentIndex];
        if (img && isUoaFile(img.filename)) {
            keepSlug = uoaSlugFromFilename(img.filename);
        } else {
            keepSlug = getStoredUoaItem();
        }
    }
    populateUoaSelect();
    let newSlug = null;
    if (keepSlug && filtered.some(o => o.slug === keepSlug)) {
        newSlug = keepSlug;
    } else if (filtered.length) {
        newSlug = filtered[0].slug;
    }
    if (uoaSelect && newSlug) {
        uoaSelect.value = newSlug;
    }
    if (newSlug) {
        const img = visibleImages[currentIndex];
        if (modal.style.display === 'flex' && img && isUoaFile(img.filename)) {
            const curSlug = uoaSlugFromFilename(img.filename);
            if (curSlug !== newSlug) {
                setUoaItem(newSlug);
            } else {
                updateUoaIndexUiBySlug(newSlug);
            }
        } else {
            updateUoaIndexUiBySlug(newSlug);
        }
        setStoredUoaItem(newSlug);
    } else {
        if (uoaIndexInput) uoaIndexInput.value = '';
        if (uoaIndexTotal) uoaIndexTotal.textContent = '0';
    }
}
function populateUoaSelect() {
    if (!uoaSelect) return;
    const opts = getFilteredUoaOptions();
    uoaSelect.innerHTML = opts
        .map(o => `<option value="${o.slug}">${o.label}</option>`)
        .join('');
}
function getStoredUoaItem() {
    return getCookie(UOA_STORAGE_KEY)
        || localStorage.getItem(UOA_STORAGE_KEY)
        || (UOA_OPTIONS[0]?.slug || '');
}
function setStoredUoaItem(slug) {
    setCookie(UOA_STORAGE_KEY, slug, 365);
    localStorage.setItem(UOA_STORAGE_KEY, slug);
}
function setUoaItem(slug) {
    const image = visibleImages[currentIndex];
    if (!image || !isUoaFile(image.filename)) return;
    const meta = UOA_META[slug] || {};
    const oldFilename = image.filename;
    const newFilename = uoaFilenameForSlug(slug);
    setStoredUoaItem(slug);
    const label = uoaLabelFromSlug(slug);
    const title = meta.title || image.title || `Unit of Account – ${label}`;
    const description = meta.description || image.description || '';
    setModalImageAndCenter(newFilename, title);
    replaceUrlForFilename(newFilename);
    setModalLinks({
        x: meta.latest_x || '',
        nostr: meta.latest_nostr || '',
        youtube: meta.latest_youtube || ''
    });
    Object.assign(visibleImages[currentIndex], {
        filename: newFilename,
        title,
        description,
        latest_x: meta.latest_x || '',
        latest_nostr: meta.latest_nostr || '',
        latest_youtube: meta.latest_youtube || ''
    });
    const titleEl = document.querySelector(`.chart-title[data-grid-index="${currentIndex}"]`);
    if (titleEl) titleEl.textContent = title;
    const descEl = document.querySelector(`.chart-description[data-grid-index="${currentIndex}"]`);
    if (descEl) descEl.textContent = description;
    updateGridThumbAtCurrent(newFilename, title);
    const gridImg = document.querySelector(`img.grid-thumb[data-grid-index="${currentIndex}"]`);
    const cardContainer = gridImg ? gridImg.closest('.chart-container') : null;
    if (cardContainer) {
        const tip = description || title;
        cardContainer.setAttribute('title', tip);
        if (gridImg) gridImg.alt = title;
    }
    migrateFavoriteFilename(oldFilename, newFilename);
    updateModalSafePadding();
    updateUoaIndexUiBySlug(slug);
}
function cycleUoaItem(direction) {
    if (!uoaSelect) return;
    const opts = getFilteredUoaOptions();
    if (!opts.length) return;
    const slugs = opts.map(o => o.slug);
    const currentSlug = uoaSelect.value || getStoredUoaItem() || slugs[0];
    const idx = slugs.indexOf(currentSlug);
    if (idx === -1) return;
    const delta = direction === 'up' ? -1 : 1;
    const len = slugs.length;
    const newIdx = (idx + delta + len) % len;
    const nextSlug = slugs[newIdx];
    uoaSelect.value = nextSlug;
    setUoaItem(nextSlug);
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
function coinFilenameForSlug(slug) {
    return `${slug}.png`;
}
function getStoredCoinSlug() {
    return getCookie(COIN_STORAGE_KEY) || localStorage.getItem(COIN_STORAGE_KEY) || 'wholecoins';
}
function setStoredCoinSlug(slug) {
    setCookie(COIN_STORAGE_KEY, slug, 365);
    localStorage.setItem(COIN_STORAGE_KEY, slug);
}
function buildCoinOptionsFromList(list) {
    const bySlug = new Map();
    list.forEach(img => {
        const slug = coinSlugFromFilename(img.filename);
        if (!slug || !COIN_ORDER.includes(slug)) return;
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
    COIN_OPTIONS = COIN_ORDER.filter(slug => bySlug.has(slug)).map(slug => bySlug.get(slug));
    COIN_META = COIN_OPTIONS.reduce((acc, o) => ((acc[o.slug] = o), acc), {});
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
    setModalLinks({x: meta?.latest_x || '', nostr: meta?.latest_nostr || '', youtube: meta?.latest_youtube || ''});
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
        const tip = meta?.description || meta?.title || slug;
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
function buildMyrRanges(startYear, endYear) {
    const ranges = [];
    for (let s = startYear; s <= endYear - 4; s++) ranges.push(`${s} - ${s + 4}`);
    return ranges;
}
function isMyrFile(fname) {
    return fname.startsWith(MYR_BASE);
}
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
 * BUY ME: BUTTON + THANKS OVERLAY
 * =========================== */
const DONATION_LIGHTNING = 'wicked@getalby.com';
const DONATION_LIQUID = 'VJL94Qcg8Bh9Lb1kxxBG62gKvNMv7jWBDR68X66wQr4bw9F7xUwVAcwxeHXoEa4tae4Chd2r42DKHV62';
const DONATION_ONCHAIN = 'bc1q8mql8fucypd3dllkawqafytmrnwtv77gzxy346';
function isBeerTime() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 17 || hour < 3;
}
function onThanksKeydown(e) {
    if (e.key === 'Escape') {
        hideThanksPopup();
    }
}
function hideThanksPopup() {
    if (!thanksOverlay) return;
    const toast = thanksOverlay.querySelector('.thanks-toast');
    if (toast) {
        toast.style.opacity = '0';
    }
    thanksOverlay.style.display = 'none';
    if (thanksOverlay.parentNode) {
        thanksOverlay.parentNode.removeChild(thanksOverlay);
    }
    document.removeEventListener('keydown', onThanksKeydown);
    if (thanksToastTimeout) {
        clearTimeout(thanksToastTimeout);
        thanksToastTimeout = null;
    }
    isBuyMeVisible = false;
}
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        console.log('Copied to clipboard:', text);
    } catch (err) {
        console.error('Failed to copy to clipboard', err);
    }
}
function showThanksToast(message) {
    if (!thanksOverlay) return;
    let toast = thanksOverlay.querySelector('.thanks-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'thanks-toast';
        Object.assign(toast.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            borderRadius: '999px',
            background: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            pointerEvents: 'none',
            opacity: '0',
            transition: 'opacity 0.2s ease-out',
            zIndex: '20'
        });
        thanksOverlay.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.style.opacity = '1';
    if (thanksToastTimeout) clearTimeout(thanksToastTimeout);
    thanksToastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}
function thanksImagePath({ beerMode, isPortrait, method }) {
    const drink = beerMode ? 'beer' : 'coffee';
    const orient = isPortrait ? 'portrait' : 'landscape';
    const m = normalizeBuyCoffeeMethod(method);
    return `assets/thanks_for_the_${drink}_${orient}_${m}.png`;
}
function updateThanksOverlayImageForMethod(method) {
    if (!thanksOverlay) return;
    const beerMode = isBeerTime();
    const isPortrait = window.innerHeight >= window.innerWidth;
    const imgEl = thanksOverlay.querySelector('#thanks-overlay-img');
    if (!imgEl) return;
    imgEl.src = thanksImagePath({ beerMode, isPortrait, method });
    positionThanksMethodButtonsForOrientation();
}
function getDonationTextForMethod(method) {
  const m = normalizeBuyCoffeeMethod(method);
  if (m === 'lightning') return DONATION_LIGHTNING;
  if (m === 'liquid') return DONATION_LIQUID;
  if (m === 'onchain') return DONATION_ONCHAIN;
  return DONATION_LIGHTNING;
}
function getDonationToastForMethod(method) {
  const m = normalizeBuyCoffeeMethod(method);
  if (m === 'lightning') return 'Lightning address<br>copied to clipboard';
  if (m === 'liquid') return 'Liquid address<br>copied to clipboard';
  if (m === 'onchain') return 'On-chain address<br>copied to clipboard';
  return 'Copied to clipboard';
}
function positionThanksMethodButtonsForOrientation() {
    if (!thanksOverlay) return;
    const container = thanksOverlay.querySelector('#thanks-overlay img')?.parentElement;
    if (!container) return;
    const buttonContainer = container.querySelector('.buy-coffee-methods');
    if (!buttonContainer) return;
    const isPortrait = window.innerHeight >= window.innerWidth;
    Object.assign(buttonContainer.style, {
        position: 'absolute',
        left: '0',
        bottom: '20px',
        top: 'auto',
        width: '50%',
        maxWidth: '',
        display: 'flex',
        justifyContent: 'center',
        alignItems: '',
        flexWrap: '',
        gap: '',
        transform: '',
        zIndex: '10'
    });
    if (isPortrait) {
        Object.assign(buttonContainer.style, {
            left: '50%',
            top: '50%',
            bottom: 'auto',
            width: 'auto',
            maxWidth: '92%',
            alignItems: 'center',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            gap: 'clamp(6px, 1.5vw, 12px)',
            transform: 'translate(-50%, calc(-100% - clamp(8px, 2vh, 18px)))'
        });
    }
}
function handleThanksOverlayResize() {
    if (!isBuyMeVisible || !thanksOverlay) return;
    const method = getStoredBuyCoffeeMethod();
    updateThanksOverlayImageForMethod(method);
    positionThanksMethodButtonsForOrientation();
}
function showThanksPopup() {
    const beerMode = isBeerTime();
    const isPortrait = window.innerHeight >= window.innerWidth;
    const method = getStoredBuyCoffeeMethod();
    const imgSrc = thanksImagePath({ beerMode, isPortrait, method });
    if (!thanksOverlay) {
        thanksOverlay = document.createElement('div');
        thanksOverlay.id = 'thanks-overlay';
        Object.assign(thanksOverlay.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9999',
            cursor: 'default'
        });
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'relative',
            display: 'inline-block',
            cursor: 'pointer',
            maxWidth: '90vw',
        });
        const img = document.createElement('img');
        img.id = 'thanks-overlay-img';
        async function copyActiveDonationToClipboard() {
        const active = getStoredBuyCoffeeMethod();
        const text = getDonationTextForMethod(active);
        await copyToClipboard(text);
        showThanksToast(getDonationToastForMethod(active));
        }
        img.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await copyActiveDonationToClipboard();
        });
        img.addEventListener('keydown', async (e) => {
        if (!(e.key === 'Enter' || e.key === ' ' || e.code === 'Space')) return;
        e.preventDefault();
        e.stopPropagation();
        await copyActiveDonationToClipboard();
        });
        img.alt = 'Thanks!';
        img.style.maxWidth = '90vw';
        img.style.maxHeight = '90vh';
        img.style.boxShadow = '0 0 20px rgba(0,0,0,0.8)';
        img.style.borderRadius = '8px';
        img.style.display = 'block';
        img.tabIndex = 0;
        const closeBtn = document.createElement('button');
        closeBtn.id = 'thanks-overlay-close';
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.classList.add('buy-coffee-close');
        closeBtn.setAttribute('aria-label', 'Close');
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '8px',
            left: '8px'
        });
        buyCoffeeCloseBtn = closeBtn;
        closeBtn.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            hideThanksPopup();
        });
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'buy-coffee-methods';
        const overlayMethodBtns = [];
        function setActiveOverlayBuyCoffeeMethod(methodRaw) {
            const norm = setStoredBuyCoffeeMethod(methodRaw);
            overlayMethodBtns.forEach(b => {
                const isOn = b.dataset.method === norm;
                b.classList.toggle('active', isOn);
                b.setAttribute('aria-pressed', String(isOn));
            });
            return norm;
        }
        Object.assign(buttonContainer.style, {
            position: 'absolute',
            left: '0',
            bottom: '20px',
            width: '50%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: '10'
        });
        function makeMethodBtn(label, methodRaw) {
            const method = normalizeBuyCoffeeMethod(methodRaw);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'buy-coffee-method-btn';
            btn.textContent = label;
            btn.dataset.method = method;
            btn.setAttribute('aria-pressed', 'false');
            btn.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                const active = setActiveOverlayBuyCoffeeMethod(method);
                updateThanksOverlayImageForMethod(active);
            });
            btn.addEventListener('keydown', e => {
                if (!(e.key === 'Enter' || e.key === ' ' || e.code === 'Space')) return;
                e.preventDefault();
                e.stopPropagation();
                btn.click();
            });
            return btn;
        }
        const lightningButton = makeMethodBtn('Lightning', 'lightning');
        const liquidButton    = makeMethodBtn('Liquid', 'liquid');
        const onChainButton   = makeMethodBtn('On-chain', 'onchain');
        overlayMethodBtns.push(lightningButton, liquidButton, onChainButton);
        const initialMethod = getStoredBuyCoffeeMethod();
        setActiveOverlayBuyCoffeeMethod(initialMethod);
        updateThanksOverlayImageForMethod(initialMethod);
        buttonContainer.appendChild(lightningButton);
        buttonContainer.appendChild(liquidButton);
        buttonContainer.appendChild(onChainButton);
        container.appendChild(img);
        container.appendChild(buttonContainer);
        container.appendChild(closeBtn);
        thanksOverlay.appendChild(container);
        thanksOverlay.addEventListener('click', e => {
            if (e.target === thanksOverlay) {
                hideThanksPopup();
            }
        });
        thanksOverlay.addEventListener('keydown', e => {
            if (!isBuyMeVisible) return;
            if (e.key !== 'Tab') return;
            const closeEl = thanksOverlay.querySelector('#thanks-overlay-close');
            const imgEl = thanksOverlay.querySelector('#thanks-overlay-img');
            const methodBtns = Array.from(thanksOverlay.querySelectorAll('.buy-coffee-method-btn'));
            const focusables = [closeEl, ...methodBtns, imgEl].filter(Boolean);
            if (!focusables.length) return;
            const currentIdx = focusables.indexOf(document.activeElement);
            const delta = e.shiftKey ? -1 : 1;
            let nextIdx = currentIdx + delta;
            if (nextIdx < 0) nextIdx = focusables.length - 1;
            if (nextIdx >= focusables.length) nextIdx = 0;
            e.preventDefault();
            e.stopPropagation();
            focusables[nextIdx].focus();
        });
    }
    const imgEl = thanksOverlay.querySelector('#thanks-overlay-img');
    imgEl.src = imgSrc;
    const toast = thanksOverlay.querySelector('.thanks-toast');
    if (toast) {
        toast.style.opacity = '0';
    }
    document.body.appendChild(thanksOverlay);
    thanksOverlay.style.display = 'flex';
    isBuyMeVisible = true;
    positionThanksMethodButtonsForOrientation();
    document.addEventListener('keydown', onThanksKeydown);
    buyCoffeeCloseBtn = thanksOverlay.querySelector('#thanks-overlay-close');
    if (buyCoffeeCloseBtn && typeof buyCoffeeCloseBtn.focus === 'function') {
        requestAnimationFrame(() => buyCoffeeCloseBtn.focus());
    }
}
function updateBuyMeButton() {
    const icon = document.getElementById("buyCoffeeIcon");
    const text = document.getElementById("buyCoffeeText");
    if (!icon || !text) return;
    const hour = new Date().getHours();
    const isBeerTime = (hour >= 17 || hour < 3);
    if (isBeerTime) {
        icon.textContent = "🍺";
        text.textContent = "Buy me a beer";
    } else {
        icon.textContent = "☕";
        text.textContent = "Buy me a coffee";
    }
}
document.addEventListener("DOMContentLoaded", updateBuyMeButton);
setInterval(updateBuyMeButton, 5 * 60 * 1000);
function updateBuyMeButtonLayout() {
    const btn = document.getElementById("buyCoffeeBtn");
    if (!btn) return;
    const narrow = window.innerWidth <= 750;
    btn.classList.toggle("buy-coffee-hide-text", narrow);
}
document.addEventListener("DOMContentLoaded", updateBuyMeButtonLayout);
window.addEventListener("resize", updateBuyMeButtonLayout);

function normalizeBuyCoffeeMethod(m) {
    const v = String(m || '').toLowerCase().trim();
    if (v === 'on-chain') return 'onchain';
    if (v === 'lightning' || v === 'liquid' || v === 'onchain') return v;
    return 'lightning';
}
function getStoredBuyCoffeeMethod() {
    return normalizeBuyCoffeeMethod(localStorage.getItem(BUY_COFFEE_METHOD_KEY) || 'lightning');
}
function setStoredBuyCoffeeMethod(m) {
    const norm = normalizeBuyCoffeeMethod(m);
    localStorage.setItem(BUY_COFFEE_METHOD_KEY, norm);
    return norm;
}
function setActiveBuyCoffeeMethod(method) {
    const norm = setStoredBuyCoffeeMethod(method);
    if (!buyCoffeeMethodBtns || buyCoffeeMethodBtns.length === 0) return norm;
    buyCoffeeMethodBtns.forEach(btn => {
        const isOn = btn.dataset.method === norm;
        btn.classList.toggle('active', isOn);
        btn.setAttribute('aria-pressed', String(isOn));
    });
    return norm;
}
function initBuyCoffeeMethodsUI() {
    if (!buyCoffeeMethodBtns || buyCoffeeMethodBtns.length === 0) return;
    buyCoffeeMethodBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const m = btn.dataset.method;
            setActiveBuyCoffeeMethod(m);
        });
        btn.addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ' && e.code !== 'Space') return;
            e.preventDefault();
            e.stopPropagation();
            btn.click();
        });
    });
}

/* ===========================
 * SLIDESHOW: CORE + UI + FULLSCREEN
 * =========================== */
const EXP_MIN = 1;
const EXP_MAX = 6;
const THUMB_PX = 16;
function expToSecs(exp) {
    return Math.pow(2, exp);
}
function clampExp(val) {
    return Math.max(EXP_MIN, Math.min(EXP_MAX, Math.round(val)));
}
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
    const stop = ev => {
        ev.stopPropagation();
    };
    ['pointerdown', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(type => slideRange.addEventListener(type, stop, {passive: true}));
    const wrap = slideRange.closest('.slideshow-row');
    if (wrap) {
        ['click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(type => wrap.addEventListener(type, stop, {passive: true}));
    }
}
window.addEventListener('load', () => {
    kebabMenu?.classList.add('hidden');
    kebabBtn?.setAttribute('aria-expanded', 'false');
    updateLayoutBasedOnWidth();
    initSearchPrefsAndUI();
    initSlideDurationControl();
    bindSliderEventGuards();
    initBuyCoffeeMethodsUI();
    [gridIcon, listIcon, favoritesToggleBtn].forEach(el => {
        if (!el) return;
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
    });
});
let slideshowIndex = 0;
let slideshowPlaying = false;
let slideshowTimer = null;
function isSlideshowOpen() {
    return !!slideshowEl && !slideshowEl.classList.contains('hidden');
}
function focusSlideshowShell() {
    try {
        slideshowEl?.focus();
    } catch (_) {}
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
        requestAnimationFrame(() => {
            slideshowImg.classList.remove('ss-img-hidden');
        });
        slideshowImg.removeEventListener('load', onLoad);
    };
    slideshowImg.removeEventListener('load', onLoad);
    slideshowImg.addEventListener('load', onLoad);
    slideshowImg.dataset.filename = item.filename;
    slideshowImg.alt = alt;
    slideshowImg.src = imgSrc(item.filename);
}
function setSlideshowImage(idx, restartTimer = false) {
    _applySlide(idx);
    if (restartTimer) restartSlideshowTimer();
    else if (slideshowPlaying) scheduleNextSlide();
}
function slideshowNext(restartTimer = true) {
    setSlideshowImage(slideshowIndex + 1, restartTimer);
}
function slideshowPrev(restartTimer = true) {
    setSlideshowImage(slideshowIndex - 1, restartTimer);
}
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
        slideshowNext(false);
    }, delayMs);
}
function restartSlideshowTimer() {
    if (!slideshowPlaying) return;
    scheduleNextSlide();
}
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
function togglePlayPause() {
    if (slideshowPlaying) pauseSlideshow();
    else playSlideshow();
}
async function enterFullscreen(el) {
    try {
        if (!document.fullscreenElement) {
            if (el?.requestFullscreen) await el.requestFullscreen();
            else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        }
    } catch (_) {}
}
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
function onSlideshowActivity() {
    showSlideshowUI(slideshowPlaying);
}
function bindSlideshowUiActivityListeners() {
    slideshowEl?.addEventListener('pointermove', onSlideshowActivity, {passive: true});
    slideshowEl?.addEventListener('pointerdown', onSlideshowActivity, {passive: true});
    slideshowEl?.addEventListener('wheel', onSlideshowActivity, {passive: true});
    slideshowEl?.addEventListener('mousemove', onSlideshowActivity, {passive: true});
}
function unbindSlideshowUiActivityListeners() {
    slideshowEl?.removeEventListener('pointermove', onSlideshowActivity);
    slideshowEl?.removeEventListener('pointerdown', onSlideshowActivity);
    slideshowEl?.removeEventListener('wheel', onSlideshowActivity);
    slideshowEl?.removeEventListener('mousemove', onSlideshowActivity);
}
async function exitFullscreen() {
    try {
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    } catch (_) {}
}
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
    slideshowEl.classList.add('hidden');
    slideshowEl.classList.remove('show-ui');
    slideshowEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('slideshow-open');
    await exitFullscreen();
}

/* ===========================
 * BOOTSTRAP (fetch + init + global exports)
 * =========================== */
function getImageNameFromPath() {
    if (location.hash) {
        return location.hash.replace(/^#/, '') + '.png';
    }
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return null;
    return path + '.png';
}
fetch('final_frames/image_list.json')
    .then(res => res.json())
    .then(data => {
        imageList = data;
        buildHalvingMetaFromList(imageList);
        MYR_RANGES = buildMyrRanges(MYR_START_YEAR, THIS_YEAR);
        populateMyrSelect();
        buildPriceOfOptionsFromList(imageList);
        sortPriceOfOptions(getStoredPofSort());
        buildCoinOptionsFromList(imageList);
        populateCoinSelect();
        buildUoaOptionsFromList(imageList);
        sortUoaOptions(getStoredUoaSort());
        setUoaShowMode(getStoredUoaShowMode());
        const initialFilename = getImageNameFromPath();
        const coinSet = new Set(COIN_ORDER.map(s => `${s}.png`));
        let urlPofSlug = null;
        let urlCoinSlug = null;
        let urlUoaSlug = null;
        if (initialFilename && initialFilename.startsWith(POF_BASE)) {
            const s = pofSlugFromFilename(initialFilename);
            if (s && PRICE_OF_OPTIONS.some(o => o.slug === s)) {
                urlPofSlug = s;
                setStoredPofItem(s);
            }
        }
        if (initialFilename && coinSet.has(initialFilename)) {
            const s = coinSlugFromFilename(initialFilename);
            if (s && COIN_ORDER.includes(s)) {
                urlCoinSlug = s;
                setStoredCoinSlug(s);
            }
        }
        if (initialFilename && isUoaFile(initialFilename)) {
            const s = uoaSlugFromFilename(initialFilename);
            if (s && UOA_OPTIONS.some(o => o.slug === s)) {
                urlUoaSlug = s;
                setStoredUoaItem(s);
            }
        }
        const uoaAll = imageList.filter(img => isUoaFile(img.filename));
        if (uoaAll.length) {
            const storedUoaSlug = getStoredUoaItem();
            const effectiveSlug =
                urlUoaSlug ||
                storedUoaSlug ||
                (UOA_OPTIONS[0]?.slug || null);
            const repFilename = effectiveSlug
                ? uoaFilenameForSlug(effectiveSlug)
                : uoaAll[0].filename;
            const repMeta = effectiveSlug ? UOA_META[effectiveSlug] : null;
            const chosen = uoaAll.find(img => img.filename === repFilename) || uoaAll[0];
            const uoaCard = {
                ...chosen,
                filename: repFilename,
                title: repMeta?.title || chosen.title || "Unit of Account",
                description: repMeta?.description || chosen.description || "",
                latest_x: repMeta?.latest_x || chosen.latest_x || "",
                latest_nostr: repMeta?.latest_nostr || chosen.latest_nostr || "",
                latest_youtube: repMeta?.latest_youtube || chosen.latest_youtube || ""
            };
            const firstIdx = imageList.findIndex(img => isUoaFile(img.filename));
            const nonUoa = imageList.filter(img => !isUoaFile(img.filename));
            const insertIndex = firstIdx === -1 ? nonUoa.length : firstIdx;
            imageList = [
                ...nonUoa.slice(0, insertIndex),
                uoaCard,
                ...nonUoa.slice(insertIndex)
            ];
        }
        const coinsAll = imageList.filter(img => coinSet.has(img.filename));
        const nonCoins = imageList.filter(img => !coinSet.has(img.filename));
        const firstCoinIdx = imageList.findIndex(img => coinSet.has(img.filename));
        let insertIdx =
            firstCoinIdx !== -1
                ? firstCoinIdx
                : nonCoins.findIndex(img => img.filename.startsWith("bitcoin_dominance")) + 1;
        if (insertIdx < 0) insertIdx = nonCoins.length;
        const storedCoinSlug = getStoredCoinSlug();
        const repCoinMeta =
            COIN_META[storedCoinSlug] ||
            COIN_META["wholecoins"] ||
            COIN_OPTIONS[0];
        let coinCard = null;
        if (repCoinMeta) {
            coinCard = {
                filename: coinFilenameForSlug(repCoinMeta.slug),
                title: repCoinMeta.title,
                description: repCoinMeta.description,
                latest_x: repCoinMeta.latest_x || "",
                latest_nostr: repCoinMeta.latest_nostr || "",
                latest_youtube: repCoinMeta.latest_youtube || ""
            };
        }
        if (coinCard) {
            imageList = [
                ...nonCoins.slice(0, insertIdx),
                coinCard,
                ...nonCoins.slice(insertIdx)
            ];
        } else {
            imageList = nonCoins;
        }
        const storedPofSlug = getStoredPofItem();
        const repPofFilename = pofFilenameForSlug(storedPofSlug);
        const repPofMeta = PRICE_OF_META[storedPofSlug];
        const nonPof = imageList.filter(img => !isPriceOfFile(img.filename));
        const pofAll = imageList.filter(img => isPriceOfFile(img.filename));
        let pofCard = null;
        if (pofAll.length) {
            const chosen =
                pofAll.find(img => img.filename === repPofFilename) || pofAll[0];
            pofCard = {
                ...chosen,
                filename: repPofFilename,
                title: repPofMeta?.title || chosen.title,
                description: repPofMeta?.description || chosen.description,
                latest_x: repPofMeta?.latest_x || "",
                latest_nostr: repPofMeta?.latest_nostr || "",
                latest_youtube: repPofMeta?.latest_youtube || ""
            };
        }
        if (pofCard) {
            const gwIdx = nonPof.findIndex(img =>
                img.filename.startsWith("global_wealth")
            );
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
        const halvingEntries = imageList.filter(img =>
            isHalvingCyclesFile(img.filename)
        );
        if (halvingEntries.length) {
            let urlHalvingAlignment = null;
            if (initialFilename && isHalvingCyclesFile(initialFilename)) {
                urlHalvingAlignment = alignmentFromFilename(initialFilename);
                setStoredHalvingAlignment(urlHalvingAlignment);
            }
            const storedHalvingAlignment = getStoredHalvingAlignment();
            const effectiveAlignment = urlHalvingAlignment || storedHalvingAlignment;
            const desiredFilename =
                halvingFilenameForAlignment(effectiveAlignment);
            const baseMeta =
                HALVING_META[desiredFilename] || halvingEntries[0];
            const firstIdx = imageList.findIndex(img =>
                isHalvingCyclesFile(img.filename)
            );
            imageList = imageList.filter(
                img => !isHalvingCyclesFile(img.filename)
            );
            const halvingCard = {
                filename: desiredFilename,
                title: baseMeta.title || "Halving Cycles",
                description: baseMeta.description || "",
                latest_x: baseMeta.latest_x || "",
                latest_nostr: baseMeta.latest_nostr || "",
                latest_youtube: baseMeta.latest_youtube || ""
            };
            const insertIndex = firstIdx === -1 ? imageList.length : firstIdx;
            imageList.splice(insertIndex, 0, halvingCard);
        }
        let urlBvgYear = null;
        if (initialFilename && initialFilename.startsWith("bitcoin_vs_gold_")) {
            const m = initialFilename.match(/bitcoin_vs_gold_(\d{4})\.png$/);
            if (m && isValidBvgYear(m[1])) {
                urlBvgYear = m[1];
                setStoredBvgYear(urlBvgYear);
            }
        }
        let urlDalScale = null;
        if (initialFilename && initialFilename.startsWith(DAL_BASE)) {
            if (initialFilename === `${DAL_BASE}_log.png`) urlDalScale = "log";
            else urlDalScale = "linear";
            setStoredDalScale(urlDalScale);
        }
        let urlPotdScale = null;
        if (initialFilename && initialFilename.startsWith(POTD_BASE)) {
            if (initialFilename === `${POTD_BASE}_log.png`) urlPotdScale = "log";
            else urlPotdScale = "linear";
            setStoredPotdScale(urlPotdScale);
        }
        let urlNlbpScale = null;
        if (initialFilename && initialFilename.startsWith(NLBP_BASE)) {
            if (initialFilename === `${NLBP_BASE}_log.png`) urlNlbpScale = "log";
            else urlNlbpScale = "linear";
            setStoredNlbpScale(urlNlbpScale);
        }
        let urlDomUnit = null;
        if (initialFilename && initialFilename.startsWith(DOM_BASE)) {
            if (initialFilename === `${DOM_BASE}_btc.png`) urlDomUnit = "btc";
            else urlDomUnit = "usd";
            setStoredDominanceUnit(urlDomUnit);
        }
        imageList = imageList.map(img =>
            img.filename.startsWith(BVG_BASE)
                ? { ...img, filename: `${BVG_BASE}_${getStoredBvgYear()}.png` }
                : img
        );
        imageList = imageList.map(img =>
            img.filename.startsWith(DAL_BASE)
                ? { ...img, filename: dalFilenameForScale(getStoredDalScale()) }
                : img
        );
        imageList = imageList.map(img =>
            img.filename.startsWith(POTD_BASE)
                ? { ...img, filename: potdFilenameForScale(getStoredPotdScale()) }
                : img
        );
        imageList = imageList.map(img =>
            img.filename.startsWith(NLBP_BASE)
                ? { ...img, filename: nlbpFilenameForScale(getStoredNlbpScale()) }
                : img
        );
        imageList = imageList.map(img =>
            img.filename.startsWith(DOM_BASE)
                ? { ...img, filename: domFilenameForUnit(getStoredDominanceUnit()) }
                : img
        );
        visibleImages = [...imageList];
        migratePriceOfFavorites();
        filterImages();
        const savedLayout = localStorage.getItem("preferredLayout");
        if (savedLayout === "list" || savedLayout === "grid") {
            setLayout(savedLayout, false);
        }
        if (showFavoritesOnly)
            document.getElementById("favoritesToggle").classList.add("active");
        if (initialFilename) {
            let opened = false;
            let openIdx = -1;
            if (urlBvgYear) {
                openIdx = visibleImages.findIndex(
                    img => img.filename === initialFilename
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(img =>
                        img.filename.startsWith("bitcoin_vs_gold_")
                    );
            } else if (urlDalScale) {
                openIdx = visibleImages.findIndex(
                    img => img.filename === initialFilename
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(img =>
                        img.filename.startsWith(DAL_BASE)
                    );
            } else if (urlPotdScale) {
                openIdx = visibleImages.findIndex(img =>
                    img.filename.startsWith(POTD_BASE)
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(
                        img => img.filename === initialFilename
                    );
            } else if (urlNlbpScale) {
                openIdx = visibleImages.findIndex(img =>
                    img.filename.startsWith(NLBP_BASE)
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(
                        img => img.filename === initialFilename
                    );
            } else if (urlUoaSlug) {
                openIdx = visibleImages.findIndex(img =>
                    isUoaFile(img.filename)
                );
            } else if (urlPofSlug) {
                openIdx = visibleImages.findIndex(
                    img => img.filename === initialFilename
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(img =>
                        img.filename.startsWith(POF_BASE)
                    );
            } else if (urlDomUnit) {
                openIdx = visibleImages.findIndex(
                    img => img.filename === initialFilename
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(img =>
                        img.filename.startsWith(DOM_BASE)
                    );
            } else if (coinSet.has(initialFilename)) {
                openIdx = visibleImages.findIndex(
                    img => img.filename === initialFilename
                );
                if (openIdx === -1)
                    openIdx = visibleImages.findIndex(img =>
                        isCoinFile(img.filename)
                    );
            } else if (
                !initialFilename.startsWith("bitcoin_vs_gold_")
            ) {
                openIdx = visibleImages.findIndex(
                    img => img.filename === initialFilename
                );
            }
            if (openIdx !== -1) {
                openModalByIndex(openIdx);
                opened = true;
            }
            if (!opened) {
                if (
                    !openByFilenameAllowingNonFav(initialFilename)
                )
                    history.replaceState(null, "", "/");
            }
        }
    })
    .catch(err => {
        imageGrid.textContent = "Failed to load visualizations.";
        console.error(err);
    });
window.setLayout = setLayout;
window.toggleSearch = toggleSearch;
window.toggleFavoritesView = toggleFavoritesView;
window.closeModal = closeModal;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.toggleFavoriteFromModal = toggleFavoriteFromModal;

/* ===========================
 * EVENT BINDINGS (global + modal + menu)
 * =========================== */
window.addEventListener('resize', updateLayoutBasedOnWidth);
window.addEventListener('resize', updateModalSafePadding);
window.addEventListener('orientationchange', updateModalSafePadding);
window.addEventListener('resize', handleModalViewportChange);
window.addEventListener('orientationchange', handleModalViewportChange);
window.addEventListener('resize', () => {
    if (!isBuyMeVisible) return;
    positionThanksMethodButtonsForOrientation();
});
window.addEventListener('orientationchange', () => {
    if (!isBuyMeVisible) return;
    positionThanksMethodButtonsForOrientation();
});
window.addEventListener('resize', handleThanksOverlayResize);
window.addEventListener('orientationchange', handleThanksOverlayResize);
chkSearchTitles?.addEventListener('click', e => {
    e.stopPropagation();
    toggleSearchPref('title');
});
chkSearchDescriptions?.addEventListener('click', e => {
    e.stopPropagation();
    toggleSearchPref('desc');
});
modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
});
modal.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});
modal.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    if (!gestureConsumed) {
        handleSwipe();
        handleVerticalSwipe();
    }
});
startSlideshowBtn?.addEventListener('click', () => {
    kebabMenu?.classList.add('hidden');
    kebabBtn?.setAttribute('aria-expanded', 'false');
    if (!visibleImages || !visibleImages.length) return;
    openSlideshow(0, true);
});
ssExitBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showSlideshowUI(slideshowPlaying);
    closeSlideshow();
});
ssNextBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showSlideshowUI(slideshowPlaying);
    slideshowNext(true);
});
ssPrevBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showSlideshowUI(slideshowPlaying);
    slideshowPrev(true);
});
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
ssPlayPauseBtn.addEventListener('click', onPlayPauseActivate);
ssPlayPauseBtn.addEventListener('keydown', onPlayPauseActivate);
ssPlayPauseBtn.setAttribute('tabindex', '0');
ssPlayPauseBtn.setAttribute('role', 'button');
document.addEventListener('keydown', e => {
    if (isBuyMeVisible) return;
    if (!slideshowEl || slideshowEl.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        closeSlideshow();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        slideshowNext(true);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        slideshowPrev(true);
    } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    }
});
function onFullscreenChangeAutoClose() {
    if (!document.fullscreenElement && isSlideshowOpen()) {
        closeSlideshow();
    }
}
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => document.addEventListener(evt, onFullscreenChangeAutoClose));
slideRange?.addEventListener('change', () => restartSlideshowTimer());
slideRange?.addEventListener('input', () => restartSlideshowTimer());
buyMeBtn?.addEventListener('click', e => {
    e.preventDefault();
    showThanksPopup();
});
function onToolbarButtonKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.code !== 'Space') return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.click();
}
gridIcon?.addEventListener('keydown', onToolbarButtonKeydown);
listIcon?.addEventListener('keydown', onToolbarButtonKeydown);
favoritesToggleBtn?.addEventListener('keydown', onToolbarButtonKeydown);
document.addEventListener('keydown', e => {
    if (!isBuyMeVisible) return;
    const k = e.key;
    if (
        k === 'ArrowLeft' ||
        k === 'ArrowRight' ||
        k === 'ArrowUp' ||
        k === 'ArrowDown' ||
        k === ' ' ||
        k === 'Spacebar'
    ) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
        if (k === ' ' || k === 'Spacebar') {
            hideThanksPopup();
        }
    }
}, true);
document.addEventListener('keydown', e => {
    if (isBuyMeVisible) return;
    if (modal.style.display !== 'flex') return;
    const swallow = () => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
            e.stopImmediatePropagation();
        }
    };
    if (e.key === 'ArrowLeft') {
        swallow();
        prevImage();
    } else if (e.key === 'ArrowRight') {
        swallow();
        nextImage();
    } else if (e.key === ' ' || e.code === 'Space') {
        swallow();
        closeModal();
    } else if (e.key === 'Escape') {
        swallow();
        closeModal();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const currentFile = visibleImages[currentIndex]?.filename || '';
        if (!currentFile) return;
        const isUp = (e.key === 'ArrowUp');
        const active = document.activeElement;
        swallow();
        let dropdownToFocus = null;
        if (active === yearSelect) {
            isUp ? cycleBvgYear('up') : cycleBvgYear('down');
            dropdownToFocus = yearSelect;
        } else if (active === scaleSelect) {
            if (isDalFile(currentFile)) {
                isUp ? cycleDalScale('up') : cycleDalScale('down');
            } else if (isPotdFile(currentFile)) {
                isUp ? cyclePotdScale('up') : cyclePotdScale('down');
            } else if (isNlbpFile(currentFile)) {
                isUp ? cycleNlbpScale('up') : cycleNlbpScale('down');
            }
            dropdownToFocus = scaleSelect;
        } else if (active === dominanceSelect) {
            isUp ? cycleDominance('up') : cycleDominance('down');
            dropdownToFocus = dominanceSelect;
        } else if (active === alignmentSelect) {
            isUp ? cycleHalvingAlignment('up') : cycleHalvingAlignment('down');
            dropdownToFocus = alignmentSelect;
        } else if (active === priceOfSelect) {
            isUp ? cyclePriceOf('up') : cyclePriceOf('down');
            dropdownToFocus = priceOfSelect;
        } else if (active === uoaSelect) {
            isUp ? cycleUoaItem('up') : cycleUoaItem('down');
            dropdownToFocus = uoaSelect;
        } else if (active === uoaSortSelect) {
            const order = ['az', 'za', 'high', 'low'];
            const currentSort = getStoredUoaSort();
            const idx = order.indexOf(currentSort);
            const delta = isUp ? -1 : 1;
            const next = order[((idx === -1 ? 0 : idx) + delta + order.length) % order.length];
            setUoaSortMode(next);
            if (uoaSortSelect) uoaSortSelect.value = next;
            dropdownToFocus = uoaSortSelect;
        } else if (active === uoaShowSelect) {
            const order = UOA_SHOW_MODES;
            const currentMode = getStoredUoaShowMode();
            const idx = order.indexOf(currentMode);
            const delta = isUp ? -1 : 1;
            const next = order[((idx === -1 ? 0 : idx) + delta + order.length) % order.length];
            setUoaShowMode(next);
            if (uoaShowSelect) uoaShowSelect.value = next;
            dropdownToFocus = uoaShowSelect;
        } else if (active === pofSortSelect) {
            const order = ['az', 'za', 'high', 'low'];
            const currentSort = getStoredPofSort();
            const idx = order.indexOf(currentSort);
            const delta = isUp ? -1 : 1;
            const next = order[((idx === -1 ? 0 : idx) + delta + order.length) % order.length];
            setPofSortMode(next);
            if (pofSortSelect) pofSortSelect.value = next;
            dropdownToFocus = pofSortSelect;
        } else if (active === hashSelect) {
            isUp ? cycleHashLength('up') : cycleHashLength('down');
            dropdownToFocus = hashSelect;
        } else if (active === coinSelect) {
            isUp ? cycleCoinType('up') : cycleCoinType('down');
            dropdownToFocus = coinSelect;
        } else if (active === myrSelect) {
            isUp ? cycleMyrRange('up') : cycleMyrRange('down');
            dropdownToFocus = myrSelect;
        }
        if (!dropdownToFocus) {
            if (isBvgFile(currentFile)) {
                isUp ? cycleBvgYear('up') : cycleBvgYear('down');
                dropdownToFocus = yearSelect;
            } else if (isDalFile(currentFile)) {
                isUp ? cycleDalScale('up') : cycleDalScale('down');
                dropdownToFocus = scaleSelect;
            } else if (isPotdFile(currentFile)) {
                isUp ? cyclePotdScale('up') : cyclePotdScale('down');
                dropdownToFocus = scaleSelect;
            } else if (isNlbpFile(currentFile)) {
                isUp ? cycleNlbpScale('up') : cycleNlbpScale('down');
                dropdownToFocus = scaleSelect;
            } else if (isDominanceFile(currentFile)) {
                isUp ? cycleDominance('up') : cycleDominance('down');
                dropdownToFocus = dominanceSelect;
            } else if (isHalvingCyclesFile(currentFile)) {
                isUp ? cycleHalvingAlignment('up') : cycleHalvingAlignment('down');
                dropdownToFocus = alignmentSelect;
            } else if (isPriceOfFile(currentFile)) {
                isUp ? cyclePriceOf('up') : cyclePriceOf('down');
                dropdownToFocus = priceOfSelect;
            } else if (isUoaFile(currentFile)) {
                isUp ? cycleUoaItem('up') : cycleUoaItem('down');
                dropdownToFocus = uoaSelect;
            } else if (isTargetHashFile(currentFile)) {
                isUp ? cycleHashLength('up') : cycleHashLength('down');
                dropdownToFocus = hashSelect;
            } else if (isCoinFile(currentFile)) {
                isUp ? cycleCoinType('up') : cycleCoinType('down');
                dropdownToFocus = coinSelect;
            } else if (isMyrFile(currentFile)) {
                isUp ? cycleMyrRange('up') : cycleMyrRange('down');
                dropdownToFocus = myrSelect;
            }
        }
        if (dropdownToFocus && typeof dropdownToFocus.focus === 'function') {
            requestAnimationFrame(() => dropdownToFocus.focus());
        }
    }
}, true);
document.addEventListener('keydown', e => {
    if (isBuyMeVisible) return;
    if (!(e.key === ' ' || e.code === 'Space')) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const active = document.activeElement;
    if (
        active &&
        (active.tagName === 'INPUT' ||
         active.tagName === 'TEXTAREA' ||
         active.tagName === 'SELECT' ||
         active.isContentEditable)
    ) {
        return;
    }
    if (modal.style.display === 'flex') return;
    if (typeof isSlideshowOpen === 'function' && isSlideshowOpen()) return;
    if (!visibleImages || !visibleImages.length) return;
    e.preventDefault();
    e.stopPropagation();
    let indexToOpen = 0;
    if (lastOpenedFilename) {
        const idx = visibleImages.findIndex(img => img.filename === lastOpenedFilename);
        if (idx !== -1) {
            indexToOpen = idx;
        }
    }
    openModalByIndex(indexToOpen);
});
document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (isBuyMeVisible) return;
    if (modal.style.display === 'flex') return;
    if (typeof isSlideshowOpen === 'function' && isSlideshowOpen()) return;
    const active = document.activeElement;
    if (!active || !active.classList.contains('grid-thumb')) return;
    const thumbs = Array.from(document.querySelectorAll('img.grid-thumb'));
    if (!thumbs.length) return;
    const currentIdx = thumbs.indexOf(active);
    if (currentIdx === -1) return;
    const delta = e.shiftKey ? -1 : 1;
    const nextIdx = currentIdx + delta;
    if (nextIdx < 0 || nextIdx >= thumbs.length) return;
    e.preventDefault();
    e.stopPropagation();
    const nextThumb = thumbs[nextIdx];
    if (nextThumb && typeof nextThumb.focus === 'function') {
        nextThumb.focus();
    }
});
function onOptionSStartSlideshow(e) {
    if (isBuyMeVisible) return;
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
kebabBtn?.addEventListener('click', e => {
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
kebabMenu?.addEventListener('click', e => {
    const btn = e.target.closest('.menu-item');
    if (!btn) return;
    if (btn.classList.contains('slideshow-row') || btn.closest('.slideshow-row')) {
        e.stopPropagation();
        return;
    }
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
document.addEventListener('click', e => {
    if (!kebabMenu || kebabMenu.classList.contains('hidden')) return;
    if (e.target === kebabBtn || kebabBtn.contains(e.target)) return;
    if (kebabMenu.contains(e.target)) return;
    kebabMenu.classList.add('hidden');
    kebabBtn.setAttribute('aria-expanded', 'false');
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && kebabMenu && !kebabMenu.classList.contains('hidden')) {
        kebabMenu.classList.add('hidden');
        kebabBtn.setAttribute('aria-expanded', 'false');
    }
});
yearSelect?.addEventListener('change', e => setBvgYear(e.target.value));
scaleSelect?.addEventListener('change', e => {
    const currentFile = visibleImages[currentIndex]?.filename || '';
    if (isDalFile(currentFile)) setDalScale(e.target.value);
    else if (isPotdFile(currentFile)) setPotdScale(e.target.value);
    else if (isNlbpFile(currentFile)) setNlbpScale(e.target.value);
});
dominanceSelect?.addEventListener('change', e => setDominanceUnit(e.target.value));
priceOfSelect?.addEventListener('change', e => setPriceOfItem(e.target.value));
pofSortSelect?.addEventListener('change', e => setPofSortMode(e.target.value));
coinSelect?.addEventListener('change', e => setCoinType(e.target.value));
myrSelect?.addEventListener('change', e => setMyrRange(e.target.value));
alignmentSelect?.addEventListener('change', e => setHalvingAlignment(e.target.value));
uoaSelect?.addEventListener('change', e => setUoaItem(e.target.value));
uoaSortSelect?.addEventListener('change', e => setUoaSortMode(e.target.value));
hashSelect?.addEventListener('change', e => setHashLength(e.target.value));
uoaShowSelect?.addEventListener('change', e => setUoaShowMode(e.target.value));
uoaIndexInput?.addEventListener('input', e => {
    const opts = getFilteredUoaOptions();
    if (!Array.isArray(opts) || opts.length === 0) return;
    let raw = e.target.value || '';
    raw = raw.replace(/\D+/g, '');
    if (raw === '') {
        e.target.value = '';
        return;
    }
    let n = parseInt(raw, 10);
    if (!Number.isFinite(n)) {
        e.target.value = '';
        return;
    }
    const total = opts.length;
    if (n < 1) n = 1;
    if (n > total) n = total;
    if (String(n) !== raw) {
        e.target.value = String(n);
    }
    const target = opts[n - 1];
    if (!target) return;
    if (uoaSelect) {
        uoaSelect.value = target.slug;
    }
    setUoaItem(target.slug);
});
uoaIndexInput?.addEventListener('blur', () => {
    const raw = (uoaIndexInput.value || '').trim();
    if (raw !== '') return;
    let currentSlug = null;
    if (uoaSelect && uoaSelect.value) {
        currentSlug = uoaSelect.value;
    } else {
        const image = visibleImages?.[currentIndex];
        if (image && isUoaFile(image.filename)) {
            currentSlug = uoaSlugFromFilename(image.filename);
        }
    }
    if (currentSlug) {
        updateUoaIndexUiBySlug(currentSlug);
    }
});
pofIndexInput?.addEventListener('input', e => {
    if (!Array.isArray(PRICE_OF_OPTIONS) || PRICE_OF_OPTIONS.length === 0) return;
    let raw = e.target.value || '';
    raw = raw.replace(/\D+/g, '');
    if (raw === '') {
        e.target.value = '';
        return;
    }
    let n = parseInt(raw, 10);
    if (!Number.isFinite(n)) {
        e.target.value = '';
        return;
    }
    const total = PRICE_OF_OPTIONS.length;
    if (n < 1) n = 1;
    if (n > total) n = total;
    if (String(n) !== raw) {
        e.target.value = String(n);
    }
    const target = PRICE_OF_OPTIONS[n - 1];
    if (!target) return;
    if (priceOfSelect) {
        priceOfSelect.value = target.slug;
    }
    setPriceOfItem(target.slug);
});
pofIndexInput?.addEventListener('blur', () => {
    const raw = (pofIndexInput.value || '').trim();
    if (raw !== '') return;
    let currentSlug = null;
    if (priceOfSelect && priceOfSelect.value) {
        currentSlug = priceOfSelect.value;
    } else {
        const image = visibleImages?.[currentIndex];
        if (image && isPriceOfFile(image.filename)) {
            currentSlug = pofSlugFromFilename(image.filename);
        }
    }
    if (currentSlug) {
        updatePofIndexUiBySlug(currentSlug);
    }
});
function toggleFavoritesView() {
    showFavoritesOnly = !showFavoritesOnly;
    localStorage.setItem('showFavoritesOnly', showFavoritesOnly);
    document.getElementById('favoritesToggle').classList.toggle('active', showFavoritesOnly);
    filterImages();
}