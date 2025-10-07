import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type { Project } from '@/modules/core/domain/streams/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { createNewProjectFactory } from '@/modules/core/services/projects'
import { isSpecificEventPayload } from '@/modules/shared/services/eventBus'
import type { StreamRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createStreamReturnRecordFactory,
  updateStreamAndNotifyFactory
} from '@/modules/core/services/streams/management'

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
        emitEvent: async () => {}
      })
      const project = await createNewProject({ ownerId, visibility: 'PRIVATE' })

      expect(project).deep.equal(storedProject)
      expect(storedProject!.visibility).to.eq(ProjectRecordVisibility.Private)
      expect(storedProject!.allowPublicComments).to.be.false
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
      let emitedEvent: string | undefined = undefined
      let eventPayload: { project: Project; ownerId: string } | undefined = undefined
      const createNewProject = createNewProjectFactory({
        storeProject: async ({ project }) => {
          storedProject = project
        },
        storeProjectRole: async (args) => {
          storedProjectRole = args
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
      expect(emitedEvent).to.equal(ProjectEvents.Created)
      expect(eventPayload).deep.equal({
        ownerId,
        project,
        input: { description: '', name: project.name, visibility: 'PRIVATE' }
      })
    })
  })
  describe('createStreamReturnRecordFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const streamId = cryptoRandomString({ length: 10 })
      const SUT = createStreamReturnRecordFactory({
        createStream: async (input) => {
          expect(input.name).to.equal('A safe name')
          expect(input.description).to.eq('A safe description')
          return {
            ...input,
            id: streamId,
            clonedFrom: null,
            workspaceId: null,
            regionKey: null,
            visibility: ProjectRecordVisibility.Private,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        storeProjectRole: async () => {},
        inviteUsersToProject: async () => true,
        emitEvent: async () => {}
      })

      await SUT({
        name: '<script>alert("xss")</script>A safe name',
        description: '<script>alert("xss")</script>A safe description',
        ownerId: cryptoRandomString({ length: 10 })
      })
    })
  })

  describe('updateStreamAndNotifyFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const streamId = cryptoRandomString({ length: 10 })
      const SUT = updateStreamAndNotifyFactory({
        getStream: async (input) => {
          expect(input.streamId).to.equal(streamId)
          return {
            id: streamId,
            name: 'Old name',
            description: 'Old description',
            createdAt: new Date(),
            updatedAt: new Date(),
            visibility: ProjectRecordVisibility.Private,
            clonedFrom: null,
            workspaceId: null,
            regionKey: null,
            allowPublicComments: false
          }
        },
        updateStream: async (input) => {
          expect(input.name).to.equal('A safe name')
          expect(input.description).to.eq('A safe description')
          return {
            ...input,
            id: streamId,
            streamId,
            authorId: cryptoRandomString({ length: 10 }),
            name: input.name!,
            clonedFrom: null,
            workspaceId: null,
            regionKey: null,
            visibility: ProjectRecordVisibility.Private,
            allowPublicComments: false,
            description: input.description!,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        emitEvent: async () => {}
      })

      await SUT(
        {
          name: '<script>alert("xss")</script>A safe name',
          description: '<script>alert("xss")</script>A safe description',
          id: streamId
        },
        cryptoRandomString({ length: 10 })
      )
    })
  })
})
