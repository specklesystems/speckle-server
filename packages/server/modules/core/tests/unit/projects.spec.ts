import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type { Project } from '@/modules/core/domain/streams/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { createNewProjectFactory } from '@/modules/core/services/projects'
import { isSpecificEventPayload } from '@/modules/shared/services/eventBus'
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
        emitEvent: async () => {}
      })
      const project = await createNewProject({ ownerId, visibility: 'PRIVATE' })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.visibility).to.eq(ProjectRecordVisibility.Private)
      expect(storedProject!.allowPublicComments).to.be.false
    })
    it('continues if the project is eventually synced', async () => {
      const ownerId = cryptoRandomString({ length: 10 })

      const queriedProjectId: string | undefined = undefined
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
})
