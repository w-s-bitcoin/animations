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
    rekeyCard(oldFilename, newFilename);
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