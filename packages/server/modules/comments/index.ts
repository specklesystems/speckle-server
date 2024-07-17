const { moduleLogger } = require('@/logging/logging')
const {
  notifyUsersOnCommentEvents
} = require('@/modules/comments/services/notifications')

let unsubFromEvents

exports.init = async (_, isInitial) => {
  moduleLogger.info('🗣  Init comments module')

  if (isInitial) {
    unsubFromEvents = await notifyUsersOnCommentEvents()
  }
}
exports.finalize = async () => {}
exports.shutdown = async () => {
  unsubFromEvents?.()
  unsubFromEvents = undefined
}
