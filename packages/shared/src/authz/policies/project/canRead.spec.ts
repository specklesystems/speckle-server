import { describe, expect, it, assert } from 'vitest'
import { canReadProjectPolicyFactory } from './canRead.js'
import { parseFeatureFlags } from '../../../environment/index.js'
import crs from 'crypto-random-string'
import { Roles } from '../../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ProjectRoleNotFoundError,
  WorkspaceRoleNotFoundError,
  WorkspaceSsoProviderNotFoundError,
  WorkspaceSsoSessionNotFoundError
} from '../../domain/authErrors.js'
import { getProjectFake } from '../../../tests/fakes.js'
import { err, ok } from 'true-myth/result'

const canReadProjectArgs = () => {
  const projectId = crs({ length: 10 })
  const userId = crs({ length: 10 })
  return { projectId, userId }
}

describe('canReadProjectPolicyFactory creates a function, that handles ', () => {
  describe('project not found', () => {
    it('by returning project no access', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () => ok(parseFeatureFlags({})),
        getProject: () => Promise.resolve(err(ProjectNotFoundError)),
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
      })
      const canRead = await canReadProject(canReadProjectArgs())

      expect(canRead.isOk).toBe(false)
      if (!canRead.isOk) {
        expect(canRead.error.code).toBe(ProjectNotFoundError.code)
      }
    })
  })
  describe('project visibility', () => {
    it('allows anyone on a public project', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () => ok(parseFeatureFlags({})),
        getProject: getProjectFake({ isPublic: true }),
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
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
    it('allows anyone on a linkShareable project', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () => ok(parseFeatureFlags({})),
        getProject: getProjectFake({ isDiscoverable: true }),
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
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
  })

  describe('project roles', () => {
    it.each(Object.values(Roles.Stream))(
      'allows access to private projects with role %',
      async (role) => {
        const canReadProject = canReadProjectPolicyFactory({
          getEnv: async () =>
            ok(
              parseFeatureFlags({
                FF_WORKSPACES_MODULE_ENABLED: 'false'
              })
            ),
          getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
          getProjectRole: () => Promise.resolve(ok(role)),
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
        })
        const canRead = await canReadProject(canReadProjectArgs())
        expect(canRead.isOk).toBe(true)
      }
    )
    it('does not allow access to private projects without a project role', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'false'
            })
          ),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getProjectRole: () => Promise.resolve(err(ProjectRoleNotFoundError)),
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
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(false)
      if (!canRead.isOk) {
        expect(canRead.error.code).toBe(ProjectNoAccessError.code)
      }
    })
  })
  describe('admin override', () => {
    it('allows server admins without project roles on private projects if admin override is enabled', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(parseFeatureFlags({ FF_ADMIN_OVERRIDE_ENABLED: 'true' })),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getServerRole: () => Promise.resolve(ok(Roles.Server.Admin)),
        getProjectRole: () => {
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
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })

    it('does not allow server admins without project roles on private projects if admin override is disabled', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_ADMIN_OVERRIDE_ENABLED: 'false',
              FF_WORKSPACES_MODULE_ENABLED: 'false'
            })
          ),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getServerRole: () => Promise.resolve(ok(Roles.Server.Admin)),
        getProjectRole: () => {
          return Promise.resolve(err(ProjectRoleNotFoundError))
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
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(false)
      if (!canRead.isOk) {
        expect(canRead.error.code).toBe(ProjectNoAccessError.code)
      }
    })
  })
  describe('the workspace world', () => {
    it('does not check workspace rules if the workspaces module is not enabled', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' })),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
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
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
    it('does not allow project access without a workspace role', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(err(WorkspaceRoleNotFoundError)),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(false)
    })
    it('allows project access via workspace role if user does not have project role', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(err(ProjectRoleNotFoundError)),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(ok('workspace:admin')),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () =>
          Promise.resolve(err(WorkspaceSsoProviderNotFoundError))
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
    it('does not check SSO sessions if user is workspace guest', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(ok('workspace:guest')),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
    it('does not check SSO sessions if workspace does not have it enabled', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(ok('workspace:member')),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () =>
          Promise.resolve(err(WorkspaceSsoProviderNotFoundError))
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
    it('does not allow project access if SSO session is missing', async () => {
      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(ok('workspace:member')),
        getWorkspaceSsoSession: () =>
          Promise.resolve(err(WorkspaceSsoSessionNotFoundError)),
        getWorkspaceSsoProvider: () => Promise.resolve(ok({ providerId: 'foo' }))
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(false)
    })
    it('does not allow project access if SSO session is expired or invalid', async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(ok('workspace:member')),
        getWorkspaceSsoSession: () =>
          Promise.resolve(ok({ validUntil: date, userId: 'foo', providerId: 'foo' })),
        getWorkspaceSsoProvider: () => Promise.resolve(ok({ providerId: 'foo' }))
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(false)
    })
    it('allows project access if SSO session is valid', async () => {
      const date = new Date()
      date.setDate(date.getDate() + 1)

      const canReadProject = canReadProjectPolicyFactory({
        getEnv: async () =>
          ok(
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'true'
            })
          ),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(ok('stream:contributor')),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(ok('workspace:member')),
        getWorkspaceSsoSession: () =>
          Promise.resolve(ok({ validUntil: date, userId: 'foo', providerId: 'foo' })),
        getWorkspaceSsoProvider: () => Promise.resolve(ok({ providerId: 'foo' }))
      })
      const canRead = await canReadProject(canReadProjectArgs())
      expect(canRead.isOk).toBe(true)
    })
  })
})
