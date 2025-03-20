import { describe, expect, it } from 'vitest'
import { requireExactProjectVisibility } from './projects.js'
import cryptoRandomString from 'crypto-random-string'
import { Project } from '../domain/projects/types.js'

describe('requireExactProject Visibility returns a function, that', () => {
  it('throws if project does not exist', () => {
    const test = requireExactProjectVisibility({
      loaders: {
        getProject: () => Promise.resolve(null)
      }
    })
    expect(() =>
      test({
        projectVisibility: 'linkShareable',
        projectId: cryptoRandomString({ length: 9 })
      })
    ).toThrow()
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
