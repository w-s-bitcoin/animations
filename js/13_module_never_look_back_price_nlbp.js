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
    rekeyCard(oldFilename, newFilename);
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