/**
 * Get the default expiration time for an SSO session based on the current time.
 * TODO: Is 7 days a good default session length?
 */
export const getDefaultSsoSessionExpirationDate = (): Date => {
  const now = new Date()
  now.setDate(now.getDate() + 7)
  return now
}
