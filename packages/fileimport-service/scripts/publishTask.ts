import { REDIS_URL } from '../src/nextGen/config.js'
import { initializeQueue } from '@speckle/shared/queue'
import { JobPayload } from '@speckle/shared/workers/fileimport'

const jobQueue = await initializeQueue<JobPayload>({
  queueName: 'fileimport-service-jobs',
  redisUrl: REDIS_URL
})

await jobQueue.add({
  serverUrl: '',
  token: '',
  jobId: '1',
  projectId: '',
  modelId: '',
  blobId: '',
  fileName: 'railing.ifc',
  fileType: 'ifc',
  timeOutSeconds: 100000000000
})

console.log('published')

process.exit()
