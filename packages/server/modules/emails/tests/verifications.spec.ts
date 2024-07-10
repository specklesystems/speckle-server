import { EmailVerifications, Users } from '@/modules/core/dbSchema'
import { BasicTestUser, createTestUser, createTestUsers } from '@/test/authHelper'
import { buildApp, truncateTables } from '@/test/hooks'
import {
  buildAuthenticatedApolloServer,
  buildUnauthenticatedApolloServer
} from '@/test/serverHelper'
import { ApolloServer } from 'apollo-server-express'
import request from 'supertest'
import { expect } from 'chai'
import { deleteVerifications, getPendingToken } from '@/modules/emails/repositories'
import {
  getPendingEmailVerificationStatus,
  requestVerification
} from '@/test/graphql/users'
import { requestEmailVerification } from '@/modules/emails/services/verification/request'
import { getEmailVerificationFinalizationRoute } from '@/modules/core/helpers/routeHelper'
import { Express } from 'express'
import { getUser } from '@/modules/core/repositories/users'
import dayjs from 'dayjs'
import { EmailSendingServiceMock } from '@/test/mocks/global'
import { USER_EMAILS_TABLE_NAME } from '@/modules/user-emails/constants'

const mailerMock = EmailSendingServiceMock

const cleanup = async () => {
  await truncateTables([Users.name, EmailVerifications.name, USER_EMAILS_TABLE_NAME])
}

describe('Email verifications @emails', () => {
  const userA: BasicTestUser = {
    name: 'd1',
    email: 'd.1@speckle.systems',
    id: ''
  }
  const userB: BasicTestUser = {
    name: 'd2',
    email: 'd.2@speckle.systems',
    id: ''
  }

  before(async () => {
    await cleanup()
    await createTestUsers([userA, userB])
  })

  after(async () => {
    await cleanup()
  })

  it('sends out verification email immediatelly after new account creation', async () => {
    const sendEmailInvocations = mailerMock.hijackFunction(
      'sendEmail',
      async () => true
    )

    const newGuy: BasicTestUser = {
      name: 'happy to be here',
      email: 'happy@golucky.com',
      password: 'googoogaga',
      id: ''
    }

    await createTestUser(newGuy)

    const emailParams = sendEmailInvocations.args[0][0]
    expect(emailParams).to.be.ok
    expect(emailParams.subject).to.contain('Speckle Account E-mail Verification')

    const verification = await getPendingToken({ email: newGuy.email })
    expect(verification).to.be.ok
  })

  describe('when authenticated', () => {
    let apollo: ApolloServer

    before(async () => {
      apollo = await buildAuthenticatedApolloServer(userA.id)
    })

    it('pending verification is reported correctly', async () => {
      await deleteVerifications(userA.email)

      const preResult = await getPendingEmailVerificationStatus(apollo, {})
      expect(preResult).to.not.haveGraphQLErrors()
      expect(preResult.data?.user?.hasPendingVerification).to.be.false

      await requestEmailVerification(userA.id)

      const postResult = await getPendingEmailVerificationStatus(apollo, {})
      expect(postResult).to.not.haveGraphQLErrors()
      expect(postResult.data?.user?.hasPendingVerification).to.be.true
    })

    it("pending verificaton can't be retrieved for another user", async () => {
      const preResult = await getPendingEmailVerificationStatus(apollo, {
        id: userB.id
      })
      expect(preResult).to.haveGraphQLErrors()
      expect(preResult.data?.user?.hasPendingVerification).to.be.null
    })

    describe('and requesting verification', () => {
      const invokeRequestVerification = async (user: BasicTestUser) => {
        const apollo = await buildAuthenticatedApolloServer(user.id)
        return await requestVerification(apollo, {})
      }

      it('it succeeds', async () => {
        // delete previous requests for userA, if any
        await deleteVerifications(userA.email)

        const sendEmailInvocations = mailerMock.hijackFunction(
          'sendEmail',
          async () => false
        )

        const result = await invokeRequestVerification(userA)
        expect(result).to.not.haveGraphQLErrors()
        expect(result.data?.requestVerification).to.be.true

        const emailParams = sendEmailInvocations.args[0][0]
        expect(emailParams).to.be.ok
        expect(emailParams.subject).to.contain('Speckle Account E-mail Verification')
        expect(emailParams.html).to.be.ok
        expect(emailParams.text).to.be.ok

        const token = await getPendingToken({ email: userA.email })
        expect(token).to.be.ok
      })

      it('it fails if user is already verified', async () => {
        const verifiedUser: BasicTestUser = {
          name: 'im verified hello',
          email: 'verified@guy',
          password: 'fasdasdasdasdasd',
          verified: true,
          id: ''
        }
        await createTestUser(verifiedUser)

        const result = await invokeRequestVerification(verifiedUser)

        expect(result.data?.requestVerification).to.be.not.ok
        expect(result).to.haveGraphQLErrors('is already verified')
      })
    })
  })

  describe('when not authenticated', () => {
    let apollo: ApolloServer

    before(async () => {
      apollo = await buildUnauthenticatedApolloServer()
    })

    it('cant request an account verification', async () => {
      const result = await requestVerification(apollo)

      expect(result).to.haveGraphQLErrors('must provide an auth token')
      expect(result.data?.requestVerification).to.not.be.ok
    })

    describe('and finalizing verification', () => {
      let app: Express

      // prop values will be randomly generated in each test
      let userWithPendingRequest: BasicTestUser = {
        name: '',
        email: '',
        id: ''
      }

      let requestToken: string

      before(async () => {
        const { app: newApp } = await buildApp()
        app = newApp
      })

      beforeEach(async () => {
        // re-create for each test
        const randomNumber = Math.ceil(Math.random() * 123456)
        userWithPendingRequest = {
          name: 'pending-req-guy' + randomNumber,
          email: '',
          id: ''
        }

        await createTestUser(userWithPendingRequest)
        await requestEmailVerification(userWithPendingRequest.id)
        requestToken =
          (await getPendingToken({ email: userWithPendingRequest.email }))?.id || ''
      })

      it('it fails without a token', async () => {
        const result = await request(app).get('/auth/verifyemail')
        expect(result.statusCode).to.eq(302)

        const location = decodeURIComponent(result.headers['location'] || '')
        expect(location).to.contain('Missing verification token')
      })

      it('it fails with an invalid token', async () => {
        const url = getEmailVerificationFinalizationRoute('aaabbbccdd')

        const result = await request(app).get(url)

        expect(result.statusCode).to.eq(302)

        const location = decodeURIComponent(result.headers['location'] || '')
        expect(location).to.contain('Invalid or expired verification token')
      })

      it('it fails with an expired token', async () => {
        await EmailVerifications.knex()
          .where(EmailVerifications.withoutTablePrefix.col.id, requestToken)
          .update(
            EmailVerifications.withoutTablePrefix.col.createdAt,
            dayjs().subtract(8, 'day').toISOString()
          )

        const url = getEmailVerificationFinalizationRoute(requestToken)

        const result = await request(app).get(url)

        expect(result.statusCode).to.eq(302)

        const location = decodeURIComponent(result.headers['location'] || '')
        expect(location).to.contain('Invalid or expired verification token')
      })

      it('it succeeds with a valid token', async () => {
        const url = getEmailVerificationFinalizationRoute(requestToken)

        const result = await request(app).get(url)

        expect(result.statusCode).to.eq(302)

        const location = decodeURIComponent(result.headers['location'] || '')
        expect(location).to.contain('emailverifiedstatus=true')

        const userData = await getUser(userWithPendingRequest.id)
        expect(userData?.verified).to.be.true
      })
    })
  })
})
