import { describe, expect, it } from 'vitest'
import { isPubliclyReadableProject, hasMinimumProjectRole } from './projects.js'
import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../core/index.js'
import { getProjectFake } from '../../tests/fakes.js'
import { ProjectVisibility } from '../domain/projects/types.js'

describe('project checks', () => {
  describe('isPubliclyReadableProject returns a function, that', () => {
    it('turns not found project into false ', async () => {
      const result = await isPubliclyReadableProject({
        getProject: async () => null
      })({ projectId: cryptoRandomString({ length: 10 }) })
      expect(result).toEqual(false)
    })
    it('returns true for public projects', async () => {
      const result = await isPubliclyReadableProject({
        getProject: getProjectFake({ visibility: ProjectVisibility.Public })
      })({ projectId: cryptoRandomString({ length: 10 }) })
      expect(result).toEqual(true)
    })
  })
  describe('hasMinimumProjectRole returns a function, that', () => {
    it('returns false for not existing project roles', async () => {
      await expect(
        hasMinimumProjectRole({
          getProjectRole: async () => null
        })({
          projectId: cryptoRandomString({ length: 10 }),
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Stream.Contributor
        })
      ).resolves.toStrictEqual(false)
    })
    it('returns false, if the role is not sufficient', async () => {
      const result = await hasMinimumProjectRole({
        getProjectRole: async () => Roles.Stream.Reviewer
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(false)
    })
    it('returns true, if the role is sufficient', async () => {
      const result = await hasMinimumProjectRole({
        getProjectRole: async () => Roles.Stream.Contributor
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(true)
    })
  })
})
