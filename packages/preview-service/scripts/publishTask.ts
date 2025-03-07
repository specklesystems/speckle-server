import Bull from 'bull'
import { REDIS_URL } from '../src/config.js'

const jobQueue = new Bull('preview-service-jobs', REDIS_URL)

await jobQueue.add({
  url: 'https://latest.speckle.systems/projects/8b94a55ee5/models/7f98c5b62e',
  token: '',
  jobId: '1',
  responseQueue: 'preview-service-results'
})

console.log('published')

process.exit()
