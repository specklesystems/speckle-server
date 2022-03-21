/* istanbul ignore file */
const expect = require('chai').expect
const assert = require('assert')

const appRoot = require('app-root-path')
const { beforeEachContext } = require(`${appRoot}/test/hooks`)

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
    try {
      await validateScopes()
      assert.fail('Should have thrown an error with invalid input')
    } catch (e) {
      //
    }

    try {
      await validateScopes(['a'], 'b')
      assert.fail('Should have thrown an error')
    } catch (e) {
      //
    }

    await validateScopes(['a', 'b'], 'b') // should pass
  })

  it('Should create proper context', async () => {
    let res = await buildContext({ req: { headers: { authorization: 'Bearer BS' } } })
    expect(res.auth).to.equal(false)

    let res2 = await buildContext({ req: { headers: { authorization: null } } })
    expect(res2.auth).to.equal(false)

    let res3 = await buildContext({ req: { headers: { authorization: undefined } } })
    expect(res3.auth).to.equal(false)
  })

  it('Should validate server role', async () => {
    try {
      let test = await validateServerRole({ auth: true, role: 'server:user' }, 'server:admin')
      assert.fail()
    } catch (e) {
      assert.equal('the void', 'the void')
    }

    try {
      let test = await validateServerRole({ auth: true, role: 'HACZOR' }, '133TCR3w')
      assert.fail('Invalid roles should be refused')
    } catch (e) {
      assert.equal('stares', 'stares')
    }

    try {
      let test = await validateServerRole({ auth: true, role: 'server:admin' }, '133TCR3w')
      assert.fail('Invalid roles should be refused')
    } catch (e) {
      assert.equal('and waits dreaming', 'and waits dreaming')
    }

    let test = await validateServerRole({ auth: true, role: 'server:admin' }, 'server:user')
    expect(test).to.equal(true)
  })

  it('Resolver Authorization Should fail nicely when roles & resources are wanky', async () => {
    try {
      let res = await authorizeResolver(null, 'foo', 'bar')
      assert.fail('resolver authorization should have thrown')
    } catch (e) {}

    try {
      let res = await authorizeResolver('foo', 'bar', 'streams:read')
      assert.fail('resolver authorization should have thrown')
    } catch (e) {}
  })
})
