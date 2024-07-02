import type { Knex } from 'knex'
import { startServer, stopServer } from '@/server/server'
import http from 'http'

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

export const buildAndStartApp = async (deps: { db: Knex }) => {
  const { db } = deps
  const { app, server, metricsServer } = await startServer({ db })
  return { app, server, metricsServer }
}

export const stopApp = async (params: { server: http.Server }) => {
  await stopServer(params)
}
