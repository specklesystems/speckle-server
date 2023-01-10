import knex from '@/db/knex'
import { createStream } from '@/modules/core/services/streams'
import { createUser } from '@/modules/core/services/users'
import { cleanOrphanedWebhookConfigs } from '@/modules/webhooks/services/cleanup'
import { truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import crs from 'crypto-random-string'

const WEBHOOKS_CONFIG_TABLE = 'webhooks_config'
const WEBHOOKS_EVENTS_TABLE = 'webhooks_events'

const WebhooksConfig = () => knex(WEBHOOKS_CONFIG_TABLE)
const randomId = () => crs({ length: 10 })

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
    const ownerId = await createUser({
      name: 'User',
      email: 'user@gmail.com',
      password: 'jdsadjsadasfdsa'
    })
    const streamId = await createStream({
      name: 'foo',
      description: 'bar',
      ownerId
    })

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
