import {
  AutomateFunctionRecord,
  AutomateFunctionReleaseRecord,
  AutomateFunctionTokenRecord
} from '@/modules/automate/helpers/types'
import {
  AutomateFunctionReleases,
  AutomateFunctionTokens,
  AutomateFunctions
} from '@/modules/core/dbSchema'
import { Nullable, NullableKeysToOptional } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { pick } from 'lodash'
import { SetOptional } from 'type-fest'

export type InsertableAutomateFunctionRecord = SetOptional<
  NullableKeysToOptional<AutomateFunctionRecord>,
  'createdAt' | 'updatedAt' | 'isFeatured' | 'functionId'
>

export const generateFunctionId = () => cryptoRandomString({ length: 10 })
export const generateFunctionReleaseId = generateFunctionId

export const upsertFunction = async (fn: InsertableAutomateFunctionRecord) => {
  const [res] = (await AutomateFunctions.knex()
    .insert(
      pick(
        {
          ...fn,
          functionId: fn.functionId || generateFunctionId()
        },
        AutomateFunctions.withoutTablePrefix.cols
      )
    )
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

export type InsertableFunctionTokenRecord = SetOptional<
  AutomateFunctionTokenRecord,
  'createdAt' | 'updatedAt'
>

export const upsertFunctionToken = async (token: InsertableFunctionTokenRecord) => {
  const [ret] = await AutomateFunctionTokens.knex()
    .insert(pick(token, AutomateFunctionTokens.withoutTablePrefix.cols))
    .onConflict(AutomateFunctionTokens.withoutTablePrefix.col.functionId)
    .merge([AutomateFunctionTokens.withoutTablePrefix.col.token])
    .returning<AutomateFunctionTokenRecord[]>('*')

  return ret
}

export const getFunctionByExecEngineId = async (execEngineFnId: string) => {
  return await AutomateFunctions.knex<AutomateFunctionRecord[]>()
    .where(AutomateFunctions.col.executionEngineFunctionId, execEngineFnId)
    .first()
}

export const getFunctionToken = async (params: { fnId: string; token?: string }) => {
  const { fnId, token } = params

  const q = AutomateFunctionTokens.knex<AutomateFunctionTokenRecord[]>().where(
    AutomateFunctionTokens.col.functionId,
    fnId
  )

  if (token) {
    q.andWhere(AutomateFunctionTokens.col.token, token)
  }

  return await q.first()
}

export const insertFunctionRelease = async (
  fnRelease: SetOptional<
    AutomateFunctionReleaseRecord,
    'functionReleaseId' | 'createdAt'
  >
) => {
  const [ret] = await AutomateFunctionReleases.knex()
    .insert(
      pick(
        {
          ...fnRelease,
          functionReleaseId: generateFunctionReleaseId()
        },
        AutomateFunctionReleases.withoutTablePrefix.cols
      )
    )
    .returning<AutomateFunctionReleaseRecord[]>('*')

  return ret
}
