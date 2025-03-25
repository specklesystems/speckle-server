import { describe, expect, it } from 'vitest'
import { isMinimumProjectRole } from './logic.js'
import { InvalidRoleError } from '../errors.js'

describe('project logic', () => {
  describe('isMinimumProjectRole', () => {
    it('returns true if role has bigger weight than target role', () => {
      expect(isMinimumProjectRole('stream:owner', 'stream:contributor')).toBe(true)
    })
    it('returns true if role has the same weight as the target role', () => {
      expect(isMinimumProjectRole('stream:contributor', 'stream:contributor')).toBe(
        true
      )
    })
    it('returns false if role has smaller weight than target role', () => {
      expect(isMinimumProjectRole('stream:reviewer', 'stream:contributor')).toBe(false)
    })
    it('throws an error if the target role is invalid', () => {
      //@ts-expect-error im testing invalid target role here
      expect(() => isMinimumProjectRole('stream:owner', 'invalid')).toThrow(
        InvalidRoleError
      )
    })
    it('throws an error if the role is invalid', () => {
      //@ts-expect-error im testing invalid role here
      expect(() => isMinimumProjectRole('invalid', 'stream:contributor')).toThrow(
        InvalidRoleError
      )
    })
  })
})
