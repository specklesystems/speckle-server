import type { Knex } from 'knex'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'

export const retrieveMetadataFromDatabaseClient = (
  dbClient: Knex | undefined
): Record<string, unknown> => {
  const additionalInfo: Record<string, unknown> = {}
  if (!dbClient) {
    return additionalInfo
  }

  const dbClientClient = dbClient.client

  // attempt to get more info about the connection string (without exposing the password!)
  try {
    const connectionURL = new URL(dbClientClient.config?.connection?.connectionString)
    additionalInfo.databaseHost = connectionURL.hostname
    additionalInfo.databasePort = connectionURL.port
    additionalInfo.databaseUser = connectionURL.username
    additionalInfo.databaseOrConnectionPoolName = connectionURL.pathname
      .split('/')
      .pop()
  } catch {
    // ignore problems and move on
  }

  // attempt to get more info about the state of the connection pool
  try {
    const connPool = dbClientClient?.pool
    additionalInfo.databasePoolConnectionsUsed = connPool.numUsed()
    additionalInfo.databasePoolConnectionsPendingAcquires =
      connPool.numPendingAcquires()
    additionalInfo.databasePoolConnectionsPendingCreates = connPool.numPendingCreates()
    additionalInfo.databasePoolConnectionsPendingValidations =
      connPool.numPendingValidations()
    additionalInfo.databasePoolConnectionsRemainingCapacity =
      numberOfFreeConnections(dbClient)
  } catch {
    // ignore problems and move on
  }

  return additionalInfo
}
