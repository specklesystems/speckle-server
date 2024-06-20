/* istanbul ignore file */
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import request from 'supertest'

describe('Health Routes @api-rest', () => {
  let app: Express.Application
  before(async () => {
    ;({ app } = await beforeEachContext())
  })

  it('Should response to liveness endpoint', async () => {
    const res = await request(app).get('/liveness')
    expect(res).to.have.status(200)
  })

  it('Should response to readiness endpoint', async () => {
    const res = await request(app).get('/readiness')
    expect(res).to.have.status(200)
  })
})
