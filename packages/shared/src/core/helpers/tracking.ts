import { md5 } from '../utils/md5'

export function resolveMixpanelUserId(email: string): string {
  return '@' + md5(email.toLowerCase()).toUpperCase()
}
