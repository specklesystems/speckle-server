/* eslint-disable camelcase */
import { type Registry, Counter } from 'prom-client'
import { graphqlLogger } from '@/observability/logging'
import { redactSensitiveVariables } from '@/observability/utils/redact'
import { FieldNode, SelectionNode } from 'graphql'
import { ApolloServerPlugin } from '@apollo/server'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { shouldLogAsInfoLevel } from '@/observability/utils/logLevels'
import { getRequestContext } from '@/observability/utils/requestContext'

type ApolloLoggingPluginTransaction = {
  start: number
  op: string
  name: string
  finish: () => void
}

declare module '@apollo/server' {
  interface GraphQLRequest {
    /**
     * Set and used in our apollo logging plugin
     */
    transaction?: ApolloLoggingPluginTransaction
  }
}

const isFieldNode = (node: SelectionNode): node is FieldNode => node.kind === 'Field'

let metricCallCount: Counter<string>

export const loggingPluginFactory: (deps: {
  registers: Registry[]
}) => ApolloServerPlugin<GraphQLContext> = (deps) => ({
  serverWillStart: async () => {
    deps.registers.forEach((r) => r.removeSingleMetric('speckle_server_apollo_calls'))
    metricCallCount = new Counter({
      name: 'speckle_server_apollo_calls',
      help: 'Number of calls',
      registers: deps.registers,
      labelNames: ['actionName']
    })
  },
  requestDidStart: async () => {
    const apolloRequestStart = Date.now()
    return {
      didResolveOperation: async (ctx) => {
        let logger = ctx.contextValue.log || graphqlLogger

        if (!ctx.operation) {
          logger.debug('Attempted to log a GQL operation without an operation')
          return
        }

        const firstSelectedField =
          ctx.operation.selectionSet.selections.find(isFieldNode)
        if (!firstSelectedField) {
          logger.debug(
            'Attempted to log a GQL operation without a top-level field selection'
          )
          return
        }

        const auth = ctx.contextValue
        const userId = auth?.userId

        const operationName = ctx.operationName || ctx.operation?.name?.value
        const actionName =
          operationName || `${ctx.operation.operation} ${firstSelectedField.name.value}`
        const op = `GQL ${actionName}`
        const name = `GQL ${firstSelectedField.name.value}`
        const kind = ctx.operation.operation
        const query = ctx.request.query
        const variables = ctx.request.variables

        logger = logger.child({
          graphql_operation_kind: kind,
          graphql_query: query,
          graphql_variables: redactSensitiveVariables(variables),
          graphql_operation_name: actionName,
          graphql_operation_title: op,
          userId
        })

        const transaction = {
          start: apolloRequestStart,
          op,
          name,
          finish: () => {
            // TODO: add tracing with opentelemetry
          }
        }

        try {
          logger = logger.child({ actionName })
          metricCallCount.labels(actionName).inc()
        } catch (e) {
          logger.error({ err: e, transaction }, 'Error while defining action name')
        }

        ctx.request.transaction = transaction
        ctx.contextValue.log = logger
      },
      didEncounterErrors: async (ctx) => {
        let logger = ctx.contextValue.log || graphqlLogger
        logger = logger.child({
          apollo_query_duration_ms: Date.now() - apolloRequestStart
        })

        const operationName = ctx.request.operationName || null
        const query = ctx.request.query
        const variables = redactSensitiveVariables(ctx.request.variables)

        const reqCtx = getRequestContext()
        if (reqCtx) {
          logger = logger.child({
            dbMetrics: reqCtx.dbMetrics
          })
        }

        const importantError = ctx.errors.find((err) => !shouldLogAsInfoLevel(err))
        const firstError = ctx.errors[0]
        const loggableError = importantError || firstError

        logger = logger.child({
          error_count: loggableError ? ctx.errors.length : undefined,
          first_error: loggableError
            ? {
                message: loggableError.message,
                path: loggableError.path?.join(' > ')
              }
            : {},
          graphql_operation_name: operationName,
          graphql_query: query,
          graphql_variables: variables
        })

        if (!importantError) {
          logger.info(
            { err: firstError },
            '{graphql_operation_title} failed after {apollo_query_duration_ms} ms'
          )
        } else {
          logger.error(
            { err: importantError },
            '{graphql_operation_title} failed after {apollo_query_duration_ms} ms'
          )
        }
      },
      willSendResponse: async (ctx) => {
        let logger = ctx.contextValue.log || graphqlLogger

        if (ctx.request.transaction) {
          ctx.request.transaction.finish()
        }

        const reqCtx = getRequestContext()
        if (reqCtx) {
          logger = logger.child({
            dbMetrics: reqCtx.dbMetrics
          })
        }

        logger.info(
          {
            apollo_query_duration_ms: Date.now() - apolloRequestStart
          },
          '{graphql_operation_title} finished after {apollo_query_duration_ms} ms'
        )
      }
    }
  }
})
