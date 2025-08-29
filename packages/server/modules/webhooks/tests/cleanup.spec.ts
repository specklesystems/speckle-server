import knex, { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import crs from 'crypto-random-string'
import { cleanOrphanedWebhookConfigsFactory } from '@/modules/webhooks/repositories/cleanup'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'

const WEBHOOKS_CONFIG_TABLE = 'webhooks_config'
const WEBHOOKS_EVENTS_TABLE = 'webhooks_events'

const WebhooksConfig = () => knex(WEBHOOKS_CONFIG_TABLE)
const randomId = () => crs({ length: 10 })

const cleanOrphanedWebhookConfigs = cleanOrphanedWebhookConfigsFactory({ db })

const countWebhooks = async () => {
  const [{ count }] = await WebhooksConfig().count()
  return parseInt(count as string)
}

describe('Webhooks cleanup @webhooks', () => {
  before(async () => {
    await truncateTables([WEBHOOKS_CONFIG_TABLE, WEBHOOKS_EVENTS_TABLE])
  })

  it('Cleans orphaned webhook configs', async () => {
    const webhookConfig = {
      id: randomId(),
      streamId: randomId(),
      url: 'foobar',
      description: 'test_hook',
      triggers: {
        // eslint-disable-next-line camelcase
        stream_update: true
      }
    }
    await WebhooksConfig().insert(webhookConfig)
    expect(await countWebhooks()).to.equal(1)
    await cleanOrphanedWebhookConfigs()
    expect(await countWebhooks()).to.equal(0)
  })

  it('Cleans orphans, leaves live ones intact', async () => {
    const user = await createTestUser({
      name: 'User',
      email: createRandomEmail(),
      password: createRandomPassword()
    })
    const { id: streamId } = await createTestStream(
      {
        name: 'foo',
        description: 'bar'
      },
      user
    )

    const webhookConfigs = [
      {
        id: randomId(),
        streamId: randomId(),
        url: 'foobar',
        description: 'test_hook',
        triggers: {
          // eslint-disable-next-line camelcase
          stream_update: true
        }
      },
      {
        id: randomId(),
        streamId,
        url: 'foobar',
        description: 'test_hook',
        triggers: {
          // eslint-disable-next-line camelcase
          stream_update: true
        }
      }
    ]
    await Promise.all(webhookConfigs.map((c) => WebhooksConfig().insert(c)))
    expect(await countWebhooks()).to.equal(2)
    await cleanOrphanedWebhookConfigs()
    expect(await countWebhooks()).to.equal(1)
  })
})
