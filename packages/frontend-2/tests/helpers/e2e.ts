import { setup, useTestContext } from '@nuxt/test-utils'
import path from 'path'

const outputDir = path.resolve(__dirname, '../../.output')

export type TestProjectMetadata = {
  streamId: string
  commits: { commitId: string; branchId: string }[]
}

export async function ensureE2eTestProject() {
  const testCtx = useTestContext()
  const apiOrigin = testCtx.nuxt?.options.runtimeConfig.public.apiOrigin as string
  const res = await fetch(new URL('/api/e2e/seed', apiOrigin), {
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  }).catch(() => ({
    status: -1
  }))

  if (res.status !== 200 || !('body' in res)) {
    if ('body' in res) {
      const body = (await res.text()) as string
      throw new Error(`Test project creation failed: ${body}`)
    }

    throw new Error(`Test project creation failed!`)
  }

  const body = (await res.json()) as TestProjectMetadata
  return body
}

export async function ensureServerRunning() {
  const testCtx = useTestContext()
  const apiOrigin = testCtx.nuxt?.options.runtimeConfig.public.apiOrigin as string
  const res = await fetch(new URL('/graphql?query=query{_}', apiOrigin), {
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
  const isCI = !!process.env.CI
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
      : isCI
      ? { build: true }
      : { dev: true }),
    ...(useBrowser
      ? {
          browser: true,
          browserOptions: { type: 'chromium', launch: { headless: false } }
        }
      : {
          browserOptions: { type: 'chromium', launch: { args: ['--use-gl=egl'] } }
        })
  })
}

export const buildTestProjectHelpers = (metadata: TestProjectMetadata) => ({
  get modelPagePath() {
    return `/projects/${metadata.streamId}/models/${metadata.commits[0].branchId}`
  }
})

export type TestProjectHelpers = ReturnType<typeof buildTestProjectHelpers>
