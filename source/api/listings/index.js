const prisma = require('../_lib/prisma');
const { getUserFromRequest } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/listings?status=approved|pending|all
  if (req.method === 'GET') {
    try {
      const { status } = req.query || {};
      const where = {};

      if (status && status !== 'all') {
        where.status = status;
      }

      const listings = await prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          reviews: {
            select: {
              id: true,
              author: true,
              rating: true,
              comment: true,
              createdAt: true
            }
          }
        }
      });

      return res.status(200).json(listings);
    } catch (error) {
      console.error('Listings GET error:', error);
      return res.status(500).json({ error: 'Failed to fetch listings.', details: error.message });
    }
  }

  // POST /api/listings
  if (req.method === 'POST') {
    try {
      const session = getUserFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized: You must be signed in to create a listing.' });
      }

      const body = req.body || {};
      const {
        type = 'hotel',
        businessName,
        tagline,
        description,
        address,
        lat,
        lng,
        coordinates,
        priceMin = 1000,
        priceMax = 5000,
        specialty,
        dishes,
        photos = [],
        videoUrl = ''
      } = body;

      if (!businessName || !address) {
        return res.status(400).json({ error: 'Business name and address are required.' });
      }

      const resolvedLat = parseFloat(lat || (Array.isArray(coordinates) ? coordinates[0] : 0)) || 0;
      const resolvedLng = parseFloat(lng || (Array.isArray(coordinates) ? coordinates[1] : 0)) || 0;

      const newListing = await prisma.listing.create({
        data: {
          type,
          businessName,
          tagline: tagline || '',
          description: description || '',
          address,
          lat: resolvedLat,
          lng: resolvedLng,
          priceMin: parseInt(priceMin, 10) || 1000,
          priceMax: parseInt(priceMax, 10) || 5000,
          specialty: specialty || null,
          dishes: dishes ? dishes : undefined,
          photos: Array.isArray(photos) ? photos : [],
          videoUrl: videoUrl || null,
          hostId: session.userId,
          hostName: session.name || 'Verified Boutique Host',
          hostEmail: session.email,
          status: 'pending'
        }
      });

      // If user was a traveler, upgrade role to host
      if (session.role !== 'admin' && session.role !== 'host') {
        await prisma.user.update({
          where: { id: session.userId },
          data: { role: 'host' }
        });
      }

      return res.status(201).json(newListing);
    } catch (error) {
      console.error('Listings POST error:', error);
      return res.status(500).json({ error: 'Failed to create listing.', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
