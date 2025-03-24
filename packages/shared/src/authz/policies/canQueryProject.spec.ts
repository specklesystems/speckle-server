import { describe, expect, it, assert } from 'vitest'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'
import { parseFeatureFlags } from '../../environment/index.js'
import crs from 'crypto-random-string'
import { Roles } from '../../core/constants.js'
import { ProjectNoAccessError, ProjectNotFoundError } from '../domain/authErrors.js'
import { getProjectFake } from '../../tests/fakes.js'

const canQueryProjectArgs = () => {
  const projectId = crs({ length: 10 })
  const userId = crs({ length: 10 })
  return { projectId, userId }
}

describe('canQueryProjectPolicyFactory creates a function, that handles ', () => {
  describe('project not found', () => {
    it('by returning project no access', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () => parseFeatureFlags({}),
        getProject: () => Promise.resolve(null),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())

      expect(canQuery.authorized).toBe(false)
      if (!canQuery.authorized) {
        expect(canQuery.error.code).toBe(ProjectNotFoundError.code)
      }
    })
  })
  describe('project visibility', () => {
    it('allows anyone on a public project', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () => parseFeatureFlags({}),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
    it('allows anyone on a linkShareable project', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () => parseFeatureFlags({}),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
  })

  describe('project roles', () => {
    it.each(Object.values(Roles.Stream))(
      'allows access to private projects with role %',
      async (role) => {
        const canQueryProject = canQueryProjectPolicyFactory({
          getEnv: () =>
            parseFeatureFlags({
              FF_WORKSPACES_MODULE_ENABLED: 'false'
            }),
          getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
          getProjectRole: () => Promise.resolve(role),
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
        const canQuery = await canQueryProject(canQueryProjectArgs())
        expect(canQuery.authorized).toBe(true)
      }
    )
    it('does not allow access to private projects without a project role', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'false'
          }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getProjectRole: () => Promise.resolve(null),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(false)
      if (!canQuery.authorized) {
        expect(canQuery.error.code).toBe(ProjectNoAccessError.code)
      }
    })
  })
  describe('admin override', () => {
    it('allows server admins without project roles on private projects if admin override is enabled', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () => parseFeatureFlags({ FF_ADMIN_OVERRIDE_ENABLED: 'true' }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getServerRole: () => Promise.resolve(Roles.Server.Admin),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })

    it('does not allow server admins without project roles on private projects if admin override is disabled', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_ADMIN_OVERRIDE_ENABLED: 'false',
            FF_WORKSPACES_MODULE_ENABLED: 'false'
          }),
        getProject: getProjectFake({ isDiscoverable: false, isPublic: false }),
        getServerRole: () => Promise.resolve(Roles.Server.Admin),
        getProjectRole: () => {
          return Promise.resolve(null)
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(false)
      if (!canQuery.authorized) {
        expect(canQuery.error.code).toBe(ProjectNoAccessError.code)
      }
    })
  })
  describe('the workspace world', () => {
    it('does not check workspace rules if the workspaces module is not enabled', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () => parseFeatureFlags({ FF_WORKSPACES_MODULE_ENABLED: 'false' }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
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
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
    it('does not allow project access without a workspace role', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve(null),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(false)
    })
    it('allows project access via workspace role if user does not have project role', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve(null),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve('workspace:admin'),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => Promise.resolve(null)
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
    it('does not check SSO sessions if user is workspace guest', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve('workspace:guest'),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => {
          assert.fail()
        }
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
    it('does not check SSO sessions if workspace does not have it enabled', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve('workspace:member'),
        getWorkspaceSsoSession: () => {
          assert.fail()
        },
        getWorkspaceSsoProvider: () => Promise.resolve(null)
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
    it('does not allow project access if SSO session is missing', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve('workspace:member'),
        getWorkspaceSsoSession: () => Promise.resolve(null),
        getWorkspaceSsoProvider: () => Promise.resolve({ providerId: 'foo' })
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(false)
    })
    it('does not allow project access if SSO session is expired or invalid', async () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)

      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve('workspace:member'),
        getWorkspaceSsoSession: () =>
          Promise.resolve({ validUntil: date, userId: 'foo', providerId: 'foo' }),
        getWorkspaceSsoProvider: () => Promise.resolve({ providerId: 'foo' })
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(false)
    })
    it('allows project access if SSO session is valid', async () => {
      const date = new Date()
      date.setDate(date.getDate() + 1)

      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () =>
          parseFeatureFlags({
            FF_WORKSPACES_MODULE_ENABLED: 'true'
          }),
        getProject: getProjectFake({
          isDiscoverable: false,
          isPublic: false,
          workspaceId: crs({ length: 10 })
        }),
        getProjectRole: () => Promise.resolve('stream:contributor'),
        getServerRole: () => {
          assert.fail()
        },
        getWorkspaceRole: () => Promise.resolve('workspace:member'),
        getWorkspaceSsoSession: () =>
          Promise.resolve({ validUntil: date, userId: 'foo', providerId: 'foo' }),
        getWorkspaceSsoProvider: () => Promise.resolve({ providerId: 'foo' })
      })
      const canQuery = await canQueryProject(canQueryProjectArgs())
      expect(canQuery.authorized).toBe(true)
    })
  })
})
