# JS Architecture Guide (Wicked Smart Bitcoin)

This `js/` folder is a **plain-JS, multi-file “module” system** that relies on **script load order** (no bundler/imports). Files are numbered `00_…` → `23_…` to enforce order.

---

## LLM Prompt Header (copy/paste)

Use this block at the top of future “make a change” requests so the model edits the right files and doesn’t miss dependencies.

```text
Repo context: Wicked Smart Bitcoin static site. JS is split into 24 numbered files in js/ and depends on script load order (00 → 23). No bundler/imports; modules share globals.

When making changes:
- Identify feature area (grid, modal, deep links, a specific module, slideshow, buy-me overlay).
- Update BOTH: (a) logic and (b) event bindings + UI wiring, if applicable.
- If behavior affects which images exist or how cards are represented, also update bootstrap (image_list.json processing) and grid count logic.

Common entry points by symptom:
- Grid rendering, card counts, filtering, favorites UI: 06_grid_layout_filter_render.js
- Modal open/close, which controls show, safe padding, swipes: 07_modal_open_close_swipes.js
- Feature dropdown logic (BVG/DAL/UOA/POF/BTC Maps/etc.): 08–19_module_*.js
- Deep linking, initial modal open, representative cards, image_list fetch/init: 22_bootstrap_fetch_init_global_exports.js
- Keyboard/mouse/touch/menu wiring (focus bugs, arrow keys, dropdown change handlers): 23_event_bindings_global_modal_menu.js
- Persistence (cookies/localStorage for search prefs, etc.): 04_persistence_cookies_localstorage.js
- Lazy loading thumbs: 03_lazy_image_loading.js
- Slideshow/fullscreen: 21_slideshow_core_ui_fullscreen.js (+ bindings in 23)
- Buy-me / thanks overlay / donate route: 20_buy_me_button_thanks_overlay.js (+ route sync in 22, bindings in 23)

Always return fixes as explicit BEFORE/AFTER code snippets with surrounding context.
```

---

## Load order (critical)

Include scripts in this exact order in `index.html`:

1. `00_constants.js`
2. `01_dom_elements.js`
3. `02_global_state.js`
4. `03_lazy_image_loading.js`
5. `04_persistence_cookies_localstorage.js`
6. `05_core_helpers_url_image_src_geometry.js`
7. `06_grid_layout_filter_render.js`
8. `07_modal_open_close_swipes.js`
9. `08_module_btc_maps.js`
10. `09_module_bitcoin_vs_gold_bvg.js`
11. `10_module_days_at_a_loss_dal.js`
12. `11_module_price_on_this_day_potd.js`
13. `12_module_dominance_usd_btc.js`
14. `13_module_never_look_back_price_nlbp.js`
15. `14_module_target_block_hashes_length_32_64.js`
16. `15_module_halving_cycles_alignment.js`
17. `16_module_price_of_price_of.js`
18. `17_module_unit_of_account_uoa.js`
19. `18_module_coins_single_card.js`
20. `19_module_monthly_yearly_returns_myr.js`
21. `20_buy_me_button_thanks_overlay.js`
22. `21_slideshow_core_ui_fullscreen.js`
23. `22_bootstrap_fetch_init_global_exports.js`
24. `23_event_bindings_global_modal_menu.js`

If you reorder these, you’ll eventually hit “function not defined” / “variable not defined” problems because later files reference globals created earlier.

---

## Mental model: the “swap pipeline”

Most feature modules follow the same pattern when a dropdown changes:

1. Determine the new filename (based on selected option)
2. Update modal image (e.g., `setModalImageAndCenter(...)`)
3. Update URL (e.g., `replaceUrlForFilename(...)`)
4. Update the current card’s key/metadata (e.g., `rekeyCard(...)`, update title/desc if needed)
5. Update the grid thumbnail for the current item (e.g., `updateGridThumbAtCurrent(...)`)
6. Migrate favorites if a filename changed (e.g., `migrateFavoriteFilename(...)`)
7. Recompute modal safe padding (e.g., `updateModalSafePadding(...)`)

If something “almost works” but the grid thumb, URL, count label, or favorites are wrong, the fix is usually that one of these steps wasn’t applied consistently.

---

## Shared “global contracts” (don’t break these)

### Shared arrays/state (conceptual)
- `imageList`: full set of cards (post-rewrite into representative cards for certain families)
- `visibleImages`: filtered subset based on search + favorites toggle
- `currentIndex`: modal index into `visibleImages`
- `cardByFilename`: map used to update the right card DOM when filenames/titles change
- Favorites: persisted via `localStorage` (with special-case behavior for `price_of_*`)

---

## File-by-file responsibilities (all 24)

### 00_constants.js — App constants and module config
Defines filename prefixes, storage keys, canonical option lists, and other “shared constants.”
Edit this when adding a new “family” of images or new persistence keys.

### 01_dom_elements.js — DOM element registry
Central place for `getElementById(...)` / `querySelector(...)` handles.
If an ID changes in HTML/CSS, update it here (not scattered across modules).

### 02_global_state.js — Shared runtime state
Defines mutable globals for lists, modal state, gesture state, flags/guards.

### 03_lazy_image_loading.js — IntersectionObserver lazy loading
Lazy-loads `.lazy` thumbnails using IntersectionObserver and `data-src` → `src` promotion.

### 04_persistence_cookies_localstorage.js — Storage + search prefs
Cookie helpers + localStorage-backed prefs (notably search scope UI state).

### 05_core_helpers_url_image_src_geometry.js — Low-level utilities
Non-feature-specific helpers used across modules: URL/path helpers, geometry/pan/zoom helpers, preloading utilities.

### 06_grid_layout_filter_render.js — Grid/list render + filtering + card bookkeeping
Builds the grid/list cards, maintains `cardByFilename`, implements `filterImages()`, and owns card count labels.

Start here for: grid count issues, search/favorites filtering display, card DOM update bugs.

### 07_modal_open_close_swipes.js — Modal lifecycle + controls visibility + gestures
Open/close modal, determine which control set is visible, manage safe padding and swipe UI behavior.

Start here for: wrong controls shown, safe padding, swipes, modal lifecycle bugs.

---

## Feature modules (08–19)

These implement “family-specific” logic (dropdowns, filename parsing, option lists, and swap pipeline).

### 08_module_btc_maps.js — BTC Maps region + view
Two-dimensional selection (region × view), parsing/formatting, dropdown population, cycling, filename computation.

### 09_module_bitcoin_vs_gold_bvg.js — BVG year selection
Year parsing from filename and dropdown selection for `bitcoin_vs_gold_YYYY`.

### 10_module_days_at_a_loss_dal.js — DAL linear/log
Scale parsing, dropdown, and filename selection for DAL.

### 11_module_price_on_this_day_potd.js — POTD linear/log
Same pattern as DAL for POTD.

### 12_module_dominance_usd_btc.js — Dominance USD/BTC unit
Unit selection and filename mapping for dominance.

### 13_module_never_look_back_price_nlbp.js — NLBP linear/log
Same pattern as DAL/POTD for NLBP.

### 14_module_target_block_hashes_length_32_64.js — Target/Block hashes (32 vs 64)
Length selection that may also update title/description/link metadata when swapping.

### 15_module_halving_cycles_alignment.js — Halving cycles alignment
Alignment selection (block-height vs days-from-halving), filename swap, and metadata updates.

### 16_module_price_of_price_of.js — Price Of (price_of_*)
Builds option list + meta map from `image_list.json`, sorting, index navigation, persistence, favorites migration behavior.

### 17_module_unit_of_account_uoa.js — Unit of Account (uoa_*)
Builds UOA option list + meta, supports group filters (e.g., G7/G20/regions), sorting, index navigation, persistence.

### 18_module_coins_single_card.js — Coins (single representative card)
Coin type selection and representative-card swapping.

### 19_module_monthly_yearly_returns_myr.js — MYR 5-year ranges
5-year window selection and representative-card swapping.

---

## Overlays + slideshow + bootstrapping + events (20–23)

### 20_buy_me_button_thanks_overlay.js — Buy Me button + Thanks overlay (donate route)
Donate overlay creation/removal, copy-to-clipboard, responsive positioning, beer/coffee mode selection, and preloading assets.

### 21_slideshow_core_ui_fullscreen.js — Slideshow logic + fullscreen + UI hiding
Slideshow open/close, play/pause, duration control, fullscreen toggles, and auto-hide UI/cursor while playing.

### 22_bootstrap_fetch_init_global_exports.js — Bootstrapping + deep link sync + representative cards
Fetches `final_frames/image_list.json`, initializes module option maps, rewrites `imageList` into representative cards, applies stored prefs, resolves deep links, and exposes key globals on `window`.

Start here for: initial load issues, deep links, “representative card” behavior, and “why is this the default option” problems.

### 23_event_bindings_global_modal_menu.js — Event bindings (global + modal + menu)
All `addEventListener(...)` wiring: keyboard navigation, dropdown change handlers, menu toggles, modal focus behavior, swipe measurement hooks, slideshow controls, etc.

Start here for: focus bugs, arrow-key behavior, dropdown not responding to clicks, menu interactions.

---

## “Where do I edit?” cheat sheet

### Deep links / routing (`/#slug`, `/slug`, donate route, aliases)
- `22_bootstrap_fetch_init_global_exports.js`
- plus the relevant module if it’s family-specific parsing (e.g., `08_module_btc_maps.js`)

### Grid UI: card counts, titles/descriptions, favorites display, filtering results
- `06_grid_layout_filter_render.js`

### Modal UI: lifecycle, showing/hiding controls, safe padding, swipes
- `07_modal_open_close_swipes.js`

### Dropdown behavior (logic + parsing + filenames)
- The relevant module: `08–19_module_*.js`
- AND the wiring in: `23_event_bindings_global_modal_menu.js`

### Keyboard / focus behavior
- `23_event_bindings_global_modal_menu.js`
- plus modal/grid logic as needed: `07_modal_open_close_swipes.js` / `06_grid_layout_filter_render.js`

### Persistence (prefs)
- `04_persistence_cookies_localstorage.js`
- plus module-specific storage keys in the relevant module file

### Slideshow
- `21_slideshow_core_ui_fullscreen.js` (+ bindings in `23`)

### Buy-me / thanks overlay
- `20_buy_me_button_thanks_overlay.js` (+ route init in `22`, bindings in `23`)

---

## Adding a new “family module” (recommended pattern)

If you add a new set like `new_metric_*.png` with a dropdown:

1. **00_constants.js**
   - Add base prefix, storage key, option list placeholders.

2. **Create `XX_module_new_metric.js`**
   - Implement:
     - `isNewFile(fname)`
     - `optionFromFilename(fname)`
     - `filenameForOption(opt)`
     - `getStoredOption()` / `setStoredOption()`
     - `populateSelect()`
     - `setOption(opt)` using the swap pipeline
     - `cycleOption(direction)` (optional)

3. **07_modal_open_close_swipes.js**
   - Show/hide your controls based on filename family, set select value on open.

4. **23_event_bindings_global_modal_menu.js**
   - Bind select `change` → `setOption(...)`
   - Optional: Up/Down arrow cycling while keeping focus on select.

5. **22_bootstrap_fetch_init_global_exports.js**
   - Build options/meta from `image_list.json` and apply stored option at init.
   - If you want a single representative card, rewrite `imageList` accordingly.

6. **06_grid_layout_filter_render.js**
   - Update count logic for “N Visualizations” label.

---

## Debug checklist (fast)

When something breaks after a change, verify:

- Script order in HTML is still `00 → 23`
- `image_list.json` has the expected filenames for the module
- The module updates **modal + URL + card key + grid thumb + favorites migration**
- Event handlers are bound for the relevant UI elements (file 23)
- Any new DOM element IDs are added in file 01
