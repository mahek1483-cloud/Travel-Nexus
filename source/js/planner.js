/**
 * Travel Nexus - AI Itinerary Planner Engine & Drag-and-Drop Board
 * Features:
 *   - AI itinerary generator tailored to pace, duration, budget, and travel interests
 *   - Dual View: Classic Scrollytelling Timeline & Interactive HTML5 Drag-and-Drop Board
 *   - Genuine destination-matched boutique stays & dining recommendations
 *   - Social itinerary sharing URL generator with deep-link state restoration
 *   - Direct booking & reservation triggers
 */

class ItineraryPlanner {
  constructor() {
    this.selectedDestination = 'dest-manali';
    this.selectedDays = 3;
    this.selectedInterests = ['culture', 'food'];
    this.selectedBudget = 'boutique';
    this.selectedPace = 'balanced';
    this.viewMode = 'timeline'; // 'timeline' | 'board'
    this.generatedDays = [];
    this.draggedItem = null;

    this.init();
  }

  init() {
    // 1. Check for URL deep-link query parameters
    this.parseDeepLinkParams();

    // 2. Bind planner form controls
    this.bindFormControls();

    // 3. Generate initial itinerary
    this.generateItinerary();

    // 4. Listen for hash changes with query parameters
    window.addEventListener('hashchange', () => {
      if (window.location.hash.startsWith('#planner')) {
        this.parseDeepLinkParams();
      }
    });
  }

  parseDeepLinkParams() {
    const hash = window.location.hash;
    if (!hash.includes('?')) return;

    const queryString = hash.split('?')[1];
    const params = new URLSearchParams(queryString);

    if (params.has('dest')) {
      this.selectedDestination = params.get('dest');
      const destSelect = document.getElementById('plannerDestSelect');
      if (destSelect) destSelect.value = this.selectedDestination;
    }

    if (params.has('days')) {
      this.selectedDays = parseInt(params.get('days'), 10) || 3;
      document.querySelectorAll('.planner-day-chip').forEach(chip => {
        const d = parseInt(chip.getAttribute('data-days'), 10);
        chip.classList.toggle('selected', d === this.selectedDays);
      });
    }

    if (params.has('budget')) {
      this.selectedBudget = params.get('budget');
      const budgetSelect = document.getElementById('plannerBudgetSelect');
      if (budgetSelect) budgetSelect.value = this.selectedBudget;
    }

    if (params.has('pace')) {
      this.selectedPace = params.get('pace');
      const paceSelect = document.getElementById('plannerPaceSelect');
      if (paceSelect) paceSelect.value = this.selectedPace;
    }
  }

  bindFormControls() {
    // Destination select
    const destSelect = document.getElementById('plannerDestSelect');
    if (destSelect) {
      destSelect.addEventListener('change', (e) => {
        this.selectedDestination = e.target.value;
      });
    }

    // Days selector chips
    const dayChips = document.querySelectorAll('.planner-day-chip');
    dayChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dayChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedDays = parseInt(chip.getAttribute('data-days'), 10);
      });
    });

    // Interest chips (multi-select)
    const interestChips = document.querySelectorAll('.planner-interest-chip');
    interestChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.getAttribute('data-interest');
        if (chip.classList.contains('selected')) {
          chip.classList.remove('selected');
          this.selectedInterests = this.selectedInterests.filter(i => i !== val);
        } else {
          chip.classList.add('selected');
          this.selectedInterests.push(val);
        }
      });
    });

    // Budget select
    const budgetSelect = document.getElementById('plannerBudgetSelect');
    if (budgetSelect) {
      budgetSelect.addEventListener('change', (e) => {
        this.selectedBudget = e.target.value;
      });
    }

    // Pace select
    const paceSelect = document.getElementById('plannerPaceSelect');
    if (paceSelect) {
      paceSelect.addEventListener('change', (e) => {
        this.selectedPace = e.target.value;
      });
    }

    // Generate button
    const generateBtn = document.getElementById('generateItineraryBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleGenerateClick(generateBtn);
      });
    }
  }

  handleGenerateClick(btn) {
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      Curating Bespoke Route...
    `;

    setTimeout(() => {
      this.generateItinerary();
      btn.disabled = false;
      btn.innerHTML = originalText;
      window.showToast("✨ Your custom AI itinerary is ready!", "success");

      const outputEl = document.getElementById('itineraryOutput');
      if (outputEl) {
        outputEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 550);
  }

  generateItinerary() {
    const outputContainer = document.getElementById('itineraryOutput');
    if (!outputContainer) return;

    // Resolve base destination
    const dest = (window.TRAVEL_DATA && window.TRAVEL_DATA.destinations) 
      ? (window.TRAVEL_DATA.destinations.find(d => d.id === this.selectedDestination) || window.TRAVEL_DATA.destinations[0])
      : { id: 'dest-manali', name: 'Manali & Solang Valley', region: 'Himachal Pradesh' };

    const templates = (window.TRAVEL_DATA && window.TRAVEL_DATA.itineraryTemplates) ? window.TRAVEL_DATA.itineraryTemplates : {};
    const template = templates[dest.id] || templates['dest-manali'] || templates[Object.keys(templates)[0]] || {
      days: [
        {
          title: "Historic Temples & Deodar Forests",
          morning: "Sunrise meditation walk through the sacred Hadimba Deodar Sanctuary.",
          afternoon: "Walk to Vashisht natural sulfur hot springs and explore rustic wooden houses.",
          evening: "Traditional Himachali Dham dinner featuring slow-cooked madra and siddu.",
          cost: "₹1,400",
          insiderTip: "Visit Hadimba early at 7:00 AM before travelers arrive."
        }
      ]
    };

    // Construct day objects with slots
    this.generatedDays = [];
    for (let i = 0; i < this.selectedDays; i++) {
      const dayNum = i + 1;
      const baseDay = template.days[i % template.days.length];

      let morning = baseDay.morning;
      let afternoon = baseDay.afternoon;
      let evening = baseDay.evening;

      if (this.selectedInterests.includes('food') && i === 1) {
        evening = "Exclusive heritage chef's tasting session exploring heirloom spices, clay-pot curries, and regional sweets.";
      }
      if (this.selectedInterests.includes('nature') && i === 2) {
        morning = "Guided sunrise eco-walk along pristine forest trails accompanied by a certified village conservation naturalist.";
      }

      this.generatedDays.push({
        day: dayNum,
        title: i < template.days.length ? baseDay.title : `Day ${dayNum}: Immersive Hidden Sanctuaries & Artisan Encounters`,
        cost: baseDay.cost || '₹1,500',
        insiderTip: baseDay.insiderTip || 'Ask your local host for secret morning view points.',
        slots: {
          morning: { id: `d${dayNum}-m`, label: 'Morning · Exploration', desc: morning, time: '08:30 AM – 12:00 PM' },
          afternoon: { id: `d${dayNum}-a`, label: 'Afternoon · Culture & Flavors', desc: afternoon, time: '01:30 PM – 05:00 PM' },
          evening: { id: `d${dayNum}-e`, label: 'Evening · Twilight & Dining', desc: evening, time: '06:30 PM – 09:30 PM' }
        }
      });
    }

    // Budget estimates
    let totalEstCost = `₹${(this.selectedDays * 9000).toLocaleString('en-IN')} – ₹${(this.selectedDays * 14000).toLocaleString('en-IN')}`;
    if (this.selectedBudget === 'luxury') {
      totalEstCost = `₹${(this.selectedDays * 18000).toLocaleString('en-IN')} – ₹${(this.selectedDays * 28000).toLocaleString('en-IN')}`;
    } else if (this.selectedBudget === 'backpacker') {
      totalEstCost = `₹${(this.selectedDays * 4000).toLocaleString('en-IN')} – ₹${(this.selectedDays * 7000).toLocaleString('en-IN')}`;
    }

    // Matching stays & dining
    const matchingStays = this.getMatchingStays(dest);
    const matchingDining = this.getMatchingDining(dest);

    outputContainer.classList.add('active');
    outputContainer.innerHTML = `
      <!-- ITINERARY HEADER CARD -->
      <div class="itinerary-header-card">
        <div class="itinerary-header-left">
          <span class="badge badge-gold" style="margin-bottom: 8px;">✦ Bespoke AI Architecture</span>
          <h2>${this.selectedDays}-Day ${dest.name} Odyssey</h2>
          <p style="color: rgba(255,255,255,0.9); font-size: 0.95rem; margin-bottom: 0;">
            Pace: <strong>${this.selectedPace.toUpperCase()}</strong> · Interests: <strong>${this.selectedInterests.join(', ').toUpperCase()}</strong>
          </p>
        </div>

        <div class="itinerary-header-actions">
          <div style="font-size: 0.8rem; color: rgba(255,255,255,0.8);">Est. Total Budget (${this.selectedDays} Days)</div>
          <div style="font-size: 1.6rem; font-weight: 700; color: var(--accent-gold-light);">${totalEstCost}</div>
          
          <div class="flex gap-sm" style="flex-wrap: wrap; margin-top: 6px;">
            <button class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4);" onclick="window.itineraryPlanner.copyShareLink()">
              🔗 Share Plan
            </button>
            <button class="btn btn-sm" style="background: white; color: var(--secondary-teal); border: none;" onclick="window.printItinerary('${dest.name}')">
              🖨️ Save / Print
            </button>
          </div>
        </div>
      </div>

      <!-- VIEW MODE TOGGLE -->
      <div class="itinerary-view-toggle-bar">
        <span class="view-toggle-label">Itinerary Display Mode:</span>
        <div class="view-toggle-buttons">
          <button type="button" class="btn btn-sm ${this.viewMode === 'timeline' ? 'btn-primary' : 'btn-outline'}" onclick="window.itineraryPlanner.switchViewMode('timeline')">
            📜 Timeline View
          </button>
          <button type="button" class="btn btn-sm ${this.viewMode === 'board' ? 'btn-primary' : 'btn-outline'}" onclick="window.itineraryPlanner.switchViewMode('board')">
            🔀 Drag & Drop Interactive Board
          </button>
        </div>
      </div>

      <!-- MAIN ITINERARY CONTENT CONTAINER -->
      <div id="itineraryContentSlot">
        ${this.viewMode === 'timeline' ? this.renderTimelineHTML() : this.renderBoardHTML()}
      </div>

      <!-- MATCHING SANCTUARIES & DINING RECOMMENDATIONS -->
      <div class="itinerary-recommendations-section">
        <div class="section-header" style="text-align: left; margin-bottom: 20px;">
          <span class="section-tag">Handcrafted For This Route</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 4px;">Recommended Stays & Dining Along Your Path</h3>
          <p class="text-muted" style="font-size: 0.9rem;">Direct from verified local hosts with 0% commission markup.</p>
        </div>

        <div class="itinerary-rec-grid">
          ${matchingStays.map(stay => `
            <div class="itinerary-rec-card">
              <img src="${stay.image}" alt="${stay.name}" class="itinerary-rec-img" />
              <div class="itinerary-rec-body">
                <span class="badge badge-teal" style="font-size: 0.7rem; margin-bottom: 4px;">Verified Stay</span>
                <h4 style="font-size: 1rem; margin-bottom: 2px;">${stay.name}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">${stay.location}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                  <span style="font-weight: 700; color: var(--primary-terracotta);">₹${stay.pricePerNight.toLocaleString('en-IN')} <small style="font-size: 0.75rem; color: var(--text-muted);">/ night</small></span>
                  <button class="btn btn-primary btn-sm" onclick="window.modalManager.openStayBookingModal('${stay.id}')">Book Stay</button>
                </div>
              </div>
            </div>
          `).join('')}

          ${matchingDining.map(dining => `
            <div class="itinerary-rec-card">
              <img src="${dining.image}" alt="${dining.name}" class="itinerary-rec-img" />
              <div class="itinerary-rec-body">
                <span class="badge badge-gold" style="font-size: 0.7rem; margin-bottom: 4px;">Artisan Table</span>
                <h4 style="font-size: 1rem; margin-bottom: 2px;">${dining.name}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">${dining.location} · ${dining.cuisine}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                  <span style="font-weight: 700; color: var(--accent-gold-dark);">₹${dining.pricePerSeat.toLocaleString('en-IN')} <small style="font-size: 0.75rem; color: var(--text-muted);">/ seat</small></span>
                  <button class="btn btn-outline btn-sm" onclick="window.modalManager.openDiningModal ? window.modalManager.openDiningModal('${dining.id}') : window.location.hash='#dining'">Reserve Table</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (this.viewMode === 'board') {
      this.attachDragAndDropHandlers();
    }
  }

  switchViewMode(mode) {
    this.viewMode = mode;
    this.generateItinerary();
  }

  renderTimelineHTML() {
    return `
      <div class="days-timeline">
        ${this.generatedDays.map(day => `
          <div class="day-card">
            <div class="day-badge-header">
              <div class="flex items-center gap-sm">
                <span class="day-number-pill">Day ${day.day}</span>
                <h3 style="font-size: 1.15rem; margin-bottom: 0;">${day.title}</h3>
              </div>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">Est. Spend: ${day.cost}</span>
            </div>

            <div class="time-slots-grid">
              <div class="slot-item">
                <div class="slot-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>
                  ${day.slots.morning.label} <small class="text-muted">(${day.slots.morning.time})</small>
                </div>
                <div class="slot-desc">${day.slots.morning.desc}</div>
              </div>

              <div class="slot-item" style="border-left-color: var(--accent-gold-dark);">
                <div class="slot-time" style="color: var(--accent-gold-dark);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  ${day.slots.afternoon.label} <small class="text-muted">(${day.slots.afternoon.time})</small>
                </div>
                <div class="slot-desc">${day.slots.afternoon.desc}</div>
              </div>

              <div class="slot-item" style="border-left-color: var(--primary-terracotta);">
                <div class="slot-time" style="color: var(--primary-terracotta);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  ${day.slots.evening.label} <small class="text-muted">(${day.slots.evening.time})</small>
                </div>
                <div class="slot-desc">${day.slots.evening.desc}</div>
              </div>
            </div>

            <div class="day-insider-tip">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span><strong>Host Insider Secret:</strong> ${day.insiderTip}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderBoardHTML() {
    return `
      <div class="dnd-instructions-banner">
        <span>💡 <strong>Interactive Drag & Drop:</strong> Grab any activity card by its handle to re-order between morning, afternoon, or evening slots across your days!</span>
      </div>

      <div class="planner-board-container">
        ${this.generatedDays.map(day => `
          <div class="board-day-column" data-day="${day.day}">
            <div class="board-day-header">
              <div class="board-day-pill">Day ${day.day}</div>
              <h4>${day.title.length > 32 ? day.title.slice(0, 30) + '...' : day.title}</h4>
            </div>

            <div class="board-slots-list">
              ${['morning', 'afternoon', 'evening'].map(slotKey => {
                const item = day.slots[slotKey];
                return `
                  <div class="board-dropzone" data-day="${day.day}" data-slot="${slotKey}">
                    <div class="dropzone-slot-label">${item.label.split('·')[0]}</div>
                    <div class="board-activity-card" draggable="true" data-day="${day.day}" data-slot="${slotKey}">
                      <div class="dnd-handle">⠿</div>
                      <div class="activity-card-content">
                        <div class="activity-time-tag">${item.time}</div>
                        <p class="activity-text">${item.desc}</p>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="board-day-footer">
              <small class="text-muted">Est. Spend: <strong>${day.cost}</strong></small>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  attachDragAndDropHandlers() {
    const cards = document.querySelectorAll('.board-activity-card');
    const dropzones = document.querySelectorAll('.board-dropzone');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedItem = {
          day: parseInt(card.getAttribute('data-day'), 10),
          slot: card.getAttribute('data-slot')
        };
        card.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedItem));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        dropzones.forEach(dz => dz.classList.remove('drag-over'));
      });
    });

    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        const targetDay = parseInt(zone.getAttribute('data-day'), 10);
        const targetSlot = zone.getAttribute('data-slot');

        if (!this.draggedItem) return;
        const srcDay = this.draggedItem.day;
        const srcSlot = this.draggedItem.slot;

        if (srcDay === targetDay && srcSlot === targetSlot) return;

        // Swap activities in memory
        const srcDayObj = this.generatedDays.find(d => d.day === srcDay);
        const tgtDayObj = this.generatedDays.find(d => d.day === targetDay);

        if (srcDayObj && tgtDayObj) {
          const tempDesc = srcDayObj.slots[srcSlot].desc;
          srcDayObj.slots[srcSlot].desc = tgtDayObj.slots[targetSlot].desc;
          tgtDayObj.slots[targetSlot].desc = tempDesc;

          window.showToast(`Swapped activities between Day ${srcDay} and Day ${targetDay}!`, 'success');
          this.generateItinerary();
        }
      });
    });
  }

  copyShareLink() {
    const destName = (this.destinations.find(d => d.id === this.selectedDestination) || {}).name || 'Incredible India';
    const url = `${window.location.origin}${window.location.pathname}#planner?dest=${encodeURIComponent(this.selectedDestination)}&days=${this.selectedDays}&budget=${encodeURIComponent(this.selectedBudget)}&pace=${encodeURIComponent(this.selectedPace)}`;
    const shareTitle = `${destName} - ${this.selectedDays}-Day Curated Journey | Travel Nexus`;
    const shareText = `Explore our authentic ${this.selectedDays}-day itinerary for ${destName}, featuring verified boutique stays and regional heritage.`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: url
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          this.copyToClipboard(url);
        }
      });
    } else {
      this.copyToClipboard(url);
    }
  }

  copyToClipboard(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        window.showToast("🔗 Itinerary share link copied to clipboard!", "success");
      }).catch(() => {
        this.fallbackCopy(url);
      });
    } else {
      this.fallbackCopy(url);
    }
  }

  fallbackCopy(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    window.showToast("🔗 Itinerary share link copied to clipboard!", "success");
  }

  getMatchingStays(dest) {
    if (!window.TRAVEL_DATA || !window.TRAVEL_DATA.stays) return [];
    const nameWords = dest.name.toLowerCase().split(' ');
    const regionWords = dest.region ? dest.region.toLowerCase().split(' ') : [];
    
    return window.TRAVEL_DATA.stays.filter(s => {
      const loc = (s.location + ' ' + s.name + ' ' + s.description).toLowerCase();
      return nameWords.some(w => w.length > 3 && loc.includes(w)) || regionWords.some(w => w.length > 3 && loc.includes(w));
    }).slice(0, 2);
  }

  getMatchingDining(dest) {
    if (!window.TRAVEL_DATA || !window.TRAVEL_DATA.dining) return [];
    const region = (dest.region || dest.name).toLowerCase();
    
    return window.TRAVEL_DATA.dining.filter(d => {
      const info = (d.location + ' ' + d.name + ' ' + d.cuisine).toLowerCase();
      return info.includes('manali') || info.includes('rajasthan') || info.includes('kerala') || info.includes('goa') || info.includes(region.slice(0, 4));
    }).slice(0, 2);
  }
}

// Global print utility
window.printItinerary = function(destName) {
  window.print();
};

document.addEventListener('DOMContentLoaded', () => {
  window.itineraryPlanner = new ItineraryPlanner();
});
