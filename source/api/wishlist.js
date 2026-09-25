const prisma = require('./_lib/prisma');
const { getUserFromRequest } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const session = getUserFromRequest(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Sign in required to access wishlist.' });
  }

  // GET /api/wishlist
  if (req.method === 'GET') {
    try {
      const items = await prisma.wishlist.findMany({
        where: { userId: session.userId },
        select: { listingId: true }
      });

      return res.status(200).json({
        wishlist: items.map(i => i.listingId)
      });
    } catch (error) {
      console.error('Wishlist GET error:', error);
      return res.status(500).json({ error: 'Failed to fetch wishlist.' });
    }
  }

  // POST /api/wishlist (toggle)
  if (req.method === 'POST') {
    try {
      const { listingId } = req.body || {};
      if (!listingId) {
        return res.status(400).json({ error: 'listingId is required.' });
      }

      const existing = await prisma.wishlist.findUnique({
        where: {
          userId_listingId: {
            userId: session.userId,
            listingId
          }
        }
      });

      if (existing) {
        await prisma.wishlist.delete({
          where: { id: existing.id }
        });
      } else {
        await prisma.wishlist.create({
          data: {
            userId: session.userId,
            listingId
          }
        });
      }

      const currentItems = await prisma.wishlist.findMany({
        where: { userId: session.userId },
        select: { listingId: true }
      });

      return res.status(200).json({
        toggled: !existing,
        wishlist: currentItems.map(i => i.listingId)
      });
    } catch (error) {
      console.error('Wishlist POST error:', error);
      return res.status(500).json({ error: 'Failed to update wishlist.', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
