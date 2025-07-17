import { describe, expect, it } from 'vitest'
import { canEditFunctionPolicy } from './canEditFunction.js'
import { OverridesOf } from '../../../../tests/helpers/types.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'
import {
  AutomateFunctionNotCreatorError,
  AutomateFunctionNotFoundError,
  AutomateNotEnabledError
} from '../../../domain/authErrors.js'

describe('canEditFunctionPolicy creates a function, that', () => {
  const buildCanEditFunctionPolicy = (
    overrides?: OverridesOf<typeof canEditFunctionPolicy>
  ) =>
    canEditFunctionPolicy({
      getEnv: async () =>
        parseFeatureFlags({
          FF_AUTOMATE_MODULE_ENABLED: 'true'
        }),
      getAutomateFunction: async () => null,
      ...overrides
    })

  it('forbids edit if automate is not enabled', async () => {
    const result = await buildCanEditFunctionPolicy({
      getEnv: async () =>
        parseFeatureFlags({
          FF_AUTOMATE_MODULE_ENABLED: 'false'
        })
    })({
      functionId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthErrorResult({
      code: AutomateNotEnabledError.code
    })
  })

  it('forbids edit if function cannot be found', async () => {
    const result = await buildCanEditFunctionPolicy()({
      functionId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthErrorResult({
      code: AutomateFunctionNotFoundError.code
    })
  })

  it('forbids edit if user is not function creator', async () => {
    const result = await buildCanEditFunctionPolicy({
      getAutomateFunction: async ({ functionId }) => ({
        id: functionId,
        name: cryptoRandomString({ length: 9 }),
        functionCreator: {
          speckleUserId: cryptoRandomString({ length: 9 }),
          speckleServerOrigin: 'example.org'
        },
        workspaceIds: []
      })
    })({
      functionId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthErrorResult({
      code: AutomateFunctionNotCreatorError.code
    })
  })

  it('allows edit for function creators', async () => {
    const userId = cryptoRandomString({ length: 9 })

    const result = await buildCanEditFunctionPolicy({
      getAutomateFunction: async ({ functionId }) => ({
        id: functionId,
        name: cryptoRandomString({ length: 9 }),
        functionCreator: {
          speckleUserId: userId,
          speckleServerOrigin: 'example.org'
        },
        workspaceIds: []
      })
    })({
      userId,
      functionId: cryptoRandomString({ length: 9 })
    })

    expect(result).toBeAuthOKResult()
  })
})
