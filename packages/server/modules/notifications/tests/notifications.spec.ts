import { mockRequireModule } from '@/test/mockHelper'
import {
  NotificationHandler,
  NotificationType,
  TestMessage
} from '@/modules/notifications/helpers/types'
import { publishNotification } from '@/modules/notifications/services/publication'
import { purgeNotifications, waitForAcknowledged } from '@/test/notificationsHelper'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { expect } from 'chai'
import {
  InvalidNotificationError,
  NotificationValidationError,
  UnhandledNotificationError
} from '@/modules/notifications/errors'

const testHandlerMock = mockRequireModule([
  '@/modules/notifications/services/handlers/test'
])

describe('Notifications', () => {
  beforeEach(async () => {
    await purgeNotifications()
  })

  afterEach(() => {
    testHandlerMock.resetMockedFunctions()
    testHandlerMock.disable()
  })

  it('can be emitted and routed to proper handler on consumption', async () => {
    const targetUserId = '1234555'
    const data = { ayyo: true, b: 'aaa' }

    let enqueuedMessage: Optional<TestMessage>

    testHandlerMock.enable()
    testHandlerMock.mockFunction('default', (async (msg) => {
      enqueuedMessage = msg
    }) as NotificationHandler<TestMessage>)

    const waitForAck = waitForAcknowledged(
      ({ notification }) => notification?.type === NotificationType.Test
    )

    // Enqueue notification
    await publishNotification(NotificationType.Test, {
      targetUserId,
      data
    })

    await waitForAck

    expect(enqueuedMessage).to.be.ok
    expect(enqueuedMessage?.targetUserId).to.eq(targetUserId)
    expect(enqueuedMessage?.type).to.eq(NotificationType.Test)
    expect(enqueuedMessage?.data).to.deep.equalInAnyOrder(data)
  })

  it('fail safely when emitted with an unexpected structure', async () => {
    const waitForAck = waitForAcknowledged(({ err }) => !!err)

    // Enqueue notification with invalid structure
    await publishNotification(NotificationType.Test, {
      a: 1,
      b: 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { err, ack } = await waitForAck
    expect(ack).to.be.false
    expect(err).to.be.ok
    expect(err instanceof InvalidNotificationError).to.be.true
    expect(err?.message).to.contain('invalid notification')
  })

  it('fail safely when emitted with an unexpected type', async () => {
    const waitForAck = waitForAcknowledged(({ err }) => !!err)

    // Enqueue notification with invalid structure
    await publishNotification('booooooooo' as NotificationType, {
      targetUserId: '123',
      data: {
        a: 123
      }
    })

    const { err, ack } = await waitForAck
    expect(ack).to.be.false
    expect(err).to.be.ok
    expect(err instanceof UnhandledNotificationError).to.be.true
  })

  const validationErrorDataSet = [
    {
      display: 'successful',
      error: new NotificationValidationError('expected validation isue')
    },
    { display: 'unsuccessful', error: new Error('ooohhhh') }
  ]

  validationErrorDataSet.forEach(({ display, error }) => {
    it(`fail with ${display} ack when handler throws ${error.name}`, async () => {
      testHandlerMock.enable()
      testHandlerMock.mockFunction('default', (async () => {
        throw error
      }) as NotificationHandler<TestMessage>)

      const waitForAck = waitForAcknowledged(({ err }) => !!err)

      await publishNotification(NotificationType.Test, {
        targetUserId: '123',
        data: { a: 1, display, error }
      })

      const { err, ack } = await waitForAck
      expect(ack).to.be.eq(error instanceof NotificationValidationError)
      expect(err?.name).to.eq(error.name)
    })
  })
})
