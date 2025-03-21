import { describe, expect, it } from 'vitest'
import { requireExactProjectVisibility } from './projects.js'
import cryptoRandomString from 'crypto-random-string'
import { Project } from '../domain/projects/types.js'

describe('requireExactProjectVisibility returns a function, that', () => {
  it('throws if project does not exist', async () => {
    const test = requireExactProjectVisibility({
      loaders: {
        getProject: () => Promise.resolve(null)
      }
    })
    await expect(
      test({
        projectVisibility: 'linkShareable',
        projectId: cryptoRandomString({ length: 9 })
      })
    ).rejects.toThrow()
  })
  it('correctly asserts link shareable projects', async () => {
    const result = await requireExactProjectVisibility({
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
    const result = await requireExactProjectVisibility({
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
  it('correct asserts private projects', async () => {
    const result = await requireExactProjectVisibility({
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
})
