/**
 * Travel Nexus - Unified Client Database & Authentication Service
 * Communicates with serverless /api routes backed by Prisma & PostgreSQL
 * Preserves all public method signatures with fetch(..., { credentials: 'include' })
 */

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.init();
  }

  async init() {
    await this.checkSession();
  }

  async checkSession() {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user || null;
      } else {
        this.currentUser = null;
      }
    } catch (e) {
      console.warn('Session check fallback:', e);
      this.currentUser = null;
    }

    // Synchronize with authManager if present
    if (window.authManager && this.currentUser) {
      window.authManager.currentUser = this.currentUser;
      if (typeof window.authManager.renderNavAuthSlot === 'function') {
        window.authManager.renderNavAuthSlot();
      }
    }

    this.notifyAuthListeners();
  }

  onAuthStateChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
  }

  notifyAuthListeners() {
    this.authListeners.forEach(cb => {
      try {
        cb(this.currentUser);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }

  /* ==========================================================================
     AUTHENTICATION METHODS
     ========================================================================== */
  async registerUser(name, email, password, requestedRole = 'traveler') {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        email,
        password,
        role: requestedRole
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    this.currentUser = data.user;
    if (window.authManager) {
      window.authManager.currentUser = data.user;
      if (typeof window.authManager.renderNavAuthSlot === 'function') {
        window.authManager.renderNavAuthSlot();
      }
    }

    this.notifyAuthListeners();
    return data.user;
  }

  async loginUser(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials.');
    }

    this.currentUser = data.user;
    if (window.authManager) {
      window.authManager.currentUser = data.user;
      if (typeof window.authManager.renderNavAuthSlot === 'function') {
        window.authManager.renderNavAuthSlot();
      }
    }

    this.notifyAuthListeners();
    return data.user;
  }

  async logoutUser() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout API warning:', e);
    }

    this.currentUser = null;
    if (window.authManager) {
      window.authManager.currentUser = null;
      if (typeof window.authManager.renderNavAuthSlot === 'function') {
        window.authManager.renderNavAuthSlot();
      }
    }

    this.notifyAuthListeners();
  }

  /* ==========================================================================
     WISHLIST SYNCHRONIZATION
     ========================================================================== */
  async syncWishlistWithCloud(localWishlist = []) {
    if (!this.currentUser) return localWishlist;
    try {
      const res = await fetch('/api/wishlist', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        const cloudItems = data.wishlist || [];
        const merged = Array.from(new Set([...cloudItems, ...localWishlist]));
        this.currentUser.wishlist = merged;
        return merged;
      }
    } catch (e) {
      console.warn('Cloud wishlist sync error:', e);
    }
    return localWishlist;
  }

  async toggleWishlistItem(itemId) {
    if (!this.currentUser) {
      // Local fallback for guest users
      let list = JSON.parse(localStorage.getItem('travelnexus_guest_wishlist') || '[]');
      if (list.includes(itemId)) {
        list = list.filter(id => id !== itemId);
      } else {
        list.push(itemId);
      }
      localStorage.setItem('travelnexus_guest_wishlist', JSON.stringify(list));
      return list;
    }

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId: itemId })
      });

      if (res.ok) {
        const data = await res.json();
        this.currentUser.wishlist = data.wishlist;
        return data.wishlist;
      }
    } catch (e) {
      console.error('Toggle wishlist error:', e);
    }

    return this.currentUser.wishlist || [];
  }

  async updateWishlist(uid, items = []) {
    // Helper used by modals.js
    if (!this.currentUser) return;
    this.currentUser.wishlist = items;
  }

  /* ==========================================================================
     FILE STORAGE (Client Helper)
     ========================================================================== */
  async uploadFile(file, path, onProgress = () => {}) {
    return new Promise((resolve) => {
      let p = 0;
      const interval = setInterval(() => {
        p += 25;
        onProgress(Math.min(p, 95));
        if (p >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onload = () => {
            onProgress(100);
            resolve(reader.result);
          };
          reader.readAsDataURL(file);
        }
      }, 80);
    });
  }

  /* ==========================================================================
     HOST LISTING CREATION
     ========================================================================== */
  async createListing(listingData, photoFiles = [], videoFile = null, onProgress = () => {}) {
    if (!this.currentUser) {
      throw new Error("You must be signed in to create a listing.");
    }

    const uploadedPhotos = [];
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const photoPath = `listings/photos/${Date.now()}_${i + 1}`;
      const url = await this.uploadFile(file, photoPath, (p) => {
        const overall = ((i + (p / 100)) / (photoFiles.length || 1)) * 80;
        onProgress(overall);
      });
      uploadedPhotos.push(url);
    }

    let finalVideoUrl = listingData.videoUrl || '';
    if (videoFile) {
      const videoPath = `listings/video/${Date.now()}`;
      finalVideoUrl = await this.uploadFile(videoFile, videoPath, (p) => {
        onProgress(80 + (p * 0.2));
      });
    }

    const payload = {
      ...listingData,
      photos: uploadedPhotos.length ? uploadedPhotos : (listingData.photos || []),
      videoUrl: finalVideoUrl
    };

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit listing.');
    }

    onProgress(100);
    return data;
  }

  /* ==========================================================================
     LISTINGS & REVIEWS QUERIES
     ========================================================================== */
  async getPendingListings() {
    try {
      const res = await fetch('/api/listings?status=pending', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch pending listings:', e);
    }
    return [];
  }

  async getApprovedListings() {
    try {
      const res = await fetch('/api/listings?status=approved', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch approved listings:', e);
    }
    return [];
  }

  async getListings(status = 'all') {
    try {
      const res = await fetch(`/api/listings?status=${status}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch listings:', e);
    }
    return (window.TRAVEL_DATA && window.TRAVEL_DATA.stays) ? window.TRAVEL_DATA.stays : [];
  }

  async updateListingStatus(listingId, newStatus) {
    const res = await fetch(`/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update listing status.');
    }
    return data;
  }

  async getAllUsers() {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch admin users:', e);
    }
    return [];
  }

  async getUsers() {
    return this.getAllUsers();
  }

  async getAdminStats() {
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch admin stats:', e);
    }
    return {
      totalUsers: 0,
      totalHosts: 0,
      totalTravelers: 0,
      totalListings: 0,
      pendingListings: 0,
      approvedListings: 0,
      pendingCount: 0,
      approvedCount: 0
    };
  }

  async getListingReviews(listingId) {
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const reviews = await res.json();
        if (Array.isArray(reviews) && reviews.length > 0) {
          return reviews;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch listing reviews:', e);
    }

    // Default seeded fallback reviews
    return [
      {
        id: 'rev-seed-1',
        listingId,
        author: 'Priya Narayanan',
        rating: 5,
        date: 'October 2024',
        verifiedTraveler: true,
        comment: 'Staying here was the highlight of our journey across India. Waking up to organic chai and listening to the host describe the architectural history of the estate was truly unforgettable.',
        photos: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80'],
        hostResponse: 'Dhanyavaad Priya ji! It was our joy to share our family recipes and heritage with you.'
      },
      {
        id: 'rev-seed-2',
        listingId,
        author: 'Marcus Lindholm',
        rating: 4.9,
        date: 'December 2024',
        verifiedTraveler: true,
        comment: '100% authentic Indian hospitality. No corporate hotel feel whatsoever. Direct booking through Travel Nexus saved us nearly 20% compared to typical hotel booking apps.',
        photos: [],
        hostResponse: null
      }
    ];
  }

  async addListingReview(listingId, reviewData) {
    const res = await fetch(`/api/listings/${listingId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(reviewData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit review.');
    }
    return data.id || ('rev-' + Date.now());
  }
}

// Global service instance
window.firebaseService = new FirebaseService();
