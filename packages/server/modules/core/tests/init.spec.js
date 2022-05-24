/* istanbul ignore file */
const expect = require('chai').expect

const { init } = require('@/app')
const knex = require('@/db/knex')
const { beforeEachContext } = require('@/test/hooks')

// NOTE:
// These tests check that the initialization routine of the whole server
// correctly registers some scopes and roles. At the time of writing, there are
// 11 scopes and 5 roles. These might increase in the future with additional
// modules being added.
describe('Initialization Logic @init-logic', () => {
  describe('First init', () => {
    before(async () => {
      await beforeEachContext()
    })

    it('should have a lotta scopes', async () => {
      const res = await knex('scopes').select()
      expect(res.length).to.be.greaterThan(10)
    })

    it('should have some roles', async () => {
      const res = await knex('user_roles').select()
      expect(res.length).to.be.greaterThan(4)
    })

    it('should have some apps', async () => {
      const res = await knex('server_apps').select()
      expect(res.length).to.be.greaterThan(2)
    })
  })

  describe('Second init', () => {
    before(async () => {
      await init()
    })

    it('should have a lotta scopes second time round too!', async () => {
      const res = await knex('scopes').select()
      expect(res.length).to.be.greaterThan(10)
    })

    it('should have some roles second time round!', async () => {
      const res = await knex('user_roles').select()
      expect(res.length).to.be.greaterThan(4)
    })

    it('should have some apps second time round', async () => {
      const res = await knex('server_apps').select()
      expect(res.length).to.be.greaterThan(2)
    })
  })
})
