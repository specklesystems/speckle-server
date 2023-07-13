import { setup, useTestContext } from '@nuxt/test-utils'
import path from 'path'

const outputDir = path.resolve(__dirname, '../../.output')

export async function ensureE2eTestProject() {
  const testCtx = useTestContext()
  const apiOrigin = testCtx.nuxt?.options.runtimeConfig.public.apiOrigin as string
  const { status } = await fetch(new URL('/e2e/seed', apiOrigin), {
    method: 'POST'
  }).catch(() => ({
    status: -1
  }))
  if (status !== 200) {
    throw new Error(`Test project creation failed!`)
  }
}

export async function ensureServerRunning() {
  const testCtx = useTestContext()
  const apiOrigin = testCtx.nuxt?.options.runtimeConfig.public.apiOrigin as string
  const res = await fetch(new URL('/graphql?query=query { _ }', apiOrigin), {
    headers: { 'content-type': 'application/json' }
  }).catch(() => ({
    status: -1
  }))

  if (res.status !== 200) {
    throw new Error(
      `Server not running at ${apiOrigin}! Server is required for E2E tests!`
    )
  }
}

export async function setupE2eTest() {
  const skipBuild = !!process.env.TEST_SKIP_BUILD
  const useBrowser = !!process.env.TEST_WITH_BROWSER

  await setup({
    ...(skipBuild
      ? {
          buildDir: outputDir,
          build: false,
          nuxtConfig: {
            buildDir: outputDir,
            nitro: {
              output: {
                dir: outputDir
              }
            }
          }
        }
      : { dev: true }),
    ...(useBrowser ? { browser: true, browserOptions: { type: 'chromium' } } : {})
  })
}
