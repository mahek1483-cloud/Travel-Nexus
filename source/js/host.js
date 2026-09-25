/**
 * Travel Nexus - Host Onboarding & Listing Creator Wizard
 * 4-Step Interactive Wizard:
 *   Step 1: Listing Details & Category (Boutique Stay, Artisan Dining, Local Guide)
 *   Step 2: Pricing, Cancellation Policy & Location with Geolocation and Reverse Geocoding
 *   Step 3: Photos & Offerings (Min 2 photos, dining dishes or guide credentials)
 *   Step 4: Review Summary & Submit for Moderation
 */

class HostManager {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.uploadedFiles = [];
    this.selectedCoords = [15.3350, 76.4600]; // Default Hampi, Karnataka
    this.pinMap = null;
    this.pinMarker = null;
    this.reverseGeocodeTimeout = null;
    this.specialtyDishes = [];
    this.guideLanguages = ['English', 'Hindi'];
    this.init();
  }

  init() {
    // Event delegation for form submission
    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'createListingForm') {
        e.preventDefault();
        await this.handleFormSubmit(e.target);
      }
    });
  }

  render() {
    const container = document.getElementById('view-become-host');
    if (!container) return;

    // Reset step
    this.currentStep = 1;
    const currentUser = window.authManager ? window.authManager.currentUser : null;

    container.innerHTML = `
      <div class="host-page-wrapper">
        <header class="host-hero-header">
          <span class="host-hero-kicker">Host with Travel Nexus · 0% Commission</span>
          <h1 class="host-hero-title">Share Your Indian Sanctuary with the World</h1>
          <p class="host-hero-sub">List your boutique heritage haveli, eco-chalet, houseboat, regional artisan table, or certified local guide experience. Every listing is reviewed by our curation team within 24 hours.</p>
        </header>

        <div class="container host-container" style="max-width: 900px; margin-bottom: 80px;">
          ${!currentUser ? `
            <div class="host-auth-notice">
              <div class="host-auth-icon">🔐</div>
              <div class="host-auth-content">
                <h3>Sign in Required to Submit a Listing</h3>
                <p>You can sign in with an existing account, create a boutique host profile, or use our 1-click Host Demo to explore the submission flow.</p>
                <div class="host-auth-actions">
                  <a href="#login" class="btn btn-primary btn-sm">Sign In / Register</a>
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.authManager.demoLogin('host')">
                    🏡 1-Click Host Demo
                  </button>
                </div>
              </div>
            </div>
          ` : ''}

          <form id="createListingForm" class="host-form-card" novalidate>
            <!-- WIZARD STEPPER HEADER -->
            <div class="wizard-stepper" id="hostWizardStepper">
              <div class="wizard-step-item active" data-step="1" onclick="window.hostManager.goToStep(1)">
                <div class="step-num">1</div>
                <div class="step-label">Listing Details</div>
              </div>
              <div class="wizard-step-divider"></div>
              <div class="wizard-step-item" data-step="2" onclick="window.hostManager.goToStep(2)">
                <div class="step-num">2</div>
                <div class="step-label">Pricing & Location</div>
              </div>
              <div class="wizard-step-divider"></div>
              <div class="wizard-step-item" data-step="3" onclick="window.hostManager.goToStep(3)">
                <div class="step-num">3</div>
                <div class="step-label">Photos & Offerings</div>
              </div>
              <div class="wizard-step-divider"></div>
              <div class="wizard-step-item" data-step="4" onclick="window.hostManager.goToStep(4)">
                <div class="step-num">4</div>
                <div class="step-label">Review & Submit</div>
              </div>
            </div>

            <!-- STEP 1: BASIC INFORMATION & DETAILS -->
            <div class="wizard-step-panel active" id="wizardStep1">
              <h2 class="host-form-section-title">Step 1: Listing Details & Story</h2>
              
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="listingTitle">Listing Title *</label>
                  <input type="text" id="listingTitle" name="title" class="form-control" required 
                         placeholder="e.g. The Malabar Teak Heritage Villa" />
                  <span class="field-error" id="err-listingTitle"></span>
                </div>
                <div class="form-group" style="width: 220px;">
                  <label class="form-label" for="listingTypeSelect">Listing Type *</label>
                  <select name="type" id="listingTypeSelect" class="form-control" onchange="window.hostManager.handleTypeChange(this.value)">
                    <option value="stay">Boutique Stay</option>
                    <option value="dining">Artisan Dining</option>
                    <option value="guide">Local Guide Experience</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="listingCategory">Category *</label>
                  <select name="category" id="listingCategory" class="form-control">
                    <option value="Heritage Haveli">Heritage Haveli / Royal Manor</option>
                    <option value="Mountain Chalet">Mountain Chalet / Pahadi Cottage</option>
                    <option value="Backwater Retreat">Backwater Retreat / Houseboat</option>
                    <option value="Eco Glamp">Eco Glamp / Starlight Camp</option>
                    <option value="Plantation Estate">Plantation Estate / Homestay</option>
                    <option value="Coastal Villa">Coastal Villa / Cliff Sanctuary</option>
                    <option value="Artisan Dining">Regional Artisan Table</option>
                    <option value="Heritage Walk">Heritage & Monument Guide</option>
                    <option value="Culinary Trail">Local Culinary Trail Master</option>
                    <option value="Wildlife Safari">Wildlife & Eco Naturalist</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="listingState">Indian State / UT *</label>
                  <select name="state" id="listingState" class="form-control" required>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Goa">Goa</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Jammu & Kashmir">Jammu & Kashmir</option>
                    <option value="Assam">Assam</option>
                    <option value="Other">Other State / UT</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="listingTagline">Short Tagline *</label>
                <input type="text" id="listingTagline" name="tagline" class="form-control" required 
                       placeholder="e.g. 150-year-old restored Syrian Christian manor amidst organic spice gardens" />
                <span class="field-error" id="err-listingTagline"></span>
              </div>

              <div class="form-group">
                <label class="form-label" for="listingDescription">Detailed Story & Experience *</label>
                <textarea id="listingDescription" name="description" rows="4" class="form-control" required
                          placeholder="Tell travelers what makes this space unique, the architectural history, the local experience, and the host background..."></textarea>
                <span class="field-error" id="err-listingDescription"></span>
              </div>

              <!-- AMENITIES & FEATURES -->
              <div class="form-group">
                <label class="form-label">Key Amenities & Inclusions</label>
                <div class="host-amenities-selector">
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="High-Speed Wi-Fi" checked /> <span>Wi-Fi</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Heritage Architecture" checked /> <span>Heritage Architecture</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Organic Farm Meals" /> <span>Organic Farm Meals</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Certified Guide" /> <span>Certified Local Guide</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Mountain / River View" /> <span>Scenic Views</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Pet Friendly" /> <span>Pet Friendly</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Solar & Eco Energy" /> <span>Solar & Eco Energy</span></label>
                  <label class="amenity-checkbox"><input type="checkbox" name="amenity" value="Airport Transfer" /> <span>Station / Airport Transfer</span></label>
                </div>
              </div>

              <div class="wizard-nav-row">
                <div></div>
                <button type="button" class="btn btn-primary btn-next-step" onclick="window.hostManager.nextStep()">
                  Continue to Pricing & Location →
                </button>
              </div>
            </div>

            <!-- STEP 2: PRICING, CANCELLATION & LOCATION -->
            <div class="wizard-step-panel" id="wizardStep2">
              <h2 class="host-form-section-title">Step 2: Pricing, Cancellation Policy & Location</h2>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" id="priceLabel" for="listingPrice">Price per Night (₹ INR) *</label>
                  <input type="number" id="listingPrice" name="price" class="form-control" required min="300" step="50" 
                         placeholder="e.g. 4500" />
                  <span class="field-error" id="err-listingPrice"></span>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="listingCancellation">Cancellation Policy *</label>
                  <select name="cancellation" id="listingCancellation" class="form-control">
                    <option value="Flexible">Flexible — 100% refund up to 24 hours before check-in</option>
                    <option value="Moderate">Moderate — 100% refund up to 5 days before check-in</option>
                    <option value="Strict">Strict — 50% refund up to 7 days before check-in</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label class="form-label" for="listingLocation" style="margin-bottom: 0;">Location / Street Address *</label>
                  <button type="button" class="btn btn-sm btn-outline btn-locate-me" onclick="window.hostManager.useMyLocation()">
                    📍 Use My Current Location
                  </button>
                </div>
                <input type="text" id="listingLocation" name="location" class="form-control" required 
                       placeholder="e.g. Kumarakom, Kottayam, Kerala" />
                <span class="field-error" id="err-listingLocation"></span>
                <small class="form-hint">Address auto-updates in real-time when you move the map pin below.</small>
              </div>

              <!-- ENLARGED INTERACTIVE MAP (360px) -->
              <div class="form-group">
                <label class="form-label">Geographic Pin (Click or Drag Marker to Refine)</label>
                <div class="host-map-coords-bar">
                  <span>Pin Coordinates:</span>
                  <strong id="displayCoords">15.3350° N, 76.4600° E</strong>
                  <span id="reverseGeocodeStatus" style="margin-left: auto; font-size: 0.75rem; color: var(--secondary-teal);"></span>
                </div>
                <div id="hostPinMap" class="host-pin-map-container" style="height: 360px;"></div>
              </div>

              <div class="wizard-nav-row">
                <button type="button" class="btn btn-outline" onclick="window.hostManager.prevStep()">
                  ← Back to Details
                </button>
                <button type="button" class="btn btn-primary btn-next-step" onclick="window.hostManager.nextStep()">
                  Continue to Photos & Offerings →
                </button>
              </div>
            </div>

            <!-- STEP 3: PHOTOS & MEDIA -->
            <div class="wizard-step-panel" id="wizardStep3">
              <h2 class="host-form-section-title">Step 3: Authentic Photos & Offerings</h2>

              <p class="form-hint">Upload at least 2 high-resolution photos of your property, landscape, dining, or guiding experiences (Max 5MB each).</p>

              <div class="host-upload-zone" onclick="document.getElementById('listingPhotosInput').click()">
                <input type="file" id="listingPhotosInput" multiple accept="image/*" style="display: none;" 
                       onchange="window.hostManager.handlePhotoSelection(this.files)" />
                <div class="upload-zone-icon">📷</div>
                <div class="upload-zone-text">
                  <strong>Click to choose photos</strong> or drag and drop images here
                </div>
                <span class="upload-zone-sub">PNG, JPG, WEBP up to 5MB each (Min. 2 photos required)</span>
              </div>
              <span class="field-error" id="err-listingPhotos" style="display: block; margin-top: 6px;"></span>

              <!-- PHOTO PREVIEW THUMBNAILS -->
              <div id="photoPreviewsGrid" class="host-photo-previews-grid"></div>

              <!-- DYNAMIC: DINING SPECIALTY DISHES BUILDER -->
              <div id="diningDishesSection" style="display: none; margin-top: 32px; padding-top: 20px; border-top: 1px dashed var(--border-light);">
                <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Signature Culinary Offerings</h3>
                <p class="form-hint" style="margin-bottom: 12px;">Add dishes prepared with heirloom regional ingredients.</p>
                <div id="specialtyDishesList" class="specialty-dishes-builder-list"></div>
                <button type="button" class="btn btn-outline btn-sm" onclick="window.hostManager.addDishPrompt()">
                  + Add Specialty Dish
                </button>
              </div>

              <!-- DYNAMIC: LOCAL GUIDE CREDENTIALS -->
              <div id="guideCredentialsSection" style="display: none; margin-top: 32px; padding-top: 20px; border-top: 1px dashed var(--border-light);">
                <h3 style="font-size: 1.15rem; margin-bottom: 6px;">Certified Guide Credentials</h3>
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label class="form-label" for="guideRegNumber">Tourism Dept / Ministry License No.</label>
                    <input type="text" id="guideRegNumber" name="guideRegNumber" class="form-control" placeholder="e.g. IN-MOT-2024-8831" />
                  </div>
                  <div class="form-group flex-1">
                    <label class="form-label" for="guideLanguages">Languages Spoken (comma separated)</label>
                    <input type="text" id="guideLanguages" name="guideLanguages" class="form-control" value="English, Hindi" placeholder="e.g. English, Hindi, French" />
                  </div>
                </div>
              </div>

              <div class="wizard-nav-row">
                <button type="button" class="btn btn-outline" onclick="window.hostManager.prevStep()">
                  ← Back to Pricing & Location
                </button>
                <button type="button" class="btn btn-primary btn-next-step" onclick="window.hostManager.nextStep()">
                  Review Summary & Submit →
                </button>
              </div>
            </div>

            <!-- STEP 4: REVIEW & SUBMIT -->
            <div class="wizard-step-panel" id="wizardStep4">
              <h2 class="host-form-section-title">Step 4: Review Listing Summary & Confirm</h2>
              
              <div id="hostReviewSummaryCard" class="host-review-summary-card">
                <!-- Dynamically populated by generateReviewSummary() -->
              </div>

              <div class="host-terms-card" style="margin-top: 24px;">
                <label class="host-terms-label">
                  <input type="checkbox" id="hostTermsCheck" required />
                  <span>
                    I affirm that this property/service is authentic to domestic Indian heritage, complies with local safety standards, and I accept the Travel Nexus <strong>0% Commission Community Charter</strong>.
                  </span>
                </label>
                <span class="field-error" id="err-hostTermsCheck"></span>
              </div>

              <!-- PROGRESS BAR -->
              <div id="uploadProgressWrapper" class="host-progress-wrapper" style="display: none;">
                <div class="host-progress-label">
                  <span id="uploadProgressText">Publishing listing...</span>
                  <span id="uploadProgressPercent">0%</span>
                </div>
                <div class="host-progress-track">
                  <div id="uploadProgressBar" class="host-progress-bar" style="width: 0%;"></div>
                </div>
              </div>

              <div id="hostFormError" class="auth-form-error" role="alert" style="margin-top: 20px;"></div>

              <div class="wizard-nav-row">
                <button type="button" class="btn btn-outline" onclick="window.hostManager.prevStep()">
                  ← Back to Photos
                </button>
                <button type="submit" class="btn btn-primary btn-lg" id="submitListingBtn">
                  🚀 Submit Listing for Moderation
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    // Initialize Map and default dishes
    setTimeout(() => {
      this.initPinMap();
      this.initDishes();
      this.updateStepUI();
    }, 150);
  }

  goToStep(step) {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.updateStepUI();
    } else if (step > this.currentStep) {
      if (this.validateCurrentStep()) {
        this.currentStep = step;
        this.updateStepUI();
      }
    }
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateStepUI();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepUI();
    }
  }

  updateStepUI() {
    // Stepper header
    const stepItems = document.querySelectorAll('.wizard-step-item');
    stepItems.forEach(item => {
      const step = parseInt(item.getAttribute('data-step'), 10);
      item.classList.remove('active', 'completed');
      if (step === this.currentStep) {
        item.classList.add('active');
      } else if (step < this.currentStep) {
        item.classList.add('completed');
      }
    });

    // Panels
    for (let s = 1; s <= this.totalSteps; s++) {
      const panel = document.getElementById(`wizardStep${s}`);
      if (panel) {
        panel.classList.toggle('active', s === this.currentStep);
      }
    }

    // Invalidate map size on step 2
    if (this.currentStep === 2 && this.pinMap) {
      setTimeout(() => {
        this.pinMap.invalidateSize();
      }, 100);
    }

    // Generate summary on step 4
    if (this.currentStep === 4) {
      this.generateReviewSummary();
    }

    // Scroll to form top
    const formCard = document.querySelector('.host-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  validateCurrentStep() {
    this.clearErrors();
    let isValid = true;

    if (this.currentStep === 1) {
      const title = document.getElementById('listingTitle')?.value.trim();
      const tagline = document.getElementById('listingTagline')?.value.trim();
      const desc = document.getElementById('listingDescription')?.value.trim();

      if (!title) {
        this.showFieldError('listingTitle', 'Please enter an authentic listing title');
        isValid = false;
      }
      if (!tagline) {
        this.showFieldError('listingTagline', 'Please enter a short descriptive tagline');
        isValid = false;
      }
      if (!desc || desc.length < 20) {
        this.showFieldError('listingDescription', 'Please provide a detailed story (at least 20 characters)');
        isValid = false;
      }
    } else if (this.currentStep === 2) {
      const price = parseInt(document.getElementById('listingPrice')?.value, 10);
      const loc = document.getElementById('listingLocation')?.value.trim();

      if (isNaN(price) || price < 300) {
        this.showFieldError('listingPrice', 'Please enter a valid price of at least ₹300');
        isValid = false;
      }
      if (!loc) {
        this.showFieldError('listingLocation', 'Please specify the location or address');
        isValid = false;
      }
    } else if (this.currentStep === 3) {
      if (this.uploadedFiles.length < 2) {
        const errPhotos = document.getElementById('err-listingPhotos');
        if (errPhotos) errPhotos.textContent = 'Please upload at least 2 authentic photos before proceeding.';
        window.showToast('Please upload at least 2 photos.', 'error');
        isValid = false;
      }
    }

    return isValid;
  }

  showFieldError(fieldId, msg) {
    const el = document.getElementById(`err-${fieldId}`);
    if (el) el.textContent = msg;
    const input = document.getElementById(fieldId);
    if (input) input.classList.add('is-invalid');
  }

  clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-control.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  }

  handleTypeChange(type) {
    const dishesSec = document.getElementById('diningDishesSection');
    const guideSec = document.getElementById('guideCredentialsSection');
    const priceLabel = document.getElementById('priceLabel');

    if (dishesSec) dishesSec.style.display = (type === 'dining') ? 'block' : 'none';
    if (guideSec) guideSec.style.display = (type === 'guide') ? 'block' : 'none';

    if (priceLabel) {
      if (type === 'dining') priceLabel.textContent = 'Price per Dining Seat (₹ INR) *';
      else if (type === 'guide') priceLabel.textContent = 'Price per Tour / Day (₹ INR) *';
      else priceLabel.textContent = 'Price per Night (₹ INR) *';
    }
  }

  /* ========================================================================
     MAP, GEOLOCATION & NOMINATIM REVERSE GEOCODING
     ======================================================================== */
  initPinMap() {
    const container = document.getElementById('hostPinMap');
    if (!container || typeof L === 'undefined') return;

    if (this.pinMap) {
      try { this.pinMap.remove(); } catch (e) {}
    }

    this.pinMap = L.map('hostPinMap', {
      center: this.selectedCoords,
      zoom: 6,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | Travel Nexus'
    }).addTo(this.pinMap);

    const pinIcon = window.mapManager ? window.mapManager.createTerracottaIcon(true) : undefined;
    this.pinMarker = L.marker(this.selectedCoords, {
      draggable: true,
      icon: pinIcon
    }).addTo(this.pinMap);

    this.pinMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      this.updateCoords(pos.lat, pos.lng, true);
    });

    this.pinMap.on('click', (e) => {
      this.pinMarker.setLatLng(e.latlng);
      this.updateCoords(e.latlng.lat, e.latlng.lng, true);
    });
  }

  updateCoords(lat, lng, triggerReverseGeocode = false) {
    this.selectedCoords = [Number(lat.toFixed(4)), Number(lng.toFixed(4))];
    const displayEl = document.getElementById('displayCoords');
    if (displayEl) {
      displayEl.textContent = `${this.selectedCoords[0]}° N, ${this.selectedCoords[1]}° E`;
    }

    if (triggerReverseGeocode) {
      this.debouncedReverseGeocode(lat, lng);
    }
  }

  debouncedReverseGeocode(lat, lng) {
    if (this.reverseGeocodeTimeout) {
      clearTimeout(this.reverseGeocodeTimeout);
    }
    const statusEl = document.getElementById('reverseGeocodeStatus');
    if (statusEl) statusEl.textContent = 'Looking up address...';

    this.reverseGeocodeTimeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Geocoding response not ok');
        const data = await res.json();

        if (data && data.address) {
          const addr = data.address;
          const parts = [
            addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district,
            addr.city || addr.town || addr.county,
            addr.state,
            'India'
          ].filter(Boolean);

          const resolved = parts.join(', ');
          const locInput = document.getElementById('listingLocation');
          if (locInput && resolved) {
            locInput.value = resolved;
          }
          if (statusEl) statusEl.textContent = '✓ Address updated';
          setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = '';
      }
    }, 450);
  }

  useMyLocation() {
    if (!navigator.geolocation) {
      window.showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    const btn = document.querySelector('.btn-locate-me');
    if (btn) btn.textContent = 'Locating...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.pinMap && this.pinMarker) {
          this.pinMap.setView([lat, lng], 13);
          this.pinMarker.setLatLng([lat, lng]);
          this.updateCoords(lat, lng, true);
        }
        if (btn) btn.textContent = '📍 Pin Updated to Location';
        window.showToast('Map pin moved to your location!', 'success');
        setTimeout(() => { if (btn) btn.textContent = '📍 Use My Current Location'; }, 3000);
      },
      (err) => {
        if (btn) btn.textContent = '📍 Use My Current Location';
        window.showToast('Could not retrieve current location. Please place pin on map.', 'info');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  /* ========================================================================
     PHOTOS & DISHES
     ======================================================================== */
  handlePhotoSelection(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        window.showToast(`File "${file.name}" exceeds 5MB limit.`, 'error');
        return;
      }
      this.uploadedFiles.push(file);
    });

    const errPhotos = document.getElementById('err-listingPhotos');
    if (errPhotos && this.uploadedFiles.length >= 2) errPhotos.textContent = '';

    this.renderPhotoPreviews();
  }

  renderPhotoPreviews() {
    const container = document.getElementById('photoPreviewsGrid');
    if (!container) return;

    container.innerHTML = this.uploadedFiles.map((file, idx) => {
      const objectUrl = URL.createObjectURL(file);
      return `
        <div class="photo-preview-item">
          <img src="${objectUrl}" alt="Listing upload ${idx + 1}" />
          <button type="button" class="photo-remove-btn" onclick="window.hostManager.removePhoto(${idx})" title="Remove photo">✕</button>
          <span class="photo-index-pill">#${idx + 1}</span>
        </div>
      `;
    }).join('');
  }

  removePhoto(index) {
    this.uploadedFiles.splice(index, 1);
    this.renderPhotoPreviews();
  }

  initDishes() {
    this.specialtyDishes = [
      { name: "Ancestral Clay-Pot Curry", description: "Slow-simmered with stone-ground shallots, Malabar kokum, and freshly pressed coconut cream.", diet: "Non-Veg" },
      { name: "Wood-Fired Red Rice Appam", description: "Crisp lace edges, fluffy steamed center served with fragrant cardamom vegetable stew.", diet: "Veg" }
    ];
    this.renderDishesList();
  }

  renderDishesList() {
    const list = document.getElementById('specialtyDishesList');
    if (!list) return;

    if (this.specialtyDishes.length === 0) {
      list.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">No dishes added yet.</p>';
      return;
    }

    list.innerHTML = this.specialtyDishes.map((dish, idx) => `
      <div class="dish-item-row">
        <div class="dish-badge dish-${dish.diet.toLowerCase().replace(/[^a-z]/g, '')}">${dish.diet}</div>
        <div class="dish-item-info">
          <strong>${dish.name}</strong>
          <p>${dish.description}</p>
        </div>
        <button type="button" class="btn btn-sm btn-outline text-danger" onclick="window.hostManager.removeDish(${idx})">✕</button>
      </div>
    `).join('');
  }

  addDishPrompt() {
    const name = prompt("Enter Dish Name:");
    if (!name || !name.trim()) return;
    const description = prompt("Enter Short Description / Key Ingredients:") || "Prepared freshly using heritage spices.";
    const diet = prompt("Diet type (Veg / Non-Veg / Vegan / Jain):") || "Veg";

    this.specialtyDishes.push({ name: name.trim(), description: description.trim(), diet: diet.trim() });
    this.renderDishesList();
  }

  removeDish(idx) {
    this.specialtyDishes.splice(idx, 1);
    this.renderDishesList();
  }

  /* ========================================================================
     STEP 4: REVIEW SUMMARY GENERATOR
     ======================================================================== */
  generateReviewSummary() {
    const container = document.getElementById('hostReviewSummaryCard');
    if (!container) return;

    const form = document.getElementById('createListingForm');
    if (!form) return;

    const title = form.title.value || 'Untitled Listing';
    const type = form.type.value;
    const category = form.category.value;
    const state = form.state.value;
    const tagline = form.tagline.value;
    const price = form.price.value || '0';
    const cancellation = form.cancellation.value || 'Flexible';
    const location = form.location.value || 'India';

    const amenities = Array.from(form.querySelectorAll('input[name="amenity"]:checked')).map(cb => cb.value);

    container.innerHTML = `
      <div class="review-summary-header">
        <span class="badge badge-teal">${type.toUpperCase()} · ${category}</span>
        <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin: 8px 0 4px;">${title}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0;">${tagline}</p>
      </div>

      <div class="review-summary-grid">
        <div class="review-meta-item">
          <label>State & Location</label>
          <strong>${state} · ${location}</strong>
        </div>
        <div class="review-meta-item">
          <label>Starting Price</label>
          <strong style="color: var(--primary-terracotta); font-size: 1.15rem;">₹${Number(price).toLocaleString('en-IN')}</strong>
        </div>
        <div class="review-meta-item">
          <label>Cancellation Policy</label>
          <strong>${cancellation}</strong>
        </div>
        <div class="review-meta-item">
          <label>Selected Coordinates</label>
          <strong>${this.selectedCoords[0]}° N, ${this.selectedCoords[1]}° E</strong>
        </div>
      </div>

      <div style="margin-top: 14px;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;">
          Included Amenities & Highlights (${amenities.length})
        </label>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${amenities.map(a => `<span class="amenity-pill">${a}</span>`).join('')}
        </div>
      </div>

      <div style="margin-top: 14px;">
        <label style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;">
          Verified Photos Attached (${this.uploadedFiles.length})
        </label>
        <div class="review-photos-strip">
          ${this.uploadedFiles.map(f => `<img src="${URL.createObjectURL(f)}" class="review-photo-thumb" />`).join('')}
        </div>
      </div>
    `;
  }

  /* ========================================================================
     FORM SUBMIT
     ======================================================================== */
  async handleFormSubmit(form) {
    const errorEl = document.getElementById('hostFormError');
    if (errorEl) errorEl.textContent = '';

    const user = window.authManager ? window.authManager.currentUser : null;
    if (!user) {
      if (errorEl) errorEl.textContent = 'Please sign in or use the 1-Click Host Demo before submitting.';
      window.showToast('Sign in required to submit listing', 'error');
      return;
    }

    const termsCheck = document.getElementById('hostTermsCheck');
    if (termsCheck && !termsCheck.checked) {
      const errTerms = document.getElementById('err-hostTermsCheck');
      if (errTerms) errTerms.textContent = 'Please confirm acceptance of the Indian Heritage & 0% Commission charter.';
      window.showToast('Please check the terms declaration.', 'error');
      return;
    }

    if (this.uploadedFiles.length < 2) {
      window.showToast('At least 2 photos are required!', 'error');
      return;
    }

    const title = form.title.value.trim();
    const type = form.type.value;
    const category = form.category.value;
    const state = form.state.value;
    const tagline = form.tagline.value.trim();
    const description = form.description.value.trim();
    const price = parseInt(form.price.value, 10);
    const cancellation = form.cancellation.value;
    const location = form.location.value.trim();
    const amenities = Array.from(form.querySelectorAll('input[name="amenity"]:checked')).map(cb => cb.value);

    const submitBtn = document.getElementById('submitListingBtn');
    const progressWrapper = document.getElementById('uploadProgressWrapper');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressPercent = document.getElementById('uploadProgressPercent');

    if (submitBtn) submitBtn.disabled = true;
    if (progressWrapper) progressWrapper.style.display = 'block';

    try {
      // 1. Upload photos with progress feedback
      const photoUrls = [];
      const total = this.uploadedFiles.length;

      for (let i = 0; i < total; i++) {
        const file = this.uploadedFiles[i];
        const pctStart = Math.round((i / total) * 100);
        if (progressBar) progressBar.style.width = `${pctStart}%`;
        if (progressPercent) progressPercent.textContent = `${pctStart}%`;

        const url = await window.firebaseService.uploadFile(file, 'listings/photos', (filePct) => {
          const overall = Math.round(((i + (filePct / 100)) / total) * 100);
          if (progressBar) progressBar.style.width = `${overall}%`;
          if (progressPercent) progressPercent.textContent = `${overall}%`;
        });
        photoUrls.push(url);
      }

      if (progressBar) progressBar.style.width = '100%';
      if (progressPercent) progressPercent.textContent = '100%';

      // 2. Prepare listing document
      const listingData = {
        hostId: user.uid,
        hostName: user.displayName || user.email,
        hostEmail: user.email,
        title,
        type,
        category,
        state,
        tagline,
        description,
        price,
        cancellationPolicy: cancellation,
        amenities,
        location,
        coordinates: this.selectedCoords,
        photos: photoUrls,
        dishes: type === 'dining' ? this.specialtyDishes : [],
        guideCredentials: type === 'guide' ? {
          license: form.guideRegNumber?.value || 'VERIFIED-LOCAL-GUIDE',
          languages: form.guideLanguages?.value || 'English, Hindi'
        } : null,
        status: 'pending' // Moderation guard
      };

      // 3. Save listing to Firestore
      await window.firebaseService.createListing(listingData);

      // 4. Upgrade user role to 'host' if currently 'traveler'
      if (user.role === 'traveler') {
        user.role = 'host';
        if (window.firebaseService.db && window.firebaseService.db.collection) {
          try {
            await window.firebaseService.db.collection('users').doc(user.uid).set({ role: 'host' }, { merge: true });
          } catch (e) {}
        }
        if (window.authManager) window.authManager.updateNavUI();
      }

      window.showToast('Listing submitted successfully! Awaiting curation moderation.', 'success');

      // Success view
      const container = document.getElementById('view-become-host');
      if (container) {
        container.innerHTML = `
          <div class="container section" style="max-width: 650px; text-align: center; margin: 60px auto;">
            <div style="font-size: 3.5rem; margin-bottom: 16px;">🎉</div>
            <h1 style="font-family: var(--font-serif); margin-bottom: 12px;">Listing Submitted!</h1>
            <p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: 24px;">
              Thank you, <strong>${user.displayName || user.email}</strong>. Your ${type === 'guide' ? 'Local Guide' : (type === 'dining' ? 'Artisan Dining' : 'Boutique Stay')} listing <strong>"${title}"</strong> has been logged with status <span class="status-pill status-pending">PENDING</span>.
            </p>
            <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 30px;">
              Our curation team reviews architectural authenticity, local origin, and 0% host commission guidelines within 24 hours. You can monitor the approval status anytime from your account dashboard.
            </p>
            <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
              <a href="#account" class="btn btn-primary">View in Account Dashboard</a>
              <a href="#admin" class="btn btn-outline">Go to Moderation Queue (Admin)</a>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error(err);
      if (errorEl) errorEl.textContent = err.message || 'Failed to submit listing.';
      window.showToast(err.message || 'Failed to submit listing', 'error');
      if (submitBtn) submitBtn.disabled = false;
      if (progressWrapper) progressWrapper.style.display = 'none';
    }
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.HostManager = HostManager;
  window.hostManager = new HostManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HostManager };
}
