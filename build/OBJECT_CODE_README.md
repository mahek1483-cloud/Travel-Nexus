# Travel Nexus — Object Code & Production Build Documentation

> **Directory**: `dist/`  
> **Classification**: Production Build ("Object Code" Equivalent)  
> **Generated**: 2026-09-16  
> **Toolchain**: `esbuild` (v0.28.2)  

---

## 1. What Is "Object Code" for a Web Project?

In traditional compiled languages (such as C, C++, or Go), the compiler transforms human-readable source code into machine-language binary instructions termed **object code** (`.o`, `.obj`, `.exe`).

In client-side web applications (JavaScript, CSS, HTML), code is interpreted and dynamically compiled Just-In-Time (JIT) by client browser engines (e.g., Google Chrome V8). Therefore, there are no machine-code binaries. In the modern web ecosystem, the **direct functional equivalent of object code** is this **minified, bundled production build**:
1. **Minification & Identifier Mangling**: Variable and parameter names are reduced to minimal tokens, removing line breaks, redundant tokens, and developer comments.
2. **Whitespace Stripping & Grammar Optimization**: Reduces parsing overhead for browser engines.
3. **Dead Code Elimination**: Prunes unused branches and unreferenced statements.
4. **Optimized Delivery**: Yields the smallest possible byte payload for rapid HTTP delivery and aggressive browser caching.

This `dist/` directory contains the complete, standalone, production-ready artifact ready for high-performance hosting on CDNs, edge networks, or static servers.

---

## 2. Source-to-Object File Mapping & Compression Metrics

| Type | Source File (Human-Readable) | Production File (Object Code) | Original Size | Minified Size | Payload Reduction |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **CSS** | `css/variables.css` | `css/variables.min.css` | 6.72 KB | 4.89 KB | **-27.2%** |
| **CSS** | `css/base.css` | `css/base.min.css` | 4.24 KB | 3.04 KB | **-28.3%** |
| **CSS** | `css/components.css` | `css/components.min.css` | 51.59 KB | 37.94 KB | **-26.5%** |
| **CSS** | `css/pages.css` | `css/pages.min.css` | 72.09 KB | 53.23 KB | **-26.2%** |
| **CSS** | `css/responsive.css` | `css/responsive.min.css` | 8.13 KB | 4.55 KB | **-44.1%** |
| **JS** | `js/data.js` | `js/data.min.js` | 69.94 KB | 57.55 KB | **-17.7%** |
| **JS** | `js/states-data.js` | `js/states-data.min.js` | 100.83 KB | 79.67 KB | **-21.0%** |
| **JS** | `js/map.js` | `js/map.min.js` | 7.04 KB | 4.52 KB | **-35.8%** |
| **JS** | `js/filters.js` | `js/filters.min.js` | 25.15 KB | 18.66 KB | **-25.8%** |
| **JS** | `js/planner.js` | `js/planner.min.js` | 23.19 KB | 18.15 KB | **-21.8%** |
| **JS** | `js/modals.js` | `js/modals.min.js` | 34.77 KB | 29.36 KB | **-15.5%** |
| **JS** | `js/states.js` | `js/states.min.js` | 15.45 KB | 13.08 KB | **-15.4%** |
| **JS** | `js/host.js` | `js/host.min.js` | 39.9 KB | 32.6 KB | **-18.3%** |
| **JS** | `js/firebase-service.js` | `js/firebase-service.min.js` | 12.1 KB | 6.87 KB | **-43.2%** |
| **JS** | `js/firebase-config.js` | `js/firebase-config.min.js` | 480 B | 209 B | **-56.5%** |
| **JS** | `js/auth.js` | `js/auth.min.js` | 25.37 KB | 20.1 KB | **-20.8%** |
| **JS** | `js/admin.js` | `js/admin.min.js` | 16.5 KB | 14.63 KB | **-11.3%** |
| **JS** | `js/router.js` | `js/router.min.js` | 4.55 KB | 2.49 KB | **-45.2%** |
| **JS** | `js/chat.js` | `js/chat.min.js` | 53.36 KB | 37.86 KB | **-29.1%** |
| **JS** | `js/scroll-reveal.js` | `js/scroll-reveal.min.js` | 3.94 KB | 2 KB | **-49.3%** |
| **JS** | `js/app.js` | `js/app.min.js` | 25.74 KB | 16.56 KB | **-35.7%** |
| **PWA** | `sw.js` | `sw.js` | 2.26 KB | 1.32 KB | **-41.7%** |
| **TOTAL** | **All Core Code Assets** | **All Production Assets** | **603.33 KB** | **459.25 KB** | **-23.9%** |

**Net Compression**: Shrunk source code from **603.33 KB** down to **459.25 KB**, eliminating **144.08 KB** of unnecessary transfer overhead (23.9% overall code reduction).

---

## 3. How to Test and Serve This Build

To verify the production build locally:

```bash
# From the project root, serve the dist/ directory:
npx serve dist -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Open DevTools (F12) -> Network tab.
- Notice all loaded stylesheets are `.min.css` and scripts are `.min.js`.
- All features (Search, Map markers, Filters, Stays, Auth modals, AI concierge) function seamlessly with instant response times.
