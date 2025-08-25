import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { legacyGetUserFactory } from '@/modules/core/repositories/users'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { beforeEachContext } from '@/test/hooks'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import request from 'supertest'
import type { Express } from 'express'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storePersonalApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { PaidWorkspacePlans, Scopes } from '@speckle/shared'
import { expect } from 'chai'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { createTestUser } from '@/test/authHelper'

const getUser = legacyGetUserFactory({ db })
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
      const { id: userId } = await createTestUser({
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
        addPlan: { name: PaidWorkspacePlans.Team, status: 'canceled' }
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
