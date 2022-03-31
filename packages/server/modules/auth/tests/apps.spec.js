/* istanbul ignore file */
const expect = require('chai').expect
const appRoot = require('app-root-path')

const { createUser } = require(`${appRoot}/modules/core/services/users`)
const { validateToken } = require(`${appRoot}/modules/core/services/tokens`)
const { beforeEachContext } = require(`${appRoot}/test/hooks`)
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

describe('Services @apps-services', () => {
  let actor = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'wtfwtfwtf'
  }

  before(async () => {
    await beforeEachContext()
    actor.id = await createUser(actor)
  })

  it('Should get the frontend main app', async () => {
    let app = await getApp({ id: 'spklwebapp' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  it('Should get the desktop manager app', async () => {
    let app = await getApp({ id: 'sdm' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  it('Should get the explorer app', async () => {
    let app = await getApp({ id: 'explorer' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  it('Should get the excel app', async () => {
    let app = await getApp({ id: 'spklexcel' })
    expect(app).to.be.an('object')
    expect(app.redirectUrl).to.be.a('string')
    expect(app.scopes).to.be.a('array')
  })

  let myTestApp = null

  it('Should register an app', async () => {
    const res = await createApp({
      name: 'test application',
      public: true,
      scopes: ['streams:read'],
      redirectUrl: 'http://localhost:1335'
    })

    expect(res).to.have.property('id')
    expect(res).to.have.property('secret')

    expect(res.id).to.be.a('string')
    expect(res.secret).to.be.a('string')

    let app = await getApp({ id: res.id })
    expect(app.id).to.equal(res.id)
    myTestApp = app
  })

  it('Should get all the public apps on this server', async () => {
    let apps = await getAllPublicApps()
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
        scopes: ['streams:read', 'users:read']
      }
    })
    expect(res).to.be.a('string')

    let app = await getApp({ id: myTestApp.id })
    expect(app.name).to.equal('updated test application')
    expect(app.scopes).to.be.an('array')
    expect(app.scopes.map((s) => s.name)).to.include('users:read')
    expect(app.scopes.map((s) => s.name)).to.include('streams:read')
  })

  let challenge = 'random'
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

    let validation = await validateToken(response.token)
    expect(validation.valid).to.equal(true)
    expect(validation.userId).to.equal(actor.id)
    expect(validation.scopes[0]).to.equal('streams:read')
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

    let validation = await validateToken(res.token)
    expect(validation.valid).to.equal(true)
    expect(validation.userId).to.equal(actor.id)
  })

  it('Should invalidate all tokens, refresh tokens and access codes for an app if it is updated', async () => {
    let unusedAccessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: actor.id,
      challenge
    })
    let usedAccessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: actor.id,
      challenge
    })
    let apiTokenResponse = await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: usedAccessCode,
      challenge: challenge
    })

    // We now have one unused access code, an api token and a refresh token.
    // Proceed to update the app:
    await updateApp({
      app: {
        name: 'updated test application',
        id: myTestApp.id,
        scopes: ['streams:write', 'users:read']
      }
    })

    let validationResponse = await validateToken(apiTokenResponse.token)
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

  it('Should revoke access for a given user', async () => {
    let secondUser = {
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie.wow@gmail.com',
      password: 'wtfwtfwtf'
    }

    secondUser.id = await createUser(secondUser)
    let accessCode = await createAuthorizationCode({
      appId: myTestApp.id,
      userId: secondUser.id,
      challenge
    })
    let apiTokenResponse = await createAppTokenFromAccessCode({
      appId: myTestApp.id,
      appSecret: myTestApp.secret,
      accessCode: accessCode,
      challenge: challenge
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

    let unusedAccessCode = await createAuthorizationCode({
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
