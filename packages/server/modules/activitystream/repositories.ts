import knex from '@/db/knex'

export const Activities = {
  name: 'stream_activity',
  knex: () => knex('stream_activity'),
  col: {
    streamId: 'stream_activity.streamId',
    time: 'stream_activity.time',
    resourceType: 'stream_activity.resourceType',
    resourceId: 'stream_activity.resourceId',
    actionType: 'stream_activity.resourceType',
    userId: 'stream_activity.userId',
    info: 'stream_activity.info',
    message: 'stream_activity.message'
  }
}
