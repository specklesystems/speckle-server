import { describe, expect, it } from 'vitest'
import { canCreatePersonalProjectPolicy } from './canCreatePersonal.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import {
  ProjectNoAccessError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError
} from '../../domain/authErrors.js'

const buildSUT = (
  overrides?: Partial<Parameters<typeof canCreatePersonalProjectPolicy>[0]>
) =>
  canCreatePersonalProjectPolicy({
    getEnv: async () =>
      parseFeatureFlags({
        FF_WORKSPACES_MODULE_ENABLED: 'false'
      }),
    getServerRole: async () => 'server:user',
    ...(overrides || {})
  })

describe('canCreateProject', () => {
  it('returns error if user is not logged in', async () => {
    const canCreateProject = buildSUT()

    const result = await canCreateProject({ userId: undefined })
    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  // TODO: Re-enable when ready
  it.skip('returns error if workspaces module is enabled', async () => {
    const canCreateProject = buildSUT({
      getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' })
    })

    const result = await canCreateProject({ userId: 'user-id' })
    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })

  it('returns error if user not found at all', async () => {
    const canCreateProject = buildSUT({
      getServerRole: async () => null
    })

    const result = await canCreateProject({ userId: 'user-id' })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns error if user is a server guest', async () => {
    const canCreateProject = buildSUT({
      getServerRole: async () => 'server:guest'
    })

    const result = await canCreateProject({ userId: 'user-id' })
    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns ok if user is a server user', async () => {
    const canCreateProject = buildSUT()
    const result = await canCreateProject({ userId: 'user-id' })
    expect(result).toBeAuthOKResult()
  })
})
