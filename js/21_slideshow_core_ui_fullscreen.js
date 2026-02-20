/* ===========================
 * SLIDESHOW: CORE + UI + FULLSCREEN
 * =========================== */
const EXP_MIN = 1;
const EXP_MAX = 6;
const THUMB_PX = 16;
function expToSecs(exp) {
    return Math.pow(2, exp);
}
function clampExp(val) {
    return Math.max(EXP_MIN, Math.min(EXP_MAX, Math.round(val)));
}
function positionBubble(rangeEl, bubbleEl) {
    if (!rangeEl || !bubbleEl) return;
    const wrap = rangeEl.parentElement;
    const rect = rangeEl.getBoundingClientRect();
    const padL = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    const min = Number(rangeEl.min || 0);
    const max = Number(rangeEl.max || 6);
    const val = Number(rangeEl.value || 0);
    const pct = (val - min) / (max - min);
    const xWithinTrack = pct * (rect.width - THUMB_PX) + THUMB_PX / 2;
    bubbleEl.style.left = `${padL + xWithinTrack}px`;
}
function updateSlideDurationUI(fromUser = false) {
    if (!slideRange || !slideBubble) return;
    if (fromUser) {
        const snapped = clampExp(Number(slideRange.value));
        if (snapped !== Number(slideRange.value)) slideRange.value = String(snapped);
        localStorage.setItem(SLIDE_EXP_KEY, String(snapped));
    }
    const exp = clampExp(Number(slideRange.value));
    const secs = expToSecs(exp);
    slideRange.setAttribute('aria-valuenow', String(secs));
    slideRange.setAttribute('aria-valuemin', String(expToSecs(EXP_MIN)));
    slideRange.setAttribute('aria-valuemax', String(expToSecs(EXP_MAX)));
    slideRange.setAttribute('aria-valuetext', `${secs} seconds`);
    slideBubble.textContent = `${secs}s`;
    positionBubble(slideRange, slideBubble);
}
function initSlideDurationControl() {
    if (!slideRange || !slideBubble) return;
    const saved = Number(localStorage.getItem(SLIDE_EXP_KEY));
    const initial = Number.isFinite(saved) ? clampExp(saved) : 2;
    slideRange.value = String(initial);
    requestAnimationFrame(() => updateSlideDurationUI(false));
    window.addEventListener('resize', () => positionBubble(slideRange, slideBubble));
    slideRange.addEventListener('input', () => updateSlideDurationUI(true));
    slideRange.addEventListener('change', () => updateSlideDurationUI(true));
}
function bindSliderEventGuards() {
    if (!slideRange) return;
    const stop = ev => {
        ev.stopPropagation();
    };
    ['pointerdown', 'pointerup', 'pointercancel', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'].forEach(type => slideRange.addEventListener(type, stop, {passive: true}));
    const wrap = slideRange.closest('.slideshow-row');
    if (wrap) {
        ['click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach(type => wrap.addEventListener(type, stop, {passive: true}));
    }
}
function initBtcmapsSelectUI(){
  if (btcmapsSelect) {
    const applyRegion = () => {
      const v = btcmapsSelect.value || getStoredBtcmapsRegion();
      if (v) setBtcmapsRegion(v);
    };
    btcmapsSelect.addEventListener('change', applyRegion);
    btcmapsSelect.addEventListener('input', applyRegion);

    ["pointerdown","mousedown","click"].forEach(t=>{
      btcmapsSelect.addEventListener(t, e=>e.stopPropagation(), {passive:true});
    });

    btcmapsSelect.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.stopImmediatePropagation();
    }, true);
  }

  if (viewSelect) {
    const applyView = () => {
      const v = viewSelect.value || "total";
      setBtcmapsView(v);
    };
    viewSelect.addEventListener('change', applyView);
    viewSelect.addEventListener('input', applyView);

    ["pointerdown","mousedown","click"].forEach(t=>{
      viewSelect.addEventListener(t, e=>e.stopPropagation(), {passive:true});
    });

    viewSelect.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.stopImmediatePropagation();
    }, true);
  }
}
window.addEventListener('load', () => {
    kebabMenu?.classList.add('hidden');
    kebabBtn?.setAttribute('aria-expanded', 'false');
    updateLayoutBasedOnWidth();
    initSearchPrefsAndUI();
    initSlideDurationControl();
    bindSliderEventGuards();
    initBuyCoffeeMethodsUI();
    initBtcmapsSelectUI();
    [gridIcon, listIcon, favoritesToggleBtn].forEach(el => {
        if (!el) return;
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
    });
});
let slideshowIndex = 0;
let slideshowPlaying = false;
let slideshowTimer = null;
function isSlideshowOpen() {
    return !!slideshowEl && !slideshowEl.classList.contains('hidden');
}
function focusSlideshowShell() {
    try {
        slideshowEl?.focus();
    } catch (_) {}
}
function getSlideDurationSecs() {
    if (!slideRange) return 4;
    const exp = Number(slideRange.value || 2);
    return Math.pow(2, Math.max(1, Math.min(6, Math.round(exp))));
}
function _applySlide(idx) {
    if (!visibleImages || visibleImages.length === 0) return;
    slideshowIndex = ((idx % visibleImages.length) + visibleImages.length) % visibleImages.length;
    const item = visibleImages[slideshowIndex];
    const alt = item?.title || item?.description || 'Slideshow image';
    slideshowImg.classList.add('ss-img-hidden');
    const onLoad = () => {
        requestAnimationFrame(() => {
            slideshowImg.classList.remove('ss-img-hidden');
        });
        slideshowImg.removeEventListener('load', onLoad);
    };
    slideshowImg.removeEventListener('load', onLoad);
    slideshowImg.addEventListener('load', onLoad);
    slideshowImg.dataset.filename = item.filename;
    slideshowImg.alt = alt;
    slideshowImg.src = imgSrc(item.filename);
}
function setSlideshowImage(idx, restartTimer = false) {
    _applySlide(idx);
    if (restartTimer) restartSlideshowTimer();
    else if (slideshowPlaying) scheduleNextSlide();
}
function slideshowNext(restartTimer = true) {
    setSlideshowImage(slideshowIndex + 1, restartTimer);
}
function slideshowPrev(restartTimer = true) {
    setSlideshowImage(slideshowIndex - 1, restartTimer);
}
function clearSlideshowTimer() {
    if (slideshowTimer) {
        clearTimeout(slideshowTimer);
        slideshowTimer = null;
    }
}
function scheduleNextSlide() {
    clearSlideshowTimer();
    if (!slideshowPlaying) return;
    const delayMs = getSlideDurationSecs() * 1000;
    slideshowTimer = setTimeout(() => {
        slideshowNext(false);
    }, delayMs);
}
function restartSlideshowTimer() {
    if (!slideshowPlaying) return;
    scheduleNextSlide();
}
function updatePlayButton() {
    if (!ssPlayPauseBtn) return;
    if (slideshowPlaying) {
        ssPlayPauseBtn.textContent = '။';
        ssPlayPauseBtn.setAttribute('aria-label', 'Pause slideshow');
        ssPlayPauseBtn.dataset.state = 'playing';
    } else {
        ssPlayPauseBtn.textContent = '▸';
        ssPlayPauseBtn.setAttribute('aria-label', 'Play slideshow');
        ssPlayPauseBtn.dataset.state = 'paused';
    }
}
function playSlideshow() {
    if (!slideshowEl || !visibleImages?.length) return;
    slideshowPlaying = true;
    updatePlayButton();
    showSlideshowUI(true);
    scheduleNextSlide();
}
function pauseSlideshow() {
    slideshowPlaying = false;
    updatePlayButton();
    clearSlideshowTimer();
    clearTimeout(slideshowUiTimer);
    slideshowUiTimer = null;
    showSlideshowUI(false);
}
function togglePlayPause() {
    if (slideshowPlaying) pauseSlideshow();
    else playSlideshow();
}
async function enterFullscreen(el) {
    try {
        if (!document.fullscreenElement) {
            if (el?.requestFullscreen) await el.requestFullscreen();
            else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        }
    } catch (_) {}
}
const UI_HIDE_DELAY_MS = 1500;
let slideshowUiTimer = null;
function showSlideshowUI(armTimer = true) {
    if (!slideshowEl) return;
    slideshowEl.classList.add('show-ui');
    document.body.classList.remove('hide-cursor');
    clearTimeout(slideshowUiTimer);
    if (armTimer && slideshowPlaying) {
        slideshowUiTimer = setTimeout(() => {
            if (!slideshowPlaying) return;
            hideSlideshowUI();
        }, UI_HIDE_DELAY_MS);
    } else {
        slideshowUiTimer = null;
    }
}
function hideSlideshowUI() {
    if (!slideshowEl) return;
    if (!slideshowPlaying) return;
    slideshowEl.classList.remove('show-ui');
    if (document.body.classList.contains('slideshow-open')) {
        document.body.classList.add('hide-cursor');
    }
    clearTimeout(slideshowUiTimer);
    slideshowUiTimer = null;
}
function onSlideshowActivity() {
    showSlideshowUI(slideshowPlaying);
}
function bindSlideshowUiActivityListeners() {
    slideshowEl?.addEventListener('pointermove', onSlideshowActivity, {passive: true});
    slideshowEl?.addEventListener('pointerdown', onSlideshowActivity, {passive: true});
    slideshowEl?.addEventListener('wheel', onSlideshowActivity, {passive: true});
    slideshowEl?.addEventListener('mousemove', onSlideshowActivity, {passive: true});
}
function unbindSlideshowUiActivityListeners() {
    slideshowEl?.removeEventListener('pointermove', onSlideshowActivity);
    slideshowEl?.removeEventListener('pointerdown', onSlideshowActivity);
    slideshowEl?.removeEventListener('wheel', onSlideshowActivity);
    slideshowEl?.removeEventListener('mousemove', onSlideshowActivity);
}
async function exitFullscreen() {
    try {
        if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    } catch (_) {}
}
async function openSlideshow(startAt = 0, startPlaying = true) {
    if (!slideshowEl) return;
    if (!visibleImages || visibleImages.length === 0) return;
    if (modal && modal.style.display === 'flex') closeModal();
    slideshowEl.classList.remove('hidden');
    slideshowEl.classList.add('show-ui');
    slideshowEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('slideshow-open');
    _applySlide(startAt);
    await enterFullscreen(slideshowEl);
    requestAnimationFrame(focusSlideshowShell);
    bindSlideshowUiActivityListeners();
    if (startPlaying) {
        slideshowPlaying = true;
        updatePlayButton();
        scheduleNextSlide();
    } else {
        slideshowPlaying = false;
        updatePlayButton();
    }
    showSlideshowUI(slideshowPlaying);
}
async function closeSlideshow() {
    if (!slideshowEl) return;
    pauseSlideshow();
    clearSlideshowTimer();
    unbindSlideshowUiActivityListeners();
    clearTimeout(slideshowUiTimer);
    slideshowUiTimer = null;
    document.body.classList.remove('hide-cursor');
    slideshowEl.classList.add('hidden');
    slideshowEl.classList.remove('show-ui');
    slideshowEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('slideshow-open');
    await exitFullscreen();
}
