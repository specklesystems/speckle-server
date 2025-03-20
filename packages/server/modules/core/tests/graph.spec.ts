/* istanbul ignore file */
import { expect } from 'chai'
import request from 'supertest'

import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { generateManyObjects } from '@/test/helpers'

import { Roles, Scopes } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { db } from '@/db/knex'
import {
  validateStreamAccessFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  addOrUpdateStreamCollaboratorFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import {
  getStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
  getUserFactory,
  legacyGetPaginatedUsersFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory,
  isLastAdminUserFactory,
  updateUserServerRoleFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  createUserFactory,
  changeUserRoleFactory
} from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory
} from '@/modules/core/repositories/tokens'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { Express } from 'express'
import { Server } from 'http'
import { omit } from 'lodash'

const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  emitEvent: getEventBus().emit
})

const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  emitEvent: getEventBus().emit
})
const getUsers = legacyGetPaginatedUsersFactory({ db })

const getServerInfo = getServerInfoFactory({ db })
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
  emitEvent: getEventBus().emit
})

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

let app: Express
let server: Server
let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

const changeUserRole = changeUserRoleFactory({
  getServerInfo,
  isLastAdminUser: isLastAdminUserFactory({ db }),
  updateUserServerRole: updateUserServerRoleFactory({ db })
})

describe('GraphQL API Core @core-api', () => {
  const userA = {
    id: '',
    token: '',
    name: 'd1',
    email: 'd.1@speckle.systems',
    password: 'wowwowwowwowwow'
  }
  const userB = {
    id: '',
    token: '',
    name: 'd2',
    email: 'd.2@speckle.systems',
    password: 'wowwowwowwowwow'
  }
  const userC = {
    id: '',
    token: '',
    name: 'd3',
    email: 'd.3@speckle.systems',
    password: 'wowwowwowwowwow'
  }

  // set up app & two basic users to ping pong permissions around
  before(async () => {
    const ctx = await beforeEachContext()
    server = ctx.server
    app = ctx.app
    ;({ sendRequest } = await initializeTestServer(ctx))

    userA.id = await createUser(userA)
    userA.token = `Bearer ${await createPersonalAccessToken(
      userA.id,
      'test token user A',
      [
        Scopes.Server.Setup,
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
    userB.id = await createUser(userB)
    userB.token = `Bearer ${await createPersonalAccessToken(
      userB.id,
      'test token user B',
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
    userC.id = await createUser(userC)
    userC.token = `Bearer ${await createPersonalAccessToken(
      userC.id,
      'test token user B',
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

    // Prepare API tokens for use in tests
    const res1 = await sendRequest(userA.token, {
      query:
        'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:read", "users:read", "tokens:read"]}) }'
    })
    token1 = `Bearer ${res1.body.data.apiTokenCreate}`

    const res2 = await sendRequest(userA.token, {
      query:
        'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]}) }'
    })
    token2 = `Bearer ${res2.body.data.apiTokenCreate}`

    const res3 = await sendRequest(userB.token, {
      query:
        'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]}) }'
    })
    token3 = `Bearer ${res3.body.data.apiTokenCreate}`

    // Moved stream tests to before() hook, cause other tests depend on these results
    const resS1 = await sendRequest(userA.token, {
      query:
        'mutation { streamCreate(stream: { name: "TS1 (u A) Private", description: "Hello World", isPublic:false } ) }'
    })

    ts1 = resS1.body.data.streamCreate

    const resS2 = await sendRequest(userA.token, {
      query:
        'mutation { streamCreate(stream: { name: "TS2 (u A)", description: "Hello Darkness", isPublic:true } ) }'
    })
    ts2 = resS2.body.data.streamCreate

    const resS3 = await sendRequest(userB.token, {
      query:
        'mutation { streamCreate(stream: { name: "TS3 (u B) Private", description: "Hello Pumba", isPublic:false } ) }'
    })
    ts3 = resS3.body.data.streamCreate

    const resS4 = await sendRequest(userB.token, {
      query:
        'mutation { streamCreate(stream: { name: "TS4 (u B)", description: "Hello Julian", isPublic:true } ) }'
    })
    ts4 = resS4.body.data.streamCreate

    const resS5 = await sendRequest(userB.token, {
      query:
        'mutation { streamCreate(stream: { name: "TS5 (u B)", description: "Hello King", isPublic:true } ) }'
    })
    ts5 = resS5.body.data.streamCreate
  })

  after(async () => {
    await server.close()
  })

  // the stream ids
  let ts1: string
  let ts2: string
  let ts3: string
  let ts4: string
  let ts5: string
  let ts6: string

  // some api tokens
  let token1: string
  let token2: string
  let token3: string

  // object ids
  let objIds: string[]

  // some commits
  const c1 = {
    id: '',
    message: '',
    streamId: '',
    objectId: '',
    branchName: '',
    previousCommitIds: []
  }
  const c2 = {
    id: '',
    message: '',
    streamId: '',
    objectId: '',
    branchName: '',
    previousCommitIds: new Array<string>()
  }

  // some branches
  let b1 = {
    id: '',
    streamId: '',
    name: '',
    description: ''
  }
  let b2 = {
    id: '',
    streamId: '',
    name: '',
    description: ''
  }
  let b3 = {
    id: '',
    streamId: '',
    name: '',
    description: ''
  }
  let b4 = {
    id: '',
    streamId: '',
    name: '',
    description: ''
  }

  describe('Mutations', () => {
    describe('Users & Api tokens', () => {
      it('Should create some api tokens', async () => {
        const res1 = await sendRequest(userA.token, {
          query:
            'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:read", "users:read", "tokens:read"]}) }'
        })
        expect(res1).to.be.json
        expect(res1.body.errors).to.not.exist
        expect(res1.body.data.apiTokenCreate).to.be.a('string')

        token1 = `Bearer ${res1.body.data.apiTokenCreate}`
        const res2 = await sendRequest(userA.token, {
          query:
            'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]}) }'
        })
        token2 = `Bearer ${res2.body.data.apiTokenCreate}`

        const res3 = await sendRequest(userB.token, {
          query:
            'mutation { apiTokenCreate(token: {name:"Token 1", scopes: ["streams:write", "streams:read", "users:email"]}) }'
        })
        token3 = `Bearer ${res3.body.data.apiTokenCreate}`
      })

      it('Should revoke an api token that the user owns', async () => {
        const res = await sendRequest(userA.token, {
          query: `mutation{ apiTokenRevoke(token:"${token2}")}`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.apiTokenRevoke).to.equal(true)
      })

      it('Should fail to revoke an api token that I do not own', async () => {
        const res = await sendRequest(userA.token, {
          query: `mutation{ apiTokenRevoke(token:"${token3}")}`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('USER_INPUT_ERROR')
      })

      it('Should fail to create a stream with an invalid scope token', async () => {
        // Note: token1 has only stream read access
        const res = await sendRequest(token1, {
          query:
            'mutation { streamCreate(stream: { name: "INVALID TS1 (u A) Private", description: "Hello World", isPublic:false } ) }'
        })
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
      })

      it('Should edit my profile', async () => {
        const res = await sendRequest(userA.token, {
          query: 'mutation($user:UserUpdateInput!) { userUpdate( user: $user) } ',
          variables: {
            user: {
              name: 'test user updated',
              bio: 'He never really knows what he is doing.'
            }
          }
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.userUpdate).to.equal(true)
      })

      it('Should delete my account', async () => {
        const userDelete = {
          id: '',
          token: '',
          name: 'delete',
          email: `${cryptoRandomString({ length: 10 })}@example.org`,
          password: 'wowwowwowwowwow'
        }
        userDelete.id = await createUser(userDelete)

        userDelete.token = `Bearer ${await createPersonalAccessToken(
          userDelete.id,
          'fail token user del',
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

        const badTokenScopesBadEmail = await sendRequest(userDelete.token, {
          query:
            'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ',
          variables: { user: { email: 'wrongEmail@email.com' } }
        })
        expect(badTokenScopesBadEmail.body.errors).to.exist
        expect(badTokenScopesBadEmail.body.errors[0].extensions?.code).to.equal(
          'FORBIDDEN'
        )
        const badTokenScopesGoodEmail = await sendRequest(userDelete.token, {
          query:
            'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ',
          variables: { user: { email: userDelete.email } }
        })
        expect(badTokenScopesGoodEmail.body.errors).to.exist
        expect(badTokenScopesGoodEmail.body.errors[0].extensions?.code).to.equal(
          'FORBIDDEN'
        )

        userDelete.token = `Bearer ${await createPersonalAccessToken(
          userDelete.id,
          'test token user del',
          [
            Scopes.Streams.Read,
            Scopes.Streams.Write,
            Scopes.Users.Read,
            Scopes.Users.Email,
            Scopes.Tokens.Write,
            Scopes.Tokens.Read,
            Scopes.Profile.Read,
            Scopes.Profile.Email,
            Scopes.Profile.Delete
          ]
        )}`

        const goodTokenScopesBadEmail = await sendRequest(userDelete.token, {
          query:
            'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ',
          variables: { user: { email: 'wrongEmail@email.com' } }
        })
        expect(goodTokenScopesBadEmail.body.errors).to.exist
        expect(goodTokenScopesBadEmail.body.errors[0].extensions?.code).to.equal(
          'BAD_REQUEST_ERROR'
        )
        const goodTokenScopesGoodEmail = await sendRequest(userDelete.token, {
          query:
            'mutation($user:UserDeleteInput!) { userDelete( userConfirmation: $user) } ',
          variables: { user: { email: userDelete.email } }
        })
        expect(goodTokenScopesGoodEmail.body.errors).to.not.exist
      })
    })

    describe('User role change', () => {
      it('User role is changed', async () => {
        let queriedUserB = await sendRequest(userA.token, {
          query: ` { otherUser(id:"${userB.id}") { id name role } }`
        })
        expect(queriedUserB.body.data.otherUser.role).to.equal(Roles.Server.User)
        let query = `mutation { userRoleChange(userRoleInput: {id: "${userB.id}", role: "${Roles.Server.Admin}"})}`
        await sendRequest(userA.token, { query })
        queriedUserB = await sendRequest(userA.token, {
          query: ` { otherUser(id:"${userB.id}") { id name role } }`
        })
        expect(queriedUserB.body.data.otherUser.role).to.equal(Roles.Server.Admin)
        expect(queriedUserB.body.data)
        query = `mutation { userRoleChange(userRoleInput: {id: "${userB.id}", role: "${Roles.Server.User}"})}`
        await sendRequest(userA.token, { query })
        queriedUserB = await sendRequest(userA.token, {
          query: ` { otherUser(id:"${userB.id}") { id name role } }`
        })
        expect(queriedUserB.body.data.otherUser.role).to.equal(Roles.Server.User)
      })

      it('Only admins can change user role', async () => {
        const query = `mutation { userRoleChange(userRoleInput: {id: "${userB.id}", role: "${Roles.Server.Admin}"})}`
        const res = await sendRequest(userB.token, { query })
        const queriedUserB = await sendRequest(userA.token, {
          query: ` { otherUser(id:"${userB.id}") { id name role } }`
        })
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
        expect(queriedUserB.body.data.otherUser.role).to.equal(Roles.Server.User)
      })
    })

    describe('User deletion', () => {
      it('Only admins can delete user', async () => {
        const userDelete = {
          id: '',
          name: 'delete',
          email: `${cryptoRandomString({ length: 10 })}@example.org`,
          password: 'wowwowwowwowwow'
        }
        userDelete.id = await createUser(userDelete)

        const users = await getUsers()
        expect(users.map((u) => u.id)).to.contain(userDelete.id)
        const query = `mutation { adminDeleteUser( userConfirmation: { email: "${userDelete.email}" } ) } `
        const res = await sendRequest(userB.token, { query })
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      })

      it('Admin can delete user', async () => {
        const userDelete = {
          id: '',
          name: 'delete',
          email: 'd3l3t3@speckle.systems',
          password: 'wowwowwowwowwow'
        }
        userDelete.id = await createUser(userDelete)

        let users = await getUsers()
        expect(users.map((u) => u.id)).to.contain(userDelete.id)
        const query = `mutation { adminDeleteUser( userConfirmation: { email: "${userDelete.email}" } ) } `
        const deleteResult = await sendRequest(userA.token, { query })
        expect(deleteResult.body.data.adminDeleteUser).to.equal(true)
        users = await getUsers()
        expect(users.map((u) => u.id)).to.not.contain(userDelete.id)
      })

      it('Cannot delete the last admin', async () => {
        const query = `mutation { adminDeleteUser( userConfirmation: { email: "${userA.email}" } ) } `
        const res = await sendRequest(userA.token, { query })
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('USER_INPUT_ERROR')
        expect(res.body.errors[0].message).to.equal(
          'Cannot remove the last admin role from the server'
        )
      })
    })
    describe('Streams', () => {
      before(async () => {
        // Moved the following from a test case, cause other tests depend on it
        await Promise.all([
          await sendRequest(userC.token, {
            query:
              'mutation { streamCreate(stream: { name: "Admin TS1 (u A) Private", description: "Hello World", isPublic:false } ) }'
          }),
          await sendRequest(userA.token, {
            query:
              'mutation { streamCreate(stream: { name: "Admin TS2 (u A)", description: "Hello Darkness", isPublic:true } ) }'
          }),
          await sendRequest(userB.token, {
            query:
              'mutation { streamCreate(stream: { name: "Admin TS3 (u B) Private", description: "Hello Pumba", isPublic:false } ) }'
          }),
          await sendRequest(userB.token, {
            query:
              'mutation { streamCreate(stream: { name: "Admin TS4 (u B)", description: "Hello Julian", isPublic:true } ) }'
          }),
          await sendRequest(userB.token, {
            query:
              'mutation { streamCreate(stream: { name: "Admin TS5 (u B)", description: "Hello King", isPublic:true } ) }'
          })
        ])
      })

      it('Should create some streams', async () => {
        const resS1 = await sendRequest(userA.token, {
          query:
            'mutation { streamCreate(stream: { name: "TS1 (u A) Private", description: "Hello World", isPublic:false } ) }'
        })
        expect(resS1).to.be.json
        expect(resS1.body.errors).to.not.exist
        expect(resS1.body.data).to.have.property('streamCreate')
        expect(resS1.body.data.streamCreate).to.be.a('string')
      })

      it('Should update a stream', async () => {
        const resS1 = await sendRequest(userA.token, {
          query: `mutation { streamUpdate(stream: {id:"${ts1}" name: "TS1 (u A) Private UPDATED", description: "Hello World, Again!", isPublic:false } ) }`
        })

        expect(resS1).to.be.json
        expect(resS1.body.errors).to.not.exist
        expect(resS1.body.data).to.have.property('streamUpdate')
        expect(resS1.body.data.streamUpdate).to.equal(true)
      })

      const publicPrivateDataset = [
        { display: 'public', isPublic: true },
        { display: 'private', isPublic: false }
      ]
      publicPrivateDataset.forEach(({ display, isPublic }) => {
        it(`Should not allow updating permissions if target user isnt a collaborator on a ${display} stream`, async () => {
          const streamId = isPublic ? ts2 : ts1
          const res = await sendRequest(userA.token, {
            query: `mutation{ streamUpdatePermission( permissionParams: {streamId: "${streamId}", userId: "${userB.id}" role: "stream:owner"}) }`
          })

          expect(res).to.be.json
          expect(res.body.errors).to.be.ok
          expect(res.body.data.streamUpdatePermission).to.be.not.ok
          expect(res.body.errors.map((e: Error) => e.message).join('|')).to.contain(
            "Cannot grant permissions to users who aren't collaborators already"
          )
        })
      })

      it('Should be able to update some permissions', async () => {
        await addOrUpdateStreamCollaborator(
          ts1,
          userB.id,
          Roles.Stream.Reviewer,
          userA.id
        )
        const res = await sendRequest(userA.token, {
          query: `mutation{ streamUpdatePermission( permissionParams: {streamId: "${ts1}", userId: "${userB.id}" role: "stream:owner"}) }`
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.streamUpdatePermission).to.equal(true)

        await addOrUpdateStreamCollaborator(
          ts5,
          userA.id,
          Roles.Stream.Reviewer,
          userB.id
        )
        const res2 = await sendRequest(userB.token, {
          query: `mutation{ streamUpdatePermission( permissionParams: {streamId: "${ts5}", userId: "${userA.id}" role: "stream:owner"}) }`
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.not.exist

        await addOrUpdateStreamCollaborator(
          ts3,
          userC.id,
          Roles.Stream.Reviewer,
          userB.id
        )
        const res3 = await sendRequest(userB.token, {
          query: `mutation{ streamUpdatePermission( permissionParams: {streamId: "${ts3}", userId: "${userC.id}" role: "stream:owner"}) }`
        })
        expect(res3).to.be.json
        expect(res3.body.errors).to.not.exist
      })

      it('Should fail to grant permissions if not owner', async () => {
        const res = await sendRequest(userB.token, {
          query: `mutation{ streamUpdatePermission( permissionParams: {streamId: "${ts1}", userId: "${userB.id}" role: "stream:owner"}) }`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal(
          'STREAM_INVALID_ACCESS_ERROR'
        )
      })

      it('Should fail to grant myself permissions', async () => {
        const res = await sendRequest(userA.token, {
          query: `mutation{ streamUpdatePermission( permissionParams: {streamId: "${ts1}", userId: "${userA.id}" role: "stream:owner"}) }`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal(
          'STREAM_INVALID_ACCESS_ERROR'
        )
      })

      it('Should revoke permissions', async () => {
        await addOrUpdateStreamCollaborator(
          ts3,
          userC.id,
          Roles.Stream.Reviewer,
          userB.id
        )

        // first test if we can get it
        const res = await sendRequest(userC.token, {
          query: `query { stream(id:"${ts3}") { id name } }`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.stream.name).to.equal('TS3 (u B) Private')

        const revokeRes = await sendRequest(userB.token, {
          query: `mutation { streamRevokePermission( permissionParams: {streamId: "${ts3}", userId:"${userC.id}"} ) }`
        })
        expect(revokeRes).to.be.json
        expect(revokeRes.body.errors).to.not.exist
        expect(revokeRes.body.data.streamRevokePermission).to.equal(true)

        const resNotAuth = await sendRequest(userC.token, {
          query: `query { stream(id:"${ts3}") { id name role } }`
        })
        expect(resNotAuth).to.be.json
        expect(resNotAuth.body.errors).to.exist
        expect(resNotAuth.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
      })

      it('Should fail to edit/write on a public stream if no access is provided', async () => {
        // ts4 is a public stream from uesrB
        const res = await sendRequest(userA.token, {
          query: `mutation { streamUpdate(stream: {id:"${ts4}" name: "HACK", description: "Hello World, Again!", isPublic:false } ) }`
        })
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
      })

      it('Should fail editing a private stream if no access has been granted', async () => {
        const res = await sendRequest(userA.token, {
          query: `mutation { streamUpdate(stream: {id:"${ts3}" name: "HACK", description: "Hello World, Again!", isPublic:false } ) }`
        })

        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
      })

      it('Should fail to delete a stream because of permissions', async () => {
        // Make sure user is no longer a stream collaborator
        await removeStreamCollaborator(ts1, userB.id, userB.id)

        const res = await sendRequest(userB.token, {
          query: `mutation { streamDelete( id:"${ts1}")}`
        })
        expect(res).to.be.json

        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      })

      it('Should fail to delete streams if not admin', async () => {
        const res = await sendRequest(userB.token, {
          query: `mutation { streamsDelete( ids:"[${ts4}]")}`
        })
        expect(res).to.be.json

        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      })

      it('Should delete a stream', async () => {
        const res = await sendRequest(userB.token, {
          query: `mutation { streamDelete( id:"${ts4}")}`
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data).to.have.property('streamDelete')
        expect(res.body.data.streamDelete).to.equal(true)
      })

      it('Should be forbidden to query admin streams if not admin', async () => {
        const res = await sendRequest(userC.token, {
          query: '{ adminStreams { totalCount items { id name } } }'
        })
        expect(res).to.be.json

        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      })

      it('Should query admin streams', async () => {
        let streamResults = await sendRequest(userA.token, {
          query: '{ adminStreams { totalCount items { id name } } }'
        })

        expect(streamResults.body.data.adminStreams.totalCount).to.equal(10)

        streamResults = await sendRequest(userA.token, {
          query: '{ adminStreams(limit: 200) { totalCount items { id name } } }'
        })
        expect(streamResults.body.errors).to.exist
        expect(streamResults.body.errors[0].extensions.code).to.equal(
          'BAD_REQUEST_ERROR'
        )

        streamResults = await sendRequest(userA.token, {
          query: '{ adminStreams(limit: 2) { totalCount items { id name } } }'
        })
        expect(streamResults.body.data.adminStreams.totalCount).to.equal(10)
        expect(streamResults.body.data.adminStreams.items.length).to.equal(2)

        streamResults = await sendRequest(userA.token, {
          query: '{ adminStreams( query: "Admin" ) { totalCount items { id name } } }'
        })
        expect(streamResults.body.data.adminStreams.totalCount).to.equal(5)

        streamResults = await sendRequest(userA.token, {
          query:
            '{ adminStreams( visibility: "private" ) { totalCount items { id name isPublic } } }'
        })
        expect(streamResults.body.data.adminStreams.items).to.satisfy(
          (streams: { isPublic: boolean }[]) =>
            streams.every((stream) => !stream.isPublic)
        )

        streamResults = await sendRequest(userA.token, {
          query:
            '{ adminStreams( visibility: "public" ) { totalCount items { id name isPublic } } }'
        })
        expect(streamResults.body.data.adminStreams.items).to.satisfy(
          (streams: { isPublic: boolean }[]) =>
            streams.every((stream) => stream.isPublic)
        )
      })

      it('Should delete streams', async () => {
        const streamResults = await sendRequest(userA.token, {
          query: '{ adminStreams( query: "Admin" ) { totalCount items { id name } } }'
        })
        expect(streamResults.body.data.adminStreams.totalCount).to.equal(5)
        const streamIds = streamResults.body.data.adminStreams.items.map(
          (stream: { id: string }) => stream.id
        )
        const res = await sendRequest(userA.token, {
          query: 'mutation ( $ids: [String!] ){ streamsDelete( ids: $ids )}',
          variables: { ids: streamIds }
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data).to.have.property('streamsDelete')
        expect(res.body.data.streamsDelete).to.equal(true)
      })
    })

    describe('Objects, Commits & Branches', () => {
      it('Should create some objects', async () => {
        const objs = []
        for (let i = 0; i < 500; i++) {
          if (i % 2 === 0)
            objs.push({
              applicationId: i,
              type: 'Point',
              x: i,
              y: 1,
              z: i * 0.42,
              extra: { super: true, arr: [1, 2, 3, 4] }
            })
          else if (i % 3 === 0)
            objs.push({
              applicationId: i,
              type: 'Line',
              start: { x: i, y: 1, z: i * 0.42 },
              end: { x: 0, y: 2, z: i * i },
              extra: {
                super: false,
                arr: [12, 23, 34, 42, { imp: ['possible', 'this', 'sturcture', 'is'] }]
              }
            })
          else
            objs.push({
              cool: ['s', 't', ['u', 'f', 'f', i], { that: true }],
              iValue: i + i / 3
            })
        }

        const res = await sendRequest(userA.token, {
          query: `mutation( $objs: [JSONObject]! ) { objectCreate( objectInput: {streamId:"${ts1}", objects: $objs} ) }`,
          variables: { objs }
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.objectCreate).to.have.lengthOf(objs.length)

        objIds = res.body.data.objectCreate
      })

      it('Should create several commits', async () => {
        c1.message = 'what a message for a first commit'
        c1.streamId = ts1
        c1.objectId = objIds[0]
        c1.branchName = 'main'

        let res = await sendRequest(userA.token, {
          query:
            'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }',
          variables: { myCommit: omit(c1, 'id') }
        })

        expect(res).to.be.json
        expect(res.body.errors, JSON.stringify(res.body.errors)).to.not.exist
        expect(res.body.data).to.have.property('commitCreate')
        expect(res.body.data.commitCreate).to.be.a('string')
        c1.id = res.body.data.commitCreate

        c2.message = 'what a message for a second commit'
        c2.streamId = ts1
        c2.objectId = objIds[1]
        c2.branchName = 'main'
        c2.previousCommitIds = [c1.id]

        res = await sendRequest(userA.token, {
          query:
            'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }',
          variables: { myCommit: omit(c2, 'id') }
        })
        expect(res).to.be.json
        expect(res.body.errors, JSON.stringify(res.body.errors)).to.not.exist
        expect(res.body.data).to.have.property('commitCreate')
        expect(res.body.data.commitCreate).to.be.a('string')

        c2.id = res.body.data.commitCreate
      })

      it('Should update a commit', async () => {
        const updatePayload = {
          streamId: ts1,
          id: c1.id,
          message: 'first commit'
        }
        const res = await sendRequest(userA.token, {
          query:
            'mutation( $myCommit: CommitUpdateInput! ) { commitUpdate( commit: $myCommit ) }',
          variables: { myCommit: updatePayload }
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data).to.have.property('commitUpdate')

        const res2 = await sendRequest(userB.token, {
          query:
            'mutation( $myCommit: CommitUpdateInput! ) { commitUpdate( commit: $myCommit ) }',
          variables: { myCommit: updatePayload }
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.exist
        expect(res2.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
      })

      it('Should create a read receipt', async () => {
        const res = await sendRequest(userA.token, {
          query:
            'mutation($input: CommitReceivedInput!) { commitReceive(input: $input) }',
          variables: {
            input: {
              streamId: ts1,
              commitId: c1.id,
              sourceApplication: 'tests',
              message: 'Irrelevant!'
            }
          }
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.commitReceive).to.equal(true)

        const res3 = await sendRequest(null, {
          query:
            'mutation($input: CommitReceivedInput!) { commitReceive(input: $input) }',
          variables: {
            input: {
              streamId: ts1,
              commitId: c1.id,
              sourceApplication: 'tests',
              message: 'Irrelevant!'
            }
          }
        })

        expect(res3).to.be.json
        expect(res3.body.errors).to.exist
        expect(res3.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      })

      it('Should delete a commit', async () => {
        const payload = { streamId: ts1, id: c2.id }

        const res = await sendRequest(userB.token, {
          query:
            'mutation( $myCommit: CommitDeleteInput! ) { commitDelete( commit: $myCommit ) }',
          variables: { myCommit: payload }
        })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')

        const res2 = await sendRequest(userA.token, {
          query:
            'mutation( $myCommit: CommitDeleteInput! ) { commitDelete( commit: $myCommit ) }',
          variables: { myCommit: payload }
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.not.exist
        expect(res2.body.data).to.have.property('commitDelete')
      })

      it('Should create several branches', async () => {
        b1 = {
          id: '',
          streamId: ts1,
          name: 'dim/dev',
          description: 'dimitries development branch'
        }

        const res1 = await sendRequest(userA.token, {
          query:
            'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }',
          variables: { branch: omit(b1, 'id') }
        })
        expect(res1).to.be.json
        expect(res1.body.errors, JSON.stringify(res1.body.errors)).to.not.exist
        expect(res1.body.data).to.have.property('branchCreate')
        expect(res1.body.data.branchCreate).to.be.a('string')
        b1.id = res1.body.data.branchCreate

        b2 = {
          id: '',
          streamId: ts1,
          name: 'dim/dev/api-surgery',
          description: 'another branch'
        }

        await addOrUpdateStreamCollaborator(
          ts1,
          userB.id,
          Roles.Stream.Contributor,
          userA.id
        )
        const res2 = await sendRequest(userB.token, {
          query:
            'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }',
          variables: { branch: omit(b2, 'id') }
        })
        expect(res2.body.errors, JSON.stringify(res2.body.errors)).to.not.exist
        b2.id = res2.body.data.branchCreate

        b3 = {
          id: '',
          streamId: ts1,
          name: 'userB/dev/api',
          description: 'more branches branch'
        }
        const res3 = await sendRequest(userB.token, {
          query:
            'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }',
          variables: { branch: omit(b3, 'id') }
        })
        expect(res3.body.errors, JSON.stringify(res3.body.errors)).to.not.exist
        b3.id = res3.body.data.branchCreate
      })

      it('Should update a branch', async () => {
        const b1 = {
          id: '',
          streamId: ts1,
          name: 'randomupdateablebranch',
          description: 'dimitries development branch'
        }
        const b1Res = await sendRequest(userA.token, {
          query:
            'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }',
          variables: { branch: omit(b1, 'id') }
        })
        expect(b1Res).to.be.json
        expect(b1Res.body.errors, JSON.stringify(b1Res.body)).to.not.exist
        b1.id = b1Res.body.data.branchCreate

        const payload = {
          streamId: ts1,
          id: b1.id,
          name: 'userb/whatever/whatever'
        }

        const res1 = await sendRequest(userA.token, {
          query:
            'mutation( $branch:BranchUpdateInput! ) { branchUpdate( branch:$branch ) }',
          variables: { branch: payload }
        })
        expect(res1).to.be.json
        expect(res1.body.errors).to.not.exist
        expect(res1.body.data).to.have.property('branchUpdate')
        expect(res1.body.data.branchUpdate).to.equal(true)
      })

      it('Should delete a branch', async () => {
        const b1 = {
          id: '',
          streamId: ts1,
          name: 'randomudeletablebranch',
          description: 'dimitries development branch'
        }
        const b1Res = await sendRequest(userA.token, {
          query:
            'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }',
          variables: { branch: omit(b1, 'id') }
        })
        expect(b1Res).to.be.json
        expect(b1Res.body.errors, JSON.stringify(b1Res.body.errors)).to.not.exist
        b1.id = b1Res.body.data.branchCreate

        // give C some access permissions
        await addOrUpdateStreamCollaborator(
          ts1,
          userC.id,
          Roles.Stream.Contributor,
          userA.id
        )

        const payload = {
          streamId: ts1,
          id: b1.id
        }

        const badPayload = {
          streamId: ts1,
          id: 'APRIL FOOOLS!'
        }

        const res = await sendRequest(userC.token, {
          query:
            'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }',
          variables: { branch: badPayload }
        })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('BRANCH_UPDATE_ERROR')
        expect(res.body.errors[0].message).to.equal('Branch not found')

        const res1 = await sendRequest(userC.token, {
          query:
            'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }',
          variables: { branch: payload }
        })
        expect(res1).to.be.json
        expect(res1.body.errors).to.exist
        expect(res1.body.errors[0].extensions.code).to.equal('BRANCH_UPDATE_ERROR')
        expect(res1.body.errors[0].message).to.equal(
          'Only the branch creator or stream owners are allowed to delete branches'
        )

        const res2 = await sendRequest(userA.token, {
          query:
            'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }',
          variables: { branch: payload }
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.not.exist

        // revoke perms for c back (dont' wanna mess up our integration-unit tests below)
        await sendRequest(userA.token, {
          query: `mutation{ streamRevokePermission( permissionParams: {streamId: "${ts1}", userId: "${userC.id}"} ) }`
        })
      })

      it('Should commit to a non-main branch as well...', async () => {
        const cc = {
          message: 'what a message for a second commit',
          streamId: ts1,
          objectId: objIds[3],
          branchName: 'userB/dev/api'
        }

        const res = await sendRequest(userB.token, {
          query:
            'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }',
          variables: { myCommit: cc }
        })
        expect(res).to.be.json
        expect(res.body.errors, JSON.stringify(res.body.errors)).to.not.exist
        expect(res.body.data).to.have.property('commitCreate')
        expect(res.body.data.commitCreate).to.be.a('string')
      })

      it('Should *not* update a branch if given the wrong stream id', async () => {
        // create stream for user C
        const res = await sendRequest(userC.token, {
          query:
            'mutation { streamCreate(stream: { name: "TS (u C) private", description: "sup my dudes", isPublic:false } ) }'
        })
        expect(res).to.be.json
        expect(res.body.errors, JSON.stringify(res.body.errors)).to.not.exist
        ts6 = res.body.data.streamCreate

        // user B creates branch on private stream
        b4 = {
          id: '',
          streamId: ts3,
          name: 'izz/secret',
          description: 'a private branch on a private stream'
        }
        const res1 = await sendRequest(userB.token, {
          query:
            'mutation( $branch:BranchCreateInput! ) { branchCreate( branch:$branch ) }',
          variables: { branch: omit(b4, 'id') }
        })
        expect(res1).to.be.json
        expect(res1.body.errors, JSON.stringify(res1.body.errors)).to.not.exist
        expect(res1.body.data).to.have.property('branchCreate')
        expect(res1.body.data.branchCreate).to.be.a('string')
        b4.id = res1.body.data.branchCreate

        const badPayload = {
          streamId: ts6, // stream user C has access to
          id: b4.id, // branch user C doesn't have access to
          name: 'izz/not-so-secret'
        }

        const res2 = await sendRequest(userC.token, {
          query:
            'mutation( $branch:BranchUpdateInput! ) { branchUpdate( branch:$branch ) }',
          variables: { branch: badPayload }
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.exist
        expect(res2.body.errors[0].extensions.code).to.equal('BRANCH_UPDATE_ERROR')
        expect(res2.body.errors[0].message).to.equal(
          'The branch ID and stream ID do not match, please check your inputs'
        )
      })

      it('should *not* delete a branch if given the wrong stream id', async () => {
        const badPayload = {
          streamId: ts6, // stream user C has access to
          id: b4.id // branch user C doesn't have access to
        }

        const res = await sendRequest(userC.token, {
          query:
            'mutation( $branch:BranchDeleteInput! ) { branchDelete( branch: $branch ) }',
          variables: { branch: badPayload }
        })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('BRANCH_UPDATE_ERROR')
        expect(res.body.errors[0].message).to.equal(
          'The branch ID and stream ID do not match, please check your inputs'
        )
      })
    })
  })

  describe('Queries', () => {
    describe('My Profile', () => {
      it('Should retrieve my profile', async () => {
        const res = await sendRequest(userA.token, {
          query: '{ user { id name email role apiTokens { id name } } }'
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data).to.have.property('user')
        expect(res.body.data.user.name).to.equal('test user updated')
        expect(res.body.data.user.email).to.equal('d.1@speckle.systems')
        expect(res.body.data.user.role).to.equal(Roles.Server.Admin)
      })

      it('Should retrieve my streams', async () => {
        // add more streams
        await sendRequest(userA.token, {
          query:
            'mutation( $myStream: StreamCreateInput! ) { streamCreate( stream: $myStream ) }',
          variables: { myStream: { name: 'o hai' } }
        })

        await sendRequest(userA.token, {
          query:
            'mutation( $myStream: StreamCreateInput! ) { streamCreate( stream: $myStream ) }',
          variables: { myStream: { name: 'bai now' } }
        })

        await sendRequest(userA.token, {
          query:
            'mutation( $myStream: StreamCreateInput! ) { streamCreate( stream: $myStream ) }',
          variables: { myStream: { name: 'one more for the road' } }
        })

        const res = await sendRequest(userA.token, {
          query:
            '{ user { streams( limit: 3 ) { totalCount cursor items { id name } } } }'
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.user.streams.items.length).to.equal(3)

        const res2 = await sendRequest(userA.token, {
          query: `{ user { streams( limit: 3, cursor: "${res.body.data.user.streams.cursor}" ) { totalCount cursor items { id name } } } }`
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.not.exist
        expect(res2.body.data.user.streams.items.length).to.equal(3)

        const streams = res2.body.data.user.streams.items
        const s1 = streams.find(
          (s: { name: string }) => s.name === 'TS1 (u A) Private UPDATED'
        )
        expect(s1).to.exist
      })

      it('Should retrieve my commits (across all streams)', async () => {
        for (let i = 10; i < 20; i++) {
          const c1 = {
            message: `what a message for commit number ${i}`,
            streamId: ts1,
            objectId: objIds[i],
            branchName: 'main'
          }
          await sendRequest(userA.token, {
            query:
              'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }',
            variables: { myCommit: c1 }
          })
        }

        const res = await sendRequest(userA.token, {
          query:
            '{ user { commits( limit: 3 ) { totalCount cursor items { id message referencedObject } } } }'
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.user.commits.totalCount).to.equal(11)
        expect(res.body.data.user.commits.cursor).to.exist
        expect(res.body.data.user.commits.items.length).to.equal(3)

        const res2 = await sendRequest(userA.token, {
          query: `{ user { commits( limit: 3, cursor: "${res.body.data.user.commits.cursor}") { totalCount cursor items { id message referencedObject } } } }`
        })
        expect(res2).to.be.json
        expect(res2.body.errors).to.not.exist
        expect(res2.body.data.user.commits.totalCount).to.equal(11)
        expect(res2.body.data.user.commits.items.length).to.equal(3)
      })
    })

    describe('Different Users` Profile', () => {
      /**
       * TODO: These user() queries should be swapped to otherUser() afterwards
       */

      it('Should retrieve a different profile profile', async () => {
        const res = await sendRequest(userA.token, {
          query: ` { user(id:"${userB.id}") { id name email } }`
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data).to.have.property('user')
        expect(res.body.data.user.name).to.equal('d2')
        expect(res.body.data.user.email).to.equal('d.2@speckle.systems')
      })

      it('Should not retrieve a profile if no auth', async () => {
        const res = await sendRequest(null, { query: '{ user { id name email } }' })
        expect(res).to.be.json
        expect(res.body.data).to.have.property('user')
        expect(res.body.data.user).to.be.null
        expect(res.body.errors).to.not.exist
      })

      it('Should not retrieve user email field if out of scope', async () => {
        // token1 has only users:read scope
        const res = await sendRequest(token1, {
          query: ` { user(id:"${userB.id}") { id name email } }`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.user.email).to.be.null
      })

      it('Should only retrieve public streams from a different user profile ', async () => {
        const res = await sendRequest(token1, {
          query: `query { user( id:"${userB.id}" ) { streams { totalCount items { id name isPublic } } } }`
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.user.streams.totalCount).to.equal(1)
      })

      it('Should search for some users', async () => {
        for (let i = 0; i < 10; i++) {
          // create 10 users: 3 bakers and 7 millers
          await createUser({
            name: `Master ${i <= 2 ? 'Baker' : 'Miller'} Matteo The ${i}${
              i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'
            } of His Name`,
            email: `matteo_${i}@tomato.com`,
            password: `${
              i % 2 === 0 ? 'BakerBakerBakerBaker' : 'TomatoTomatoTomatoTomato'
            }`
          })
        }

        let query = `
          query search {
            userSearch( query: "miller" ) {
              cursor
              items {
                id
                name
              }
            }
          }
        `

        let res = await sendRequest(userB.token, { query })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.userSearch.items.length).to.equal(7)

        query = `
          query search {
            userSearch( query: "baker" ) {
              cursor
              items {
                id
                name
              }
            }
          }
        `

        res = await sendRequest(userB.token, { query })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.userSearch.items.length).to.equal(3)

        // by email
        query =
          'query { userSearch( query: "matteo_2@tomato.com" ) { cursor items { id name } } } '
        res = await sendRequest(userB.token, { query })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.userSearch.items.length).to.equal(1)
      })

      it('Should not search for some users if bad request', async () => {
        const queryLim =
          'query { userSearch( query: "mi" ) { cursor items { id name } } } '
        let res = await sendRequest(userB.token, { query: queryLim })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('BAD_REQUEST_ERROR')

        const queryPagination =
          'query { userSearch( query: "matteo", limit: 200 ) { cursor items { id name } } } '
        res = await sendRequest(userB.token, { query: queryPagination })
        expect(res).to.be.json
        expect(res.body.errors).to.exist
        expect(res.body.errors[0].extensions.code).to.equal('BAD_REQUEST_ERROR')
      })
    })

    describe('Streams', () => {
      it('Should retrieve a stream', async () => {
        const res = await sendRequest(userA.token, {
          query: `
          query {
            stream(id:"${ts1}") {
              id
              name
              createdAt
              updatedAt
              collaborators {
                id
                name
                role
              }
            }
          }`
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist

        const stream = res.body.data.stream

        expect(stream.name).to.equal('TS1 (u A) Private UPDATED')
        expect(stream.collaborators).to.have.lengthOf(2)

        const d2User = stream.collaborators.find(
          (c: { name: string }) => c.name === 'd2'
        )
        const testUserUpdated = stream.collaborators.find(
          (c: { name: string }) => c.name === 'test user updated'
        )
        expect(d2User).to.be.ok
        expect(testUserUpdated).to.be.ok
        expect(d2User.role).to.equal(Roles.Stream.Contributor)
        expect(testUserUpdated.role).to.equal(Roles.Stream.Owner)
      })

      it('Should retrieve a public stream even if not authenticated', async () => {
        const query = `query { stream( id: "${ts2}" ) { name createdAt } }`
        const res = await sendRequest(null, { query })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
      })

      it('should retrieve all stream branches', async () => {
        const query = `
          query{
            stream(id: "${ts1}"){
              branches {
                totalCount
                cursor
                items {
                  id
                  name
                  author {
                    id
                    name
                  }
                }
              }
            }
          }
        `

        const res = await sendRequest(userA.token, { query })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.stream.branches.items).to.be.ok
        expect(res.body.data.stream.branches.totalCount).to.be.ok
        expect(res.body.data.stream.branches.cursor).to.exist

        const firstBranchName = res.body.data.stream.branches.items[0].name
        const res1 = await sendRequest(userA.token, {
          query: `query { stream(id:"${ts1}") { branch( name: "${firstBranchName}" ) { name description } } } `
        })

        expect(res1).to.be.json
        expect(res1.body.errors).to.not.exist
        expect(res1.body.data.stream.branch.name).to.equal(firstBranchName)
      })

      it("it should retrieve a stream's default 'main' branch if no branch name is specified", async () => {
        const res = await sendRequest(userA.token, {
          query: `query { stream(id:"${ts1}") { branch { name description } } } `
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.stream.branch.name).to.equal('main')
      })

      it('should retrieve a branch`s commits', async () => {
        const query = `
        query {
          stream( id: "${ts1}" ) {
            branch( name: "main" ) {
              id
              name
              commits( limit: 5 ) {
                totalCount
                cursor
                items {
                  id
                  message
                  createdAt
                  referencedObject
                  authorId
                }
              }
            }
          }
        }
        `
        const res = await sendRequest(userA.token, { query })
        expect(res.body.data.stream.branch.commits.items.length).to.equal(5)
        expect(res.body.data.stream.branch.commits.items[0]).to.have.property('id')
        expect(res.body.data.stream.branch.commits.items[0]).to.have.property('message')
        expect(res.body.data.stream.branch.commits.items[0]).to.have.property(
          'createdAt'
        )

        const query2 = `
        query {
          stream( id: "${ts1}" ) {
            branch( name: "main" ) {
              id
              name
              commits( limit: 3, cursor: "${res.body.data.stream.branch.commits.cursor}" ) {
                totalCount
                cursor
                items {
                  id
                  message
                  createdAt
                  referencedObject
                  authorId
                  authorName
                }
              }
            }
          }
        }`

        const res2 = await sendRequest(userA.token, { query: query2 })
        // console.log( res2.body.errors )
        // console.log( res2.body.data.stream.branch.commits )

        expect(res2.body.data.stream.branch.commits.items.length).to.equal(3)
        expect(res2.body.data.stream.branch.commits.items[0]).to.have.property('id')
        expect(res2.body.data.stream.branch.commits.items[0]).to.have.property(
          'message'
        )
        expect(res2.body.data.stream.branch.commits.items[0]).to.have.property(
          'createdAt'
        )
      })

      let commitList: { id: string }[]

      it('should retrieve all stream commits', async () => {
        const query = `
        query {
          stream( id: "${ts1}" ) {
            commits( limit: 10 ) {
              totalCount
              cursor
              items {
                id
                message
                authorId
                authorName
              }
            }
          }
        }
        `
        const res = await sendRequest(userA.token, { query })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.stream.commits.items.length).to.equal(10)
        expect(res.body.data.stream.commits.totalCount).to.equal(12)

        commitList = res.body.data.stream.commits.items

        const query2 = `
        query {
          stream( id: "${ts1}" ) {
            commits( limit: 10, cursor: "${res.body.data.stream.commits.cursor}" ) {
              totalCount
              cursor
              items {
                id
                message
                authorId
                authorName
              }
            }
          }
        }
        `

        const res2 = await sendRequest(userA.token, { query: query2 })

        expect(res2).to.be.json
        expect(res2.body.errors).to.not.exist
        expect(res2.body.data.stream.commits.items.length).to.equal(2)
      })

      it('should retrieve a stream commit', async () => {
        const res = await sendRequest(userA.token, {
          query: `query { stream( id:"${ts1}" ) { commit( id: "${commitList[0].id}" ) { id message referencedObject } } }`
        })

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.stream.commit.message).to.equal(
          'what a message for commit number 19'
        ) // should be the last created one
      })

      it('should retrieve the latest stream commit if no id is specified', async () => {
        const res = await sendRequest(userA.token, {
          query: `query { stream( id:"${ts1}" ) { commit { id message referencedObject } } }`
        })
        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(res.body.data.stream.commit.message).to.equal(
          'what a message for commit number 19'
        ) // should be the last created one
      })
    })

    describe('Objects', () => {
      let myCommit: { id: string; name: string }
      let myObjs: { name: string }[]

      before(async () => {
        const { commit, objs } = generateManyObjects(100, 'noise__')
        myCommit = commit
        myObjs = objs
      })

      it('should save many objects', async () => {
        const everything = [myCommit, ...myObjs]
        const res = await sendRequest(userA.token, {
          query: `mutation($objs:[JSONObject]!) { objectCreate(objectInput: {streamId:"${ts1}", objects: $objs}) }`,
          variables: { objs: everything }
        })

        const objIds = res.body.data.objectCreate

        expect(res).to.be.json
        expect(res.body.errors).to.not.exist
        expect(objIds.length).to.equal(101) // +1 for the actual "commit" object
      })

      it("should get an object's sub-objects' objects", async () => {
        const first = await sendRequest(userA.token, {
          query: `
          query {
            stream( id:"${ts1}" ) {
              id
              name
              object( id:"${myCommit.id}" ) {
                createdAt
                children( limit: 2 ) {
                  totalCount
                  cursor
                  objects {
                    id
                  }
                }
              }
            }
          }
          `
        })

        expect(first).to.be.json
        expect(first.body.errors).to.not.exist
        expect(first.body.data.stream).to.be.an('object')
        expect(first.body.data.stream.object).to.be.an('object')
        expect(first.body.data.stream.object.children.objects.length).to.equal(2)

        const second = await sendRequest(userA.token, {
          query: `
          query {
            stream(id:"${ts1}") {
              id
              name
              object( id:"${myCommit.id}" ) {
                createdAt
                children( limit: 20, cursor: "${first.body.data.stream.object.children.cursor}", select: ["sortValueA", "nest.arr[2]"] ) {
                  totalCount
                  objects {
                    id
                    data
                  }
                }
              }
            }
          }
          `
        })

        expect(second).to.be.json
        expect(second.body.errors).to.not.exist
        expect(second.body.data.stream).to.be.an('object')
        expect(second.body.data.stream.object).to.be.an('object')
        expect(second.body.data.stream.object.children.objects.length).to.equal(20)
        expect(
          second.body.data.stream.object.children.objects[0].data.sortValueA
        ).to.equal(52) // when sorting by id, it's always 52
        expect(
          second.body.data.stream.object.children.objects[0].data.nest.arr[2]
        ).to.equal(52) // when sorting by id, it's always 52
      })

      it("should query an object's subojects", async () => {
        const first = await sendRequest(userA.token, {
          query: `
          query( $query: [JSONObject!], $orderBy: JSONObject ) {
            stream(id:"${ts1}") {
              id
              name
              object( id:"${myCommit.id}" ) {
                createdAt
                children( limit: 20, select:[ "sortValueA" ], query: $query, orderBy: $orderBy ) {
                  totalCount
                  cursor
                  objects {
                    id
                    data
                  }
                }
              }
            }
          }
          `,
          variables: {
            query: [{ field: 'sortValueA', operator: '>=', value: 42 }],
            orderBy: { field: 'sortValueA' }
          }
        })

        expect(first).to.be.json
        expect(first.body.errors).to.not.exist
        expect(first.body.data.stream).to.be.an('object')
        expect(first.body.data.stream.object).to.be.an('object')
        expect(first.body.data.stream.object.children.objects.length).to.equal(20)
        expect(
          first.body.data.stream.object.children.objects[0].data.sortValueA
        ).to.equal(42)
        expect(
          first.body.data.stream.object.children.objects[1].data.sortValueA
        ).to.equal(43)
      })
    })
  })

  describe('Generic / Server Info', () => {
    it('Should eval string for password strength', async () => {
      const query = `query {
                      userPwdStrength(pwd: "garbage") {
                        score
                        feedback {
                          warning
                          suggestions
                        }
                      }
                    } `
      const res = await sendRequest(null, { query })
      expect(res).to.be.json
      expect(res.body.errors).to.not.exist
    })

    it('Should return a valid server information object', async () => {
      const q = `
        query{
          serverInfo{
            name
            adminContact
            termsOfService
            description
            version
            roles{
              name
              description
              resourceTarget
            }
            scopes{
              name
              description
            }
            configuration{
              objectSizeLimitBytes
              objectMultipartUploadSizeLimitBytes
            }
          }
        }`

      const res = await sendRequest(null, { query: q })

      expect(res).to.be.json
      expect(res.body.errors).to.not.exist
      expect(res.body.data.serverInfo).to.be.an('object')

      const si = res.body.data.serverInfo
      expect(si.name).to.be.a('string')
      expect(si.adminContact).to.be.a('string')
      expect(si.termsOfService).to.be.a('string')
      expect(si.description).to.be.a('string')
      expect(si.roles).to.be.a('array')
      expect(si.scopes).to.be.a('array')
      expect(si.configuration.objectSizeLimitBytes).to.be.a('number')
      expect(si.configuration.objectMultipartUploadSizeLimitBytes).to.be.a('number')
    })

    it('Should update the server info object', async () => {
      const query =
        'mutation updateSInfo($info: ServerInfoUpdateInput!) { serverInfoUpdate( info: $info ) } '
      const variables = {
        info: { name: 'Super Duper Test Server Yo!', company: 'Super Systems' }
      }

      const res = await sendRequest(userA.token, { query, variables })
      expect(res).to.be.json
      expect(res.body.errors).to.not.exist
    })

    it('Should NOT update the server info object if user is not an admin', async () => {
      const query =
        'mutation updateSInfo( $info: ServerInfoUpdateInput! ) { serverInfoUpdate( info: $info ) } '
      const variables = {
        info: { name: 'Super Duper Test Server Yo!', company: 'Super Systems' }
      }

      const res = await sendRequest(userB.token, { query, variables })
      expect(res).to.be.json
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
    })
  })

  describe('Archived role access validation', () => {
    const archivedUser = {
      id: '',
      token: '',
      name: 'Mark von Archival',
      email: 'archi@speckle.systems',
      password: 'i"ll be back, just wait'
    }
    let streamId: string
    before(async () => {
      archivedUser.id = await createUser(archivedUser)
      archivedUser.token = `Bearer ${await createPersonalAccessToken(
        archivedUser.id,
        'this will be archived',
        [
          Scopes.Streams.Read,
          Scopes.Streams.Write,
          Scopes.Users.Read,
          Scopes.Users.Email,
          Scopes.Tokens.Write,
          Scopes.Tokens.Read,
          Scopes.Profile.Read,
          Scopes.Profile.Email,
          Scopes.Apps.Read,
          Scopes.Apps.Write,
          Scopes.Users.Invite
        ]
      )}`
      await changeUserRole({ userId: archivedUser.id, role: Roles.Server.ArchivedUser })
    })

    it('Should be able to read public streams', async () => {
      const streamRes = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate( stream: { name: "Share this with poor Mark", description: "💩", isPublic:true } ) }'
      })
      await addOrUpdateStreamCollaborator(
        streamRes.body.data.streamCreate,
        archivedUser.id,
        Roles.Stream.Contributor,
        userA.id
      )

      const res = await sendRequest(archivedUser.token, {
        query: `query { stream(id:"${streamRes.body.data.streamCreate}") { id name } }`
      })
      expect(res.body.errors).to.not.exist
      expect(res.body.data.stream.id).to.equal(streamRes.body.data.streamCreate)
    })

    it('Should be forbidden to create token', async () => {
      const query =
        'mutation( $tokenInput:ApiTokenCreateInput! ) { apiTokenCreate ( token: $tokenInput ) }'
      const res = await sendRequest(archivedUser.token, {
        query,
        variables: {
          tokenInput: {
            scopes: [Scopes.Streams.Read],
            name: 'thisWillNotBeCreated',
            lifespan: 1000000
          }
        }
      })
      // WHY NOT 401 ???
      // expect( res ).to.have.status( 401 )
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to interact (read, write, delete) private streams it had access to', async () => {
      const streamRes = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate( stream: { name: "Share this with poor Mark", description: "💩", isPublic:false } ) }'
      })
      streamId = streamRes.body.data.streamCreate

      await addOrUpdateStreamCollaborator(
        streamId,
        archivedUser.id,
        Roles.Stream.Contributor,
        userA.id
      )

      let res = await sendRequest(archivedUser.token, {
        query: `query { stream(id:"${streamId}") { id name } }`
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )

      res = await sendRequest(archivedUser.token, {
        query:
          '{ user { streams( limit: 30 ) { totalCount cursor items { id name } } } }'
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )

      res = await sendRequest(archivedUser.token, {
        query: `mutation { streamDelete( id:"${streamId}")}`
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )

      res = await sendRequest(archivedUser.token, {
        query: `mutation { streamUpdate(stream: {id:"${streamId}" name: "HACK", description: "Hello World, Again!", isPublic:false } ) }`
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to create streams, both public and private', async () => {
      const query =
        'mutation ( $streamInput: StreamCreateInput!) { streamCreate(stream: $streamInput ) }'

      let res = await sendRequest(archivedUser.token, {
        query,
        variables: {
          streamInput: {
            name: 'Trying to create stream',
            description: '💩',
            isPublic: false
          }
        }
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )

      res = await sendRequest(archivedUser.token, {
        query,
        variables: {
          streamInput: {
            name: 'Trying to create stream',
            description: '💩',
            isPublic: true
          }
        }
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to add apps', async () => {
      const query =
        'mutation createApp($myApp:AppCreateInput!) { appCreate( app: $myApp ) } '
      const variables = {
        myApp: {
          name: 'Test App',
          public: true,
          description: 'Test App Description',
          scopes: [Scopes.Streams.Read],
          redirectUrl: 'lol://what'
        }
      }

      const res = await sendRequest(archivedUser.token, { query, variables })

      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to send email invites', async () => {
      const res = await sendRequest(archivedUser.token, {
        query:
          'mutation inviteToServer($input: ServerInviteCreateInput!) { serverInviteCreate( input: $input ) }',
        variables: { input: { email: 'cabbages@speckle.systems', message: 'wow!' } }
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to create object', async () => {
      const objects = generateManyObjects(10)

      const res = await sendRequest(archivedUser.token, {
        query: `mutation( $objs: [JSONObject]! ) { objectCreate( objectInput: {streamId:"${ts1}", objects: $objs} ) }`,
        variables: { objs: objects.objs }
      })

      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to create commit', async () => {
      const commit = {
        message: 'what a message for a first commit',
        streamId,
        objectId: 'justARandomHash',
        branchName: 'main'
      }
      const res = await sendRequest(archivedUser.token, {
        query:
          'mutation( $myCommit: CommitCreateInput! ) { commitCreate( commit: $myCommit ) }',
        variables: { myCommit: commit }
      })
      expect(res.body.errors).to.exist
      expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
      expect(res.body.errors[0].message).to.equal(
        'You do not have the required server role'
      )
    })

    it('Should be forbidden to upload via rest API', async () => {
      const objects = generateManyObjects(2)
      const res = await request(app)
        .post(`/objects/${streamId}`)
        .set('Authorization', archivedUser.token)
        .set('Content-type', 'multipart/form-data')
        .attach('batch1', Buffer.from(JSON.stringify(objects.objs), 'utf8'))
      expect(res).to.have.status(401)
    })

    it('Should be forbidden to download from private stream it had access to via rest API', async () => {
      // even if the object doesn't exist, so im not creating it...
      const res = await request(app)
        .get('/objects/thisIs/bogus')
        .set('Authorization', archivedUser.token)
      expect(res).to.have.status(401)
    })

    it('Should be able to download from public stream via rest API', async () => {
      const streamRes = await sendRequest(userA.token, {
        query:
          'mutation { streamCreate( stream: { name: "Mark will read this", description: "🥔", isPublic:true } ) }'
      })

      await addOrUpdateStreamCollaborator(
        streamRes.body.data.streamCreate,
        archivedUser.id,
        Roles.Stream.Contributor,
        userA.id
      )

      const objects = generateManyObjects(2)
      let res = await request(app)
        .post(`/objects/${streamRes.body.data.streamCreate}`)
        .set('Authorization', userA.token)
        .set('Content-type', 'multipart/form-data')
        .attach('batch1', Buffer.from(JSON.stringify(objects.objs), 'utf8'))
      expect(res).to.have.status(201)

      res = await request(app)
        .get(`/objects/${streamRes.body.data.streamCreate}/${objects.objs[0].id}`)
        .set('Authorization', archivedUser.token)
      expect(res).to.have.status(200)
      expect(res.body[0].id).to.equal(objects.objs[0].id)
    })
  })
})
