/**
 * Travel Nexus - Pure LocalStorage Authentication & Account Controller
 * Fully self-contained client-side authentication engine (no Firebase required).
 * Stores registered users in `travelnexus_users` and active session in `travelnexus_session`.
 */

class AuthManager {
  constructor() {
    this.USERS_KEY = 'travelnexus_users';
    this.SESSION_KEY = 'travelnexus_session';
    this.currentUser = null;

    this.initSeedUsers();
    this.loadSession();
    this.init();
  }

  // Ensure default demonstration accounts exist
  initSeedUsers() {
    try {
      const existing = localStorage.getItem(this.USERS_KEY);
      if (!existing) {
        const seedUsers = [
          {
            uid: 'usr-traveler-01',
            name: 'Aarav Sharma',
            email: 'traveler@travelnexus.app',
            password: 'traveler123',
            role: 'traveler',
            createdAt: '2026-01-15T10:00:00.000Z'
          },
          {
            uid: 'usr-host-01',
            name: 'Maharaj Shakti Singh',
            email: 'host@travelnexus.app',
            password: 'host123',
            role: 'host',
            createdAt: '2026-02-10T11:30:00.000Z'
          },
          {
            uid: 'usr-admin-01',
            name: 'Nexus Admin',
            email: 'admin@travelnexus.app',
            password: 'admin123',
            role: 'admin',
            createdAt: '2026-01-01T00:00:00.000Z'
          }
        ];
        localStorage.setItem(this.USERS_KEY, JSON.stringify(seedUsers));
      }
    } catch (e) {
      console.warn('LocalStorage error during seed init:', e);
    }
  }

  loadSession() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      this.currentUser = session ? JSON.parse(session) : null;
    } catch (e) {
      this.currentUser = null;
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  saveUsers(users) {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  }

  init() {
    // Render navigation slot on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.renderNavAuthSlot();
        this.bindGlobalEvents();
      });
    } else {
      this.renderNavAuthSlot();
      this.bindGlobalEvents();
    }
  }

  bindGlobalEvents() {
    document.body.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'authLoginForm') {
        e.preventDefault();
        const email = e.target.querySelector('#loginEmail')?.value.trim();
        const password = e.target.querySelector('#loginPassword')?.value;
        await this.signIn(email, password);
      } else if (e.target && e.target.id === 'authRegisterForm') {
        e.preventDefault();
        const name = e.target.querySelector('#regName')?.value.trim();
        const email = e.target.querySelector('#regEmail')?.value.trim();
        const password = e.target.querySelector('#regPassword')?.value;
        const role = e.target.querySelector('#regRole')?.value || 'traveler';
        await this.signUp(name, email, password, role);
      }
    });
  }

  // =========================================================================
  // AUTH ACTIONS
  // =========================================================================
  async signIn(email, password) {
    if (window.firebaseService && typeof window.firebaseService.loginUser === 'function') {
      try {
        const user = await window.firebaseService.loginUser(email, password);
        if (user) {
          this.currentUser = user;
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
          this.renderNavAuthSlot();

          if (window.showToast) {
            window.showToast(`Welcome back, ${user.name}! 🙏`, 'success');
          }

          if (user.role === 'admin') {
            window.location.hash = '#admin';
          } else if (user.role === 'host') {
            window.location.hash = '#become-host';
          } else {
            window.location.hash = '#account';
          }
          return true;
        }
      } catch (err) {
        this.showAuthError(err.message || 'Invalid email or password.');
        return false;
      }
    }

    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());

    if (!user) {
      this.showAuthError('No account found with this email address. Please register.');
      return false;
    }

    if (user.password !== password) {
      this.showAuthError('Invalid password. Please check your credentials.');
      return false;
    }

    // Set active session
    const sessionUser = {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
    this.currentUser = sessionUser;
    this.renderNavAuthSlot();

    if (window.showToast) {
      window.showToast(`Welcome back, ${user.name}! 🙏`, 'success');
    }

    // Route based on role
    if (user.role === 'admin') {
      window.location.hash = '#admin';
    } else if (user.role === 'host') {
      window.location.hash = '#become-host';
    } else {
      window.location.hash = '#account';
    }

    return true;
  }

  async signUp(name, email, password, role = 'traveler') {
    if (window.firebaseService && typeof window.firebaseService.registerUser === 'function') {
      try {
        const user = await window.firebaseService.registerUser(name, email, password, role);
        if (user) {
          this.currentUser = user;
          localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
          this.renderNavAuthSlot();

          if (window.showToast) {
            window.showToast(`Account created! Welcome to Travel Nexus, ${user.name} ✨`, 'success');
          }
          window.location.hash = '#account';
          return true;
        }
      } catch (err) {
        this.showAuthError(err.message || 'Registration failed.');
        return false;
      }
    }

    if (!name || !email || !password) {
      this.showAuthError('Please fill in all required fields.');
      return false;
    }

    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      this.showAuthError('An account with this email address already exists. Please Sign In.');
      return false;
    }

    const newUser = {
      uid: 'usr-' + Date.now(),
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);

    const sessionUser = {
      uid: newUser.uid,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionUser));
    this.currentUser = sessionUser;
    this.renderNavAuthSlot();

    if (window.showToast) {
      window.showToast(`Account created! Welcome to Travel Nexus, ${newUser.name} ✨`, 'success');
    }

    window.location.hash = '#account';
    return true;
  }

  async signOut() {
    const name = this.currentUser ? this.currentUser.name : '';
    if (window.firebaseService && typeof window.firebaseService.logoutUser === 'function') {
      try {
        await window.firebaseService.logoutUser();
      } catch (e) {}
    }

    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser = null;
    this.renderNavAuthSlot();

    if (window.showToast) {
      window.showToast(name ? `Signed out successfully. See you soon, ${name}!` : 'Signed out successfully.', 'info');
    }

    if (window.location.hash === '#account' || window.location.hash === '#admin') {
      window.location.hash = '#home';
    } else {
      this.renderNavAuthSlot();
    }
  }

  loginDemo(role) {
    const demos = {
      traveler: { email: 'traveler@travelnexus.app', password: 'traveler123' },
      host: { email: 'host@travelnexus.app', password: 'host123' },
      admin: { email: 'admin@travelnexus.app', password: 'admin123' }
    };
    const target = demos[role] || demos.traveler;
    this.signIn(target.email, target.password);
  }

  showAuthError(msg) {
    const errBox = document.getElementById('authErrorBox');
    if (errBox) {
      errBox.style.display = 'block';
      errBox.textContent = msg;
    } else if (window.showToast) {
      window.showToast(msg, 'warning');
    }
  }

  // =========================================================================
  // NAVBAR AUTH SLOT RENDERING
  // =========================================================================
  renderNavAuthSlot() {
    const containers = document.querySelectorAll('#navAuthContainer, .nav-auth-slot, #navMobileAuthContainer');
    if (!containers.length) return;

    containers.forEach(container => {
      if (this.currentUser) {
        const initials = this.currentUser.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        const roleBadge = this.currentUser.role === 'admin' 
          ? '<span style="font-size:0.65rem; background:var(--accent-gold); color:var(--text-dark); padding:1px 6px; border-radius:10px; font-weight:700; margin-left:4px;">ADMIN</span>'
          : this.currentUser.role === 'host'
          ? '<span style="font-size:0.65rem; background:var(--secondary-teal); color:white; padding:1px 6px; border-radius:10px; font-weight:700; margin-left:4px;">HOST</span>'
          : '';

        container.innerHTML = `
          <div class="nav-user-profile-widget" style="display:flex; align-items:center; gap:8px;">
            <a href="#account" data-route="#account" class="nav-avatar-btn" style="display:flex; align-items:center; gap:8px; text-decoration:none; color:inherit;" title="View Your Account Dashboard">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--primary-terracotta); color:white; font-weight:700; font-size:0.75rem; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 4px rgba(0,0,0,0.15);">
                ${initials}
              </div>
              <span style="font-size:0.84rem; font-weight:600; color:var(--text-dark);" class="nav-user-name">
                ${this.currentUser.name.split(' ')[0]}
                ${roleBadge}
              </span>
            </a>
            <button class="btn btn-sm btn-outline" onclick="window.authManager.signOut()" style="padding:4px 10px; font-size:0.75rem; border-radius:var(--radius-full); cursor:pointer;">
              Sign Out
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="nav-auth-group" style="display:flex; align-items:center; gap:6px;">
            <a href="#login" class="nav-auth-btn nav-btn-signin" data-route="#login">
              Sign In
            </a>
            <a href="#login" class="nav-auth-btn nav-btn-signup" data-route="#login">
              Sign Up
            </a>
          </div>
        `;
      }
    });
  }

  updateNavUI() {
    this.renderNavAuthSlot();
  }

  // =========================================================================
  // VIEW 11: SIGN IN & CREATE ACCOUNT (#login)
  // =========================================================================
  renderLoginView() {
    this.renderLoginPage();
  }

  renderLoginPage() {
    const container = document.getElementById('view-login');
    if (!container) return;

    container.innerHTML = `
      <section class="auth-section">
        <div class="auth-card-wrapper">
          <div class="auth-card">
            <div class="auth-card-header">
              <span class="section-tag">NAMASTE & WELCOME</span>
              <h1 class="auth-brand-title">Travel Nexus</h1>
              <p class="auth-subtitle">Discover handcrafted journeys across Incredible India</p>
            </div>

            <!-- Error banner -->
            <div id="authErrorBox" class="auth-error-box" style="display: none;"></div>

            <!-- Auth Tabs -->
            <div class="auth-tabs">
              <button type="button" id="authTabSignIn" class="auth-tab active" onclick="window.authManager.switchAuthTab('signin')">
                Sign In
              </button>
              <button type="button" id="authTabRegister" class="auth-tab" onclick="window.authManager.switchAuthTab('register')">
                Create Account
              </button>
            </div>

            <!-- Sign In Form Panel -->
            <div id="authSignInPanel">
              <form id="authLoginForm" class="auth-form">
                <div class="form-field">
                  <label for="loginEmail" class="form-label" style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                  <input type="email" id="loginEmail" required placeholder="name@example.com" class="form-input" style="width: 100%;" />
                </div>
                <div class="form-field">
                  <label for="loginPassword" class="form-label" style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">Password</label>
                  <input type="password" id="loginPassword" required placeholder="••••••••" class="form-input" style="width: 100%;" />
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 11px; margin-top: 6px;">
                  Sign In to Nexus
                </button>
              </form>

              <!-- Instant Demo Accounts -->
              <div class="auth-divider">
                <span>⚡ Quick 1-Click Test Logins</span>
              </div>
              <div class="auth-demo-row">
                <button type="button" class="auth-demo-btn" onclick="window.authManager.loginDemo('traveler')">
                  👤 Traveler
                </button>
                <button type="button" class="auth-demo-btn" onclick="window.authManager.loginDemo('host')">
                  🏨 Host
                </button>
                <button type="button" class="auth-demo-btn" onclick="window.authManager.loginDemo('admin')">
                  🛡️ Admin
                </button>
              </div>
            </div>

            <!-- Create Account Panel -->
            <div id="authRegisterPanel" style="display: none;">
              <form id="authRegisterForm" class="auth-form">
                <div class="form-field">
                  <label for="regName" class="form-label" style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">Full Name</label>
                  <input type="text" id="regName" required placeholder="Aarav Sharma" class="form-input" style="width: 100%;" />
                </div>
                <div class="form-field">
                  <label for="regEmail" class="form-label" style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">Email Address</label>
                  <input type="email" id="regEmail" required placeholder="name@example.com" class="form-input" style="width: 100%;" />
                </div>
                <div class="form-field">
                  <label for="regPassword" class="form-label" style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">Password</label>
                  <input type="password" id="regPassword" required placeholder="Create a password" class="form-input" style="width: 100%;" />
                </div>
                <div class="form-field">
                  <label for="regRole" class="form-label" style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 6px;">Account Purpose</label>
                  <select id="regRole" class="form-input form-select" style="width: 100%;">
                    <option value="traveler">Traveler (Explore & Book Boutique Stays)</option>
                    <option value="host">Boutique Host / Guide (List Your Sanctuary)</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 11px; margin-top: 6px;">
                  Create Travel Nexus Account
                </button>
              </form>
            </div>

            <div class="auth-footnote">
              Pure client-side authentication · Pre-seeded demo accounts ready
            </div>

          </div>
        </div>
      </section>
    `;
  }

  switchAuthTab(tab) {
    const signInTab = document.getElementById('authTabSignIn');
    const regTab = document.getElementById('authTabRegister');
    const signInPanel = document.getElementById('authSignInPanel');
    const regPanel = document.getElementById('authRegisterPanel');
    const errBox = document.getElementById('authErrorBox');
    if (errBox) errBox.style.display = 'none';

    if (tab === 'signin') {
      if (signInTab) signInTab.classList.add('active');
      if (regTab) regTab.classList.remove('active');
      if (signInPanel) signInPanel.style.display = 'block';
      if (regPanel) regPanel.style.display = 'none';
    } else {
      if (regTab) regTab.classList.add('active');
      if (signInTab) signInTab.classList.remove('active');
      if (regPanel) regPanel.style.display = 'block';
      if (signInPanel) signInPanel.style.display = 'none';
    }
  }

  openLogin(e) {
    if (e) e.preventDefault();
    window.location.hash = '#login';
    setTimeout(() => this.switchAuthTab('signin'), 50);
  }

  openRegister(e) {
    if (e) e.preventDefault();
    window.location.hash = '#login';
    setTimeout(() => this.switchAuthTab('register'), 50);
  }

  // =========================================================================
  // VIEW 12: USER ACCOUNT DASHBOARD (#account)
  // =========================================================================
  renderAccountView() {
    this.renderAccountPage();
  }

  renderAccountPage() {
    const container = document.getElementById('view-account');
    if (!container) return;

    if (!this.currentUser) {
      container.innerHTML = `
        <section class="section" style="padding-top: var(--space-3xl); min-height: 60vh; text-align: center;">
          <div class="container" style="max-width: 500px;">
            <div style="background: var(--bg-surface); padding: 36px; border-radius: var(--radius-lg); border: 1px solid var(--border-light); box-shadow: var(--shadow-md);">
              <div style="font-size: 2.5rem; margin-bottom: 12px;">🔒</div>
              <h2 style="font-size: 1.4rem; margin-bottom: 8px;">Sign In Required</h2>
              <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 20px;">Please sign in to access your personal profile, saved havelis, and booking roadmaps.</p>
              <a href="#login" data-route="#login" class="btn btn-primary" style="display: inline-block;">Go to Sign In</a>
            </div>
          </div>
        </section>
      `;
      return;
    }

    const user = this.currentUser;
    const wishlistCount = (window.wishlistManager && window.wishlistManager.items) 
      ? window.wishlistManager.items.length 
      : 0;

    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const roleTitle = user.role === 'admin' 
      ? 'Platform Administrator' 
      : user.role === 'host' 
      ? 'Verified Boutique Host' 
      : 'Authentic Indian Traveler';

    container.innerHTML = `
      <section class="section" style="padding-top: var(--space-2xl); min-height: 80vh;">
        <div class="container" style="max-width: 860px;">
          
          <!-- User Profile Card -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 28px 32px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 68px; height: 68px; border-radius: 50%; background: var(--primary-terracotta); color: white; font-weight: 800; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.18);">
                ${initials}
              </div>
              <div>
                <h2 style="font-size: 1.5rem; margin-bottom: 4px;">${user.name}</h2>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">${user.email}</div>
                <span class="badge badge-teal" style="font-size: 0.72rem;">${roleTitle}</span>
              </div>
            </div>

            <div>
              <button class="btn btn-outline btn-sm" onclick="window.authManager.signOut()">
                Sign Out
              </button>
            </div>
          </div>

          <!-- Quick Navigation Cards Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 28px;">
            <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs);">
              <div style="font-size: 1.8rem; margin-bottom: 6px;">❤️</div>
              <h3 style="font-size: 1.05rem; margin-bottom: 4px;">Saved Journeys</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">You have ${wishlistCount} sanctuaries in your cloud wishlist.</p>
              <button class="btn btn-sm btn-primary" onclick="window.wishlistManager && window.wishlistManager.toggleDrawer ? window.wishlistManager.toggleDrawer() : null">
                View Saved Places
              </button>
            </div>

            <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs);">
              <div style="font-size: 1.8rem; margin-bottom: 6px;">🗺️</div>
              <h3 style="font-size: 1.05rem; margin-bottom: 4px;">AI Itinerary Architect</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Curate custom day-by-day domestic routes with zero hassle.</p>
              <a href="#planner" data-route="#planner" class="btn btn-sm btn-secondary">
                Open AI Planner
              </a>
            </div>

            ${user.role === 'admin' ? `
              <div style="background: var(--bg-surface); border: 1px solid var(--accent-gold); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs);">
                <div style="font-size: 1.8rem; margin-bottom: 6px;">🛡️</div>
                <h3 style="font-size: 1.05rem; margin-bottom: 4px;">Admin Control Console</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Manage pending host listings, verifications, and analytics.</p>
                <a href="#admin" data-route="#admin" class="btn btn-sm btn-primary">
                  Open Admin Hub
                </a>
              </div>
            ` : user.role === 'host' ? `
              <div style="background: var(--bg-surface); border: 1px solid var(--secondary-teal); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs);">
                <div style="font-size: 1.8rem; margin-bottom: 6px;">🏨</div>
                <h3 style="font-size: 1.05rem; margin-bottom: 4px;">Host Listing Creator</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">List a new boutique stay or culinary dining table.</p>
                <a href="#become-host" data-route="#become-host" class="btn btn-sm btn-primary">
                  Create Listing
                </a>
              </div>
            ` : `
              <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 20px; box-shadow: var(--shadow-xs);">
                <div style="font-size: 1.8rem; margin-bottom: 6px;">🏰</div>
                <h3 style="font-size: 1.05rem; margin-bottom: 4px;">Boutique Havelis</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px;">Browse 100% verified boutique stays across India.</p>
                <a href="#stays" data-route="#stays" class="btn btn-sm btn-primary">
                  Explore Stays
                </a>
              </div>
            `}
          </div>

        </div>
      </section>
    `;
  }
}

// Global initialization
if (typeof window !== 'undefined') {
  window.authManager = new AuthManager();

  // Backward-compatible mock for administrative and modal calls without live Firebase
  if (!window.firebaseService) {
    window.firebaseService = {
      getAdminStats: async () => {
        const users = window.authManager.getUsers();
        return { pendingCount: 1, approvedCount: 9, totalUsers: users.length };
      },
      getPendingListings: async () => [],
      getListings: async () => (window.TRAVEL_DATA && window.TRAVEL_DATA.stays) ? window.TRAVEL_DATA.stays : [],
      getUsers: async () => window.authManager.getUsers(),
      updateListingStatus: async () => {},
      updateWishlist: async () => {},
      signIn: async (e, p) => window.authManager.signIn(e, p),
      signUp: async (n, e, p, r) => window.authManager.signUp(n, e, p, r),
      signOut: async () => window.authManager.signOut()
    };
  }
}
