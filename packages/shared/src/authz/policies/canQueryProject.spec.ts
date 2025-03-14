import { describe, expect, it, assert } from 'vitest'
import { canQueryProjectPolicyFactory } from './canQueryProject.js'
import { parseFeatureFlags } from '../../environment/index.js'
import crs from 'crypto-random-string'
import { merge } from 'lodash'
import { Project } from '../domain/projects/types.js'
import { Roles } from '../../core/constants.js'

const fakeGetFactory =
  <T extends Record<string, unknown>>(defaults: T) =>
  (overrides?: Partial<T>) =>
  (): Promise<T> => {
    if (overrides) {
      return Promise.resolve(merge(defaults, overrides))
    }
    return Promise.resolve(defaults)
  }

const getProjectFake = fakeGetFactory<Project>({
  isPublic: false,
  isDiscoverable: false,
  workspaceId: null
})

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
        expect(canQuery.reason).toBe('NoAccessToProject')
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
          getEnv: () => parseFeatureFlags({}),
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
        getEnv: () => parseFeatureFlags({}),
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
        expect(canQuery.reason).toBe('NoAccessToProject')
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
        getEnv: () => parseFeatureFlags({ FF_ADMIN_OVERRIDE_ENABLED: 'false' }),
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
        expect(canQuery.reason).toBe('NoAccessToProject')
      }
    })
  })
  describe('the workspace world', () => {
    it('does not check workspace rules if the workspaces module is not enabled', async () => {
      const canQueryProject = canQueryProjectPolicyFactory({
        getEnv: () => parseFeatureFlags({ FF_WORKSPACE_MODULE_ENABLED: 'false' }),
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
        getEnv: () => parseFeatureFlags({ FF_WORKSPACE_MODULE_ENABLED: 'true' }),
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
      expect(canQuery.authorized).toBe(true)
    })
  })
})
