import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type { Project } from '@/modules/core/domain/streams/types'
import { RegionalProjectCreationError } from '@/modules/core/errors/projects'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import {
  createNewProjectFactory,
  waitForRegionProjectFactory
} from '@/modules/core/services/projects'
import { isSpecificEventPayload } from '@/modules/shared/services/eventBus'
import { expectToThrow } from '@/test/assertionHelper'
import type { StreamRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
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
        storeProjectRole: async () => {},
        storeModel: async () => {},
        waitForRegionProject: async () => {
          expect.fail()
        },
        emitEvent: async () => {}
      })
      const project = await createNewProject({ ownerId })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.visibility).to.eq(ProjectRecordVisibility.Private)
      expect(storedProject!.allowPublicComments).to.be.false
    })

    it(`makes PUBLIC projects public`, async () => {
      const visibility = 'PUBLIC'
      const ownerId = cryptoRandomString({ length: 10 })

      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        waitForRegionProject: async () => {
          expect.fail()
        },
        emitEvent: async () => {}
      })

      const project = await createNewProject({ ownerId, visibility })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.visibility).to.eq(ProjectRecordVisibility.Public)
      expect(storedProject!.allowPublicComments).to.be.false
    })

    it(`makes UNLISTED projects public`, async () => {
      const visibility = 'UNLISTED'
      const ownerId = cryptoRandomString({ length: 10 })

      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        waitForRegionProject: async () => {
          expect.fail()
        },
        emitEvent: async () => {}
      })

      const project = await createNewProject({ ownerId, visibility })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.visibility).to.eq(ProjectRecordVisibility.Public)
      expect(storedProject!.allowPublicComments).to.be.false
    })

    it('creates a private project', async () => {
      const ownerId = cryptoRandomString({ length: 10 })
      let storedProject: Project | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        storeProjectRole: async () => {},
        storeModel: async () => {},
        waitForRegionProject: async () => {
          expect.fail()
        },
        emitEvent: async () => {}
      })
      const project = await createNewProject({ ownerId, visibility: 'PRIVATE' })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.visibility).to.eq(ProjectRecordVisibility.Private)
      expect(storedProject!.allowPublicComments).to.be.false
    })
    it('continues if the project is eventually synced', async () => {
      const ownerId = cryptoRandomString({ length: 10 })

      let queriedProjectId: string | undefined = undefined
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
        storeProjectRole: async (args) => {
          storedProjectRole = args
        },
        storeModel: async (args) => {
          storedModel = args
        },
        waitForRegionProject: async ({ projectId }) => {
          queriedProjectId = projectId
        },
        emitEvent: async (payload) => {
          if (isSpecificEventPayload(payload, ProjectEvents.Created)) {
            emitedEvent = payload.eventName
            eventPayload = payload.payload
          }
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
      expect(eventPayload).deep.equal({
        ownerId,
        project,
        input: { description: '', name: project.name, visibility: 'PRIVATE' }
      })
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
        storeProjectRole: async (args) => {
          storedProjectRole = args
        },
        storeModel: async (args) => {
          storedModel = args
        },
        waitForRegionProject: async () => {
          expect.fail()
        },
        emitEvent: async (payload) => {
          if (isSpecificEventPayload(payload, ProjectEvents.Created)) {
            emitedEvent = payload.eventName
            eventPayload = payload.payload
          }
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
      expect(eventPayload).deep.equal({
        ownerId,
        project,
        input: { description: '', name: project.name, visibility: 'PRIVATE' }
      })
    })
  })
  describe('waitForRegionProject creates a function, that', () => {
    it('deletes the created project if getProject throws StreamNotFoundError', async () => {
      const storedProjectId = cryptoRandomString({ length: 10 })
      let deletedProjectId: string | undefined = undefined

      const waitForRegionProject = waitForRegionProjectFactory({
        getProject: async () => {
          throw new StreamNotFoundError()
        },
        deleteProject: async ({ projectId }) => {
          deletedProjectId = projectId
        }
      })
      const err = await expectToThrow(async () => {
        await waitForRegionProject({
          projectId: storedProjectId,
          regionKey: cryptoRandomString({ length: 10 })
        })
      })
      expect(storedProjectId).to.equal(deletedProjectId)
      expect(err.message).to.equal(new RegionalProjectCreationError().message)
    })
    it('just throws the error from the project getter', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      let deletedProjectId: string | undefined = undefined
      const kabumm = 'kabumm'

      const waitForRegionProject = waitForRegionProjectFactory({
        getProject: async () => {
          throw new Error(kabumm)
        },
        deleteProject: async ({ projectId }) => {
          deletedProjectId = projectId
        }
      })
      const err = await expectToThrow(async () => {
        await waitForRegionProject({
          projectId,
          regionKey: cryptoRandomString({ length: 10 })
        })
      })
      expect(deletedProjectId).to.be.undefined
      expect(err.message).to.equal(kabumm)
    })
  })
})
