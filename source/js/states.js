/**
 * Travel Nexus - Indian States & Union Territories Controller
 * Handles:
 *   - #states: All 36 States & UTs Directory
 *   - #states/:slug: Open Heritage scrollytelling hero, live Open-Meteo weather widget,
 *     editorial Best Time to Visit guidance, and Top 10 authentic destinations grid.
 */

class StatesManager {
  constructor() {
    this.states = window.STATES_DATA || [];
    this.weatherCache = new Map();
    this.init();
  }

  init() {
    if ((!this.states || this.states.length === 0) && window.STATES_DATA) {
      this.states = window.STATES_DATA;
    }
  }

  getStateBySlug(slug) {
    if (!this.states || this.states.length === 0) {
      this.states = window.STATES_DATA || [];
    }
    return this.states.find(s => s.slug.toLowerCase() === slug.toLowerCase()) || null;
  }

  getBestTimeToVisit(slug) {
    const seasons = {
      rajasthan: { months: "October to March", tag: "Golden Winter Sunlight", note: "Crisp daytime temperatures (18°C–25°C), cool starry desert nights, and royal festivals like Pushkar & Desert Festival." },
      kerala: { months: "September to March", tag: "Post-Monsoon Backwater Season", note: "Lush tropical canals, calm backwaters, fresh Ayurvedic harvests, and pleasant coastal breezes." },
      karnataka: { months: "October to April", tag: "Cool Plateau & Coastal Bloom", note: "Ideal for Hampi boulder trails, Mysore Dussehra celebrations, and misty Coorg coffee blossom season." },
      "himachal-pradesh": { months: "April to June & Sep to Nov", tag: "High-Altitude Clarity", note: "Spring apple blossoms and crisp golden autumn vistas across Pir Panjal. Snow enthusiasts visit Dec to Feb." },
      goa: { months: "November to March", tag: "Tropical Arabian Shore Season", note: "Calm turquoise surf, gentle sea breezes, vibrant night flea markets, and Portuguese street carnivals." },
      ladakh: { months: "May to September", tag: "High Mountain Pass Season", note: "Rohtang and Khardung La passes are open with crystal blue skies and Buddhist monastery festivals." },
      sikkim: { months: "March to May & Oct to Dec", tag: "Orchid & Kanchenjunga Vistas", note: "Blooming rhododendron forests in spring and crystal-clear Himalayan summit views in autumn." },
      uttarakhand: { months: "March to June & Sep to Nov", tag: "Sacred Valley & Meadow Season", note: "Pleasant trekking temperatures across Valley of Flowers, Rishikesh river rafting, and clear Garhwal peaks." },
      maharashtra: { months: "October to March", tag: "Sahyadri Winter Breeze", note: "Cool weather for Ajanta-Ellora cave expeditions, Konkan beaches, and Western Ghats heritage fort treks." }
    };

    return seasons[slug] || {
      months: "October to March",
      tag: "Ideal Travel Season",
      note: "Pleasant temperate weather across most regional sanctuaries and cultural centers."
    };
  }

  async fetchLiveWeather(lat, lng) {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    if (this.weatherCache.has(key)) {
      return this.weatherCache.get(key);
    }

    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      if (!res.ok) return null;
      const data = await res.json();
      const current = data.current_weather;

      let condition = 'Clear Sky';
      let icon = '☀️';
      const code = current.weathercode;

      if (code >= 1 && code <= 3) { condition = 'Partly Cloudy'; icon = '⛅'; }
      else if (code === 45 || code === 48) { condition = 'Misty / Foggy'; icon = '🌫️'; }
      else if (code >= 51 && code <= 67) { condition = 'Gentle Rain'; icon = '🌦️'; }
      else if (code >= 71 && code <= 77) { condition = 'Alpine Snow'; icon = '❄️'; }
      else if (code >= 80 && code <= 82) { condition = 'Rain Showers'; icon = '🌧️'; }
      else if (code >= 95) { condition = 'Thunderstorm'; icon = '⛈️'; }

      const result = {
        temperature: Math.round(current.temperature),
        windspeed: Math.round(current.windspeed),
        condition,
        icon
      };

      this.weatherCache.set(key, result);
      return result;
    } catch (e) {
      return null;
    }
  }

  renderDirectory() {
    const container = document.getElementById('view-states');
    if (!container) return;

    if (!this.states || this.states.length === 0) {
      this.states = window.STATES_DATA || [];
    }

    const totalCount = this.states.length;

    container.innerHTML = `
      <div class="states-directory-page">
        <!-- DIRECTORY HERO -->
        <header class="states-dir-hero">
          <div class="container">
            <span class="states-dir-kicker">Incredible India Curated Directory</span>
            <h1 class="states-dir-title">Explore Every Corner of India</h1>
            <p class="states-dir-sub">
              From the high-altitude Buddhist passes of the Himalayas to the golden desert citadels of Marwar and the lush tropical backwaters of Malabar.
            </p>
            <div class="states-dir-badge-pill">
              <span class="badge-pulsing-dot"></span>
              <strong>${totalCount} States & Union Territories</strong> Modeled & Curated
            </div>
          </div>
        </header>

        <div class="container section">
          <!-- FLAGSHIP FEATURED SECTION -->
          <div class="states-section-heading">
            <span class="section-kicker">Interactive Deep-Dives</span>
            <h2>Flagship Heritage Experiences</h2>
            <p class="text-muted">Comprehensive Open Heritage scrollytelling, live weather, and authentic top 10 verified destinations.</p>
          </div>

          <div class="states-flagship-grid">
            ${this.states.filter(s => s.places && s.places.length > 0).map(state => `
              <article class="state-card flagship-card" onclick="window.location.hash='#states/${state.slug}'">
                <div class="state-card-img-box">
                  <img src="${state.bannerImage}" alt="${state.name} landscape" loading="lazy" onerror="window.handleImageError && window.handleImageError(this, '${state.name.replace(/'/g, "\\'")}', 'State Guide')" />
                  <span class="state-card-pill flagship-pill">Top 10 Curated Places</span>
                  <div class="state-card-overlay">
                    <span class="state-card-capital">Capital: ${state.capital}</span>
                  </div>
                </div>
                <div class="state-card-body">
                  <h3 class="state-card-name">${state.name}</h3>
                  <p class="state-card-desc">${state.description}</p>
                  <div class="state-card-footer">
                    <span class="state-places-count">${state.places.length} Top Places</span>
                    <span class="state-card-link">Explore Guide →</span>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>

          <!-- ALL 36 STATES & UNION TERRITORIES DIRECTORY -->
          <div class="states-section-heading" style="margin-top: 60px;">
            <span class="section-kicker">National Atlas</span>
            <h2>All ${totalCount} States & Union Territories</h2>
            <p class="text-muted">Browse every region of the Indian Republic.</p>
          </div>

          <div class="states-all-grid">
            ${this.states.map(item => {
              const isFlagship = item.places && item.places.length > 0;
              return `
                <div class="state-compact-card ${isFlagship ? 'is-flagship' : 'is-coming-soon'}" 
                     onclick="${isFlagship ? `window.location.hash='#states/${item.slug}'` : `window.showToast('Curated guide for ${item.name} is in editorial preparation.', 'info')`}">
                  <div class="state-compact-header">
                    <h4>${item.name}</h4>
                    <span class="state-type-tag">${item.type === 'Union Territory' ? 'UT' : 'State'}</span>
                  </div>
                  <div class="state-compact-capital">Capital: ${item.capital}</div>
                  <p class="state-compact-desc">${item.description.slice(0, 100)}...</p>
                  <div class="state-compact-footer">
                    ${isFlagship 
                      ? `<span class="text-primary font-semibold">Explore 10 Places →</span>` 
                      : `<span class="text-muted" style="font-size: 0.8rem;">Coming Soon</span>`
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  async renderStateDetail(slug) {
    const container = document.getElementById('view-state-detail');
    if (!container) return;

    const state = this.getStateBySlug(slug);
    if (!state) {
      container.innerHTML = `
        <div class="container section" style="text-align: center; margin: 60px auto;">
          <h2>State Not Found</h2>
          <p class="text-muted" style="margin: 14px 0 24px;">We could not locate the regional guide for "${slug}".</p>
          <a href="#states" class="btn btn-primary">Return to States Directory</a>
        </div>
      `;
      return;
    }

    const iconic = state.iconicSite || {
      name: `${state.name} Architectural Heritage`,
      image: state.bannerImage,
      description: state.description,
      period: "Timeless",
      location: state.capital
    };

    const places = state.places || [];
    const bestSeason = this.getBestTimeToVisit(slug);

    // Get coordinates for weather
    const coords = (places[0] && places[0].coordinates) ? places[0].coordinates : [20.5937, 78.9629];

    // Render cards
    let placesCardsHTML = '';
    if (window.filterManager && typeof window.filterManager.createDestinationCardHTML === 'function') {
      placesCardsHTML = places.map(place => window.filterManager.createDestinationCardHTML(place)).join('');
    } else {
      placesCardsHTML = places.map(place => `
        <article class="destination-card" data-dest-id="${place.id}">
          <div class="dest-img-box" onclick="window.modalManager.openDestinationModal('${place.id}')">
            <img src="${place.image}" alt="${place.alt || place.name}" loading="lazy" onerror="window.handleImageError && window.handleImageError(this, '${place.name.replace(/'/g, "\\'")}', '${(place.region || state.name).replace(/'/g, "\\'")}')" />
            <div class="dest-price-badge">From <span>₹${(place.startingPrice || 0).toLocaleString('en-IN')}</span> /day</div>
          </div>
          <div class="dest-content">
            <div class="dest-header">
              <h3 class="dest-title">${place.name}</h3>
              <div class="dest-rating">★ <span>${place.rating || '4.9'}</span></div>
            </div>
            <div class="dest-region">${place.region}</div>
            <p class="dest-tagline">${place.tagline}</p>
            <div class="dest-footer">
              <button class="btn btn-outline btn-sm" onclick="window.modalManager.openDestinationModal('${place.id}')">Explore Guide</button>
            </div>
          </div>
        </article>
      `).join('');
    }

    container.innerHTML = `
      <div class="state-detail-page">
        <!-- BREADCRUMB -->
        <div class="state-breadcrumb-bar">
          <div class="container">
            <a href="#states">States Directory</a>
            <span>/</span>
            <span class="state-breadcrumb-current">${state.name}</span>
          </div>
        </div>

        <!-- OPEN HERITAGE SCROLLYTELLING HERO -->
        <section class="state-heritage-hero" style="background-image: url('${iconic.image}');">
          <div class="state-hero-overlay"></div>
          <div class="container state-hero-content">
            <div class="state-heritage-badge">
              <span>🏛️ OPEN HERITAGE SPOTLIGHT</span>
              <span class="state-heritage-period">${iconic.period || 'Historic Heritage'}</span>
            </div>
            <h1 class="state-hero-title">${state.name}</h1>
            <p class="state-hero-lead">${state.description}</p>

            <!-- LIVE WEATHER & EDITORIAL SEASON WIDGET -->
            <div class="state-weather-banner" id="stateWeatherBanner">
              <div class="weather-current-col">
                <span class="weather-label">Live Regional Climate (Open-Meteo)</span>
                <div class="weather-reading">
                  <span class="weather-icon" id="stateWeatherIcon">🌤️</span>
                  <strong class="weather-temp" id="stateWeatherTemp">--°C</strong>
                  <span class="weather-cond" id="stateWeatherCond">Fetching live satellite...</span>
                </div>
              </div>
              <div class="weather-season-col">
                <span class="weather-label">Editorial Best Time to Visit</span>
                <div class="weather-season-val">
                  <strong>🗓️ ${bestSeason.months}</strong>
                  <span class="weather-season-tag">${bestSeason.tag}</span>
                </div>
                <p class="weather-season-note">${bestSeason.note}</p>
              </div>
            </div>
            
            <!-- ICONIC MONUMENT CARD -->
            <div class="state-iconic-card">
              <div class="state-iconic-header">
                <h3>${iconic.name}</h3>
                <span class="state-iconic-loc">📍 ${iconic.location || state.capital}</span>
              </div>
              <p class="state-iconic-desc">${iconic.description}</p>
            </div>

            <div class="state-scroll-cue" onclick="document.getElementById('stateTopPlacesGrid').scrollIntoView({ behavior: 'smooth' })">
              <span>Scroll to Top 10 Curated Places</span>
              <div class="scroll-arrow-bounce">↓</div>
            </div>
          </div>
        </section>

        <!-- TOP 10 PLACES SECTION -->
        <section class="container section" id="stateTopPlacesSection" style="padding-top: 40px;">
          <div class="state-places-header">
            <div>
              <span class="section-kicker">Curated Top 10</span>
              <h2 class="state-places-title">The Top 10 Authentic Places in ${state.name}</h2>
              <p class="text-muted">Every destination has been field-verified for architectural significance, natural beauty, and local character.</p>
            </div>
            <div class="state-places-badge">
              <span>${places.length} Flagship Places</span>
            </div>
          </div>

          <div class="destinations-grid" id="stateTopPlacesGrid">
            ${placesCardsHTML}
          </div>

          <div class="state-back-cta">
            <a href="#states" class="btn btn-outline">← Back to All States & Territories</a>
            <a href="#destinations" class="btn btn-primary">Explore Interactive India Map →</a>
          </div>
        </section>
      </div>
    `;

    // Fetch and populate live weather asynchronously
    this.fetchLiveWeather(coords[0], coords[1]).then(weather => {
      if (!weather) return;
      const iconEl = document.getElementById('stateWeatherIcon');
      const tempEl = document.getElementById('stateWeatherTemp');
      const condEl = document.getElementById('stateWeatherCond');

      if (iconEl) iconEl.textContent = weather.icon;
      if (tempEl) tempEl.textContent = `${weather.temperature}°C`;
      if (condEl) condEl.textContent = `${weather.condition} · Wind ${weather.windspeed} km/h`;
    });
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.StatesManager = StatesManager;
  window.statesManager = new StatesManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StatesManager };
}
