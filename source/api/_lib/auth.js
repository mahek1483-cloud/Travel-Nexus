const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const JWT_SECRET = process.env.JWT_SECRET || 'travelnexus_jwt_secret_grounded_2026';
const COOKIE_NAME = 'travelnexus_token';

function getAdminAllowlist() {
  const allowlistEnv = process.env.ADMIN_ALLOWLIST || 'admin@travelnexus.app';
  return allowlistEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  return getAdminAllowlist().includes(email.trim().toLowerCase());
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function getUserFromRequest(req) {
  try {
    let token = null;

    // 1. Check Cookies
    if (req.headers && req.headers.cookie) {
      const parsedCookies = cookie.parse(req.headers.cookie);
      token = parsedCookies[COOKIE_NAME];
    }

    // 2. Check Authorization Header fallback
    if (!token && req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) return null;
    return verifyToken(token);
  } catch (e) {
    return null;
  }
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSerialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  res.setHeader('Set-Cookie', cookieSerialized);
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSerialized = cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  res.setHeader('Set-Cookie', cookieSerialized);
}

module.exports = {
  JWT_SECRET,
  COOKIE_NAME,
  getAdminAllowlist,
  isAdminEmail,
  signToken,
  verifyToken,
  getUserFromRequest,
  setAuthCookie,
  clearAuthCookie
};
