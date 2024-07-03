import { startServer, stopServer } from '@/server/server.js'
import http from 'http'
import type { Knex } from 'knex'

export const truncateTables = async (params: { db: Knex; tableNames?: string[] }) => {
  const { db } = params
  let { tableNames } = params

  if (!tableNames?.length) {
    //why is server config only created once!????
    // because its done in a migration, to not override existing configs
    const protectedTables = ['server_config']
    // const protectedTables = [ 'server_config', 'user_roles', 'scopes', 'server_acl' ]
    tableNames = (
      await db('pg_tables')
        .select('tablename')
        .where({ schemaname: 'public' })
        .whereRaw("tablename not like '%knex%'")
        .whereNotIn('tablename', protectedTables)
    ).map((table: { tablename: string }) => table.tablename)
  }

  if (!tableNames || !tableNames.length) return

  await db.raw(`truncate table ${tableNames.join(',')} cascade`)
}

export const buildAndStartApp = (deps: { db: Knex }) => {
  const { db } = deps
  const { app, server, metricsServer } = startServer({ db })
  return { app, server, metricsServer }
}

export const stopApp = (params: { server: http.Server }) => {
  stopServer(params)
}
