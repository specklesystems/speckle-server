// example tests to confirm the servers are running and the API is working

import { getServerPort } from '#tests/helpers/helpers.js'
import { e2eTest } from '#tests/helpers/testExtensions.js'
import { describe } from 'vitest'

describe.concurrent('E2E', () => {
  describe.concurrent('Example', () => {
    e2eTest('should start a server on an unique port', async ({ context }) => {
      const port = getServerPort(context.server)
      console.log(`port1 : ${port}`)
      await Promise.resolve()
    })
    e2eTest('should start a server on a different port', async ({ context }) => {
      const port = getServerPort(context.server)
      console.log(`port2 : ${port}`)
      await Promise.resolve()
    })
  })
})
