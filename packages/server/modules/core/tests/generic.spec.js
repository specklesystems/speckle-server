/* istanbul ignore file */
const { mockRequireModule } = require('@/test/mockHelper')
const envHelperMock = mockRequireModule(
  [
    '@/modules/shared/helpers/envHelper',
    require.resolve('../../shared/helpers/envHelper')
  ],
  ['@/modules/shared/index']
)
const expect = require('chai').expect

const { beforeEachContext } = require('@/test/hooks')
const { createStream } = require('@/modules/core/services/streams')
const { createUser } = require('@/modules/core/services/users')

const { validateScopes, authorizeResolver } = require('@/modules/shared')
const { buildContext } = require('@/modules/shared/middleware')
const { Roles, Scopes } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')
const { ForbiddenError } = require('@/modules/shared/errors')

describe('Generic AuthN & AuthZ controller tests', () => {
  before(async () => {
    await beforeEachContext()
  })

  it('Validate scopes', async () => {
    await validateScopes()
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Your auth token does not have the required scope.').to.equal(
          err.message
        )
      )

    await validateScopes(['a'], 'b')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Your auth token does not have the required scope: b.').to.equal(
          err.message
        )
      )

    await validateScopes(['a', 'b'], 'b') // should pass
  })
  ;[
    ['BS header', { req: { headers: { authorization: 'Bearer BS' } } }],
    ['Null header', { req: { headers: { authorization: null } } }],
    ['Undefined header', { req: { headers: { authorization: undefined } } }],
    ['BS token', { token: 'Bearer BS' }],
    ['Null token', { token: null }],
    ['Undefined token', { token: undefined }]
  ].map(([caseName, contextInput]) =>
    it(`Should create proper context ${caseName}`, async () => {
      const res = await buildContext(contextInput)
      expect(res.auth).to.equal(false)
    })
  )

  it('Should validate server role', async () => {
    await throwForNotHavingServerRole(
      { auth: true, role: Roles.Server.User },
      Roles.Server.Admin
    )
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('You do not have the required server role').to.equal(err.message)
      )

    await throwForNotHavingServerRole({ auth: true, role: 'HACZOR' }, '133TCR3w')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Invalid role requirement specified').to.equal(err.message)
      )

    await throwForNotHavingServerRole(
      { auth: true, role: Roles.Server.Admin },
      '133TCR3w'
    )
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Invalid role requirement specified').to.equal(err.message)
      )

    const test = await throwForNotHavingServerRole(
      { auth: true, role: Roles.Server.Admin },
      Roles.Server.User
    )
    expect(test).to.equal(true)
  })

  it('Resolver Authorization Should fail nicely when roles & resources are wanky', async () => {
    await authorizeResolver(null, 'foo', 'bar')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Unknown role: bar').to.equal(err.message))

    // this caught me out, but streams:read is not a valid role for now
    await authorizeResolver('foo', 'bar', Scopes.Streams.Read)
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Unknown role: streams:read').to.equal(err.message))
  })

  describe('Authorize resolver ', () => {
    const myStream = {
      name: 'My Stream 2',
      isPublic: true
    }
    const notMyStream = {
      name: 'Not My Stream 1',
      isPublic: false
    }
    const serverOwner = {
      name: 'Itsa Me',
      email: 'me@gmail.com',
      password: 'sn3aky-1337-b1m'
    }
    const otherGuy = {
      name: 'Some Other DUde',
      email: 'otherguy@gmail.com',
      password: 'sn3aky-1337-b1m'
    }

    before(async function () {
      // Seeding
      serverOwner.id = await createUser(serverOwner)
      otherGuy.id = await createUser(otherGuy)

      await Promise.all([
        createStream({ ...myStream, ownerId: serverOwner.id }).then(
          (id) => (myStream.id = id)
        ),
        createStream({ ...notMyStream, ownerId: otherGuy.id }).then(
          (id) => (notMyStream.id = id)
        )
      ])
    })

    afterEach(() => {
      envHelperMock.disable()
    })
    after(() => {
      envHelperMock.destroy()
      envHelperMock.resetMockedFunctions()
    })
    it('should allow stream:owners to be stream:owners', async () => {
      await authorizeResolver(
        serverOwner.id,
        myStream.id,
        Roles.Stream.Contributor,
        null
      )
    })

    it('should get the passed in role for server:admins if override enabled', async () => {
      envHelperMock.enable()
      envHelperMock.mockFunction('adminOverrideEnabled', () => true)
      await authorizeResolver(
        serverOwner.id,
        myStream.id,
        Roles.Stream.Contributor,
        null
      )
    })
    it('should not allow server:admins to be anything if adminOverride is disabled', async () => {
      try {
        await authorizeResolver(
          serverOwner.id,
          notMyStream.id,
          Roles.Stream.Contributor,
          null
        )
        throw 'This should have thrown'
      } catch (e) {
        expect(e instanceof ForbiddenError)
      }
    })

    it('should allow server:admins to be anything if adminOverride is enabled', async () => {
      envHelperMock.enable()
      envHelperMock.mockFunction('adminOverrideEnabled', () => true)

      await authorizeResolver(
        serverOwner.id,
        notMyStream.id,
        Roles.Stream.Contributor,
        null
      )
    })

    it('should not allow server:users to be anything if adminOverride is disabled', async () => {
      try {
        await authorizeResolver(
          otherGuy.id,
          myStream.id,
          Roles.Stream.Contributor,
          null
        )
        throw 'This should have thrown'
      } catch (e) {
        expect(e instanceof ForbiddenError)
      }
    })

    it('should not allow server:users to be anything if adminOverride is enabled', async () => {
      envHelperMock.enable()
      envHelperMock.mockFunction('adminOverrideEnabled', () => true)
      try {
        await authorizeResolver(
          otherGuy.id,
          myStream.id,
          Roles.Stream.Contributor,
          null
        )
        throw 'This should have thrown'
      } catch (e) {
        expect(e instanceof ForbiddenError)
      }
    })
  })
})
