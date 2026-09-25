/**
 * Travel Nexus - Client-Side Hash Router
 * Manages view switching, active navigation state, dynamic parameterized routes (#states/:slug),
 * and role-protected view initialization.
 */

class Router {
  constructor() {
    this.routes = {
      '': 'view-home',
      '#home': 'view-home',
      '#destinations': 'view-destinations',
      '#stays': 'view-stays',
      '#dining': 'view-dining',
      '#planner': 'view-planner',
      '#about': 'view-about',
      '#contact': 'view-contact',
      '#states': 'view-states',
      '#become-host': 'view-become-host',
      '#login': 'view-login',
      '#account': 'view-account',
      '#admin': 'view-admin',
      '#evisa': 'view-evisa'
    };

    this.currentView = null;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // Initial route dispatch once DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.handleRoute());
    } else {
      this.handleRoute();
    }

    // Attach click listeners to all router-link elements
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const targetRoute = link.getAttribute('data-route');
        this.navigate(targetRoute);
      }
    });
  }

  handleRoute() {
    let hash = window.location.hash || '#home';
    const cleanHash = hash.split('?')[0];

    // Check for dynamic parameterized route: #states/:slug
    const stateMatch = cleanHash.match(/^#states\/([a-z0-9-]+)$/i);
    if (stateMatch) {
      const slug = stateMatch[1];
      this.switchView('view-state-detail', cleanHash);
      if (window.statesManager) {
        window.statesManager.renderStateDetail(slug);
      }
      return;
    }

    const targetViewId = this.routes[cleanHash] || 'view-home';
    this.switchView(targetViewId, cleanHash);

    // Collision guard: Dock/close chat window when on become-host to prevent blocking form inputs
    if (cleanHash === '#become-host') {
      if (window.nexusAIChat && typeof window.nexusAIChat.close === 'function') {
        window.nexusAIChat.close();
      } else if (window.nestBotChat && typeof window.nestBotChat.close === 'function') {
        window.nestBotChat.close();
      }
    }

    // Dynamic view rendering triggers
    if (cleanHash === '#states' && window.statesManager) {
      window.statesManager.renderDirectory();
    } else if (cleanHash === '#destinations' && window.mapManager) {
      window.mapManager.initMainMap();
      window.mapManager.invalidateSize();
    } else if (cleanHash === '#become-host' && window.hostManager) {
      window.hostManager.render();
    } else if (cleanHash === '#login' && window.authManager) {
      window.authManager.renderLoginView();
    } else if (cleanHash === '#account' && window.authManager) {
      window.authManager.renderAccountView();
    } else if (cleanHash === '#admin' && window.adminManager) {
      window.adminManager.render();
    } else if (targetViewId === 'view-stays' && window.filterManager) {
      window.filterManager.applyStayFilters();
    }
  }

  switchView(viewId, hash) {
    const views = document.querySelectorAll('.view-section');
    views.forEach(view => {
      view.classList.remove('active');
    });

    const activeView = document.getElementById(viewId);
    if (activeView) {
      activeView.classList.add('active');
      this.currentView = viewId;
    }

    // Update active state on navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      if (linkHref === hash || (hash === '#home' && linkHref === '#') || (linkHref === '#home' && hash === '')) {
        link.classList.add('active');
      } else if (hash.startsWith('#states') && linkHref === '#states') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile menu if open
    const navMenu = document.getElementById('navMenu');
    if (navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigate(hash) {
    window.location.hash = hash;
  }
}

// Instantiate router on DOM ready
if (typeof window !== 'undefined') {
  window.Router = Router;
  if (!window.travelRouter) {
    window.travelRouter = new Router();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Router };
}
