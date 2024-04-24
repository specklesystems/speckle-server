import { AutomateFunctionRecord } from '@/modules/automate/helpers/types'
import { AutomateFunctions } from '@/modules/core/dbSchema'
import { NullableKeysToOptional } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { SetOptional } from 'type-fest'

type InsertableAutomateFunctionRecord = SetOptional<
  NullableKeysToOptional<AutomateFunctionRecord>,
  'createdAt' | 'updatedAt' | 'isFeatured'
>

export const upsertFunction = async (
  fn: SetOptional<InsertableAutomateFunctionRecord, 'functionId'>
) => {
  const finalFn: InsertableAutomateFunctionRecord = {
    ...fn,
    functionId: fn.functionId || cryptoRandomString({ length: 10 })
  }

  const [res] = (await AutomateFunctions.knex()
    .insert(finalFn)
    .onConflict(AutomateFunctions.withoutTablePrefix.col.functionId)
    .merge([
      AutomateFunctions.withoutTablePrefix.col.name,
      AutomateFunctions.withoutTablePrefix.col.description,
      AutomateFunctions.withoutTablePrefix.col.logo,
      AutomateFunctions.withoutTablePrefix.col.supportedSourceApps,
      AutomateFunctions.withoutTablePrefix.col.tags,
      AutomateFunctions.withoutTablePrefix.col.isFeatured
    ])
    .returning('*')) as AutomateFunctionRecord[]

  return res
}
