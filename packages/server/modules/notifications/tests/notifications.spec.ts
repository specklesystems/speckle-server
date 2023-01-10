import { mockRequireModule } from '@/test/mockHelper'
import {
  MentionedInCommentData,
  MentionedInCommentMessage,
  NotificationType
} from '@/modules/notifications/helpers/types'
import { publishNotification } from '@/modules/notifications/services/publication'
import {
  buildNotificationsStateTracker,
  NotificationsStateManager,
  purgeNotifications
} from '@/test/notificationsHelper'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { expect } from 'chai'
import {
  InvalidNotificationError,
  NotificationValidationError,
  UnhandledNotificationError
} from '@/modules/notifications/errors'
import { NotificationJobResultsStatus } from '@/modules/notifications/services/queue'

const mentionsHandlerMock = mockRequireModule<
  typeof import('@/modules/notifications/services/handlers/mentionedInComment')
>(['@/modules/notifications/services/handlers/mentionedInComment'])

describe('Notifications', () => {
  let notificationsState: NotificationsStateManager

  before(async () => {
    await purgeNotifications()
    notificationsState = await buildNotificationsStateTracker()
  })

  after(async () => {
    notificationsState.destroy()
  })

  afterEach(() => {
    mentionsHandlerMock.resetMockedFunctions()
    mentionsHandlerMock.disable()
  })

  it('can be emitted and routed to proper handler on consumption', async () => {
    const targetUserId = '1234555'
    const data: MentionedInCommentData = {
      threadId: 'aaa',
      commentId: 'bbb',
      authorId: 'ccc',
      streamId: 'ddd'
    }

    let enqueuedMessage: Optional<MentionedInCommentMessage>

    mentionsHandlerMock.enable()
    mentionsHandlerMock.mockFunction('default', async (msg) => {
      enqueuedMessage = msg
    })

    // Enqueue notification
    const msgId = await publishNotification(NotificationType.MentionedInComment, {
      targetUserId,
      data
    })

    // Wait for ack
    await notificationsState.waitForMsgAck(msgId)

    expect(enqueuedMessage).to.be.ok
    expect(enqueuedMessage?.targetUserId).to.eq(targetUserId)
    expect(enqueuedMessage?.type).to.eq(NotificationType.MentionedInComment)
    expect(enqueuedMessage?.data).to.deep.equalInAnyOrder(data)
  })

  it('fail safely when emitted with an unexpected structure', async () => {
    // Enqueue notification with invalid structure
    const msgId = await publishNotification(NotificationType.MentionedInComment, {
      a: 1,
      b: 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { err } = await notificationsState.waitForMsgAck(msgId)

    expect(err).to.be.ok
    expect(err instanceof InvalidNotificationError).to.be.true
    expect(err?.message).to.contain('invalid notification')
  })

  it('fail safely when emitted with an unexpected type', async () => {
    // Enqueue notification with invalid structure
    const msgId = await publishNotification('booooooooo' as NotificationType, {
      targetUserId: '123',
      data: {
        a: 123
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    })

    const { err } = await notificationsState.waitForMsgAck(msgId)
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
      const data: MentionedInCommentData = {
        threadId: 'aaa',
        commentId: 'bbb',
        authorId: 'ccc',
        streamId: 'ddd'
      }

      mentionsHandlerMock.enable()
      mentionsHandlerMock.mockFunction('default', async () => {
        throw error
      })

      const msgId = await publishNotification(NotificationType.MentionedInComment, {
        targetUserId: '123',
        data
      })

      const { err, result } = await notificationsState.waitForMsgAck(msgId)

      const isValidationError = error instanceof NotificationValidationError
      if (isValidationError) {
        expect(err).to.be.not.ok
        expect(result?.status).to.eq(NotificationJobResultsStatus.ValidationError)
      } else {
        expect(err).to.be.ok
        expect(err?.name).to.eq(error.name)
        expect(err?.message).to.eq(error.message)
        expect(result).to.be.not.ok
      }
    })
  })
})
