const { AllScopes } = require('@/modules/core/helpers/mainConstants')
const { createPersonalAccessToken } = require('@/modules/core/services/tokens')

/**
 * Create an auth token for the specified user (use only during tests, of course)
 * @param {string} userId User's ID
 * @param {string[]} scopes Specify scopes you want to allow. Defaults to all scopes.
 * @returns {Promise<string>}
 */
async function createAuthTokenForUser(userId, scopes = AllScopes) {
  return await createPersonalAccessToken(userId, 'test-runner-token', scopes)
}

module.exports = {
  createAuthTokenForUser
}
