/* istanbul ignore file */
const chai = require('chai')
const chaiHttp = require('chai-http')

const appRoot = require('app-root-path')
const { init, startHttp } = require(`${appRoot}/app`)

const expect = chai.expect
chai.use(chaiHttp)

const knex = require(`${appRoot}/db/knex`)

const { createUser } = require(`${appRoot}/modules/core/services/users`)
const {
  createPersonalAccessToken,
} = require(`${appRoot}/modules/core/services/tokens`)

const {
  sendEmailVerification,
} = require(`${appRoot}/modules/emails/services/verification`)

const Verifications = () => knex('email_verifications')

describe('Email verifications @emails', () => {
  const userA = {
    'name': 'd1',
    'email': 'd.1@speckle.systems',
    'password': 'wowwowwowwowwow',
  }
  const userB = {
    'name': 'd2',
    'email': 'd.2@speckle.systems',
    'password': 'wowwowwowwowwow',
  }

  before(async () => {
    await knex.migrate.rollback()
    await knex.migrate.latest()

    await init()

    userA.id = await createUser(userA)
    userA.token = `Bearer ${(await createPersonalAccessToken(userA.id, 'test token user A', ['server:setup', 'streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email']))}`
    userB.id = await createUser(userB)
    userB.token = `Bearer ${(await createPersonalAccessToken(userB.id, 'test token user B', ['streams:read', 'streams:write', 'users:read', 'users:email', 'tokens:write', 'tokens:read', 'profile:read', 'profile:email']))}`
  })

  after(async () => {
    await knex.migrate.rollback()
  })

  describe('Create email verification', () => {
    it('Should create a new verification', async () => {
      const sentResult = await sendEmailVerification(
        { 'recipient': userA.email },
      )
      const verifications = await Verifications().where({ email: userA.email })
      expect(verifications).to.have.lengthOf(1)

      const ver = verifications[0]
      const expectedVerificationUrl = `${process.env.CANONICAL_URL}/verifyemail?t=${ver.id}`
      
      expect(sentResult.message).to.contain(expectedVerificationUrl)
    })
  })
})
