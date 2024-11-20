import { corsMiddleware } from '@/modules/core/configs/cors'
import { updateRenderRequestFactory } from '@/modules/gendo/services'
import type express from 'express'
import {
  getRenderByGenerationIdFactory,
  updateRenderRecordFactory
} from '@/modules/gendo/repositories'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import { storeFileStream } from '@/modules/blobstorage/objectStorage'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

export default function (app: express.Express) {
  // const responseToken = getGendoAIResponseKey()

  // Gendo api calls hit these endpoints w/ the results
  app.options('/api/thirdparty/gendo/:projectId', corsMiddleware())
  app.post('/api/thirdparty/gendo/:projectId', corsMiddleware(), async (req, res) => {
    // if (req.headers['x-gendo-authorization'] !== responseToken) {
    //   return res.status(401).send('Speckle says you are not authorized 😠')
    // }

    const responseImage = req.body.imageBase64
    // const status = req.body.status
    const gendoGenerationId = req.body.generationId

    const projectDb = await getProjectDbClient({ projectId: req.params.projectId })

    const updateRenderRequest = updateRenderRequestFactory({
      getRenderByGenerationId: getRenderByGenerationIdFactory({ db: projectDb }),
      uploadFileStream: uploadFileStreamFactory({
        storeFileStream,
        upsertBlob: upsertBlobFactory({ db: projectDb }),
        updateBlob: updateBlobFactory({ db: projectDb })
      }),
      updateRenderRecord: updateRenderRecordFactory({ db: projectDb }),
      publish
    })

    await updateRenderRequest({
      gendoGenerationId,
      responseImage
    })

    res.status(200).send('Speckle says thank you 💖')
  })
}
