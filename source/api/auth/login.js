const prisma = require('../_lib/prisma');
const bcrypt = require('bcryptjs');
const { signToken, setAuthCookie, isAdminEmail } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    // Auto-promote/register admin if email matches ADMIN_ALLOWLIST
    if (!user && isAdminEmail(cleanEmail)) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user = await prisma.user.create({
        data: {
          name: 'Platform Administrator',
          email: cleanEmail,
          passwordHash,
          role: 'admin'
        }
      });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    setAuthCookie(res, token);

    // Fetch wishlist items for fast client-side initialization
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: user.id },
      select: { listingId: true }
    });

    return res.status(200).json({
      user: {
        id: user.id,
        uid: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        wishlist: wishlistItems.map(w => w.listingId)
      },
      message: 'Logged in successfully.'
    });
  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ error: 'Login service failed.', details: error.message });
  }
};
