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
    rekeyCard(oldFilename, newFilename);
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