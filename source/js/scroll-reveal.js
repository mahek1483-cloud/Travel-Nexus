/**
 * Travel Nexus - Scroll-Triggered Sticky Regional Reveal Stack
 * Coordinates sticky panel reveals using IntersectionObserver and batched rAF updates.
 * Provides smooth transitions, scaling down of outgoing panels, and delayed captions.
 */

class ScrollRevealStack {
  constructor() {
    this.section = document.getElementById('scrollStackSection');
    if (!this.section) return;

    this.tracks = Array.from(this.section.querySelectorAll('.stack-panel-track'));
    if (!this.tracks.length) return;

    this.panels = this.tracks.map(track => track.querySelector('.stack-panel-sticky'));
    this.ticking = false;
    this.lastActiveIdx = -1;

    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.bindScroll();
    this.bindTransitionCleanups();
    this.requestTick();
  }

  setupIntersectionObserver() {
    // Primary path: IntersectionObserver monitors track boundaries
    const options = {
      root: null,
      rootMargin: '0px 0px -40% 0px',
      threshold: [0, 0.2, 0.5, 0.8, 1.0]
    };

    this.observer = new IntersectionObserver((entries) => {
      this.requestTick();
    }, options);

    this.tracks.forEach(track => this.observer.observe(track));
  }

  bindScroll() {
    window.addEventListener('scroll', () => this.requestTick(), { passive: true });
    window.addEventListener('resize', () => this.requestTick(), { passive: true });
  }

  requestTick() {
    if (!this.ticking) {
      this.ticking = true;
      requestAnimationFrame(() => this.update());
    }
  }

  update() {
    this.ticking = false;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Fast check: If section is completely offscreen, bypass instantly
    const sectionRect = this.section.getBoundingClientRect();
    if (sectionRect.bottom < -100 || sectionRect.top > vh + 100) {
      return;
    }

    // Determine active panel
    let activeIdx = 0;
    for (let i = 0; i < this.tracks.length; i++) {
      const rect = this.tracks[i].getBoundingClientRect();
      if (rect.top <= vh * 0.5) {
        activeIdx = i;
      }
    }

    // Exit immediately if active panel hasn't changed (avoids thrashing DOM)
    if (activeIdx === this.lastActiveIdx) {
      return;
    }
    this.lastActiveIdx = activeIdx;

    // Batch WRITE: apply class updates in one write phase
    for (let i = 0; i < this.panels.length; i++) {
      const panel = this.panels[i];
      if (!panel) continue;

      const wasActive = panel.classList.contains('is-active');
      const wasExiting = panel.classList.contains('is-exiting');

      if (i < activeIdx) {
        // Outgoing covered panel: scales down & dims
        if (!wasExiting || wasActive) {
          this.applyTransitioning(panel);
          panel.classList.remove('is-active');
          panel.classList.add('is-exiting');
        }
      } else if (i === activeIdx) {
        // Current active pinned panel
        if (!wasActive || wasExiting) {
          this.applyTransitioning(panel);
          panel.classList.remove('is-exiting');
          panel.classList.add('is-active');
        }
      } else {
        // Unreached incoming panel waiting offscreen
        if (wasActive || wasExiting) {
          this.applyTransitioning(panel);
          panel.classList.remove('is-active', 'is-exiting');
        }
      }
    }
  }

  applyTransitioning(panel) {
    // Add will-change: transform sparingly only on actively transitioning panel
    panel.classList.add('is-transitioning');
  }

  bindTransitionCleanups() {
    this.panels.forEach(panel => {
      if (!panel) return;
      panel.addEventListener('transitionend', (e) => {
        if (e.target === panel) {
          panel.classList.remove('is-transitioning');
        }
      });
    });
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollRevealStack = new ScrollRevealStack();
  });
} else {
  window.scrollRevealStack = new ScrollRevealStack();
}
