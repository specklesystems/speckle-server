import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import { updateRenderRequestFactory } from '@/modules/gendo/services'
import type express from 'express'
import {
  getRenderByGenerationIdFactory,
  updateRenderRecordFactory
} from '@/modules/gendo/repositories'
import { uploadFileStreamFactory } from '@/modules/blobstorage/services/management'
import {
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { publish } from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getGendoAIKey } from '@/modules/shared/helpers/envHelper'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { storeFileStreamFactory } from '@/modules/blobstorage/repositories/blobs'

export default function (app: express.Express) {
  // const responseToken = getGendoAIResponseKey()

  // Gendo api calls hit these endpoints w/ the results
  app.options('/api/thirdparty/gendo/:projectId', corsMiddlewareFactory())
  app.post(
    '/api/thirdparty/gendo/:projectId',
    corsMiddlewareFactory(),
    async (req, res) => {
      const sig = Buffer.from(req.get('x-signature-sha256') || '', 'utf8')

      //     //Calculate HMAC
      const hmac = createHmac('sha256', getGendoAIKey())
      const digest = Buffer.from(hmac.update(req.body).digest('base64'), 'utf-8')

      //     //Compare HMACs
      if (sig.length !== digest.length || !timingSafeEqual(digest, sig)) {
        return res
          .status(401)
          .send('Speckle says your webhook signature is not valid 😠')
      }
      const payload = JSON.parse(req.body)
      const responseImage = payload.imageBase64
      const status = payload.status
      const gendoGenerationId = payload.generationId

      const projectId = req.params.projectId
      const [projectDb, projectStorage] = await Promise.all([
        getProjectDbClient({ projectId }),
        getProjectObjectStorage({ projectId })
      ])

      const storeFileStream = storeFileStreamFactory({ storage: projectStorage })
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
    }
  )
}
