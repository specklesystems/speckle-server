import { getEventBus, initializeEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const createFakeWorkspace = (): Omit<Workspace, 'domains'> => {
  return {
    id: cryptoRandomString({ length: 10 }),
    slug: cryptoRandomString({ length: 10 }),
    description: cryptoRandomString({ length: 10 }),
    logo: null,
    defaultLogoIndex: 0,
    name: cryptoRandomString({ length: 10 }),
    updatedAt: new Date(),
    createdAt: new Date(),
    defaultProjectRole: Roles.Stream.Contributor,
    domainBasedMembershipProtectionEnabled: false,
    discoverabilityEnabled: false
  }
}

describe('Event Bus', () => {
  describe('initializeEventBus creates an event bus instance, that', () => {
    it('calls back all the listeners', async () => {
      const testEventBus = initializeEventBus()
      const eventNames: string[] = []
      testEventBus.listen('test.string', ({ eventName }) => {
        eventNames.push(eventName)
      })

      testEventBus.listen('test.string', ({ eventName }) => {
        eventNames.push(eventName)
      })

      await testEventBus.emit({ eventName: 'test.number', payload: 1 })
      expect(eventNames.length).to.equal(0)

      const eventName = 'test.string' as const
      await testEventBus.emit({ eventName, payload: 'fake event' })

      expect(eventNames.length).to.equal(2)
      expect(eventNames).to.deep.equal([eventName, eventName])
    })
    it('can removes listeners from itself', async () => {
      const testEventBus = initializeEventBus()
      const eventNumbers: number[] = []
      testEventBus.listen('test.string', () => {
        eventNumbers.push(1)
      })

      const listenerOff = testEventBus.listen('test.string', () => {
        eventNumbers.push(2)
      })

      await testEventBus.emit({ eventName: 'test.string', payload: 'fake event' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])

      listenerOff()

      await testEventBus.emit({ eventName: 'test.string', payload: 'fake event' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 1, 2])
    })
    it('bubbles up listener exceptions to emitter', async () => {
      const testEventBus = initializeEventBus()

      testEventBus.listen('test.string', ({ payload }) => {
        throw new Error(payload)
      })

      const lookWhatHappened = 'kabumm'
      try {
        await testEventBus.emit({ eventName: 'test.string', payload: lookWhatHappened })
        throw new Error('this should have thrown by now')
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).to.equal(lookWhatHappened)
        } else {
          throw error
        }
      }
    })
    it('can be destroyed, removing all listeners', async () => {
      const testEventBus = initializeEventBus()
      const eventNumbers: number[] = []
      testEventBus.listen('test.string', () => {
        eventNumbers.push(1)
      })

      testEventBus.listen('test.string', () => {
        eventNumbers.push(2)
      })

      await testEventBus.emit({ eventName: 'test.string', payload: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])

      testEventBus.destroy()

      await testEventBus.emit({ eventName: 'test.string', payload: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])
    })
  })
  describe('getEventBus', () => {
    it('returns a unified event bus instance', async () => {
      const bus1 = getEventBus()
      const bus2 = getEventBus()

      const workspaces: Workspace[] = []

      bus1.listen(WorkspaceEvents.Created, ({ payload }) => {
        workspaces.push(payload)
      })

      bus2.listen(WorkspaceEvents.Created, ({ payload }) => {
        workspaces.push(payload)
      })

      const workspacePayload = {
        ...createFakeWorkspace(),
        createdByUserId: cryptoRandomString({ length: 10 }),
        eventName: WorkspaceEvents.Created,
        domains: []
      }

      await bus1.emit({
        eventName: WorkspaceEvents.Created,
        payload: { ...workspacePayload }
      })

      expect(workspaces.length).to.equal(2)
      expect(workspaces).to.deep.equal([workspacePayload, workspacePayload])
    })
    it('allows to subscribe to wildcard events', async () => {
      const eventBus = getEventBus()

      const events: string[] = []

      eventBus.listen('workspace.*', ({ payload, eventName }) => {
        switch (eventName) {
          case 'workspace.created':
            events.push(payload.id)
            break
          case 'workspace.role-deleted':
            events.push(payload.userId)
            break
        }
      })

      const workspace = createFakeWorkspace()

      await eventBus.emit({
        eventName: WorkspaceEvents.Created,
        payload: {
          ...workspace,
          createdByUserId: cryptoRandomString({ length: 10 })
        }
      })

      const workspaceAcl = {
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 }),
        role: Roles.Workspace.Member
      }

      await eventBus.emit({
        eventName: WorkspaceEvents.RoleDeleted,
        payload: workspaceAcl
      })

      expect([workspace.id, workspaceAcl.userId]).to.deep.equal(events)
    })
  })
})
