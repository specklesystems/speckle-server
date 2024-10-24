import crs from 'crypto-random-string'
import { GendoAIRenders, knex } from '@/modules/core/dbSchema'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import {
  ProjectSubscriptions,
  publish,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { Merge } from 'type-fest'
import { storeFileStream } from '@/modules/blobstorage/objectStorage'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { db } from '@/db/knex'
import { CreateRenderRequest, StoreRender } from '@/modules/gendo/domain/operations'
import { UploadFileStream } from '@/modules/blobstorage/domain/operations'
import {
  getGendoAIAPIEndpoint,
  getGendoAIKey,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import { GendoRenderRequestError } from '@/modules/gendo/errors/main'

const uploadFileStream = uploadFileStreamFactory({
  upsertBlob: upsertBlobFactory({ db }),
  updateBlob: updateBlobFactory({ db })
})

export const createRenderRequestFactory =
  (deps: {
    uploadFileStream: UploadFileStream
    storeFileStream: typeof storeFileStream
    storeRender: StoreRender
    publish: PublishSubscription
    fetch: typeof fetch
  }): CreateRenderRequest =>
  async (input) => {
    const endpoint = getGendoAIAPIEndpoint()
    const bearer = getGendoAIKey() as string
    const webhookUrl = `${getServerOrigin()}/api/thirdparty/gendo`

    // TODO: Fn handles too many concerns, refactor (e.g. the client fetch call)
    // TODO: Fire off request to gendo api & get generationId, create record in db. Note: use gendo api key from env
    const gendoRequestBody = {
      userId: input.userId,
      depthMap: input.baseImage,
      prompt: input.prompt,
      webhookUrl
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`
      },
      body: JSON.stringify(gendoRequestBody)
    })

    const status = response.status
    if (status !== 200) {
      const body = await response.json().catch((e) => ({ error: `${e}` }))
      throw new GendoRenderRequestError('Failed to enqueue gendo render.', {
        info: { body }
      })
    }

    const gendoResponseBody = (await response.json()) as {
      status: string
      generationId: string
    }
    const baseImageBuffer = Buffer.from(
      input.baseImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    )

    const blobId = crs({ length: 10 })
    await deps.uploadFileStream(
      deps.storeFileStream,
      { streamId: input.projectId, userId: input.userId },
      {
        blobId,
        fileName: `gendo_base_image_${blobId}.png`,
        fileType: 'png',
        fileStream: baseImageBuffer
      }
    )

    input.baseImage = blobId

    const newRecord = await deps.storeRender({
      ...input,
      status: gendoResponseBody.status,
      gendoGenerationId: gendoResponseBody.generationId,
      id: crs({ length: 10 })
    })

    deps.publish(ProjectSubscriptions.ProjectVersionGendoAIRenderCreated, {
      projectVersionGendoAIRenderCreated: newRecord
    })

    // TODO: Schedule a timeout fail after x minutes

    return newRecord
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
        fileStream: responseImageBuffer
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
