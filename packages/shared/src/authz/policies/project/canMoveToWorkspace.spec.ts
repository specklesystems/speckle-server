import cryptoRandomString from 'crypto-random-string'
import { assert, describe, expect, it } from 'vitest'
import { canMoveToWorkspacePolicy } from './canMoveToWorkspace.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import { Project } from '../../domain/projects/types.js'
import { Roles, SeatTypes } from '../../../core/constants.js'
import { Workspace } from '../../domain/workspaces/types.js'
import { WorkspacePlan } from '../../../workspaces/index.js'
import {
  ProjectNotEnoughPermissionsError,
  ServerNotEnoughPermissionsError,
  WorkspaceLimitsReachedError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceProjectMoveInvalidError,
  WorkspacesNotEnabledError
} from '../../domain/authErrors.js'

const buildCanMoveToWorkspace = (
  overrides?: Partial<Parameters<typeof canMoveToWorkspacePolicy>[0]>
) =>
  canMoveToWorkspacePolicy({
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
    getWorkspaceSeat: async () => SeatTypes.Editor,
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
        projectCount: 5,
        versionsHistory: null
      }
    },
    getWorkspaceProjectCount: async () => {
      return 0
    },
    ...overrides
  })

const canMoveToWorkspaceArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 }),
  workspaceId: cryptoRandomString({ length: 9 })
})

describe('canMoveToWorkspacePolicy returns a function, that', () => {
  it('requires workspaces to be enabled', async () => {
    const result = await buildCanMoveToWorkspace({
      getEnv: async () =>
        parseFeatureFlags({
          FF_WORKSPACES_MODULE_ENABLED: 'false'
        })
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspacesNotEnabledError.code
    })
  })
  it('requires the project to not be in a workspace', async () => {
    const result = await buildCanMoveToWorkspace({
      getProject: async () => {
        return {
          workspaceId: cryptoRandomString({ length: 9 })
        } as Project
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceProjectMoveInvalidError.code
    })
  })
  it('requires user to be a server user', async () => {
    const result = await buildCanMoveToWorkspace({
      getServerRole: async () => {
        return Roles.Server.Guest
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNotEnoughPermissionsError.code
    })
  })
  it('requires user to be project owner', async () => {
    const result = await buildCanMoveToWorkspace({
      getProjectRole: async () => {
        return Roles.Stream.Contributor
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: ProjectNotEnoughPermissionsError.code
    })
  })
  it('requires user to be target workspace admin', async () => {
    const result = await buildCanMoveToWorkspace({
      getWorkspaceRole: async () => {
        return Roles.Workspace.Member
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNotEnoughPermissionsError.code
    })
  })
  it('forbids move if target workspace will exceed plan limits', async () => {
    const result = await buildCanMoveToWorkspace({
      getWorkspaceLimits: async () => {
        return {
          projectCount: 1,
          modelCount: 5,
          versionsHistory: null
        }
      },
      getWorkspaceProjectCount: async () => {
        return 1
      }
    })(canMoveToWorkspaceArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceLimitsReachedError.code,
      payload: { limit: 'projectCount' }
    })
  })
  it('allows move project if target workspace will be within limits', async () => {
    const result = await buildCanMoveToWorkspace({})(canMoveToWorkspaceArgs())
    expect(result).toBeAuthOKResult()
  })
  it('allows validation without providing a project id', async () => {
    const result = await buildCanMoveToWorkspace({
      getProject: async () => {
        assert.fail()
      },
      getProjectRole: async () => {
        return null
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      workspaceId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthOKResult()
  })
  it('allows validation without providing a workspace id', async () => {
    const result = await buildCanMoveToWorkspace({
      getWorkspace: async () => {
        assert.fail()
      },
      getWorkspaceRole: async () => {
        return null
      }
    })({
      userId: cryptoRandomString({ length: 9 }),
      projectId: cryptoRandomString({ length: 9 })
    })
    expect(result).toBeAuthOKResult()
  })
})
