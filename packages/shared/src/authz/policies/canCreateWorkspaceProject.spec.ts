import { assert, describe, expect, it } from 'vitest'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { nanoid } from 'nanoid'
import { canCreateWorkspaceProjectPolicy } from './canCreateWorkspaceProject.js'
import { parseFeatureFlags } from '../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'

const canCreateArgs = () => ({
  userId: cryptoRandomString({ length: 10 }),
  workspaceId: cryptoRandomString({ length: 10 })
})

describe('canCreateWorkspaceProjectPolicy creates a function, that handles', () => {
  describe('server environment configuration by', () => {
    it('forbids creation if the workspaces module is not enabled', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        }),
        getServerRole: async () => {
          assert.fail()
        },
        getWorkspaceRole: async () => {
          assert.fail()
        },
        getWorkspace: async () => {
          assert.fail()
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          assert.fail()
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toStrictEqual(new WorkspacesNotEnabledError())
    })
  })

  describe('user server roles', () => {
    it('forbids creation for unknown users', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getServerRole: async () => {
          return null
        },
        getWorkspaceRole: async () => {
          assert.fail()
        },
        getWorkspace: async () => {
          assert.fail()
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          assert.fail()
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toStrictEqual(new ServerNoSessionError())
    })
    it('forbids creation for anyone not having minimum server:user role', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getServerRole: async () => {
          return 'server:guest'
        },
        getWorkspaceRole: async () => {
          assert.fail()
        },
        getWorkspace: async () => {
          assert.fail()
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          assert.fail()
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toStrictEqual(new ServerNoAccessError())
    })
  })

  describe('workspace sso', () => {
    const workspaceSlug = nanoid()
    it.each([
      new WorkspaceNoAccessError(),
      new WorkspaceSsoSessionNoAccessError({ payload: { workspaceSlug } })
    ])('forbids creation with the expected $code', async (err) => { })
    it('throws UncoveredError from unexpected sso session errors', async () => { })
  })

  describe('user workspace roles', () => {
    it('forbids creation for users without a workspace role', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return null
        },
        getWorkspace: async () => {
          assert.fail()
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          assert.fail()
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toStrictEqual(new WorkspaceNoAccessError())
    })
    it('WorkspaceNotEnoughPermissionsError for workspace guests', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:guest'
        },
        getWorkspace: async () => {
          assert.fail()
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          assert.fail()
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toStrictEqual(new WorkspaceNoAccessError())
    })
    it('forbids non-editor seats from creating projects', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          assert.fail()
        },
        getWorkspaceSeat: async () => {
          return 'viewer'
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          assert.fail()
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toStrictEqual(new WorkspaceNotEnoughPermissionsError())
    })
  })

  describe('workspace limits', () => {
    it('forbids creation if limits fail to load', async () => { })
    it('allows creation if plan has no limits', async () => { })
    it('forbids creation if current project count fails to load', async () => { })
    it('allows creation if new project is within plan limits', async () => { })
    it('forbids creation if new project is not within plan limits', async () => { })
  })
})
