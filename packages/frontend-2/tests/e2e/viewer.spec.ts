import { createPage } from '@nuxt/test-utils'
import { describe, it, expect, beforeAll } from 'vitest'
import {
  setupE2eTest,
  ensureServerRunning,
  ensureE2eTestProject,
  TestProjectMetadata
} from '../helpers/e2e'

// Basic nuxt e2e test with vitest
describe('viewer', async () => {
  await setupE2eTest()

  let testProjectMetadata: TestProjectMetadata

  beforeAll(async () => {
    await ensureServerRunning()
    testProjectMetadata = await ensureE2eTestProject()
  })

  it('renders the viewer', async () => {
    const projectId = testProjectMetadata.streamId
    const modelId = testProjectMetadata.commits[0].branchId

    const page = await createPage(`/projects/${projectId}/models/${modelId}`)
    await page.waitForSelector('.viewer-anchored-points')
    const content = await page.content()

    expect(content).toMatch('helloworld')
  }, 100000)
})
