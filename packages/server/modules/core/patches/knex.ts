/* eslint-disable @typescript-eslint/no-explicit-any */
import knexQueryCompiler from 'knex/lib/query/querycompiler'

/**
 * ⚠️ HERE BE DARKNESS! ⚠️
 * We're monkey patching knex which is pretty cursed, but i'm not aware of any other way
 * to get a proper stack trace in query event handlers
 */

export const patchKnex = () => {
  // Preserve stack trace on query compilation
  const originalToSQL = knexQueryCompiler.prototype.toSQL
  const newToSQL: typeof originalToSQL = function (
    this: typeof knexQueryCompiler.prototype,
    ...args: any
  ) {
    const ret = originalToSQL.apply(this, args)
    ret.__stackTrace = (new Error().stack || '').split('\n').slice(1).join('\n').trim()
    return ret
  }

  knexQueryCompiler.prototype.toSQL = newToSQL
}
