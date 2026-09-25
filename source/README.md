# Travel Nexus 🌿

> **Discover. Stay. Explore — All in One Place.**

[![Live on Vercel](https://img.shields.io/badge/Vercel-Live%20Deployment-black?style=flat&logo=vercel)](https://travelnexus.app)
[![Vercel Mirror](https://img.shields.io/badge/Vercel-travelnexus.vercel.app-blue?style=flat&logo=vercel)](https://travelnexus.vercel.app)

**Live Production URL**: [https://travelnexus.app](https://travelnexus.app)  
**Deployment Mirror**: [https://travelnexus.vercel.app](https://travelnexus.vercel.app)  
**Local Test Server**: `http://localhost:3000`

Travel Nexus is a modern, high-performance tourism and hospitality web platform built purely with vanilla HTML5, CSS3, and modern JavaScript (ES6+). Zero build steps, zero bundlers, and zero server-side rendering overhead.

---

## 🎨 Design & Aesthetic System
- **Style**: Warm Earthy Luxe (Boutique travel magazine meets modern interactive atlas).
- **Color Palette**:
  - Primary Terracotta (`#C85A32`)
  - Deep Aegean Teal (`#1B4944`)
  - Warm Cream / Linen (`#FAF8F5`)
  - Burnished Gold (`#D4A373`)
  - Charcoal Slate (`#1C2424`)
- **Typography**:
  - Headings: `Playfair Display` (classic editorial serif)
  - UI & Body: `Plus Jakarta Sans` (clean, readable modern sans-serif)
- **Visuals**: Glassmorphic sticky navigation, full-bleed Open Heritage parallax scrollytelling, interactive Leaflet markers, and responsive layouts.

---

## 🗺️ Key Features & Architecture

### 1. Interactive Leaflet.js Map & Clustering
- **Terracotta Pins**: Custom SVG map markers styled with Travel Nexus terracotta palette (`#C85A32`).
- **Cluster Markers**: Automatic grouping when markers are dense via Leaflet.markercluster with animated cluster pills.
- **Interactive Popups**: Rich preview cards featuring thumbnail, category, rating, starting price, location, and a direct click-through to the comprehensive destination/stay guide modal.
- **Reactive Filter Sync**: Category filter tabs and search input on the Destinations page dynamically update markers and auto-zoom to visible results.
- **Modal Mini-Maps**: Detail modals for Boutique Stays and Destinations automatically render an embedded Leaflet mini-map centered on exact geographic coordinates.

### 2. Authentic Indian States & Union Territories (`#states` & `#states/:slug`)
- **All 36 States & UTs Modeled**: Complete national directory covering all 28 States and 8 Union Territories. State count is always rendered dynamically (`${states.length} States & Union Territories`).
- **5 Flagship Deep-Dives**: Karnataka, Kerala, Rajasthan, Himachal Pradesh, and Goa feature authentic top 10 verified destinations with high-resolution imagery, historical taglines, highlights, and geographic coordinates.
- **Open Heritage Scrollytelling Hero**: Full-bleed iconic monument hero featuring fixed background parallax, subtle zoom, historical context badge, and smooth scroll cue transitioning directly into the top 10 destination cards.
- **Card Markup Contract**: Top 10 places and approved host listings strictly adhere to the established `.destination-card` and `.destinations-grid` component contracts.

### 3. Boutique Host Onboarding & Listing Creator (`#become-host`)
- **Interactive Pin Placement**: Embedded Leaflet map with a draggable terracotta marker allowing hosts to pinpoint exact property coordinates.
- **Listing Categorization**: Support for Boutique Stays (Heritage Haveli, Mountain Chalet, Backwater Houseboat, Eco Glamp, Plantation Homestay) and Artisan Dining.
- **Repeatable Specialty Dishes Builder**: Dynamic culinary menu builder for dining hosts (Dish Name, Description, Dietary Tag).
- **Media Upload Validation**: Client-side photo selector with a strict requirement of **at least 2 photos**, file size verification (< 5MB), and progress bar feedback.
- **Pending Moderation Queue**: Submitted listings are marked with `status: "pending"` to guard public feeds against unverified entries.

### 4. Authentication & Cloud Wishlist Sync (`#login` & `#account`)
- **Role-Based Modeling**: Traveler (default), Host, and Admin roles.
- **1-Click Testing Demos**: Instant test logins for Traveler, Host, and Admin roles for rapid evaluation without third-party email verification.
- **Cloud Wishlist Merging**: Syncs `localStorage` saved items with user's cloud profile on login, preserving saved places across browser sessions.
- **User Dashboard (`#account`)**: Displays profile information, host status, active and pending listings, and saved wishlist items.

### 5. Role-Protected Admin Moderation Dashboard (`#admin`)
- **Role Guard**: Access restricted to users with `role: "admin"` or emails present in `window.ADMIN_ALLOWLIST`. Unauthorized visitors are guided with an access-denied state.
- **Platform Analytics**: Live statistics on pending listings, approved listings, registered accounts, and curated destinations.
- **Moderation Queue**: Review incoming host listings with full metadata, photos gallery, and a **Live Visitor Card Preview** matching site cards byte-for-byte.
- **One-Click Actions**: "Approve & Publish" immediately injects approved listings into live visitor feeds; "Reject" removes unapproved listings.
- **User Roster**: Overview of all registered accounts, roles, and wishlist counters.

### 6. Nexus AI Real-Time Concierge (`js/chat.js` & `/api/nexus-ai-chat`)
- **Real-Time Token Streaming**: High-speed token-by-token streaming with typing cursor cadence and instant-finish click handling.
- **Live Weather Radar**: Real-time Open-Meteo API satellite integration across 35+ Indian cities with live temp (°C), humidity, wind, and packing advice.
- **Live Currency Converter**: Instant multi-currency math (INR, USD, EUR, GBP) with zero OTA commission comparison.
- **Interactive Action Cards**: Deep-linked "🛎️ Book Stay" modals, "❤️ Wishlist" toggles, and "🗺️ Plan Route" pre-filled itinerary routing directly in chat.
- **Voice STT & TTS**: Integrated Web Speech API microphone dictation and SpeechSynthesis voice narration with header toggle (`🔊`/`🔇`).
- **Category Filter Tabs & Markdown Export**: Domain tabs (Weather, Stays, Food, Currency, Trains) and 1-click Markdown itinerary download.
- **Collision Guard**: Automatically docks and minimizes when travelers navigate to the Host Onboarding wizard (`#become-host`).

### 7. Native PWA Offline Architecture (`manifest.json` & `sw.js`)
- **PWA Substitution**: To avoid native app overhead while providing robust mobile functionality, Travel Nexus operates as an installable Progressive Web App (PWA) with a cache-first service worker (`sw.js`) and web app manifest (`manifest.json`).
- **Offline Resilience**: Automatically caches application shells, Leaflet maps, saved wishlists, and state guides for instant access in remote, low-connectivity mountain passes and coastal areas.

### 8. Interactive HTML5 Drag-and-Drop AI Itinerary Planner (`#planner`)
- **Dual-View Architecture**: Toggle seamlessly between classic vertical timeline view and interactive Kanban-style day columns.
- **Native Drag-and-Drop**: Built using native HTML5 Drag and Drop API with zero external library overhead.
- **Deep-Link Social Sharing**: Generates shareable itinerary URLs containing base64-encoded itinerary state and social card metadata.

### 9. 4-Step Host Onboarding Wizard & Local Guide Experience (`#become-host`)
- **Multi-Step Progression**: Step 1: Listing Details & Category; Step 2: Pricing, Cancellation Policy & Location (Geolocation + debounced Nominatim reverse geocoding + 360px map); Step 3: Photos & Signature Dishes / Guide Credentials; Step 4: Live Card Review & Heritage Charter.
- **Third Listing Category**: "Local Guide Experience" alongside Boutique Stays and Regional Dining.
- **Cancellation Policies**: Flexible (100% refund up to 48h), Moderate (50% refund up to 7 days), and Strict (no refund within 14 days) synced directly with Hotels & Stays sidebar filters.

### 10. Professional Tourism Ambiance Themes (☀️ Ivory · 🌙 Midnight · 🌿 Sanctuary)
- **Official Tourism Utility Bar**: Fixed top strip featuring official Incredible India partnership markers, zero-commission guarantee, and segmented theme switcher.
- **Three Curated Modes**: Daylight Ivory (default warm linen & terracotta), Midnight Obsidian Luxe (dark luxury hospitality mode), and Emerald Sanctuary (eco-tourism rainforest mode).
- **Anti-FOUC Engine**: Synchronous head script reading `localStorage` and system preferences before CSS rendering.

---

## ☁️ Deploying to Vercel

Travel Nexus is architected for zero-build static hosting with serverless API capabilities:

1. **Production Deployment (`vercel.json`)**:
   Includes clean URLs, caching headers, and scheduled crons for `/api/send-reminder`.
2. **Serverless Endpoints**:
   - `/api/nexus-ai-chat`: AI Concierge endpoint.
   - `/api/send-reminder`: Vercel Cron worker checking upcoming itinerary dates.

---

---

## 🗄️ Database & Nexus AI Architecture (Prisma + PostgreSQL)

Travel Nexus features a production-ready relational persistence layer powered by **Prisma ORM** and **PostgreSQL** (optimized for [Neon](https://neon.tech) serverless connections), combined with a context-aware **Nexus AI Concierge**.

### 1. Database Schema (`prisma/schema.prisma`)
- **`User`**: Account profiles, bcrypt password hashes, roles (`traveler`, `host`, `admin`), relations to Wishlist and ChatMessage.
- **`Listing`**: Verified boutique stays, artisan dining tables, and certified guides with pricing, lat/lng coordinates, specialty tags, photos, and approval status (`pending`, `approved`, `rejected`).
- **`Review`**: Authentic traveler reviews linked to listings with ratings, comments, and host responses.
- **`Wishlist`**: Saved sanctuaries unique to `(userId, listingId)`.
- **`ChatMessage`**: Persisted conversation thread keyed by `sessionId` (for anonymous visitors) or `userId` (for logged-in travelers).

### 2. Serverless API Routes (`/api`)
- `POST /api/auth/register` — bcrypt hashing, JWT issuance in httpOnly cookie.
- `POST /api/auth/login` — user authentication and session creation.
- `POST /api/auth/logout` — clears session cookie.
- `GET /api/auth/me` — validates active JWT session and returns user profile & wishlist.
- `GET /api/listings` — retrieves approved or pending listings with optional `?status=` filter.
- `POST /api/listings` — creates a new host listing in `pending` status.
- `GET|PATCH /api/listings/:id` — single listing detail and admin moderation approval/rejection.
- `GET|POST /api/listings/:id/reviews` — fetch and post verified traveler reviews.
- `GET|POST /api/wishlist` — fetch or toggle items in user's cloud wishlist.
- `GET /api/admin/stats` & `/api/admin/users` — admin metrics and user management.
- `GET|POST /api/nexus-ai-chat` — AI Concierge with DB grounding, personalization, and conversation persistence.

---

## 🚀 Deploying with a Live Database (Step-by-Step)

### Step 1: Provision a PostgreSQL Database on Neon
1. Go to [neon.tech](https://neon.tech) and create a free PostgreSQL project (e.g. `travelnexus-db`).
2. Copy the pooled connection string:
   ```env
   DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

### Step 2: Configure Environment Variables in Vercel
In the [Vercel Dashboard](https://vercel.com) under **Project Settings > Environment Variables** (or via `vercel env add`), add:
- `DATABASE_URL` = your Neon PostgreSQL connection string (Production & Preview).
- `JWT_SECRET` = secure random secret string (e.g. `openssl rand -base64 32`).
- `ADMIN_ALLOWLIST` = `admin@travelnexus.app` (comma-separated list of emails auto-assigned the admin role).
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (optional: if omitted, the resilient multi-intent domestic DB grounding engine operates out-of-the-box).

### Step 3: Run Database Migrations & Seed
Run migrations against the production database:
```bash
# Apply schema to production database
npx prisma migrate deploy

# Seed initial boutique listings, reviews, and default test accounts
npm run prisma:seed
```

### Step 4: Deploy to Vercel Production
```bash
npm run deploy
# Or: npx vercel --prod --yes
```

### Step 5: Verification Checklist
1. **User Sign Up / In**: Visit `#login` and sign up or use 1-click test buttons (`traveler@travelnexus.app`, `admin@travelnexus.app`).
2. **Host Submission**: Go to `#become-host` and submit a listing with photos and coordinates.
3. **Admin Moderation**: Sign in as Admin, visit `#admin`, review the pending listing, and click **Approve**.
4. **Wishlist Sync**: Click the ❤️ button on any stay card, refresh the browser, and confirm the item stays saved.
5. **Context-Aware AI Chat**: Open the bottom-right Nexus AI bubble, ask about mountain retreats or Kerala backwaters, refresh the page, and confirm past conversation context persists.

---

## 📁 Project Directory Structure
```
├── index.html              # Main HTML5 application document & view containers
├── manifest.json           # PWA Web App Manifest
├── sw.js                   # PWA Service Worker with cache-first routing
├── package.json            # Scripts & project metadata
├── vercel.json             # Vercel rewrites, caching & cron configuration
├── .env.example            # Environment variables reference template
├── prisma/
│   ├── schema.prisma       # Prisma models (User, Listing, Review, Wishlist, ChatMessage)
│   └── seed.js             # Initial database seeder
├── api/
│   ├── _lib/
│   │   ├── prisma.js       # Singleton Prisma Client for serverless environments
│   │   └── auth.js         # JWT signing/verification & httpOnly cookie helpers
│   ├── auth/
│   │   ├── register.js     # User registration endpoint
│   │   ├── login.js        # User login endpoint
│   │   ├── logout.js       # User logout endpoint
│   │   └── me.js           # Session profile verification
│   ├── listings/
│   │   ├── index.js        # GET/POST listings
│   │   ├── detail.js       # GET single listing / PATCH status
│   │   └── reviews.js      # GET/POST reviews
│   ├── admin/
│   │   ├── stats.js        # Platform statistics for admin dashboard
│   │   └── users.js        # User list for admin dashboard
│   ├── wishlist.js         # GET/POST wishlist toggle
│   ├── nexus-ai-chat.js    # Grounded, context-aware AI Concierge endpoint
│   └── send-reminder.js    # Vercel Cron scheduled reminder worker
├── css/
│   ├── variables.css       # Design tokens (Ivory, Midnight, Emerald themes)
│   ├── base.css            # CSS reset, utilities, animations
│   ├── components.css      # Top bar, navbar, cards, search bar, modals, chat, toasts
│   ├── pages.css           # View layouts, states grid, hero, host wizard & planner
│   └── responsive.css      # Mobile navigation & responsive breakpoints
└── js/
    ├── firebase-service.js # Unified database service calling serverless /api routes
    ├── auth.js             # Authentication, user account & Nexus Points controller
    ├── data.js             # Curated destinations & boutique stays with coordinates
    ├── states-data.js      # Complete 36 States & UTs data model with 5 flagship top-10s
    ├── map.js              # Leaflet.js interactive map, clustering, and mini-maps
    ├── states.js           # States directory & Open-Meteo weather controller
    ├── host.js             # 4-Step host wizard & geocoding controller
    ├── admin.js            # Admin moderation dashboard with live preview card
    ├── router.js           # Hash router with dynamic #states/:slug & #evisa support
    ├── filters.js          # Search, filters, cancellation filter & experience bundles
    ├── planner.js          # AI Drag-and-Drop Itinerary generation engine
    ├── modals.js           # Booking, table reservations, reviews & mini-map triggers
    ├── chat.js             # Context-aware Nexus AI concierge widget controller
    ├── scroll-reveal.js    # Smooth scroll animation triggers
    └── app.js              # ThemeManager, bootstrapper & global event handlers
```

---

## 🛡️ License & Credits
- **Brand**: Travel Nexus Hospitality Inc.
- **Images**: Authentic domestic Indian travel photography collections.
- **Maps**: &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, rendered via [Leaflet.js](https://leafletjs.com/).
- **Live Production URL**: [https://travelnexus.app](https://travelnexus.app) (Mirror: [https://travelnexus.vercel.app](https://travelnexus.vercel.app))

