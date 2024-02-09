/* eslint-disable no-unreachable */
/* eslint-disable camelcase */
/* istanbul ignore file */
const Sentry = require('@sentry/node')
const { ApolloError } = require('apollo-server-express')
const prometheusClient = require('prom-client')
const { graphqlLogger } = require('@/logging/logging')
const { redactSensitiveVariables } = require('@/logging/loggingHelper')
const { GraphQLError } = require('graphql')

const metricCallCount = new prometheusClient.Counter({
  name: 'speckle_server_apollo_calls',
  help: 'Number of calls',
  labelNames: ['actionName']
})

/** @type {import('apollo-server-core').PluginDefinition} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  requestDidStart(ctx) {
    const apolloRequestStart = Date.now()
    return {
      didResolveOperation(ctx) {
        let logger = ctx.context.log || graphqlLogger
        const auth = ctx.context
        const userId = auth?.userId

        const op = `GQL ${ctx.operation.operation} ${ctx.operation.selectionSet.selections[0].name.value}`
        const name = `GQL ${ctx.operation.selectionSet.selections[0].name.value}`
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

        const transaction = Sentry.startTransaction({
          op,
          name
        })

        try {
          const actionName = `${ctx.operation.operation} ${ctx.operation.selectionSet.selections[0].name.value}`
          logger = logger.child({ actionName })
          metricCallCount.labels(actionName).inc()
          // logger.debug(actionName)
        } catch (e) {
          Sentry.captureException(e)
        }

        Sentry.configureScope((scope) => scope.setSpan(transaction))
        ctx.request.transaction = transaction
        ctx.context.log = logger
      },
      didEncounterErrors(ctx) {
        let logger = ctx.context.log || graphqlLogger
        logger = logger.child({
          apollo_query_duration_ms: Date.now() - apolloRequestStart
        })

        for (const err of ctx.errors) {
          const operationName = ctx.request.operationName || null
          const query = ctx.request.query
          const variables = ctx.request.variables

          if (err.path) {
            logger = logger.child({ 'query-path': err.path.join(' > ') })
          }
          if (
            (err instanceof GraphQLError && err.extensions?.code === 'FORBIDDEN') ||
            err instanceof ApolloError
          ) {
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

          Sentry.withScope((scope) => {
            scope.setTag('operationName', operationName)
            scope.setExtra('query', query)
            scope.setExtra('variables', variables)
            if (err.path) {
              // We can also add the path as breadcrumb
              scope.addBreadcrumb({
                category: 'query-path',
                message: err.path.join(' > '),
                level: Sentry.Severity.Debug
              })
            }
            Sentry.captureException(err)
          })
        }
      },
      willSendResponse(ctx) {
        const logger = ctx.context.log || graphqlLogger

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
