import { AutomateFunctionRecord } from '@/modules/automate/helpers/types'
import { AutomateFunctions } from '@/modules/core/dbSchema'
import { Nullable, NullableKeysToOptional } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { pick } from 'lodash'
import { SetOptional } from 'type-fest'

export type InsertableAutomateFunctionRecord = SetOptional<
  NullableKeysToOptional<AutomateFunctionRecord>,
  'createdAt' | 'updatedAt' | 'isFeatured'
>

export const generateFunctionId = () => cryptoRandomString({ length: 10 })

export const upsertFunction = async (fn: InsertableAutomateFunctionRecord) => {
  const [res] = (await AutomateFunctions.knex()
    .insert(fn)
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

export const updateFunction = async (
  fnId: string,
  fn: Partial<AutomateFunctionRecord>
) => {
  const [ret] = await AutomateFunctions.knex()
    .where(AutomateFunctions.col.functionId, fnId)
    .update(pick(fn, AutomateFunctions.withoutTablePrefix.cols))
    .returning<AutomateFunctionRecord[]>('*')

  return ret
}

export const getFunctions = async (fnIds: string[]) => {
  if (!fnIds.length) return []

  return await AutomateFunctions.knex<AutomateFunctionRecord[]>().whereIn(
    AutomateFunctions.col.functionId,
    fnIds
  )
}

export const getFunction = async (
  fnId: string
): Promise<Nullable<AutomateFunctionRecord>> => {
  return (await getFunctions([fnId]))?.[0] || null
}
