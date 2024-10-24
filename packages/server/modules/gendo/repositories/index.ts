import { GendoAIRenders } from '@/modules/core/dbSchema'
import { StoreRender } from '@/modules/gendo/domain/operations'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import { Knex } from 'knex'
import { pick } from 'lodash'

const tables = {
  gendoAIRenders: (db: Knex) => db<GendoAIRenderRecord>(GendoAIRenders.name)
}

export const storeRenderFactory =
  (deps: { db: Knex }): StoreRender =>
  async (input) => {
    const [newRec] = await tables
      .gendoAIRenders(deps.db)
      .insert(pick(input, GendoAIRenders.withoutTablePrefix.cols))
      .returning('*')
    return newRec
  }
