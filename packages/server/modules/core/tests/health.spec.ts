/* istanbul ignore file */
import { ReadinessHandler } from '@/healthchecks/health'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import request from 'supertest'

describe('Health Routes @api-rest', () => {
  let app: Express.Application
  let readinessCheck: ReadinessHandler
  before(async () => {
    ;({ app, readinessCheck } = await beforeEachContext())
  })

  it('Should response to liveness endpoint', async () => {
    const res = await request(app).get('/liveness')
    expect(res).to.have.status(200)
  })

  it('Should response to readiness endpoint', async () => {
    const res = await readinessCheck()
    expect(res).to.have.property('details')
  })
})
