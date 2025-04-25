import cryptoRandomString from 'crypto-random-string'

export function createRandomString(length?: number) {
  return cryptoRandomString({ length: length ?? 10 })
}
