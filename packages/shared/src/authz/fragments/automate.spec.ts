import { describe, expect, it } from 'vitest'
import {
  ensureAutomateEnabledFragment,
  ensureAutomateFunctionCreatorFragment
} from './automate.js'
import { OverridesOf } from '../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'
import {
  AutomateFunctionNotCreatorError,
  AutomateFunctionNotFoundError,
  AutomateNotEnabledError
} from '../domain/authErrors.js'

describe('ensureAutomateEnabledFragment', () => {
  const buildFragment = (
    overrides?: OverridesOf<typeof ensureAutomateEnabledFragment>
  ) =>
    ensureAutomateEnabledFragment({
      getEnv: async () =>
        parseFeatureFlags({
          FF_AUTOMATE_MODULE_ENABLED: 'true'
        }),
      ...overrides
    })

  it('returns ok when automate is enabled', async () => {
    const result = await buildFragment()({})
    expect(result).toBeAuthOKResult()
  })

  it('returns err when automate is disabled', async () => {
    const result = await buildFragment({
      getEnv: async () =>
        parseFeatureFlags({
          FF_AUTOMATE_MODULE_ENABLED: 'false'
        })
    })({})
    expect(result).toBeAuthErrorResult({
      code: AutomateNotEnabledError.code
    })
  })
})

describe('ensureAutomateFunctionCreatorFragment', () => {
  const buildFragment = (
    overrides?: OverridesOf<typeof ensureAutomateFunctionCreatorFragment>
  ) =>
    ensureAutomateFunctionCreatorFragment({
      getAutomateFunction: async ({ functionId }) => {
        return {
          id: functionId,
          name: cryptoRandomString({ length: 9 }),
          functionCreator: {
            speckleUserId: 'foo',
            speckleServerOrigin: 'example.org'
          },
          workspaceIds: []
        }
      },
      ...overrides
    })

  it('returns ok when user is function creator', async () => {
    const userId = cryptoRandomString({ length: 9 })

    const result = await buildFragment({
      getAutomateFunction: async ({ functionId }) => {
        return {
          id: functionId,
          name: cryptoRandomString({ length: 9 }),
          functionCreator: {
            speckleUserId: userId,
            speckleServerOrigin: 'example.org'
          },
          workspaceIds: []
        }
      }
    })({
      userId,
      functionId: cryptoRandomString({ length: 9 })
    })

    expect(result).toBeAuthOKResult()
  })

  it('return err if function is not found', async () => {
    const result = await buildFragment({
      getAutomateFunction: async () => null
    })({
      userId: cryptoRandomString({ length: 9 }),
      functionId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthErrorResult({
      code: AutomateFunctionNotFoundError.code
    })
  })

  it('returns err if user is not function creator', async () => {
    const result = await buildFragment({
      getAutomateFunction: async ({ functionId }) => {
        return {
          id: functionId,
          name: cryptoRandomString({ length: 9 }),
          functionCreator: {
            speckleUserId: cryptoRandomString({ length: 9 }),
            speckleServerOrigin: 'example.org'
          },
          workspaceIds: []
        }
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      functionId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthErrorResult({
      code: AutomateFunctionNotCreatorError.code
    })
  })
})
