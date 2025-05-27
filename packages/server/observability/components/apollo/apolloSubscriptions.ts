/* eslint-disable camelcase */
import type { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import type { ExecutionParams } from 'subscriptions-transport-ws'
import { logWithErr } from '@/observability/utils/logLevels'
import { BaseError } from '@/modules/shared/errors'
import { GraphQLError } from 'graphql'
import { redactSensitiveVariables } from '@/observability/utils/redact'
import type { Counter } from 'prom-client'
import {
  getRequestContext,
  isRequestContext
} from '@/observability/utils/requestContext'
import { subscriptionLogger } from '@/observability/logging'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubscriptionResponse = { errors?: GraphQLError[]; data?: any }

export const onOperationHandlerFactory = (deps: {
  metricSubscriptionTotalOperations: Counter<'subscriptionType' | 'status'>
  metricSubscriptionTotalResponses: Counter<'subscriptionType' | 'status'>
}) => {
  const { metricSubscriptionTotalOperations, metricSubscriptionTotalResponses } = deps
  return (...params: [() => void, ExecutionParams]) => {
    // kinda hacky, but we're using this as an "subscription event emitted"
    // callback to clear subscription connection dataloaders to avoid stale cache
    const baseParams = params[1]

    metricSubscriptionTotalOperations.inc({
      subscriptionType: baseParams.operationName // FIXME: operationName can be empty
    })
    const ctx = baseParams.context as GraphQLContext

    const reqCtx = getRequestContext()
    if (reqCtx) {
      // Reset db metrics for each event
      reqCtx.dbMetrics.totalCount = 0
      reqCtx.dbMetrics.totalDuration = 0
    }

    const logger = ctx.log || subscriptionLogger
    logger.debug(
      {
        graphql_operation_name: baseParams.operationName,
        userId: baseParams.context.userId,
        graphql_query: baseParams.query.toString(),
        graphql_variables: redactSensitiveVariables(baseParams.variables),
        graphql_operation_type: 'subscription',
        ...(isRequestContext(reqCtx) ? { req: { id: reqCtx.requestId } } : {})
      },
      'Subscription event fired for {graphql_operation_name}'
    )

    baseParams.formatResponse = (val: SubscriptionResponse) => {
      ctx.clearCache()
      logSubscriptionOperation({ ctx, execParams: baseParams, response: val })
      metricSubscriptionTotalResponses.inc({
        subscriptionType: baseParams.operationName,
        status: 'success'
      })
      return val
    }
    baseParams.formatError = (e: Error) => {
      ctx.clearCache()
      logSubscriptionOperation({ ctx, execParams: baseParams, error: e })

      metricSubscriptionTotalResponses.inc({
        subscriptionType: baseParams.operationName,
        status: 'error'
      })
      return e
    }

    return baseParams
  }
}

export function logSubscriptionOperation(params: {
  ctx: GraphQLContext
  execParams: ExecutionParams
  error?: Error
  response?: SubscriptionResponse
}) {
  const { error, response, ctx, execParams } = params
  const userId = ctx.userId
  if (!error && !response) return

  const reqCtx = getRequestContext()

  const logger = ctx.log.child({
    graphql_query: execParams.query.toString(),
    graphql_variables: redactSensitiveVariables(execParams.variables),
    graphql_operation_name: execParams.operationName,
    graphql_operation_type: 'subscription',
    userId,
    ...(isRequestContext(reqCtx)
      ? {
          req: { id: reqCtx.requestId },
          dbMetrics: reqCtx.dbMetrics
        }
      : {})
  })

  const errMsg = 'GQL subscription event {graphql_operation_name} errored'
  const errors = response?.errors || (error ? [error] : [])
  if (errors.length) {
    for (const error of errors) {
      let errorLogger = logger
      if (error instanceof BaseError) {
        errorLogger = errorLogger.child({ ...error.info() })
      }
      logWithErr(errorLogger, error, errMsg)
    }
  } else if (response?.data) {
    logger.info('GQL subscription event {graphql_operation_name} emitted')
  }
}
