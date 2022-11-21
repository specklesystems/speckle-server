require('../bootstrap')
const { getUserByEmail } = require('@/modules/core/services/users')
const { createPersonalAccessToken } = require('@/modules/core/services/tokens')
const { createStream } = require('@/modules/core/services/streams')

const { createManyObjects } = require('@/test/helpers')
const { fetch } = require('undici')
const { init } = require(`@/app`)
const request = require('supertest')
const { exit } = require('yargs')
const { Logger } = require('@/logging/logging')

const main = async () => {
  const testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream'
  }

  // const userA = {
  //   name: 'd1',
  //   email: 'd.1@speckle.systems',
  //   password: 'wowwow8charsplease'
  // }
  // userA.id = await createUser(userA)

  const userA = await getUserByEmail({
    email: 'd.1@speckle.systems'
  })
  userA.token = `Bearer ${await createPersonalAccessToken(
    userA.id,
    'test token user A',
    [
      'streams:read',
      'streams:write',
      'users:read',
      'users:email',
      'tokens:write',
      'tokens:read',
      'profile:read',
      'profile:email'
    ]
  )}`

  testStream.id = await createStream({ ...testStream, ownerId: userA.id })

  const { app } = await init()

  const numObjs = 5000
  const objBatch = createManyObjects(numObjs)

  const uploadRes = await request(app)
    .post(`/objects/${testStream.id}`)
    .set('Authorization', userA.token)
    .set('Content-type', 'multipart/form-data')
    .attach('batch1', Buffer.from(JSON.stringify(objBatch), 'utf8'))

  Logger.info(uploadRes.status)
  const objectIds = objBatch.map((obj) => obj.id)

  const res = await fetch(`http://localhost:3000/api/getobjects/${testStream.id}`, {
    method: 'POST',
    headers: {
      Authorization: userA.token,
      'Content-Type': 'application/json',
      Accept: 'text/plain'
    },
    body: JSON.stringify({ objects: JSON.stringify(objectIds) })
  })
  const data = await res.body.getReader().read()
  Logger.info(data)
  exit(0)
}

main().then(Logger.info('created')).catch(Logger.error('failed'))
