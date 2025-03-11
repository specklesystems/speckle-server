import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { expect } from 'chai'

describe('Observability', () => {
  describe('Metrics', () => {
    let serverAddress: string
    before(async () => {
      const ctx = await beforeEachContext()
      ;({ serverAddress } = await initializeTestServer(ctx))
    })

    describe('Register metrics', () => {
      let metricsPageBody = ''
      before(async () => {
        const metricsResponse = await fetch(`${serverAddress}/metrics`, {
          method: 'GET'
        })
        metricsPageBody = await metricsResponse.text()
      })
      const testCases = [
        // Apollo server
        'speckle_server_apollo_calls',
        // express-prom-bundle
        'speckle_server_request_duration',
        // Express (error handling middleware)
        'speckle_server_request_errors',
        // http server
        'speckle_server_active_connections',
        // apollo subscriptions
        'speckle_server_apollo_connect',
        'speckle_server_apollo_clients',
        'speckle_server_apollo_graphql_total_subscription_operations',
        'speckle_server_apollo_graphql_total_subscription_responses',
        // knex
        'speckle_server_knex_free',
        'speckle_server_knex_used',
        'speckle_server_knex_pending',
        'speckle_server_knex_pending_creates',
        'speckle_server_knex_pending_validations',
        'speckle_server_knex_remaining_capacity',
        'speckle_server_knex_query_duration',
        'speckle_server_knex_query_errors',
        'speckle_server_knex_connection_acquisition_duration',
        'speckle_server_knex_connection_acquisition_errors',
        'speckle_server_knex_connection_usage_duration',
        'speckle_server_knex_connection_pool_reaping_duration',
        // high frequency metrics
        'nodejs_heap_size_total_bytes_high_frequency',
        'nodejs_heap_size_used_bytes_high_frequency',
        'nodejs_external_memory_bytes_high_frequency',
        'self_monitor_time_high_frequency',
        'knex_connections_free_high_frequency',
        'knex_connections_used_high_frequency',
        'knex_pending_acquires_high_frequency',
        'knex_pending_creates_high_frequency',
        'knex_pending_validations_high_frequency',
        'knex_remaining_capacity_high_frequency',
        'process_cpu_user_seconds_total_high_frequency',
        'process_cpu_system_seconds_total_high_frequency',
        'process_cpu_seconds_total_high_frequency',
        // previews module
        'speckle_server_preview_jobs_queue_pending',
        'speckle_server_preview_jobs_request_waiting_count',
        'speckle_server_preview_jobs_request_active_count',
        'speckle_server_preview_jobs_request_completed_count',
        'speckle_server_preview_jobs_request_failed_count',
        'speckle_server_preview_jobs_processed_duration_seconds'
      ]

      testCases.forEach((testCase) =>
        it(`should register metric ${testCase}`, async () => {
          const re = new RegExp(String.raw`(^${testCase}.*)\}\s([\d]+)$`, 'gm')
          const match = [...metricsPageBody.matchAll(re)]
          if (!match) {
            expect(match).not.to.be.null
            return '' //HACK force correct type below
          }
        })
      )
    })
  })
})
