import { assert, describe, expect, it } from 'vitest'
import { Roles } from '../../../core/constants.js'
import { canCreateProjectPolicy } from './canCreate.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'
import { err, ok } from 'true-myth/result'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerPersonalProjectsDisabledError
} from '../../domain/authErrors.js'

const canCreateProjectArgs = () => ({
  userId: cryptoRandomString({ length: 10 })
})

describe('canCreateProjectPolicy creates a function, that handles', () => {
  describe('server environment variables', () => {
    it('allows project creation if workspaces are disabled', async () => {
      const result = await canCreateProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: async () => {
          return ok(Roles.Server.Admin)
        }
      })(canCreateProjectArgs())

      expect(result).toStrictEqual(ok())
    })
    it('allows project creation if workspaces are enabled but new plans are not', async () => {
      const result = await canCreateProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: async () => {
          return ok(Roles.Server.Admin)
        }
      })(canCreateProjectArgs())

      expect(result).toStrictEqual(ok())
    })
    it('forbids project creation when workspaces and new plans are enabled', async () => {
      const result = await canCreateProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'true'
          }),
        getServerRole: async () => {
          assert.fail()
        }
      })(canCreateProjectArgs())

      expect(result).toStrictEqual(err(new ServerPersonalProjectsDisabledError()))
    })
  })
  describe('user server roles', () => {
    it('forbids project creation if user information is missing from request', async () => {
      const result = await canCreateProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: async () => {
          assert.fail()
        }
      })({})

      expect(result).toStrictEqual(err(new ServerNoSessionError()))
    })
    it.each([Roles.Server.ArchivedUser, Roles.Server.Guest])(
      'forbids project creation if user is $role',
      async (role) => {
        const result = await canCreateProjectPolicy({
          getEnv: async () =>
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'false',
              FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
            }),
          getServerRole: async () => ok(role)
        })(canCreateProjectArgs())

        expect(result).toStrictEqual(err(new ServerNoAccessError()))
      }
    )
    it.each([Roles.Server.User, Roles.Server.Admin])(
      'allows project creation if user is $role',
      async (role) => {
        const result = await canCreateProjectPolicy({
          getEnv: async () =>
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'false',
              FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
            }),
          getServerRole: async () => ok(role)
        })(canCreateProjectArgs())

        expect(result).toStrictEqual(ok())
      }
    )
  })
})
