/**
 * Travel Nexus - Modals & Wishlist Management
 * Handles Booking Dialog, Table Reservation, Destination Deep Dive, and Wishlist Drawer
 */

class ModalManager {
  constructor() {
    this.currentStay = null;
    this.currentTheme = null;
    this.init();
  }

  init() {
    // Backdrop click to close modals
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeAllModals();
      }
    });

    // ESC key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
        if (window.wishlistManager) window.wishlistManager.close();
      }
    });
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     1. STAY DETAIL & BOOKING MODAL
     ========================================================================== */
  openStayBookingModal(stayId) {
    const stay = TRAVEL_DATA.stays.find(s => s.id === stayId);
    if (!stay) return;
    this.currentStay = stay;
    this.hasTravelShield = false;

    const modal = document.getElementById('stayBookingModal');
    const container = document.getElementById('stayModalBody');
    if (!modal || !container) return;

    // Default 3 nights calculation
    const defaultNights = 3;
    const subtotal = stay.pricePerNight * defaultNights;
    const taxes = Math.round(subtotal * 0.12);
    const otaRate = Math.round(subtotal * 1.22);
    const otaSavings = otaRate - subtotal;
    const total = subtotal + taxes;
    const cancellation = stay.cancellationPolicy || 'Flexible (100% refund up to 24 hours before check-in)';

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
        <div style="position: relative; height: 100%; min-height: 280px; background: var(--bg-cream-alt);">
          <img src="${stay.image}" alt="${stay.alt}" style="width: 100%; height: 100%; object-fit: cover;" onerror="window.handleImageError && window.handleImageError(this, '${(stay.name || '').replace(/'/g, "\\'")}', '${(stay.location || '').replace(/'/g, "\\'")}')" />
          <span class="badge badge-teal" style="position: absolute; top: 18px; left: 18px;">${stay.badge}</span>
        </div>

        <div style="padding: var(--space-2xl); display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
            <h2 style="font-size: 1.45rem; line-height: 1.2;">${stay.name}</h2>
            <div style="display: flex; align-items: center; gap: 4px; font-weight: 700; color: var(--text-dark); font-size: 0.9rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--accent-gold-dark)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ${stay.rating} <span style="color: var(--text-muted); font-size: 0.8rem;">(${stay.reviewsCount})</span>
            </div>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: var(--space-md); display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${stay.location}
          </div>

          <!-- VERIFIED LOCAL HOST PRICE GUARANTEE -->
          <div class="stay-host-guarantee-card" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: var(--space-md);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #166534;">🛡️ 0% Commission Direct Rate</span>
              <span style="font-size: 0.75rem; background: #DCFCE7; color: #15803D; padding: 2px 6px; border-radius: 4px; font-weight: 700;">Save ₹${otaSavings.toLocaleString('en-IN')}</span>
            </div>
            <div style="font-size: 0.78rem; color: #166534; margin-top: 3px;">
              Direct Host: <strong>₹${subtotal.toLocaleString('en-IN')}</strong> · Commercial OTA: <del style="color: #991B1B;">₹${otaRate.toLocaleString('en-IN')}</del>
            </div>
          </div>

          <p style="font-size: 0.875rem; color: var(--text-body); line-height: 1.5; margin-bottom: var(--space-md);">
            ${stay.description}
          </p>

          <!-- Host Spotlight -->
          <div style="display: flex; align-items: center; gap: 12px; background: var(--bg-cream); padding: 10px 14px; border-radius: var(--radius-sm); margin-bottom: var(--space-md); border: 1px solid var(--border-light);">
            <img src="${stay.host.avatar}" alt="${stay.host.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" />
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-dark);">Hosted by ${stay.host.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${stay.host.role}</div>
            </div>
          </div>

          <!-- Cancellation Policy -->
          <div style="margin-bottom: var(--space-md); font-size: 0.8rem; background: var(--bg-cream-alt); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
            <strong>Cancellation Policy:</strong> <span style="color: var(--secondary-teal); font-weight: 600;">${cancellation}</span>
          </div>

          <!-- Amenities -->
          <div style="margin-bottom: var(--space-lg);">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dark); margin-bottom: 6px;">Included Amenities</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${stay.amenities.map(a => `<span class="amenity-pill">${a}</span>`).join('')}
            </div>
          </div>

          <!-- Location Mini-Map -->
          <div style="margin-bottom: var(--space-lg);">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dark); margin-bottom: 6px;">Interactive Location</div>
            <div id="stayModalMiniMap" style="height: 160px; width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-light); overflow: hidden;"></div>
          </div>

          <!-- REVIEWS SUBCOLLECTION SECTION -->
          <div style="margin-bottom: var(--space-lg); border-top: 1px solid var(--border-light); padding-top: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="font-size: 0.95rem; margin: 0;">Verified Traveler Reviews</h4>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Authentic domestic journeys</span>
            </div>
            <div id="stayReviewsContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
              <span class="text-muted" style="font-size: 0.8rem;">Loading reviews...</span>
            </div>
          </div>

          <!-- Price & Booking Form -->
          <form id="stayBookingForm" onsubmit="window.modalManager.confirmStayBooking(event, '${stay.id}')" style="background: var(--bg-cream); border-radius: var(--radius-md); padding: var(--space-md); border: 1px solid var(--border-light); margin-top: auto;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              <div>
                <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px;">Check-in</label>
                <input type="date" id="bookCheckIn" required value="2026-10-15" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-light); font-size: 0.85rem; background: white;" />
              </div>
              <div>
                <label style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 2px;">Check-out</label>
                <input type="date" id="bookCheckOut" required value="2026-10-18" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-light); font-size: 0.85rem; background: white;" />
              </div>
            </div>

            <!-- TRAVEL INSURANCE PLACEHOLDER CARD -->
            <div class="travel-shield-box" style="background: var(--bg-cream-alt); border: 1px dashed var(--border-light); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 12px;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span style="font-size: 1rem; line-height: 1;">🛡️</span>
                <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    Add travel protection
                    <span style="font-size: 0.65rem; background: var(--bg-surface); color: var(--text-muted); border: 1px solid var(--border-light); padding: 1px 6px; border-radius: 4px; font-weight: 600;">Partner integration coming soon</span>
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.35; margin-top: 2px;">
                    Comprehensive IRDAI-underwritten trip protection & emergency medical evacuation will be integrated soon. All current reservations are safeguarded by direct host guarantee.
                  </div>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; color: var(--text-body);">₹${stay.pricePerNight.toLocaleString('en-IN')} x 3 nights</span>
              <span style="font-weight: 600; color: var(--text-dark);">₹${subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; color: var(--text-body);">Local taxes & eco-fee</span>
              <span style="font-weight: 600; color: var(--text-dark);">₹${taxes.toLocaleString('en-IN')}</span>
            </div>
            <div id="shieldRow" style="display: none; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; color: var(--secondary-teal); font-weight: 600;">Travel Shield Protection</span>
              <span style="font-weight: 600; color: var(--secondary-teal);">₹398</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-top: 1px solid var(--border-light); padding-top: 8px;">
              <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-dark);">Total</span>
              <span style="font-size: 1.35rem; font-weight: 700; color: var(--primary-terracotta);" id="stayModalTotal">₹${total.toLocaleString('en-IN')}</span>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">
              Confirm Instant Reservation
            </button>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Load reviews
    if (window.firebaseService) {
      window.firebaseService.getListingReviews(stay.id).then(reviews => {
        const revContainer = document.getElementById('stayReviewsContainer');
        if (!revContainer) return;
        if (!reviews || reviews.length === 0) {
          revContainer.innerHTML = '<span class="text-muted" style="font-size: 0.8rem;">No reviews yet. Be the first traveler to review!</span>';
          return;
        }

        revContainer.innerHTML = reviews.map(r => `
          <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 0.8rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <strong>${r.author}</strong>
              <span style="color: var(--accent-gold-dark);">★ ${r.rating}</span>
            </div>
            <div style="margin-bottom: 4px;">
              ${r.verifiedTraveler 
                ? '<span style="color: #15803D; font-size: 0.7rem; font-weight: 700;">✓ Verified Traveler</span>'
                : '<span style="color: var(--text-muted); font-size: 0.7rem;">Unverified Review</span>'
              }
              <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 6px;">${r.date || ''}</span>
            </div>
            <p style="margin: 0 0 4px; color: var(--text-dark); line-height: 1.35;">${r.comment}</p>
            ${r.hostResponse ? `
              <div style="background: var(--bg-cream); border-left: 2px solid var(--secondary-teal); padding: 4px 8px; font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                <strong>Host response:</strong> ${r.hostResponse}
              </div>
            ` : ''}
          </div>
        `).join('');
      });
    }

    if (window.mapManager && stay.coordinates) {
      setTimeout(() => {
        window.mapManager.renderMiniMap('stayModalMiniMap', stay.coordinates, stay.name);
      }, 120);
    }
  }

  toggleTravelShield(stayId) {
    this.hasTravelShield = !this.hasTravelShield;
    const shieldRow = document.getElementById('shieldRow');
    const totalEl = document.getElementById('stayModalTotal');
    const stay = this.currentStay;
    if (!stay || !totalEl) return;

    const defaultNights = 3;
    const subtotal = stay.pricePerNight * defaultNights;
    const taxes = Math.round(subtotal * 0.12);
    const shieldCost = this.hasTravelShield ? 398 : 0;
    const newTotal = subtotal + taxes + shieldCost;

    if (shieldRow) shieldRow.style.display = this.hasTravelShield ? 'flex' : 'none';
    totalEl.textContent = `₹${newTotal.toLocaleString('en-IN')}`;
  }

  confirmStayBooking(e, stayId) {
    e.preventDefault();
    const stay = TRAVEL_DATA.stays.find(s => s.id === stayId);
    this.closeAllModals();
    window.showToast(`🎉 Booking confirmed for "${stay.name}"! Confirmation voucher sent to your email.`, 'success');
  }

  /* ==========================================================================
     2. TABLE RESERVATION MODAL
     ========================================================================== */
  openTableReservationModal(themeId) {
    const theme = TRAVEL_DATA.culinaryThemes.find(t => t.id === themeId) || TRAVEL_DATA.culinaryThemes[0];
    this.currentTheme = theme;

    const modal = document.getElementById('tableReservationModal');
    const container = document.getElementById('tableModalBody');
    if (!modal || !container) return;

    container.innerHTML = `
      <div style="padding: var(--space-2xl);">
        <div style="text-align: center; margin-bottom: var(--space-xl);">
          <span class="badge badge-terracotta" style="margin-bottom: 8px;">Culinary Experience</span>
          <h2 style="font-size: 1.6rem; margin-bottom: 6px;">Reserve a Table at ${theme.name}</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${theme.tagline}
          </p>
        </div>

        <form id="tableReservationForm" onsubmit="window.modalManager.confirmTableReservation(event, '${theme.name}')" style="display: flex; flex-direction: column; gap: var(--space-md); max-width: 480px; margin: 0 auto;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div>
              <label class="form-label">Date</label>
              <input type="date" required value="2026-10-16" class="form-input" style="width: 100%;" />
            </div>
            <div>
              <label class="form-label">Seating Time</label>
              <select required class="form-select" style="width: 100%;">
                <option value="6:30 PM">6:30 PM (Sunset Hour)</option>
                <option value="7:30 PM">7:30 PM (Prime Dinner)</option>
                <option value="8:45 PM">8:45 PM (Starlight Seating)</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div>
              <label class="form-label">Party Size</label>
              <select required class="form-select" style="width: 100%;">
                <option value="2">2 Guests (Table for Two)</option>
                <option value="4" selected>4 Guests (Family / Friends)</option>
                <option value="6">6 Guests (Communal Feast)</option>
                <option value="8">8+ Guests (Private Tasting)</option>
              </select>
            </div>
            <div>
              <label class="form-label">Dietary Focus</label>
              <select class="form-select" style="width: 100%;">
                <option value="none">Chef's Regular Menu</option>
                <option value="veg">Pure Vegetarian / Plant-Based</option>
                <option value="gluten-free">Gluten Sensitive</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label">Special Occasion or Notes</label>
            <input type="text" placeholder="Anniversary, quiet garden table, etc." class="form-input" style="width: 100%;" />
          </div>

          <div style="background: var(--bg-cream); padding: 12px; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-muted); border: 1px solid var(--border-light);">
            ✨ <strong>Zero Reservation Fees.</strong> Tables are held for 15 minutes past reservation time. Ingredients are harvested specifically for that evening's dining.
          </div>

          <button type="submit" class="btn btn-primary" style="padding: 14px; margin-top: 8px;">
            Confirm Table Reservation
          </button>
        </form>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  confirmTableReservation(e, themeName) {
    e.preventDefault();
    this.closeAllModals();
    window.showToast(`🍽️ Table reserved at ${themeName}! A warm culinary welcome awaits you.`, 'success');
  }

  /* ==========================================================================
     3. DESTINATION DEEP DIVE MODAL
     ========================================================================== */
  openDestinationModal(destId) {
    const dest = TRAVEL_DATA.destinations.find(d => d.id === destId);
    if (!dest) return;

    const modal = document.getElementById('destinationDetailModal');
    const container = document.getElementById('destModalBody');
    if (!modal || !container) return;

    container.innerHTML = `
      <div>
        <div style="position: relative; height: 320px; overflow: hidden;">
          <img src="${dest.image}" alt="${dest.alt || dest.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="window.handleImageError && window.handleImageError(this, '${(dest.name || '').replace(/'/g, "\\'")}', '${(dest.region || '').replace(/'/g, "\\'")}')" />
          <div style="position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 60%);"></div>
          <div style="position: absolute; bottom: 24px; left: 24px; right: 24px; color: white;">
            <span class="badge badge-gold" style="margin-bottom: 8px; text-transform: uppercase;">${dest.category}</span>
            <h2 style="color: white; font-size: 1.85rem; margin-bottom: 4px;">${dest.name}</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 0.95rem; margin-bottom: 0;">
              ${dest.region} · Best time: <strong>${dest.bestTime}</strong>
              <span id="destModalWeatherPill" style="margin-left: 8px; background: rgba(0,0,0,0.45); padding: 3px 8px; border-radius: 4px; font-size: 0.78rem; border: 1px solid rgba(255,255,255,0.3); display: inline-flex; align-items: center; gap: 4px;">
                🌤️ Live Weather...
              </span>
            </p>
          </div>
        </div>

        <div style="padding: var(--space-2xl);">
          <p style="font-size: 1.05rem; color: var(--text-dark); line-height: 1.6; margin-bottom: var(--space-xl);">
            ${dest.description}
          </p>

          <h3 style="font-size: 1.15rem; margin-bottom: var(--space-md);">Curated Journey Highlights</h3>
          <ul style="display: flex; flex-direction: column; gap: 10px; margin-bottom: var(--space-xl);">
            ${dest.highlights.map(h => `
              <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.925rem; color: var(--text-body);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-terracotta)" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${h}</span>
              </li>
            `).join('')}
          </ul>

          <div style="background: var(--primary-terracotta-subtle); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-xl); display: flex; align-items: center; gap: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-terracotta)" stroke-width="2" style="flex-shrink: 0;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div style="font-size: 0.875rem; color: var(--primary-terracotta-dark);">
              <strong>Local Host Advice:</strong> ${dest.localTip}
            </div>
          </div>

          <!-- Destination Location Mini-Map -->
          <div style="margin-bottom: var(--space-xl);">
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-dark); margin-bottom: 6px;">Geographic Location</div>
            <div id="destModalMiniMap" style="height: 180px; width: 100%; border-radius: var(--radius-sm); border: 1px solid var(--border-light); overflow: hidden;"></div>
          </div>

          <!-- VERIFIED LOCAL HOST COMPARISON (Direct Rates vs OTA) -->
          <div style="margin-bottom: var(--space-xl);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-dark);">
                🛡️ Verified Local Hosts in ${dest.name}
              </div>
              <span style="font-size: 0.72rem; color: var(--secondary-teal); font-weight: 600;">0% OTA Markup Guarantee</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
              ${this.getComparisonHostsHTML(dest)}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-md); border-top: 1px solid var(--border-light); padding-top: var(--space-lg);">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-muted);">Starting from</span>
              <div style="font-size: 1.4rem; font-weight: 700; color: var(--primary-terracotta);">₹${dest.startingPrice.toLocaleString('en-IN')} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">/ day</span></div>
            </div>
            <div class="flex gap-sm">
              <button class="btn btn-outline btn-sm" onclick="window.modalManager.closeAllModals(); window.location.hash='#stays';">
                Find Stays Nearby
              </button>
              <button class="btn btn-primary btn-sm" onclick="window.modalManager.planTripForDestination('${dest.id}')">
                Plan My Itinerary Here
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Fetch live weather from Open-Meteo
    if (dest.coordinates) {
      const [lat, lng] = dest.coordinates;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
        .then(r => r.json())
        .then(data => {
          if (data && data.current_weather) {
            const pill = document.getElementById('destModalWeatherPill');
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            let icon = '☀️';
            if (code >= 1 && code <= 3) icon = '⛅';
            else if (code >= 51 && code <= 67) icon = '🌦️';
            else if (code >= 71) icon = '❄️';
            if (pill) pill.innerHTML = `${icon} <strong>${temp}°C Live</strong>`;
          }
        })
        .catch(() => {});
    }

    if (window.mapManager && dest.coordinates) {
      setTimeout(() => {
        window.mapManager.renderMiniMap('destModalMiniMap', dest.coordinates, dest.name);
      }, 120);
    }
  }

  planTripForDestination(destId) {
    this.closeAllModals();
    window.location.hash = '#planner';
    const destSelect = document.getElementById('plannerDestSelect');
    if (destSelect) {
      destSelect.value = destId;
      if (window.itineraryPlanner) {
        window.itineraryPlanner.selectedDestination = destId;
        window.itineraryPlanner.generateItinerary();
      }
    }
  }

  getComparisonHostsHTML(dest) {
    if (!window.TRAVEL_DATA || !window.TRAVEL_DATA.stays) return '';
    const nameWords = (dest.name || '').toLowerCase().split(' ');
    const regionWords = (dest.region || '').toLowerCase().split(' ');

    let matching = window.TRAVEL_DATA.stays.filter(s => {
      const loc = ((s.location || '') + ' ' + (s.name || '') + ' ' + (s.description || '')).toLowerCase();
      return nameWords.some(w => w.length > 3 && loc.includes(w)) || regionWords.some(w => w.length > 3 && loc.includes(w));
    });

    if (matching.length < 2) {
      matching = window.TRAVEL_DATA.stays.slice(0, 2);
    } else {
      matching = matching.slice(0, 2);
    }

    return matching.map(s => {
      const otaRate = Math.round(s.pricePerNight * 1.22);
      const savings = otaRate - s.pricePerNight;
      const cancellation = s.cancellationPolicy || 'Flexible';
      const formattedPrice = window.formatCurrency ? window.formatCurrency(s.pricePerNight) : `₹${s.pricePerNight.toLocaleString('en-IN')}`;

      return `
        <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
              <img src="${s.image}" alt="${s.name}" style="width: 52px; height: 52px; border-radius: 6px; object-fit: cover; flex-shrink: 0;" />
              <div>
                <h4 style="font-size: 0.88rem; margin: 0 0 2px; color: var(--text-dark);">${s.name}</h4>
                <div style="font-size: 0.72rem; color: var(--text-muted);">Hosted by <strong>${s.host ? s.host.name : 'Verified Host'}</strong> · ★ ${s.rating}</div>
              </div>
            </div>
            <div style="font-size: 0.75rem; background: var(--bg-cream); padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; border: 1px solid var(--border-light);">
              Policy: <strong style="color: var(--secondary-teal);">${cancellation}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-decoration: line-through;">OTA: ₹${otaRate.toLocaleString('en-IN')}</span>
              <span style="font-size: 0.72rem; color: #15803D; font-weight: 700; background: #DCFCE7; padding: 1px 6px; border-radius: 4px;">Save ₹${savings.toLocaleString('en-IN')}</span>
            </div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--primary-terracotta); margin-bottom: 8px;">
              ${formattedPrice} <small style="font-size: 0.72rem; font-weight: 400; color: var(--text-muted);">/ night</small>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" style="width: 100%; font-size: 0.78rem; padding: 6px;" onclick="window.modalManager.closeAllModals(); window.modalManager.openStayBookingModal('${s.id}')">
            Book Direct with Host
          </button>
        </div>
      `;
    }).join('');
  }
}

/* ==========================================================================
   4. WISHLIST / SAVED ITEMS MANAGER
   ========================================================================== */
class WishlistManager {
  constructor() {
    this.storageKey = 'travelnexus_wishlist';
    this.items = this.load();
    this.init();
  }

  init() {
    this.updateBadge();
    const toggleBtn = document.getElementById('wishlistToggleBtn');
    const closeBtn = document.getElementById('closeWishlistDrawerBtn');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleDrawer());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey) || localStorage.getItem('travelnest_wishlist');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {}
    this.updateBadge();

    // Sync with Firebase cloud profile if logged in
    if (window.firebaseService && window.authManager && window.authManager.currentUser) {
      window.firebaseService.updateWishlist(window.authManager.currentUser.uid, this.items).catch(() => {});
    }
  }

  has(id) {
    return this.items.some(item => item.id === id);
  }

  toggle(id, type, btnElement) {
    if (this.has(id)) {
      this.items = this.items.filter(item => item.id !== id);
      if (btnElement) {
        btnElement.classList.remove('active');
        const svg = btnElement.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
      }
      window.showToast("Removed from your Saved Wishlist", "info");
    } else {
      let data = null;
      if (type === 'destination') {
        const dest = TRAVEL_DATA.destinations.find(d => d.id === id);
        if (dest) data = { id: dest.id, type: 'destination', title: dest.name, image: dest.image, subtitle: dest.region, price: `From ₹${dest.startingPrice.toLocaleString('en-IN')}/day` };
      } else if (type === 'stay') {
        const stay = TRAVEL_DATA.stays.find(s => s.id === id);
        if (stay) data = { id: stay.id, type: 'stay', title: stay.name, image: stay.image, subtitle: stay.location, price: `₹${stay.pricePerNight.toLocaleString('en-IN')}/night` };
      }

      if (data) {
        this.items.push(data);
        if (btnElement) {
          btnElement.classList.add('active');
          const svg = btnElement.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'currentColor');
        }
        window.showToast(`❤️ Saved "${data.title}" to Wishlist!`, "success");
      }
    }

    this.save();
    this.renderDrawer();
  }

  updateBadge() {
    const badge = document.getElementById('wishlistCountBadge');
    if (badge) {
      badge.textContent = this.items.length;
    }
  }

  toggleDrawer() {
    const drawer = document.getElementById('wishlistDrawer');
    if (!drawer) return;
    if (drawer.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    const drawer = document.getElementById('wishlistDrawer');
    if (drawer) {
      drawer.classList.add('open');
      this.renderDrawer();
    }
  }

  close() {
    const drawer = document.getElementById('wishlistDrawer');
    if (drawer) drawer.classList.remove('open');
  }

  renderDrawer() {
    const body = document.getElementById('wishlistDrawerBody');
    if (!body) return;

    if (this.items.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--border-light);">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <p style="font-size: 0.95rem; color: var(--text-dark); margin-bottom: 4px;">Your Wishlist is Empty</p>
          <p style="font-size: 0.8rem;">Tap the heart icon on any destination or stay to save it for your journey.</p>
        </div>
      `;
      return;
    }

    body.innerHTML = this.items.map(item => `
      <div class="wishlist-item">
        <img src="${item.image}" alt="${item.title}" />
        <div class="wishlist-item-info">
          <div class="wishlist-item-title">${item.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">${item.subtitle}</div>
          <div class="wishlist-item-price">${item.price}</div>
        </div>
        <button class="wishlist-remove-btn" onclick="window.wishlistManager.toggle('${item.id}', '${item.type}')" title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.modalManager = new ModalManager();
  window.wishlistManager = new WishlistManager();
});
