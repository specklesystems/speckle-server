import { GendoAIRenders, knex } from '@/modules/core/dbSchema'
import { GendoAiRenderInput } from '@/modules/core/graph/generated/graphql'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import {
  ProjectSubscriptions,
  publish,
  pubsub
} from '@/modules/shared/utils/subscriptions'

export async function createGendoAIRenderRequest(
  input: GendoAiRenderInput & {
    userId: string
    status: string
    id: string
    gendoGenerationId?: string
  }
) {
  const [newRecord] = await GendoAIRenders.knex().insert(input, '*')
  // TODO Notify? Publish? PubSub? All of'em?

  publish(ProjectSubscriptions.ProjectVersionGendoAIRenderCreated, {
    projectVersionGendoAIRenderCreated: newRecord
  })

  return newRecord as GendoAIRenderRecord
}

export async function updateGendoAIRenderRequest(
  input: Partial<{ status: string; responseImage: string }> & {
    gendoGenerationId: string
  }
) {
  const [record] = (await GendoAIRenders.knex()
    .where('gendoGenerationId', input.gendoGenerationId)
    .update({ ...input, updatedAt: knex.fn.now() }, '*')) as GendoAIRenderRecord[]

  publish(ProjectSubscriptions.ProjectVersionGendoAIRenderUpdated, {
    projectVersionGendoAIRenderUpdated: record
  })

  return record
}

export async function getGendoAIRenderRequests(versionId: string) {
  return await GendoAIRenders.knex()
    .select<GendoAIRenderRecord[]>()
    .where('versionId', versionId)
    .orderBy('createdAt', 'desc')
}

export async function getGendoAIRenderRequest(versionId: string, requestId: string) {
  const [record] = await GendoAIRenders.knex()
    .select<GendoAIRenderRecord[]>()
    .where('id', requestId)
    .andWhere('versionId', versionId)
    .orderBy('createdAt', 'desc')
  return record
}
