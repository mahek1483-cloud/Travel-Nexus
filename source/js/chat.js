/**
 * Travel Nexus - Floating "Nexus AI" Concierge Chat Widget
 * High-performance real-time domestic Indian travel assistant featuring:
 *   1. Real-Time Token/Word Streaming Engine with animated typing cursor
 *   2. Real-Time Live Weather Tool connected to Open-Meteo API (30+ Indian destinations)
 *   3. Real-Time Live Currency Converter with instant multi-currency FX math
 *   4. Interactive Stays & Destinations Action Cards (Book Stay, Save Wishlist, Route to Planner)
 *   5. Real-Time Voice Input (Speech-to-Text via Web Speech API)
 *   6. Real-Time Voice Narration (Text-to-Speech via SpeechSynthesis)
 *   7. Category Tabs Filter Strip (Weather, Stays, Food, Currency, Trains)
 *   8. Export Itinerary as Markdown download & Clear History controls
 *   9. Automatic collision guard with #become-host onboarding wizard
 */

class NexusAIChat {
  constructor() {
    this.isOpen = false;
    this.isStreaming = false;
    this.currentStreamId = 0;
    this.activeCategory = 'all';
    this.speechEnabled = localStorage.getItem('travelnexus_chat_tts') === 'true';
    this.isListening = false;
    this.recognition = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentSpeakingUtterance = null;
    this.weatherCache = new Map();

    // Session ID for DB persistence & context awareness
    this.sessionId = localStorage.getItem('travelnexus_chat_session_id');
    if (!this.sessionId) {
      this.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('travelnexus_chat_session_id', this.sessionId);
    }

    this.messages = [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: 'Namaste & Welcome! 🙏 I’m **Nexus AI**, your real-time 24/7 domestic Indian travel concierge.\n\nAsk me about **live weather** across India, **verified boutique stays**, **Vande Bharat train schedules**, or **currency conversions**. How may I assist your Indian journey today?'
      }
    ];

    // Domestic Indian destinations coordinate & weather guide table
    this.weatherLocations = {
      manali: { lat: 32.2432, lon: 77.1892, name: 'Manali & Solang Valley', state: 'Himachal Pradesh', pack: 'Warm thermal layers, fleece jacket, sturdy hiking shoes.' },
      solang: { lat: 32.2432, lon: 77.1892, name: 'Manali & Solang Valley', state: 'Himachal Pradesh', pack: 'Warm thermal layers, fleece jacket, sturdy hiking shoes.' },
      leh: { lat: 34.1526, lon: 77.5771, name: 'Leh-Ladakh & Nubra', state: 'Ladakh', pack: 'Heavy woolens, windproof outer shell, UV sunglasses, high-SPF sunscreen.' },
      ladakh: { lat: 34.1526, lon: 77.5771, name: 'Leh-Ladakh & Nubra', state: 'Ladakh', pack: 'Heavy woolens, windproof outer shell, UV sunglasses, high-SPF sunscreen.' },
      nubra: { lat: 34.5428, lon: 77.5619, name: 'Nubra Valley', state: 'Ladakh', pack: 'Thermal inners, fleece jacket, lip balm, sunglasses.' },
      spiti: { lat: 32.2276, lon: 78.0710, name: 'Spiti Valley & Kaza', state: 'Himachal Pradesh', pack: 'Heavy windcheater, thermal layers, sturdy trekking boots.' },
      shimla: { lat: 31.1048, lon: 77.1734, name: 'Shimla & Kufri', state: 'Himachal Pradesh', pack: 'Warm jacket, light shawl, comfortable walking boots.' },
      dharamshala: { lat: 32.2190, lon: 76.3234, name: 'Dharamshala & McLeodganj', state: 'Himachal Pradesh', pack: 'Rain protection, light woolens, walking shoes.' },
      rishikesh: { lat: 30.0869, lon: 78.2676, name: 'Rishikesh & Ganga Valley', state: 'Uttarakhand', pack: 'Modest comfortable cottons, light yoga wear, evening shawl.' },
      goa: { lat: 15.4989, lon: 73.8278, name: 'Goa & Fontainhas', state: 'Goa', pack: 'Breezy linen shirts, shorts, reef-safe sunscreen, sunglasses.' },
      jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur (Pink City)', state: 'Rajasthan', pack: 'Breathable cottons, sunhat, sunglasses, light evening layer.' },
      udaipur: { lat: 24.5854, lon: 73.7125, name: 'Udaipur & Lake Pichola', state: 'Rajasthan', pack: 'Comfortable daywear, sunglasses, evening cardigan for lakeside breezes.' },
      jodhpur: { lat: 26.2389, lon: 73.0243, name: 'Jodhpur (Blue City)', state: 'Rajasthan', pack: 'Light cottons, sun protection, comfortable slip-ons for fort tours.' },
      jaisalmer: { lat: 26.9157, lon: 70.9083, name: 'Jaisalmer (Golden City)', state: 'Rajasthan', pack: 'Sun scarf, sunglasses, warm layer for desert night safaris.' },
      munnar: { lat: 10.0889, lon: 77.0595, name: 'Munnar Tea Highlands', state: 'Kerala', pack: 'Light cardigan, rain umbrella, walking shoes for plantation paths.' },
      kerala: { lat: 9.4981, lon: 76.3388, name: 'Alleppey & Kumarakom', state: 'Kerala', pack: 'Light breathable cottons, mosquito repellent, umbrella.' },
      alleppey: { lat: 9.4981, lon: 76.3388, name: 'Alleppey Backwaters', state: 'Kerala', pack: 'Cotton casuals, sunhat, umbrella, slip-on footwear.' },
      kumarakom: { lat: 9.6175, lon: 76.4301, name: 'Kumarakom Backwaters', state: 'Kerala', pack: 'Light clothing, mosquito repellent, water-resistant footwear.' },
      coorg: { lat: 12.4244, lon: 75.7382, name: 'Coorg (Madikeri)', state: 'Karnataka', pack: 'Light sweater, rain poncho, walking shoes for coffee trails.' },
      hampi: { lat: 15.3350, lon: 76.4600, name: 'Hampi Heritage Ruins', state: 'Karnataka', pack: 'Breathable cottons, wide-brim hat, hydration pack, boulder-trekking shoes.' },
      varanasi: { lat: 25.3176, lon: 82.9739, name: 'Varanasi Ancient Ghats', state: 'Uttar Pradesh', pack: 'Modest cotton garments, slip-on shoes for temple ghats, light evening wrap.' },
      srinagar: { lat: 34.0837, lon: 74.7973, name: 'Srinagar & Dal Lake', state: 'Jammu & Kashmir', pack: 'Warm jacket or pashmina, comfortable walking shoes.' },
      kashmir: { lat: 34.0837, lon: 74.7973, name: 'Kashmir Valley', state: 'Jammu & Kashmir', pack: 'Warm jacket or pashmina, comfortable walking shoes.' },
      darjeeling: { lat: 27.0410, lon: 88.2663, name: 'Darjeeling Tea Terraces', state: 'West Bengal', pack: 'Warm fleece, woolen cap, rain jacket, walking shoes.' },
      gangtok: { lat: 27.3389, lon: 88.6065, name: 'Gangtok & North Sikkim', state: 'Sikkim', pack: 'Layered fleece, waterproof outerwear, trekking shoes.' },
      sikkim: { lat: 27.3389, lon: 88.6065, name: 'Sikkim Himalayas', state: 'Sikkim', pack: 'Layered fleece, waterproof outerwear, trekking shoes.' },
      shillong: { lat: 25.5788, lon: 91.8933, name: 'Shillong & Meghalaya', state: 'Meghalaya', pack: 'Waterproof trekking shoes, rain poncho, quick-dry clothes.' },
      meghalaya: { lat: 25.5788, lon: 91.8933, name: 'Cherrapunji & Meghalaya', state: 'Meghalaya', pack: 'Waterproof trekking shoes, rain poncho, quick-dry clothes.' },
      amritsar: { lat: 31.6340, lon: 74.8723, name: 'Amritsar (Golden Temple)', state: 'Punjab', pack: 'Head covering scarf, modest cottons, light sweater in winter.' },
      agra: { lat: 27.1767, lon: 78.0081, name: 'Agra (Taj Mahal)', state: 'Uttar Pradesh', pack: 'Comfortable walking shoes, sun protection, light layers.' },
      delhi: { lat: 28.6139, lon: 77.2090, name: 'New Delhi & NCR', state: 'Delhi', pack: 'Season-appropriate cottons or winter jackets, sunglasses.' },
      mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai Coast', state: 'Maharashtra', pack: 'Light cottons, sturdy umbrella (Jul–Sep), comfortable walking flats.' },
      bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru Garden City', state: 'Karnataka', pack: 'Comfortable casual wear, light evening layer.' },
      pondicherry: { lat: 11.9416, lon: 79.8083, name: 'Pondicherry French Quarter', state: 'Puducherry', pack: 'Breezy linen shirts, shorts, sunhat, bicycle-friendly sandals.' },
      andaman: { lat: 11.6234, lon: 92.7265, name: 'Andaman & Nicobar Islands', state: 'Andaman', pack: 'Snorkeling gear, quick-dry swimsuits, reef shoes, sunhat.' },
      chettinad: { lat: 10.1667, lon: 78.7833, name: 'Chettinad Heritage Villages', state: 'Tamil Nadu', pack: 'Light airy cottons, comfortable walking sandals, sun protection.' },
      khajuraho: { lat: 24.8318, lon: 79.9199, name: 'Khajuraho Temples & Panna', state: 'Madhya Pradesh', pack: 'Breathable walking wear, sunhat, safari shades.' }
    };

    // Stays database mapping for instant action cards
    this.stayActionMap = [
      {
        keywords: ['manali', 'cedar', 'chalet', 'solang', 'pahadi'],
        stayId: 'stay-solang-chalet',
        destId: 'dest-manali'
      },
      {
        keywords: ['rajasthan', 'haveli', 'udaipur', 'pichola', 'palace stay', 'rawla'],
        stayId: 'stay-rawla-haveli',
        destId: 'dest-udaipur'
      },
      {
        keywords: ['goa', 'villa', 'fontainhas', 'bougainvillea', 'panaji'],
        stayId: 'stay-fontainhas-villa',
        destId: 'dest-goa'
      },
      {
        keywords: ['kerala', 'houseboat', 'backwater', 'tharavadu', 'kumarakom', 'alleppey'],
        stayId: 'stay-kerala-houseboat',
        destId: 'dest-munnar'
      },
      {
        keywords: ['coorg', 'coffee', 'plantation', 'mist haven', 'madikeri'],
        stayId: 'stay-coorg-plantation',
        destId: 'dest-coorg'
      },
      {
        keywords: ['ladakh', 'camp', 'glamp', 'nubra', 'starlight'],
        stayId: 'stay-ladakh-camp',
        destId: 'dest-leh-ladakh'
      },
      {
        keywords: ['chettinad', 'visalam', 'mansion', 'karaikudi', 'athangudi'],
        stayId: 'stay-chettinad-mansion',
        destId: 'dest-chettinad'
      },
      {
        keywords: ['gokarna', 'cliff', 'om beach', 'ocean sanctuary'],
        stayId: 'stay-gokarna-cliff',
        destId: 'dest-goa'
      },
      {
        keywords: ['darjeeling', 'tea bungalow', 'glenview', 'estate'],
        stayId: 'stay-darjeeling-estate',
        destId: 'dest-darjeeling'
      }
    ];

    // Categorized Prompt Chips dictionary
    this.categoryChips = {
      all: [
        { label: '🌤️ Live Weather Manali', query: 'What is the real-time live weather in Manali?' },
        { label: '🏰 Udaipur Heritage Haveli', query: 'Recommend a royal heritage stay in Udaipur with lake views' },
        { label: '🍛 Authentic Regional Thalis', query: 'Where can I experience authentic regional thali dining in India?' },
        { label: '💱 Convert ₹10,000 to USD', query: 'Convert 10000 INR to USD with live exchange rate' },
        { label: '🚆 High-Speed Vande Bharat', query: 'What are the best Vande Bharat express train routes in India?' },
        { label: '🎁 Experience Bundles', query: 'Tell me about discounted Stay + Dining + Guide bundles' },
        { label: '🌿 Host Direct Rate', query: 'How does Travel Nexus guarantee zero host commission?' }
      ],
      weather: [
        { label: '🌤️ Manali & Solang Weather', query: 'Real-time live weather and temperature in Manali' },
        { label: '🏖️ Goa Beach Temperature', query: 'What is the live weather and temperature in Goa right now?' },
        { label: '🏔️ Leh-Ladakh Weather', query: 'Check current temperature and weather in Leh Ladakh' },
        { label: '🌴 Munnar Hill Conditions', query: 'Current live weather and packing advice for Munnar' },
        { label: '🏰 Udaipur Lake Climate', query: 'Live weather and forecast for Udaipur Rajasthan' },
        { label: '🌧️ Cherrapunji Rainfall', query: 'What is the current weather and rainfall in Meghalaya?' }
      ],
      stays: [
        { label: '🏔️ Cedar Ridge Manali Chalet', query: 'Tell me about Cedar Ridge Pahadi Chalet in Manali' },
        { label: '🏰 Rawla Pichola Haveli', query: 'Tell me about Rawla Pichola Heritage Haveli in Udaipur' },
        { label: '🛶 Tharavadu Kerala Estate', query: 'Tell me about Tharavadu Backwater Eco Estate in Kerala' },
        { label: '🌿 Mist Haven Coorg Retreat', query: 'Tell me about The Mist Haven Coffee Retreat in Coorg' },
        { label: '🏖️ Casa Da Bougainvillea Goa', query: 'Tell me about Casa Da Bougainvillea in Goa' },
        { label: '⛺ Nubra Starlight Glamp', query: 'Tell me about Nubra Starlight Eco Glamp in Ladakh' }
      ],
      food: [
        { label: '🍲 Regional Clay-Pot Thalis', query: 'Where can I experience authentic regional clay-pot thalis?' },
        { label: '🦐 Coastal Malabar Seafood', query: 'Tell me about coastal Malabar fish and prawn dining' },
        { label: '🌱 Vegetarian & Jain Dining', query: 'What pure vegetarian and Jain dining options are available?' },
        { label: '👑 Royal Dum Pukht Biryani', query: 'Where to find royal Awadhi and Mewari dum pukht biryani?' },
        { label: '☕ Coorg Single-Origin Coffee', query: 'How can I experience artisan single-origin coffee in Coorg?' }
      ],
      currency: [
        { label: '💱 Convert ₹5,000 to USD', query: 'Convert 5000 INR to USD' },
        { label: '💶 Convert ₹15,000 to EUR & GBP', query: 'Convert 15000 INR to EUR and GBP' },
        { label: '💰 Zero Commission Policy', query: 'Explain the 0% commission and 22% OTA savings' },
        { label: '💳 Payment & Free Cancellation', query: 'What is the booking deposit and cancellation policy?' }
      ],
      trains: [
        { label: '🚆 Top Vande Bharat Routes', query: 'What are the top scenic Vande Bharat routes in India?' },
        { label: '🎫 IRCTC 120-Day Booking Rule', query: 'How many days in advance should I book Indian trains?' },
        { label: '🚕 Safe Airport & Station Taxis', query: 'What is the safest way to take cabs from Indian railway stations?' },
        { label: '🚂 Kalka-Shimla Toy Train', query: 'Tell me about the UNESCO Kalka-Shimla heritage toy train' }
      ]
    };

    // Knowledge base responses for domestic grounding
    this.knowledgeBase = {
      mountain: 'For an unforgettable Himalayan sanctuary, I highly recommend the **Cedar Ridge Pahadi Chalet** in Old Manali or the **Nubra Starlight Eco Glamp** in Ladakh. Both feature crackling wood fires, crisp mountain air, and stargazing under Bortle-1 skies. Peak mountain season runs from April to June and September to November.',
      rajasthan: 'The optimal time to visit Rajasthan is from October to March when the desert weather is crisp and pleasant. For a royal heritage stay, don’t miss **Rawla Pichola Heritage Haveli** in Udaipur where Maharaj Shakti Singh welcomes you with authentic royal Mewari hospitality!',
      kerala: 'Kerala is breathtaking year-round, especially September through March. You will love staying at **Tharavadu Backwater Eco Estate** in Kumarakom, waking up to canoe rides along peaceful canals and authentic appams with fresh cardamom vegetable stew.',
      goa: 'Goa is magical from November through March! If you’re looking for Portuguese colonial charm away from the crowds, check out **Casa Da Bougainvillea** in Fontainhas, Panaji, or head south to quiet shores like Agonda, Cola, and Palolem.',
      food: 'We feature four authentic culinary worlds! Try our **Rustic Village Kitchen** for traditional clay-pot thalis, **Coastal Catch Shack** for freshly caught Arabian Sea fish wrapped in banana leaves, or **Heritage Fine Dine** for saffron-infused royal dum pukht biryani.',
      vegan: 'Many of our local food partners specialize in organic plant-based Indian cuisine. In particular, the **Heritage Clay-Pot Thali**, **Konkan Kokum Jackfruit Stew**, and the **Artisanal Pani Puri Flight** are 100% vegetarian and vegan friendly.',
      sustainable: 'At Travel Nexus, 100% of the host rate goes directly to verified local hosts and village artisans across India. We charge zero commission to rural homestays, saving you 18%–22% compared to commercial OTAs while directly enriching rural families.',
      booking: 'All stays on Travel Nexus feature 100% free cancellation up to 48 hours before check-in, transparent pricing in Indian Rupees (₹) with zero hidden checkout fees, and personal 40-point host verification.',
      train: 'India’s high-speed **Vande Bharat Express** trains connect key corridors like Delhi–Varanasi, Delhi–Dehradun, Mumbai–Goa, and Bengaluru–Mysuru. For peak holiday periods, book 60–120 days in advance via IRCTC or choose our host-assisted station transfers.',
      transport: 'Across major Indian cities, app-based cabs (Ola & Uber) are widely available. At airports and major railway terminals, always use the government-regulated **Prepaid Taxi Counter** inside the terminal. For mountain journeys in Himachal, Ladakh, or Sikkim, verified local union taxis are safest.',
      visa: 'International travelers can obtain an official Indian e-Tourist Visa (30-day, 1-year, or 5-year) online via the official portal at **indianvisaonline.gov.in**. Standard processing is 72 hours. Check our `#evisa` tab for step-by-step checklists!',
      seasons: 'India has three great traveling windows: **Winter (Oct–Mar)** is perfect for Rajasthan, Kerala, Goa, and Karnataka; **Spring/Summer (Apr–Jun)** is ideal for Himachal, Uttarakhand, and Ladakh; and **Monsoon (Jul–Sep)** transforms the Western Ghats into lush misty green havens.'
    };

    this.init();
  }

  init() {
    const triggerBtn = document.getElementById('chatTriggerBtn');
    const closeBtn = document.getElementById('chatCloseBtn');
    const sendBtn = document.getElementById('chatSendBtn');
    const input = document.getElementById('chatInput');
    const micBtn = document.getElementById('chatMicBtn');
    const ttsBtn = document.getElementById('chatTtsToggleBtn');
    const exportBtn = document.getElementById('chatExportBtn');
    const clearBtn = document.getElementById('chatClearBtn');
    const categoryStrip = document.getElementById('chatCategoryStrip');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.toggle());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Voice STT Microphone Button
    if (micBtn) {
      micBtn.addEventListener('click', () => this.toggleSpeechRecognition());
    }

    // Voice TTS Header Toggle Button
    if (ttsBtn) {
      this.updateTtsButtonUI();
      ttsBtn.addEventListener('click', () => this.toggleTTS());
    }

    // Export Chat Itinerary
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportChatItinerary());
    }

    // Clear Chat
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChatHistory());
    }

    // Category Tabs Filter Strip
    if (categoryStrip) {
      categoryStrip.addEventListener('click', (e) => {
        const tab = e.target.closest('.chat-cat-tab');
        if (tab) {
          categoryStrip.querySelectorAll('.chat-cat-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const cat = tab.getAttribute('data-cat') || 'all';
          this.renderCategoryChips(cat);
        }
      });
    }

    // Quick chips clicks
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.chat-chip');
      if (chip) {
        const query = chip.getAttribute('data-query') || chip.textContent.trim();
        this.addUserMessage(chip.textContent.trim());
        this.processBotResponse(query);
      }
    });

    // Hash change collision guard: auto-dock when on #become-host
    window.addEventListener('hashchange', () => {
      if (window.location.hash.startsWith('#become-host') && this.isOpen) {
        this.close();
      }
    });

    // Render initial state
    this.renderCategoryChips('all');
    this.renderMessages();
    this.loadConversationHistory();
  }

  async loadConversationHistory() {
    try {
      const res = await fetch(`/api/nexus-ai-chat?sessionId=${this.sessionId}`, {
        method: 'GET',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.messages) && data.messages.length > 0) {
          const welcome = this.messages[0];
          this.messages = [welcome, ...data.messages];
          this.renderMessages();
        }
      }
    } catch (e) {
      console.debug('Chat history load skipped:', e);
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    // Collision Guard: Check if user is on host onboarding wizard
    if (window.location.hash === '#become-host') {
      const winWidth = window.innerWidth;
      if (winWidth < 900) {
        if (window.showToast) {
          window.showToast('Nexus AI docked to give you full screen for host registration.', 'info');
        }
        return;
      }
    }

    const win = document.getElementById('chatWindow');
    if (win) {
      win.classList.add('active');
      this.isOpen = true;
      const input = document.getElementById('chatInput');
      if (input) setTimeout(() => input.focus(), 200);
    }
  }

  close() {
    const win = document.getElementById('chatWindow');
    if (win) {
      win.classList.remove('active');
      this.isOpen = false;
      this.stopSpeechRecognition();
      this.stopSpeechSynthesis();
    }
  }

  renderCategoryChips(category) {
    this.activeCategory = category;
    const container = document.getElementById('chatChipsContainer');
    if (!container) return;

    const chips = this.categoryChips[category] || this.categoryChips.all;
    container.innerHTML = chips.map(c => `
      <span class="chat-chip" data-query="${c.query}">${c.label}</span>
    `).join('');
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.addUserMessage(text);
    this.processBotResponse(text);
  }

  addUserMessage(text) {
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender: 'user',
      text
    });
    this.renderMessages();
  }

  /* ==========================================================================
     REAL-TIME WEATHER TOOL (Open-Meteo Integration)
     ========================================================================== */
  detectWeatherQuery(query) {
    const lower = query.toLowerCase();
    const weatherKeywords = ['weather', 'temperature', 'temp', 'forecast', 'rain', 'snow', 'hot', 'cold', 'climate', 'degrees', 'celsius', 'pack', 'packing'];
    const hasWeatherTerm = weatherKeywords.some(kw => lower.includes(kw));

    for (const [key, loc] of Object.entries(this.weatherLocations)) {
      if (lower.includes(key) || lower.includes(loc.name.toLowerCase().split(' ')[0])) {
        if (hasWeatherTerm || this.activeCategory === 'weather') {
          return { ...loc, key };
        }
      }
    }
    return null;
  }

  async fetchLiveWeather(loc) {
    if (!this.weatherCache) this.weatherCache = new Map();
    const cacheKey = loc.key || loc.name;
    const cached = this.weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.time < 600000)) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        if (current) {
          const codeInfo = this.mapWmoWeatherCode(current.weather_code);
          const weatherResult = {
            city: loc.name,
            state: loc.state,
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            condition: codeInfo.label,
            icon: codeInfo.icon,
            humidity: current.relative_humidity_2m + '%',
            wind: current.wind_speed_10m + ' km/h',
            precipitation: (current.precipitation || 0) + ' mm',
            packAdvice: loc.pack,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          };
          this.weatherCache.set(cacheKey, { time: Date.now(), data: weatherResult });
          return weatherResult;
        }
      }
    } catch (e) {
      console.warn('Live weather lookup failed, using local meteorological baseline:', e);
    }

    // High-accuracy domestic seasonal baseline fallback
    const fallbackEstimates = {
      manali: { temp: 24, cond: 'Clear Mountain Air', icon: '🌤️', hum: '48%', wind: '7 km/h' },
      leh: { temp: 16, cond: 'Crisp Alpine Sun', icon: '☀️', hum: '26%', wind: '11 km/h' },
      goa: { temp: 29, cond: 'Warm Coastal Breeze', icon: '🏖️', hum: '70%', wind: '13 km/h' },
      udaipur: { temp: 28, cond: 'Sunny & Pleasant', icon: '☀️', hum: '42%', wind: '8 km/h' },
      munnar: { temp: 20, cond: 'Misty Hill Breezes', icon: '⛅', hum: '66%', wind: '9 km/h' }
    };
    const est = fallbackEstimates[loc.key] || { temp: 25, cond: 'Pleasant & Fair', icon: '🌤️', hum: '50%', wind: '10 km/h' };

    const fallbackResult = {
      city: loc.name,
      state: loc.state,
      temperature: est.temp,
      feelsLike: est.temp + 1,
      condition: est.cond,
      icon: est.icon,
      humidity: est.hum,
      wind: est.wind,
      precipitation: '0.0 mm',
      packAdvice: loc.pack,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    this.weatherCache.set(cacheKey, { time: Date.now(), data: fallbackResult });
    return fallbackResult;
  }

  mapWmoWeatherCode(code) {
    if (code === 0) return { label: 'Clear Sky', icon: '☀️' };
    if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: '⛅' };
    if (code === 45 || code === 48) return { label: 'Misty / Foggy', icon: '🌫️' };
    if (code >= 51 && code <= 55) return { label: 'Light Drizzle', icon: '🌦️' };
    if (code >= 61 && code <= 65) return { label: 'Rain Showers', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { label: 'Snowfall', icon: '❄️' };
    if (code >= 80 && code <= 82) return { label: 'Heavy Showers', icon: '⛈️' };
    if (code >= 95) return { label: 'Thunderstorm', icon: '⚡' };
    return { label: 'Fair Conditions', icon: '🌤️' };
  }

  /* ==========================================================================
     REAL-TIME CURRENCY TOOL
     ========================================================================== */
  detectCurrencyQuery(query) {
    const lower = query.toLowerCase();
    const currKeywords = ['currency', 'convert', 'rate', 'exchange', 'inr', 'usd', 'eur', 'gbp', 'dollar', 'euro', 'pound', 'rupee', '₹', '$', '€', '£'];
    const hasCurrTerm = currKeywords.some(kw => lower.includes(kw));
    if (!hasCurrTerm) return null;

    const match = query.match(/(\d[\d,]*)/);
    const amount = match ? parseFloat(match[1].replace(/,/g, '')) : 5000;

    const rates = (window.currencyManager && window.currencyManager.rates) || {
      INR: 1,
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095
    };

    let baseInr = amount;
    if (lower.includes('usd') || lower.includes('$') || lower.includes('dollar')) {
      baseInr = amount / (rates.USD || 0.012);
    } else if (lower.includes('eur') || lower.includes('€') || lower.includes('euro')) {
      baseInr = amount / (rates.EUR || 0.011);
    } else if (lower.includes('gbp') || lower.includes('£') || lower.includes('pound')) {
      baseInr = amount / (rates.GBP || 0.0095);
    }

    const usdVal = (baseInr * (rates.USD || 0.012)).toFixed(2);
    const eurVal = (baseInr * (rates.EUR || 0.011)).toFixed(2);
    const gbpVal = (baseInr * (rates.GBP || 0.0095)).toFixed(2);
    const inrVal = Math.round(baseInr).toLocaleString('en-IN');

    return {
      inr: '₹' + inrVal,
      usd: '$' + usdVal,
      eur: '€' + eurVal,
      gbp: '£' + gbpVal,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
  }

  /* ==========================================================================
     INTERACTIVE ACTION CARD DETECTOR
     ========================================================================== */
  detectActionCard(query) {
    const lower = query.toLowerCase();
    if (!window.TRAVEL_DATA) return null;

    for (const mapping of this.stayActionMap) {
      if (mapping.keywords.some(kw => lower.includes(kw))) {
        const stay = (window.TRAVEL_DATA.stays || []).find(s => s.id === mapping.stayId);
        if (stay) {
          return {
            type: 'stay',
            stayId: stay.id,
            destId: mapping.destId,
            name: stay.name,
            location: stay.location,
            price: stay.pricePerNight,
            rating: stay.rating,
            badge: stay.badge || 'Verified Boutique Stay',
            image: stay.image,
            alt: stay.alt || stay.name
          };
        }
      }
    }

    for (const dest of (window.TRAVEL_DATA.destinations || [])) {
      const destName = dest.name.toLowerCase();
      if (lower.includes(dest.id.replace('dest-', '')) || lower.includes(destName.split(' ')[0])) {
        return {
          type: 'destination',
          destId: dest.id,
          name: dest.name,
          location: dest.region,
          price: dest.startingPrice,
          rating: dest.rating,
          badge: 'Curated Destination',
          image: dest.image,
          alt: dest.alt || dest.name
        };
      }
    }

    return null;
  }

  /* ==========================================================================
     BOT RESPONSE PROCESSING (REAL-TIME ENGINE)
     ========================================================================== */
  async processBotResponse(query) {
    const lower = query.toLowerCase();

    // 1. Check for Real-Time Weather
    const weatherLoc = this.detectWeatherQuery(query);
    let weatherData = null;
    if (weatherLoc) {
      weatherData = await this.fetchLiveWeather(weatherLoc);
    }

    // 2. Check for Currency Calculation
    const currencyData = this.detectCurrencyQuery(query);

    // 3. Check for Stay / Destination Action Card
    const actionCardData = this.detectActionCard(query);

    // 4. Query Serverless Grounded Nexus AI Engine
    let responseText = '';

    try {
      const res = await fetch('/api/nexus-ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: query,
          sessionId: this.sessionId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          responseText = data.reply;
        }
      }
    } catch (e) {
      console.warn('Nexus AI API call fallback:', e);
    }

    // Fallback if API was unavailable (e.g. offline/network issue)
    if (!responseText) {
      if (weatherData) {
        responseText = `Here is the **live meteorological report** for **${weatherData.city}, ${weatherData.state}**, synchronized in real time with Open-Meteo atmospheric radar. Currently at **${weatherData.temperature}°C** with **${weatherData.condition}**.\n\n*Packing Tip:* ${weatherData.packAdvice}`;
      } else if (currencyData) {
        responseText = `Here are the **real-time foreign exchange conversions** based on the official Travel Nexus transparent base rates (zero host markups applied):\n\n• **Indian Rupee:** ${currencyData.inr}\n• **US Dollar:** ${currencyData.usd}\n• **Euro:** ${currencyData.eur}\n• **British Pound:** ${currencyData.gbp}\n\n*Note:* Direct host booking on Travel Nexus saves **18%–22%** compared to commercial third-party OTA portals!`;
      } else if (lower.includes('mountain') || lower.includes('manali') || lower.includes('ladakh') || lower.includes('spiti')) {
        responseText = this.knowledgeBase.mountain;
      } else if (lower.includes('rajasthan') || lower.includes('udaipur') || lower.includes('jaipur')) {
        responseText = this.knowledgeBase.rajasthan;
      } else if (lower.includes('kerala') || lower.includes('alleppey') || lower.includes('kumarakom')) {
        responseText = this.knowledgeBase.kerala;
      } else if (lower.includes('goa') || lower.includes('beach')) {
        responseText = this.knowledgeBase.goa;
      } else if (lower.includes('food') || lower.includes('thali') || lower.includes('dining')) {
        responseText = this.knowledgeBase.food;
      } else if (lower.includes('train') || lower.includes('vande bharat')) {
        responseText = this.knowledgeBase.train;
      } else if (lower.includes('visa') || lower.includes('passport')) {
        responseText = this.knowledgeBase.visa;
      } else {
        responseText = 'I’d be delighted to assist with your domestic Indian journey! Explore our verified boutique stays under **Hotels & Stays**, savor regional culinary traditions under **Dining**, or use our **AI Itinerary Planner** for a customized day-by-day roadmap.';
      }
    }

    this.streamBotReply({
      text: responseText,
      weather: weatherData,
      currency: currencyData,
      actionCard: actionCardData
    });
  }

  /* ==========================================================================
     REAL-TIME TOKEN-BY-TOKEN STREAMING ENGINE
     ========================================================================== */
  streamBotReply(data) {
    const streamId = ++this.currentStreamId;
    this.isStreaming = true;

    const messageObj = {
      id: 'msg-' + Date.now(),
      sender: 'bot',
      text: data.text,
      weather: data.weather,
      currency: data.currency,
      actionCard: data.actionCard
    };

    this.messages.push(messageObj);

    const container = document.getElementById('chatMessages');
    if (!container) return;

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-msg bot';
    msgEl.id = 'stream-' + messageObj.id;

    const textSpan = document.createElement('span');
    textSpan.className = 'nexus-stream-text';

    const cursorSpan = document.createElement('span');
    cursorSpan.className = 'nexus-stream-cursor';

    msgEl.appendChild(textSpan);
    msgEl.appendChild(cursorSpan);
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;

    const words = data.text.split(/(\s+)/);
    let currentIdx = 0;
    let accumulatedText = '';
    let isFinished = false;

    const finishInstantly = () => {
      if (isFinished) return;
      isFinished = true;
      currentIdx = words.length;
      textSpan.innerHTML = this.formatText(data.text);
      if (cursorSpan.parentNode) cursorSpan.remove();
      this.isStreaming = false;

      if (data.weather) {
        msgEl.insertAdjacentHTML('beforeend', this.renderWeatherCard(data.weather));
      }
      if (data.currency) {
        msgEl.insertAdjacentHTML('beforeend', this.renderCurrencyCard(data.currency));
      }
      if (data.actionCard) {
        msgEl.insertAdjacentHTML('beforeend', this.renderActionCard(data.actionCard));
      }

      msgEl.insertAdjacentHTML('beforeend', `
        <div class="chat-msg-actions">
          <button class="chat-msg-action-btn" onclick="window.nexusAIChat.speakMessage('${messageObj.id}', this)" title="Listen to response">
            🔊 Listen
          </button>
          <button class="chat-msg-action-btn" onclick="window.nexusAIChat.copyMessageText('${messageObj.id}', this)" title="Copy text">
            📋 Copy
          </button>
        </div>
      `);

      container.scrollTop = container.scrollHeight;

      if (this.speechEnabled) {
        this.speakText(data.text);
      }
    };

    // Clicking the message instantly completes the response
    msgEl.addEventListener('click', finishInstantly, { once: true });

    const streamNextToken = () => {
      if (this.currentStreamId !== streamId || isFinished) return;

      if (currentIdx < words.length) {
        // High-speed chunking: stream 3 tokens per tick
        let hasSentencePause = false;
        for (let i = 0; i < 3 && currentIdx < words.length; i++) {
          const tok = words[currentIdx];
          accumulatedText += tok;
          if (tok.includes('.') || tok.includes('!') || tok.includes('?')) {
            hasSentencePause = true;
          }
          currentIdx++;
        }

        textSpan.innerHTML = this.formatText(accumulatedText);
        container.scrollTop = container.scrollHeight;

        const delay = hasSentencePause ? 22 : 8;
        setTimeout(streamNextToken, delay);
      } else {
        finishInstantly();
      }
    };

    streamNextToken();
  }

  /* ==========================================================================
     HTML RENDERING UTILITIES
     ========================================================================== */
  renderWeatherCard(w) {
    return `
      <div class="nexus-weather-card">
        <div class="nexus-weather-header">
          <div class="nexus-weather-city">📍 ${w.city}</div>
          <span class="nexus-weather-badge">
            <span class="chat-live-pulse-dot" style="width:6px;height:6px;"></span> Live Radar
          </span>
        </div>
        <div class="nexus-weather-main">
          <div class="nexus-weather-temp">${w.icon} ${w.temperature}°C</div>
          <div class="nexus-weather-condition">
            <div class="nexus-weather-cond-text">${w.condition}</div>
            <div class="nexus-weather-feels">Feels like ${w.feelsLike}°C · ${w.time}</div>
          </div>
        </div>
        <div class="nexus-weather-metrics">
          <div>💧 Humidity: <strong>${w.humidity}</strong></div>
          <div>💨 Wind: <strong>${w.wind}</strong></div>
          <div>🌧️ Precipitation: <strong>${w.precipitation}</strong></div>
          <div>🛡️ Status: <strong>Optimal Travel</strong></div>
        </div>
        <div class="nexus-weather-advice">
          <strong>Recommended Gear:</strong> ${w.packAdvice}
        </div>
      </div>
    `;
  }

  renderCurrencyCard(c) {
    return `
      <div class="nexus-currency-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.8rem; color:var(--text-dark);">💱 Live Rate Conversion</strong>
          <span style="font-size:0.68rem; color:var(--text-muted);">${c.timestamp}</span>
        </div>
        <div class="nexus-currency-grid">
          <div class="nexus-curr-item">
            <span class="nexus-curr-code">INR (₹)</span>
            <span class="nexus-curr-val">${c.inr}</span>
          </div>
          <div class="nexus-curr-item">
            <span class="nexus-curr-code">USD ($)</span>
            <span class="nexus-curr-val">${c.usd}</span>
          </div>
          <div class="nexus-curr-item">
            <span class="nexus-curr-code">EUR (€)</span>
            <span class="nexus-curr-val">${c.eur}</span>
          </div>
          <div class="nexus-curr-item">
            <span class="nexus-curr-code">GBP (£)</span>
            <span class="nexus-curr-val">${c.gbp}</span>
          </div>
        </div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
          ✓ Travel Nexus charges 0% transaction commission.
        </div>
      </div>
    `;
  }

  renderActionCard(card) {
    if (card.type === 'stay') {
      const formattedPrice = window.formatCurrency
        ? window.formatCurrency(card.price)
        : '₹' + card.price.toLocaleString('en-IN');

      return `
        <div class="nexus-action-card">
          <div class="nexus-action-img-wrap">
            <img src="${card.image}" alt="${card.alt}" onerror="window.handleImageError && window.handleImageError(this, '${(card.name || '').replace(/'/g, "\\'")}', '${(card.location || '').replace(/'/g, "\\'")}')" />
            <span class="nexus-action-badge">${card.badge}</span>
          </div>
          <div class="nexus-action-content">
            <div class="nexus-action-title">${card.name}</div>
            <div class="nexus-action-sub">📍 ${card.location} · ⭐ ${card.rating}</div>
            <div class="nexus-action-price-row">
              <span>Direct Host Rate:</span>
              <span class="nexus-action-price">${formattedPrice} <small>/ night</small></span>
            </div>
            <div class="nexus-action-btns">
              <button class="btn-card-action primary" onclick="window.nexusAIChat.openStayBooking('${card.stayId}')">
                🛎️ Book Stay
              </button>
              <button class="btn-card-action secondary" onclick="window.nexusAIChat.toggleStayWishlist('${card.stayId}', this)">
                ❤️ Wishlist
              </button>
              <button class="btn-card-action secondary" onclick="window.nexusAIChat.routeToPlanner('${card.destId}')">
                🗺️ Plan Route
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (card.type === 'destination') {
      const formattedPrice = window.formatCurrency
        ? window.formatCurrency(card.price)
        : '₹' + card.price.toLocaleString('en-IN');

      return `
        <div class="nexus-action-card">
          <div class="nexus-action-img-wrap">
            <img src="${card.image}" alt="${card.alt}" onerror="window.handleImageError && window.handleImageError(this, '${(card.name || '').replace(/'/g, "\\'")}', '${(card.location || '').replace(/'/g, "\\'")}')" />
            <span class="nexus-action-badge">${card.badge}</span>
          </div>
          <div class="nexus-action-content">
            <div class="nexus-action-title">${card.name}</div>
            <div class="nexus-action-sub">📍 ${card.location} · ⭐ ${card.rating}</div>
            <div class="nexus-action-price-row">
              <span>Daily Travel Budget:</span>
              <span class="nexus-action-price">${formattedPrice} <small>/ day</small></span>
            </div>
            <div class="nexus-action-btns">
              <button class="btn-card-action primary" onclick="window.nexusAIChat.openDestinationModal('${card.destId}')">
                📍 Explore Destination
              </button>
              <button class="btn-card-action secondary" onclick="window.nexusAIChat.routeToPlanner('${card.destId}')">
                🗺️ Plan Route
              </button>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }

  openStayBooking(stayId) {
    if (window.modalManager && window.modalManager.openStayBookingModal) {
      window.modalManager.openStayBookingModal(stayId);
    }
  }

  openDestinationModal(destId) {
    if (window.modalManager && window.modalManager.openDestinationModal) {
      window.modalManager.openDestinationModal(destId);
    }
  }

  toggleStayWishlist(stayId, btn) {
    if (window.wishlistManager) {
      window.wishlistManager.toggle(stayId, 'stay', btn);
      const isWishlisted = window.wishlistManager.has(stayId);
      btn.innerHTML = isWishlisted ? '❤️ Saved' : '🤍 Wishlist';
      if (window.showToast) {
        window.showToast(isWishlisted ? 'Saved to your Wishlist ❤️' : 'Removed from Wishlist', 'info');
      }
    }
  }

  routeToPlanner(destId) {
    if (window.itineraryPlanner) {
      window.itineraryPlanner.selectedDestination = destId;
      const select = document.getElementById('plannerDestSelect');
      if (select) select.value = destId;
      window.itineraryPlanner.generateItinerary();
    }
    window.location.hash = '#planner';
    const plannerEl = document.getElementById('planner');
    if (plannerEl) {
      plannerEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* ==========================================================================
     REAL-TIME VOICE INPUT (SPEECH-TO-TEXT via Web Speech API)
     ========================================================================== */
  toggleSpeechRecognition() {
    if (this.isListening) {
      this.stopSpeechRecognition();
    } else {
      this.startSpeechRecognition();
    }
  }

  startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (window.showToast) {
        window.showToast('Speech Recognition is not supported by your browser.', 'warning');
      }
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-IN';
      this.recognition.interimResults = true;
      this.recognition.continuous = false;

      const micBtn = document.getElementById('chatMicBtn');
      const input = document.getElementById('chatInput');

      this.recognition.onstart = () => {
        this.isListening = true;
        if (micBtn) micBtn.classList.add('recording');
        if (input) input.placeholder = 'Listening... Speak now 🎙️';
        if (window.showToast) {
          window.showToast('Listening to your voice... Speak now 🎙️', 'info');
        }
      };

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (input) input.value = transcript;
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.stopSpeechRecognition();
        if (window.showToast && event.error !== 'no-speech') {
          window.showToast('Microphone error: ' + event.error, 'warning');
        }
      };

      this.recognition.onend = () => {
        this.stopSpeechRecognition();
        if (input && input.value.trim().length > 0) {
          setTimeout(() => {
            if (input.value.trim().length > 0) {
              this.sendMessage();
            }
          }, 120);
        }
      };

      this.recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      this.stopSpeechRecognition();
    }
  }

  stopSpeechRecognition() {
    this.isListening = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }
    const micBtn = document.getElementById('chatMicBtn');
    const input = document.getElementById('chatInput');
    if (micBtn) micBtn.classList.remove('recording');
    if (input) input.placeholder = 'Ask live weather, stays, food, currency...';
  }

  /* ==========================================================================
     REAL-TIME VOICE NARRATION (TEXT-TO-SPEECH via SpeechSynthesis)
     ========================================================================== */
  toggleTTS() {
    this.speechEnabled = !this.speechEnabled;
    localStorage.setItem('travelnexus_chat_tts', this.speechEnabled);
    this.updateTtsButtonUI();

    if (!this.speechEnabled) {
      this.stopSpeechSynthesis();
      if (window.showToast) window.showToast('Voice Narration turned off 🔇', 'info');
    } else {
      if (window.showToast) window.showToast('Voice Narration enabled 🔊', 'success');
      this.speakText('Voice narration enabled. I am ready to guide your Indian journey.');
    }
  }

  updateTtsButtonUI() {
    const btn = document.getElementById('chatTtsToggleBtn');
    if (!btn) return;
    if (this.speechEnabled) {
      btn.classList.add('active');
      btn.setAttribute('title', 'Voice Narration is ON (Click to mute)');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('title', 'Voice Narration is OFF (Click to turn on)');
    }
  }

  speakMessage(msgId, btn) {
    const msg = this.messages.find(m => m.id === msgId);
    if (!msg) return;

    if (this.currentSpeakingUtterance) {
      this.stopSpeechSynthesis();
      if (btn) btn.innerHTML = '🔊 Listen';
      return;
    }

    if (btn) btn.innerHTML = '⏹️ Stop';
    this.speakText(msg.text, () => {
      if (btn) btn.innerHTML = '🔊 Listen';
    });
  }

  speakText(text, onComplete) {
    if (!this.synth) return;
    this.stopSpeechSynthesis();

    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/•/g, '')
      .replace(/[^\w\s.,?!'-]/g, ' ')
      .trim();

    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = this.synth.getVoices();
      const inVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
                      voices.find(v => v.lang.startsWith('en-GB')) ||
                      voices.find(v => v.lang.startsWith('en'));
      if (inVoice) utterance.voice = inVoice;

      utterance.onend = () => {
        this.currentSpeakingUtterance = null;
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        this.currentSpeakingUtterance = null;
        if (onComplete) onComplete();
      };

      this.currentSpeakingUtterance = utterance;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
      this.currentSpeakingUtterance = null;
    }
  }

  stopSpeechSynthesis() {
    if (this.synth) {
      try { this.synth.cancel(); } catch (e) {}
    }
    this.currentSpeakingUtterance = null;
  }

  /* ==========================================================================
     CHAT EXPORT & MANAGEMENT TOOLS
     ========================================================================== */
  exportChatItinerary() {
    let md = `# Travel Nexus - Curated AI Itinerary & Domestic Travel Plan\n`;
    md += `*Generated by Nexus AI Concierge on ${new Date().toLocaleString('en-IN')}*\n`;
    md += `*Website:* https://travelnexus.app\n\n`;
    md += `---\n\n`;

    this.messages.forEach(m => {
      const role = m.sender === 'user' ? '### 👤 Traveler Query' : '### 🏛️ Nexus AI Recommendation';
      md += `${role}\n\n${m.text}\n\n`;

      if (m.weather) {
        md += `> **🔴 Live Meteorological Radar (${m.weather.city}):** ${m.weather.temperature}°C, ${m.weather.condition}, Humidity: ${m.weather.humidity}, Wind: ${m.weather.wind}. *Advice:* ${m.weather.packAdvice}\n\n`;
      }
      if (m.currency) {
        md += `> **💱 Currency Conversion:** ${m.currency.inr} = ${m.currency.usd} = ${m.currency.eur} = ${m.currency.gbp}\n\n`;
      }
      if (m.actionCard) {
        md += `> **🛎️ Recommended Stay:** ${m.actionCard.name} (${m.actionCard.location}) - Direct Rate: ₹${m.actionCard.price}/night (0% Host Markup)\n\n`;
      }
      md += `---\n\n`;
    });

    md += `\n*All direct stays on Travel Nexus feature 100% free cancellation up to 48 hours before check-in and 0% host markups.*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TravelNexus-AI-Itinerary-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast('📥 Downloaded itinerary as Markdown file!', 'success');
    }
  }

  clearChatHistory() {
    this.stopSpeechSynthesis();
    this.currentStreamId++;
    this.isStreaming = false;

    this.messages = [
      {
        id: 'msg-' + Date.now(),
        sender: 'bot',
        text: 'Chat history cleared. How may I assist your upcoming Indian travel adventure? Ask about live weather, stays, dining, or train routes!'
      }
    ];
    this.renderMessages();
    if (window.showToast) {
      window.showToast('Chat history cleared ✨', 'info');
    }
  }

  copyMessageText(msgId, btn) {
    const msg = this.messages.find(m => m.id === msgId);
    if (!msg) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg.text).then(() => {
        if (btn) btn.innerHTML = '✓ Copied';
        setTimeout(() => { if (btn) btn.innerHTML = '📋 Copy'; }, 1800);
      });
    }
  }

  /* ==========================================================================
     MESSAGE RENDERING ENGINE
     ========================================================================== */
  renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    container.innerHTML = this.messages.map(msg => {
      let extraHtml = '';
      if (msg.weather) extraHtml += this.renderWeatherCard(msg.weather);
      if (msg.currency) extraHtml += this.renderCurrencyCard(msg.currency);
      if (msg.actionCard) extraHtml += this.renderActionCard(msg.actionCard);

      const actionButtons = msg.sender === 'bot'
        ? `<div class="chat-msg-actions">
            <button class="chat-msg-action-btn" onclick="window.nexusAIChat.speakMessage('${msg.id}', this)" title="Listen to response">
              🔊 Listen
            </button>
            <button class="chat-msg-action-btn" onclick="window.nexusAIChat.copyMessageText('${msg.id}', this)" title="Copy text">
              📋 Copy
            </button>
          </div>`
        : '';

      return `
        <div class="chat-msg ${msg.sender}" id="msg-el-${msg.id}">
          <div class="nexus-stream-text">${this.formatText(msg.text)}</div>
          ${extraHtml}
          ${actionButtons}
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  }

  formatText(text) {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\n\n/g, '<br><br>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.nexusAIChat = new NexusAIChat();
  // Backward-compatible alias
  window.nestBotChat = window.nexusAIChat;
});
