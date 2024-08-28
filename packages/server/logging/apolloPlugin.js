/* eslint-disable camelcase */
/* istanbul ignore file */
const prometheusClient = require('prom-client')
const { graphqlLogger } = require('@/logging/logging')
const { redactSensitiveVariables } = require('@/logging/loggingHelper')
const { shouldLogAsInfoLevel } = require('@/logging/graphqlError')

const metricCallCount = new prometheusClient.Counter({
  name: 'speckle_server_apollo_calls',
  help: 'Number of calls',
  labelNames: ['actionName']
})

const getOperationName = (ctx) =>
  ctx.operation?.operationName ||
  ctx.operation?.selectionSet?.selections[0]?.name?.value ||
  'unnamed'

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

        const op = ctx.operation.operation
        const name = getOperationName(ctx)
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
            //TODO add tracing with opentelemetry
          }
        }

        try {
          const actionName = `${ctx.operation.operation} ${ctx.operation.selectionSet.selections[0].name.value}`
          logger = logger.child({ actionName })
          metricCallCount.labels(actionName).inc()
        } catch (e) {
          logger.error({ err: e, transaction }, 'Error while defining action name')
        }

        ctx.request.transaction = transaction
        ctx.context.log = logger
      },
      didEncounterErrors(ctx) {
        let logger = ctx.context.log || graphqlLogger
        logger = logger.child({
          apollo_query_duration_ms: Date.now() - apolloRequestStart
        })

        for (const err of ctx.errors) {
          const operationName = getOperationName(ctx)
          const query = ctx.request.query
          const variables = redactSensitiveVariables(ctx.request.variables)
          logger = logger.child({
            graphql_operation_name: operationName,
            graphql_query: query,
            graphql_variables: variables
          })

          if (err.path) {
            logger = logger.child({
              'query-path': err.path.join(' > ')
            })
          }
          if (shouldLogAsInfoLevel(err)) {
            logger.info(
              { err },
              '{graphql_operation_name} graphql operation failed after {apollo_query_duration_ms} ms'
            )
          } else {
            logger.error(
              { err },
              '{graphql_operation_name} graphql operation failed after {apollo_query_duration_ms} ms'
            )
          }
        }
      },
      willSendResponse(ctx) {
        const logger = ctx.context.log || graphqlLogger
        const name = getOperationName(ctx)

        if (ctx.request.transaction) {
          ctx.request.transaction.finish()
        }

        logger.info(
          {
            graphql_operation_name: name,
            apollo_query_duration_ms: Date.now() - apolloRequestStart
          },
          '{graphql_operation_name} graphql operation will respond after {apollo_query_duration_ms} ms'
        )
      }
    }
  }
}
