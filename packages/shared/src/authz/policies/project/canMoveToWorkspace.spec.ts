import cryptoRandomString from 'crypto-random-string'
import { assert, describe, expect, it } from 'vitest'
import { canMoveToWorkspacePolicy } from './canMoveToWorkspace.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Project } from '../../domain/projects/types.js'
import { Roles } from '../../../core/constants.js'
import { Workspace } from '../../domain/workspaces/types.js'
import { WorkspacePlan } from '../../../workspaces/index.js'

const canMoveToWorkspaceArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 }),
  workspaceId: cryptoRandomString({ length: 9 })
})

describe('canMoveToWorkspacePolicy returns a function, that', () => {
  it('requires workspaces to be enabled', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        }),
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
      getWorkspaceProjectCount: async () => {
        assert.fail()
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: 'WorkspacesNotEnabled'
    })
  })
  it('requires the project to not be in a workspace', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {
          workspaceId: cryptoRandomString({ length: 9 })
        } as Project
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
      getWorkspaceProjectCount: async () => {
        assert.fail()
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: 'WorkspaceProjectMoveInvalid'
    })
  })
  it('requires user to be a server user', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {} as Project
      },
      getProjectRole: async () => {
        assert.fail()
      },
      getServerRole: async () => {
        return Roles.Server.Guest
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
      getWorkspaceProjectCount: async () => {
        assert.fail()
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: 'ServerNoAccess'
    })
  })
  it('requires user to be project owner', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () => parseFeatureFlags({}),
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
      getWorkspaceProjectCount: async () => {
        assert.fail()
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: 'ProjectNoAccess'
    })
  })
  it('requires user to be target workspace admin', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {} as Project
      },
      getProjectRole: async () => {
        return Roles.Stream.Owner
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        return Roles.Workspace.Member
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
      getWorkspaceProjectCount: async () => {
        assert.fail()
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: 'WorkspaceNoAccess'
    })
  })
  it('forbids move if target workspace will exceed plan limits', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {} as Project
      },
      getProjectRole: async () => {
        return Roles.Stream.Owner
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        return {} as Workspace
      },
      getWorkspaceRole: async () => {
        return Roles.Workspace.Admin
      },
      getWorkspaceSsoProvider: async () => {
        return null
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
          projectCount: 5
        }
      },
      getWorkspaceProjectCount: async () => {
        return 5
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: 'WorkspaceLimitsReached',
      payload: { limit: 'projectCount' }
    })
  })
  it('allows move project if target workspace will be within limits', async () => {
    const result = await canMoveToWorkspacePolicy({
      getEnv: async () => parseFeatureFlags({}),
      getProject: async () => {
        return {} as Project
      },
      getProjectRole: async () => {
        return Roles.Stream.Owner
      },
      getServerRole: async () => {
        return Roles.Server.User
      },
      getWorkspace: async () => {
        return {} as Workspace
      },
      getWorkspaceRole: async () => {
        return Roles.Workspace.Admin
      },
      getWorkspaceSsoProvider: async () => {
        return null
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
          projectCount: 5
        }
      },
      getWorkspaceProjectCount: async () => {
        return 2
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthOKResult()
  })
})
