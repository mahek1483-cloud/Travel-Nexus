const prisma = require('../_lib/prisma');
const { getUserFromRequest } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = getUserFromRequest(req);
    if (!session) {
      return res.status(200).json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        wishlist: {
          select: { listingId: true }
        }
      }
    });

    if (!user) {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        uid: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        wishlist: user.wishlist.map(w => w.listingId)
      }
    });
  } catch (error) {
    console.error('Auth /me API error:', error);
    return res.status(500).json({ error: 'Failed to verify session.' });
  }
};
