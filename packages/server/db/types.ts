import type { Knex } from 'knex'

declare const mainDbSymbol: unique symbol
export type MainDb = Knex & { [mainDbSymbol]: void }
