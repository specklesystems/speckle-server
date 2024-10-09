import { db } from '@/db/knex'
import { getAutomationRunLogs } from '@/modules/automate/clients/executionEngine'
import { ExecutionEngineFailedResponseError } from '@/modules/automate/errors/executionEngine'
import {
  getAutomationProjectFactory,
  getAutomationRunWithTokenFactory
} from '@/modules/automate/repositories/automations'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { getStreamFactory } from '@/modules/core/repositories/streams'
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

export default (app: Application) => {
  app.get(
    '/api/automate/automations/:automationId/runs/:runId/logs',
    corsMiddleware(),
    authMiddlewareCreator([
      validateServerRoleBuilderFactory({
        getRoles: getRolesFactory({ db })
      })({ requiredRole: Roles.Server.Guest }),
      validateScope({ requiredScope: Scopes.Streams.Read }),
      validateRequiredStreamFactory({
        getStream: getStreamFactory({ db }),
        getAutomationProject: getAutomationProjectFactory({ db })
      }),
      validateStreamRoleBuilderFactory({ getRoles: getRolesFactory({ db }) })({
        requiredRole: Roles.Stream.Owner
      }),
      validateResourceAccess
    ]),
    async (req, res) => {
      const automationId = req.params.automationId
      const runId = req.params.runId

      const getAutomationRunWithToken = getAutomationRunWithTokenFactory({ db })
      const run = await getAutomationRunWithToken({
        automationId,
        automationRunId: runId
      })
      if (!run) {
        throw new Error("Couldn't find automation or its run")
      }
      if (!run.executionEngineRunId) {
        throw new Error('No associated run found on the execution engine')
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
