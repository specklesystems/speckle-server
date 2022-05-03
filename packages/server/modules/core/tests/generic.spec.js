/* istanbul ignore file */
const expect = require('chai').expect

const { beforeEachContext } = require('@/test/hooks')

const {
  validateServerRole,
  buildContext,
  validateScopes,
  authorizeResolver
} = require('../../shared')

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

  it('Should create proper context', async () => {
    const res = await buildContext({ req: { headers: { authorization: 'Bearer BS' } } })
    expect(res.auth).to.equal(false)

    const res2 = await buildContext({ req: { headers: { authorization: null } } })
    expect(res2.auth).to.equal(false)

    const res3 = await buildContext({ req: { headers: { authorization: undefined } } })
    expect(res3.auth).to.equal(false)
  })

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
