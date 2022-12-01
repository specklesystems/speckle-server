const {
  notifyUsersOnCommentEvents
} = require('@/modules/comments/services/notifications')
const debug = require('debug')

let unsubFromEvents

exports.init = async (_, isInitial) => {
  debug('speckle:modules')('🗣  Init comments module')

  if (isInitial) {
    unsubFromEvents = await notifyUsersOnCommentEvents()
  }
}
exports.finalize = async () => {}
exports.shutdown = async () => {
  unsubFromEvents?.()
  unsubFromEvents = undefined
}
