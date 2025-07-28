import { db } from '@/db/knex'
import { saveStreamActivityFactory } from '@/modules/activitystream/repositories'
import { StreamActivity } from '@/modules/core/dbSchema'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Stream activity repository @activitystream', () => {
  const saveStreamActivity = saveStreamActivityFactory({ db })
  const resourceId = cryptoRandomString({ length: 10 })
  const userId = cryptoRandomString({ length: 10 })
  const exampleActivity = {
    streamId: null,
    resourceType: 'user' as const,
    resourceId,
    userId,
    actionType: 'user_update' as const,
    info: {
      new: {
        name: 'user',
        field: 'a'
      },
      old: {
        name: 'user2',
        field: 'b'
      }
    },
    message: 'User plan updated'
  }

  it('stores an activity', async () => {
    await saveStreamActivity(exampleActivity)

    const activity = await db
      .table(StreamActivity.name)
      .select(StreamActivity.cols)
      .first()

    expect(activity).to.nested.include({
      resourceType: 'user',
      resourceId,
      userId,
      actionType: 'user_update',
      message: 'User plan updated'
    })
    expect(activity).to.have.a.property('time').that.is.a('Date')
  })

  it('trims the message in case its too long', async () => {
    await saveStreamActivity({
      ...exampleActivity,
      message: cryptoRandomString({ length: 1000 })
    })

    const activity = await db
      .table(StreamActivity.name)
      .select(StreamActivity.cols)
      .first()

    expect(activity).to.nested.include({
      resourceType: 'user',
      resourceId,
      userId,
      actionType: 'user_update'
    })
    expect(activity).to.have.a.property('time').that.is.a('Date')
  })
})
