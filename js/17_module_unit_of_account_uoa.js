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
    'zar', 'bwp', 'nad', 'lsl', 'szl', 'zwg', 'mwk', 'mzn', 'zmw',
    'kes', 'ugx', 'tzs', 'rwf', 'sos', 'djf', 'bif', 'kpmf', 'ssp', 'mga', 'ern',
    'cdf', 'xaf',
    'ngn', 'ghs', 'gmd', 'gnf', 'sle', 'lrd', 'cve', 'xof',
    'egp', 'mad', 'tnd', 'dzd', 'sdg', 'mru', 'lyd'
]);
const ASIA_FIAT_CODES = new Set([
    'cny', 'jpy', 'krw', 'twd', 'hkd', 'kpw', 'mnt',
    'inr', 'bdt', 'lkr', 'npr', 'btn', 'mvr', 'pkr', 'afn',
    'idr', 'thb', 'php', 'myr', 'vnd', 'mmk', 'khr', 'lak', 'mop',
    'kzt', 'kgs', 'tjs', 'uzs', 'tmt',
    'azn', 'amd', 'gel',
    'rub'
]);
const EUROPE_FIAT_CODES = new Set([
    'eur', 'gbp', 'chf', 'sek', 'nok', 'dkk', 'isk',
    'pln', 'czk', 'huf', 'ron', 'bgn', 'hrk',
    'rsd', 'mkd', 'bam', 'all', 'mdl',
    'byn', 'uah', 'rub',
    'gel', 'amd', 'azn',
    'gip', 'fkp', 'shp', 'fok'
]);
const LATAM_FIAT_CODES = new Set([
    'brl', 'ars', 'clp', 'cop', 'pen', 'uyu', 'pyg', 'bob', 'ves',
    'mxn', 'crc', 'hnl', 'gtq', 'nio', 'bzd',
    'dop', 'htg', 'jmd', 'ttd', 'bbd', 'bsd', 'xcd',
    'pab', 'cup'
]);
const MENA_FIAT_CODES = new Set([
    'aed', 'sar', 'qar', 'kwd', 'omr', 'bhd',
    'ils', 'try', 'iqd', 'irr', 'syp', 'yer', 'lbp', 'jod',
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