import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { Activity } from '@/modules/core/dbSchema'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Activity repository', () => {
  const saveActivity = saveActivityFactory({ db })
  const workspaceId = cryptoRandomString({ length: 10 })
  const userId = cryptoRandomString({ length: 10 })
  const exampleActivity = {
    contextResourceType: 'workspace' as const,
    contextResourceId: workspaceId,
    userId,
    eventType: 'workspace_plan_updated' as const,
    payload: {
      version: '1' as const,
      new: {
        name: 'team' as const,
        status: 'valid' as const
      },
      old: {
        name: 'free' as const,
        status: 'valid' as const
      }
    }
  }

  it('stores an activity', async () => {
    const { id } = await saveActivity(exampleActivity)

    const activity = await db
      .table(Activity.name)
      .select(Activity.cols)
      .where({ id })
      .first()

    expect(activity).to.nested.include({
      id,
      contextResourceType: 'workspace',
      contextResourceId: workspaceId,
      userId,
      eventType: 'workspace_plan_updated',
      'payload.version': '1',
      'payload.new.name': 'team',
      'payload.new.status': 'valid',
      'payload.old.name': 'free',
      'payload.old.status': 'valid'
    })
    expect(activity).to.have.a.property('createdAt').that.is.a('Date')
  })

  it('stores an activity without a user', async () => {
    const { id } = await saveActivity({
      ...exampleActivity,
      userId: null
    })

    const activity = await db
      .table(Activity.name)
      .select(Activity.cols)
      .where({ id })
      .first()

    expect(activity).to.nested.include({
      userId: null
    })
  })
})
