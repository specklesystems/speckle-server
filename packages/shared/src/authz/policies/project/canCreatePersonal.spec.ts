import { describe, expect, it } from 'vitest'
import { canCreatePersonalProjectPolicy } from './canCreatePersonal.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import {
  PersonalProjectsLimitedError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError
} from '../../domain/authErrors.js'
import { OverridesOf } from '../../../tests/helpers/types.js'

const buildSUT = (overrides?: OverridesOf<typeof canCreatePersonalProjectPolicy>) =>
  canCreatePersonalProjectPolicy({
    getEnv: async () =>
      parseFeatureFlags({
        FF_PERSONAL_PROJECTS_LIMITS_ENABLED: 'false',
        FF_WORKSPACES_MODULE_ENABLED: 'true'
      }),
    getServerRole: async () => 'server:user',
    ...(overrides || {})
  })

describe('canCreatePersonalProject', () => {
  it('returns error if user is not logged in', async () => {
    const canCreateProject = buildSUT()

    const result = await canCreateProject({ userId: undefined })
    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns error if personal project limits enabled', async () => {
    const canCreateProject = buildSUT({
      getEnv: async () =>
        parseFeatureFlags({ FF_PERSONAL_PROJECTS_LIMITS_ENABLED: 'true' })
    })

    const result = await canCreateProject({ userId: 'user-id' })
    expect(result).toBeAuthErrorResult({
      code: PersonalProjectsLimitedError.code
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
