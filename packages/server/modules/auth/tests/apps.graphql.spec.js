/* eslint-disable camelcase */
/* istanbul ignore file */
const chai = require('chai')

const expect = chai.expect

const {
  createBareToken,
  createAppTokenFactory,
  createPersonalAccessTokenFactory
} = require('@/modules/core/services/tokens')
const { beforeEachContext, initializeTestServer } = require('@/test/hooks')
const { Scopes } = require('@speckle/shared')
const {
  createAuthorizationCodeFactory,
  getAuthorizationCodeFactory,
  deleteAuthorizationCodeFactory,
  getAppFactory,
  createRefreshTokenFactory
} = require('@/modules/auth/repositories/apps')
const { db } = require('@/db/knex')
const {
  createAppTokenFromAccessCodeFactory
} = require('@/modules/auth/services/serverApps')
const {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} = require('@/modules/core/repositories/users')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeUserServerAppTokenFactory,
  storePersonalApiTokenFactory
} = require('@/modules/core/repositories/tokens')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')

let sendRequest
let server

const createAppToken = createAppTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
})
const createAuthorizationCode = createAuthorizationCodeFactory({ db })
const createAppTokenFromAccessCode = createAppTokenFromAccessCodeFactory({
  getAuthorizationCode: getAuthorizationCodeFactory({ db }),
  deleteAuthorizationCode: deleteAuthorizationCodeFactory({ db }),
  getApp: getAppFactory({ db }),
  createRefreshToken: createRefreshTokenFactory({ db }),
  createAppToken,
  createBareToken
})

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

describe('GraphQL @apps-api', () => {
  let testUser
  let testUser2
  let testToken
  let testToken2

  before(async () => {
    const ctx = await beforeEachContext()
    server = ctx.server
    ;({ sendRequest } = await initializeTestServer(ctx))
    testUser = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie@gmail.com',
      password: 'wtfwtfwtf'
    }

    testUser.id = await createUser(testUser)
    testToken = `Bearer ${await createPersonalAccessToken(testUser.id, 'test token', [
      Scopes.Profile.Read,
      Scopes.Apps.Read,
      Scopes.Apps.Write
    ])}`

    testUser2 = {
      name: 'Mr. Mac',
      email: 'steve@jobs.com',
      password: 'wtfwtfwtf'
    }

    testUser2.id = await createUser(testUser2)
    testToken2 = `Bearer ${await createPersonalAccessToken(testUser2.id, 'test token', [
      Scopes.Profile.Read,
      Scopes.Apps.Read,
      Scopes.Apps.Write
    ])}`
  })

  after(async () => {
    await server.close()
  })

  let testAppId
  let testApp

  it('Should create an app', async () => {
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

    const res = await sendRequest(testToken, { query, variables })
    expect(res).to.be.json
    expect(res.body.errors).to.not.exist
    testAppId = res.body.data.appCreate
  })

  it('Should not create an app if request is not authenticated', async () => {
    const query = `
        mutation createApp($myApp:AppCreateInput!) {
          appCreate( app: $myApp )
        }
      `
    const variables = {
      myApp: {
        name: 'Test App',
        description: 'Test App Description',
        scopes: [Scopes.Streams.Read],
        redirectUrl: 'lol://what'
      }
    }

    const res = await sendRequest(null, { query, variables })
    expect(res).to.be.json
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
  })

  it('Should get app info', async () => {
    const query = `
        query getApp {
          app( id: "${testAppId}") {
            name
            secret
            description
            author {
              name
              id
            }
            scopes {
              name
              description
            }
          }
        }
      `

    const res = await sendRequest(testToken, { query })
    expect(res).to.be.json
    expect(res.body.errors).to.not.exist
    expect(res.body.data.app.name).to.equal('Test App')
    expect(res.body.data.app.scopes.length).to.equal(1)
    expect(res.body.data.app.secret).to.exist
    testApp = res.body.data.app
  })

  it('Should get all the public apps on this server', async () => {
    const query = 'query allapps{ apps { name description author { id name } } }'
    const res = await sendRequest(null, { query })
    expect(res).to.be.json
    expect(res.body.errors).to.not.exist
    expect(res.body.data.apps).to.be.an('array')
    expect(res.body.data.apps.length).to.equal(8)
  })

  it('Should get app info without secret if not authenticated and owner', async () => {
    const query = `query getApp { app( id: "${testAppId}") { name secret } }`

    const res = await sendRequest(null, { query })
    expect(res.body.data.app.secret).to.equal(
      'App secrets are only revealed to their author 😉'
    )

    const res2 = await sendRequest(testToken2, { query })
    expect(res2.body.data.app.secret).to.equal(
      'App secrets are only revealed to their author 😉'
    )
  })

  it('Should update app info', async () => {
    const query = `
        mutation updateApp($myApp:AppUpdateInput!) {
          appUpdate( app: $myApp )
        }
      `
    const variables = {
      myApp: {
        id: testAppId,
        name: 'Updated Test App',
        description: 'Test App Description',
        scopes: [Scopes.Streams.Read],
        redirectUrl: 'lol://what'
      }
    }

    const res = await sendRequest(testToken, { query, variables })
    expect(res).to.be.json
    expect(res.body.data.appUpdate).to.equal(true)

    const query2 = `query getApp { app( id: "${testAppId}") { name } }`
    const res2 = await sendRequest(null, { query: query2 })

    expect(res2.body.data.app.name).to.equal('Updated Test App')
  })

  it('Should not delete app if request is not authenticated/user is app owner', async () => {
    const query = `mutation del { appDelete( appId: "${testAppId}" ) }`
    const res = await sendRequest(null, { query })
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions?.code).to.equal('FORBIDDEN')

    const res2 = await sendRequest(testToken2, { query })
    expect(res2.body.errors).to.exist
    expect(res2.body.errors[0].extensions?.code).to.equal('FORBIDDEN')
  })

  it('Should get the apps that i have created', async () => {
    const query =
      'mutation createApp($myApp:AppCreateInput!) { appCreate( app: $myApp ) } '
    let variables = {
      myApp: {
        name: 'Another Test App',
        public: false,
        description: 'Test App Description',
        scopes: [Scopes.Streams.Read],
        redirectUrl: 'lol://what'
      }
    }
    await sendRequest(testToken, { query, variables })

    variables = {
      myApp: {
        name: 'The n-th Test App',
        public: false,
        description: 'Test App Description',
        scopes: [Scopes.Streams.Read],
        redirectUrl: 'lol://what'
      }
    }
    await sendRequest(testToken, { query, variables })

    const getMyAppsQuery =
      'query usersApps{ user { createdApps { id name description } } }'

    const res = await sendRequest(testToken, { query: getMyAppsQuery })
    expect(res.body.errors).to.not.exist
    expect(res.body.data.user.createdApps).to.be.an('array')
    expect(res.body.data.user.createdApps.length).to.equal(3)
  })

  it('Should get my authorised apps', async () => {
    // 'authorize' the test app.
    const authorizationCode_1 = await createAuthorizationCode({
      appId: testAppId,
      userId: testUser.id,
      challenge: 'floating points'
    })
    await createAppTokenFromAccessCode({
      appId: testAppId,
      appSecret: testApp.secret,
      accessCode: authorizationCode_1,
      challenge: 'floating points'
    })

    const authorizationCode_2 = await createAuthorizationCode({
      appId: 'sdm',
      userId: testUser.id,
      challenge: 'floating points'
    })
    await createAppTokenFromAccessCode({
      appId: 'sdm',
      appSecret: 'sdm',
      accessCode: authorizationCode_2,
      challenge: 'floating points'
    })

    const query =
      'query myAuthApps{ user { authorizedApps { id name description termsAndConditionsLink logo author { id name } } } }'

    const res = await sendRequest(testToken, { query })

    expect(res.body.errors).to.not.exist
    expect(res.body.data.user.authorizedApps).to.be.an('array')
    expect(res.body.data.user.authorizedApps.length).to.equal(2)
  })

  it('Should revoke access to an app I have authorised', async () => {
    const query = `mutation revokeAcces{ appRevokeAccess( appId: "${testAppId}" ) }`
    const res = await sendRequest(testToken, { query })
    expect(res.body.errors).to.not.exist
    expect(res.body.data.appRevokeAccess).to.equal(true)
  })

  it('Should delete app', async () => {
    const query = `mutation del { appDelete( appId: "${testAppId}" ) }`
    const res = await sendRequest(testToken, { query })
    expect(res.body.errors).to.not.exist
    expect(res.body.data.appDelete).to.equal(true)
  })
})
