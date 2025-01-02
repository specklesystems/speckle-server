import { db } from '@/db/knex'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import {
  countAdminUsersFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { createUserFactory } from '@/modules/core/services/users/management'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import request from 'supertest'
import { Express } from 'express'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storePersonalApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { Scopes } from '@speckle/shared'
import { expect } from 'chai'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const getServerInfo = getServerInfoFactory({ db })
const getUser = legacyGetUserFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail: findEmailFactory({ db }),
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})

const createUserEmail = validateAndCreateUserEmailFactory({
  createUserEmail: createUserEmailFactory({ db }),
  ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
  findEmail: findEmailFactory({ db }),
  updateEmailInvites: finalizeInvitedServerRegistrationFactory({
    deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
    updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
  }),
  requestNewEmailVerification
})

const findEmail = findEmailFactory({ db })
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: createUserEmail,
  usersEventsEmitter: UsersEmitter.emit
})

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

describe('Objects REST @core', () => {
  let app: Express
  before(async () => {
    ;({ app } = await beforeEachContext())
  })
  ;(FF_BILLING_INTEGRATION_ENABLED ? it : it.skip)(
    'should return an error if the project is read-only',
    async () => {
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      const user = await getUser(userId)
      const workspace = {
        name: 'Test Workspace #1',
        ownerId: userId,
        id: '',
        slug: ''
      }
      await createTestWorkspace(workspace, user, {
        addPlan: { name: 'business', status: 'expired' }
      })

      const project = {
        id: '',
        name: 'test project',
        ownerId: userId,
        workspaceId: workspace.id
      }
      await createTestStream(project as unknown as BasicTestStream, user)

      const token = `Bearer ${await createPersonalAccessToken(
        user.id,
        'test token user A',
        [
          Scopes.Streams.Read,
          Scopes.Streams.Write,
          Scopes.Users.Read,
          Scopes.Users.Email,
          Scopes.Tokens.Write,
          Scopes.Tokens.Read,
          Scopes.Profile.Read,
          Scopes.Profile.Email
        ]
      )}`

      const res = await request(app)
        .post(`/objects/${project.id}`)
        .set('Authorization', token)
        .set('Content-type', 'multipart/form-data')
        .attach(
          'batch1',
          Buffer.from(
            JSON.stringify({
              id: 'e5262a6fb51540974e6d07ac60b7fe5c',
              name: 'Rhino Model',
              elements: [
                {
                  referencedId: '581a822cdaa5c2972783510d57617f73',
                  /* eslint-disable camelcase */
                  speckle_type: 'reference'
                }
              ],
              __closure: {
                '0086c072ee1fd70ac0a68c067a37e0eb': 3
              },
              speckleType: 'Speckle.Core.Models.Collection',
              speckle_type: 'Speckle.Core.Models.Collection',
              applicationId: null,
              collectionType: 'rhino model',
              totalChildrenCount: 610
            }),
            'utf8'
          )
        )

      expect(res).to.have.status(403)
    }
  )
})
