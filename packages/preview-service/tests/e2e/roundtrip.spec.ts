// example tests to confirm the servers are running and the API is working

import { getServerPort } from '#/helpers/helpers.js'
import { e2eTest } from '#/helpers/testExtensions.js'
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
  describe.concurrent('adding a job in the database', () => {
    e2eTest('should create a preview', async ({ context }) => {
      const port = getServerPort(context.server)
      console.log(`port3 : ${port}`)

      //TODO add an object in the object store
      //TODO add a job in the database
      //wait for the job in the database to be updated
      //wait for the job in the database to be completed
      //ensure the preview is created
      //ensure the preview has all the required angles
      await Promise.resolve()
    })
  })
})
