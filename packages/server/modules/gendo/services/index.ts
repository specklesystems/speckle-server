import crs from 'crypto-random-string'
import { GendoAIRenders, knex } from '@/modules/core/dbSchema'
import { GendoAiRenderInput } from '@/modules/core/graph/generated/graphql'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { Merge } from 'type-fest'
import { storeFileStream } from '@/modules/blobstorage/objectStorage'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { db } from '@/db/knex'
import { Readable } from 'stream'

const uploadFileStream = uploadFileStreamFactory({
  upsertBlob: upsertBlobFactory({ db }),
  updateBlob: updateBlobFactory({ db })
})

export async function createGendoAIRenderRequest(
  input: GendoAiRenderInput & {
    userId: string
    status: string
    id: string
    gendoGenerationId?: string
  }
) {
  const baseImageBuffer = Buffer.from(
    input.baseImage.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  )

  const blobId = crs({ length: 10 })
  await uploadFileStream(
    storeFileStream,
    { streamId: input.projectId, userId: input.userId },
    {
      blobId,
      fileName: `gendo_base_image_${blobId}.png`,
      fileType: 'png',
      fileStream: Readable.from(baseImageBuffer)
    }
  )

  input.baseImage = blobId

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
  if (input.responseImage) {
    const [baseRequest] = await GendoAIRenders.knex()
      .select<GendoAIRenderRecord[]>()
      .where('gendoGenerationId', input.gendoGenerationId)
    const responseImageBuffer = Buffer.from(
      input.responseImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    )

    const blobId = crs({ length: 10 })
    await uploadFileStream(
      storeFileStream,
      { streamId: baseRequest.projectId, userId: baseRequest.userId },
      {
        blobId,
        fileName: `gendo_speckle_render_${blobId}.png`,
        fileType: 'png',
        fileStream: Readable.from(responseImageBuffer)
      }
    )

    input.responseImage = blobId
  }

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
