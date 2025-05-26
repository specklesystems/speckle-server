import crs from 'crypto-random-string'

/**
 * Returns a random email from example.org domain
 */
export function createRandomEmail() {
  return randomizeCase(`${crs({ length: 6 })}@example.org`)
}

export function createRandomPassword(length?: number) {
  return crs({ length: length ?? 10 })
}

/**
 * @deprecated use the one in shared
 */
export function createRandomString(length?: number) {
  return crs({ length: length ?? 10 })
}

export const randomizeCase = (str: string) =>
  str
    .split('')
    .map((char) => (Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()))
    .join('')
