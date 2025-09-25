const crypto = require('crypto');

function hashString(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

module.exports = { hashString };
