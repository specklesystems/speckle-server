import { md5 } from '../utils/md5.js'

export function resolveMixpanelUserId(email: string): string {
  return '@' + md5(email.toLowerCase()).toUpperCase()
}

export function resolveMixpanelServerId(serverHostname: string): string {
  return md5(serverHostname.toLowerCase()).toUpperCase()
}
