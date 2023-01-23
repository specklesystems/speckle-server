import { Optional } from '@speckle/shared'
import { logger, moduleLogger } from '@/logging/logging'
import { knex } from '@/modules/core/dbSchema'
import * as Knex from 'knex'
import * as pg from 'pg'
import { getObjectCommitsWithStreamIds } from '@/modules/core/repositories/commits'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'

type MessageType = { channel: string; payload: string }
const payloadRegexp = /^([\w\d]+):([\w\d]+):([\w\d]+)$/i

let shuttingDown = false
let connection: Optional<pg.Connection> = undefined

async function messageProcessor(msg: MessageType) {
  if (msg.channel !== 'preview_generation_update') return
  const [, status, streamId, objectId] = payloadRegexp.exec(msg.payload) || [
    null,
    null,
    null,
    null
  ]

  if (status !== 'finished' || !objectId || !streamId) return

  // Get all commits with that objectId
  const commits = await getObjectCommitsWithStreamIds([objectId])
  if (!commits.length) return

  await Promise.all(
    commits.map((c) =>
      publish(ProjectSubscriptions.ProjectVersionsPreviewGenerated, {
        projectVersionsPreviewGenerated: {
          versionId: c.id,
          projectId: c.streamId,
          objectId
        }
      })
    )
  )
}

function setupConnection(connection: pg.Connection) {
  connection.query('LISTEN preview_generation_update')
  connection.on('notification', messageProcessor)

  connection.on('end', () => {
    if (!shuttingDown) reconnectClient()
  })
  connection.on('error', (err: unknown) => {
    logger.error(err, 'Preview listener connection error')
  })
}

function reconnectClient() {
  const interval = setInterval(async () => {
    try {
      const newConnection = await (
        knex.client as Knex.Knex.Client
      ).acquireRawConnection()
      connection = newConnection

      clearInterval(interval)
      setupConnection(newConnection)
    } catch (e: unknown) {
      logger.error(e, 'Preview listener connection acquisition failed')
    }
  }, 3000)
}

export function setupResultListener() {
  moduleLogger.info('Initializing preview generation result listening...')
  reconnectClient()
}

export function shutdownResultListener() {
  moduleLogger.info('...Shutting down preview generation result listening')
  shuttingDown = true
  if (connection) {
    connection.end()
    connection = undefined
  }
}
