import { getEventBus, initializeEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceEvents } from '@/modules/workspaces/domain/events'
import { Workspace } from '@/modules/workspaces/domain/types'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

type TestEvents = {
  test: { eventName: string }
  look: { lookWhatHappened: string }
}

const createFakeWorkspace = (): Workspace => {
  return {
    id: cryptoRandomString({ length: 10 }),
    description: cryptoRandomString({ length: 10 }),
    createdByUserId: 'foo',
    logoUrl: null,
    name: cryptoRandomString({ length: 10 }),
    updatedAt: new Date(),
    createdAt: new Date()
  }
}

describe('Event Bus', () => {
  describe('initializeEventBus creates an event bus instance, that', () => {
    it('calls back all the listeners', async () => {
      const testEventBus = initializeEventBus<TestEvents>()
      const eventNames: string[] = []
      testEventBus.listen('test', (e) => {
        eventNames.push(e.eventName)
      })

      testEventBus.listen('test', (e) => {
        eventNames.push(e.eventName)
      })

      await testEventBus.emit('look', {
        eventName: 'look',
        lookWhatHappened: 'not the droids you are looking for'
      })
      expect(eventNames.length).to.equal(0)

      const eventName = 'test'
      await testEventBus.emit('test', { eventName })

      expect(eventNames.length).to.equal(2)
      expect(eventNames).to.deep.equal([eventName, eventName])
    })
    it('can removes listeners from itself', async () => {
      const testEventBus = initializeEventBus<TestEvents>()
      const eventNumbers: number[] = []
      testEventBus.listen('test', () => {
        eventNumbers.push(1)
      })

      const listenerOff = testEventBus.listen('test', () => {
        eventNumbers.push(2)
      })

      await testEventBus.emit('test', { eventName: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])

      listenerOff()

      await testEventBus.emit('test', { eventName: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 1, 2])
    })
    it('returns results from listeners to the emitter', async () => {
      const testEventBus = initializeEventBus<TestEvents>()

      testEventBus.listen('look', ({ lookWhatHappened }) => ({
        outcome: lookWhatHappened
      }))

      const lookWhatHappened = 'echo this back to me'
      const results = await testEventBus.emit('look', {
        eventName: 'look',
        lookWhatHappened
      })

      expect(results.length).to.equal(1)
      expect(results[0]).to.deep.equal({ outcome: lookWhatHappened })
    })
    it('bubbles up listener exceptions to emitter', async () => {
      const testEventBus = initializeEventBus<TestEvents>()

      testEventBus.listen('look', ({ lookWhatHappened }) => {
        throw new Error(lookWhatHappened)
      })

      const lookWhatHappened = 'kabumm'
      try {
        await testEventBus.emit('look', {
          eventName: 'look',
          lookWhatHappened
        })
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
      const testEventBus = initializeEventBus<TestEvents>()
      const eventNumbers: number[] = []
      testEventBus.listen('test', () => {
        eventNumbers.push(1)
      })

      testEventBus.listen('test', () => {
        eventNumbers.push(2)
      })

      await testEventBus.emit('test', { eventName: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])

      testEventBus.destroy()

      await testEventBus.emit('test', { eventName: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])
    })
  })
  describe('getEventBus', () => {
    it('returns a unified event bus instance', async () => {
      const bus1 = getEventBus()
      const bus2 = getEventBus()

      const workspaces: Workspace[] = []

      bus1.listen(WorkspaceEvents.Created, (workspace) => {
        workspaces.push(workspace)
      })

      bus2.listen(WorkspaceEvents.Created, (workspace) => {
        workspaces.push(workspace)
      })

      const workspacePayload = {
        ...createFakeWorkspace(),
        createdByUserId: cryptoRandomString({ length: 10 }),
        eventName: WorkspaceEvents.Created
      }

      await bus1.emit(WorkspaceEvents.Created, workspacePayload)

      expect(workspaces.length).to.equal(2)
      expect(workspaces).to.deep.equal([workspacePayload, workspacePayload])
    })
    it('allows to subscribe to wildcard events', async () => {
      const eventBus = getEventBus()

      const events: string[] = []

      eventBus.listen('workspace.*', (payload, eventName) => {
        switch (eventName) {
          case 'workspace.role-updated':
            payload
          case 'workspace.created':
            events.push(payload.id)
            break
          case 'workspace.role-deleted':
            events.push(payload.userId)
            break
          default:
            events.push('default')
        }
      })

      const workspace = createFakeWorkspace()

      await eventBus.emit(WorkspaceEvents.Created, {
        ...workspace,
        createdByUserId: cryptoRandomString({ length: 10 }),
        eventName: WorkspaceEvents.Created
      })

      const workspaceAcl = {
        userId: cryptoRandomString({ length: 10 }),
        workspaceId: cryptoRandomString({ length: 10 }),
        role: Roles.Workspace.Member
      }

      await eventBus.emit(WorkspaceEvents.RoleDeleted, {
        eventName: WorkspaceEvents.RoleDeleted,
        ...workspaceAcl
      })

      await eventBus.emit(WorkspaceEvents.RoleUpdated, {
        eventName: WorkspaceEvents.RoleUpdated,
        ...workspaceAcl
      })

      expect([workspace.id, workspaceAcl.userId, 'default']).to.deep.equal(events)
    })
  })
})
