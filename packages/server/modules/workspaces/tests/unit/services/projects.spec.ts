import { ProjectTeamMember } from '@/modules/core/domain/projects/types'
import { ProjectNotFoundError } from '@/modules/core/errors/projects'
import { StreamRecord } from '@/modules/core/helpers/types'
import { WorkspaceSeat, WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { WorkspaceInvalidProjectError } from '@/modules/workspaces/errors/workspace'
import {
  moveProjectToWorkspaceFactory,
  queryAllWorkspaceProjectsFactory
} from '@/modules/workspaces/services/projects'
import {
  Workspace,
  WorkspaceAcl,
  WorkspaceDomain
} from '@/modules/workspacesCore/domain/types'
import { expectToThrow } from '@/test/assertionHelper'
import { ProjectUpdateRoleInput } from '@/test/graphql/generated/graphql'
import { Roles, StreamRoles, WorkspaceRoles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Project retrieval services', () => {
  describe('queryAllWorkspaceProjectFactory returns a generator, that', () => {
    it('returns all streams for a workspace', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []
      const storedProjects: StreamRecord[] = [{ workspaceId } as StreamRecord]

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams: async () => {
          return {
            streams: storedProjects,
            totalCount: storedProjects.length,
            cursorDate: null
          }
        }
      })

      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        foundProjects.push(...projectsPage)
      }

      expect(foundProjects.length).to.equal(1)
    })
    it('returns all streams for a workspace if the query requires multiple pages of results', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []
      const storedProjects: StreamRecord[] = [
        { workspaceId } as StreamRecord,
        { workspaceId } as StreamRecord
      ]

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams: async ({ cursor }) => {
          return cursor
            ? { streams: [storedProjects[1]], totalCount: 1, cursorDate: null }
            : { streams: [storedProjects[0]], totalCount: 1, cursorDate: new Date() }
        }
      })

      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        foundProjects.push(...projectsPage)
      }

      expect(foundProjects.length).to.equal(2)
    })
    it('exits if no results are found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []

      const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
        getStreams: async () => {
          return { streams: [], totalCount: 0, cursorDate: null }
        }
      })

      for await (const projectsPage of queryAllWorkspaceProjectsGenerator({
        workspaceId
      })) {
        foundProjects.push(...projectsPage)
      }

      expect(foundProjects.length).to.equal(0)
    })
  })
})

describe('Project management services', () => {
  describe('moveProjectToWorkspaceFactory returns a function, that', () => {
    const roleMapping: Array<
      | [
          StreamRoles, // Current project role
          null, // Current workspace role
          null, // Current workspace seat type
          StreamRoles, // Final project role
          WorkspaceRoles, // Final workspace role
          WorkspaceSeatType // Final workspace seat type
        ]
      | [
          StreamRoles, // Current project role
          WorkspaceRoles, // Current workspace role
          WorkspaceSeatType, // Current workspace seat type
          StreamRoles, // Final project role
          WorkspaceRoles, // Final workspace role
          WorkspaceSeatType // Final workspace seat type
        ]
    > = [
      [
        Roles.Stream.Owner,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor,
        Roles.Stream.Owner,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor
      ],
      [
        Roles.Stream.Owner,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor,
        Roles.Stream.Owner,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      ],
      [
        Roles.Stream.Owner,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Owner,
        Roles.Workspace.Guest,
        WorkspaceSeatType.Viewer,
        Roles.Stream.Reviewer,
        Roles.Workspace.Guest,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Owner,
        null,
        null,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Contributor,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor,
        Roles.Stream.Contributor,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor
      ],
      [
        Roles.Stream.Contributor,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor,
        Roles.Stream.Contributor,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      ],
      [
        Roles.Stream.Contributor,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Contributor,
        Roles.Workspace.Guest,
        WorkspaceSeatType.Viewer,
        Roles.Stream.Reviewer,
        Roles.Workspace.Guest,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Contributor,
        null,
        null,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Reviewer,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor,
        Roles.Stream.Reviewer,
        Roles.Workspace.Admin,
        WorkspaceSeatType.Editor
      ],
      [
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      ],
      [
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Reviewer,
        Roles.Workspace.Guest,
        WorkspaceSeatType.Viewer,
        Roles.Stream.Reviewer,
        Roles.Workspace.Guest,
        WorkspaceSeatType.Viewer
      ],
      [
        Roles.Stream.Reviewer,
        null,
        null,
        Roles.Stream.Reviewer,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      ]
    ]

    it('should throw if attempting to move a project, that does not exist', async () => {
      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => null,
        updateProject: async () => {
          expect.fail()
        },
        updateProjectRole: async () => {
          expect.fail()
        },
        getProjectCollaborators: async () => {
          expect.fail()
        },
        getWorkspaceRolesAndSeats: async () => {
          expect.fail()
        },
        getWorkspaceWithPlan: async () => {
          expect.fail()
        },
        updateWorkspaceRole: async () => {
          expect.fail()
        },
        createWorkspaceSeat: async () => {
          expect.fail()
        },
        getUserEmails: async () => {
          expect.fail()
        },
        getWorkspaceDomains: async () => {
          expect.fail()
        }
      })

      const err = await expectToThrow(() =>
        moveProjectToWorkspace({
          projectId: cryptoRandomString({ length: 6 }),
          workspaceId: cryptoRandomString({ length: 6 }),
          movedByUserId: cryptoRandomString({ length: 10 })
        })
      )
      expect(err.message).to.equal(new ProjectNotFoundError().message)
    })
    it('should throw if attempting to move a project already in a workspace', async () => {
      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {
            workspaceId: cryptoRandomString({ length: 6 })
          } as StreamRecord
        },
        updateProject: async () => {
          expect.fail()
        },
        updateProjectRole: async () => {
          expect.fail()
        },
        getProjectCollaborators: async () => {
          expect.fail()
        },
        getWorkspaceRolesAndSeats: async () => {
          expect.fail()
        },
        getWorkspaceWithPlan: async () => {
          expect.fail()
        },
        updateWorkspaceRole: async () => {
          expect.fail()
        },
        createWorkspaceSeat: async () => {
          expect.fail()
        },
        getUserEmails: async () => {
          expect.fail()
        },
        getWorkspaceDomains: async () => {
          expect.fail()
        }
      })

      const err = await expectToThrow(() =>
        moveProjectToWorkspace({
          projectId: cryptoRandomString({ length: 6 }),
          workspaceId: cryptoRandomString({ length: 6 }),
          movedByUserId: cryptoRandomString({ length: 10 })
        })
      )
      expect(err instanceof WorkspaceInvalidProjectError).to.be.true
    })
    it('should preserve existing workspace roles in target workspace', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<WorkspaceAcl>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        updateProjectRole: async () => {
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              streamRole: Roles.Stream.Contributor
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {
            [userId]: {
              role: {
                userId,
                role: Roles.Workspace.Admin,
                workspaceId,
                createdAt: new Date()
              },
              seat: {
                workspaceId,
                userId,
                type: WorkspaceSeatType.Editor,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              userId
            }
          }
        },
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId,
            domainBasedMembershipProtectionEnabled: false
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async (role) => {
          updatedRoles.push(role)
        },
        createWorkspaceSeat: async () => {
          return {} as WorkspaceSeat
        },
        getUserEmails: async () => {
          expect.fail()
        },
        getWorkspaceDomains: async () => {
          expect.fail()
        }
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(0)
    })
    it('should grant workspace guest seats to users that violate domain protection policies', async () => {
      const userId = cryptoRandomString({ length: 6 })
      const projectId = cryptoRandomString({ length: 6 })
      const workspaceId = cryptoRandomString({ length: 6 })

      const updatedRoles: Partial<WorkspaceAcl>[] = []

      const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
        getProject: async () => {
          return {} as StreamRecord
        },
        updateProject: async () => {
          return {} as StreamRecord
        },
        updateProjectRole: async () => {
          return {} as StreamRecord
        },
        getProjectCollaborators: async () => {
          return [
            {
              id: userId,
              streamRole: Roles.Stream.Contributor
            } as unknown as ProjectTeamMember
          ]
        },
        getWorkspaceRolesAndSeats: async () => {
          return {}
        },
        getWorkspaceWithPlan: async () => {
          return {
            id: workspaceId,
            domainBasedMembershipProtectionEnabled: true
          } as Workspace & { plan: null }
        },
        updateWorkspaceRole: async (role) => {
          updatedRoles.push(role)
        },
        createWorkspaceSeat: async () => {
          return {} as WorkspaceSeat
        },
        getUserEmails: async () => {
          return []
        },
        getWorkspaceDomains: async () => {
          return [
            {
              id: cryptoRandomString({ length: 9 }),
              domain: 'example.org',
              verified: true
            } as WorkspaceDomain
          ]
        }
      })

      await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

      expect(updatedRoles.length).to.equal(1)
      expect(updatedRoles[0].role).to.equal(Roles.Workspace.Guest)
    })

    for (const mapping of roleMapping) {
      const [
        currentProjectRole,
        currentWorkspaceRole,
        currentWorkspaceSeatType,
        finalProjectRole,
        finalWorkspaceRole,
        finalWorkspaceSeatType
      ] = mapping

      it(`should assign ${currentProjectRole} with ${currentWorkspaceRole} (${currentWorkspaceSeatType}) workspace role as project ${finalProjectRole} with ${finalWorkspaceRole} (${finalWorkspaceSeatType}) workspace role`, async () => {
        const userId = cryptoRandomString({ length: 6 })
        const projectId = cryptoRandomString({ length: 6 })
        const workspaceId = cryptoRandomString({ length: 6 })

        let projectRole = currentProjectRole
        let workspaceRole = currentWorkspaceRole
        let workspaceSeatType = currentWorkspaceSeatType

        const moveProjectToWorkspace = moveProjectToWorkspaceFactory({
          getProject: async () => {
            return {} as StreamRecord
          },
          updateProject: async () => {
            return {} as StreamRecord
          },
          updateProjectRole: async (update) => {
            projectRole = (update as ProjectUpdateRoleInput).role as StreamRoles
            return {} as StreamRecord
          },
          getProjectCollaborators: async () => {
            return [
              {
                id: userId,
                streamRole: projectRole
              } as unknown as ProjectTeamMember
            ]
          },
          getWorkspaceRolesAndSeats: async () => {
            return workspaceRole && workspaceSeatType
              ? {
                  [userId]: {
                    role: {
                      userId,
                      role: workspaceRole,
                      workspaceId,
                      createdAt: new Date()
                    },
                    seat: {
                      workspaceId,
                      userId,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      type: workspaceSeatType
                    },
                    userId
                  }
                }
              : {}
          },
          getWorkspaceWithPlan: async () => {
            return {
              id: workspaceId,
              domainBasedMembershipProtectionEnabled: false
            } as Workspace & { plan: null }
          },
          getWorkspaceDomains: async () => [],
          getUserEmails: async () => [],
          updateWorkspaceRole: async ({ role }) => {
            workspaceRole = role
          },
          createWorkspaceSeat: async (seat) => {
            workspaceSeatType = seat.type
            return {
              ...seat,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        })

        await moveProjectToWorkspace({ projectId, workspaceId, movedByUserId: userId })

        expect(projectRole).to.equal(finalProjectRole)
        expect(workspaceRole).to.equal(finalWorkspaceRole)
        expect(workspaceSeatType).to.equal(finalWorkspaceSeatType)
      })
    }
  })
})
