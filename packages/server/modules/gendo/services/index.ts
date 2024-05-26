import { GendoAIRenders, Users, knex } from '@/modules/core/dbSchema'
import { GendoAiRenderInput } from '@/modules/core/graph/generated/graphql'
import { LimitedUserRecord } from '@/modules/core/helpers/types'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { Merge } from 'type-fest'

export async function createGendoAIRenderRequest(
  input: GendoAiRenderInput & {
    userId: string
    status: string
    id: string
    gendoGenerationId?: string
  }
) {
  const [newRecord] = await GendoAIRenders.knex().insert(input, '*')

  publish(ProjectSubscriptions.ProjectVersionGendoAIRenderCreated, {
    projectVersionGendoAIRenderCreated: newRecord
  })

  // TODO: Schedule a timeout fail after x minutes

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
    .select<
      Merge<
        GendoAIRenderRecord,
        { userName: string; userId: string; userAvatar: string }
      >[]
    >(
      ...GendoAIRenders.cols,
      'users.name as userName',
      'users.id as userId',
      'users.avatar as userAvatar'
    )
    .where('gendo_ai_renders.id', requestId)
    .andWhere('versionId', versionId)
    .join('users', 'users.id', '=', 'gendo_ai_renders.userId')
    .orderBy('createdAt', 'desc')
  return record
}
