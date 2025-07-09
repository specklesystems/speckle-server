import { describe, expect, it, assert } from 'vitest'
import { canReadProjectPolicy } from './canRead.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import crs from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { getProjectFake, getWorkspaceFake } from '../../../tests/fakes.js'
import cryptoRandomString from 'crypto-random-string'
import { ProjectVisibility } from '../../domain/projects/types.js'

const canReadProjectArgs = () => {
  const projectId = crs({ length: 10 })
  const userId = crs({ length: 10 })
  return { projectId, userId }
}

const getWorkspace = getWorkspaceFake({
  id: 'aaa',
  slug: 'bbb'
})

describe('canReadProjectPolicy creates a function, that handles ', () => {
  describe('project loader', () => {
    it('converts not found projects into ProjectNotFoundError', async () => {
      const result = canReadProjectPolicy({
        getWorkspace,
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: async () => null,
        getProjectRole: () => {
          assert.fail()
        },
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: ProjectNotFoundError.code
      })
    })
  })
  describe('project visibility', () => {
    it('allows anyone on a public project', async () => {
      const canReadProject = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () => parseFeatureFlags({}),
        getProject: getProjectFake({ visibility: ProjectVisibility.Public }),
        getProjectRole: () => {
          assert.fail()
        },
        getServerRole: () => {
          assert.fail()
        },
        getWorkspace,

        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })
      const canQuery = await canReadProject(canReadProjectArgs())
      expect(canQuery).toBeAuthOKResult()
    })
  })

  describe('server roles', () => {
    it('allows access for archived server users with a project role on a public project', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({ visibility: ProjectVisibility.Public }),
        getProjectRole: async () => Roles.Stream.Owner,
        getServerRole: async () => Roles.Server.ArchivedUser,
        getWorkspace,
        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })
    it('does not allow access for archived server users with a project role', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({}),
        getProjectRole: async () => Roles.Stream.Owner,
        getServerRole: async () => Roles.Server.ArchivedUser,
        getWorkspace,
        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: ServerNoAccessError.code
      })
    })
    it('does not allow access for non public projects for unknown users', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({}),
        getProjectRole: async () => Roles.Stream.Owner,
        getServerRole: async () => null,
        getWorkspace,

        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })({ userId: undefined, projectId: cryptoRandomString({ length: 10 }) })

      await expect(result).resolves.toBeAuthErrorResult({
        code: ServerNoSessionError.code
      })
    })
  })

  describe('project roles', () => {
    it.each(Object.values(Roles.Stream))(
      'allows access for active server users to private projects with %s role',
      async (role) => {
        const canReadProject = canReadProjectPolicy({
          getAdminOverrideEnabled: async () => false,
          getEnv: async () =>
            parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
          getProject: getProjectFake({}),
          getProjectRole: async () => role,
          getServerRole: async () => Roles.Server.User,
          getWorkspace,
          getWorkspaceRole: () => {
            assert.fail()
          },
          getWorkspaceSsoSession: () => {
            assert.fail()
          },
          getWorkspaceSsoProvider: () => {
            assert.fail()
          }
        })

        const canQuery = await canReadProject(canReadProjectArgs())
        expect(canQuery).toBeAuthOKResult()
      }
    )
    it('does not allow access to private projects without a project role', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({}),
        getProjectRole: async () => null,
        getWorkspace,
        getServerRole: async () => Roles.Server.Admin,
        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })
  })
  describe('admin override', () => {
    it('allows server admins without project roles on private projects if admin override is enabled', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => true,
        getEnv: async () => parseFeatureFlags({}),
        getProject: getProjectFake({}),
        getServerRole: async () => Roles.Server.Admin,
        getProjectRole: () => {
          assert.fail()
        },
        getWorkspace,
        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })

    it('does not allow server admins without project roles on private projects if admin override is disabled', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false'
          }),
        getProject: getProjectFake({}),
        getServerRole: async () => Roles.Server.Admin,
        getProjectRole: async () => null,
        getWorkspace,

        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: ProjectNoAccessError.code
      })
    })
  })
  describe('the workspace world', () => {
    it('does not check workspace rules if the workspaces module is not enabled', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspace,

        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })
    it('does not allow project access without a workspace role', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspace,

        getWorkspaceRole: async () => null,
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: WorkspaceNoAccessError.code
      })
    })

    it('allows project access via workspace admin role if user does not have project role, even if private project', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 }),
          visibility: ProjectVisibility.Private
        }),
        getProjectRole: async () => null,
        getServerRole: async () => Roles.Server.User,
        getWorkspaceRole: async () => Roles.Workspace.Admin,
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspace,
        getWorkspaceSsoProvider: async () => null
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })

    it('allows project access via workspace role if user does not have project role on workspace visibility', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 }),
          visibility: ProjectVisibility.Workspace
        }),
        getProjectRole: async () => null,
        getServerRole: async () => Roles.Server.User,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspace,
        getWorkspaceSsoProvider: async () => null
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })

    it('does not check SSO sessions if user is workspace guest', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspace,
        getWorkspaceRole: async () => Roles.Workspace.Guest,
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })
    it('does not check SSO sessions if workspace does not have it enabled', async () => {
      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspace,
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () => null
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })
    it('does not allow project access if SSO session is missing', async () => {
      const canReadProject = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspace,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => ({ providerId: 'foo' })
      })

      const canQuery = await canReadProject(canReadProjectArgs())
      expect(canQuery).toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code
      })
    })
    it('does not allow project access if SSO session is not found', async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspace,
        getWorkspaceSsoSession: async () => null,
        getWorkspaceSsoProvider: async () => ({ providerId: 'foo' })
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code,
        payload: { workspaceSlug: 'bbb' }
      })
    })
    it('does not allow project access if SSO session is expired', async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspace,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspaceSsoSession: async () => ({
          validUntil: date,
          userId: 'foo',
          providerId: 'foo'
        }),
        getWorkspaceSsoProvider: async () => ({ providerId: 'foo' })
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthErrorResult({
        code: WorkspaceSsoSessionNoAccessError.code,
        payload: { workspaceSlug: 'bbb' }
      })
    })
    it('allows project access if SSO session is valid', async () => {
      const date = new Date()
      date.setDate(date.getDate() + 1)

      const result = canReadProjectPolicy({
        getAdminOverrideEnabled: async () => false,
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => Roles.Stream.Contributor,
        getServerRole: async () => Roles.Server.User,
        getWorkspace,
        getWorkspaceRole: async () => Roles.Workspace.Member,
        getWorkspaceSsoSession: async () => ({
          validUntil: date,
          userId: 'foo',
          providerId: 'foo'
        }),
        getWorkspaceSsoProvider: async () => ({ providerId: 'foo' })
      })(canReadProjectArgs())

      await expect(result).resolves.toBeAuthOKResult()
    })
  })
})
