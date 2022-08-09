import { NotificationHandler, TestMessage } from '@/modules/notifications/helpers/types'

/**
 * This notification type is only used when testing through `yarn cli smq`
 */

const handler: NotificationHandler<TestMessage> = async (
  msg,
  { debug, wrapperMessage }
) => {
  debug('Received test message with payload', msg, wrapperMessage)

  if (msg.data.error) {
    throw new Error('Forced to throw error!')
  }
}

export default handler
