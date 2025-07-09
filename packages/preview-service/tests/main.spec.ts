import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import express from 'express'
import { buildServer, initServer } from 'src/server'
import { Server } from 'http'
import { initializeQueue } from '@speckle/shared/queue'
import { REDIS_URL } from '@/config.js'
import Bull from 'bull'
import { JobPayload } from '@speckle/shared/workers/previews'
import { randomUUID } from 'crypto'

describe('preview-service', () => {
  let server: Server
  let jobQueue: Bull.Queue<JobPayload>
  let responseQueue: Bull.Queue<{
    jobId: string
    status: string
    result: {
      screenshots: string[]
    }
  }>

  const testId = randomUUID()
  const JOB_QUEUE = 'preview-service-jobs'
  const RESPONSE_QUEUE = 'preview-service-jobs-test-queue-' + testId

  const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }

  beforeAll(async () => {
    const app = express()

    server = buildServer({ port: 0, app })

    initServer(server)

    jobQueue = await initializeQueue({
      queueName: JOB_QUEUE,
      redisUrl: REDIS_URL
    })

    responseQueue = await initializeQueue({
      queueName: RESPONSE_QUEUE,
      redisUrl: REDIS_URL
    })
  })

  afterAll(async () => {
    server.close()
    await jobQueue.close()
    await responseQueue.close()
  })

  it('inits a server', async () => {
    expect(server).to.be.instanceOf(Server)
  })

  it.skip('process a rendering task providing back the image', async () => {
    const ID = 'test-job' + testId

    await jobQueue.add({
      url: 'https://latest.speckle.systems/projects/8b94a55ee5/models/7f98c5b62e',
      token: '',
      jobId: ID,
      responseQueue: RESPONSE_QUEUE
    })

    let jobs = null
    while (!jobs || !jobs.length) {
      // can run until the test suite times out
      jobs = await responseQueue.getJobs(['waiting'])

      await sleep(1 * 1000) // 1 sec pause
    }

    expect(jobs).to.have.lengthOf(1)
    const [job] = jobs
    expect(job.data.jobId).to.equal(ID)
    expect(job.data.status).to.equal('success')
    expect(job.data.result).to.be.an('object')
    expect(job.data.result.screenshots).toBeDefined()
  })
})
