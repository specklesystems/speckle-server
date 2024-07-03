// example tests to confirm the servers are running and the API is working

import { getServerPort } from '#/helpers/helpers.js'
import { e2eTest } from '#/helpers/testExtensions.js'
import { describe } from 'vitest'

describe('E2E', () => {
  describe('Example', () => {
    e2eTest('should return a 200 status code', async ({ context }) => {
      const port = getServerPort(context.server)
      console.log(`port1 : ${port}`)
      await Promise.resolve()
    })
    e2eTest('should return a different status code', async ({ context }) => {
      const port = getServerPort(context.server)
      console.log(`port2 : ${port}`)
      await Promise.resolve()
    })
  })
})
