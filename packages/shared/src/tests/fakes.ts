import { merge } from 'lodash'
import { Project } from '../authz/domain/projects/types.js'

export const fakeGetFactory =
  <T extends Record<string, unknown>>(defaults: T) =>
  (overrides?: Partial<T>) =>
  (): Promise<T> => {
    if (overrides) {
      return Promise.resolve(merge(defaults, overrides))
    }
    return Promise.resolve(defaults)
  }

export const getProjectFake = fakeGetFactory<Project>({
  isPublic: false,
  isDiscoverable: false,
  workspaceId: null
})
