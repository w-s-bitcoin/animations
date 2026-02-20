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