import { Project } from '@/modules/core/domain/streams/types'
import { RegionalProjectCreationError } from '@/modules/core/errors/projects'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { ProjectEvents } from '@/modules/core/events/projectsEmitter'
import { createNewProjectFactory } from '@/modules/core/services/projects'
import { expectToThrow } from '@/test/assertionHelper'
import { Roles, StreamRoles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('project services @core', () => {
  describe('createNewProjectFactory creates a function, that', () => {
    it('defaults new projects to public visibility', async () => {
      const ownerId = cryptoRandomString({ length: 10 })
      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        getProject: async () => {
          expect.fail()
        },
        deleteProject: async () => {
          expect.fail()
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        projectsEventsEmitter: async () => []
      })
      const project = await createNewProject({ ownerId })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.isPublic).to.be.true
      expect(storedProject!.isDiscoverable).to.be.false
      expect(storedProject!.allowPublicComments).to.be.false
    })
    // ;(['PUBLIC', 'UNLISTED'] as const).forEach((visibility) =>
    it(`makes PUBLIC projects public and discoverable`, async () => {
      const visibility = 'PUBLIC'
      const ownerId = cryptoRandomString({ length: 10 })

      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        getProject: async () => {
          expect.fail()
        },
        deleteProject: async () => {
          expect.fail()
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        projectsEventsEmitter: async () => []
      })

      const project = await createNewProject({ ownerId, visibility })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.isPublic).to.be.true
      expect(storedProject!.isDiscoverable).to.be.true
      expect(storedProject!.allowPublicComments).to.be.false
    })

    it(`makes UNLISTED projects public but not discoverable`, async () => {
      const visibility = 'UNLISTED'
      const ownerId = cryptoRandomString({ length: 10 })

      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        getProject: async () => {
          expect.fail()
        },
        deleteProject: async () => {
          expect.fail()
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        projectsEventsEmitter: async () => []
      })

      const project = await createNewProject({ ownerId, visibility })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.isPublic).to.be.true
      expect(storedProject!.isDiscoverable).to.be.false
      expect(storedProject!.allowPublicComments).to.be.false
    })
    // )
    it('creates a private project', async () => {
      const ownerId = cryptoRandomString({ length: 10 })
      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        getProject: async () => {
          expect.fail()
        },
        deleteProject: async () => {
          expect.fail()
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        projectsEventsEmitter: async () => []
      })
      const project = await createNewProject({ ownerId, visibility: 'PRIVATE' })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.isPublic).to.be.false
      expect(storedProject!.isDiscoverable).to.be.false
      expect(storedProject!.allowPublicComments).to.be.false
    })
    it('deletes the created project if getProject throws StreamNotFoundError', async () => {
      const ownerId = cryptoRandomString({ length: 10 })

      let storedProjectId: string | undefined = undefined
      let deletedProjectId: string | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProjectId = project.id
        },
        getProject: async () => {
          throw new StreamNotFoundError()
        },
        deleteProject: async ({ projectId }) => {
          deletedProjectId = projectId
        },
        storeProjectRole: async () => {
          expect.fail()
        },
        storeModel: async () => {
          expect.fail()
        },
        projectsEventsEmitter: async () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await createNewProject({
          ownerId,
          regionKey: cryptoRandomString({ length: 10 })
        })
      })
      expect(storedProjectId).to.equal(deletedProjectId)
      expect(err.message).to.equal(new RegionalProjectCreationError().message)
    })
    it('just throws the error from the project getter', async () => {
      const ownerId = cryptoRandomString({ length: 10 })

      let deletedProjectId: string | undefined = undefined
      const kabumm = 'kabumm'
      const createNewProject = createNewProjectFactory({
        storeProject: async () => {},
        getProject: async () => {
          throw new Error(kabumm)
        },
        deleteProject: async ({ projectId }) => {
          deletedProjectId = projectId
        },
        storeProjectRole: async () => {
          expect.fail()
        },
        storeModel: async () => {
          expect.fail()
        },
        projectsEventsEmitter: async () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await createNewProject({
          ownerId,
          regionKey: cryptoRandomString({ length: 10 })
        })
      })
      expect(deletedProjectId).to.be.undefined
      expect(err.message).to.equal(kabumm)
    })
    it('continues if the project is eventually synced', async () => {
      const ownerId = cryptoRandomString({ length: 10 })

      let queriedProjectId: string | undefined = undefined
      let storedProject: Project | undefined = undefined
      let retryCount = 0
      let storedProjectRole:
        | {
            projectId: string
            userId: string
            role: StreamRoles
          }
        | undefined = undefined
      let storedModel:
        | {
            name: string
            description: string | null
            projectId: string
            authorId: string
          }
        | undefined = undefined
      let emitedEvent: string | undefined = undefined
      let eventPayload: { project: Project; ownerId: string } | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        getProject: async ({ projectId }) => {
          queriedProjectId = projectId
          retryCount++
          if (retryCount > 3) return {} as Project
          throw new StreamNotFoundError()
        },
        deleteProject: async () => {
          expect.fail()
        },
        storeProjectRole: async (args) => {
          storedProjectRole = args
        },
        storeModel: async (args) => {
          storedModel = args
        },
        projectsEventsEmitter: async (eventName, payload) => {
          emitedEvent = eventName
          eventPayload = payload
          return []
        }
      })
      const project = await createNewProject({
        ownerId,
        regionKey: cryptoRandomString({ length: 10 })
      })
      expect(storedProject!.id).to.equal(queriedProjectId)
      expect(project).deep.equal(storedProject)
      expect(storedProjectRole).deep.equal({
        projectId: project.id,
        userId: ownerId,
        role: Roles.Stream.Owner
      })
      expect(storedModel).deep.equal({
        name: 'main',
        description: 'default model',
        projectId: project.id,
        authorId: ownerId
      })
      expect(emitedEvent).to.equal(ProjectEvents.Created)
      expect(eventPayload).deep.equal({ ownerId, project })
    })
    it('successfully creates a project', async () => {
      const ownerId = cryptoRandomString({ length: 10 })

      let storedProject: Project | undefined = undefined
      let storedProjectRole:
        | {
            projectId: string
            userId: string
            role: StreamRoles
          }
        | undefined = undefined
      let storedModel:
        | {
            name: string
            description: string | null
            projectId: string
            authorId: string
          }
        | undefined = undefined
      let emitedEvent: string | undefined = undefined
      let eventPayload: { project: Project; ownerId: string } | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        getProject: async () => {
          expect.fail()
        },
        deleteProject: async () => {
          expect.fail()
        },
        storeProjectRole: async (args) => {
          storedProjectRole = args
        },
        storeModel: async (args) => {
          storedModel = args
        },
        projectsEventsEmitter: async (eventName, payload) => {
          emitedEvent = eventName
          eventPayload = payload
          return []
        }
      })
      const project = await createNewProject({ ownerId })
      expect(project).deep.equal(storedProject)
      expect(storedProjectRole).deep.equal({
        projectId: project.id,
        userId: ownerId,
        role: Roles.Stream.Owner
      })
      expect(storedModel).deep.equal({
        name: 'main',
        description: 'default model',
        projectId: project.id,
        authorId: ownerId
      })
      expect(emitedEvent).to.equal(ProjectEvents.Created)
      expect(eventPayload).deep.equal({ ownerId, project })
    })
  })
})
