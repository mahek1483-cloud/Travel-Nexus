/**
 * Travel Nexus - Search & Filtering Engine
 * Dynamic rendering & real-time reactive filters for Destinations and Stays
 */

class FilterManager {
  constructor() {
    this.destinations = TRAVEL_DATA.destinations || [];
    this.stays = TRAVEL_DATA.stays || [];

    // State
    this.activeDestCategory = 'all';
    this.destSearchQuery = '';

    this.staySearchQuery = '';
    this.stayMaxPrice = 40000;
    this.stayTypes = [];
    this.stayAmenities = [];
    this.stayCancellationPolicies = [];
    this.stayMinRating = 0;
    this.staySortOrder = 'recommended';

    this.init();
  }

  debounce(func, wait = 120) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  init() {
    this.renderPopularDestinationsHome();
    this.renderExploreIndiaDashboard();
    this.renderFeaturedStaysHome();
    this.renderExperienceBundles();
    this.renderAllDestinations();
    this.renderAllStays();
    this.bindEvents();
  }

  bindEvents() {
    // Destination Category Filter Buttons
    const catButtons = document.querySelectorAll('.filter-cat-btn');
    catButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeDestCategory = btn.getAttribute('data-cat');
        this.filterDestinations();
      });
    });

    // Destination Search Input (debounced for fast UI execution)
    const destSearchInput = document.getElementById('destSearchInput');
    if (destSearchInput) {
      const onDestSearch = this.debounce((val) => {
        this.destSearchQuery = val;
        this.filterDestinations();
      }, 100);
      destSearchInput.addEventListener('input', (e) => {
        onDestSearch(e.target.value.toLowerCase().trim());
      });
    }

    // Stay Price Slider (debounced)
    const stayPriceSlider = document.getElementById('stayPriceSlider');
    const stayPriceValue = document.getElementById('stayPriceValue');
    if (stayPriceSlider && stayPriceValue) {
      const onPriceChange = this.debounce(() => this.applyStayFilters(), 80);
      stayPriceSlider.addEventListener('input', (e) => {
        this.stayMaxPrice = parseInt(e.target.value, 10);
        stayPriceValue.textContent = `₹${this.stayMaxPrice.toLocaleString('en-IN')}`;
        onPriceChange();
      });
    }

    // Stay Type Checkboxes
    const typeCheckboxes = document.querySelectorAll('.stay-type-filter');
    typeCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        this.stayTypes = Array.from(typeCheckboxes)
          .filter(c => c.checked)
          .map(c => c.value);
        this.applyStayFilters();
      });
    });

    // Stay Amenity Checkboxes
    const amenityCheckboxes = document.querySelectorAll('.stay-amenity-filter');
    amenityCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        this.stayAmenities = Array.from(amenityCheckboxes)
          .filter(c => c.checked)
          .map(c => c.value);
        this.applyStayFilters();
      });
    });

    // Stay Cancellation Policy Checkboxes
    const cancelCheckboxes = document.querySelectorAll('.stay-cancel-filter');
    cancelCheckboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        this.stayCancellationPolicies = Array.from(cancelCheckboxes)
          .filter(c => c.checked)
          .map(c => c.value.toLowerCase());
        this.applyStayFilters();
      });
    });

    // Stay Search Input (debounced)
    const staySearchInput = document.getElementById('staySearchInput');
    if (staySearchInput) {
      const onStaySearch = this.debounce((val) => {
        this.staySearchQuery = val;
        this.applyStayFilters();
      }, 100);
      staySearchInput.addEventListener('input', (e) => {
        onStaySearch(e.target.value.toLowerCase().trim());
      });
    }

    // Stay Sort Dropdown
    const staySortSelect = document.getElementById('staySortSelect');
    if (staySortSelect) {
      staySortSelect.addEventListener('change', (e) => {
        this.staySortOrder = e.target.value;
        this.applyStayFilters();
      });
    }

    // Reset Filters Button
    const resetBtn = document.getElementById('resetStayFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetStayFilters());
    }
  }

  /* ==========================================================================
     DESTINATION RENDERING & FILTERING
     ========================================================================== */
  renderPopularDestinationsHome() {
    const container = document.getElementById('popularDestinationsGrid');
    if (!container) return;

    // Show first 6 featured destinations on home page
    const featured = this.destinations.slice(0, 6);
    container.innerHTML = featured.map(dest => this.createDestinationCardHTML(dest)).join('');
  }

  renderExploreIndiaDashboard() {
    const container = document.getElementById('exploreIndiaGrid');
    if (!container) return;

    const regions = [
      {
        id: 'himalayas',
        name: 'Himalayas',
        sub: 'Manali & Leh-Ladakh',
        tagline: 'Snowbound ridges, sacred deodar trails, and celestial high-altitude monasteries.',
        image: 'images/india/himalayas.jpg',
        matcher: d => /himachal|ladakh|manali|leh|spiti/i.test(d.region + ' ' + d.name)
      },
      {
        id: 'rajasthan',
        name: 'Rajasthan Forts',
        sub: 'Jaipur & Udaipur',
        tagline: 'Sunlit royal citadels, lakeside marble palaces, and desert artisan quarters.',
        image: 'images/india/rajasthan.jpg',
        matcher: d => /rajasthan|jaipur|udaipur|jodhpur/i.test(d.region + ' ' + d.name)
      },
      {
        id: 'kerala',
        name: 'Kerala Backwaters',
        sub: 'Munnar & Alleppey',
        tagline: 'Misty tea carpets, serene palm-fringed canoe canals, and Ayurvedic spice groves.',
        image: 'images/india/kerala.jpg',
        matcher: d => /kerala|munnar|kovalam/i.test(d.region + ' ' + d.name)
      },
      {
        id: 'goa',
        name: 'Goa Beaches',
        sub: 'Golden Arabian Shores',
        tagline: 'Swaying coconut shores, pastel Portuguese manors, and fiery coastal curries.',
        image: 'images/india/goa.jpg',
        matcher: d => /goa/i.test(d.region + ' ' + d.name)
      },
      {
        id: 'south',
        name: 'South Indian Temples',
        sub: 'Hampi & Mysuru',
        tagline: 'Granite boulder ruins, illuminated royal palaces, and ancient temple carvings.',
        image: 'images/india/south_temples.jpg',
        matcher: d => /hampi|mysuru|chettinad/i.test(d.region + ' ' + d.name)
      },
      {
        id: 'northeast',
        name: 'Northeast Wonders',
        sub: 'Gangtok & Majuli',
        tagline: 'Organic mountain slopes, sacred glacial waters, and the world’s river island.',
        image: 'images/india/northeast.jpg',
        matcher: d => /sikkim|assam|gangtok|majuli|darjeeling/i.test(d.region + ' ' + d.name)
      }
    ];

    container.innerHTML = regions.map(reg => {
      const count = this.destinations.filter(reg.matcher).length;
      return `
        <article class="dashboardStats-card" onclick="window.filterManager.filterByRegion('${reg.id}')" title="Explore ${reg.name} destinations">
          <div class="dashboardStats-img-box">
            <img src="${reg.image}" alt="${reg.name} regional landscape" loading="lazy" decoding="async" onerror="window.handleImageError && window.handleImageError(this, '${reg.name.replace(/'/g, "\\'")}', '${reg.sub.replace(/'/g, "\\'")}')" />
            <span class="dashboardStats-badge">${count} Destination${count !== 1 ? 's' : ''}</span>
          </div>
          <div class="dashboardStats-body">
            <h3 class="dashboardStats-title">${reg.name}</h3>
            <div class="dashboardStats-sub">${reg.sub}</div>
            <p class="dashboardStats-tagline">${reg.tagline}</p>
            <div class="dashboardStats-footer">
              <span>View Curated Guides</span>
              <span>→</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  filterByRegion(regionId) {
    const regionMap = {
      himalayas: { cat: 'mountains', query: '' },
      rajasthan: { cat: 'heritage', query: 'rajasthan' },
      kerala: { cat: 'all', query: 'kerala' },
      goa: { cat: 'beaches', query: 'goa' },
      south: { cat: 'all', query: 'karnataka' },
      northeast: { cat: 'all', query: 'sikkim' }
    };

    const target = regionMap[regionId] || { cat: 'all', query: '' };
    this.activeDestCategory = target.cat;
    this.destSearchQuery = target.query;

    const catButtons = document.querySelectorAll('.filter-cat-btn');
    catButtons.forEach(btn => {
      if (btn.getAttribute('data-cat') === this.activeDestCategory) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const searchInput = document.getElementById('destSearchInput');
    if (searchInput) {
      searchInput.value = this.destSearchQuery;
    }

    this.filterDestinations();
    window.location.hash = '#destinations';
  }

  renderAllDestinations() {
    this.filterDestinations();
  }

  filterDestinations() {
    const container = document.getElementById('destinationsGalleryGrid');
    if (!container) return;

    const filtered = this.destinations.filter(dest => {
      const matchesCat = this.activeDestCategory === 'all' || dest.category === this.activeDestCategory;
      const matchesSearch = !this.destSearchQuery || 
        dest.name.toLowerCase().includes(this.destSearchQuery) ||
        dest.region.toLowerCase().includes(this.destSearchQuery) ||
        dest.tagline.toLowerCase().includes(this.destSearchQuery);
      return matchesCat && matchesSearch;
    });

    // Reactive sync with interactive India map
    if (window.mapManager && typeof window.mapManager.updateMarkers === 'function') {
      window.mapManager.updateMarkers(filtered);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <p style="font-size: 1.1rem; color: var(--text-dark); margin-bottom: 8px;">No destinations matched your criteria.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Try selecting "All" or using different search keywords.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(dest => this.createDestinationCardHTML(dest)).join('');
  }

  createDestinationCardHTML(dest) {
    const isWishlisted = window.wishlistManager && window.wishlistManager.has(dest.id);
    const chipsHTML = dest.topAttractions
      .slice(0, 3)
      .map(att => `<span class="dest-chip">${att}</span>`)
      .join('');

    return `
      <article class="destination-card" data-dest-id="${dest.id}">
        <div class="dest-img-box" onclick="window.modalManager.openDestinationModal('${dest.id}')">
          <img src="${dest.image}" alt="${dest.alt || dest.name}" loading="lazy" decoding="async" onerror="window.handleImageError && window.handleImageError(this, '${(dest.name || '').replace(/'/g, "\\'")}', '${(dest.region || '').replace(/'/g, "\\'")}')" />
          <div class="dest-price-badge">From <span>${window.formatCurrency ? window.formatCurrency(dest.startingPrice) : '₹' + dest.startingPrice.toLocaleString('en-IN')}</span> /day</div>
          <button class="dest-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                  onclick="event.stopPropagation(); window.wishlistManager.toggle('${dest.id}', 'destination', this)" 
                  aria-label="Save to Wishlist" title="Save to Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="dest-content" onclick="window.modalManager.openDestinationModal('${dest.id}')">
          <div class="dest-header">
            <h3 class="dest-title">${dest.name}</h3>
            <div class="dest-rating">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${dest.rating}</span>
            </div>
          </div>
          <div class="dest-region">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${dest.region}
          </div>
          <p class="dest-tagline">${dest.tagline}</p>
          <div class="dest-attractions-chips">
            ${chipsHTML}
          </div>
          <div class="dest-footer">
            <div class="dest-time">Best: <strong>${dest.bestTime}</strong></div>
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); window.modalManager.openDestinationModal('${dest.id}')">
              Explore Guide
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /* ==========================================================================
     STAYS RENDERING & FILTERING
     ========================================================================== */
  renderFeaturedStaysHome() {
    const container = document.getElementById('featuredStaysHomeGrid');
    if (!container) return;

    // Show 4 diverse boutique stays on the home page
    const featured = this.stays.slice(0, 4);
    container.innerHTML = featured.map(stay => this.createStayCardHTML(stay)).join('');
  }

  renderAllStays() {
    this.applyStayFilters();
  }

  applyStayFilters() {
    const container = document.getElementById('staysListingGrid');
    const countText = document.getElementById('staysCountNumber');
    if (!container) return;

    let filtered = this.stays.filter(stay => {
      const matchesSearch = !this.staySearchQuery ||
        stay.name.toLowerCase().includes(this.staySearchQuery) ||
        stay.location.toLowerCase().includes(this.staySearchQuery) ||
        stay.description.toLowerCase().includes(this.staySearchQuery);

      const matchesPrice = stay.pricePerNight <= this.stayMaxPrice;

      const matchesType = this.stayTypes.length === 0 || this.stayTypes.includes(stay.type);

      const matchesAmenities = this.stayAmenities.length === 0 ||
        this.stayAmenities.every(reqAmenity => 
          stay.amenities.some(a => a.toLowerCase().includes(reqAmenity.toLowerCase()))
        );

      const matchesCancel = this.stayCancellationPolicies.length === 0 ||
        this.stayCancellationPolicies.some(policy => 
          (stay.cancellationPolicy || 'flexible').toLowerCase().includes(policy)
        );

      return matchesSearch && matchesPrice && matchesType && matchesAmenities && matchesCancel;
    });

    // Sorting
    if (this.staySortOrder === 'price-low') {
      filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (this.staySortOrder === 'price-high') {
      filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (this.staySortOrder === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    if (countText) {
      countText.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <p style="font-size: 1.15rem; color: var(--text-dark); margin-bottom: 8px;">No verified stays match your current filters.</p>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 16px;">Try expanding your price range or clearing selected amenities.</p>
          <button class="btn btn-outline btn-sm" onclick="window.filterManager.resetStayFilters()">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(stay => this.createStayCardHTML(stay)).join('');
  }

  resetStayFilters() {
    this.staySearchQuery = '';
    this.stayMaxPrice = 40000;
    this.stayTypes = [];
    this.stayAmenities = [];
    this.stayCancellationPolicies = [];
    this.staySortOrder = 'recommended';

    const searchInput = document.getElementById('staySearchInput');
    if (searchInput) searchInput.value = '';

    const priceSlider = document.getElementById('stayPriceSlider');
    const priceValue = document.getElementById('stayPriceValue');
    if (priceSlider && priceValue) {
      priceSlider.value = 40000;
      priceValue.textContent = '₹40,000';
    }

    document.querySelectorAll('.stay-type-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.stay-amenity-filter').forEach(cb => cb.checked = false);
    document.querySelectorAll('.stay-cancel-filter').forEach(cb => cb.checked = false);

    const sortSelect = document.getElementById('staySortSelect');
    if (sortSelect) sortSelect.value = 'recommended';

    this.applyStayFilters();
  }

  createStayCardHTML(stay) {
    const isWishlisted = window.wishlistManager && window.wishlistManager.has(stay.id);
    const otaPrice = Math.round(stay.pricePerNight * 1.22);
    const savings = otaPrice - stay.pricePerNight;

    const amenitiesHTML = stay.amenities
      .slice(0, 3)
      .map(amenity => `<span class="amenity-pill">${amenity}</span>`)
      .join('');

    return `
      <article class="stay-card" data-stay-id="${stay.id}">
        <div class="stay-img-box">
          <img src="${stay.image}" alt="${stay.alt || stay.name}" loading="lazy" decoding="async" onerror="window.handleImageError && window.handleImageError(this, '${(stay.name || '').replace(/'/g, "\\'")}', '${(stay.location || '').replace(/'/g, "\\'")}')" />
          <span class="stay-badge">${stay.badge}</span>
          <button class="stay-wishlist-btn ${isWishlisted ? 'active' : ''}" 
                  onclick="event.stopPropagation(); window.wishlistManager.toggle('${stay.id}', 'stay', this)" 
                  aria-label="Save stay to Wishlist" title="Save stay to Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="stay-content">
          <div class="stay-header">
            <h3 class="stay-title">${stay.name}</h3>
            <div class="stay-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              <span>${stay.rating}</span>
            </div>
          </div>
          <div class="stay-location">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${stay.location}
          </div>

          <!-- Direct Local Host Price Comparison Badge -->
          <div class="stay-host-saving-tag" style="font-size: 0.73rem; background: #DCFCE7; color: #15803D; font-weight: 700; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; margin: 4px 0 8px;">
            🛡️ Direct Host Rate: Save ₹${savings.toLocaleString('en-IN')}/night vs OTA
          </div>

          <div class="stay-amenities-row">
            ${amenitiesHTML}
          </div>
          <div class="stay-footer">
            <div class="stay-price-box">
              <span class="stay-price">${window.formatCurrency ? window.formatCurrency(stay.pricePerNight) : '₹' + stay.pricePerNight.toLocaleString('en-IN')}</span>
              <span class="stay-price-sub">/ night · 0% markup</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="window.modalManager.openStayBookingModal('${stay.id}')">
              Book Now
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /* ========================================================================
     AUTHENTIC EXPERIENCE BUNDLES (Stay + Dining + Local Guide)
     ======================================================================== */
  renderExperienceBundles() {
    const container = document.getElementById('experienceBundlesContainer');
    if (!container) return;

    const bundles = [
      {
        id: 'bundle-udaipur',
        title: 'The Mewar Royal Heritage Bundle',
        location: 'Udaipur, Rajasthan',
        image: 'images/india/rajasthan.jpg',
        badge: 'Save 18% Bundled',
        description: '3 Nights at Rawla Pichola Heritage Haveli + Royal Mewari Thali Tasting + Private Lake Pichola Boat & City Palace Guide.',
        regularPrice: 24500,
        bundlePrice: 19900,
        inclusions: ['3 Nights Heritage Haveli', 'Royal Mewari Thali Dinner', 'Private Historian Guide', 'Airport / Station Transfer']
      },
      {
        id: 'bundle-manali',
        title: 'High Himalayan Alpine Retreat',
        location: 'Old Manali & Solang, Himachal',
        image: 'images/india/himalayas.jpg',
        badge: 'Save 18% Bundled',
        description: '3 Nights at Cedar Ridge Pahadi Chalet + Authentic Himalayan Trout Tasting + Solang Valley Snow Naturalist Guide.',
        regularPrice: 21000,
        bundlePrice: 17200,
        inclusions: ['3 Nights Timber Chalet', 'Pahadi Dham Tasting', 'Certified Mountain Guide', 'Complimentary Firewood Basket']
      },
      {
        id: 'bundle-kerala',
        title: 'Malabar Backwaters Serenity Escape',
        location: 'Kumarakom, Kerala',
        image: 'images/india/kerala.jpg',
        badge: 'Save 17% Bundled',
        description: '3 Nights at Tharavadu Eco Estate + Banana Leaf Karimeen Feast + Sunrise Canoe Canal Tour with Certified Naturalist.',
        regularPrice: 26000,
        bundlePrice: 21500,
        inclusions: ['3 Nights Backwater Villa', 'Organic Banana Leaf Feast', 'Village Canoe Tour', 'Ayurvedic Herbal Welcome']
      }
    ];

    container.innerHTML = `
      <div class="bundles-wrapper">
        <div class="section-header" style="text-align: left; margin-bottom: 20px;">
          <span class="section-tag">Curated Indian Experience Bundles</span>
          <h2 style="font-family: var(--font-serif); font-size: 1.85rem; margin-bottom: 4px;">Stay + Culinary + Certified Guide</h2>
          <p class="text-muted" style="font-size: 0.95rem;">Handcrafted regional packages saving 15%–20% compared to booking separately.</p>
        </div>

        <div class="bundles-grid">
          ${bundles.map(b => `
            <article class="bundle-card">
              <div class="bundle-img-box">
                <img src="${b.image}" alt="${b.title}" loading="lazy" onerror="window.handleImageError && window.handleImageError(this, '${b.title.replace(/'/g, "\\'")}', '${b.location.replace(/'/g, "\\'")}')" />
                <span class="badge badge-gold bundle-badge">${b.badge}</span>
              </div>
              <div class="bundle-content">
                <span class="bundle-location">📍 ${b.location}</span>
                <h3 class="bundle-title">${b.title}</h3>
                <p class="bundle-desc">${b.description}</p>
                
                <div class="bundle-inclusions">
                  ${b.inclusions.map(inc => `<span class="bundle-inc-pill">✓ ${inc}</span>`).join('')}
                </div>

                <div class="bundle-footer">
                  <div class="bundle-pricing">
                    <del class="bundle-reg-price">₹${b.regularPrice.toLocaleString('en-IN')}</del>
                    <div class="bundle-deal-price">${window.formatCurrency ? window.formatCurrency(b.bundlePrice) : '₹' + b.bundlePrice.toLocaleString('en-IN')} <small>/ bundle</small></div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="window.showToast('🎉 ${b.title} bundle added to your journey!', 'success')">
                    Book Bundle
                  </button>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.filterManager = new FilterManager();
});
