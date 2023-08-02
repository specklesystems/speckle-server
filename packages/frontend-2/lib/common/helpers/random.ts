/**
 * Generate a random string of any length
 */
export function randomString(length: number): string {
  return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
    .toString(36)
    .slice(1)
}
