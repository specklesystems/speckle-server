import crs from 'crypto-random-string'
import { assign } from 'lodash'

export function createRandomEmail() {
  return randomizeCase(`${crs({ length: 6 })}@example.org`)
}

export function createRandomPassword(length?: number) {
  return crs({ length: length ?? 10 })
}

/**
 * @desc Generic utility to create builder fn with custom defaults for testing purposes
 */
export const buildTestObject = <T>(defaults: T, overrides?: Partial<T>): T => {
  return assign(defaults, overrides || {})
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
