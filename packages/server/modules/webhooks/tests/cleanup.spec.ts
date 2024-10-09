import knex, { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addStreamCreatedActivityFactory } from '@/modules/activitystream/services/streamActivity'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  createStreamFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import { getUsers } from '@/modules/core/repositories/users'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { createUser } from '@/modules/core/services/users'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'
import { cleanOrphanedWebhookConfigs } from '@/modules/webhooks/services/cleanup'
import { truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import crs from 'crypto-random-string'

const WEBHOOKS_CONFIG_TABLE = 'webhooks_config'
const WEBHOOKS_EVENTS_TABLE = 'webhooks_events'

const WebhooksConfig = () => knex(WEBHOOKS_CONFIG_TABLE)
const randomId = () => crs({ length: 10 })

const addStreamCreatedActivity = addStreamCreatedActivityFactory({
  saveActivity: saveActivityFactory({ db }),
  publish
})
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory(),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          })
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    addStreamCreatedActivity,
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

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
      email: createRandomEmail(),
      password: createRandomPassword()
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
