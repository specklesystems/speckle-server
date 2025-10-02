/* istanbul ignore file */
import { expect } from 'chai'
import assert from 'assert'

import {
  createPersonalAccessTokenFactory,
  validateTokenFactory
} from '@/modules/core/services/tokens'

import { beforeEachContext } from '@/test/hooks'
import { Scopes, Roles, ensureError } from '@speckle/shared'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import {
  createBranchFactory,
  getBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getStreamBranchByNameFactory,
  getPaginatedStreamBranchesPageFactory,
  getStreamBranchCountFactory
} from '@/modules/core/repositories/branches'
import { db } from '@/db/knex'
import {
  getCommitFactory,
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory,
  legacyGetPaginatedStreamCommitsPageFactory,
  getPaginatedBranchCommitsItemsFactory,
  deleteProjectCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} from '@/modules/core/services/commit/management'
import {
  getStreamFactory,
  grantStreamPermissionsFactory,
  getUserDeletableStreamsFactory,
  getExplicitProjects
} from '@/modules/core/repositories/streams'
import {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  deleteAllUserInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getUserFactory,
  legacyGetUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory,
  legacyGetUserByEmailFactory,
  updateUserFactory,
  getUserByEmailFactory,
  isLastAdminUserFactory,
  deleteUserRecordFactory,
  updateUserServerRoleFactory,
  searchUsersFactory,
  getUserRoleFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  createUserFactory,
  findOrCreateUserFactory,
  updateUserAndNotifyFactory,
  changePasswordFactory,
  validateUserPasswordFactory,
  deleteUserFactory,
  changeUserRoleFactory
} from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { dbLogger } from '@/observability/logging'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory,
  getUserPersonalAccessTokensFactory,
  revokeUserTokenByIdFactory,
  getApiTokenByIdFactory,
  getTokenScopesByIdFactory,
  getTokenResourceAccessDefinitionsByIdFactory,
  updateApiTokenFactory
} from '@/modules/core/repositories/tokens'
import { getTokenAppInfoFactory } from '@/modules/auth/repositories/apps'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getPaginatedBranchCommitsItemsByNameFactory } from '@/modules/core/services/commit/retrieval'
import { getPaginatedStreamBranchesFactory } from '@/modules/core/services/branch/retrieval'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import {
  countWorkspaceUsersFactory,
  getUserWorkspaceSeatsFactory,
  getUserWorkspacesWithRoleFactory
} from '@/modules/workspacesCore/repositories/workspaces'
import {
  deleteProjectAndCommitsFactory,
  queryAllProjectsFactory
} from '@/modules/core/services/projects'
import { getAllRegisteredTestDbs } from '@/modules/multiregion/tests/helpers'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import type {
  ChangeUserPassword,
  CreateValidatedUser,
  DeleteUser,
  UpdateUserAndNotify
} from '@/modules/core/domain/users/operations'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { deleteProjectFactory } from '@/modules/core/repositories/projects'

import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import {
  assignToWorkspace,
  buildBasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'

const getServerInfo = getServerInfoFactory({ db })
const getUser = legacyGetUserFactory({ db })
const getStream = getStreamFactory({ db })
const createBranch = createBranchFactory({ db })
const getCommit = getCommitFactory({ db })

const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  emitEvent: getEventBus().emit
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const grantPermissionsStream = grantStreamPermissionsFactory({ db })

const createUser: CreateValidatedUser = async (...input) =>
  asMultiregionalOperation(
    async ({ mainDb, allDbs, emit }) => {
      const createUser = createUserFactory({
        getServerInfo,
        findEmail: findEmailFactory({ db: mainDb }),
        storeUser: async (...params) => {
          const [user] = await Promise.all(
            allDbs.map((db) => storeUserFactory({ db })(...params))
          )

          return user
        },
        countAdminUsers: countAdminUsersFactory({ db: mainDb }),
        storeUserAcl: storeUserAclFactory({ db: mainDb }),
        validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
          createUserEmail: createUserEmailFactory({ db: mainDb }),
          ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({
            db: mainDb
          }),
          findEmail: findEmailFactory({ db: mainDb }),
          updateEmailInvites: finalizeInvitedServerRegistrationFactory({
            deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db: mainDb }),
            updateAllInviteTargets: updateAllInviteTargetsFactory({ db: mainDb })
          }),
          requestNewEmailVerification: requestNewEmailVerificationFactory({
            getServerInfo,
            findEmail: findEmailFactory({ db: mainDb }),
            getUser: getUserFactory({ db: mainDb }),
            deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory(
              {
                db: mainDb
              }
            ),
            renderEmail,
            sendEmail
          })
        }),
        emitEvent: emit
      })

      return createUser(...input)
    },
    {
      dbs: await getAllRegisteredTestDbs(),
      name: 'create user spec',
      logger: dbLogger
    }
  )

const findOrCreateUser = findOrCreateUserFactory({
  createUser,
  findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db })
})
const getUserByEmail = legacyGetUserByEmailFactory({ db })
const updateUser: UpdateUserAndNotify = async (...input) =>
  asMultiregionalOperation(
    ({ mainDb, allDbs, emit }) => {
      const updateUserAndNotify = updateUserAndNotifyFactory({
        getUser: getUserFactory({ db: mainDb }),
        updateUser: async (...params) => {
          const [res] = await Promise.all(
            allDbs.map((db) => updateUserFactory({ db })(...params))
          )

          return res
        },
        emitEvent: emit
      })

      return updateUserAndNotify(...input)
    },
    {
      logger: dbLogger,
      name: 'update user and notify spec',
      dbs: await getAllRegisteredTestDbs()
    }
  )

const updateUserPassword: ChangeUserPassword = async (...input) =>
  asMultiregionalOperation(
    ({ mainDb, allDbs }) => {
      const updateUserPassword = changePasswordFactory({
        getUser: getUserFactory({ db: mainDb }),
        updateUser: async (...params) => {
          const [res] = await Promise.all(
            allDbs.map((db) => updateUserFactory({ db })(...params))
          )

          return res
        }
      })

      return updateUserPassword(...input)
    },
    {
      logger: dbLogger,
      name: 'update user password spec',
      dbs: await getAllRegisteredTestDbs()
    }
  )

const validateUserPassword = validateUserPasswordFactory({
  getUserByEmail: getUserByEmailFactory({ db })
})

const deleteUser: DeleteUser = async (...input) =>
  asMultiregionalOperation(
    ({ mainDb, allDbs, emit }) => {
      const deleteUser = deleteUserFactory({
        deleteProjectAndCommits: deleteProjectAndCommitsFactory({
          // this is a bit of an overhead, we are issuing delete queries to all regions,
          // instead of being selective and clever about figuring out the project DB and only
          // deleting from main and the project db
          deleteProject: replicateFactory(allDbs, deleteProjectFactory),
          deleteProjectCommits: replicateFactory(allDbs, deleteProjectCommitsFactory)
        }),
        logger: dbLogger,
        isLastAdminUser: isLastAdminUserFactory({ db: mainDb }),
        getUserDeletableStreams: getUserDeletableStreamsFactory({ db: mainDb }),
        queryAllProjects: queryAllProjectsFactory({
          getExplicitProjects: getExplicitProjects({ db: mainDb })
        }),
        getUserWorkspaceSeats: getUserWorkspaceSeatsFactory({ db: mainDb }),
        deleteAllUserInvites: deleteAllUserInvitesFactory({ db: mainDb }),
        deleteUserRecord: async (params) => {
          const [res] = await Promise.all(
            allDbs.map((db) => deleteUserRecordFactory({ db })(params))
          )

          return res
        },
        emitEvent: emit,
        getWorkspacePlan: getWorkspacePlanFactory({ db: mainDb }),
        getUserWorkspacesWithRole: getUserWorkspacesWithRoleFactory({ db: mainDb }),
        countWorkspaceUsers: countWorkspaceUsersFactory({ db: mainDb })
      })

      return deleteUser(...input)
    },
    {
      logger: dbLogger,
      name: 'delete user spec',
      dbs: await getAllRegisteredTestDbs()
    }
  )

const changeUserRole = changeUserRoleFactory({
  getServerInfo,
  isLastAdminUser: isLastAdminUserFactory({ db }),
  updateUserServerRole: updateUserServerRoleFactory({ db })
})
const searchUsers = searchUsersFactory({ db })
const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})
const getUserTokens = getUserPersonalAccessTokensFactory({ db })
const revokeToken = revokeUserTokenByIdFactory({ db })
const validateToken = validateTokenFactory({
  revokeUserTokenById: revokeUserTokenByIdFactory({ db }),
  getApiTokenById: getApiTokenByIdFactory({ db }),
  getTokenAppInfo: getTokenAppInfoFactory({ db }),
  getTokenScopesById: getTokenScopesByIdFactory({ db }),
  getUserRole: getUserRoleFactory({ db }),
  getTokenResourceAccessDefinitionsById: getTokenResourceAccessDefinitionsByIdFactory({
    db
  }),
  updateApiToken: updateApiTokenFactory({ db })
})
const getCommitsByStreamId = legacyGetPaginatedStreamCommitsPageFactory({ db })
const getCommitsByBranchName = getPaginatedBranchCommitsItemsByNameFactory({
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({ db })
})
const getBranchesByStreamId = getPaginatedStreamBranchesFactory({
  getPaginatedStreamBranchesPage: getPaginatedStreamBranchesPageFactory({ db }),
  getStreamBranchCount: getStreamBranchCountFactory({ db })
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db })
})

describe('Actors & Tokens @user-services @multiregion', () => {
  const myTestActor = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@example.org',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  before(async () => {
    await beforeEachContext()

    const actorId = await createUser(myTestActor)
    myTestActor.id = actorId
  })

  describe('Users @core-users', () => {
    it('Get user by should ignore email casing', async () => {
      await createUser({
        name: 'John Doe',
        password: 'sn3aky-1337-b1m',
        email: 'test@example.org'
      })
      const user = await getUserByEmail({ email: 'TeST@ExamPLE.oRg' })
      expect(user!.email).to.equal('test@example.org')
    })

    it('Validate password should ignore email casing', async () => {
      expect(
        await validateUserPassword({ email: 'BiLL@GaTES.cOm', password: 'testthebest' })
      )
    })

    let ballmerUser: { id: string; email: string }

    it('Find or create should create a user', async () => {
      const newUser: { name: string; email: string; password: string } = {
        name: 'Steve Ballmer Balls',
        email: 'ballmer@example.test',
        password: 'testthebest'
      }

      ballmerUser = await findOrCreateUser({ user: newUser })
      expect(ballmerUser.id).to.be.a('string')
      const user = await getUser(ballmerUser.id)
      expect(user.verified).to.equal(true)
    })

    it('Find or create should NOT create a user', async () => {
      const newUser: { name: string; email: string; password: string } = {
        name: 'Steve Ballmer Balls',
        email: 'ballmer@example.test',
        password: 'testthebest'
      }

      const { id } = await findOrCreateUser({ user: newUser })
      expect(id).to.equal(ballmerUser.id)
    })

    // Note: deletion is more complicated.
    it('Should delete a user @multiregion', async () => {
      const soloOwnerStream = await createTestStream(
        {
          name: 'Test Stream 01',
          description: 'wonderful test stream',
          isPublic: true
        },
        {
          ...ballmerUser,
          name: ''
        }
      )
      const multiOwnerStream = await createTestStream(
        {
          name: 'Test Stream 02',
          description: 'another test stream',
          isPublic: true
        },
        {
          ...ballmerUser,
          name: ''
        }
      )

      await grantPermissionsStream({
        streamId: multiOwnerStream.id,
        userId: myTestActor.id,
        role: Roles.Stream.Owner
      })

      // create a branch for ballmer on the multiowner stream
      const branch = { name: 'ballmer/dev', id: '', description: null }
      branch.id = (
        await createBranch({
          ...branch,
          streamId: multiOwnerStream.id,
          authorId: ballmerUser.id!
        })
      ).id

      const branchSecond = { name: 'steve/jobs', id: '', description: null }
      branchSecond.id = (
        await createBranch({
          ...branchSecond,
          streamId: multiOwnerStream.id,
          authorId: myTestActor.id
        })
      ).id

      // create an object and a commit around it on the multiowner stream
      const objId = await createObject({
        streamId: multiOwnerStream.id,
        object: { pie: 'in the sky' }
      })
      const commitId = (
        await createCommitByBranchName({
          streamId: multiOwnerStream.id,
          branchName: 'ballmer/dev',
          message: 'breakfast commit',
          sourceApplication: 'tests',
          objectId: objId,
          authorId: ballmerUser.id!
        })
      ).id

      await deleteUser(ballmerUser.id!)

      if ((await getStream({ streamId: soloOwnerStream.id })) !== undefined) {
        assert.fail('user stream not deleted')
      }

      const multiOwnerStreamCopy = await getStream({ streamId: multiOwnerStream.id })
      if (!multiOwnerStreamCopy || multiOwnerStreamCopy.id !== multiOwnerStream.id) {
        assert.fail('shared stream deleted')
      }

      const branches = await getBranchesByStreamId(multiOwnerStream.id)
      expect(branches.items.length).to.equal(3)

      const branchCommits = await getCommitsByBranchName({
        streamId: multiOwnerStream.id,
        branchName: 'ballmer/dev',
        limit: 10
      })
      expect(branchCommits.commits.length).to.equal(1)

      const commit = await getCommit(commitId, { streamId: multiOwnerStream.id })
      expect(commit).to.be.not.null

      const commitsByStreamId = await getCommitsByStreamId({
        streamId: multiOwnerStream.id
      })
      expect(commitsByStreamId.commits.length).to.equal(1)

      const user = await getUser(ballmerUser.id!)
      if (user) assert.fail('user not deleted')
    })

    it('Should not delete the last admin user', async () => {
      try {
        await deleteUser(myTestActor.id)
        assert.fail('boom')
      } catch (err) {
        expect(ensureError(err).message).to.equal(
          'Cannot remove the last admin role from the server'
        )
      }
    })

    it('protects from deleting the last admin user if the workspace has valid paid plan', async () => {
      const user = buildBasicTestUser()
      const workspace = buildBasicTestWorkspace({
        ownerId: user.id
      })
      await createTestUser(user)
      await createTestWorkspace(workspace, user, {
        addPlan: {
          status: 'valid',
          name: 'proUnlimited'
        }
      })

      const promise = deleteUser(user.id)

      await expect(promise).to.eventually.be.rejectedWith(
        `${workspace.name}: Workspace subscription must be canceled first`
      )
    })

    it('allows deleting a user if the paid plan is canceled', async () => {
      const user = buildBasicTestUser()
      await createTestUser(user)
      await createTestWorkspace(
        buildBasicTestWorkspace({
          ownerId: user.id
        }),
        user,
        {
          addPlan: {
            status: 'canceled',
            name: 'proUnlimited'
          }
        }
      )

      await deleteUser(user.id)

      const deletedUser = await getUser(user.id)
      expect(deletedUser).to.be.undefined
    })

    it('protects from deleting the last admin user if the workspace has other members', async () => {
      const user = buildBasicTestUser()
      const user2 = buildBasicTestUser()
      const workspace = buildBasicTestWorkspace({
        ownerId: user.id
      })
      await createTestUser(user)
      await createTestUser(user2)
      await createTestWorkspace(workspace, user, {
        addPlan: {
          status: 'valid',
          name: 'proUnlimited'
        }
      })
      await assignToWorkspace(workspace, user2, Roles.Workspace.Member)

      const promise = deleteUser(user.id)

      await expect(promise).to.eventually.be.rejectedWith(
        `${workspace.name}: Admin role must be transferred to another member before deleting the user`
      )
    })

    it('Should get a user', async () => {
      const actor = await getUser(myTestActor.id)
      expect(actor).to.not.have.property('passwordDigest')
    })

    it('Should search and get users', async () => {
      const email = createRandomEmail()
      await createUser({
        name: 'Bill Gates',
        password: 'sn3aky-1337-b1m',
        email
      })
      const { users } = await searchUsers('gates', 20)
      expect(users).to.have.lengthOf(1)
      expect(users[0].name).to.equal('Bill Gates')
    })

    it('Should not search for archived users unless explicitly asked', async () => {
      const toBeArchivedId = await createUser({
        name: 'Miss Library Lady',
        email: 'will@be.archived',
        password: 'ilikebooks'
      })

      await createUser({
        name: 'Not in the Library',
        email: 'i@will.survive',
        password: 'nanananananaaaa'
      })

      await changeUserRole({ userId: toBeArchivedId, role: Roles.Server.ArchivedUser })

      let { users } = await searchUsers('Library', 20)
      expect(users).to.have.lengthOf(1)

      users = (await searchUsers('Library', 20, undefined, true)).users
      expect(users).to.have.lengthOf(2)
    })

    it('Should update a user', async () => {
      const updatedActor = { ...myTestActor }
      updatedActor.name = 'didimitrie'

      await updateUser(myTestActor.id, updatedActor)

      const actor = await getUser(myTestActor.id)
      expect(actor.name).to.equal(updatedActor.name)
    })

    it('Should not update password', async () => {
      const updatedActor = { ...myTestActor }
      updatedActor.password = 'failwhale'

      await updateUser(myTestActor.id, updatedActor)

      const match = await validateUserPassword({
        email: myTestActor.email,
        password: 'failwhale'
      })
      expect(match).to.equal(false)
    })

    it('Should validate user password', async () => {
      const actor = {
        password: 'super-test-200',
        email: 'e@ma.il',
        name: 'Bob Gates'
      }

      await createUser(actor)

      const match = await validateUserPassword({
        email: actor.email,
        password: 'super-test-200'
      })
      expect(match).to.equal(true)
      const matchWrong = await validateUserPassword({
        email: actor.email,
        password: 'super-test-2000'
      })
      expect(matchWrong).to.equal(false)
    })

    it('Should update the password of a user', async () => {
      const id = await createUser({
        name: 'D',
        email: 'tester@mcbester.com',
        password: 'H4!b5at+kWls-8yh4Guq'
      }) // https://mostsecure.pw
      await updateUserPassword({ id, newPassword: 'Hello Dogs and Cats' })

      const match = await validateUserPassword({
        email: 'tester@mcbester.com',
        password: 'Hello Dogs and Cats'
      })
      expect(match).to.equal(true)
    })
  })

  describe('API Tokens @core-apitokens', () => {
    let myFirstToken: string
    let pregeneratedToken: string
    let revokedToken: string
    let expireSoonToken: string

    before(async () => {
      pregeneratedToken = await createPersonalAccessToken(myTestActor.id, 'Whabadub', [
        Scopes.Streams.Read,
        Scopes.Streams.Write,
        Scopes.Profile.Read,
        Scopes.Users.Email
      ])
      revokedToken = await createPersonalAccessToken(myTestActor.id, 'Mr. Revoked', [
        Scopes.Streams.Read
      ])
      expireSoonToken = await createPersonalAccessToken(
        myTestActor.id,
        'Mayfly',
        [Scopes.Streams.Read],
        1
      ) // 1ms lifespan
    })

    it('Should create a personal api token', async () => {
      const scopes = [Scopes.Streams.Write, Scopes.Profile.Read]
      const name = 'My Test Token'

      myFirstToken = await createPersonalAccessToken(myTestActor.id, name, scopes)
      expect(myFirstToken).to.have.lengthOf(42)
    })

    // it( 'Should create an api token for an app', async ( ) => {
    //   let test = await createAppToken( { userId: myTestActor.id, appId: 'spklwebapp' } )
    //   expect( test ).to.have.lengthOf( 42 )
    // } )

    it('Should validate a token', async () => {
      const res = await validateToken(pregeneratedToken)
      expect(res).to.have.property('valid')
      expect(res.valid).to.equal(true)
      expect(res).to.have.property('scopes')
      expect(res).to.have.property('userId')
      expect(res).to.have.property('role')
    })

    it('Should revoke an api token', async () => {
      await revokeToken(revokedToken, myTestActor.id)
      const res = await validateToken(revokedToken)
      expect(res).to.have.property('valid')
      expect(res.valid).to.equal(false)
    })

    it('Should refuse an expired token', async () => {
      const res = await validateToken(expireSoonToken)
      expect(res.valid).to.equal(false)
      // assert.fail( )
    })

    it('Should get the tokens of an user', async () => {
      const userTokens = await getUserTokens(myTestActor.id)
      expect(userTokens).to.be.an('array')
      expect(userTokens).to.have.lengthOf(2)
    })
  })
})
