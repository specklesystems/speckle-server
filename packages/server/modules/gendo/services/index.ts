import crs from 'crypto-random-string'
import {
  ProjectSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'

import {
  CreateRenderRequest,
  GetRenderByGenerationId,
  RequestNewImageGeneration,
  StoreRender,
  UpdateRenderRecord,
  UpdateRenderRequest
} from '@/modules/gendo/domain/operations'
import { UploadFileStream } from '@/modules/blobstorage/domain/operations'
import { GendoRenderRequestNotFoundError } from '@/modules/gendo/errors/main'

export const createRenderRequestFactory =
  (deps: {
    requestNewImageGeneration: RequestNewImageGeneration
    uploadFileStream: UploadFileStream
    storeRender: StoreRender
    publish: PublishSubscription
  }): CreateRenderRequest =>
  async (input) => {
    const imageRequest = await deps.requestNewImageGeneration({
      userId: input.userId,
      baseImage: input.baseImage,
      prompt: input.prompt,
      projectId: input.projectId
    })
    // ----
    const baseImageBuffer = Buffer.from(
      input.baseImage.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    )

    const blobId = crs({ length: 10 })
    await deps.uploadFileStream(
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
      status: imageRequest.status,
      gendoGenerationId: imageRequest.generationId,
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
