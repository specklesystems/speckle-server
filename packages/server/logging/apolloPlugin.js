/* istanbul ignore file */
// const { Logger } = require('@/logging/logging')
const Sentry = require('@sentry/node')
const { ApolloError } = require('apollo-server-express')
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

        const transaction = Sentry.startTransaction({
          op: `GQL ${ctx.operation.operation} ${ctx.operation.selectionSet.selections[0].name.value}`,
          name: `GQL ${ctx.operation.selectionSet.selections[0].name.value}`
        })

        try {
          const actionName = `${ctx.operation.operation} ${ctx.operation.selectionSet.selections[0].name.value}`
          metricCallCount.labels(actionName).inc()
          // Logger.debug(actionName)
        } catch (e) {
          Sentry.captureException(e)
        }

        Sentry.configureScope((scope) => scope.setSpan(transaction))
        ctx.request.transaction = transaction
      },
      didEncounterErrors(ctx) {
        if (!ctx.operation) return

        for (const err of ctx.errors) {
          if (err instanceof ApolloError) {
            continue
          }
          Sentry.withScope((scope) => {
            scope.setTag('kind', ctx.operation.operation)
            scope.setExtra('query', ctx.request.query)
            scope.setExtra('variables', ctx.request.variables)
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
        if (ctx.request.transaction) {
          ctx.request.transaction.finish()
        }
      }
    }
  }
}
