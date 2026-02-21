# Modal Load Performance Analysis

## Current Problem

When accessing a direct URL like `https://wickedsmartbitcoin.com/uoa_btc_bob`, the modal loads slower than ideal. The image in the modal should load first before anything else, but currently there are bottlenecks that delay it.

## Current Flow (with bottlenecks)

```
1. Page loads → index.html
2. All 24 JS files load in order
3. fetch(image_list.json) → then() callback executes:
   a. Metadata built (UOA, BVG, Dominance, etc.) - ~10-20ms
   b. If initialFilename from URL detected:
      - openModalByIndex() called → Modal displayed, but IMAGE NOT YET LOADED
      - Modal setup called (dropdowns, controls, etc.)
   c. filterImages() called ← **MAJOR BOTTLENECK #1**
      - buildGridOnce() creates DOM for EVERY chart in the grid
      - Reinitializes IntersectionObserver for lazy loading
      - Re-filters and re-renders all visible cards
      - This work keeps the main thread busy while modal image should be loading
   d. refreshFavoriteStarsUI() called
   e. syncDonateOverlayToRoute() called
   f. syncModalToUrl() called
   g. Finally, modal image starts loading (via setModalImageAndCenter)
```

## Key Bottlenecks

### 1. Grid Building Before Modal Image Load
- **File**: [06_grid_layout_filter_render.js](06_grid_layout_filter_render.js)
- **Issue**: `filterImages()` calls `buildGridOnce()` which creates and processes DOM for potentially hundreds of images
- **Impact**: Main thread is busy building grid while modal image should be loading
- **Lines**: buildGridOnce() at line 65+ creates entire grid with `img.classList.remove("lazy")` operations

### 2. Lazy Image Observer Re-initialization  
- **File**: [03_lazy_image_loading.js](03_lazy_image_loading.js)
- **Issue**: `initLazyImages()` is called twice - once in `buildGridOnce()` and again in `filterImages()`
- **Impact**: IntersectionObserver is torn down and recreated unnecessarily
- **Lines**: Lines 7-25 (IntersectionObserver setup and reinit)

### 3. Modal Image Source Set Too Late
- **File**: [07_modal_open_close_swipes.js](07_modal_open_close_swipes.js)  
- **Issue**: `setModalImageAndCenter()` is called at the END of `openModalByIndex()`, after all setup
- **Impact**: Modal image only starts loading after all control setup and grid building starts
- **Lines**: Line 190 is where the image is actually loaded

### 4. Synchronous Metadata Building
- **File**: [22_bootstrap_fetch_init_global_exports.js](22_bootstrap_fetch_init_global_exports.js)
- **Issue**: Large block of synchronous code (lines 78-520) that blocks modal image from loading
- **Impact**: 200+ lines of synchronous code building UOA, BTC Maps, Price Of options, Halving data, etc.
- **Lines**: 78-520 - all happens before `syncModalToUrl()` is called

## Proposed Optimization

### Optimal Flow for Direct URL Modal Load
```
1. Page loads
2. fetch(image_list.json)
3. On fetch complete:
   a. Minimal metadata building only for the specific modal image (if needed)
   b. openModalByIndex() called
   c. **setModalImageAndCenter() called IMMEDIATELY** ← Image starts loading
   d. renderModalImage/scheduleGridBuild() to defer grid work
   e. Background work (filterImages, grid building) deferred
   f. Grid builds after modal image loaded or in idle time
```

## Files That Need Updates

### 1. **[22_bootstrap_fetch_init_global_exports.js](22_bootstrap_fetch_init_global_exports.js)** - PRIMARY  
   - Lines 78-520: Metadata building
   - Line 510-515: Modal opening logic
   - Line 519: `filterImages()` call
   - Line 523: `syncModalToUrl()` call
   
   **Changes needed:**
   - Detect if initial URL is pointing to a modal
   - If yes, defer `filterImages()` call
   - Move `setModalImageAndCenter()` call earlier (or into openModalByIndex)
   - Use `requestIdleCallback()` or `setTimeout()` to defer grid building
   - Skip `syncModalToUrl()` if modal already open

### 2. **[07_modal_open_close_swipes.js](07_modal_open_close_swipes.js)** - SECONDARY
   - Line 190: Where `setModalImageAndCenter()` is called
   - Lines 15-45: Modal opening setup
   
   **Changes needed:**
   - Add option to prioritize image loading in `openModalByIndex()`
   - Move image source assignment earlier in the function
   - Consider splitting modal setup from image loading

### 3. **[06_grid_layout_filter_render.js](06_grid_layout_filter_render.js)** - SECONDARY
   - Lines 65-135: `buildGridOnce()` function
   - Line 9: `openModalByFilename()` function
   - Lines 136-195: `filterImages()` function
   
   **Changes needed:**
   - Add check to skip grid building if modal opening with direct URL
   - Allow deferral of grid building to idle time
   - Don't reinitialize lazy loader if not needed

### 4. **[03_lazy_image_loading.js](03_lazy_image_loading.js)** - TERTIARY
   - Lines 1-25: IntersectionObserver setup
   
   **Changes needed:**
   - Track if observer is already initialized
   - Avoid unnecessary disconnect/recreate cycles
   - Add ability to defer observer initialization

## Implementation Priority

1. **High** - Update `22_bootstrap_fetch_init_global_exports.js` (major bottleneck)
2. **High** - Update `07_modal_open_close_swipes.js` (get image loading earlier)
3. **Medium** - Update `06_grid_layout_filter_render.js` (deferral logic)
4. **Low** - Update `03_lazy_image_loading.js` (optimization only)

## Expected Performance Improvement

- **Current**: Modal image visible after 500-800ms (after grid built)
- **Expected**: Modal image visible after 200-350ms (parallel/deferred grid building)

The image URL is typically already in `image_list.json` metadata, so the only blocking operation should be the image download, not DOM construction.

## Key Insight

The modal image loading should NOT be blocked by grid DOM building. The grid is only visible after scrolling down or closing the modal, so it should be:
1. Built in the background after modal image loads
2. Or deferred to `requestIdleCallback()` for non-critical initial rendering
