const { downloadFile } = require('../src/filesApi.js')
const { logger } = require('../observability/logging')

//https://latest.speckle.systems/api/stream/c83a5b2d1f/blob/29fe85cffb
const speckleServerUrl = 'https://latest.speckle.systems'
const fileId = '29fe85cffb'
const streamId = 'c83a5b2d1f'

downloadFile({
  speckleServerUrl,
  fileId,
  streamId,
  destination: '/var/folders/p2/fczcvzfd62x5jcfdlw6ghf640000gn/T/tmp.U8MlF9KIxH',
  token: process.env.SPECKLE_TOKEN || '',
  logger: logger.child({ streamId, fileId })
})
