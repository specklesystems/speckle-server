import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { moduleLogger } from '@/logging/logging'
import { corsMiddleware } from '@/modules/core/configs/cors'
import {
  getGendoAIResponseKey,
  getFeatureFlags
} from '@/modules/shared/helpers/envHelper'
import { updateGendoAIRenderRequest } from '@/modules/gendo/services'

const { FF_GENDOAI_MODULE_ENABLED } = getFeatureFlags()

export = {
  async init(app) {
    if (!FF_GENDOAI_MODULE_ENABLED) return
    moduleLogger.info('🪞 Init Gendo AI render module')

    const responseToken = getGendoAIResponseKey()
    // Gendo api calls back in here with the result.
    app.options('/api/thirdparty/gendo', corsMiddleware())
    app.post('/api/thirdparty/gendo', corsMiddleware(), async (req, res) => {
      if (req.headers['x-gendo-authorization'] !== responseToken) {
        return res.status(401).send('Speckle says you are not authorized 😠')
      }

      const responseImage = req.body.generated_image
      const status = req.body.status
      const gendoGenerationId = req.body.generationId

      await updateGendoAIRenderRequest({
        gendoGenerationId,
        status,
        responseImage
      })

      res.status(200).send('Speckle says thank you 💖')
    })
  },
  async shutdown() {}
} as SpeckleModule
