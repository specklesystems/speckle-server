/* istanbul ignore file */
const expect = require('chai').expect

const { beforeEachContext } = require('@/test/hooks')

const {
  validateServerRole,
  validateScopes,
  authorizeResolver
} = require('@/modules/shared')
const { buildContext } = require('@/modules/shared/middleware')

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
        expect('You do not have the required privileges.').to.equal(err.message)
      )

    await validateScopes(['a'], 'b')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('You do not have the required privileges.').to.equal(err.message)
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
    await validateServerRole({ auth: true, role: 'server:user' }, 'server:admin')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('You do not have the required server role').to.equal(err.message)
      )

    await validateServerRole({ auth: true, role: 'HACZOR' }, '133TCR3w')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Invalid server role specified').to.equal(err.message))

    await validateServerRole({ auth: true, role: 'server:admin' }, '133TCR3w')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Invalid server role specified').to.equal(err.message))

    const test = await validateServerRole(
      { auth: true, role: 'server:admin' },
      'server:user'
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
    await authorizeResolver('foo', 'bar', 'streams:read')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Unknown role: streams:read').to.equal(err.message))
  })
})
