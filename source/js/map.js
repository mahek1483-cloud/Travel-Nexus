/**
 * Travel Nexus - Interactive Leaflet.js Map Manager
 * Handles main interactive India map, marker clustering, category filtering synchronization,
 * custom terracotta pin styling, popup cards, and modal mini-maps for stays and dining.
 */

class MapManager {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.miniMaps = new Map();
    this.defaultCenter = [22.3511, 78.6677]; // Geographic center of India
    this.defaultZoom = 5;
    this.terracottaColor = '#C85A32';
  }

  createTerracottaIcon(isStay = false) {
    if (typeof L === 'undefined') return null;
    const glyph = isStay ? '🏠' : '📍';
    const svgIcon = `
      <div class="custom-map-pin ${isStay ? 'pin-stay' : 'pin-dest'}" style="
        background: var(--color-terracotta, #C85A32);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid #FFFFFF;
        cursor: pointer;
      ">
        <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold; line-height: 1;">${glyph}</span>
      </div>
    `;

    return L.divIcon({
      className: 'terracotta-marker-wrapper',
      html: svgIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  }

  initMainMap(containerId = 'destinationsMap') {
    if (typeof L === 'undefined') {
      console.warn('Leaflet.js is not loaded.');
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // If map already initialized, invalidate size and return
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 150);
      return;
    }

    this.map = L.map(containerId, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      minZoom: 4,
      maxZoom: 18,
      scrollWheelZoom: false,
      preferCanvas: true
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors | Travel Nexus',
      maxZoom: 19
    }).addTo(this.map);

    // Initialize marker cluster or feature group
    if (typeof L.markerClusterGroup === 'function') {
      this.markersGroup = L.markerClusterGroup({
        maxClusterRadius: 40,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        chunkedLoading: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div class="map-cluster-pill">${count}</div>`,
            className: 'custom-cluster-marker',
            iconSize: [36, 36]
          });
        }
      });
    } else {
      this.markersGroup = L.featureGroup();
    }

    this.map.addLayer(this.markersGroup);

    // Initial populate from TRAVEL_DATA
    if (window.TRAVEL_DATA && window.TRAVEL_DATA.destinations) {
      this.updateMarkers(window.TRAVEL_DATA.destinations);
    }

    // Delayed size invalidation for smooth display
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 150);
  }

  updateMarkers(destinations = []) {
    if (!this.map || !this.markersGroup) return;

    this.markersGroup.clearLayers();

    const bounds = [];
    const markersList = [];

    destinations.forEach(item => {
      if (!item.coordinates || !Array.isArray(item.coordinates) || item.coordinates.length !== 2) {
        return;
      }

      const [lat, lng] = item.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const marker = L.marker([lat, lng], {
        icon: this.createTerracottaIcon(false),
        title: item.name
      });

      const popupContent = `
        <div class="map-popup-card">
          <img src="${item.image}" alt="${item.alt || item.name}" class="map-popup-img" loading="lazy" decoding="async" />
          <div class="map-popup-body">
            <span class="map-popup-cat">${item.category || 'Destination'}</span>
            <h4 class="map-popup-title">${item.name}</h4>
            <div class="map-popup-meta">
              <span>★ ${item.rating || '4.9'}</span>
              <span>•</span>
              <span>₹${(item.startingPrice || 0).toLocaleString('en-IN')}/day</span>
            </div>
            <p class="map-popup-region">${item.region || ''}</p>
            <button class="map-popup-btn" onclick="window.modalManager.openDestinationModal('${item.id}')">
              Explore Guide →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 240,
        className: 'custom-leaflet-popup'
      });

      markersList.push(marker);
      bounds.push([lat, lng]);
    });

    if (markersList.length > 0) {
      if (typeof this.markersGroup.addLayers === 'function') {
        this.markersGroup.addLayers(markersList);
      } else {
        markersList.forEach(m => this.markersGroup.addLayer(m));
      }
    }

    if (bounds.length > 0 && this.map) {
      if (bounds.length === 1) {
        this.map.setView(bounds[0], 9);
      } else {
        this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      }
    }
  }

  renderMiniMap(containerId, coords, title = '') {
    if (typeof L === 'undefined') return null;

    const container = document.getElementById(containerId);
    if (!container) return null;

    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      container.innerHTML = '<div class="mini-map-fallback">Map location unavailable</div>';
      return null;
    }

    const [lat, lng] = coords;

    // Destroy existing instance in this container if any
    if (this.miniMaps.has(containerId)) {
      try {
        const oldMap = this.miniMaps.get(containerId);
        oldMap.remove();
      } catch (err) {
        console.warn('Error removing existing mini-map:', err);
      }
      this.miniMaps.delete(containerId);
    }

    container.innerHTML = '';

    const miniMap = L.map(containerId, {
      center: [lat, lng],
      zoom: 13,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18
    }).addTo(miniMap);

    const marker = L.marker([lat, lng], {
      icon: this.createTerracottaIcon(true)
    }).addTo(miniMap);

    if (title) {
      marker.bindPopup(`<strong>${title}</strong>`).openPopup();
    }

    this.miniMaps.set(containerId, miniMap);

    setTimeout(() => {
      miniMap.invalidateSize();
    }, 150);

    return miniMap;
  }

  invalidateSize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 100);
    }
  }
}

// Global instance
if (typeof window !== 'undefined') {
  window.MapManager = MapManager;
  window.mapManager = new MapManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MapManager };
}
