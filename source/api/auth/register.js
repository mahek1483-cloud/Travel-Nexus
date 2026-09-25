const prisma = require('../_lib/prisma');
const bcrypt = require('bcryptjs');
const { isAdminEmail, signToken, setAuthCookie } = require('../_lib/auth');

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
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check ADMIN_ALLOWLIST
    let assignedRole = 'traveler';
    if (isAdminEmail(cleanEmail)) {
      assignedRole = 'admin';
    } else if (role === 'host') {
      assignedRole = 'host';
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: assignedRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      user,
      message: 'Account created successfully.'
    });
  } catch (error) {
    console.error('Register API error:', error);
    return res.status(500).json({ error: 'Failed to create account.', details: error.message });
  }
};
