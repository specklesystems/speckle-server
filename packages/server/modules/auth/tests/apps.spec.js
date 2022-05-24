/* istanbul ignore file */
const expect = require('chai').expect

const { createUser } = require(`@/modules/core/services/users`)
const { validateToken } = require(`@/modules/core/services/tokens`)
const { beforeEachContext } = require(`@/test/hooks`)
const {
  getApp,
  getAllPublicApps,
  createApp,
  updateApp,
  deleteApp,
  createAuthorizationCode,
  createAppTokenFromAccessCode,
  refreshAppToken,
  revokeExistingAppCredentialsForUser
} = require('../services/apps')

const { Scopes } = require('@/modules/core/helpers/mainConstants')
const { updateDefaultApp } = require('@/modules/auth/defaultApps')
const knex = require('@/db/knex')

describe('Services @apps-services', () => {
  const actor = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'wtfwtfwtf'
  }

  before(async () => {
    await beforeEachContext()
    actor.id = await createUser(actor)
  })

  it('Should get the frontend main app', async () => {
    const app = await getApp({ id: 'spklwebapp' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  it('Should get the desktop manager app', async () => {
    const app = await getApp({ id: 'sdm' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  it('Should get the explorer app', async () => {
    const app = await getApp({ id: 'explorer' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  it('Should get the excel app', async () => {
    const app = await getApp({ id: 'spklexcel' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  let myTestApp = null

  it('Should register an app', async () => {
    const res = await createApp({
      name: 'test application',
      public: true,
      scopes: [Scopes.Streams.Read],
      redirectUrl: 'http://localhost:1335'
    })

    expect(res).to.have.property('id')
    expect(res).to.have.property('secret')

    expect(res.id).to.be.a('string')
    expect(res.secret).to.be.a('string')

    const app = await getApp({ id: res.id })
    expect(app.id).to.equal(res.id)
    myTestApp = app
  })

  it('Should get all the public apps on this server', async () => {
    const apps = await getAllPublicApps()
    expect(apps).to.be.an('array')
    expect(apps.length).to.equal(6)
  })

  it('Should fail to register an app with no scopes', async () => {
    await createApp({ name: 'test application2', redirectUrl: 'http://localhost:1335' })
      .then(() => {
        throw new Error('this should have been rejected')
      })
      .catch((err) =>
        expect(err.message).to.equal('Cannot create an app with no scopes.')
      )
  })

  it('Should update an app', async () => {
    const res = await updateApp({
      app: {
        name: 'updated test application',
        id: myTestApp.id,
        scopes: [Scopes.Streams.Read, Scopes.Users.Read]
      }
    })
    expect(res).to.be.a('string')

    const app = await getApp({ id: myTestApp.id })
    expect(app.name).to.equal('updated test application')
    expect(app.scopes).to.be.an('array')
    expect(app.scopes.map((s) => s.name)).to.include(Scopes.Users.Read)
    expect(app.scopes.map((s) => s.name)).to.include(Scopes.Streams.Read)
  })

  const challenge = 'random'
  let authorizationCode = null

  it('Should get an authorization code for the app', async () => {
    authorizationCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: actor.id,
      challenge
    })
    expect(authorizationCode).to.be.a('string')
  })

  let tokenCreateResponse = null

  it('Should get an api token in exchange for the authorization code ', async () => {
    const response = await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: authorizationCode,
      challenge: 'random'
    })
    expect(response).to.have.property('token')
    expect(response.token).to.be.a('string')
    expect(response).to.have.property('refreshToken')
    expect(response.refreshToken).to.be.a('string')

    tokenCreateResponse = response

    const validation = await validateToken(response.token)
    expect(validation.valid).to.equal(true)
    expect(validation.userId).to.equal(actor.id)
    expect(validation.scopes[0]).to.equal(Scopes.Streams.Read)
  })

  it('Should refresh the token using the refresh token, and get a fresh refresh token and token', async () => {
    const res = await refreshAppToken({
      refreshToken: tokenCreateResponse.refreshToken,
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      userId: actor.id
    })

    expect(res.token).to.be.a('string')
    expect(res.refreshToken).to.be.a('string')

    const validation = await validateToken(res.token)
    expect(validation.valid).to.equal(true)
    expect(validation.userId).to.equal(actor.id)
  })

  it('Should invalidate all tokens, refresh tokens and access codes for an app if it is updated', async () => {
    const unusedAccessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: actor.id,
      challenge
    })
    const usedAccessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: actor.id,
      challenge
    })
    const apiTokenResponse = await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: usedAccessCode,
      challenge
    })

    // We now have one unused access code, an api token and a refresh token.
    // Proceed to update the app:
    await updateApp({
      app: {
        name: 'updated test application',
        id: myTestApp.id,
        scopes: [Scopes.Streams.Write, Scopes.Users.Read]
      }
    })

    const validationResponse = await validateToken(apiTokenResponse.token)
    expect(validationResponse.valid).to.equal(false)

    await refreshAppToken({
      refreshToken: apiTokenResponse.refreshToken,
      appId: myTestApp.id,
      appSecret: myTestApp.secret
    })
      .then(() => {
        throw new Error('this should have been rejected')
      })
      .catch((err) => expect(err.message).to.equal('Invalid request'))

    await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: unusedAccessCode,
      challenge: 'random'
    })
      .then(() => {
        throw new Error('this should have been rejected')
      })
      .catch((err) => expect(err.message).to.equal('Access code not found.'))
  })

  const defaultApps = ['spklwebapp', 'explorer', 'sdm', 'sca', 'spklexcel']
  defaultApps.forEach((speckleAppId) => {
    it(`Should not invalidate tokens, refresh tokens and access codes for default app: ${speckleAppId}, if updated`, async () => {
      const [unusedAccessCode, usedAccessCode] = await Promise.all([
        createAuthorizationCode({
          appId: speckleAppId,
          userId: actor.id,
          challenge
        }),
        createAuthorizationCode({
          appId: speckleAppId,
          userId: actor.id,
          challenge
        })
      ])

      const apiTokenResponse = await createAppTokenFromAccessCode({
        appId: speckleAppId,
        appSecret: speckleAppId,
        accessCode: usedAccessCode,
        challenge
      })

      // We now have one unused access code, an api token and a refresh token.
      // Proceed to update the app:
      const existingApp = await getApp({ id: speckleAppId })

      const newScopes = [Scopes.Streams.Write, Scopes.Users.Read]

      await updateDefaultApp(
        {
          name: 'updated test application',
          id: speckleAppId,
          scopes: newScopes
        },
        existingApp
      )
      const updatedApp = await getApp({ id: speckleAppId })

      expect(updatedApp.scopes.map((s) => s.name)).to.equalInAnyOrder(newScopes)

      const validationResponse = await validateToken(apiTokenResponse.token)
      expect(validationResponse.valid).to.equal(true)

      const refreshedToken = await refreshAppToken({
        refreshToken: apiTokenResponse.refreshToken,
        appId: speckleAppId,
        appSecret: speckleAppId
      })
      expect(refreshedToken.refreshToken).to.exist
      expect(refreshedToken.token).to.exist

      const appToken = await createAppTokenFromAccessCode({
        appId: speckleAppId,
        appSecret: speckleAppId,
        accessCode: unusedAccessCode,
        challenge: 'random'
      })
      expect(appToken.token).to.exist
      expect(appToken.refreshToken).to.exist

      const apiTokens = await knex('user_server_app_tokens')
        .join(
          'token_scopes',
          'user_server_app_tokens.tokenId',
          '=',
          'token_scopes.tokenId'
        )
        .where({
          appId: speckleAppId
        })

      expect(newScopes).to.include.members(apiTokens.map((t) => t.scopeName))
    })
  })

  it('Updating a default app with bad data should leave the app in an untouched state', async () => {
    const speckleAppId = 'explorer'
    const existingApp = await getApp({ id: speckleAppId })
    try {
      await updateDefaultApp(
        {
          name: 'updated test application',
          id: speckleAppId,
          scopes: ['aWeird:Scope']
        },
        existingApp
      )
      throw new Error('This should have failed')
    } catch (err) {
      // check that the weird:Scope violates a foreign key constraint...
      // leaky abstractions i know, but no better way to test this for now
      expect(err.message).to.contain('server_apps_scopes_scopename_foreign')
    }
    const notUpdatedApp = await getApp({ id: speckleAppId })
    // check that no harm was done
    expect(notUpdatedApp.name).to.equal(existingApp.name)
    expect(notUpdatedApp.scopes).to.equalInAnyOrder(existingApp.scopes)
  })

  it('Should revoke access for a given user', async () => {
    const secondUser = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie.wow@gmail.com',
      password: 'wtfwtfwtf'
    }

    secondUser.id = await createUser(secondUser)
    const accessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: secondUser.id,
      challenge
    })
    const apiTokenResponse = await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode,
      challenge
    })

    await revokeExistingAppCredentialsForUser({
      appId: myTestApp.id,
      userId: secondUser.id
    })

    await refreshAppToken({
      refreshToken: apiTokenResponse.refreshToken,
      appId: myTestApp.id,
      appSecret: myTestApp.secret
    })
      .then(() => {
        throw new Error('this should have been rejected')
      })
      .catch((err) => expect(err.message).to.equal('Invalid request'))

    const unusedAccessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: actor.id,
      challenge
    })

    await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: unusedAccessCode,
      challenge: 'random'
    })

    await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: unusedAccessCode,
      challenge: 'random'
    })
      .then(() => {
        throw new Error('this should have been rejected')
      })
      .catch((err) => expect(err.message).to.equal('Access code not found.'))
  })

  it('Should delete an app', async () => {
    const res = await deleteApp({ id: myTestApp.id })
    expect(res).to.equal(1)
  })
})
