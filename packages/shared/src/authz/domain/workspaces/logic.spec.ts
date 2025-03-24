import { describe, expect, it } from 'vitest'
import { isMinimumWorkspaceRole } from './logic.js'

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
  })
})
