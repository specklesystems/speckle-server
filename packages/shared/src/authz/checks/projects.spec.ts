import { describe, expect, it } from 'vitest'
import { isPubliclyReadableProject, hasMinimumProjectRole } from './projects.js'
import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../core/index.js'
import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ProjectRoleNotFoundError,
  WorkspaceSsoSessionInvalidError
} from '../domain/authErrors.js'
import { getProjectFake } from '../../tests/fakes.js'

describe('project checks', () => {
  describe('isPubliclyReadableProject returns a function, that', () => {
    it('throws uncoveredError for unexpected loader errors', async () => {
      await expect(
        isPubliclyReadableProject({
          // @ts-expect-error deliberately testing an unexpeceted error type
          getProject: async () => err(ProjectRoleNotFoundError)
        })({ projectId: cryptoRandomString({ length: 10 }) })
      ).rejects.toThrowError(/Uncovered error/)
    })
    it.each([
      ProjectNotFoundError,
      ProjectNoAccessError,
      WorkspaceSsoSessionInvalidError
    ])('turns expected loader error $code into false ', async (loaderError) => {
      const result = await isPubliclyReadableProject({
        getProject: async () => err(loaderError)
      })({ projectId: cryptoRandomString({ length: 10 }) })
      expect(result).toEqual(false)
    })
    it('returns true for public projects', async () => {
      const result = await isPubliclyReadableProject({
        getProject: getProjectFake({ isPublic: true })
      })({ projectId: cryptoRandomString({ length: 10 }) })
      expect(result).toEqual(true)
    })
    it('returns true for discoverable projects', async () => {
      const result = await isPubliclyReadableProject({
        getProject: getProjectFake({ isDiscoverable: true })
      })({ projectId: cryptoRandomString({ length: 10 }) })
      expect(result).toEqual(true)
    })
  })
  describe('hasMinimumProjectRole returns a function, that', () => {
    it('throws uncoveredError for unexpected loader errors', async () => {
      await expect(
        hasMinimumProjectRole({
          // @ts-expect-error deliberately testing an unexpeceted error type
          getProjectRole: async () => err(ProjectNotFoundError)
        })({
          projectId: cryptoRandomString({ length: 10 }),
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Stream.Contributor
        })
      ).rejects.toThrowError(/Uncovered error/)
    })
    it('returns false, if there is no role for the user', async () => {
      const result = await hasMinimumProjectRole({
        getProjectRole: () => Promise.resolve(err(ProjectRoleNotFoundError))
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(false)
    })
    it('returns false, if the role is not sufficient', async () => {
      const result = await hasMinimumProjectRole({
        getProjectRole: () => Promise.resolve(ok(Roles.Stream.Reviewer))
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(false)
    })
    it('returns true, if the role is sufficient', async () => {
      const result = await hasMinimumProjectRole({
        getProjectRole: () => Promise.resolve(ok(Roles.Stream.Contributor))
      })({
        projectId: cryptoRandomString({ length: 10 }),
        userId: cryptoRandomString({ length: 10 }),
        role: Roles.Stream.Contributor
      })
      expect(result).toEqual(true)
    })
  })
})
