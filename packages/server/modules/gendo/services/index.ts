import { GendoAIRenders, knex } from '@/modules/core/dbSchema'
import { GendoAiRenderInput } from '@/modules/core/graph/generated/graphql'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'

export async function createGendoAIRenderRequest(
  input: GendoAiRenderInput & { userId: string; status: string }
) {
  const [newRecord] = await GendoAIRenders.knex().insert(input, '*')
  return newRecord as GendoAIRenderRecord
  // TODO Notify
}

export async function updateGendoAIRenderRequest(
  input: Partial<{ status: string; responseImage: string }> & {
    gendoGenerationId: string
  }
) {
  await GendoAIRenders.knex()
    .where('gendoGenerationId', input.gendoGenerationId)
    .update<GendoAIRenderRecord>({ ...input, updatedAt: knex.fn.now() })
  // TODO Notify
}

export async function getGendoAIRenderRequests(versionId: string) {
  return await GendoAIRenders.knex()
    .select<GendoAIRenderRecord>()
    .where('versionId', versionId)
    .orderBy('createdAt', 'desc')
}
