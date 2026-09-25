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
    if (!session || session.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin clearance required.' });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            wishlist: true
          }
        }
      }
    });

    return res.status(200).json(users.map(u => ({
      uid: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      listingsCount: u._count.listings,
      wishlistCount: u._count.wishlist
    })));
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};
