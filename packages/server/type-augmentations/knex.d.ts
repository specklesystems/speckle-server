// used in patches/knex.ts
declare module 'knex/lib/query/querycompiler' {
  declare class QueryCompiler {
    toSQL(
      method: string,
      tz: string
    ): {
      method: string
      options: Record<string, unknown>
      timeout: number | false
      cancelOnTimeout: boolean
      bindings: unknown[]
      __knexQueryUid: string
      /**
       * This one's patched in by us for telemetry purposes
       */
      __stackTrace: string
    }
  }

  export default QueryCompiler
}
