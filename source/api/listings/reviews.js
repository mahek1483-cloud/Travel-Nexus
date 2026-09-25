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

  const { id, listingId } = req.query || {};
  const targetListingId = id || listingId;

  if (!targetListingId) {
    return res.status(400).json({ error: 'Listing ID is required.' });
  }

  // GET /api/listings/[id]/reviews
  if (req.method === 'GET') {
    try {
      const reviews = await prisma.review.findMany({
        where: { listingId: targetListingId },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(reviews);
    } catch (error) {
      console.error('Reviews GET error:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
  }

  // POST /api/listings/[id]/reviews
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const {
        author = 'Verified Guest',
        rating = 5,
        date,
        comment,
        photos = [],
        verifiedTraveler = true,
        hostResponse = null
      } = body;

      if (!comment) {
        return res.status(400).json({ error: 'Comment is required for review.' });
      }

      // If listing does not exist in DB yet (e.g. static catalog item), check or create placeholder
      let listing = await prisma.listing.findUnique({
        where: { id: targetListingId }
      });

      if (!listing) {
        // Retrieve admin or default host
        const defaultHost = await prisma.user.findFirst({
          where: { role: { in: ['admin', 'host'] } }
        });

        if (defaultHost) {
          listing = await prisma.listing.create({
            data: {
              id: targetListingId,
              type: 'hotel',
              businessName: 'Boutique Heritage Sanctuary',
              tagline: 'Authentic Indian hospitality verified partner',
              description: 'Curated boutique stay in Incredible India.',
              address: 'India',
              lat: 20.5937,
              lng: 78.9629,
              priceMin: 2500,
              priceMax: 8000,
              hostId: defaultHost.id,
              hostName: defaultHost.name,
              hostEmail: defaultHost.email,
              status: 'approved'
            }
          });
        }
      }

      const review = await prisma.review.create({
        data: {
          listingId: targetListingId,
          author,
          rating: parseFloat(rating) || 5.0,
          date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          verifiedTraveler: Boolean(verifiedTraveler),
          comment,
          photos: Array.isArray(photos) ? photos : [],
          hostResponse: hostResponse || null
        }
      });

      return res.status(201).json(review);
    } catch (error) {
      console.error('Reviews POST error:', error);
      return res.status(500).json({ error: 'Failed to post review.', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
