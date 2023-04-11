/* istanbul ignore file */
// const { logger } = require('@/logging/logging')
const { Observability } = require('@speckle/shared')
const Sentry = require('@sentry/node')
const { ApolloError } = require('apollo-server-express')
const { getLogger } = require('nodemailer/lib/shared')
const prometheusClient = require('prom-client')

const metricCallCount = new prometheusClient.Counter({
  name: 'speckle_server_apollo_calls',
  help: 'Number of calls',
  labelNames: ['actionName']
})

/** @type {import('apollo-server-core').PluginDefinition} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  requestDidStart(ctx) {
    return {
      didResolveOperation(ctx) {
        if (!ctx.operation) {
          return
        }

        let logger =
          ctx.log || Observability.extendLoggerComponent(getLogger(), 'graphql')

        const op = `GQL ${ctx.operation.operation} ${ctx.operation.selectionSet.selections[0].name.value}`
        const name = `GQL ${ctx.operation.selectionSet.selections[0].name.value}`
        logger = logger.child({ op, name })

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
        ctx.log = logger
      },
      didEncounterErrors(ctx) {
        if (!ctx.operation) return

        let logger =
          ctx.log || Observability.extendLoggerComponent(getLogger(), 'graphql')

        for (const err of ctx.errors) {
          if (err instanceof ApolloError) {
            continue
          }

          const kind = ctx.operation.operation
          const query = ctx.request.query
          const variables = ctx.request.variables

          logger = logger.child({
            kind,
            query,
            variables
          })
          if (err.path) {
            logger = logger.child({ 'query-path': err.path.join(' > ') })
          }
          logger.error(err, 'graphql error')

          Sentry.withScope((scope) => {
            scope.setTag('kind', kind)
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
        const logger =
          ctx.log || Observability.extendLoggerComponent(getLogger(), 'graphql')
        logger.info('graphql response')

        if (ctx.request.transaction) {
          ctx.request.transaction.finish()
        }
      }
    }
  }
}
