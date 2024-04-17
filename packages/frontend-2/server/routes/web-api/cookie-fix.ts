import type { Optional } from '@speckle/shared'
import { has, isObjectLike } from 'lodash-es'

type TempCookieValue = { expires?: Optional<string>; maxAge?: Optional<number> }

const isValidTempCookieValue = (cookie: unknown): cookie is TempCookieValue => {
  if (!isObjectLike(cookie)) return false
  return has(cookie, 'expires') || has(cookie, 'maxAge')
}

export default defineEventHandler((event) => {
  const cookies = parseCookies(event)
  for (const [key, val] of Object.entries(cookies)) {
    if (key.startsWith('tmp-')) {
      // Try reading in cookie settings
      let tempCookieVal: Optional<TempCookieValue> = undefined
      try {
        const parsedVal = JSON.parse(val) as unknown
        if (isValidTempCookieValue(parsedVal)) {
          tempCookieVal = parsedVal
        }
      } catch (e) {
        deleteCookie(event, key)
        continue
      }

      if (!tempCookieVal) {
        deleteCookie(event, key)
        continue
      }

      // Try finding cookie that we need to fix
      const cookieName = key.replace('tmp-', '')
      const cookieValue = cookies[cookieName]
      if (!cookieValue) {
        deleteCookie(event, key)
        continue
      }

      // Create new cookie with the correct settings
      setCookie(event, cookieName, cookieValue, {
        maxAge: tempCookieVal.maxAge,
        expires: tempCookieVal.expires ? new Date(tempCookieVal.expires) : undefined
      })
      deleteCookie(event, key)
    }
  }

  return { status: 'ok' }
})
