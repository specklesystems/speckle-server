import { Counter, Gauge, Registry } from 'prom-client'

let apolloSubscriptionMonitoringIsInitialized = false

let metricConnectCounter: Counter<string>
let metricConnectedClients: Gauge<string>
let metricSubscriptionTotalOperations: Counter<'subscriptionType'>
let metricSubscriptionTotalResponses: Counter<'subscriptionType' | 'status'>

export const initApolloSubscriptionMonitoring = (params: { registers: Registry[] }) => {
  const { registers } = params
  if (apolloSubscriptionMonitoringIsInitialized)
    return {
      metricConnectCounter,
      metricConnectedClients,
      metricSubscriptionTotalOperations,
      metricSubscriptionTotalResponses
    }

  // Init metrics
  registers.forEach((r) => r.removeSingleMetric('speckle_server_apollo_connect'))
  metricConnectCounter = new Counter({
    name: 'speckle_server_apollo_connect',
    help: 'Number of connects',
    registers
  })
  registers.forEach((r) => r.removeSingleMetric('speckle_server_apollo_clients'))
  metricConnectedClients = new Gauge({
    name: 'speckle_server_apollo_clients',
    help: 'Number of currently connected clients',
    registers
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_apollo_graphql_total_subscription_operations')
  )
  metricSubscriptionTotalOperations = new Counter({
    name: 'speckle_server_apollo_graphql_total_subscription_operations',
    help: 'Number of total subscription operations served by this instance',
    labelNames: ['subscriptionType'] as const,
    registers
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_apollo_graphql_total_subscription_responses')
  )
  metricSubscriptionTotalResponses = new Counter({
    name: 'speckle_server_apollo_graphql_total_subscription_responses',
    help: 'Number of total subscription responses served by this instance',
    labelNames: ['subscriptionType', 'status'] as const,
    registers
  })

  apolloSubscriptionMonitoringIsInitialized = true

  return {
    metricConnectCounter,
    metricConnectedClients,
    metricSubscriptionTotalOperations,
    metricSubscriptionTotalResponses
  }
}
