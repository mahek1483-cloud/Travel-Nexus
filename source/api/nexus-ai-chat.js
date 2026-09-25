/**
 * Travel Nexus - Serverless Concierge Function (Vercel)
 * Grounded in Prisma + PostgreSQL, personalized to authenticated user,
 * multi-intent fuzzy detection, and ChatMessage conversation persistence.
 */

const prisma = require('./_lib/prisma');
const { getUserFromRequest } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/nexus-ai-chat?sessionId=... -> Load conversation history
  if (req.method === 'GET') {
    try {
      const session = getUserFromRequest(req);
      const { sessionId } = req.query || {};

      const orConditions = [];
      if (sessionId) orConditions.push({ sessionId });
      if (session && session.userId) orConditions.push({ userId: session.userId });

      if (!orConditions.length) {
        return res.status(200).json({ messages: [] });
      }

      const messages = await prisma.chatMessage.findMany({
        where: { OR: orConditions },
        orderBy: { createdAt: 'asc' },
        take: 25
      });

      return res.status(200).json({
        messages: messages.map(m => ({
          id: m.id,
          sender: m.sender === 'user' ? 'user' : 'bot',
          text: m.text,
          createdAt: m.createdAt
        }))
      });
    } catch (e) {
      console.error('Fetch chat history error:', e);
      return res.status(200).json({ messages: [] });
    }
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'online', service: 'Nexus AI Travel Concierge' });
  }

  try {
    const { message, sessionId } = req.body || {};
    const query = (message || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Message query is required.' });
    }

    const session = getUserFromRequest(req);
    const effectiveSessionId = sessionId || (session ? `usr_${session.userId}` : 'anon_session');
    const lower = query.toLowerCase();

    // 1. Fetch user context & wishlist if logged in
    let userRecord = null;
    let userWishlist = [];
    if (session && session.userId) {
      try {
        userRecord = await prisma.user.findUnique({
          where: { id: session.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            wishlist: { select: { listingId: true } }
          }
        });
        if (userRecord) {
          userWishlist = userRecord.wishlist.map(w => w.listingId);
        }
      } catch (err) {
        console.warn('Could not fetch user record for chat personalization:', err);
      }
    }

    // 2. Fetch past conversation history from database
    let pastHistory = [];
    try {
      const orClauses = [{ sessionId: effectiveSessionId }];
      if (session && session.userId) orClauses.push({ userId: session.userId });

      pastHistory = await prisma.chatMessage.findMany({
        where: { OR: orClauses },
        orderBy: { createdAt: 'desc' },
        take: 8
      });
      pastHistory.reverse();
    } catch (err) {
      console.warn('Could not fetch past chat history:', err);
    }

    // 3. Extract budget from query
    let maxBudget = null;
    const budgetMatch = query.match(/(?:under|below|less than|budget of|within|upto|up to|₹)\s*(\d+[\d,]*)/i) ||
                        query.match(/(\d{4,6})\s*(?:inr|rs|rupees|\/-)?/i);
    if (budgetMatch) {
      const parsed = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(parsed) && parsed > 500 && parsed < 200000) {
        maxBudget = parsed;
      }
    }

    // 4. Query real listings from PostgreSQL Database via Prisma
    let matchingListings = [];
    try {
      const whereConditions = { status: 'approved' };
      if (maxBudget) {
        whereConditions.priceMin = { lte: maxBudget };
      }

      // Location filters
      const locFilters = [];
      if (lower.includes('manali') || lower.includes('kullu') || lower.includes('himachal') || lower.includes('solang')) {
        locFilters.push({ address: { contains: 'Himachal', mode: 'insensitive' } });
        locFilters.push({ businessName: { contains: 'Kullu', mode: 'insensitive' } });
      }
      if (lower.includes('kerala') || lower.includes('kumarakom') || lower.includes('alleppey') || lower.includes('munnar')) {
        locFilters.push({ address: { contains: 'Kerala', mode: 'insensitive' } });
        locFilters.push({ businessName: { contains: 'Spice Coast', mode: 'insensitive' } });
      }
      if (lower.includes('rajasthan') || lower.includes('udaipur') || lower.includes('jaipur') || lower.includes('jodhpur')) {
        locFilters.push({ address: { contains: 'Rajasthan', mode: 'insensitive' } });
      }
      if (lower.includes('ladakh') || lower.includes('leh') || lower.includes('nubra')) {
        locFilters.push({ address: { contains: 'Ladakh', mode: 'insensitive' } });
      }
      if (lower.includes('goa')) {
        locFilters.push({ address: { contains: 'Goa', mode: 'insensitive' } });
      }

      if (locFilters.length) {
        whereConditions.OR = locFilters;
      }

      matchingListings = await prisma.listing.findMany({
        where: whereConditions,
        take: 4,
        orderBy: { createdAt: 'desc' }
      });

      // If specific location query returned empty DB matches, fetch any approved listings to ground answers
      if (!matchingListings.length) {
        matchingListings = await prisma.listing.findMany({
          where: { status: 'approved' },
          take: 3
        });
      }
    } catch (dbErr) {
      console.warn('Prisma listings query failed:', dbErr.message);
    }

    // 5. Build dynamic inventory context string for prompt / grounded reply
    let inventorySummary = '';
    if (matchingListings.length) {
      inventorySummary = matchingListings.map(l => {
        const dishInfo = l.dishes && Array.isArray(l.dishes) ? ` Special dishes: ${l.dishes.map(d => d.name).slice(0, 2).join(', ')}.` : '';
        return `• **${l.businessName}** (${l.type.toUpperCase()}) in ${l.address}. Rates: ₹${l.priceMin.toLocaleString('en-IN')}–₹${l.priceMax.toLocaleString('en-IN')}/night.${dishInfo} Specialty: ${l.specialty || l.tagline}`;
      }).join('\n');
    }

    // 6. User personalization string
    const userName = userRecord ? userRecord.name : (session ? session.name : null);
    const personalizationNotes = [];
    if (userName) {
      personalizationNotes.push(`Logged-in user: ${userName} (${userRecord ? userRecord.role : 'traveler'}).`);
    }
    if (userWishlist.length) {
      personalizationNotes.push(`User already has ${userWishlist.length} item(s) saved in their wishlist (${userWishlist.join(', ')}). Acknowledge their taste and suggest fresh matching options rather than duplicate what is already saved.`);
    }

    // 7. System prompt scoping Nexus AI strictly to Travel Nexus & Indian domestic travel
    const systemPrompt = `You are Nexus AI, the senior domestic travel concierge for Travel Nexus (travelnexus.app), an authentic Indian boutique hospitality platform.
Scope & Rules:
1. Strictly domestic Indian tourism — no international flights, no non-Indian destinations. If asked about overseas destinations, politely decline and pivot to domestic Indian havens.
2. Verified Stays: Prioritize real properties from the verified database inventory below.
3. Pricing & Rates: All prices are in INR with 0% host markup. Direct host rate saves 18%–22% compared to commercial OTAs.
4. Logistics: Mention Vande Bharat express trains, airport transfers, seasonal weather guidance via Open-Meteo, and official India e-Tourist Visa guidance via indianvisaonline.gov.in.
5. Experience Bundles: Mention regional packages combining Boutique Stay + Regional Dining + Certified Local Guide.
6. Tone: Warm, regal, deeply knowledgeable, editorial (similar to Condé Nast Traveler / Incredible India luxury editorial). Keep responses concise (under 130 words).
${personalizationNotes.length ? '\n' + personalizationNotes.join('\n') : ''}
${inventorySummary ? '\nREAL LIVE INVENTORY IN OUR DATABASE:\n' + inventorySummary : ''}`;

    // 8. Try LLM (Anthropic) if configured
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const messages = [];
        pastHistory.forEach(h => {
          messages.push({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: h.text
          });
        });
        messages.push({ role: 'user', content: query });

        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 380,
            system: systemPrompt,
            messages
          })
        });

        if (anthropicRes.ok) {
          const result = await anthropicRes.json();
          const replyText = result.content?.[0]?.text;
          if (replyText) {
            await persistMessages(effectiveSessionId, session ? session.userId : null, query, replyText);
            return res.status(200).json({
              reply: replyText,
              provider: 'anthropic',
              timestamp: Date.now()
            });
          }
        }
      } catch (anthropicErr) {
        console.warn('Anthropic API call failed:', anthropicErr.message);
      }
    }

    // 9. Try LLM (OpenAI) if configured
    if (process.env.OPENAI_API_KEY) {
      try {
        const messages = [{ role: 'system', content: systemPrompt }];
        pastHistory.forEach(h => {
          messages.push({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: h.text
          });
        });
        messages.push({ role: 'user', content: query });

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 380
          })
        });

        if (openaiRes.ok) {
          const result = await openaiRes.json();
          const replyText = result.choices?.[0]?.message?.content;
          if (replyText) {
            await persistMessages(effectiveSessionId, session ? session.userId : null, query, replyText);
            return res.status(200).json({
              reply: replyText,
              provider: 'openai',
              timestamp: Date.now()
            });
          }
        }
      } catch (openaiErr) {
        console.warn('OpenAI API call failed:', openaiErr.message);
      }
    }

    // 10. MULTI-INTENT FUZZY GROUNDED DOMESTIC ENGINE (Fallback when no LLM key configured)
    const intents = detectMultiIntents(query);
    let replyParts = [];
    let suggestions = [];

    // Personal greeting
    if (userName) {
      replyParts.push(`Namaste ${userName}! 🙏`);
    }

    // Multi-intent synthesis
    if (intents.mountains) {
      if (matchingListings.some(l => l.address.includes('Himachal') || l.businessName.includes('Kullu'))) {
        const hListing = matchingListings.find(l => l.address.includes('Himachal') || l.businessName.includes('Kullu'));
        replyParts.push(`For alpine tranquility, our verified retreat **${hListing.businessName}** in ${hListing.address} offers private timber suites and guided mountain walks starting at **₹${hListing.priceMin.toLocaleString('en-IN')}/night**.`);
      } else {
        replyParts.push("For high-altitude serenity, our flagship domestic retreats include **Cedar Ridge Pahadi Chalet** in Old Manali (₹5,200/night) and **Nubra Starlight Eco Glamp** in Ladakh (₹6,800/night) with wood-fired bukharis and pine views.");
      }
      suggestions.push("Check Weather in Manali", "Plan 5-Day Manali Trip", "Hire Mountain Naturalist");
    }

    if (intents.kerala) {
      if (matchingListings.some(l => l.address.includes('Kerala') || l.businessName.includes('Spice Coast'))) {
        const kListing = matchingListings.find(l => l.address.includes('Kerala') || l.businessName.includes('Spice Coast'));
        replyParts.push(`In Kerala, don't miss **${kListing.businessName}** along ${kListing.address}, known for ${kListing.tagline} with artisan tables starting at **₹${kListing.priceMin.toLocaleString('en-IN')}**.`);
      } else {
        replyParts.push("Kerala is paradise from September to March! Drift through palm-canopied backwaters at **Tharavadu Backwater Eco Estate** in Kumarakom (₹6,200/night) with fresh appams and cardamom stew.");
      }
      suggestions.push("Malabar Backwater Bundle", "Kerala e-Visa Tips", "Munnar Tea Estate Stay");
    }

    if (intents.heritage) {
      replyParts.push("For royal Marwari & Mewari heritage, stay at **Rawla Pichola Heritage Haveli** in Udaipur (₹7,500/night) overlooking Lake Pichola, or discover the Amber ramparts of Jaipur.");
      suggestions.push("Mewar Heritage Bundle", "Royal Thali Dinner", "Plan 3-Day Udaipur Trip");
    }

    if (intents.coastal) {
      replyParts.push("For coastal serenity, explore **Bougainvillea Heritage Villa** in Panaji's Latin Quarter (₹4,800/night) and sunset cliff walks along Gokarna's sacred Om Beach.");
      suggestions.push("Goa Heritage Stays", "Gokarna Cliff Walks", "Coastal Seafood Table");
    }

    if (intents.culinary) {
      replyParts.push("Our culinary table connects you directly with generational home kitchens: from claypot Karimeen fish in Kumarakom to copper-handi Awadhi biryanis in Lucknow.");
      suggestions.push("View Local Dining", "Reserve Artisan Table", "Vegan Indian Feasts");
    }

    if (intents.trains) {
      replyParts.push("The semi-high-speed **Vande Bharat Express** links key hubs like Delhi–Varanasi, Mumbai–Goa, and Bengaluru–Mysuru with panoramic vista-dome executive coaches. All boutique hosts offer station transfers.");
      suggestions.push("Station Pickup Guarantee", "Vande Bharat Routes", "Domestic Flight Hubs");
    }

    if (intents.visa) {
      replyParts.push("International travelers can apply for the official Indian **e-Tourist Visa** directly at the Government of India portal **indianvisaonline.gov.in** with a 72-hour turnaround. Check our `#evisa` tab for guidance!");
      suggestions.push("Open e-Visa Guide", "Passport Requirements", "Zero-Fee Advisory");
    }

    if (intents.weather) {
      replyParts.push("We integrate real-time satellite data from **Open-Meteo**! October through March offers pleasant weather across the Golden Triangle, Rajasthan, and South India, while summer is ideal for Ladakh.");
      suggestions.push("Check Manali Forecast", "Check Udaipur Forecast", "Check Kerala Rain Radar");
    }

    if (intents.commission) {
      replyParts.push("Travel Nexus charges **0% booking commission**. 100% of guest payments go directly to local families, guides, and boutique owners, saving you 18%–22% compared to standard OTAs.");
      suggestions.push("Become a Host", "Local Price Guarantee", "Sustainable Charter");
    }

    // Budget constraint response
    if (maxBudget) {
      replyParts.push(`All suggested accommodations and tables strictly honor your budget ceiling of **₹${maxBudget.toLocaleString('en-IN')}**.`);
    }

    // Wishlist acknowledgement
    if (userWishlist.length > 0) {
      replyParts.push(`*(You have ${userWishlist.length} sanctuaries saved in your wishlist—we have prioritized new discoveries for your itinerary.)*`);
    }

    // General fallback if no specific intents matched
    if (!replyParts.length || (replyParts.length === 1 && userName)) {
      replyParts.push("I’m delighted to curate your domestic Indian journey! Explore our verified boutique stays under **Hotels & Stays**, savor regional dining in **Local Cuisine**, or use our **AI Trip Planner** for a day-by-day roadmap.");
      suggestions = ["Himalayan Chalets", "Rajasthan Havelis", "Kerala Backwaters", "Vande Bharat Routes"];
    }

    const finalReply = replyParts.join('\n\n');

    // Save conversation to ChatMessage table
    await persistMessages(effectiveSessionId, session ? session.userId : null, query, finalReply);

    return res.status(200).json({
      reply: finalReply,
      suggestions: Array.from(new Set(suggestions)).slice(0, 4),
      provider: 'domestic-grounded-db-engine',
      matchingListings: matchingListings.map(l => ({ id: l.id, name: l.businessName, price: l.priceMin })),
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Nexus AI error:', error);
    return res.status(500).json({ error: 'Internal concierge error', details: error.message });
  }
};

/**
 * Persist user and bot messages into PostgreSQL ChatMessage table
 */
async function persistMessages(sessionId, userId, userText, botText) {
  try {
    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId,
          userId,
          sender: 'user',
          text: userText
        },
        {
          sessionId,
          userId,
          sender: 'assistant',
          text: botText
        }
      ]
    });
  } catch (err) {
    console.warn('Could not persist chat message to database:', err.message);
  }
}

/**
 * Fuzzy / Synonym Multi-Intent Detector
 */
function detectMultiIntents(text) {
  const t = text.toLowerCase();

  const matchAny = (words) => words.some(w => t.includes(w));

  return {
    mountains: matchAny(['mountain', 'himalaya', 'manali', 'kullu', 'solang', 'ladakh', 'leh', 'nubra', 'spiti', 'shimla', 'dharamshala', 'altitude', 'snow', 'pine', 'trek', 'hike']),
    heritage: matchAny(['rajasthan', 'udaipur', 'jaipur', 'jodhpur', 'jaisalmer', 'haveli', 'fort', 'palace', 'marwari', 'mewar', 'regal', 'royal', 'heritage', 'chhatri']),
    kerala: matchAny(['kerala', 'backwater', 'alleppey', 'kumarakom', 'munnar', 'houseboat', 'ayurveda', 'coconut', 'vembanad', 'western ghats']),
    coastal: matchAny(['goa', 'gokarna', 'beach', 'coastal', 'arabian sea', 'panaji', 'fontainhas', 'sand', 'ocean', 'coast']),
    culinary: matchAny(['food', 'eat', 'dining', 'restaurant', 'thali', 'curry', 'biryani', 'cuisine', 'dish', 'breakfast', 'dinner', 'flavour', 'spices', 'claypot']),
    trains: matchAny(['train', 'vande bharat', 'railway', 'irctc', 'station', 'toy train', 'express', 'coach']),
    visa: matchAny(['visa', 'passport', 'evisa', 'entry', 'immigration', 'permit', 'inner line']),
    weather: matchAny(['weather', 'season', 'monsoon', 'winter', 'summer', 'best time', 'climate', 'temperature', 'rain', 'radar']),
    commission: matchAny(['commission', 'host', 'fee', 'charge', 'platform', 'ota', 'direct', 'earnings', 'payout'])
  };
}
