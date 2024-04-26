import {
  getFunctionByExecEngineId,
  getFunctionToken,
  insertFunctionRelease
} from '@/modules/automate/repositories/functions'
import { createFunctionRelease } from '@/modules/automate/services/functionManagement'
import { getTokenFromRequest } from '@/modules/shared/middleware'
import { Application } from 'express'

export default (app: Application) => {
  app.post('/api/automate/functions/:functionId/releases', async (req, res) => {
    const create = createFunctionRelease({
      resolveFunctionParams: () => ({
        functionId: req.params.functionId,
        token: getTokenFromRequest(req)
      }),
      getFunctionByExecEngineId,
      getFunctionToken,
      insertFunctionRelease
    })

    const ret = await create({ req })
    return res.status(201).json(ret)
  })
}
