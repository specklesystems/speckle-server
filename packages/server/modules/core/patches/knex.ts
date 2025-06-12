/* eslint-disable @typescript-eslint/no-explicit-any */
import { enableImprovedKnexTelemetryStackTraces } from '@/modules/shared/helpers/envHelper'
import { collectLongTrace } from '@speckle/shared'
import knexQueryCompiler from 'knex/lib/query/querycompiler'

/**
 * ⚠️ HERE BE DARKNESS! ⚠️
 * We're monkey patching knex which is pretty cursed, but i'm not aware of any other way
 * to get a proper stack trace in query event handlers
 */

export const patchKnex = () => {
  if (enableImprovedKnexTelemetryStackTraces()) {
    // Preserve stack trace on query compilation
    const originalToSQL = knexQueryCompiler.prototype.toSQL
    const newToSQL: typeof originalToSQL = function (
      this: typeof knexQueryCompiler.prototype,
      ...args: any
    ) {
      const ret = originalToSQL.apply(this, args)
      ret.__stackTrace = collectLongTrace()
      return ret
    }

    knexQueryCompiler.prototype.toSQL = newToSQL
  }
}
