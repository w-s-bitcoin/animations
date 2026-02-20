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
    rekeyCard(oldFilename, newFilename);
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