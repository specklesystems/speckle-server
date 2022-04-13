/**
 * Generate a random string of any length
 * @param {number} length
 * @returns
 */
export function randomString(length) {
  return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
    .toString(36)
    .slice(1)
}
