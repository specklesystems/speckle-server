import { assert, describe, expect, it } from 'vitest'
import {
  EligibleForExclusiveWorkspaceError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspacesNotEnabledError
} from '../../domain/authErrors.js'
import { canCreateWorkspacePolicy } from './canCreateWorkspace.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'

const createTestArgs = () => ({
  userId: cryptoRandomString({ length: 10 })
})

describe('canCreateWorkspacePolicy creates a function, that handles', () => {
  describe('server environment configuration by', () => {
    it('forbids creation if the workspaces module is not enabled', async () => {
      const result = await canCreateWorkspacePolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false'
          }),
        getServerRole: async () => {
          assert.fail()
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async () => {
          assert.fail()
        }
      })(createTestArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspacesNotEnabledError.code
      })
    })
  })

  describe('user server roles', () => {
    it('forbids creation for users without a session', async () => {
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return null
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async () => {
          assert.fail()
        }
      })({})

      expect(result).toBeAuthErrorResult({
        code: ServerNoSessionError.code
      })
    })

    it('forbids creation for users with no server role', async () => {
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return null
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async () => {
          assert.fail()
        }
      })({ userId: cryptoRandomString({ length: 10 }) })

      expect(result).toBeAuthErrorResult({
        code: ServerNoAccessError.code
      })
    })

    it('forbids creation for users with insufficient server role', async () => {
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.Guest
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async () => {
          assert.fail()
        }
      })(createTestArgs())

      expect(result).toBeAuthErrorResult({
        code: ServerNotEnoughPermissionsError.code
      })
    })
  })

  describe('workspace eligibility', () => {
    it('forbids creation for users eligible for exclusive workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Regular Workspace',
              slug: 'regular-workspace',
              isExclusive: false
            },
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace',
              slug: 'exclusive-workspace',
              isExclusive: true
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthErrorResult({
        code: EligibleForExclusiveWorkspaceError.code
      })
    })

    it('allows creation for users not eligible for any exclusive workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Regular Workspace 1',
              slug: 'regular-workspace-1',
              isExclusive: false
            },
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Regular Workspace 2',
              slug: 'regular-workspace-2',
              isExclusive: false
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })

    it('allows creation for users with no eligible workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return []
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })

    it('allows creation for admin users even if eligible for exclusive workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.Admin
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace',
              slug: 'exclusive-workspace',
              isExclusive: true,
              role: Roles.Workspace.Admin
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })

    it('allows creation for workspace admins of exclusive workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace',
              slug: 'exclusive-workspace',
              isExclusive: true,
              role: Roles.Workspace.Admin
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })

    it('allows creation for workspace guests of exclusive workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace',
              slug: 'exclusive-workspace',
              isExclusive: true,
              role: Roles.Workspace.Guest
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })

    it('forbids creation for workspace members of exclusive workspaces', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace',
              slug: 'exclusive-workspace',
              isExclusive: true,
              role: Roles.Workspace.Member
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthErrorResult({
        code: EligibleForExclusiveWorkspaceError.code
      })
    })

    it('forbids creation for workspace admins if they have a member role on an exclusive workspace', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace 1',
              slug: 'exclusive-workspace-1',
              isExclusive: true,
              role: Roles.Workspace.Admin
            },
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace 2',
              slug: 'exclusive-workspace-2',
              isExclusive: true,
              role: Roles.Workspace.Member
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthErrorResult({
        code: EligibleForExclusiveWorkspaceError.code
      })
    })

    it('allows creation for workspace admins even with mixed exclusive workspace roles', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace 1',
              slug: 'exclusive-workspace-1',
              isExclusive: true,
              role: Roles.Workspace.Admin
            },
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace 2',
              slug: 'exclusive-workspace-2',
              isExclusive: true,
              role: Roles.Workspace.Guest
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })

    it('allows creation when all workspace roles pass the policy', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const result = await canCreateWorkspacePolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return Roles.Server.User
        },
        getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: async ({
          userId: queriedUserId
        }) => {
          expect(queriedUserId).toBe(userId)
          return [
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace 1',
              slug: 'exclusive-workspace-1',
              isExclusive: false,
              role: Roles.Workspace.Member
            },
            {
              id: cryptoRandomString({ length: 10 }),
              name: 'Exclusive Workspace 2',
              slug: 'exclusive-workspace-2',
              isExclusive: true,
              role: Roles.Workspace.Guest
            }
          ]
        }
      })({ userId })

      expect(result).toBeAuthOKResult()
    })
  })
})
