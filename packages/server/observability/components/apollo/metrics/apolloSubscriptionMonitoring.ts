import prometheusClient from 'prom-client'

let apolloSubscriptionMonitoringIsInitialized = false

let metricConnectCounter: prometheusClient.Counter<string>
let metricConnectedClients: prometheusClient.Gauge<string>
let metricSubscriptionTotalOperations: prometheusClient.Counter<'subscriptionType'>
let metricSubscriptionTotalResponses: prometheusClient.Counter<
  'subscriptionType' | 'status'
>

export const initApolloSubscriptionMonitoring = () => {
  if (apolloSubscriptionMonitoringIsInitialized)
    return {
      metricConnectCounter,
      metricConnectedClients,
      metricSubscriptionTotalOperations,
      metricSubscriptionTotalResponses
    }

  // Init metrics
  prometheusClient.register.removeSingleMetric('speckle_server_apollo_connect')
  metricConnectCounter = new prometheusClient.Counter({
    name: 'speckle_server_apollo_connect',
    help: 'Number of connects'
  })
  prometheusClient.register.removeSingleMetric('speckle_server_apollo_clients')
  metricConnectedClients = new prometheusClient.Gauge({
    name: 'speckle_server_apollo_clients',
    help: 'Number of currently connected clients'
  })

  prometheusClient.register.removeSingleMetric(
    'speckle_server_apollo_graphql_total_subscription_operations'
  )
  metricSubscriptionTotalOperations = new prometheusClient.Counter({
    name: 'speckle_server_apollo_graphql_total_subscription_operations',
    help: 'Number of total subscription operations served by this instance',
    labelNames: ['subscriptionType'] as const
  })

  prometheusClient.register.removeSingleMetric(
    'speckle_server_apollo_graphql_total_subscription_responses'
  )
  metricSubscriptionTotalResponses = new prometheusClient.Counter({
    name: 'speckle_server_apollo_graphql_total_subscription_responses',
    help: 'Number of total subscription responses served by this instance',
    labelNames: ['subscriptionType', 'status'] as const
  })

  apolloSubscriptionMonitoringIsInitialized = true

  return {
    metricConnectCounter,
    metricConnectedClients,
    metricSubscriptionTotalOperations,
    metricSubscriptionTotalResponses
  }
}
