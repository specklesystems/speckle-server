/* eslint-disable @typescript-eslint/no-explicit-any */
import { getGlobalKnexSelectTimeout } from '@/modules/shared/helpers/envHelper'
import knexPgQueryBuilder from 'knex/lib/dialects/postgres/query/pg-querybuilder'

/**
 * ⚠️ HERE BE DARKNESS! ⚠️
 * We're monkey patching knex which is pretty cursed, but only because it does not support
 * obvious features that are critical for ensuring DB connections run smoothly.
 */

export const patchKnex = () => {
  const DEFAULT_QUERY_TIMEOUT_MS = getGlobalKnexSelectTimeout()

  // Add .timeout() to all .select() calls
  if (DEFAULT_QUERY_TIMEOUT_MS) {
    const originalSelect = knexPgQueryBuilder.prototype.select
    const newSelect: typeof originalSelect = function (
      this: typeof knexPgQueryBuilder.prototype,
      ...args: any
    ) {
      let ret = originalSelect.apply(this, args)
      if (!this._timeout) {
        ret = ret.timeout(DEFAULT_QUERY_TIMEOUT_MS, { cancel: true })
      }

      return ret
    }

    // .columns and .select are the same function, they're just aliases
    knexPgQueryBuilder.prototype.select = newSelect
    knexPgQueryBuilder.prototype.columns = newSelect
  }
}
