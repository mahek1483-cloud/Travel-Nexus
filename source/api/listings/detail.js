const prisma = require('../_lib/prisma');
const { getUserFromRequest } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: 'Listing ID is required.' });
  }

  // GET /api/listings/[id]
  if (req.method === 'GET') {
    try {
      const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found.' });
      }

      return res.status(200).json(listing);
    } catch (error) {
      console.error('Listing detail GET error:', error);
      return res.status(500).json({ error: 'Failed to retrieve listing.' });
    }
  }

  // PATCH /api/listings/[id] (Admin only status update)
  if (req.method === 'PATCH') {
    try {
      const session = getUserFromRequest(req);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only platform administrators can modify listing status.' });
      }

      const { status } = req.body || {};
      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (pending, approved, rejected) is required.' });
      }

      const updated = await prisma.listing.update({
        where: { id },
        data: { status }
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Listing status PATCH error:', error);
      return res.status(500).json({ error: 'Failed to update listing status.', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
