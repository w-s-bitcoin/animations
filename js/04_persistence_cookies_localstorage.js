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