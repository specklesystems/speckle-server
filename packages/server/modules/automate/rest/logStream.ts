import { db } from '@/db/knex'
import { getAutomationRunLogs } from '@/modules/automate/clients/executionEngine'
import { ExecutionEngineFailedResponseError } from '@/modules/automate/errors/executionEngine'
import { getAutomationRunWithTokenFactory } from '@/modules/automate/repositories/automations'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  validateRequiredStreamFactory,
  validateResourceAccess,
  validateScope,
  validateServerRoleBuilderFactory,
  validateStreamRoleBuilderFactory
} from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { Roles, Scopes } from '@speckle/shared'
import { Application } from 'express'
import { FunctionRunNotFoundError } from '@/modules/automate/errors/runs'

export default (app: Application) => {
  app.get(
    '/api/v1/projects/:streamId/automations/:automationId/runs/:runId/logs',
    corsMiddlewareFactory(),
    authMiddlewareCreator([
      validateServerRoleBuilderFactory({
        getRoles: getRolesFactory({ db })
      })({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.Streams.Read }),
      validateRequiredStreamFactory({
        getStream: getStreamFactory({ db })
      }),
      validateStreamRoleBuilderFactory({ getRoles: getRolesFactory({ db }) })({
        requiredRole: Roles.Stream.Reviewer
      }),
      validateResourceAccess
    ]),
    async (req, res) => {
      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      const automationId = req.params.automationId
      const runId = req.params.runId

      const getAutomationRunWithToken = getAutomationRunWithTokenFactory({
        db: projectDb
      })
      const run = await getAutomationRunWithToken({
        automationId,
        automationRunId: runId
      })
      if (!run) {
        throw new FunctionRunNotFoundError("Couldn't find automation or its run")
      }
      if (!run.executionEngineRunId) {
        throw new FunctionRunNotFoundError(
          'No associated run found on the execution engine'
        )
      }

      const setPlaintextHeaders = () => {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
      }

      try {
        let firstLine = true
        const logGenerator = getAutomationRunLogs({
          automationId: run.executionEngineAutomationId,
          automationRunId: run.executionEngineRunId,
          automationToken: run.token
        })
        for await (const line of logGenerator) {
          if (firstLine) {
            // Only do this now, so that if log retrieval failed defaultErrorHandler correctly returns JSON response
            setPlaintextHeaders()
            firstLine = false
          }
          res.write(line)
        }
      } catch (e) {
        if (e instanceof ExecutionEngineFailedResponseError) {
          if (e.response.statusMessage === 'LOG_MISSING_OR_NOT_READY') {
            setPlaintextHeaders()
            res.write('')
            res.end()
            return
          }
        }

        throw e
      }

      res.end()
    }
  )
}
