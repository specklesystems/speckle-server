const crypto = require('crypto')

function md5(stringValue) {
  return crypto
    .createHash('md5')
    .update(stringValue || '')
    .digest('hex')
}

module.exports = {
  md5
}
