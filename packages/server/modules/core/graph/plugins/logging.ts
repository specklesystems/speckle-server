/* eslint-disable camelcase */
import prometheusClient from 'prom-client'
import { graphqlLogger } from '@/logging/logging'
import { redactSensitiveVariables } from '@/logging/loggingHelper'
import { FieldNode, SelectionNode } from 'graphql'
import { ApolloServerPlugin } from '@apollo/server'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { shouldLogAsInfoLevel } from '@/logging/graphqlError'

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

const metricCallCount = new prometheusClient.Counter({
  name: 'speckle_server_apollo_calls',
  help: 'Number of calls',
  labelNames: ['actionName']
})

export const loggingPlugin: ApolloServerPlugin<GraphQLContext> = {
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

        const actionName = `${ctx.operation.operation} ${firstSelectedField.name.value}`
        const op = `GQL ${actionName}`
        const name = `GQL ${firstSelectedField.name.value}`
        const kind = ctx.operation.operation
        const query = ctx.request.query
        const variables = ctx.request.variables

        logger = logger.child({
          graphql_operation_kind: kind,
          graphql_query: query,
          graphql_variables: redactSensitiveVariables(variables),
          graphql_operation_value: op,
          graphql_operation_name: name,
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

        ctx.request.http
        ctx.request.transaction = transaction
        ctx.contextValue.log = logger
      },
      didEncounterErrors: async (ctx) => {
        let logger = ctx.contextValue.log || graphqlLogger
        logger = logger.child({
          apollo_query_duration_ms: Date.now() - apolloRequestStart
        })

        for (const err of ctx.errors) {
          const operationName = ctx.request.operationName || null
          const query = ctx.request.query
          const variables = redactSensitiveVariables(ctx.request.variables)

          if (err.path) {
            logger = logger.child({
              'query-path': err.path.join(' > '),
              graphql_operation_name: operationName,
              graphql_query: query,
              graphql_variables: variables
            })
          }
          if (shouldLogAsInfoLevel(err)) {
            logger.info(
              { err },
              '{graphql_operation_value} failed after {apollo_query_duration_ms} ms'
            )
          } else {
            logger.error(
              err,
              '{graphql_operation_value} failed after {apollo_query_duration_ms} ms'
            )
          }
        }
      },
      willSendResponse: async (ctx) => {
        const logger = ctx.contextValue.log || graphqlLogger

        if (ctx.request.transaction) {
          ctx.request.transaction.finish()
        }

        logger.info(
          {
            apollo_query_duration_ms: Date.now() - apolloRequestStart
          },
          '{graphql_operation_value} finished after {apollo_query_duration_ms} ms'
        )
      }
    }
  }
}
