const request = require('supertest')

/**
 * Upload a blob from a test runner
 * @param {import('express').Express} app Test runner express instance
 * @param {string} filePath Absolute path to file on the server
 * @param {string} streamId
 * @param {string} authToken Token for authenticating with server, if any
 * @returns {Promise<Object>} Response result structure
 */
async function uploadBlob(app, filePath, streamId, { authToken }) {
  const response = await request(app)
    .post(`/api/stream/${streamId}/blob`)
    .attach('file', filePath)
    .set('Accept', 'application/json')
    .set('Authorization', authToken ? `Bearer ${authToken}` : undefined)

  const uploadResults = response.body.uploadResults || []
  if (!uploadResults.length) {
    throw new Error('Test runner blob upload received unexpected results!')
  }

  return uploadResults[0]
}

module.exports = {
  uploadBlob
}
