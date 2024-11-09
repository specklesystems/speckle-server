import { corsMiddleware } from '@/modules/core/configs/cors'
import { getGendoAIResponseKey } from '@/modules/shared/helpers/envHelper'
import { updateRenderRequestFactory } from '@/modules/gendo/services'
import type express from 'express'
import {
  getRenderByGenerationIdFactory,
  updateRenderRecordFactory
} from '@/modules/gendo/repositories'
import { db } from '@/db/knex'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import { storeFileStream } from '@/modules/blobstorage/objectStorage'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'

export default function (app: express.Express) {
  const responseToken = getGendoAIResponseKey()
  const updateRenderRequest = updateRenderRequestFactory({
    getRenderByGenerationId: getRenderByGenerationIdFactory({ db }),
    uploadFileStream: uploadFileStreamFactory({
      upsertBlob: upsertBlobFactory({ db }),
      updateBlob: updateBlobFactory({ db })
    }),
    storeFileStream,
    updateRenderRecord: updateRenderRecordFactory({ db }),
    publish
  })

  // Gendo api calls hit these endpoints w/ the results
  app.options('/api/thirdparty/gendo', corsMiddleware())
  app.post('/api/thirdparty/gendo', corsMiddleware(), async (req, res) => {
    if (req.headers['x-gendo-authorization'] !== responseToken) {
      return res.status(401).send('Speckle says you are not authorized 😠')
    }

    const responseImage = req.body.generated_image
    // const status = req.body.status
    const gendoGenerationId = req.body.generationId

    await updateRenderRequest({
      gendoGenerationId,
      responseImage
    })

    res.status(200).send('Speckle says thank you 💖')
  })
}
