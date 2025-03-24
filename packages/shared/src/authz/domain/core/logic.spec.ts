import { describe, expect, it } from 'vitest'
import { isMinimumServerRole } from './logic.js'
import { InvalidRoleError } from '../errors.js'

describe('project logic', () => {
  describe('isMinimumServerRole', () => {
    it('returns true if role has bigger weight than target role', () => {
      expect(isMinimumServerRole('server:admin', 'server:user')).toBe(true)
    })
    it('returns true if role has the same weight as the target role', () => {
      expect(isMinimumServerRole('server:user', 'server:user')).toBe(true)
    })
    it('returns false if role has smaller weight than target role', () => {
      expect(isMinimumServerRole('server:guest', 'server:user')).toBe(false)
    })
    it('throws an error if the target role is invalid', () => {
      //@ts-expect-error im testing invalid target role here
      expect(() => isMinimumServerRole('server:user', 'invalid')).toThrow(
        InvalidRoleError
      )
    })
    it('throws an error if the role is invalid', () => {
      //@ts-expect-error im testing invalid role here
      expect(() => isMinimumServerRole('invalid', 'server:user')).toThrow(
        InvalidRoleError
      )
    })
  })
})
