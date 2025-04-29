import { describe, expect, it } from 'vitest'
import { OverridesOf } from '../../tests/helpers/types.js'
import {
  checkIfAdminOverrideEnabledFragment,
  ensureMinimumServerRoleFragment
} from './server.js'
import { Roles } from '../../core/constants.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError
} from '../domain/authErrors.js'

describe('ensureMinimumServerRoleFragment', () => {
  const buildSUT = (overrides?: OverridesOf<typeof ensureMinimumServerRoleFragment>) =>
    ensureMinimumServerRoleFragment({
      getServerRole: async () => Roles.Server.User,
      ...overrides
    })

  it('returns ok when user has minimum server role', async () => {
    const sut = buildSUT()
    const result = await sut({ userId: 'userId', role: Roles.Server.User })
    expect(result).toBeAuthOKResult()
  })

  it('returns err when user is not authed', async () => {
    const sut = buildSUT()
    const result = await sut({ userId: undefined, role: Roles.Server.User })
    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })

  it('returns err when user does not have a valid role at all', async () => {
    const sut = buildSUT({
      getServerRole: async () => null
    })
    const result = await sut({ userId: 'userId', role: Roles.Server.Guest })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })

  it('returns err when user does have the required role or above', async () => {
    const sut = buildSUT()
    const result = await sut({ userId: 'userId', role: Roles.Server.Admin })
    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })

  it('returns no access err even if asking for non-lowest role, but one is not found at all', async () => {
    const sut = buildSUT({
      getServerRole: async () => null
    })
    const result = await sut({ userId: 'userId', role: Roles.Server.User })
    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })
})

describe('checkIfAdminOverrideEnabledFragment', () => {
  const buildSUT = (
    overrides?: OverridesOf<typeof checkIfAdminOverrideEnabledFragment>
  ) =>
    checkIfAdminOverrideEnabledFragment({
      getAdminOverrideEnabled: async () => true,
      getServerRole: async () => Roles.Server.Admin,
      ...overrides
    })

  it('returns true when admin override is enabled', async () => {
    const sut = buildSUT()
    const result = await sut({ userId: 'userId' })
    expect(result).toBeOKResult({ value: true })
  })

  it('returns false when env var is disabled', async () => {
    const sut = buildSUT({
      getAdminOverrideEnabled: async () => false
    })
    const result = await sut({ userId: 'userId' })
    expect(result).toBeOKResult({ value: false })
  })

  it('returns false when user does not have minimum server role', async () => {
    const sut = buildSUT({
      getServerRole: async () => Roles.Server.Guest
    })
    const result = await sut({ userId: 'userId' })
    expect(result).toBeOKResult({ value: false })
  })

  it('returns false if user is not authed', async () => {
    const sut = buildSUT()
    const result = await sut({ userId: undefined })
    expect(result).toBeOKResult({ value: false })
  })

  it('returns false if user has no role at all', async () => {
    const sut = buildSUT({
      getServerRole: async () => null
    })
    const result = await sut({ userId: 'userId' })
    expect(result).toBeOKResult({ value: false })
  })
})
