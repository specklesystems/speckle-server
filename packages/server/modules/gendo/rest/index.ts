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
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getGendoAIKey } from '@/modules/shared/helpers/envHelper'
//Validate payload
// function validatePayload(req, res, next) {
//   if (req.get(sigHeaderName)) {
//     //Extract Signature header
//
//   }

//   return next();
// }

export default function (app: express.Express) {
  // const responseToken = getGendoAIResponseKey()

  // Gendo api calls hit these endpoints w/ the results
  app.options('/api/thirdparty/gendo/:projectId', corsMiddleware())
  app.post('/api/thirdparty/gendo/:projectId', corsMiddleware(), async (req, res) => {
    const sig = Buffer.from(req.get('x-signature-sha256') || '', 'utf8')

    //     //Calculate HMAC
    const hmac = createHmac('sha256', getGendoAIKey())
    const digest = Buffer.from(hmac.update(req.body).digest('base64'), 'utf-8')

    //     //Compare HMACs
    if (sig.length !== digest.length || !timingSafeEqual(digest, sig)) {
      return res.status(401).send('Speckle says your webhook signature is not valid 😠')
    }
    const payload = JSON.parse(req.body)
    const responseImage = payload.imageBase64
    const status = payload.status
    const gendoGenerationId = payload.generationId

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
      responseImage,
      status
    })

    res.status(200).send('Speckle says thank you 💖')
  })
}
