import { Nullable, Roles } from '@speckle/shared'

export function isGuest(user?: { role?: string }) {
  return user?.role === Roles.Server.Guest
}

export function isAdmin(user?: Nullable<{ role?: Nullable<string> }>) {
  return user?.role === Roles.Server.Admin
}
