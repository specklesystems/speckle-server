import crs from 'crypto-random-string'

export function createRandomEmail() {
  return `${crs({ length: 6 })}@example.org`
}

export function createRandomPassword() {
  return crs({ length: 10 })
}
