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

    const [
      totalUsers,
      totalHosts,
      totalTravelers,
      totalListings,
      pendingListings,
      approvedListings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'host' } }),
      prisma.user.count({ where: { role: 'traveler' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'pending' } }),
      prisma.listing.count({ where: { status: 'approved' } })
    ]);

    return res.status(200).json({
      totalUsers,
      totalHosts,
      totalTravelers,
      totalListings,
      pendingListings,
      approvedListings,
      pendingCount: pendingListings,
      approvedCount: approvedListings
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
};
