// used in patches/knex.ts
declare module 'knex/lib/dialects/postgres/query/pg-querybuilder' {
  const qb: {
    prototype: {
      select: import('knex').Knex.QueryBuilder['select']
      columns: import('knex').Knex.QueryBuilder['columns']
      _timeout: number
    }
  }
  export default qb
}
