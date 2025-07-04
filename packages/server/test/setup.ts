/* eslint-disable no-restricted-imports */
import '../bootstrap.js'

// Register global mocks as early as possible
import '@/test/mocks/global'

import chaiAsPromised from 'chai-as-promised'
import chaiHttp from 'chai-http'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
import graphqlChaiPlugin from '@/test/plugins/graphql'
import * as vitest from 'vitest'
import { ensureMocksInitialized } from '@/test/mockHelper.js'
import { buildApp, shutdownAll } from '@/test/hooks.js'
import { testLogger as logger } from '@/observability/logging'
import originalChai from 'chai'
import { chai } from 'vitest'

logger.info('Running individual test context setup')

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.before = vitest.beforeAll
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
globalThis.after = vitest.afterAll

// TODO: Not sure why, but there's 2 different runtimes of chai
const setupChai = (c: typeof originalChai) => {
  // Register chai plugins
  c.use(chaiAsPromised)
  c.use(chaiHttp)
  c.use(deepEqualInAnyOrder)
  c.use(graphqlChaiPlugin)
}
setupChai(chai)
setupChai(originalChai)

/**
 * Stuff to run before/after each individual test file (each runs in their own worker thread/context)
 */
vitest.beforeAll(async () => {
  // Ensure all mocks are initialized
  await ensureMocksInitialized()

  // TODO: Optimization? We shouldnt be doing this twice. Add logger.info for proper tracing of whats going on w/ component=test
  // Ensure app is initialized
  await buildApp()
})

vitest.afterAll(async () => {
  await shutdownAll()
})
