import { Roles } from '@speckle/shared'

export function isGuest(user?: { role?: string }) {
  return user?.role === Roles.Server.Guest
}
