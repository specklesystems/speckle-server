import { assert, describe, expect, it } from 'vitest'
import {
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { nanoid } from 'nanoid'
import { canCreateWorkspaceProjectPolicy } from './canCreateWorkspaceProject.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import cryptoRandomString from 'crypto-random-string'
import { WorkspacePlan } from '../../../workspaces/index.js'
import { Workspace, WorkspaceSsoProvider } from '../../domain/workspaces/types.js'

const canCreateArgs = () => ({
  userId: cryptoRandomString({ length: 10 }),
  workspaceId: cryptoRandomString({ length: 10 })
})

describe('canCreateWorkspaceProjectPolicy creates a function, that handles', () => {
  describe('server environment configuration by', () => {
    it('forbids creation if the workspaces module is not enabled', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
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
        getWorkspacePlan: async () => {
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

      expect(result).toBeAuthErrorResult({
        code: WorkspacesNotEnabledError.code
      })
    })
  })

  describe('user server roles', () => {
    it('forbids creation for unknown users', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
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
        getWorkspacePlan: async () => {
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
      })({ workspaceId: '' })

      expect(result).toBeAuthErrorResult({
        code: ServerNoSessionError.code
      })
    })
    it('forbids creation for anyone not having minimum server:user role', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
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
        getWorkspacePlan: async () => {
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

      expect(result).toBeAuthErrorResult({
        code: ServerNotEnoughPermissionsError.code
      })
    })
  })

  describe('workspace sso', () => {
    const workspaceSlug = nanoid()

    it('forbids creation when workspace not found', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          assert.fail()
        },
        getWorkspace: async () => {
          return null
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspacePlan: async () => {
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

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('forbids creation when sso session is not found', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {
            slug: workspaceSlug
          } as Workspace
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspacePlan: async () => {
          assert.fail()
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          return {} as WorkspaceSsoProvider
        },
        getWorkspaceSsoSession: async () => {
          return null
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code,
        payload: { workspaceSlug }
      })
    })
    // it('throws UncoveredError from unexpected sso session errors')
  })

  describe('user workspace roles', () => {
    it('forbids creation for users without a workspace role', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return null
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspacePlan: async () => {
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

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })
    it('WorkspaceNotEnoughPermissionsError for workspace guests', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:guest'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          assert.fail()
        },
        getWorkspacePlan: async () => {
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

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNotEnoughPermissionsError.code,
        message: 'Guests cannot create projects in the workspace'
      })
    })
    it('forbids non-editor seats from creating projects', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'viewer'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'valid',
            name: 'team'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoEditorSeatError.code
      })
    })
  })

  describe('workspace plans', () => {
    it('forbids creation if plan fails to load', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'viewer'
        },
        getWorkspacePlan: async () => {
          return null
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })
    it('forbids creation if plan is read-only', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'viewer'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'canceled'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          assert.fail()
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceReadOnlyError.code
      })
    })
  })

  describe('workspace limits', () => {
    it('forbids creation if limits fail to load', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'editor'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'valid'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          return null
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })
    it('allows creation if plan has no limits', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'editor'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'valid'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          return {
            projectCount: null,
            modelCount: null,
            versionsHistory: null,
            commentHistory: null
          }
        },
        getWorkspaceProjectCount: async () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthOKResult()
    })
    it('forbids creation if current project count fails to load', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'editor'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'valid'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          return {
            projectCount: 10,
            modelCount: 50,
            versionsHistory: null,
            commentHistory: null
          }
        },
        getWorkspaceProjectCount: async () => {
          return null
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })
    it('allows creation if new project is within plan limits', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'editor'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'valid'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          return {
            projectCount: 10,
            modelCount: 50,
            versionsHistory: null,
            commentHistory: null
          }
        },
        getWorkspaceProjectCount: async () => {
          return 5
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthOKResult()
    })
    it('forbids creation if new project is not within plan limits', async () => {
      const result = await canCreateWorkspaceProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'true' }),
        getServerRole: async () => {
          return 'server:user'
        },
        getWorkspaceRole: async () => {
          return 'workspace:member'
        },
        getWorkspace: async () => {
          return {} as Workspace
        },
        getWorkspaceSeat: async () => {
          return 'editor'
        },
        getWorkspacePlan: async () => {
          return {
            status: 'valid'
          } as WorkspacePlan
        },
        getWorkspaceLimits: async () => {
          return {
            projectCount: 10,
            modelCount: 50,
            versionsHistory: null,
            commentHistory: null
          }
        },
        getWorkspaceProjectCount: async () => {
          return 10
        },
        getWorkspaceSsoProvider: async () => {
          return null
        },
        getWorkspaceSsoSession: async () => {
          assert.fail()
        }
      })(canCreateArgs())

      expect(result).toBeAuthErrorResult({
        code: WorkspaceLimitsReachedError.code,
        payload: { limit: 'projectCount' }
      })
    })
  })
})
