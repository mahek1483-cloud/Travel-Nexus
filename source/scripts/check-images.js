#!/usr/bin/env node
/**
 * scripts/check-images.js
 * Travel Nexus Image Auditor
 * 
 * Walks through all image and bannerImage URLs in js/states-data.js and js/data.js.
 * Validates availability via local filesystem check for local paths or HTTP HEAD for remote URLs,
 * and detects duplicate image URLs/paths across different place IDs and state slugs.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function loadData() {
  const { STATES_DATA } = require(path.join(PROJECT_ROOT, 'js', 'states-data.js'));
  const { TRAVEL_DATA } = require(path.join(PROJECT_ROOT, 'js', 'data.js'));

  return {
    states: STATES_DATA || [],
    travelData: TRAVEL_DATA || {}
  };
}

function collectImages(data) {
  const list = [];

  // 1. From states-data.js
  data.states.forEach(state => {
    if (state.bannerImage) {
      list.push({
        source: 'states-data.js',
        entityType: 'state-banner',
        id: `state-banner-${state.slug}`,
        name: `${state.name} Banner`,
        state: state.slug,
        url: state.bannerImage
      });
    }
    if (state.iconicSite && state.iconicSite.image) {
      list.push({
        source: 'states-data.js',
        entityType: 'iconic-site',
        id: `iconic-${state.slug}`,
        name: `${state.name} - ${state.iconicSite.name}`,
        state: state.slug,
        url: state.iconicSite.image
      });
    }
    if (Array.isArray(state.places)) {
      state.places.forEach(place => {
        if (place.image) {
          list.push({
            source: 'states-data.js',
            entityType: 'place',
            id: place.id,
            name: place.name,
            state: state.slug,
            url: place.image
          });
        }
      });
    }
  });

  // 2. From data.js
  const td = data.travelData;
  if (Array.isArray(td.destinations)) {
    td.destinations.forEach(dest => {
      if (dest.image) {
        list.push({
          source: 'data.js',
          entityType: 'destination',
          id: dest.id,
          name: dest.name,
          region: dest.region,
          url: dest.image
        });
      }
    });
  }
  if (Array.isArray(td.stays)) {
    td.stays.forEach(stay => {
      if (stay.image) {
        list.push({
          source: 'data.js',
          entityType: 'stay',
          id: stay.id,
          name: stay.name,
          location: stay.location,
          url: stay.image
        });
      }
    });
  }
  if (Array.isArray(td.culinaryThemes)) {
    td.culinaryThemes.forEach(theme => {
      if (theme.heroImage) {
        list.push({
          source: 'data.js',
          entityType: 'culinary-theme',
          id: theme.id,
          name: theme.name,
          url: theme.heroImage
        });
      }
      if (Array.isArray(theme.dishes)) {
        theme.dishes.forEach((dish, idx) => {
          if (dish.image) {
            list.push({
              source: 'data.js',
              entityType: 'dish',
              id: `${theme.id}-dish-${idx}`,
              name: dish.name,
              url: dish.image
            });
          }
        });
      }
    });
  }

  return list;
}

async function verifyImage(item) {
  const rawUrl = item.url;
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { ok: false, status: 'EMPTY_URL', item };
  }
  const url = rawUrl.trim();

  // Check local file
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const cleanPath = url.replace(/^\.?\//, '');
    const localPath = path.join(PROJECT_ROOT, cleanPath);
    if (!fs.existsSync(localPath)) {
      return { ok: false, status: 'FILE_NOT_FOUND', localPath, item };
    }
    const stat = fs.statSync(localPath);
    if (stat.size < 100) {
      return { ok: false, status: 'EMPTY_OR_CORRUPT_FILE', localPath, size: stat.size, item };
    }
    return { ok: true, status: 200, localPath, size: stat.size, item };
  }

  // Remote URL check
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    };

    let res = await fetch(url, {
      method: 'HEAD',
      headers,
      signal: controller.signal
    });

    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
    }

    clearTimeout(timeout);
    if (res.ok) {
      return { ok: true, status: res.status, item };
    } else {
      return { ok: false, status: res.status, statusText: res.statusText, item };
    }
  } catch (err) {
    clearTimeout(timeout);
    return { ok: false, status: err.name === 'AbortError' ? 'TIMEOUT' : 'ERROR', error: err.message, item };
  }
}

function findDuplicates(items) {
  const urlMap = new Map();
  items.forEach(item => {
    let key = item.url.trim().toLowerCase();
    // Normalize Unsplash IDs
    if (key.includes('unsplash.com/photo-')) {
      const match = key.match(/(photo-[a-z0-9_-]+)/);
      if (match) key = match[1];
    }
    if (!urlMap.has(key)) {
      urlMap.set(key, []);
    }
    urlMap.get(key).push(item);
  });

  const duplicates = [];
  for (const [key, entries] of urlMap.entries()) {
    if (entries.length > 1) {
      const distinctIds = new Set(entries.map(e => e.id));
      if (distinctIds.size > 1) {
        duplicates.push({ key, count: entries.length, entries });
      }
    }
  }
  return duplicates;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 Travel Nexus - Comprehensive Image Audit');
  console.log('='.repeat(70));

  const data = loadData();
  const items = collectImages(data);
  console.log(`Auditing ${items.length} total image references across states-data.js and data.js...`);

  const duplicates = findDuplicates(items);
  console.log(`\nChecking cross-place image duplications...`);
  if (duplicates.length === 0) {
    console.log('✅ ZERO duplicate image references found across entities!');
  } else {
    console.log(`❌ Found ${duplicates.length} duplicate image groups across different entities:`);
    duplicates.forEach((dup, idx) => {
      console.log(`  [${idx + 1}] Reused ${dup.count}x: "${dup.key}"`);
      dup.entries.forEach(e => {
        console.log(`      ↳ [${e.source}] ${e.entityType}: ${e.id} ("${e.name}")`);
      });
    });
  }

  console.log(`\nVerifying image availability (local file checks & HTTP requests)...`);
  const broken = [];
  const BATCH_SIZE = 15;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(chunk.map(verifyImage));
    results.forEach(r => {
      if (!r.ok) {
        broken.push(r);
        console.log(`  ❌ [${r.status}] ${r.item.id} (${r.item.name}) -> ${r.item.url}`);
      }
    });
    process.stdout.write(`  Processed ${Math.min(i + BATCH_SIZE, items.length)} / ${items.length}\r`);
  }
  console.log('\n');

  console.log('='.repeat(70));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total images checked:    ${items.length}`);
  console.log(`Duplicate image groups:  ${duplicates.length}`);
  console.log(`Broken / 404 images:     ${broken.length}`);

  if (duplicates.length > 0 || broken.length > 0) {
    console.log('\n❌ AUDIT FAILED: Issues detected in image data.');
    process.exit(1);
  } else {
    console.log('\n✅ AUDIT PASSED: All images are valid, reachable, and distinct!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error running image check:', err);
  process.exit(1);
});
