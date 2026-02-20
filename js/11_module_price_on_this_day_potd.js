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
    rekeyCard(oldFilename, newFilename);
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