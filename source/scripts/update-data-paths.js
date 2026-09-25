const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// 1. Update states-data.js
const { STATES_DATA } = require(path.join(PROJECT_ROOT, 'js', 'states-data.js'));

STATES_DATA.forEach(s => {
  s.bannerImage = `images/india/${s.slug}/banner.jpg`;
  if (s.iconicSite) {
    s.iconicSite.image = `images/india/${s.slug}/iconic.jpg`;
  }
  if (Array.isArray(s.places)) {
    s.places.forEach(p => {
      const slug = p.id.replace(/^[a-z]{2}-/, '');
      p.image = `images/india/${s.slug}/${slug}.jpg`;
    });
  }
});

const statesHeader = `/**
 * Travel Nexus - Authentic Indian States & Union Territories
 * Complete data model for all 36 States and Union Territories of India.
 * Includes flagship deep-dives for Karnataka, Kerala, Rajasthan, Himachal Pradesh, and Goa
 * with authentic top-10 destination card shapes and coordinates.
 */

const STATES_DATA = `;

const statesFooter = `;

// Make available globally on window
if (typeof window !== 'undefined') {
  window.STATES_DATA = STATES_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STATES_DATA };
}
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'js', 'states-data.js'), statesHeader + JSON.stringify(STATES_DATA, null, 2) + statesFooter, 'utf8');
console.log('✅ Successfully updated js/states-data.js to local asset paths');

// 2. Update data.js
const { TRAVEL_DATA } = require(path.join(PROJECT_ROOT, 'js', 'data.js'));

if (Array.isArray(TRAVEL_DATA.destinations)) {
  TRAVEL_DATA.destinations.forEach(d => {
    d.image = `images/india/destinations/${d.id}.jpg`;
  });
}

if (Array.isArray(TRAVEL_DATA.stays)) {
  TRAVEL_DATA.stays.forEach(st => {
    st.image = `images/india/stays/${st.id}.jpg`;
  });
}

if (Array.isArray(TRAVEL_DATA.culinaryThemes)) {
  TRAVEL_DATA.culinaryThemes.forEach(th => {
    th.heroImage = `images/india/cuisine/${th.id}.jpg`;
    if (Array.isArray(th.dishes)) {
      th.dishes.forEach(di => {
        const slug = di.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        di.image = `images/india/cuisine/${slug}.jpg`;
      });
    }
  });
}

const dataHeader = `/**
 * Travel Nexus - Comprehensive Curated Data Store
 * Authentic Indian boutique destinations, local stays, culinary themes, and reviews.
 */

const TRAVEL_DATA = `;

const dataFooter = `;

// Make accessible globally
if (typeof window !== 'undefined') {
  window.TRAVEL_DATA = TRAVEL_DATA;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRAVEL_DATA };
}
`;

fs.writeFileSync(path.join(PROJECT_ROOT, 'js', 'data.js'), dataHeader + JSON.stringify(TRAVEL_DATA, null, 2) + dataFooter, 'utf8');
console.log('✅ Successfully updated js/data.js to local asset paths');
