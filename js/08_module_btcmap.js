/* ===========================
 * MODULE: BTC Maps
 * =========================== */
function isBtcmapsFile(fname){
  const f = String(fname || "").toLowerCase();
  if (!/\.png$/i.test(f)) return false;

  // Your actual canonical files
  if (f === "btcmaps.png") return true;

  // Keep legacy compatibility if you still have these around
  if (f === "btcmap.png") return true;
  if (f === "btcmaps_global.png") return true;

  if (f.startsWith("btcmap_")) return true;
  if (f.startsWith("btcmaps_")) return true;

  return false;
}
function _btcmapsFileSet(){
  const list = Array.isArray(rawImageList) ? rawImageList : (Array.isArray(imageList) ? imageList : []);
  const s = new Set();
  (list || []).forEach(it => {
    const fn = String(it?.filename || "").toLowerCase();
    if (fn.endsWith(".png")) s.add(fn);
  });
  return s;
}
function getBtcmapsVisualizationCount(){
  const files = _btcmapsFileSet();
  const variants = new Set();
  for (const fn of files) {
    if (!isBtcmapsFile(fn)) continue;
    const parsed = btcmapsRegionAndViewFromFilename(fn);
    const region = String(parsed?.region || "global").toLowerCase();
    const view   = String(parsed?.view || "total").toLowerCase() || "total";
    variants.add(`${region}|${view}`);
  }
  return variants.size;
}
function _pickExistingBtcmapsFilename(regionSlug, viewValue){
  const files = _btcmapsFileSet();
  const r = String(regionSlug || "global").toLowerCase();
  const vRaw = String(viewValue || "total").toLowerCase();
  const v = vRaw || "total";
  const isTotal = v === "total";
  const candidates = [];
  if (r === "global" && isTotal) {
    candidates.push("btcmaps.png", "btcmap.png", "btcmaps_global.png");
  } else if (r === "global" && v === "per_100k") {
    candidates.push("btcmaps_per_100k.png", "btcmap_per_100k.png", "btcmaps_global_per_100k.png");
  } else if ((r === "us" || r === "usa" || r === "united_states") && isTotal) {
    candidates.push("btcmaps_us.png", "btcmap_us.png", `btcmaps_${r}.png`, `btcmap_${r}.png`);
  } else if ((r === "us" || r === "usa" || r === "united_states") && v === "per_100k") {
    candidates.push("btcmaps_us_per_100k.png", "btcmap_us_per_100k.png", `btcmaps_${r}_${v}.png`, `btcmap_${r}_${v}.png`);
  } else {
    if (r === "global") {
      if (isTotal) {
        candidates.push("btcmap.png", "btcmaps_global.png");
      } else {
        candidates.push(
          `btcmap_global_${v}.png`,
          `btcmap_${v}.png`,
          `btcmaps_global_${v}.png`,
          `btcmaps_${v}.png`
        );
      }
    } else {
      if (isTotal) {
        candidates.push(`btcmap_${r}.png`, `btcmaps_${r}.png`);
      } else {
        candidates.push(`btcmap_${r}_${v}.png`, `btcmaps_${r}_${v}.png`);
      }
    }
  }
  const hit = candidates.find(c => files.has(String(c).toLowerCase()));
  return hit || candidates[0];
}
function _btcmapStripPng(fname){
  return String(fname || "").replace(/\.png$/i, "");
}
function _btcmapTailAfterPrefix(fname){
  const f = String(fname || "").toLowerCase();
  const base = _btcmapStripPng(f);

  // canonical "global total" for your naming
  if (base === "btcmaps") return "";

  // legacy compatibility
  if (base === "btcmap") return "";
  if (base === "btcmaps_global") return "global";

  if (base.startsWith("btcmap_")) return base.slice("btcmap_".length);
  if (base.startsWith("btcmaps_")) return base.slice("btcmaps_".length);

  return null;
}

function _computeBtcmapsRegionSlugsFromList(list){
  const tails = new Set();

  (list || []).forEach(img => {
    const fn = String(img?.filename || "").toLowerCase();
    if (!fn.endsWith(".png")) return;
    if (!isBtcmapsFile(fn)) return;

    // skip canonical global totals (no region tail)
    if (fn === "btcmaps.png") return;

    // legacy compatibility
    if (fn === "btcmap.png" || fn === "btcmaps_global.png") return;

    const tail = _btcmapTailAfterPrefix(fn);
    if (!tail) return;

    // IMPORTANT: tails that are *pure views* should not become regions
    // (this is exactly what happens with btcmaps_per_100k.png)
    if (BTCMAP_VIEW_VALUES.has(tail)) return;

    tails.add(tail);
  });

  const baseArr = Array.from(tails);

  // Keep only minimal region slugs (e.g. keep "us", drop "us_per_100k")
  const minimal = baseArr.filter(t => !baseArr.some(t2 => t2 !== t && t.startsWith(t2 + "_")));

  return ["global", ...minimal.sort((a,b)=>a.localeCompare(b))];
}

function _matchRegionFromTail(tail){
  const t = String(tail || "").toLowerCase();
  if (!t) return null;
  const slugs = Array.isArray(BTCMAP_REGION_SLUGS) ? [...BTCMAP_REGION_SLUGS] : [];
  const candidates = slugs.filter(s => s && s !== "global").sort((a,b)=>b.length - a.length);
  for (const r of candidates) {
    if (t === r) return { region: r, viewSuffix: "" };
    if (t.startsWith(r + "_")) return { region: r, viewSuffix: t.slice(r.length + 1) };
  }
  return { region: "global", viewSuffix: t };
}
function btcmapsRegionAndViewFromFilename(fname){
  const f = String(fname || "").toLowerCase();
  if (!/\.png$/i.test(f)) return { region: "global", view: "total", suffix: "" };

  // canonical global total
  if (f === "btcmaps.png") return { region: "global", view: "total", suffix: "" };

  // legacy compatibility
  if (f === "btcmap.png" || f === "btcmaps_global.png") {
    return { region: "global", view: "total", suffix: "" };
  }

  const tail = _btcmapTailAfterPrefix(f);
  if (tail === null) return { region: "global", view: "total", suffix: "" };

  // If tail is a pure view like "per_100k", treat as global view
  if (BTCMAP_VIEW_VALUES.has(tail)) {
    const v = _normalizeBtcmapsView(tail);
    return { region: "global", view: v, suffix: v === "total" ? "" : v };
  }

  const parsed = _matchRegionFromTail(tail);
  const suffix = String(parsed?.viewSuffix || "");
  const v = _normalizeBtcmapsView(suffix || "total");

  return {
    region: parsed?.region || "global",
    view: v,
    suffix: v === "total" ? "" : v
  };
}

function btcmapsSlugFromFilename(fname){
  return btcmapsRegionAndViewFromFilename(fname).region;
}
function btcmapsFilenameForSlug(regionSlug){
  return btcmapsFilenameForRegionView(regionSlug, "total");
}
function btcmapsFilenameForRegionView(regionSlug, viewValue){
  return _pickExistingBtcmapsFilename(regionSlug, viewValue);
}
function btcmapsLabelFromSlug(slug) {
  const s = String(slug || "").toLowerCase();
  if (s === "global") return "Global";
  if (s === "us" || s === "usa" || s === "united_states") return "United States";
  if (s === "north_america") return "North America";
  if (s === "south_america") return "South America";
  if (s === "latam") return "LATAM";
  if (s === "europe") return "Europe";
  if (s === "asia") return "Asia";
  if (s === "africa") return "Africa";
  if (s === "oceania") return "Oceania";
  if (s === "sea") return "SEA";
  if (s === "latam") return "LATAM";
  if (s === "mena") return "MENA";
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function _viewLabelFromSuffix(suffix){
  const s = String(suffix || "").trim();
  if (!s) return "Total Merchants";
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function buildBtcmapsOptionsAndViewsFromList(list) {
  BTCMAP_REGION_SLUGS = _computeBtcmapsRegionSlugsFromList(list);
  const bySlug = new Map();
  (BTCMAP_REGION_SLUGS || []).forEach(slug => {
    if (!slug) return;
    const filename = btcmapsFilenameForRegionView(slug, "total");
    const baseEntry = (list || []).find(img => String(img?.filename || "").toLowerCase() === String(filename).toLowerCase());
    bySlug.set(slug, {
      slug,
      label: btcmapsLabelFromSlug(slug),
      filename,
      title: baseEntry?.title || `BTC Map – ${btcmapsLabelFromSlug(slug)}`,
      description: baseEntry?.description || "",
      latest_x: baseEntry?.latest_x || "",
      latest_nostr: baseEntry?.latest_nostr || "",
      latest_youtube: baseEntry?.latest_youtube || ""
    });
  });
  BTCMAP_OPTIONS = Array.from(bySlug.values());
  BTCMAP_META = BTCMAP_OPTIONS.reduce((acc, o) => ((acc[o.slug] = o), acc), {});
  const viewsByRegion = {};
  (BTCMAP_REGION_SLUGS || []).forEach(r => {
    if (!r) return;
    viewsByRegion[r] = [{ value: "total", label: "Total Merchants", suffix: "" }];
  });
  (list || []).forEach(img => {
    const fn = String(img?.filename || "").toLowerCase();
    if (!isBtcmapsFile(fn)) return;
    const { region, suffix } = btcmapsRegionAndViewFromFilename(fn);
    if (!viewsByRegion[region]) viewsByRegion[region] = [{ value: "total", label: "Total Merchants", suffix: "" }];
    if (suffix) {
      const v = _normalizeBtcmapsView(suffix);
      const exists = viewsByRegion[region].some(o => o.value === v);
      if (!exists) {
        viewsByRegion[region].push({ value: v, label: _viewLabelFromSuffix(v), suffix: v });
      }
    }
  });
  Object.keys(viewsByRegion).forEach(r => {
    const arr = viewsByRegion[r] || [];
    const head = arr.find(v => v.value === "total") ? [arr.find(v => v.value === "total")] : [];
    const rest = arr.filter(v => v.value !== "total").sort((a,b)=>a.label.localeCompare(b.label));
    viewsByRegion[r] = [...head, ...rest];
  });
  BTCMAP_VIEWS_BY_REGION = viewsByRegion;
}
function populateBtcmapsSelect() {
  if (!btcmapsSelect) return;
  btcmapsSelect.innerHTML = BTCMAP_OPTIONS
    .map(o => `<option value="${o.slug}">${o.label}</option>`)
    .join("");
}
function populateBtcmapsViewSelect(regionSlug) {
  if (!viewSelect) return;
  const r = String(regionSlug || "global").toLowerCase();
  const views = BTCMAP_VIEWS_BY_REGION?.[r] || [{ value: "total", label: "Total Merchants", suffix: "" }];
  viewSelect.innerHTML = views.map(v => `<option value="${v.value}">${v.label}</option>`).join("");
}
function getStoredBtcmapsRegion() {
  const raw = localStorage.getItem(BTCMAP_STORAGE_KEY);
  const v = String(raw || "").toLowerCase();
  if (BTCMAP_OPTIONS.some(o => o.slug === v)) return v;
  return BTCMAP_OPTIONS[0]?.slug || "global";
}
function setStoredBtcmapsRegion(slug) {
  const s = String(slug || "").toLowerCase();
  const ok = BTCMAP_OPTIONS.some(o => o.slug === s) ? s : (BTCMAP_OPTIONS[0]?.slug || "global");
  localStorage.setItem(BTCMAP_STORAGE_KEY, ok);
  return ok;
}
function getStoredBtcmapsView(regionSlug) {
  const r = String(regionSlug || "global").toLowerCase();
  const raw = localStorage.getItem(BTCMAP_VIEW_STORAGE_KEY);
  const v = String(raw || "").toLowerCase() || "total";
  const views = BTCMAP_VIEWS_BY_REGION?.[r] || [];
  if (views.some(o => o.value === v)) return v;
  return "total";
}
function setStoredBtcmapsView(regionSlug, viewValue) {
  const r = String(regionSlug || "global").toLowerCase();
  const v = String(viewValue || "").toLowerCase() || "total";
  const views = BTCMAP_VIEWS_BY_REGION?.[r] || [];
  const ok = views.some(o => o.value === v) ? v : "total";
  localStorage.setItem(BTCMAP_VIEW_STORAGE_KEY, ok);
  return ok;
}
function setBtcmapsRegion(slug) {
  const image = visibleImages[currentIndex];
  if (!image || !isBtcmapsFile(image.filename)) return;
  const normRegion = setStoredBtcmapsRegion(slug);
  populateBtcmapsViewSelect(normRegion);
  const parsed = btcmapsRegionAndViewFromFilename(image.filename);
  let desiredView = "total";
  if (parsed.region === normRegion) desiredView = parsed.view || "total";
  else desiredView = getStoredBtcmapsView(normRegion);
  if (viewSelect) viewSelect.value = setStoredBtcmapsView(normRegion, desiredView);
  setBtcmapsRegionAndView(normRegion, viewSelect?.value || "total");
}
function setBtcmapsView(viewValue) {
  const image = visibleImages[currentIndex];
  if (!image || !isBtcmapsFile(image.filename)) return;

  const parsed = btcmapsRegionAndViewFromFilename(image.filename);
  const r = parsed.region || getStoredBtcmapsRegion() || "global";
  const v = setStoredBtcmapsView(r, viewValue);

  setBtcmapsRegionAndView(r, v);
}
function setBtcmapsRegionAndView(regionSlug, viewValue) {
  const image = visibleImages[currentIndex];
  if (!image || !isBtcmapsFile(image.filename)) return;
  const r = setStoredBtcmapsRegion(regionSlug);
  const v = setStoredBtcmapsView(r, viewValue);
  const meta = BTCMAP_META[r] || {};
  const oldFilename = image.filename;
  const newFilename = btcmapsFilenameForRegionView(r, v);
  rekeyCard(oldFilename, newFilename);
  lastOpenedFilename = newFilename || lastOpenedFilename;
  const title = meta.title || image.title || `BTC Map – ${btcmapsLabelFromSlug(r)}`;
  const description = meta.description || image.description || "";
  setModalImageAndCenter(newFilename, title);
  replaceUrlForFilename(newFilename);
  setModalLinks({ x: meta.latest_x || "", nostr: meta.latest_nostr || "", youtube: meta.latest_youtube || "" });
  Object.assign(visibleImages[currentIndex], {
    filename: newFilename,
    title,
    description,
    latest_x: meta.latest_x || image.latest_x || "",
    latest_nostr: meta.latest_nostr || image.latest_nostr || "",
    latest_youtube: meta.latest_youtube || image.latest_youtube || ""
  });
  const titleEl = document.querySelector(`.chart-title[data-grid-index="${currentIndex}"]`);
  if (titleEl) titleEl.textContent = title;
  const descEl = document.querySelector(`.chart-description[data-grid-index="${currentIndex}"]`);
  if (descEl) descEl.textContent = description;
  updateGridThumbAtCurrent(newFilename, title);
  migrateFavoriteFilename(oldFilename, newFilename);
  updateModalSafePadding();
}
function cycleBtcmapsRegion(direction) {
  if (!btcmapsSelect || !BTCMAP_OPTIONS.length) return;
  const slugs = BTCMAP_OPTIONS.map(o => o.slug);
  const cur = btcmapsSelect.value || getStoredBtcmapsRegion();
  const idx = slugs.indexOf(cur);
  const delta = direction === "up" ? -1 : 1;
  const next = slugs[((idx === -1 ? 0 : idx) + delta + slugs.length) % slugs.length];
  btcmapsSelect.value = next;
  setBtcmapsRegion(next);
}
function cycleBtcmapsView(direction) {
  if (!viewSelect) return;
  const opts = Array.from(viewSelect.options).map(o => o.value);
  if (!opts.length) return;
  const cur = viewSelect.value || "total";
  const idx = opts.indexOf(cur);
  const delta = direction === "up" ? -1 : 1;
  const next = opts[((idx === -1 ? 0 : idx) + delta + opts.length) % opts.length];
  viewSelect.value = next;
  setBtcmapsView(next);
}