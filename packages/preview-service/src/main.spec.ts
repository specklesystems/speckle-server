import { expect, describe, it, beforeAll, afterAll } from 'vitest'
import { startServer } from './main'
import { Server } from 'http'

describe('Main preview-service', () => {
  let server: Server

  beforeAll(async () => {
    // await db.connect()

    server = startServer(0)
  })

  afterAll(async () => {
    server.close()
  })

  it('inits a server', () => {
    expect(server).to.be.instanceOf(Server)
  })

  it('should do something', () => {
    expect(true).to.eq(true)
  })
})
