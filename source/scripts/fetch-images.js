#!/usr/bin/env node
/**
 * scripts/fetch-images.js
 * Travel Nexus Image Asset Seed & Downloader
 * 
 * Programmatically downloads authentic, verified photos for all 36 Indian states,
 * flagship places, destinations, stays, and culinary themes into:
 *   images/india/<state-slug>/<place-slug>.jpg
 *   images/india/destinations/<dest-id>.jpg
 *   images/india/stays/<stay-id>.jpg
 *   images/india/cuisine/<dish-slug>.jpg
 * 
 * Sources:
 * - Wikipedia PageImages API (high-resolution authentic photography)
 * - Wikimedia Commons Search API
 * - Branded fallback generator for any unreachable assets
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const USER_AGENT = 'TravelNexus/1.0 (https://travelnexus.app; contact@travelnexus.app)';

// Load data models
const { STATES_DATA } = require(path.join(PROJECT_ROOT, 'js', 'states-data.js'));
const { TRAVEL_DATA } = require(path.join(PROJECT_ROOT, 'js', 'data.js'));

// Helper to delay between requests
const sleep = ms => new Promise(res => setTimeout(res, ms));

// Ensure target directory exists
function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Build manifest of all images to fetch
function buildManifest() {
  const list = [];

  // 1. States & UTs
  STATES_DATA.forEach(state => {
    list.push({
      targetPath: path.join('images', 'india', state.slug, 'banner.jpg'),
      query: `${state.name} India landscape tourism`,
      fallbackQueries: [`${state.capital} ${state.name} India`, `${state.name} state`],
      title: `${state.name} State Banner`
    });

    if (state.iconicSite) {
      list.push({
        targetPath: path.join('images', 'india', state.slug, 'iconic.jpg'),
        query: `${state.iconicSite.name} ${state.name}`,
        fallbackQueries: [`${state.iconicSite.name}`, `${state.name} landmark`],
        title: `${state.name} - ${state.iconicSite.name}`
      });
    }

    if (Array.isArray(state.places)) {
      state.places.forEach(place => {
        const placeSlug = place.id.replace(/^[a-z]{2}-/, '');
        list.push({
          targetPath: path.join('images', 'india', state.slug, `${placeSlug}.jpg`),
          query: `${place.name} ${state.name} India`,
          fallbackQueries: [`${place.name}`, `${placeSlug} ${state.name}`],
          title: place.name
        });
      });
    }
  });

  // 2. Destinations
  if (Array.isArray(TRAVEL_DATA.destinations)) {
    TRAVEL_DATA.destinations.forEach(dest => {
      list.push({
        targetPath: path.join('images', 'india', 'destinations', `${dest.id}.jpg`),
        query: `${dest.name} ${dest.region}`,
        fallbackQueries: [`${dest.name} tourism`, `${dest.id.replace('dest-', '')} India`],
        title: dest.name
      });
    });
  }

  // 3. Stays
  if (Array.isArray(TRAVEL_DATA.stays)) {
    TRAVEL_DATA.stays.forEach(stay => {
      list.push({
        targetPath: path.join('images', 'india', 'stays', `${stay.id}.jpg`),
        query: `${stay.name} ${stay.location}`,
        fallbackQueries: [`${stay.location} resort luxury`, `${stay.location} heritage stay`],
        title: stay.name
      });
    });
  }

  // 4. Culinary Themes and Dishes
  if (Array.isArray(TRAVEL_DATA.culinaryThemes)) {
    TRAVEL_DATA.culinaryThemes.forEach(theme => {
      list.push({
        targetPath: path.join('images', 'india', 'cuisine', `${theme.id}.jpg`),
        query: `${theme.name} Indian culinary feast food`,
        fallbackQueries: [`Indian thali traditional dinner`, `Indian food banquet`],
        title: theme.name
      });

      if (Array.isArray(theme.dishes)) {
        theme.dishes.forEach(dish => {
          const dishSlug = dish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const dishFallbacks = {
            'paneer': ['Paneer tikka curry', 'Paneer butter masala'],
            'pomfret': ['Fried fish Indian cuisine', 'Fish curry'],
            'chicken': ['Butter chicken', 'Chicken curry Indian dish'],
            'jalebi': ['Jalebi Indian sweet', 'Jalebi'],
            'jackfruit': ['Jackfruit curry', 'Raw jackfruit Indian'],
            'kebab': ['Shami kebab Indian', 'Galouti kebab'],
            'khichdi': ['Khichdi Indian dish', 'Khichdi'],
            'puri': ['Panipuri Indian food', 'Golgappa']
          };
          let extraFallbacks = [];
          for (const [k, v] of Object.entries(dishFallbacks)) {
            if (dishSlug.includes(k)) extraFallbacks = v;
          }

          list.push({
            targetPath: path.join('images', 'india', 'cuisine', `${dishSlug}.jpg`),
            query: `${dish.name} Indian cuisine dish`,
            fallbackQueries: [...extraFallbacks, `${dish.name} recipe`, `${dish.name}`],
            title: dish.name
          });
        });
      }
    });
  }

  return list;
}

// Query Wikipedia for page thumbnail
async function queryWikipedia(query) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&pithumbsize=1280&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

// Query Wikimedia Commons for image
async function queryCommons(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    const imgInfo = page?.imageinfo?.[0];
    return imgInfo?.thumburl || imgInfo?.url || null;
  } catch (err) {
    // ignore
  }
  return null;
}

// Download image buffer from remote URL
async function downloadImageBuffer(imageUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

// Fallback branded placeholder generator (SVG rendered to buffer)
function createBrandedFallback(title) {
  const cleanTitle = (title || 'Travel Nexus India')
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B4944" />
      <stop offset="50%" stop-color="#143632" />
      <stop offset="100%" stop-color="#0E2320" />
    </linearGradient>
    <radialGradient id="goldGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#C85A32" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#C85A32" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FAF8F5" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)" />
  <rect width="100%" height="100%" fill="url(#goldGlow)" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  
  <!-- Location Pin & Emblem -->
  <g transform="translate(600, 320)">
    <circle r="64" fill="#C85A32" opacity="0.15" />
    <circle r="48" fill="#C85A32" />
    <path d="M0 -22 C-12 -22 -20 -14 -20 -2 C-20 14 0 32 0 32 C0 32 20 14 20 -2 C20 -14 12 -22 0 -22 Z" fill="#FAF8F5" />
    <circle cx="0" cy="-4" r="6" fill="#C85A32" />
  </g>
  
  <!-- Brand Badge -->
  <text x="600" y="440" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="22" font-weight="700" letter-spacing="4" fill="#D4A373">TRAVEL NEXUS · INCREDIBLE INDIA</text>
  
  <!-- Destination Name -->
  <text x="600" y="500" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', Georgia, serif" font-size="38" font-weight="700" fill="#FAF8F5">${cleanTitle}</text>
  <text x="600" y="540" text-anchor="middle" font-family="'Outfit', -apple-system, sans-serif" font-size="18" fill="#A8B2B0">Authentic Heritage, Curated Stays &amp; Regional Wonders</text>
</svg>`;

  return Buffer.from(svg, 'utf8');
}

async function processItem(item, force = false) {
  const fullPath = path.join(PROJECT_ROOT, item.targetPath);

  // If file exists and valid, skip
  if (!force && fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.size > 2000) {
      return { status: 'SKIPPED', path: item.targetPath, size: stat.size };
    }
  }

  ensureDirFor(fullPath);

  // Try Wikipedia query
  let imgUrl = await queryWikipedia(item.query);

  // Try fallbacks if null
  if (!imgUrl && item.fallbackQueries) {
    for (const fb of item.fallbackQueries) {
      imgUrl = await queryWikipedia(fb);
      if (imgUrl) break;
    }
  }

  // Try Wikimedia Commons
  if (!imgUrl) {
    imgUrl = await queryCommons(item.query);
  }
  if (!imgUrl && item.fallbackQueries) {
    for (const fb of item.fallbackQueries) {
      imgUrl = await queryCommons(fb);
      if (imgUrl) break;
    }
  }

  // Download remote image
  if (imgUrl) {
    const buf = await downloadImageBuffer(imgUrl);
    if (buf && buf.length > 5000) {
      fs.writeFileSync(fullPath, buf);
      return { status: 'DOWNLOADED', path: item.targetPath, size: buf.length, source: 'remote' };
    }
  }

  // If remote failed or returned empty, use branded SVG fallback (saved as file)
  const fallbackBuf = createBrandedFallback(item.title);
  fs.writeFileSync(fullPath, fallbackBuf);
  return { status: 'FALLBACK_GENERATED', path: item.targetPath, size: fallbackBuf.length, source: 'fallback' };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  console.log('='.repeat(70));
  console.log('📥 Travel Nexus - Local Asset Seeder & Downloader');
  console.log('='.repeat(70));

  const manifest = buildManifest();
  console.log(`Prepared manifest: ${manifest.length} targets across India states, places, stays, and cuisine.`);

  let downloadedCount = 0;
  let skippedCount = 0;
  let fallbackCount = 0;

  const CONCURRENCY = 6;
  for (let i = 0; i < manifest.length; i += CONCURRENCY) {
    const batch = manifest.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(item => processItem(item, force)));

    results.forEach(r => {
      if (r.status === 'DOWNLOADED') downloadedCount++;
      else if (r.status === 'SKIPPED') skippedCount++;
      else if (r.status === 'FALLBACK_GENERATED') fallbackCount++;
    });

    const processed = Math.min(i + CONCURRENCY, manifest.length);
    process.stdout.write(`  [${processed}/${manifest.length}] Seeded: ${downloadedCount} | Skipped: ${skippedCount} | Fallbacks: ${fallbackCount}\r`);
    await sleep(200); // polite rate limit
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('🎉 SEEDING COMPLETE');
  console.log('='.repeat(70));
  console.log(`Total Targets:        ${manifest.length}`);
  console.log(`Downloaded (Remote):  ${downloadedCount}`);
  console.log(`Skipped (Cached):     ${skippedCount}`);
  console.log(`Fallback Generated:   ${fallbackCount}`);
  console.log('All local photo assets stored in images/india/...');
}

main().catch(err => {
  console.error('Fatal error in fetch-images:', err);
  process.exit(1);
});
