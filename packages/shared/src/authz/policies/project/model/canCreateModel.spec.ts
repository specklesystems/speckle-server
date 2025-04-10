import cryptoRandomString from 'crypto-random-string'
import { assert, describe, expect, it } from 'vitest'
import { canCreateModelPolicy } from './canCreateModel.js'
import { parseFeatureFlags } from '../../../../environment/index.js'
import { Roles } from '../../../../core/constants.js'
import { Workspace } from '../../../domain/workspaces/types.js'
import { WorkspacePlan } from '../../../../workspaces/index.js'
import { Project } from '../../../domain/projects/types.js'
import {
  ProjectNoAccessError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError
} from '../../../domain/authErrors.js'
import { getProjectFake } from '../../../../tests/fakes.js'

const buildCanCreateModelPolicy = (
  overrides?: Partial<Parameters<typeof canCreateModelPolicy>[0]>
) =>
  canCreateModelPolicy({
    getEnv: async () => parseFeatureFlags({}),
    getProject: getProjectFake({
      id: cryptoRandomString({ length: 9 }),
      isPublic: false,
      isDiscoverable: false,
      workspaceId: cryptoRandomString({ length: 9 })
    }),
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
      return 0
    },
    ...overrides
  })

const canCreateArgs = () => ({
  userId: cryptoRandomString({ length: 9 }),
  projectId: cryptoRandomString({ length: 9 })
})

describe('canCreateModelPolicy returns a function, that', () => {
  it('forbids unauthenticated users', async () => {
    const result = await buildCanCreateModelPolicy({})({
      userId: undefined,
      projectId: ''
    })

    expect(result).toBeAuthErrorResult({
      code: ServerNoSessionError.code
    })
  })
  it('forbids users without server roles', async () => {
    const result = await buildCanCreateModelPolicy({
      getServerRole: async () => {
        return null
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: ServerNoAccessError.code
    })
  })
  it('forbids users that are not at least stream contributors', async () => {
    const result = await buildCanCreateModelPolicy({
      getProjectRole: async () => {
        return Roles.Stream.Reviewer
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: ProjectNoAccessError.code
    })
  })
  it('allows stream contributors to create personal projects when project is not in a workspace', async () => {
    const result = await buildCanCreateModelPolicy({
      getProject: async () => {
        return {} as Project
      }
    })(canCreateArgs())

    expect(result).toBeAuthOKResult()
  })
  // Hold the workspace to a higher standard than myself
  it('requires the workspace to have a plan', async () => {
    const result = await buildCanCreateModelPolicy({
      getWorkspacePlan: async () => {
        return null
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceNoAccessError.code
    })
  })
  it('forbids new model creation if workspace has reached limit', async () => {
    const result = await buildCanCreateModelPolicy({
      getWorkspaceLimits: async () => {
        return {
          projectCount: 1,
          modelCount: 5,
          versionsHistory: null
        }
      },
      getWorkspaceModelCount: async () => {
        return 5
      }
    })(canCreateArgs())

    expect(result).toBeAuthErrorResult({
      code: WorkspaceLimitsReachedError.code,
      payload: { limit: 'modelCount' }
    })
  })
  it('allows new model creation if workspace is within limits', async () => {
    const result = await buildCanCreateModelPolicy({})(canCreateArgs())
    expect(result).toBeAuthOKResult()
  })
})
