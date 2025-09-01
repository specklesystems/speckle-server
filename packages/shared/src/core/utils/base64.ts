export function base64Encode(val: string): string {
  if (typeof window === 'undefined') {
    // Node.js
    return Buffer.from(val, 'utf8').toString('base64')
  } else {
    // Browser
    return btoa(unescape(encodeURIComponent(val)))
  }
}

export function base64Decode(val: string): string {
  if (typeof window === 'undefined') {
    // Node.js
    return Buffer.from(val, 'base64').toString('utf8')
  } else {
    // Browser
    return decodeURIComponent(escape(atob(val)))
  }
}
