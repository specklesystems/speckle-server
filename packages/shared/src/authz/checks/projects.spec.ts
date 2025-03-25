import { describe, expect, it } from 'vitest'
import {
  requireExactProjectVisibilityFactory,
  requireMinimumProjectRoleFactory
} from './projects.js'
import cryptoRandomString from 'crypto-random-string'
import { Project } from '../domain/projects/types.js'
import { Roles, UncoveredError } from '../../core/index.js'

describe('project checks', () => {
  describe('requireExactProjectVisibilityFactory returns a function, that', () => {
    it('throws if project does not exist', async () => {
      const requireExactProjectVisibility = requireExactProjectVisibilityFactory({
        loaders: {
          getProject: () => Promise.resolve(null)
        }
      })
      await expect(
        requireExactProjectVisibility({
          projectVisibility: 'linkShareable',
          projectId: cryptoRandomString({ length: 9 })
        })
      ).rejects.toThrow()
    })
    it('correctly asserts link shareable projects', async () => {
      const result = await requireExactProjectVisibilityFactory({
        loaders: {
          getProject: () =>
            Promise.resolve({
              isDiscoverable: true
            } as Project)
        }
      })({
        projectVisibility: 'linkShareable',
        projectId: cryptoRandomString({ length: 9 })
      })
      expect(result).toEqual(true)
    })
    it('correctly asserts public projects', async () => {
      const result = await requireExactProjectVisibilityFactory({
        loaders: {
          getProject: () =>
            Promise.resolve({
              isPublic: true
            } as Project)
        }
      })({
        projectVisibility: 'public',
        projectId: cryptoRandomString({ length: 9 })
      })
      expect(result).toEqual(true)
    })
    it('correctly asserts private projects', async () => {
      const result = await requireExactProjectVisibilityFactory({
        loaders: {
          getProject: () =>
            Promise.resolve({
              isDiscoverable: false,
              isPublic: false
            } as Project)
        }
      })({
        projectVisibility: 'private',
        projectId: cryptoRandomString({ length: 9 })
      })
      expect(result).toEqual(true)
    })
    it('throws for unknown project visibility', async () => {
      await expect(
        requireExactProjectVisibilityFactory({
          loaders: {
            getProject: () =>
              Promise.resolve({
                isDiscoverable: false,
                isPublic: false
              } as Project)
          }
        })({
          // @ts-expect-error this is what im testing here
          projectVisibility: 'unknown',
          projectId: cryptoRandomString({ length: 9 })
        })
      ).rejects.toThrow(UncoveredError)
    })
  })
  describe('requireMinimumProjectRoleFactory return a function, that', () => {
    it('returns false, if there is no role for the user', async () => {
      const result = await requireMinimumProjectRoleFactory({
        loaders: {
          getProjectRole: () => Promise.resolve(null)
        }
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(false)
    })
    it('returns false, if the role is not sufficient', async () => {
      const result = await requireMinimumProjectRoleFactory({
        loaders: {
          getProjectRole: () => Promise.resolve(Roles.Stream.Reviewer)
        }
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(false)
    })
    it('returns true, if the role is sufficient', async () => {
      const result = await requireMinimumProjectRoleFactory({
        loaders: {
          getProjectRole: () => Promise.resolve(Roles.Stream.Contributor)
        }
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(true)
    })
  })
})
