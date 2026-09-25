/**
 * Travel Nexus - Role-Protected Admin Moderation Dashboard (#admin)
 * Manages platform stats, host listing moderation queue with live card preview,
 * approve/reject actions, and registered user roster.
 */

class AdminManager {
  constructor() {
    this.activeTab = 'pending'; // 'pending' | 'approved' | 'users'
    this.init();
  }

  init() {
    // Delegated click handlers for approve / reject
    document.addEventListener('click', async (e) => {
      const approveBtn = e.target.closest('.admin-approve-btn');
      if (approveBtn) {
        const id = approveBtn.getAttribute('data-listing-id');
        await this.handleApproveListing(id);
        return;
      }

      const rejectBtn = e.target.closest('.admin-reject-btn');
      if (rejectBtn) {
        const id = rejectBtn.getAttribute('data-listing-id');
        await this.handleRejectListing(id);
        return;
      }
    });
  }

  async render() {
    const container = document.getElementById('view-admin');
    if (!container) return;

    const user = window.authManager ? window.authManager.currentUser : null;
    const isAllowlisted = user && window.ADMIN_ALLOWLIST && window.ADMIN_ALLOWLIST.includes(user.email);
    const isAdmin = user && (user.role === 'admin' || isAllowlisted);

    // If not admin, show Access Denied guard
    if (!isAdmin) {
      container.innerHTML = `
        <div class="container section" style="max-width: 650px; text-align: center; margin: 60px auto;">
          <div style="font-size: 3.5rem; margin-bottom: 16px;">🛡️</div>
          <h1 style="font-family: var(--font-serif); margin-bottom: 12px;">Admin Access Restricted</h1>
          <p style="color: var(--text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: 24px;">
            The Travel Nexus Moderation Dashboard requires administrative privileges.
            ${user ? `You are currently signed in as <strong>${user.email}</strong> with role <em>${user.role || 'traveler'}</em>.` : 'You are currently not signed in.'}
          </p>
          <div style="background: var(--bg-cream, #FAF7F2); border: 1px solid var(--border-light, #E8E2D8); border-radius: 8px; padding: 20px; margin-bottom: 28px;">
            <p style="font-size: 0.9rem; color: var(--text-dark); margin-bottom: 12px;">
              <strong>Testing Tip:</strong> You can access this dashboard immediately using the 1-Click Admin Demo or by signing in with an authorized email in <code>window.ADMIN_ALLOWLIST</code>.
            </p>
            <button class="btn btn-primary btn-sm" onclick="window.authManager.demoLogin('admin')">
              🛡️ Sign in with 1-Click Admin Demo
            </button>
          </div>
          <a href="#home" class="btn btn-outline">Return to Home</a>
        </div>
      `;
      return;
    }

    // Load admin data
    container.innerHTML = `
      <div class="container section">
        <div class="admin-loading-state">
          <p>Loading Travel Nexus Moderation Data...</p>
        </div>
      </div>
    `;

    try {
      const stats = await window.firebaseService.getAdminStats();
      const pendingListings = await window.firebaseService.getPendingListings();
      const allListings = await window.firebaseService.getListings();
      const approvedListings = allListings.filter(l => l.status === 'approved');
      const users = await window.firebaseService.getUsers();

      container.innerHTML = `
        <div class="container section" style="max-width: 1140px;">
          <!-- ADMIN DASHBOARD HEADER -->
          <div class="admin-dashboard-header">
            <div>
              <span class="admin-hero-kicker">Internal Control Hub</span>
              <h1 class="admin-hero-title">Travel Nexus Admin & Moderation</h1>
              <p class="admin-hero-sub">Welcome back, <strong>${user.displayName || user.email}</strong>. Review incoming boutique listings, manage user privileges, and maintain curation standards.</p>
            </div>
            <div class="admin-header-actions">
              <span class="status-pill status-approved" style="font-size: 0.85rem; padding: 6px 14px;">🛡️ Superadmin Active</span>
            </div>
          </div>

          <!-- PLATFORM OVERVIEW STATS TILES -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-icon">⏳</div>
              <div class="admin-stat-num">${stats.pendingListings}</div>
              <div class="admin-stat-label">Pending Approval</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon">✅</div>
              <div class="admin-stat-num">${stats.approvedListings}</div>
              <div class="admin-stat-label">Published Listings</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon">👥</div>
              <div class="admin-stat-num">${stats.totalUsers}</div>
              <div class="admin-stat-label">Registered Accounts</div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon">🗺️</div>
              <div class="admin-stat-num">${stats.curatedDestinations}</div>
              <div class="admin-stat-label">Flagship Destinations</div>
            </div>
          </div>

          <!-- ADMIN NAVIGATION TABS -->
          <div class="admin-nav-tabs">
            <button class="admin-tab-btn ${this.activeTab === 'pending' ? 'active' : ''}" 
                    onclick="window.adminManager.switchTab('pending')">
              Moderation Queue (${pendingListings.length})
            </button>
            <button class="admin-tab-btn ${this.activeTab === 'approved' ? 'active' : ''}" 
                    onclick="window.adminManager.switchTab('approved')">
              Approved Listings (${approvedListings.length})
            </button>
            <button class="admin-tab-btn ${this.activeTab === 'users' ? 'active' : ''}" 
                    onclick="window.adminManager.switchTab('users')">
              User Accounts (${users.length})
            </button>
          </div>

          <!-- TAB CONTENT: PENDING LISTINGS -->
          <div id="adminTabContentPending" style="${this.activeTab === 'pending' ? 'display: block;' : 'display: none;'}">
            ${this.renderPendingQueueHTML(pendingListings)}
          </div>

          <!-- TAB CONTENT: APPROVED LISTINGS -->
          <div id="adminTabContentApproved" style="${this.activeTab === 'approved' ? 'display: block;' : 'display: none;'}">
            ${this.renderApprovedQueueHTML(approvedListings)}
          </div>

          <!-- TAB CONTENT: USERS ROSTER -->
          <div id="adminTabContentUsers" style="${this.activeTab === 'users' ? 'display: block;' : 'display: none;'}">
            ${this.renderUsersRosterHTML(users)}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="container section" style="text-align: center; margin: 40px auto;">
          <p class="text-danger">Failed to load admin data: ${err.message}</p>
          <button class="btn btn-primary" onclick="window.adminManager.render()">Retry</button>
        </div>
      `;
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  }

  renderPendingQueueHTML(pending) {
    if (!pending || pending.length === 0) {
      return `
        <div class="admin-empty-state">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🎉</div>
          <h3>Queue is All Clear!</h3>
          <p class="text-muted">No listings are currently pending moderation review.</p>
        </div>
      `;
    }

    return `
      <div class="admin-queue-list">
        ${pending.map(item => this.renderModerationCardHTML(item)).join('')}
      </div>
    `;
  }

  renderApprovedQueueHTML(approved) {
    if (!approved || approved.length === 0) {
      return `
        <div class="admin-empty-state">
          <p class="text-muted">No approved listings yet.</p>
        </div>
      `;
    }

    return `
      <div class="admin-queue-list">
        ${approved.map(item => `
          <div class="admin-mod-card">
            <div class="admin-mod-header">
              <div>
                <span class="status-pill status-approved">ACTIVE PUBLISHED</span>
                <h3 style="font-size: 1.25rem; margin-top: 6px;">${item.title}</h3>
                <span class="text-muted" style="font-size: 0.85rem;">Hosted by ${item.hostName || item.hostEmail} • ${item.location}</span>
              </div>
              <div>
                <button class="btn btn-outline btn-sm admin-reject-btn text-danger" data-listing-id="${item.id}">
                  Unpublish / Reject
                </button>
              </div>
            </div>
            <div style="display: flex; gap: 14px; margin-top: 14px; align-items: center;">
              <img src="${item.photos && item.photos[0] ? item.photos[0] : 'images/placeholder.jpg'}" alt="${item.title}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 6px;" />
              <p style="font-size: 0.9rem; color: var(--text-dark); margin: 0;">${item.tagline || item.description}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderUsersRosterHTML(users) {
    if (!users || users.length === 0) {
      return `
        <div class="admin-empty-state">
          <p class="text-muted">No registered users in database.</p>
        </div>
      `;
    }

    return `
      <div class="admin-users-table-wrapper">
        <table class="admin-users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Wishlist Items</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.displayName || 'Anonymous Member'}</strong></td>
                <td>${u.email}</td>
                <td><span class="status-pill status-${u.role || 'traveler'}">${(u.role || 'traveler').toUpperCase()}</span></td>
                <td>${u.wishlist ? u.wishlist.length : 0} items</td>
                <td><span class="badge-active">Active</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderModerationCardHTML(item) {
    const coordsStr = item.coordinates ? `${item.coordinates[0]}° N, ${item.coordinates[1]}° E` : 'Not specified';
    const photos = item.photos || [];

    return `
      <div class="admin-mod-card" id="mod-card-${item.id}">
        <div class="admin-mod-header">
          <div>
            <span class="status-pill status-pending">PENDING APPROVAL</span>
            <span class="admin-mod-type-pill">${(item.type || 'stay').toUpperCase()}</span>
            <h3 class="admin-mod-title">${item.title}</h3>
            <div class="admin-mod-meta">
              <span>Host: <strong>${item.hostName || item.hostEmail}</strong></span>
              <span>•</span>
              <span>${item.state || 'India'}</span>
              <span>•</span>
              <span>Submitted ${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'Recently'}</span>
            </div>
          </div>
          <div class="admin-mod-actions">
            <button type="button" class="btn btn-primary btn-sm admin-approve-btn" data-listing-id="${item.id}">
              ✓ Approve & Publish
            </button>
            <button type="button" class="btn btn-outline btn-sm admin-reject-btn text-danger" data-listing-id="${item.id}">
              ✕ Reject
            </button>
          </div>
        </div>

        <div class="admin-mod-details-grid">
          <div class="admin-mod-info-col">
            <p><strong>Category:</strong> ${item.category || 'Boutique'}</p>
            <p><strong>Tagline:</strong> "${item.tagline || ''}"</p>
            <p><strong>Location:</strong> ${item.location} (${coordsStr})</p>
            <p><strong>Price:</strong> ₹${(item.price || 0).toLocaleString('en-IN')} / ${item.type === 'dining' ? 'seat' : 'night'}</p>
            <p><strong>Description:</strong> ${item.description || ''}</p>
            
            ${item.dishes && item.dishes.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Specialty Dishes (${item.dishes.length}):</strong>
                <ul style="margin: 6px 0 0 16px; font-size: 0.85rem;">
                  ${item.dishes.map(d => `<li><strong>${d.name}</strong> (${d.diet}): ${d.description}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- UPLOADED PHOTOS GALLERY -->
            <div class="admin-mod-photos-label">Uploaded Photos (${photos.length}):</div>
            <div class="admin-mod-photos-strip">
              ${photos.map((url, idx) => `
                <a href="${url}" target="_blank" rel="noopener" title="Open full photo #${idx + 1}">
                  <img src="${url}" alt="Listing photo ${idx + 1}" class="admin-mod-photo-thumb" />
                </a>
              `).join('')}
            </div>
          </div>

          <!-- LIVE DESTINATION/STAY CARD PREVIEW (Exact site card markup contract) -->
          <div class="admin-mod-preview-col">
            <div class="admin-mod-preview-kicker">Live Visitor Card Preview</div>
            <article class="destination-card admin-live-preview-card">
              <div class="dest-img-box">
                <img src="${photos[0] || 'images/placeholder.jpg'}" alt="${item.title}" loading="lazy" />
                <div class="dest-price-badge">From <span>₹${(item.price || 0).toLocaleString('en-IN')}</span> /day</div>
                <div class="dest-wishlist-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
              </div>
              <div class="dest-content">
                <div class="dest-header">
                  <h3 class="dest-title">${item.title}</h3>
                  <div class="dest-rating">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span>5.0</span>
                  </div>
                </div>
                <div class="dest-region">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  ${item.location}
                </div>
                <p class="dest-tagline">${item.tagline || item.description}</p>
                <div class="dest-attractions-chips">
                  <span class="dest-chip">${item.category || 'Boutique'}</span>
                  <span class="dest-chip">${item.state || 'India'}</span>
                </div>
                <div class="dest-footer">
                  <div class="dest-time">Host: <strong>${(item.hostName || 'Verified').split(' ')[0]}</strong></div>
                  <button class="btn btn-outline btn-sm">Explore Guide</button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    `;
  }

  async handleApproveListing(listingId) {
    if (!listingId) return;
    try {
      window.showToast("Approving listing...", "info");
      await window.firebaseService.updateListingStatus(listingId, 'approved');
      window.showToast("Listing approved & published to live feed!", "success");
      await this.render();
    } catch (err) {
      window.showToast("Error approving listing: " + err.message, "error");
    }
  }

  async handleRejectListing(listingId) {
    if (!listingId) return;
    if (!confirm("Are you sure you want to reject/unpublish this listing?")) return;
    try {
      window.showToast("Updating listing status...", "info");
      await window.firebaseService.updateListingStatus(listingId, 'rejected');
      window.showToast("Listing rejected.", "info");
      await this.render();
    } catch (err) {
      window.showToast("Error rejecting listing: " + err.message, "error");
    }
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.AdminManager = AdminManager;
  window.adminManager = new AdminManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminManager };
}
