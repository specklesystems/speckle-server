import { describe, expect, it } from 'vitest'
import {
  isMinimumProjectRole,
  isMinimumWorkspaceRole,
  isMinimumServerRole
} from './roles.js'
import { InvalidRoleError } from '../errors.js'

describe('authz domain roles', () => {
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
  describe('isMinimumWorkspaceRole', () => {
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
  describe('isMinimumServerRole', () => {
    it('returns true if role has bigger weight than target role', () => {
      expect(isMinimumServerRole('server:admin', 'server:user')).toBe(true)
    })
    it('returns true if role has the same weight as the target role', () => {
      expect(isMinimumServerRole('server:admin', 'server:admin')).toBe(true)
    })
    it('returns false if role has smaller weight than target role', () => {
      expect(isMinimumServerRole('server:guest', 'server:admin')).toBe(false)
    })
    it('throws an error if target role is invalid', () => {
      expect(() =>
        // @ts-expect-error im testing an invalid target role
        isMinimumServerRole('server:admin', 'server:invalid')
      ).toThrow(InvalidRoleError)
    })
    it('throws an error if role is invalid', () => {
      expect(() =>
        // @ts-expect-error im testing an invalid role
        isMinimumServerRole('server:invalid', 'server:admin')
      ).toThrow(InvalidRoleError)
    })
  })
})
