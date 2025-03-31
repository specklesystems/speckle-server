import { merge } from 'lodash'
import { Project } from '../authz/domain/projects/types.js'
import { ok, Result } from 'true-myth/result'
import { nanoid } from 'nanoid'

export const fakeGetFactory =
  <T extends Record<string, unknown>>(defaults: T) =>
  (overrides?: Partial<T>) =>
  (): Promise<Result<T, never>> => {
    if (overrides) {
      return Promise.resolve(ok(merge(defaults, overrides)))
    }
    return Promise.resolve(ok(defaults))
  }

export const getProjectFake = fakeGetFactory<Project>({
  id: nanoid(),
  isPublic: false,
  isDiscoverable: false,
  workspaceId: null
})
