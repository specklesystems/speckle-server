import { RelativeURL, type MaybeNullOrUndefined } from '@speckle/shared'
import type { RouteLocationNormalized } from 'vue-router'

export const checkIfIsInPlaceNavigation = (
  to?: MaybeNullOrUndefined<RouteLocationNormalized>,
  from?: MaybeNullOrUndefined<RouteLocationNormalized>
): boolean => {
  if (!to || !from) return false

  // if only hash state or querystring changed, its not a full on navigation to a new page
  const toUrl = new RelativeURL(to.fullPath)
  const fromUrl = new RelativeURL(from.fullPath)

  return toUrl.pathOnly === fromUrl.pathOnly
}
