import crs from 'crypto-random-string'
import { GendoAIRenders } from '@/modules/core/dbSchema'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import {
  ProjectSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { Merge } from 'type-fest'
import { storeFileStream } from '@/modules/blobstorage/objectStorage'

import {
  CreateRenderRequest,
  GetRenderByGenerationId,
  StoreRender,
  UpdateRenderRecord,
  UpdateRenderRequest
} from '@/modules/gendo/domain/operations'
import { UploadFileStream } from '@/modules/blobstorage/domain/operations'
import {
  getGendoAIAPIEndpoint,
  getGendoAIKey,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import {
  GendoRenderRequestError,
  GendoRenderRequestNotFoundError
} from '@/modules/gendo/errors/main'

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

export const updateRenderRequestFactory =
  (deps: {
    getRenderByGenerationId: GetRenderByGenerationId
    uploadFileStream: UploadFileStream
    storeFileStream: typeof storeFileStream
    updateRenderRecord: UpdateRenderRecord
    publish: PublishSubscription
  }): UpdateRenderRequest =>
  async (input) => {
    const gendoGenerationId = input.gendoGenerationId
    const baseRequest = await deps.getRenderByGenerationId({ gendoGenerationId })
    if (!baseRequest) {
      throw new GendoRenderRequestNotFoundError(
        'Request #{gendoGenerationId} not found',
        {
          info: {
            gendoGenerationId
          }
        }
      )
    }

    if (input.responseImage) {
      const responseImageBuffer = Buffer.from(
        input.responseImage.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )

      const blobId = crs({ length: 10 })
      await deps.uploadFileStream(
        deps.storeFileStream,
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

    const record = await deps.updateRenderRecord({
      input: { ...input, updatedAt: new Date() },
      id: baseRequest.id
    })
    deps.publish(ProjectSubscriptions.ProjectVersionGendoAIRenderUpdated, {
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
