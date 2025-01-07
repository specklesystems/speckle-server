// used in patches/knex.ts
declare module 'knex/lib/dialects/postgres/query/pg-querybuilder' {
  const qb: {
    prototype: {
      select: import('knex').Knex.QueryBuilder['select']
      _timeout: number
    }
  }
  export default qb
}
