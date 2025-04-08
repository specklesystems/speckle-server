import cryptoRandomString from 'crypto-random-string'
import { assert, describe, expect, it } from 'vitest'
import { canCreateModelPolicy } from './canCreateModel.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Roles } from '../../../core/constants.js'
import { Workspace } from '../../domain/workspaces/types.js'
import { WorkspacePlan } from '../../../workspaces/index.js'
import { Authz } from '../../../index.js'
import { Project } from '../../domain/projects/types.js'

const canCreateArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 })
})

describe('canCreateModelPolicy returns a function, that', () => {
  it('forbids unauthenticated users', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        assert.fail()
      },
      getProjectRole: async () => {
        assert.fail()
      },
      getServerRole: async () => {
        assert.fail()
      },
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        assert.fail()
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        assert.fail()
      },
      getWorkspaceLimits: async () => {
        assert.fail()
      },
      getWorkspaceModelCount: async () => {
        assert.fail()
      }
    })({ userId: undefined, projectId: '' })

    expect(result).toBeAuthErrorResult({
      code: Authz.ServerNoSessionError.code
    })
  })
  it('forbids users without server roles', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        assert.fail()
      },
      getProjectRole: async () => {
        assert.fail()
      },
      getServerRole: async () => {
        return null
      },
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        assert.fail()
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        assert.fail()
      },
      getWorkspaceLimits: async () => {
        assert.fail()
      },
      getWorkspaceModelCount: async () => {
        assert.fail()
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: Authz.ServerNoAccessError.code
    })
  })
  it('forbids users that are not at least stream contributors', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {} as Project
      },
      getProjectRole: async () => {
        return Roles.Stream.Reviewer
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        assert.fail()
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        assert.fail()
      },
      getWorkspaceLimits: async () => {
        assert.fail()
      },
      getWorkspaceModelCount: async () => {
        assert.fail()
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: Authz.ProjectNoAccessError.code
    })
  })
  it('allows stream contributors to create personal projects when workspaces are not enabled', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        }),
      getProject: async () => {
        return {} as Project
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        assert.fail()
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        assert.fail()
      },
      getWorkspaceLimits: async () => {
        assert.fail()
      },
      getWorkspaceModelCount: async () => {
        assert.fail()
      }
    })(canCreateArgs())

    expect(result).toBeAuthOKResult()
  })
  it('requires the project to not be in a workspace', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {
          id: cryptoRandomString({ length: 9 }),
          isPublic: false,
          isDiscoverable: false,
          workspaceId: null
        }
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        assert.fail()
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        assert.fail()
      },
      getWorkspaceLimits: async () => {
        assert.fail()
      },
      getWorkspaceModelCount: async () => {
        assert.fail()
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: Authz.WorkspaceRequiredError.code
    })
  })
  // Hold the workspace to a higher standard than myself
  it('requires the workspace to have a plan', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {
          id: cryptoRandomString({ length: 9 }),
          isPublic: false,
          isDiscoverable: false,
          workspaceId: cryptoRandomString({ length: 9 })
        }
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        return {} as Workspace
      },
      getWorkspaceRole: async () => {
        return Roles.Workspace.Guest
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        return null
      },
      getWorkspaceLimits: async () => {
        assert.fail()
      },
      getWorkspaceModelCount: async () => {
        assert.fail()
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: Authz.WorkspaceNoAccessError.code
    })
  })
  it('forbids new model creation if workspace has reached limit', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {
          id: cryptoRandomString({ length: 9 }),
          isPublic: false,
          isDiscoverable: false,
          workspaceId: cryptoRandomString({ length: 9 })
        }
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        return {} as Workspace
      },
      getWorkspaceRole: async () => {
        return Roles.Workspace.Guest
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        return {
          status: 'valid'
        } as WorkspacePlan
      },
      getWorkspaceLimits: async () => {
        return {
          modelCount: 5,
          projectCount: 1,
          versionsHistory: null
        }
      },
      getWorkspaceModelCount: async () => {
        return 5
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: Authz.WorkspaceLimitsReachedError.code,
      payload: { limit: 'modelCount' }
    })
  })
  it('allows new model creation if workspace is within limits', async () => {
    const result = await canCreateModelPolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {
          id: cryptoRandomString({ length: 9 }),
          isPublic: false,
          isDiscoverable: false,
          workspaceId: cryptoRandomString({ length: 9 })
        }
      },
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        return {} as Workspace
      },
      getWorkspaceRole: async () => {
        return Roles.Workspace.Guest
      },
      getWorkspaceSsoProvider: async () => {
        assert.fail()
      },
      getWorkspaceSsoSession: async () => {
        assert.fail()
      },
      getWorkspacePlan: async () => {
        return {
          status: 'valid'
        } as WorkspacePlan
      },
      getWorkspaceLimits: async () => {
        return {
          modelCount: 5,
          projectCount: 1,
          versionsHistory: null
        }
      },
      getWorkspaceModelCount: async () => {
        return 2
      }
    })(canCreateArgs())

    expect(result).toBeAuthOKResult()
  })
})
