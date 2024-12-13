import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { testApolloServer } from '@/test/graphqlHelper'
import {
  CreateObjectDocument,
  CreateWorkspaceDocument,
  CreateWorkspaceProjectDocument
} from '@/test/graphql/generated/graphql'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  countAdminUsersFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { createUserFactory } from '@/modules/core/services/users/management'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { WorkspaceReadOnlyError } from '@/modules/gatekeeper/errors/billing'

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

describe('Objects graphql @core', () => {
  before(async () => {
    await beforeEachContext()
  })

  describe('objectCreate mutation', () => {
    it('should return error if project is read-only', async () => {
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      const apollo = await testApolloServer({ authUserId: userId })

      const workspaceCreateRes = await apollo.execute(CreateWorkspaceDocument, {
        input: { name: 'test ws' }
      })
      expect(workspaceCreateRes).to.not.haveGraphQLErrors()

      const workspace = workspaceCreateRes.data?.workspaceMutations.create

      const projectCreateRes = await apollo.execute(CreateWorkspaceProjectDocument, {
        input: { workspaceId: workspace!.id, name: 'test project' }
      })
      expect(projectCreateRes).to.not.haveGraphQLErrors()
      const project = projectCreateRes.data?.workspaceMutations.projects.create

      // Make the project read-only
      await db('workspace_plans')
        .update({ status: 'expired' })
        .where({ workspaceId: workspace!.id })

      const objectCreateRes = await apollo.execute(CreateObjectDocument, {
        input: {
          streamId: project!.id,
          objects: [
            {
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
            }
          ]
        }
      })
      expect(objectCreateRes).to.haveGraphQLErrors()
      expect(objectCreateRes.errors).to.have.length(1)
      expect(objectCreateRes.errors![0].message).to.eq(
        new WorkspaceReadOnlyError().message
      )
    })
  })
})
