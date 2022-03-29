/**
 * Check whether or not a stream can be favorited by the active user
 */
export function canBeFavorited(stream) {
  return stream && (stream.isPublic || stream.role)
}
