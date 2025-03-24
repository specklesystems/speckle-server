import { describe, expect, it } from 'vitest'
import { isMinimumWorkspaceRole } from './logic.js'
import { InvalidRoleError } from '../errors.js'

describe('project logic', () => {
  describe('isMinimumProjectRole', () => {
    it('returns true if role has bigger weight than target role', () => {
      expect(isMinimumWorkspaceRole('workspace:admin', 'workspace:member')).toBe(true)
    })
    it('returns true if role has the same weight as the target role', () => {
      expect(isMinimumWorkspaceRole('workspace:admin', 'workspace:admin')).toBe(true)
    })
    it('returns false if role has smaller weight than target role', () => {
      expect(isMinimumWorkspaceRole('workspace:guest', 'workspace:admin')).toBe(false)
    })
    it('throws an error if target role is invalid', () => {
      expect(() =>
        // @ts-expect-error im testing an invalid target role
        isMinimumWorkspaceRole('workspace:admin', 'workspace:invalid')
      ).toThrow(InvalidRoleError)
    })
    it('throws an error if role is invalid', () => {
      expect(() =>
        // @ts-expect-error im testing an invalid role
        isMinimumWorkspaceRole('workspace:invalid', 'workspace:admin')
      ).toThrow(InvalidRoleError)
    })
  })
})
