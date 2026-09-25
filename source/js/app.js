/**
 * Travel Nexus - Core Application Orchestrator
 * Stat counters, testimonials carousel, toast system, search bar, FAQ, & forms
 */

// ==========================================================================
// 1. TOAST NOTIFICATION SYSTEM
// ==========================================================================
window.showToast = function(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 300ms forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// ==========================================================================
// 1.5. PROFESSIONAL TOURISM THEME AMBIANCE MANAGER
// ==========================================================================
class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'travelnexus_theme';
    this.currentTheme = this.getSavedTheme();
    this.init();
  }

  getSavedTheme() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && ['light', 'dark', 'emerald'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for theme storage:', e);
    }
    // Respect system preference if unset
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  init() {
    this.applyTheme(this.currentTheme, false);
    this.bindEvents();

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.applyTheme(e.matches ? 'dark' : 'light', true);
        }
      });
    }
  }

  applyTheme(theme, showFeedback = true) {
    this.currentTheme = theme;
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (e) {}

    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // Dynamic browser header theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = {
        light: '#FAF8F5',
        dark: '#0B1114',
        emerald: '#091715'
      };
      metaThemeColor.setAttribute('content', colors[theme] || '#FAF8F5');
    }

    // Update button states in top utility bar and mobile drawer
    document.querySelectorAll('[data-theme-val]').forEach(btn => {
      if (btn.getAttribute('data-theme-val') === theme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update quick toggle icon
    const quickIcon = document.getElementById('themeQuickIcon');
    if (quickIcon) {
      const icons = {
        light: '☀️',
        dark: '🌙',
        emerald: '🌿'
      };
      quickIcon.textContent = icons[theme] || '☀️';
    }

    if (showFeedback && window.showToast) {
      const titles = {
        light: '☀️ Daylight Ivory Luxury Theme',
        dark: '🌙 Midnight Obsidian Luxe Mode',
        emerald: '🌿 Emerald Sanctuary Eco-Luxe Mode'
      };
      window.showToast(`${titles[theme] || theme} Activated`, 'info');
    }
  }

  cycleTheme() {
    const order = ['light', 'dark', 'emerald'];
    const nextIdx = (order.indexOf(this.currentTheme) + 1) % order.length;
    this.applyTheme(order[nextIdx], true);
  }

  bindEvents() {
    // Buttons with data-theme-val
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-val]');
      if (btn) {
        e.preventDefault();
        const theme = btn.getAttribute('data-theme-val');
        this.applyTheme(theme, true);
      }
    });

    // Navbar Quick Toggle
    const quickToggle = document.getElementById('themeQuickToggleBtn');
    if (quickToggle) {
      quickToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.cycleTheme();
      });
    }
  }
}

window.themeManager = new ThemeManager();

// ==========================================================================
// 2. MAIN APPLICATION LOGIC
// ==========================================================================
class TravelNestApp {
  constructor() {
    this.adultGuests = 2;
    this.childGuests = 0;
    this.currentTestimonial = 0;
    this.testimonialInterval = null;

    this.init();
  }

  init() {
    this.initNavbarScroll();
    this.initMobileMenu();
    this.initNavMoreDropdown();
    this.initHeroSearchBar();
    this.renderCulinaryShowcase();
    this.renderTestimonials();
    this.initAnimatedCounters();
    this.initFaqAccordion();
    this.initForms();
  }

  // Sticky Navbar Scroll Elevation
  initNavbarScroll() {
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // Mobile Hamburger Toggle
  initMobileMenu() {
    const toggleBtn = document.getElementById('navMobileToggle');
    const menu = document.getElementById('navMenu');
    if (toggleBtn && menu) {
      toggleBtn.addEventListener('click', () => {
        menu.classList.toggle('open');
      });
    }
  }

  // Nav "More" Dropdown Toggle (supports click, hover, escape, and link click)
  initNavMoreDropdown() {
    const moreBtn = document.getElementById('navMoreBtn');
    const moreItem = document.getElementById('navMoreItem') || (moreBtn ? moreBtn.closest('.nav-item-more') : null);
    const dropdownMenu = document.getElementById('navMoreMenu');

    if (moreBtn && moreItem) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = moreItem.classList.toggle('is-open');
        moreBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!moreItem.contains(e.target)) {
          moreItem.classList.remove('is-open');
          moreBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close dropdown on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && moreItem.classList.contains('is-open')) {
          moreItem.classList.remove('is-open');
          moreBtn.setAttribute('aria-expanded', 'false');
          moreBtn.focus();
        }
      });

      // Close dropdown when any link inside is clicked
      if (dropdownMenu) {
        dropdownMenu.addEventListener('click', (e) => {
          if (e.target.closest('a')) {
            moreItem.classList.remove('is-open');
            moreBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }
  }

  // Hero Search Bar & Guest Popover
  initHeroSearchBar() {
    const guestTrigger = document.getElementById('searchGuestField');
    const guestPopover = document.getElementById('guestPopover');
    const guestDisplay = document.getElementById('guestCountDisplay');

    if (guestTrigger && guestPopover) {
      guestTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        guestPopover.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!guestPopover.contains(e.target) && !guestTrigger.contains(e.target)) {
          guestPopover.classList.remove('active');
        }
      });
    }

    // Guest Steppers
    const updateGuestDisplay = () => {
      const total = this.adultGuests + this.childGuests;
      if (guestDisplay) {
        guestDisplay.textContent = `${total} Guest${total > 1 ? 's' : ''}`;
      }
    };

    const adultDec = document.getElementById('adultDec');
    const adultInc = document.getElementById('adultInc');
    const adultVal = document.getElementById('adultCountVal');

    if (adultDec && adultInc && adultVal) {
      adultDec.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.adultGuests > 1) {
          this.adultGuests--;
          adultVal.textContent = this.adultGuests;
          updateGuestDisplay();
        }
      });
      adultInc.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.adultGuests < 10) {
          this.adultGuests++;
          adultVal.textContent = this.adultGuests;
          updateGuestDisplay();
        }
      });
    }

    const childDec = document.getElementById('childDec');
    const childInc = document.getElementById('childInc');
    const childVal = document.getElementById('childCountVal');

    if (childDec && childInc && childVal) {
      childDec.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.childGuests > 0) {
          this.childGuests--;
          childVal.textContent = this.childGuests;
          updateGuestDisplay();
        }
      });
      childInc.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.childGuests < 6) {
          this.childGuests++;
          childVal.textContent = this.childGuests;
          updateGuestDisplay();
        }
      });
    }

    // "Plan My Trip" CTA in search bar
    const heroSearchBtn = document.getElementById('heroSearchBtn');
    if (heroSearchBtn) {
      heroSearchBtn.addEventListener('click', () => {
        const destInput = document.getElementById('heroDestInput');
        const destQuery = destInput ? destInput.value.trim() : '';

        if (destQuery) {
          window.location.hash = '#stays';
          const staySearchInput = document.getElementById('staySearchInput');
          if (staySearchInput && window.filterManager) {
            staySearchInput.value = destQuery;
            window.filterManager.staySearchQuery = destQuery.toLowerCase();
            window.filterManager.applyStayFilters();
          }
        } else {
          window.location.hash = '#stays';
        }
      });
    }
  }

  // Culinary Showcase Rendering
  renderCulinaryShowcase() {
    const diningContainer = document.getElementById('culinaryThemesContainer');
    const homePreviewContainer = document.getElementById('homeCulinaryPreviewGrid');

    if (diningContainer) {
      diningContainer.innerHTML = TRAVEL_DATA.culinaryThemes.map((theme, index) => {
        const themeClasses = ['theme-rustic', 'theme-coastal', 'theme-heritage', 'theme-street'];
        const themeClass = themeClasses[index % themeClasses.length];

        return `
          <div class="culinary-theme-section ${themeClass}">
            <div class="theme-header-grid">
              <div>
                <span class="badge badge-terracotta" style="margin-bottom: 8px;">${theme.badge}</span>
                <h2 style="font-size: 1.85rem; margin-bottom: 6px;">${theme.name}</h2>
                <p style="font-size: 1.05rem; color: var(--text-dark); font-weight: 500; margin-bottom: var(--space-sm);">${theme.tagline}</p>
                <p style="color: var(--text-body); line-height: 1.6; font-size: 0.925rem;">${theme.story}</p>
                
                <div class="theme-ambiance-box">
                  "${theme.ambiance}"
                </div>

                <button class="btn btn-primary" onclick="window.modalManager.openTableReservationModal('${theme.id}')" style="margin-top: var(--space-sm);">
                  Reserve a Table Here
                </button>
              </div>
              <div>
                <img src="${theme.heroImage}" alt="${theme.alt}" class="theme-banner-img" loading="lazy" onerror="window.handleImageError && window.handleImageError(this, '${theme.name.replace(/'/g, "\\'")}', 'Culinary Experience')" />
              </div>
            </div>

            <h3 style="font-size: 1.2rem; margin-bottom: var(--space-lg);">Signature Regional Dishes</h3>
            <div class="dishes-grid">
              ${theme.dishes.map(dish => `
                <div class="dish-card">
                  <div class="dish-img-box">
                    <img src="${dish.image}" alt="${dish.alt}" loading="lazy" onerror="window.handleImageError && window.handleImageError(this, '${dish.name.replace(/'/g, "\\'")}', '${dish.dietary || 'Regional Dish'}')" />
                    <span class="dish-dietary-badge">${dish.dietary}</span>
                  </div>
                  <div class="dish-info">
                    <div class="dish-header">
                      <h4 class="dish-name">${dish.name}</h4>
                      <span class="dish-price">₹${dish.price}</span>
                    </div>
                    <p class="dish-desc">${dish.description}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
    }

    // Home preview teaser: 4 theme cards
    if (homePreviewContainer) {
      homePreviewContainer.innerHTML = TRAVEL_DATA.culinaryThemes.map(theme => `
        <div class="pillar-card" style="text-align: left; align-items: flex-start; overflow: hidden; padding: 0; cursor: pointer;" onclick="window.location.hash='#dining'">
          <div style="height: 180px; width: 100%; overflow: hidden;">
            <img src="${theme.heroImage}" alt="${theme.alt}" style="width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-normal);" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" onerror="window.handleImageError && window.handleImageError(this, '${theme.name.replace(/'/g, "\\'")}', 'Authentic Cuisine')" />
          </div>
          <div style="padding: var(--space-lg); display: flex; flex-direction: column; flex: 1;">
            <span class="badge badge-gold" style="align-self: flex-start; margin-bottom: 8px;">${theme.badge}</span>
            <h3 style="font-size: 1.15rem; margin-bottom: 4px;">${theme.name}</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; margin-bottom: var(--space-md);">${theme.tagline}</p>
            <div style="margin-top: auto; color: var(--primary-terracotta); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
              Explore Menu & Tables →
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Testimonials Carousel
  renderTestimonials() {
    const container = document.getElementById('testimonialsContainer');
    if (!container) return;

    const data = TRAVEL_DATA.testimonials;
    container.innerHTML = `
      <div class="testimonials-slider-wrapper" style="position: relative; max-width: 800px; margin: 0 auto;">
        <div class="testimonials-slides-track">
          ${data.map((t, idx) => `
            <div class="testimonial-slide" style="display: ${idx === 0 ? 'block' : 'none'}; animation: fadeIn 400ms ease;" data-slide-index="${idx}">
              <div class="testimonial-card">
                <div>
                  <div class="quote-icon">“</div>
                  <p class="testimonial-quote">${t.quote}</p>
                </div>
                <div class="traveler-info">
                  <img src="${t.avatar}" alt="${t.name}" class="traveler-avatar" />
                  <div class="traveler-meta">
                    <h4>${t.name}</h4>
                    <p>${t.role} · ${t.location}</p>
                    <div class="traveler-stayed">Stayed at: ${t.stayedAt}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: var(--space-xl);">
          <button id="prevTestimonialBtn" class="stepper-btn" aria-label="Previous Review">←</button>
          <div id="testimonialDots" style="display: flex; gap: 6px;">
            ${data.map((_, i) => `
              <span class="testimonial-dot" style="width: 10px; height: 10px; border-radius: 50%; background: ${i === 0 ? 'var(--primary-terracotta)' : 'var(--border-light)'}; cursor: pointer;" data-dot-index="${i}"></span>
            `).join('')}
          </div>
          <button id="nextTestimonialBtn" class="stepper-btn" aria-label="Next Review">→</button>
        </div>
      </div>
    `;

    const slides = container.querySelectorAll('.testimonial-slide');
    const dots = container.querySelectorAll('.testimonial-dot');

    const showSlide = (index) => {
      this.currentTestimonial = (index + slides.length) % slides.length;
      slides.forEach((s, i) => s.style.display = i === this.currentTestimonial ? 'block' : 'none');
      dots.forEach((d, i) => d.style.background = i === this.currentTestimonial ? 'var(--primary-terracotta)' : 'var(--border-light)');
    };

    const prevBtn = document.getElementById('prevTestimonialBtn');
    const nextBtn = document.getElementById('nextTestimonialBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => showSlide(this.currentTestimonial - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showSlide(this.currentTestimonial + 1));

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => showSlide(idx));
    });

    // Auto rotate every 6 seconds
    this.testimonialInterval = setInterval(() => {
      showSlide(this.currentTestimonial + 1);
    }, 6000);
  }

  // Animated Stat Counters
  initAnimatedCounters() {
    const counterElements = document.querySelectorAll('[data-target-count]');
    if (!counterElements.length) return;

    let animated = false;

    const animateCount = (el) => {
      const target = parseInt(el.getAttribute('data-target-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const duration = 1800;
      const startTime = performance.now();

      const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutQuad = progress * (2 - progress);
        const currentCount = Math.floor(easeOutQuad * target);
        el.textContent = `${prefix}${currentCount.toLocaleString()}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
        }
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          counterElements.forEach(el => animateCount(el));
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });

    const statsContainer = document.querySelector('.stats-banner') || document.querySelector('.stats-grid');
    if (statsContainer) {
      observer.observe(statsContainer);
    }
  }

  // FAQ Accordion
  initFaqAccordion() {
    const faqContainer = document.getElementById('faqAccordionContainer');
    if (!faqContainer) return;

    faqContainer.innerHTML = TRAVEL_DATA.faqs.map((item, idx) => `
      <div class="faq-item ${idx === 0 ? 'open' : ''}">
        <button class="faq-question">
          <span>${item.q}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="faq-answer">
          <p>${item.a}</p>
        </div>
      </div>
    `).join('');

    faqContainer.addEventListener('click', (e) => {
      const questionBtn = e.target.closest('.faq-question');
      if (questionBtn) {
        const item = questionBtn.closest('.faq-item');
        item.classList.toggle('open');
      }
    });
  }

  // Forms Submissions (Newsletter & Contact)
  initForms() {
    // Newsletter Home
    const nlHome = document.getElementById('homeNewsletterForm');
    if (nlHome) {
      nlHome.addEventListener('submit', (e) => {
        e.preventDefault();
        nlHome.reset();
        window.showToast("🌿 Welcome to the Travel Nexus community! Your curated guide is on its way.", "success");
      });
    }

    // Newsletter Footer
    const nlFooter = document.getElementById('footerNewsletterForm');
    if (nlFooter) {
      nlFooter.addEventListener('submit', (e) => {
        e.preventDefault();
        nlFooter.reset();
        window.showToast("🌿 Subscribed! Thank you for supporting conscious hospitality.", "success");
      });
    }

    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        contactForm.reset();
        window.showToast("✉️ Thank you! Our traveler concierge team will respond within 2 hours.", "success");
      });
    }

    // Dynamic Currency Converter Engine
    this.currencyManager = new CurrencyManager();
    window.currencyManager = this.currencyManager;
  }
}

/**
 * CurrencyManager - Foreign currency display conversion for inbound international tourists.
 * Strict base: INR (₹). Rates fetched dynamically with resilient fallback.
 * Formats: "₹4,500 (~$54 USD*)" with tooltip "For reference only, charges are in INR"
 */
class CurrencyManager {
  constructor() {
    this.currentCurrency = localStorage.getItem('travelnexus_currency') || 'INR';
    this.rates = {
      INR: 1,
      USD: 0.0120,
      EUR: 0.0110,
      GBP: 0.0095
    };
    this.symbols = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };
    this.fetchLiveRates();
    this.bindSelectors();
  }

  async fetchLiveRates() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/INR');
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates) {
          this.rates.USD = data.rates.USD || this.rates.USD;
          this.rates.EUR = data.rates.EUR || this.rates.EUR;
          this.rates.GBP = data.rates.GBP || this.rates.GBP;
        }
      }
    } catch (e) {
      // Keep resilient fallback rates
    }
  }

  bindSelectors() {
    const selectors = document.querySelectorAll('#currencySelector, .currency-select');
    selectors.forEach(sel => {
      sel.value = this.currentCurrency;
      sel.addEventListener('change', (e) => {
        this.setCurrency(e.target.value);
      });
    });
  }

  setCurrency(curr) {
    this.currentCurrency = curr;
    localStorage.setItem('travelnexus_currency', curr);

    document.querySelectorAll('#currencySelector, .currency-select').forEach(s => s.value = curr);

    // Re-render UI components with new currency references
    if (window.filterManager) {
      window.filterManager.renderPopularDestinationsHome();
      window.filterManager.renderAllDestinations();
      window.filterManager.renderFeaturedStaysHome();
      window.filterManager.renderAllStays();
      window.filterManager.renderExperienceBundles();
    }

    const note = curr === 'INR' 
      ? 'Prices displayed in base Indian Rupee (₹).'
      : `Display reference set to ${curr}. For reference only — all bookings are settled in INR (₹).`;
    window.showToast(note, 'info');
  }

  format(amountINR, showRef = true) {
    const inrFormatted = `₹${amountINR.toLocaleString('en-IN')}`;
    if (this.currentCurrency === 'INR' || !showRef) {
      return inrFormatted;
    }
    const rate = this.rates[this.currentCurrency] || 1;
    const symbol = this.symbols[this.currentCurrency] || '';
    const converted = Math.round(amountINR * rate);
    return `${inrFormatted} <span class="currency-ref-note" title="For reference only, charges are in INR">(~${symbol}${converted.toLocaleString()} ${this.currentCurrency}*)</span>`;
  }
}

window.formatCurrency = function(amt, showRef = true) {
  return window.currencyManager ? window.currencyManager.format(amt, showRef) : `₹${amt.toLocaleString('en-IN')}`;
};

// Global India e-Visa Country Advisor Handler
window.handleVisaCountryChange = function(countryCode) {
  const titleEl = document.getElementById('evisaCountryTitle');
  const countries = {
    US: 'United States Passport Holders',
    GB: 'United Kingdom Passport Holders',
    DE: 'German Passport Holders',
    FR: 'French Passport Holders',
    AU: 'Australian Passport Holders',
    CA: 'Canadian Passport Holders',
    SG: 'Singaporean Passport Holders',
    AE: 'UAE Passport Holders',
    JP: 'Japanese Passport Holders',
    NL: 'Dutch Passport Holders',
    IT: 'Italian Passport Holders',
    ES: 'Spanish Passport Holders',
    SE: 'Swedish Passport Holders',
    CH: 'Swiss Passport Holders',
    NZ: 'New Zealand Passport Holders',
    MY: 'Malaysian Passport Holders',
    OTHER: 'International Passport Holders (165+ Nations)'
  };

  const name = countries[countryCode] || 'International Passport Holders';
  if (titleEl) {
    titleEl.textContent = `Eligible for India e-Tourist Visa (${name})`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.travelNestApp = new TravelNestApp();
});
