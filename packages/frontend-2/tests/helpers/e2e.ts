import { setup, useTestContext } from '@nuxt/test-utils'
import path from 'path'

const outputDir = path.resolve(__dirname, '../../.output')

export async function ensureServerRunning() {
  const testCtx = useTestContext()
  const apiOrigin = testCtx.nuxt?.options.runtimeConfig.public.apiOrigin as string
  const { status } = await fetch(apiOrigin).catch(() => ({ status: -1 }))
  if (status !== 200) {
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
