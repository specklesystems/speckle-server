import cryptoRandomString from 'crypto-random-string'
import { assert, describe, expect, it } from 'vitest'
import { canCreateProjectPolicyFactory } from './canCreate.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'

const canCreateProjectArgs = () => ({
  userId: cryptoRandomString({ length: 9 })
})

describe('canCreateProjectFactory creates a function, that', () => {
  describe('given server environment configuration ', () => {
    it('allows creation of personal projects when workspaces are disabled', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: () => Promise.resolve(Roles.Server.Admin)
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(true)
    })
    it('allows creation of personal projects when workspace are enabled but new plans are not', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: () => Promise.resolve(Roles.Server.Admin)
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(true)
    })
    it('forbids creation of personal projects when workspaces and new plans are enabled', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'true'
          }),
        getServerRole: () => {
          assert.fail()
        }
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(false)
    })
  })
  describe('given user server roles', () => {
    it('forbids server guests from creating personal projects', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: () => Promise.resolve(Roles.Server.Guest)
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(false)
    })
    it('forbids server archived users from creating personal projects', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: () => Promise.resolve(Roles.Server.ArchivedUser)
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(false)
    })
    it('allows server users to create personal projects', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: () => Promise.resolve(Roles.Server.User)
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(true)
    })
    it('allows server admins to create personal projects', async () => {
      const canCreateProject = canCreateProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false',
            FF_WORKSPACES_NEW_PLANS_ENABLED: 'false'
          }),
        getServerRole: () => Promise.resolve(Roles.Server.Admin)
      })
      const result = await canCreateProject(canCreateProjectArgs())
      expect(result.authorized).toBe(true)
    })
  })
})
