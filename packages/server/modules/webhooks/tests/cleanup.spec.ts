import knex, { db } from '@/db/knex'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createStreamFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import {
  countAdminUsersFactory,
  getUserFactory,
  getUsersFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { createUserFactory } from '@/modules/core/services/users/management'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteServerOnlyInvitesFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import crs from 'crypto-random-string'
import { cleanOrphanedWebhookConfigsFactory } from '@/modules/webhooks/repositories/cleanup'

const WEBHOOKS_CONFIG_TABLE = 'webhooks_config'
const WEBHOOKS_EVENTS_TABLE = 'webhooks_events'

const WebhooksConfig = () => knex(WEBHOOKS_CONFIG_TABLE)
const randomId = () => crs({ length: 10 })

const cleanOrphanedWebhookConfigs = cleanOrphanedWebhookConfigsFactory({ db })
const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
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
          }),
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})
const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
    createUserEmail: createUserEmailFactory({ db }),
    ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
    findEmail,
    updateEmailInvites: finalizeInvitedServerRegistrationFactory({
      deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
      updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
    }),
    requestNewEmailVerification
  }),
  usersEventsEmitter: UsersEmitter.emit
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
