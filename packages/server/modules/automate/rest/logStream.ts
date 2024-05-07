import { wait } from '@speckle/shared'
import { Application } from 'express'

export default (app: Application) => {
  app.get(
    '/api/automate/automations/:automationId/runs/:runId/logs',
    async (_req, res) => {
      // TODO: Gergo implement this plz

      // As a test stream out a string every second for 10 seconds
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      // res.setHeader('Transfer-Encoding', 'chunked')
      // res.setHeader('Cache-Control', 'no-cache')
      // res.setHeader('Connection', 'keep-alive')
      // res.flushHeaders()

      for (let i = 0; i < 10; i++) {
        res.write(`Log line ${i}\n - Some fake text here haaaaa\n`)
        await wait(1000)
      }

      res.end()
    }
  )
}
