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
    rekeyCard(oldFilename, newFilename);
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