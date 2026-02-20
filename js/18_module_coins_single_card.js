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