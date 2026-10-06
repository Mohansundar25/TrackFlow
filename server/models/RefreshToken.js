const mongoose = require('mongoose');

// One record per issued refresh token. Expired records are removed by the TTL index.
const refreshTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  revoked: { type: Boolean, default: false },
  replacedBy: { type: String, default: null },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
