/**
 * Collection of functions for resolving relative routes from the backend, so that they aren't duplicated
 * all over the place
 */

/**
 * @param {string} streamId
 * @returns {string}
 */
function getStreamRoute(streamId) {
  return `/streams/${streamId}`
}

function getRegistrationRoute() {
  return `/authn/register`
}

module.exports = {
  getStreamRoute,
  getRegistrationRoute
}
