import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import express from 'express'
import { buildServer } from 'src/server'
import { Server } from 'http'
import { initializeQueue } from '@speckle/shared/queue'
import { REDIS_URL } from '@/config.js'
import Bull from 'bull'
import { JobPayload } from '@speckle/shared/workers/previews'
import { randomUUID } from 'crypto'
import supertest, { SuperTest, Test } from 'supertest'
import { TIME_MS } from '@speckle/shared'
import fs from 'fs'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import path from 'path'

const BASE_IMAGE = path.resolve(__dirname, 'snapshots/base.png')
const TEST_RESULT = path.resolve(__dirname, 'snapshots/result.png')
const DIFF = path.resolve(__dirname, 'snapshots/diff.png')

describe('preview-service', () => {
  let server: Server
  let request: SuperTest<Test>
  let jobQueue: Bull.Queue<JobPayload>
  let responseQueue: Bull.Queue<{
    jobId: string
    status: string
    result: {
      screenshots: object
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
    app.use(express.static('public'))
    request = supertest(app)
    server = buildServer({ app })

    jobQueue = await initializeQueue({
      queueName: JOB_QUEUE,
      redisUrl: REDIS_URL
    })

    responseQueue = await initializeQueue({
      queueName: RESPONSE_QUEUE,
      redisUrl: REDIS_URL
    })

    // delete existing images
    fs.rmSync(TEST_RESULT, { recursive: false, force: true })
    fs.rmSync(DIFF, { recursive: false, force: true })

    // TODO: remove this head start
    // only awaiting for the server to start does not work
    // we should await the start of the job processing
    await sleep(6 * TIME_MS.second)
  })

  afterAll(async () => {
    server.close()
    await jobQueue.close()
    await responseQueue.close()
  })

  it('inits a server', async () => {
    expect(server).to.be.instanceOf(Server)
  })

  it('hits the server', async () => {
    const response = await request.get('/')

    expect(response.status).to.equal(200)
  })

  it('process a rendering task providing back the image', async () => {
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

      await sleep(1 * TIME_MS.second)
    }

    expect(jobs).to.have.lengthOf(1)
    const [job] = jobs
    expect(job.data.jobId).to.equal(ID)
    expect(job.data.status).to.equal('success')
    expect(job.data.result).to.be.an('object')
    expect(job.data.result.screenshots).toBeDefined()

    // write the image to a result file, for debugging

    const image =
      '0' in job.data.result.screenshots
        ? (job.data.result.screenshots['0'] as string)
        : null

    if (!image) expect.fail('No image found')

    const clean = Buffer.from(image.replace(/^data:image\/png;base64,/, ''), 'base64')

    fs.writeFileSync(TEST_RESULT, clean)

    // test max diff

    const base = PNG.sync.read(fs.readFileSync(BASE_IMAGE))
    const result = PNG.sync.read(fs.readFileSync(TEST_RESULT))
    const diff = new PNG({ width: base.width, height: base.height })
    const totalPixels = base.width * base.height

    const diffPixels = pixelmatch(
      base.data,
      result.data,
      diff.data,
      base.width,
      base.height,
      { threshold: 0.1 }
    )

    fs.writeFileSync(DIFF, PNG.sync.write(diff))
    const diffPercentage = Number(((diffPixels / totalPixels) * 100).toFixed(2))
    expect(diffPercentage).to.be.lessThan(10)
  })
})
