import {
  getEventBus,
  initializeEventBus,
  TestEvents
} from '@/modules/shared/services/eventBus'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Event Bus', () => {
  describe('initializeEventBus creates an event bus instance, that', () => {
    it('calls back all the listeners', async () => {
      const testEventBus = initializeEventBus()
      const eventNames: string[] = []
      testEventBus.listen(TestEvents.String, ({ eventName }) => {
        eventNames.push(eventName)
      })

      testEventBus.listen(TestEvents.String, ({ eventName }) => {
        eventNames.push(eventName)
      })

      await testEventBus.emit({ eventName: TestEvents.Number, payload: 1 })
      expect(eventNames.length).to.equal(0)

      const eventName = TestEvents.String
      await testEventBus.emit({ eventName, payload: 'fake event' })

      expect(eventNames.length).to.equal(2)
      expect(eventNames).to.deep.equal([eventName, eventName])
    })
    it('can removes listeners from itself', async () => {
      const testEventBus = initializeEventBus()
      const eventNumbers: number[] = []
      testEventBus.listen(TestEvents.String, () => {
        eventNumbers.push(1)
      })

      const listenerOff = testEventBus.listen(TestEvents.String, () => {
        eventNumbers.push(2)
      })

      await testEventBus.emit({ eventName: TestEvents.String, payload: 'fake event' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])

      listenerOff()

      await testEventBus.emit({ eventName: TestEvents.String, payload: 'fake event' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 1, 2])
    })
    it('bubbles up listener exceptions to emitter', async () => {
      const testEventBus = initializeEventBus()

      testEventBus.listen(TestEvents.String, ({ payload }) => {
        throw new Error(payload)
      })

      const lookWhatHappened = 'kabumm'
      try {
        await testEventBus.emit({
          eventName: TestEvents.String,
          payload: lookWhatHappened
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
      const testEventBus = initializeEventBus()
      const eventNumbers: number[] = []
      testEventBus.listen(TestEvents.String, () => {
        eventNumbers.push(1)
      })

      testEventBus.listen(TestEvents.String, () => {
        eventNumbers.push(2)
      })

      await testEventBus.emit({ eventName: TestEvents.String, payload: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])

      testEventBus.destroy()

      await testEventBus.emit({ eventName: TestEvents.String, payload: 'test' })
      expect(eventNumbers.sort((a, b) => a - b)).to.deep.equal([1, 2])
    })
  })
  describe('getEventBus', () => {
    it('returns a unified event bus instance', async () => {
      const bus1 = getEventBus()
      const bus2 = getEventBus()

      const payloads: string[] = []

      bus1.listen(TestEvents.String, ({ payload }) => {
        payloads.push(payload)
      })

      bus2.listen(TestEvents.String, ({ payload }) => {
        payloads.push(payload)
      })

      const payload = cryptoRandomString({ length: 1 })

      await bus1.emit({
        eventName: TestEvents.String,
        payload
      })

      expect(payloads.length).to.equal(2)
      expect(payloads).to.deep.equal([payload, payload])
    })
    it('allows to subscribe to wildcard events', async () => {
      const eventBus = getEventBus()

      const events: string[] = []

      eventBus.listen('test.*', ({ payload, eventName }) => {
        switch (eventName) {
          case TestEvents.String:
            events.push(payload)
            break
          case TestEvents.Number:
            events.push(`${payload}`)
            break
        }
      })

      const stringPayload = cryptoRandomString({ length: 10 })

      await eventBus.emit({
        eventName: TestEvents.String,
        payload: stringPayload
      })

      await eventBus.emit({
        eventName: TestEvents.Number,
        payload: 999
      })

      expect([stringPayload, `${999}`]).to.deep.equal(events)
    })
  })
})
