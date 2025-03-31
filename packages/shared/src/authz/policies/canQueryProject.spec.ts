import { describe, expect, it, assert } from 'vitest'
import { canQueryProjectPolicy } from './canQueryProject.js'
import { parseFeatureFlags } from '../../environment/index.js'
import crs from 'crypto-random-string'
import { Roles } from '../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ProjectRoleNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerRoleNotFoundError,
  WorkspaceNoAccessError,
  WorkspaceRoleNotFoundError,
  WorkspaceSsoProviderNotFoundError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceSsoSessionNotFoundError
} from '../domain/authErrors.js'
import { getProjectFake } from '../../tests/fakes.js'
import { err, ok } from 'true-myth/result'
import cryptoRandomString from 'crypto-random-string'
import { AuthCheckContextLoaders } from '../domain/loaders.js'

const canQueryProjectArgs = () => {
  const projectId = crs({ length: 10 })
  const userId = crs({ length: 10 })
  return { projectId, userId }
}

const getWorkspace: AuthCheckContextLoaders['getWorkspace'] = async () =>
  ok({
    id: 'aaa',
    slug: 'bbb'
  })

describe('canQueryProjectPolicy creates a function, that handles ', () => {
  describe('project loader errors', () => {
    it.each([
      ProjectNoAccessError,
      ProjectNotFoundError,
      WorkspaceSsoSessionNoAccessError
    ])('expected $code error by returning the error', async (expectedError) => {
      const result = await canQueryProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getProject: async () =>
          err(new expectedError({ payload: { workspaceSlug: 'bbb' } })),
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
      })(canQueryProjectArgs())

      expect(result).toStrictEqual(
        err(new expectedError({ payload: { workspaceSlug: 'bbb' } }))
      )
    })
    it('unexpected error by throwing UncoveredError', async () => {
      const result = canQueryProjectPolicy({
        getWorkspace,
        getEnv: async () => parseFeatureFlags({}),
        // @ts-expect-error testing uncovered error handling
        getProject: async () => err(ProjectRoleNotFoundError),
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
      })(canQueryProjectArgs())

      await expect(result).rejects.toThrowError(/Uncovered error/)
    })
  })
  describe('project visibility', () => {
    it('allows anyone on a public project', async () => {
      const canQueryProject = canQueryProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getProject: getProjectFake({ isPublic: true }),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.isOk).toBe(true)
    })
    it('allows anyone on a linkShareable project', async () => {
      const canQueryProject = canQueryProjectPolicy({
        getEnv: async () => parseFeatureFlags({}),
        getProject: getProjectFake({ isDiscoverable: true }),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.isOk).toBe(true)
    })
  })

  describe('server roles', () => {
    it('allows access for archived server users with a project role on a public project', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: true }),
        getProjectRole: async () => ok(Roles.Stream.Owner),
        getServerRole: async () => ok(Roles.Server.ArchivedUser),
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
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })
    it('does not allow access for archived server users with a project role', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getProjectRole: async () => ok(Roles.Stream.Owner),
        getServerRole: async () => ok(Roles.Server.ArchivedUser),
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
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(err(new ServerNoAccessError()))
    })
    it('does not allow access for non public projects for unknown users', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getProjectRole: async () => ok(Roles.Stream.Owner),
        getServerRole: async () => err(new ServerRoleNotFoundError()),
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
      await expect(result).resolves.toStrictEqual(err(new ServerNoSessionError()))
    })
  })

  describe('project roles', () => {
    it.each(Object.values(Roles.Stream))(
      'allows access for active server users to private projects with %s role',
      async (role) => {
        const canQueryProject = canQueryProjectPolicy({
          getEnv: async () =>
            parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
          getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
          getProjectRole: async () => ok(role),
          getServerRole: async () => ok('server:user'),
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
        const canQuery = await canQueryProject(canQueryProjectArgs())
        expect(canQuery.isOk).toBe(true)
      }
    )
    it('does not allow access to private projects without a project role', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getProjectRole: async () => err(new ProjectRoleNotFoundError()),
        getWorkspace,
        getServerRole: async () => ok(Roles.Server.Admin),
        getWorkspaceRole: () => {
          assert.fail()
        },
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(err(new ProjectNoAccessError()))
    })
  })
  describe('admin override', () => {
    it('allows server admins without project roles on private projects if admin override is enabled', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () => parseFeatureFlags({ FF_ADMIN_OVERRIDE_ENABLED: 'true' }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getServerRole: async () => ok(Roles.Server.Admin),
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
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })

    it('does not allow server admins without project roles on private projects if admin override is disabled', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_ADMIN_OVERRIDE_ENABLED: 'false',
            FF_WORKSPACES_MODULE_ENABLED: 'false'
          }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getServerRole: async () => ok(Roles.Server.Admin),
        getProjectRole: async () => err(new ProjectRoleNotFoundError()),
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
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(err(new ProjectNoAccessError()))
    })
  })
  describe('the workspace world', () => {
    it('does not check workspace rules if the workspaces module is not enabled', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
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
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })
    it('does not allow project access without a workspace role', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspace,

        getWorkspaceRole: async () => err(new WorkspaceRoleNotFoundError()),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(err(new WorkspaceNoAccessError()))
    })
    it('allows project access via workspace role if user does not have project role', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => err(new ProjectRoleNotFoundError()),
        getServerRole: async () => ok('server:user'),
        getWorkspaceRole: async () => ok('workspace:admin'),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspace,
        getWorkspaceSsoProvider: async () =>
          err(new WorkspaceSsoProviderNotFoundError())
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })
    it('does not check SSO sessions if user is workspace guest', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspace,
        getWorkspaceRole: async () => ok('workspace:guest'),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })
    it('does not check SSO sessions if workspace does not have it enabled', async () => {
      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspaceRole: async () => ok('workspace:member'),
        getWorkspace,
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: async () =>
          err(new WorkspaceSsoProviderNotFoundError())
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })
    it('does not allow project access if SSO session is missing', async () => {
      const canQueryProject = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspace,
        getWorkspaceRole: async () => ok('workspace:member'),
        getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError()),
        getWorkspaceSsoProvider: async () => ok({ providerId: 'foo' })
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.isOk).toBe(false)
    })
    it('does not allow project access if SSO session is not found', async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspaceRole: async () => ok('workspace:member'),
        getWorkspace,
        getWorkspaceSsoSession: async () => err(new WorkspaceSsoSessionNotFoundError()),
        getWorkspaceSsoProvider: async () => ok({ providerId: 'foo' })
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(
        err(
          new WorkspaceSsoSessionNoAccessError({
            payload: { workspaceSlug: 'bbb' }
          })
        )
      )
    })
    it('does not allow project access if SSO session is expired', async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspace,
        getWorkspaceRole: async () => ok('workspace:member'),
        getWorkspaceSsoSession: async () =>
          ok({ validUntil: date, userId: 'foo', providerId: 'foo' }),
        getWorkspaceSsoProvider: async () => ok({ providerId: 'foo' })
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(
        err(
          new WorkspaceSsoSessionNoAccessError({
            payload: { workspaceSlug: 'bbb' }
          })
        )
      )
    })
    it('allows project access if SSO session is valid', async () => {
      const date = new Date()
      date.setDate(date.getDate() + 1)

      const result = canQueryProjectPolicy({
        getEnv: async () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: async () => ok('stream:contributor'),
        getServerRole: async () => ok('server:user'),
        getWorkspace,
        getWorkspaceRole: async () => ok('workspace:member'),
        getWorkspaceSsoSession: async () =>
          ok({ validUntil: date, userId: 'foo', providerId: 'foo' }),
        getWorkspaceSsoProvider: async () => ok({ providerId: 'foo' })
      })(canQueryProjectArgs())
      await expect(result).resolves.toStrictEqual(ok())
    })
  })
})
