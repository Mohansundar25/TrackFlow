const crypto = require('crypto');
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const wrap = require('../middleware/asyncHandler');

const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const DAY_MS = 24 * 60 * 60 * 1000;
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
});

const signAccess = (user) =>
  jwt.sign({ sub: user._id.toString(), name: user.name }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });

async function issueRefresh(res, userId) {
  const jti = crypto.randomUUID();
  await RefreshToken.create({ jti, user: userId, expiresAt: new Date(Date.now() + REFRESH_DAYS * DAY_MS) });
  const token = jwt.sign({ sub: userId.toString(), jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_DAYS}d` });
  res.cookie('refreshToken', token, { ...cookieOptions(), maxAge: REFRESH_DAYS * DAY_MS });
  return jti;
}

async function sendSession(res, user, status = 200) {
  await issueRefresh(res, user._id);
  res.status(status).json({ accessToken: signAccess(user), user: user.toPublic() });
}

router.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Name, email and a password of at least 8 characters are required' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: 'Email is already registered' });
  }
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  await sendSession(res, user, 201);
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: email.toLowerCase() }));
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  await sendSession(res, user);
}));

// Refresh-token rotation with reuse detection.
router.post('/refresh', wrap(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const record = await RefreshToken.findOne({ jti: payload.jti });
  if (!record || record.revoked) {
    // A revoked token was reused: revoke every session for this user.
    await RefreshToken.updateMany({ user: payload.sub }, { revoked: true });
    res.clearCookie('refreshToken', cookieOptions());
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ message: 'User not found' });

  record.revoked = true;
  record.replacedBy = await issueRefresh(res, user._id);
  await record.save();
  res.json({ accessToken: signAccess(user), user: user.toPublic() });
}));

router.post('/logout', wrap(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    try {
      const { jti } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await RefreshToken.updateOne({ jti }, { revoked: true });
    } catch {
      // Token already invalid; nothing to revoke.
    }
  }
  res.clearCookie('refreshToken', cookieOptions());
  res.json({ message: 'Logged out' });
}));

module.exports = router;
